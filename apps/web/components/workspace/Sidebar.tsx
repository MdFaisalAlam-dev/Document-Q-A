"use client";

import {
  FileSpreadsheet,
  FileText,
  FileType,
  FolderOpen,
  Settings,
  Upload,
} from "lucide-react";

import type {
  DocumentRegistryItem,
} from "@/types/document";

type SidebarProps = {
  documents: DocumentRegistryItem[];
  activeDocumentId: string | null;
  onUpload: () => void;
  onSelectDocument: (
    documentId: string | null,
  ) => void;
  onDelete: (
    documentId: string,
  ) => void;
};

export default function Sidebar({
  documents,
  activeDocumentId,
  onUpload,
  onSelectDocument,
  onDelete,
}: SidebarProps) {
  return (
    <aside className="flex w-full flex-col border-b border-foreground/10 lg:w-64 lg:border-r lg:border-b-0">
      <div className="border-b border-foreground/10 p-4">
        <button
          type="button"
          onClick={onUpload}
          className="flex w-full items-center justify-center gap-2 border border-foreground bg-foreground px-4 py-3 text-[10px] font-medium uppercase tracking-[0.2em] text-background transition-opacity hover:opacity-80"
        >
          <Upload size={14} />
          Upload document
        </button>
      </div>

      <div className="flex-1 p-4">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2 text-[10px] font-medium uppercase tracking-[0.22em] text-muted">
            <FolderOpen size={13} />
            Documents
          </div>

          <span className="font-mono text-[9px] text-muted">
            {documents.length
              .toString()
              .padStart(2, "0")}
          </span>
        </div>

        {documents.length === 0 ? (
          <div className="border border-dashed border-foreground/10 p-4">
            <p className="font-mono text-[9px] uppercase tracking-[0.16em] text-muted">
              No documents indexed
            </p>

            <p className="mt-2 text-xs leading-6 text-muted">
              Upload your first document to create a
              searchable knowledge base.
            </p>
          </div>
        ) : (
          <>
            <button
              type="button"
              onClick={() =>
                onSelectDocument(null)
              }
              className={[
                "mb-1 flex w-full items-center gap-3 border px-3 py-3 text-left transition-all",
                activeDocumentId === null
                  ? "border-foreground/20 bg-foreground/[0.05]"
                  : "border-transparent hover:border-foreground/10 hover:bg-foreground/[0.035]",
              ].join(" ")}
            >
              <span
                className={[
                  "h-1.5 w-1.5 rounded-full",
                  activeDocumentId === null
                    ? "animate-pulse bg-foreground"
                    : "bg-foreground/20",
                ].join(" ")}
              />

              <span className="font-mono text-[10px] uppercase tracking-[0.08em]">
                All Documents
              </span>
            </button>

            <div className="space-y-1">
              {documents.map((document) => {
                const active =
                  activeDocumentId ===
                  document.documentId;

                return (
              <div
                key={document.documentId}
                className={[
                  "group flex items-center gap-2 border transition-all",
                  active
                    ? "border-foreground/20 bg-foreground/[0.05]"
                    : "border-transparent hover:border-foreground/10 hover:bg-foreground/[0.035]",
                ].join(" ")}
              >
                <button
                  type="button"
                  onClick={() =>
                    onSelectDocument(
                      document.documentId,
                    )
                  }
                  className="flex min-w-0 flex-1 items-center gap-3 px-3 py-3 text-left"
                >
                  <span
                    className={[
                      "h-1.5 w-1.5 shrink-0 rounded-full",
                      active
                        ? "animate-pulse bg-foreground"
                        : "bg-foreground/15",
                    ].join(" ")}
                  />

                  <span className="text-muted transition-colors group-hover:text-foreground">
                    <DocumentIcon
                      type={document.fileType}
                    />
                  </span>

                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-mono text-[10px] text-muted group-hover:text-foreground">
                      {document.fileName}
                    </span>

                    <span className="mt-1 block font-mono text-[8px] uppercase tracking-widest text-muted/70">
                      {document.chunkCount} chunks
                      {" // "}
                      {document.fileType
                        .replace(".", "")
                        .toUpperCase()}
                    </span>
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() =>
                    onDelete(
                      document.documentId,
                    )
                  }
                  aria-label={`Delete ${document.fileName}`}
                  className="hidden px-2 py-2 font-mono text-[8px] uppercase text-muted transition-colors hover:text-foreground group-hover:block"
                >
                  DEL
                </button>
              </div>
                );
              })}
            </div>
          </>
        )}

        <div className="mt-8 border-t border-foreground/10 pt-4">
          <p className="mb-3 font-mono text-[9px] uppercase tracking-[0.2em] text-muted">
            Supported formats
          </p>

          <div className="grid grid-cols-3 gap-2">
            {[
              "PDF",
              "DOC",
              "XLS",
              "TXT",
              "DOCX",
              "XLSX",
            ].map((format) => (
              <div
                key={format}
                className="border border-foreground/10 px-2 py-2 text-center font-mono text-[8px] text-muted"
              >
                {format}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="border-t border-foreground/10 p-4">
        <button
          type="button"
          className="flex w-full items-center gap-2 px-2 py-2 text-[10px] uppercase tracking-[0.2em] text-muted transition-colors hover:text-foreground"
        >
          <Settings size={13} />
          System settings
        </button>
      </div>
    </aside>
  );
}

function DocumentIcon({
  type,
}: {
  type: string;
}) {
  if (
    type === ".xlsx" ||
    type === ".xls"
  ) {
    return (
      <FileSpreadsheet
        size={15}
        strokeWidth={1.7}
      />
    );
  }

  if (
    type === ".docx" ||
    type === ".doc"
  ) {
    return (
      <FileType
        size={15}
        strokeWidth={1.7}
      />
    );
  }

  return (
    <FileText
      size={15}
      strokeWidth={1.7}
    />
  );
}