import { Router } from "express";

import { testGeminiConnection } from "../services/gemini.service.js";
import { qdrant } from "../services/qdrant.service.js";

const router = Router();

router.get("/status", async (_req, res) => {
  try {
    const [geminiResult, qdrantResult] = await Promise.all([
      testGeminiConnection(),
      qdrant.getCollections(),
    ]);

    res.status(200).json({
      success: true,
      services: {
        gemini: {
          status: "connected",
          response: geminiResult,
        },

        qdrant: {
          status: "connected",
          collections: qdrantResult.collections.length,
        },
      },

      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("AI infrastructure check failed:", error);

    res.status(503).json({
      success: false,
      message:
        "One or more AI infrastructure services are unavailable.",
    });
  }
});

router.get("/vector-stats", async (_req, res) => {
  try {
    const collection = "document_qna_chunks";

    const result = await qdrant.getCollection(
      collection,
    );

    const pointsCount = result.points_count ?? 0;
    const vectorsCount = pointsCount;
    const indexedVectorsCount =
      result.indexed_vectors_count ?? pointsCount;

    return res.status(200).json({
      success: true,

      collection,

      pointsCount,

      vectorsCount,

      indexedVectorsCount,
    });
  } catch (error) {
    console.error(
      "Vector stats check failed:",
      error,
    );

    return res.status(503).json({
      success: false,

      message:
        "Vector collection is unavailable.",
    });
  }
});

export default router;