import { QdrantClient } from "@qdrant/js-client-rest";
import { env } from "../config/env.js";

export const qdrant = new QdrantClient({
  url: env.QDRANT_URL,
  apiKey: env.QDRANT_API_KEY,
});

export const COLLECTION_NAME = "document_qna_chunks";

const VECTOR_SIZE = 768;

export async function ensureCollection() {
  const collections = await qdrant.getCollections();

  const exists = collections.collections.some(
    (collection) => collection.name === COLLECTION_NAME,
  );

  if (!exists) {
    await qdrant.createCollection(COLLECTION_NAME, {
      vectors: {
        size: VECTOR_SIZE,
        distance: "Cosine",
      },
    });
  }

  try {
    await qdrant.createPayloadIndex(COLLECTION_NAME, {
      field_name: "documentId",
      field_schema: "keyword",
      wait: true,
    });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : String(error);

    if (!/already exists|already indexed/i.test(message)) {
      throw error;
    }
  }
}