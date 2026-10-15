import type { ChatResponse,ChatStreamEvent  } from "@/types/chat";
import type {
  ProcessingJob,
  ProcessedDocument,
  DocumentRegistryItem,
} from "@/types/document";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ??
  "http://localhost:3001";

export async function getDocuments(): Promise<
  DocumentRegistryItem[]
> {
  const response = await fetch(
    `${API_URL}/documents`,
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data?.error?.message ??
        "Failed to load documents.",
    );
  }

  return data.documents;
}

export async function deleteDocument(
  documentId: string,
) {
  const response = await fetch(
    `${API_URL}/documents/${documentId}`,
    {
      method: "DELETE",
    },
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data?.error?.message ??
        "Failed to delete document.",
    );
  }

  return data;
}

export async function uploadDocument(
  file: File,
) {
  const formData = new FormData();

  formData.append("file", file);

  const response = await fetch(
    `${API_URL}/documents/upload`,
    {
      method: "POST",
      body: formData,
    },
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data?.error?.message ??
        "Document upload failed.",
    );
  }

  return data;
}

export async function searchDocuments(params: {
  question: string;
  limit?: number;
  documentId?: string;
}) {
  const response = await fetch(
    `${API_URL}/retrieval/search`,
    {
      method: "POST",

      headers: {
        "Content-Type": "application/json",
      },

      body: JSON.stringify({
        question: params.question,
        limit: params.limit ?? 5,
        documentId: params.documentId,
      }),
    },
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data?.error?.message ??
        "Document retrieval failed.",
    );
  }

  return data;
}



export async function askDocumentQuestion(params: {
  question: string;
  documentId?: string;
  limit?: number;
}): Promise<ChatResponse> {
  const response = await fetch(
    `${API_URL}/chat/query`,
    {
      method: "POST",

      headers: {
        "Content-Type": "application/json",
      },

      body: JSON.stringify({
        question: params.question,
        documentId: params.documentId,
        limit: params.limit ?? 5,
      }),
    },
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data?.error?.message ??
        "Question processing failed.",
    );
  }

  return data;
}

export async function processDocument(
  file: File,
): Promise<ProcessedDocument> {
  const formData = new FormData();

  formData.append("file", file);

  const response = await fetch(
    `${API_URL}/documents/process`,
    {
      method: "POST",
      body: formData,
    },
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data?.error?.message ??
        "Document processing failed.",
    );
  }

  return data.document as ProcessedDocument;
}

export async function startDocumentProcessing(
  file: File,
): Promise<ProcessingJob> {
  const formData = new FormData();

  formData.append(
    "file",
    file,
  );

  const response =
    await fetch(
      `${API_URL}/documents/process`,
      {
        method: "POST",
        body: formData,
      },
    );

  const data =
    await response.json();

  if (!response.ok) {
    throw new Error(
      data?.error?.message ??
        "Document processing could not be started.",
    );
  }

  return data.job as ProcessingJob;
}

export async function getDocumentProcessingJob(
  jobId: string,
): Promise<ProcessingJob> {
  const response =
    await fetch(
      `${API_URL}/documents/jobs/${jobId}`,
      {
        cache: "no-store",
      },
    );

  const data =
    await response.json();

  if (!response.ok) {
    throw new Error(
      data?.error?.message ??
        "Failed to get processing status.",
    );
  }

  return data.job as ProcessingJob;
}

export async function streamDocumentQuestion(
  params: {
    question: string;
    documentId?: string;
    limit?: number;
  },
  onEvent: (event: ChatStreamEvent) => void,
  signal?: AbortSignal,
): Promise<void> {
  const response = await fetch(
    `${API_URL}/chat/stream`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "text/event-stream",
      },
      body: JSON.stringify({
        question: params.question,
        documentId: params.documentId,
        limit: params.limit ?? 5,
      }),
      signal,
    },
  );

  if (!response.ok) {
    const data = await response.json().catch(() => null);

    throw new Error(
      data?.error?.message ??
        `Chat request failed with status ${response.status}.`,
    );
  }

  if (!response.body) {
    throw new Error(
      "Streaming is unavailable in this browser.",
    );
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();

  let buffer = "";
  let completed = false;

  const processFrame = (frame: string) => {
    const dataLines = frame
      .split("\n")
      .filter((line) => line.startsWith("data:"))
      .map((line) => line.slice(5).trimStart());

    if (dataLines.length === 0) {
      return;
    }

    const payload = dataLines.join("\n");

    let event: ChatStreamEvent;

    try {
      event = JSON.parse(payload) as ChatStreamEvent;
    } catch {
      throw new Error("The server sent an invalid stream event.");
    }

    if (event.type === "complete") {
      completed = true;
    }

    if (event.type === "error") {
      throw new Error(event.message);
    }

    onEvent(event);
  };

  try {
    while (true) {
      const { value, done } = await reader.read();

      if (done) {
        break;
      }

      buffer += decoder.decode(value, { stream: true });
      buffer = buffer.replace(/\r\n/g, "\n");

      let separatorIndex = buffer.indexOf("\n\n");

      while (separatorIndex !== -1) {
        const frame = buffer.slice(0, separatorIndex);
        buffer = buffer.slice(separatorIndex + 2);

        processFrame(frame);

        separatorIndex = buffer.indexOf("\n\n");
      }
    }

    buffer += decoder.decode();

    if (buffer.trim()) {
      processFrame(buffer);
    }
  } finally {
    reader.releaseLock();
  }

  if (!completed) {
    throw new Error(
      "The answer stream ended before the request completed.",
    );
  }
}