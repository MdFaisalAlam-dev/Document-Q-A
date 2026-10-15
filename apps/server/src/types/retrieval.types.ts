export interface RetrievedChunk {
  chunkId: string;

  score: number;

  content: string;

  documentId: string;

  documentName: string;

  chunkIndex: number;

  metadata: {
    fileType: string;

    pageNumber?: number | null;

    sheetName?: string | null;

    source: string;
  };
}