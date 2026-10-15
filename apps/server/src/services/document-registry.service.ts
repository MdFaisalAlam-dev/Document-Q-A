import {
  COLLECTION_NAME,
  qdrant,
  ensureCollection,
} from "./qdrant.service.js";

export interface DocumentRegistryItem {
  documentId: string;
  fileName: string;
  fileType: string;
  mimeType: string;
  sizeBytes: number;
  createdAt: string;
  chunkCount: number;
}

type RegistryPayload = {
  documentId?: unknown;
  documentName?: unknown;
  fileType?: unknown;
  mimeType?: unknown;
  sizeBytes?: unknown;
  createdAt?: unknown;
};

export async function listIndexedDocuments(): Promise<
  DocumentRegistryItem[]
> {
  await ensureCollection();

  const documents = new Map<
    string,
    DocumentRegistryItem
  >();

  let offset:
    | string
    | number
    | null
    | undefined = undefined;

  do {
    const response = await qdrant.scroll(
      COLLECTION_NAME,
      {
        limit: 100,
        offset,
        with_payload: true,
        with_vector: false,
      },
    );

    for (const point of response.points) {
      const payload =
        (point.payload ?? {}) as RegistryPayload;

      const documentId =
        typeof payload.documentId === "string"
          ? payload.documentId
          : "";

      if (!documentId) {
        continue;
      }

      const current =
        documents.get(documentId);

      if (current) {
        current.chunkCount += 1;
        continue;
      }

      documents.set(documentId, {
        documentId,

        fileName:
          typeof payload.documentName ===
          "string"
            ? payload.documentName
            : "Unknown document",

        fileType:
          typeof payload.fileType ===
          "string"
            ? payload.fileType
            : "",

        mimeType:
          typeof payload.mimeType ===
          "string"
            ? payload.mimeType
            : "",

        sizeBytes:
          typeof payload.sizeBytes ===
          "number"
            ? payload.sizeBytes
            : 0,

        createdAt:
          typeof payload.createdAt ===
          "string"
            ? payload.createdAt
            : "",

        chunkCount: 1,
      });
    }

    offset = response.next_page_offset as
      | string
      | number
      | null
      | undefined;
  } while (offset !== null && offset !== undefined);

  return Array.from(documents.values()).sort(
    (a, b) =>
      b.createdAt.localeCompare(
        a.createdAt,
      ),
  );
}

export async function deleteIndexedDocument(
  documentId: string,
) {
  await qdrant.delete(
    COLLECTION_NAME,
    {
      wait: true,

      filter: {
        must: [
          {
            key: "documentId",
            match: {
              value: documentId,
            },
          },
        ],
      },
    },
  );
}