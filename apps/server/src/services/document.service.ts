import fs from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";

import type { UploadedDocument } from "../types/document.types.js";

type MulterFile = {
  fieldname: string;
  originalname: string;
  encoding: string;
  mimetype: string;
  size: number;
  destination: string;
  filename: string;
  path: string;
  buffer?: Buffer;
};

export async function createUploadedDocument(
  file: MulterFile,
): Promise<UploadedDocument> {
  const extension = path.extname(file.originalname).toLowerCase();

  const document: UploadedDocument = {
    documentId: `doc_${crypto.randomUUID()}`,
    originalName: file.originalname,
    extension: extension as UploadedDocument["extension"],
    mimeType: file.mimetype,
    sizeBytes: file.size,
    storedPath: file.path,
    status: "uploaded",
    createdAt: new Date().toISOString(),
  };

  return document;
}

export async function deleteUploadedFile(
  filePath: string,
): Promise<void> {
  try {
    await fs.unlink(filePath);
  } catch {
    // File may already have been removed.
  }
}