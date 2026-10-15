type UploadFile = {
  fieldname: string;
  originalname: string;
  encoding: string;
  mimetype: string;
  size: number;
  destination?: string;
  filename?: string;
  path?: string;
  buffer?: Buffer;
};

type UploadFileFilterCallback = (
  error: Error | null,
  acceptFile?: boolean,
) => void;

type UploadStorageEngine = {
  _handleFile: (...args: any[]) => any;
  _removeFile: (...args: any[]) => any;
};

type UploadDiskStorageOptions = {
  destination?:
    | string
    | ((
        req: any,
        file: UploadFile,
        cb: (error: Error | null, destination: string) => void,
      ) => void);
  filename?: (
    req: any,
    file: UploadFile,
    cb: (error: Error | null, filename: string) => void,
  ) => void;
};

import path from "node:path";
import fs from "node:fs";
import multer from "multer";
import type { Request } from "express";

const uploadDirectory = path.resolve(
  process.cwd(),
  "storage",
  "uploads",
);

fs.mkdirSync(uploadDirectory, {
  recursive: true,
});

const storage = multer.diskStorage({
  destination: (_req: Request, _file: UploadFile, cb: (error: Error | null, destination: string) => void) => {
    cb(null, uploadDirectory);
  },

  filename: (_req: Request, file: UploadFile, cb: (error: Error | null, filename: string) => void) => {
    const timestamp = Date.now();

    const safeName = file.originalname
      .replace(/[^a-zA-Z0-9._-]/g, "_")
      .replace(/_+/g, "_");

    cb(
      null,
      `${timestamp}-${safeName}`,
    );
  },
});

export const uploadDocument = multer({
  storage,

  limits: {
    fileSize: 20 * 1024 * 1024,
    files: 1,
  },

  fileFilter: (_req: Request, file: UploadFile, cb: UploadFileFilterCallback) => {
    const extension = path.extname(file.originalname).toLowerCase();

    const allowedExtensions = new Set([
      ".pdf",
      ".doc",
      ".docx",
      ".xls",
      ".xlsx",
      ".txt",
    ]);

    if (!allowedExtensions.has(extension)) {
      cb(
        new Error(
          "Unsupported file type. Allowed: PDF, DOC, DOCX, XLS, XLSX, TXT.",
        ),
      );

      return;
    }

    cb(null, true);
  },
});