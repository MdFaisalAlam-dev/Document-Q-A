import crypto from "node:crypto";

import {
  RecursiveCharacterTextSplitter,
} from "@langchain/textsplitters";

import type {
  DocumentContent,
} from "../types/document-content.types.js";

import type {
  DocumentChunk,
} from "../types/chunk.types.js";

const splitter =
  new RecursiveCharacterTextSplitter({
    chunkSize: 1000,

    chunkOverlap: 150,

    separators: [
      "\n\n",
      "\n",
      ". ",
      "? ",
      "! ",
      " ",
      "",
    ],
  });

export async function chunkDocument(
  document: DocumentContent,
): Promise<DocumentChunk[]> {
  /*
   * PDF
   *
   * Split each page independently so every chunk
   * retains its real page number.
   */
  if (document.pages?.length) {
    return chunkPdfDocument(
      document,
    );
  }

  /*
   * Excel
   *
   * Split each worksheet independently so
   * sheet metadata is preserved.
   */
  if (document.sheets?.length) {
    return chunkSpreadsheet(
      document,
    );
  }

  /*
   * TXT / DOCX / other text-like documents
   */
  return chunkPlainDocument(
    document,
  );
}

async function chunkPdfDocument(
  document: DocumentContent,
): Promise<DocumentChunk[]> {
  const chunks: DocumentChunk[] = [];

  for (const page of document.pages ?? []) {
    const normalized =
      normalizeText(page.text);

    if (!normalized) {
      continue;
    }

    const splitTexts =
      await splitter.splitText(
        normalized,
      );

    splitTexts.forEach(
      (content) => {
        chunks.push({
          chunkId:
            `chunk_${crypto.randomUUID()}`,

          documentId:
            document.documentId,

          documentName:
            document.fileName,

          content,

          chunkIndex:
            chunks.length,

          metadata: {
            fileType:
              document.fileType,

            mimeType:
              document.metadata.mimeType,

            sizeBytes:
              document.metadata.sizeBytes,

            createdAt:
              document.metadata
                .extractedAt,

            pageNumber:
              page.pageNumber,

            source:
              `${document.fileName} / Page ${page.pageNumber}`,
          },
        });
      },
    );
  }

  return chunks;
}

async function chunkSpreadsheet(
  document: DocumentContent,
): Promise<DocumentChunk[]> {
  const chunks: DocumentChunk[] = [];

  for (const sheet of document.sheets ?? []) {
    const normalized =
      normalizeText(sheet.text);

    if (!normalized) {
      continue;
    }

    const splitTexts =
      await splitter.splitText(
        normalized,
      );

    splitTexts.forEach(
      (content) => {
        chunks.push({
          chunkId:
            `chunk_${crypto.randomUUID()}`,

          documentId:
            document.documentId,

          documentName:
            document.fileName,

          content,

          chunkIndex:
            chunks.length,

          metadata: {
            fileType:
              document.fileType,

            mimeType:
              document.metadata.mimeType,

            sizeBytes:
              document.metadata.sizeBytes,

            createdAt:
              document.metadata
                .extractedAt,

            sheetName:
              sheet.name,

            source:
              `${document.fileName} / ${sheet.name}`,
          },
        });
      },
    );
  }

  return chunks;
}

async function chunkPlainDocument(
  document: DocumentContent,
): Promise<DocumentChunk[]> {
  const normalized =
    normalizeText(
      document.fullText,
    );

  if (!normalized) {
    return [];
  }

  const splitTexts =
    await splitter.splitText(
      normalized,
    );

  return splitTexts.map(
    (content, index) => ({
      chunkId:
        `chunk_${crypto.randomUUID()}`,

      documentId:
        document.documentId,

      documentName:
        document.fileName,

      content,

      chunkIndex: index,

      metadata: {
        fileType:
          document.fileType,

        mimeType:
          document.metadata.mimeType,

        sizeBytes:
          document.metadata.sizeBytes,

        createdAt:
          document.metadata
            .extractedAt,

        source:
          document.fileName,
      },
    }),
  );
}

function normalizeText(
  text: string,
): string {
  return text
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}