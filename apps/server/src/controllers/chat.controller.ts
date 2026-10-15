import type {
  Request,
  Response,
} from "express";

import { z } from "zod";

import { ragGraph } from "../rag/rag.graph.js";

const chatQuerySchema = z.object({
  question: z
    .string()
    .trim()
    .min(
      1,
      "Question cannot be empty.",
    )
    .max(
      4000,
      "Question is too long.",
    ),

  documentId: z
    .string()
    .trim()
    .min(1)
    .optional(),

  limit: z
    .coerce
    .number()
    .int()
    .min(1)
    .max(10)
    .default(5),
});

export async function queryDocumentsController(
  req: Request,
  res: Response,
) {
  const parsed =
    chatQuerySchema.safeParse(req.body);

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

  const {
    question,
    documentId,
    limit,
  } = parsed.data;

  const result = await ragGraph.invoke({
    question,

    documentId:
      documentId ?? null,

    limit,
  });

  return res.status(200).json({
    success: true,

    answer: result.answer,

    retrievalStatus:
      result.retrievalStatus,

    sources: result.sources,

    retrieval: {
      count:
        result.retrievedChunks.length,

      topScore:
        result.retrievedChunks[0]?.score ??
        0,
    },
  });
}