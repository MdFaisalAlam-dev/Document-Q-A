import type { ProcessedDocument } from "../services/document-processing.service.js";

export type ProcessingStage =
  | "received"
  | "extracting"
  | "chunking"
  | "embedding"
  | "indexing"
  | "ready"
  | "failed";

export type ProcessingStatus =
  | "processing"
  | "ready"
  | "failed";

export interface ProcessingJob {
  jobId: string;

  documentId: string;

  fileName: string;

  status: ProcessingStatus;

  stage: ProcessingStage;

  progress: number;

  message: string;

  createdAt: string;

  updatedAt: string;

  error?: string;

  result?: ProcessedDocument;
}