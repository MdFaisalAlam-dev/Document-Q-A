export interface DocumentPage {
  pageNumber: number;
  text: string;
}

export interface DocumentSheet {
  name: string;
  text: string;
}

export interface DocumentContent {
  documentId: string;
  fileName: string;
  fileType: string;

  fullText: string;

  pages?: DocumentPage[];
  sheets?: DocumentSheet[];

  metadata: {
    sizeBytes: number;
    mimeType: string;
    extractedAt: string;
  };
}