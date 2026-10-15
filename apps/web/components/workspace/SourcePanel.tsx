"use client";

import {
  Activity,
  Database,
  FileText,
  Cpu,
} from "lucide-react";

import type {
  ChatRetrieval,
  ChatSource,
} from "@/types/chat";

type SourcePanelProps = {
  sources: ChatSource[];
  retrieval: ChatRetrieval | null;
  activeDocument: {
    fileName: string;
    chunkCount: number;
  } | null;
};

export default function SourcePanel({
  sources,
  retrieval,
  activeDocument,
}: SourcePanelProps) {
  return (
    <aside className="w-full border-t border-foreground/10 lg:w-72 lg:border-l lg:border-t-0">
      <div className="border-b border-foreground/10 px-5 py-4">
        <p className="font-mono text-[9px] uppercase tracking-[0.24em] text-muted">
          Retrieval context
        </p>

        <h2 className="mt-1 text-sm font-semibold uppercase tracking-[0.08em]">
          Sources
        </h2>

        {activeDocument && (
          <div className="mt-3 border border-foreground/10 px-3 py-3">
            <p className="font-mono text-[8px] uppercase tracking-[0.15em] text-muted">
              Retrieval scope
            </p>

            <p className="mt-1 truncate font-mono text-[9px] uppercase">
              {activeDocument.fileName}
            </p>

            <p className="mt-1 font-mono text-[8px] text-muted">
              {activeDocument.chunkCount} indexed chunks
            </p>
          </div>
        )}
      </div>

      <div className="max-h-105 overflow-y-auto p-4">
        {sources.length === 0 ? (
          <div className="border border-dashed border-foreground/10 p-5">
            <FileText
              size={16}
              className="text-muted"
              strokeWidth={1.5}
            />

            <p className="mt-4 font-mono text-[9px] uppercase tracking-[0.18em] text-muted">
              No retrieval context
            </p>

            <p className="mt-2 text-xs leading-6 text-muted">
              Ask a question to see the document chunks
              used by the RAG pipeline.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {sources.map((source, index) => (
              <div
                key={source.chunkId}
                className="border border-foreground/10 p-3"
              >
                <div className="flex items-start gap-3">
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center border border-foreground/10 font-mono text-[8px]">
                    S{index + 1}
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="truncate font-mono text-[9px] uppercase tracking-[0.08em]">
                      {source.documentName}
                    </p>

                    <p className="mt-1 truncate text-[10px] text-muted">
                      {source.source}
                    </p>
                  </div>
                </div>

                <div className="mt-3 h-1.5 bg-foreground/10">
                  <div
                    className="h-full bg-foreground transition-all"
                    style={{
                      width: `${Math.min(
                        Math.max(
                          source.score * 100,
                          0,
                        ),
                        100,
                      )}%`,
                    }}
                  />
                </div>

                <div className="mt-2 flex justify-between gap-3 font-mono text-[8px] uppercase tracking-[0.12em] text-muted">
                  <span>
                    Chunk {source.chunkIndex}
                    {source.pageNumber != null
                      ? ` // Page ${source.pageNumber}`
                      : source.sheetName
                        ? ` // Sheet ${source.sheetName}`
                        : ""}
                  </span>

                  <span>
                    {source.score.toFixed(3)}
                  </span>
                </div>

                {source.pageNumber != null && (
                  <p className="mt-2 font-mono text-[8px] uppercase tracking-[0.12em] text-muted">
                    Page {source.pageNumber}
                  </p>
                )}

                {source.sheetName && (
                  <p className="mt-2 font-mono text-[8px] uppercase tracking-[0.12em] text-muted">
                    Sheet {source.sheetName}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="border-t border-foreground/10 px-5 py-4">
        <p className="mb-4 font-mono text-[9px] uppercase tracking-[0.24em] text-muted">
          Retrieval
        </p>

        <div className="space-y-2">
          <StatusRow
            icon={<Database size={13} />}
            label="Vector database"
            value="READY"
          />

          <StatusRow
            icon={<Cpu size={13} />}
            label="Language model"
            value="READY"
          />

          <StatusRow
            icon={<Activity size={13} />}
            label="Retrieved"
            value={retrieval
              ? String(retrieval.count)
              : "0"}
          />
        </div>

        {retrieval && (
          <div className="mt-3 border border-foreground/10 px-3 py-3">
            <p className="font-mono text-[8px] uppercase tracking-[0.12em] text-muted">
              Top similarity
            </p>

            <p className="mt-1 font-mono text-sm">
              {retrieval.topScore.toFixed(3)}
            </p>
          </div>
        )}
      </div>
    </aside>
  );
}

function StatusRow({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-3 border border-foreground/10 px-3 py-3">
      <span className="text-muted">
        {icon}
      </span>

      <span className="flex-1 font-mono text-[8px] uppercase tracking-[0.12em]">
        {label}
      </span>

      <span className="font-mono text-[8px] text-muted">
        {value}
      </span>
    </div>
  );
}