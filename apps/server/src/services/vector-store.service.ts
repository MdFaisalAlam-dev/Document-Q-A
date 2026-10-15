import crypto from "node:crypto";

import { qdrant, COLLECTION_NAME } from "./qdrant.service.js";

import type { EmbeddedChunk } from "./embedding.service.js";

export async function upsertEmbeddedChunks(
  embeddedChunks: EmbeddedChunk[],
) {
  if (embeddedChunks.length === 0) {
    return;
  }

  const points = embeddedChunks.map(
    ({ chunk, vector }) => {
      const qdrantPointId = chunk.chunkId.replace(
        /^chunk_/,
        "",
      );

      const id =
        /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
          qdrantPointId,
        )
          ? qdrantPointId
          : crypto.randomUUID();

      return {
        id,

        vector,

        payload: {
          documentId: chunk.documentId,

          documentName: chunk.documentName,

          content: chunk.content,

          chunkIndex: chunk.chunkIndex,

          fileType: chunk.metadata.fileType,

          mimeType: chunk.metadata.mimeType,

          sizeBytes: chunk.metadata.sizeBytes,

          createdAt: chunk.metadata.createdAt,

          pageNumber:
            chunk.metadata.pageNumber ?? null,

          sheetName:
            chunk.metadata.sheetName ?? null,

          source: chunk.metadata.source,
        },
      };
    },
  );

  await qdrant.upsert(COLLECTION_NAME, {
    wait: true,
    points,
  });
}