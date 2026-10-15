export type ChatRole = "user" | "assistant";

export interface ChatSource {
  chunkId: string;
  documentId: string;
  documentName: string;
  source: string;
  score: number;
  chunkIndex: number;
  pageNumber?: number | null;
  sheetName?: string | null;
}

export interface ChatRetrieval {
  count: number;
  topScore: number;
}

export interface ChatResponse {
  success: boolean;
  answer: string;
  retrievalStatus: "sufficient" | "insufficient";
  sources: ChatSource[];
  retrieval: ChatRetrieval;
}

export interface ChatMessage {
  id: string;
  role: ChatRole;
  content: string;
  sources?: ChatSource[];
}

export type RagPipelineStage =
  | "retrieving"
  | "context_found"
  | "insufficient_context"
  | "generating";

export type ChatStreamEvent =
  | {
      type: "status";
      stage: RagPipelineStage;
      message: string;
    }
  | {
      type: "sources";
      sources: ChatSource[];
      retrieval: ChatRetrieval;
      retrievalStatus: "sufficient" | "insufficient";
    }
  | {
      type: "token";
      token: string;
    }
  | {
      type: "complete";
      answer: string;
      sources: ChatSource[];
      retrieval: ChatRetrieval;
      retrievalStatus: "sufficient" | "insufficient";
    }
  | {
      type: "error";
      message: string;
    };