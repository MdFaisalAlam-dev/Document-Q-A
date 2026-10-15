import { generateEmbeddings } from "./gemini.service.js";

import type { DocumentChunk } from "../types/chunk.types.js";

const EMBEDDING_MODEL = "gemini-embedding-2";

export interface EmbeddedChunk {
  chunk: DocumentChunk;
  vector: number[];
}

export async function embedChunks(
  chunks: DocumentChunk[],
): Promise<EmbeddedChunk[]> {
  if (chunks.length === 0) {
    return [];
  }

  const texts = chunks.map((chunk) => chunk.content);

  const vectors = await generateEmbeddings(texts);

  return chunks.map((chunk, index) => {
    const vector = vectors[index]!;

    return {
      chunk,
      vector,
    };
  });
}