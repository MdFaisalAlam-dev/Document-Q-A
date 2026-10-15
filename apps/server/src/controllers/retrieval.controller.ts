import type { Request, Response } from "express";

import { retrieveRelevantChunks } from "../services/retrieval.service.js";

export async function retrieveChunksController(
  req: Request,
  res: Response,
) {
  const body = (req.body ?? {}) as {
    question?: unknown;
    limit?: unknown;
    documentId?: unknown;
  };

  const question =
    typeof body.question === "string"
      ? body.question.trim()
      : "";

  const documentId =
    typeof body.documentId === "string"
      ? body.documentId.trim()
      : undefined;

  const parsedLimit =
    typeof body.limit === "number"
      ? body.limit
      : typeof body.limit === "string" && body.limit.trim() !== ""
      ? Number(body.limit)
      : undefined;

  if (!question) {
    return res.status(400).json({
      success: false,
      error: {
        code: "QUESTION_REQUIRED",
        message: "A question is required.",
      },
    });
  }

  try {
    const results = await retrieveRelevantChunks(
      question,
      {
        limit: parsedLimit,
        documentId,
      },
    );

    return res.status(200).json({
      success: true,

      query: {
        question,
        limit: Math.min(
          Math.max(parsedLimit ?? 5, 1),
          10,
        ),
        documentId: documentId ?? null,
      },

      results,
    });
  } catch (error) {
    console.error("retrieveChunksController error:", error);

    const message =
      error instanceof Error ? error.message : "Unknown error";

    return res.status(500).json({
      success: false,
      error: {
        code: "RETRIEVAL_ERROR",
        message,
      },
    });
  }
}