import fs from "node:fs/promises";
import path from "node:path";

import {
  PDFParse,
} from "pdf-parse";
import mammoth from "mammoth";
import * as XLSX from "xlsx";

import type {
  DocumentContent,
  DocumentPage,
  DocumentSheet,
} from "../types/document-content.types.js";

export async function parseDocument(params: {
  documentId: string;
  filePath: string;
  fileName: string;
  mimeType: string;
}) {
  const {
    documentId,
    filePath,
    fileName,
    mimeType,
  } = params;

  const extension = path.extname(fileName).toLowerCase();

  switch (extension) {
    case ".pdf":
      return parsePdf(
        documentId,
        filePath,
        fileName,
        mimeType,
      );

    case ".docx":
      return parseDocx(
        documentId,
        filePath,
        fileName,
        mimeType,
      );

    case ".xlsx":
    case ".xls":
      return parseExcel(
        documentId,
        filePath,
        fileName,
        mimeType,
      );

    case ".txt":
      return parseTxt(
        documentId,
        filePath,
        fileName,
        mimeType,
      );

    case ".doc":
      throw new Error(
        "Legacy .doc parsing is not enabled yet.",
      );

    default:
      throw new Error(
        `Unsupported document extension: ${extension}`,
      );
  }
}

async function parsePdf(
  documentId: string,
  filePath: string,
  fileName: string,
  mimeType: string,
): Promise<DocumentContent> {
  const buffer =
    await fs.readFile(filePath);

  const parser =
    new PDFParse({
      data: buffer,
    });

  try {
    const result =
      await parser.getText();

    const pages: DocumentPage[] =
      result.pages
        .map((page) => ({
          pageNumber: page.num,
          text: page.text.trim(),
        }))
        .filter(
          (page) =>
            page.text.length > 0,
        );

    return {
      documentId,

      fileName,

      fileType: ".pdf",

      fullText: result.text,

      pages,

      metadata: {
        sizeBytes: buffer.length,

        mimeType,

        extractedAt:
          new Date().toISOString(),
      },
    };
  } finally {
    await parser.destroy();
  }
}

async function parseDocx(
  documentId: string,
  filePath: string,
  fileName: string,
  mimeType: string,
): Promise<DocumentContent> {
  const buffer = await fs.readFile(filePath);

  const result = await mammoth.extractRawText({
    buffer,
  });

  return {
    documentId,
    fileName,
    fileType: ".docx",
    fullText: result.value,
    metadata: {
      sizeBytes: buffer.length,
      mimeType,
      extractedAt: new Date().toISOString(),
    },
  };
}

async function parseExcel(
  documentId: string,
  filePath: string,
  fileName: string,
  mimeType: string,
): Promise<DocumentContent> {
  const buffer = await fs.readFile(filePath);

  const workbook = XLSX.read(buffer, {
    type: "buffer",
  });

  const sheets: DocumentSheet[] = [];

  for (const sheetName of workbook.SheetNames) {
    const worksheet = workbook.Sheets[sheetName];

    const text = XLSX.utils.sheet_to_csv(worksheet);

    sheets.push({
      name: sheetName,
      text,
    });
  }

  const fullText = sheets
    .map(
      (sheet) =>
        `Sheet: ${sheet.name}\n\n${sheet.text}`,
    )
    .join("\n\n");

  return {
    documentId,
    fileName,
    fileType: path.extname(fileName).toLowerCase(),
    fullText,
    sheets,
    metadata: {
      sizeBytes: buffer.length,
      mimeType,
      extractedAt: new Date().toISOString(),
    },
  };
}

async function parseTxt(
  documentId: string,
  filePath: string,
  fileName: string,
  mimeType: string,
): Promise<DocumentContent> {
  const buffer = await fs.readFile(filePath);

  const text = buffer.toString("utf-8");

  return {
    documentId,
    fileName,
    fileType: ".txt",
    fullText: text,
    metadata: {
      sizeBytes: buffer.length,
      mimeType,
      extractedAt: new Date().toISOString(),
    },
  };
}