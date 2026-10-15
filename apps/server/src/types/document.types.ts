export const SUPPORTED_EXTENSIONS = [
  ".pdf",
  ".doc",
  ".docx",
  ".xls",
  ".xlsx",
  ".txt",
] as const;

export type SupportedExtension =
  (typeof SUPPORTED_EXTENSIONS)[number];

export type DocumentStatus =
  | "uploaded"
  | "processing"
  | "ready"
  | "failed";

export interface UploadedDocument {
  documentId: string;
  originalName: string;
  extension: SupportedExtension;
  mimeType: string;
  sizeBytes: number;
  storedPath: string;
  status: DocumentStatus;
  createdAt: string;
}

