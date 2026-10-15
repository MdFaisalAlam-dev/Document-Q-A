import type { UploadedDocument } from "../types/document.types.js";

import type { DocumentContent } from "../types/document-content.types.js";

import type { DocumentChunk } from "../types/chunk.types.js";

import { parseDocument } from "./document-parser.service.js";

import { chunkDocument } from "./chunking.service.js";

import { embedChunks } from "./embedding.service.js";

import {
  ensureCollection,
} from "./qdrant.service.js";

import {
  upsertEmbeddedChunks,
} from "./vector-store.service.js";

export interface ProcessedDocument {
  document: UploadedDocument;

  content: DocumentContent;

  chunks: DocumentChunk[];

  embeddedChunkCount: number;
}

export type ProcessingProgressCallback = (
  update: {
    stage:
      | "received"
      | "extracting"
      | "chunking"
      | "embedding"
      | "indexing";

    progress: number;

    message: string;
  },
) => void | Promise<void>;

export async function processDocument(
  document: UploadedDocument,
  onProgress?: ProcessingProgressCallback,
): Promise<ProcessedDocument> {
  await onProgress?.({
    stage: "received",
    progress: 5,
    message:
      "Document received by ingestion engine.",
  });

  await onProgress?.({
    stage: "extracting",
    progress: 20,
    message:
      "Extracting document content.",
  });

  const content =
    await parseDocument({
      documentId:
        document.documentId,

      filePath:
        document.storedPath,

      fileName:
        document.originalName,

      mimeType:
        document.mimeType,
    });

  await onProgress?.({
    stage: "chunking",
    progress: 40,
    message:
      "Splitting document into retrieval chunks.",
  });

  const chunks =
    await chunkDocument(content);

  if (chunks.length === 0) {
    throw new Error(
      "No usable text could be extracted from the document.",
    );
  }

  await onProgress?.({
    stage: "embedding",
    progress: 65,
    message:
      "Generating vector embeddings.",
  });

  const embeddedChunks =
    await embedChunks(chunks);

  await onProgress?.({
    stage: "indexing",
    progress: 85,
    message:
      "Writing vectors to Qdrant.",
  });

  await ensureCollection();

  await upsertEmbeddedChunks(
    embeddedChunks,
  );

  return {
    document,

    content,

    chunks,

    embeddedChunkCount:
      embeddedChunks.length,
  };
}