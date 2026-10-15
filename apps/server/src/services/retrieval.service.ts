import {
  COLLECTION_NAME,
  ensureCollection,
  qdrant,
} from "./qdrant.service.js";
import { generateEmbedding } from "./gemini.service.js";

import type { RetrievedChunk } from "../types/retrieval.types.js";

type RetrievalOptions = {
  limit?: number;
  documentId?: string;
};

export async function retrieveRelevantChunks(
  question: string,
  options: RetrievalOptions = {},
): Promise<RetrievedChunk[]> {
  const normalizedQuestion = question.trim();

  if (!normalizedQuestion) {
    throw new Error("Question cannot be empty.");
  }

  const limit = Math.min(
    Math.max(options.limit ?? 5, 1),
    10,
  );

  const questionVector =
    await generateEmbedding(normalizedQuestion);

  await ensureCollection();

  const queryOptions: Parameters<
    typeof qdrant.query
  >[1] = {
    query: questionVector,
    limit,
    with_payload: true,
  };

  if (options.documentId) {
    queryOptions.filter = {
      must: [
        {
          key: "documentId",
          match: {
            value: options.documentId,
          },
        },
      ],
    };
  }

  const result = await qdrant.query(
    COLLECTION_NAME,
    queryOptions,
  );

  return result.points.map((point) => {
    const payload =
      (point.payload ?? {}) as Record<string, unknown>;

    return {
      chunkId: String(point.id),

      score: Number(point.score),

      content: String(payload.content ?? ""),

      documentId: String(
        payload.documentId ?? "",
      ),

      documentName: String(
        payload.documentName ?? "",
      ),

      chunkIndex: Number(
        payload.chunkIndex ?? 0,
      ),

      metadata: {
        fileType: String(
          payload.fileType ?? "",
        ),

        pageNumber:
          payload.pageNumber === null ||
          payload.pageNumber === undefined
            ? null
            : Number(payload.pageNumber),

        sheetName:
          payload.sheetName === null ||
          payload.sheetName === undefined
            ? null
            : String(payload.sheetName),

        source: String(
          payload.source ?? "",
        ),
      },
    };
  });
}