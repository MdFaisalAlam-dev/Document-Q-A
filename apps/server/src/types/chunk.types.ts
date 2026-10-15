export interface DocumentChunk {
  chunkId: string;

  documentId: string;

  documentName: string;

  content: string;

  chunkIndex: number;

  metadata: {
    fileType: string;

    mimeType: string;

    sizeBytes: number;

    createdAt: string;

    pageNumber?: number;

    sheetName?: string;

    source: string;
  };
}