import type { Request, Response } from "express";
import { z } from "zod";

import { ragGraph } from "../rag/rag.graph.js";
import type { RetrievedChunk } from "../types/retrieval.types.js";
import type { RagSource } from "../rag/rag.graph.js";

const streamQuerySchema = z.object({
  question: z.string().trim().min(1).max(4000),
  documentId: z.string().trim().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(10).default(5),
});

type StreamEvent =
  | {
      type: "status";
      stage:
        | "retrieving"
        | "context_found"
        | "insufficient_context"
        | "generating";
      message: string;
    }
  | {
      type: "sources";
      sources: RagSource[];
      retrieval: { count: number; topScore: number };
      retrievalStatus: "sufficient" | "insufficient";
    }
  | { type: "token"; token: string }
  | {
      type: "complete";
      answer: string;
      sources: RagSource[];
      retrieval: { count: number; topScore: number };
      retrievalStatus: "sufficient" | "insufficient";
    }
  | { type: "error"; message: string };

type StreamEventRecord = {
  event?: string;
  name?: string;
  metadata?: Record<string, unknown>;
  data?: Record<string, unknown>;
};

function asRecord(value: unknown): Record<string, unknown> {
  if (typeof value === "object" && value !== null) {
    return value as Record<string, unknown>;
  }

  return {};
}

function contentToString(value: unknown): string {
  if (typeof value === "string") {
    return value;
  }

  if (Array.isArray(value)) {
    return value
      .map((part) => {
        if (typeof part === "string") {
          return part;
        }

        const record = asRecord(part);

        return typeof record.text === "string"
          ? record.text
          : "";
      })
      .join("");
  }

  return "";
}

function makeSources(chunks: RetrievedChunk[]): RagSource[] {
  return chunks.map((chunk) => ({
    chunkId: chunk.chunkId,
    documentId: chunk.documentId,
    documentName: chunk.documentName,
    source: chunk.metadata.source,
    score: chunk.score,
    chunkIndex: chunk.chunkIndex,
    pageNumber: chunk.metadata.pageNumber,
    sheetName: chunk.metadata.sheetName,
  }));
}

export async function streamChatController(
  req: Request,
  res: Response,
) {
  const parsed = streamQuerySchema.safeParse(req.body);

  if (!parsed.success) {
    return res.status(400).json({
      success: false,
      error: {
        code: "INVALID_CHAT_REQUEST",
        message:
          parsed.error.issues[0]?.message ??
          "Invalid chat request.",
      },
    });
  }

  const { question, documentId, limit } = parsed.data;

  // SSE response headers.
  res.status(200);
  res.setHeader("Content-Type", "text/event-stream; charset=utf-8");
  res.setHeader("Cache-Control", "no-cache, no-transform");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("X-Accel-Buffering", "no");
  res.flushHeaders();

  let disconnected = false;

  res.on("close", () => {
    if (!res.writableEnded) {
      disconnected = true;
    }
  });

  const send = (event: StreamEvent) => {
    if (disconnected || res.writableEnded) {
      return;
    }

    res.write(
      `event: ${event.type}\n` +
        `data: ${JSON.stringify(event)}\n\n`,
    );
  };

  let retrievedChunks: RetrievedChunk[] = [];
  let sources: RagSource[] = [];
  let retrievalStatus: "sufficient" | "insufficient" =
    "insufficient";
  let finalAnswer = "";
  let streamedAnswer = "";

  let retrieval = {
    count: 0,
    topScore: 0,
  };

  try {
    send({
      type: "status",
      stage: "retrieving",
      message: "Searching indexed document chunks...",
    });

    const stream = await ragGraph.streamEvents(
      {
        question,
        documentId: documentId ?? null,
        limit,
      },
      { version: "v2" },
    );

    for await (const rawEvent of stream) {
      if (disconnected) {
        break;
      }

      const event = rawEvent as unknown as StreamEventRecord;
      const data = asRecord(event.data);

      const metadataNode =
        event.metadata?.langgraph_node;

      const nodeName =
        typeof metadataNode === "string"
          ? metadataNode
          : event.name ?? "";

      // The retrieval node has finished.
      if (
        event.event === "on_chain_end" &&
        nodeName === "retrieve"
      ) {
        const output = asRecord(data.output);

        retrievedChunks = Array.isArray(output.retrievedChunks)
          ? (output.retrievedChunks as RetrievedChunk[])
          : [];

        retrievalStatus =
          output.retrievalStatus === "sufficient"
            ? "sufficient"
            : "insufficient";

        sources = makeSources(retrievedChunks);

        retrieval = {
          count: retrievedChunks.length,
          topScore: retrievedChunks[0]?.score ?? 0,
        };

        send({
          type: "status",
          stage:
            retrievalStatus === "sufficient"
              ? "context_found"
              : "insufficient_context",
          message:
            retrievalStatus === "sufficient"
              ? `Found ${retrievedChunks.length} relevant chunk(s).`
              : "No sufficiently relevant document context was found.",
        });

        send({
          type: "sources",
          sources,
          retrieval,
          retrievalStatus,
        });
      }

      if (
        event.event === "on_chain_start" &&
        nodeName === "generateAnswer"
      ) {
        send({
          type: "status",
          stage: "generating",
          message: "Generating a grounded answer...",
        });
      }

      // LLM tokens from the generation node.
      if (
        event.event === "on_chat_model_stream" &&
        (nodeName === "generateAnswer" ||
          typeof metadataNode === "string")
      ) {
        const chunk = asRecord(data.chunk);
        const token = contentToString(chunk.content);

        if (token) {
          streamedAnswer += token;
          send({ type: "token", token });
        }
      }

      // Store the final answer returned by the generation node.
      if (
        event.event === "on_chain_end" &&
        nodeName === "generateAnswer"
      ) {
        const output = asRecord(data.output);

        if (typeof output.answer === "string") {
          finalAnswer = output.answer;
        }
      }

      // Handle the insufficient-context branch.
      if (
        event.event === "on_chain_end" &&
        nodeName === "insufficientContext"
      ) {
        const output = asRecord(data.output);

        if (typeof output.answer === "string") {
          finalAnswer = output.answer;

          if (!streamedAnswer) {
            send({
              type: "token",
              token: finalAnswer,
            });
          }
        }
      }

      // Fallback in case source metadata is emitted by this node.
      if (
        event.event === "on_chain_end" &&
        nodeName === "buildSources"
      ) {
        const output = asRecord(data.output);

        if (Array.isArray(output.sources)) {
          sources = output.sources as RagSource[];
        }
      }
    }

    if (disconnected) {
      return;
    }

    const answer =
      finalAnswer ||
      streamedAnswer ||
      "The workflow finished without producing an answer.";

    send({
      type: "complete",
      answer,
      sources,
      retrieval,
      retrievalStatus,
    });

    res.end();
  } catch (error) {
    console.error("Streaming RAG request failed:", error);

    if (!disconnected && !res.writableEnded) {
      send({
        type: "error",
        message:
          "The RAG request failed. Check the backend terminal for details.",
      });

      res.end();
    }
  }
}