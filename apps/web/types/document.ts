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
}

export interface ProcessedDocument {
  documentId: string;
  fileName: string;
  fileType: string;
  textLength: number;
  chunkCount: number;
  embeddedChunkCount: number;
}

export interface DocumentRegistryItem {
  documentId: string;
  fileName: string;
  fileType: string;
  mimeType: string;
  sizeBytes: number;
  createdAt: string;
  chunkCount: number;
}

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