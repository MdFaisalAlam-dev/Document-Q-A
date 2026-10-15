"use client";

import {
  AlertTriangle,
  Check,
  FileText,
  LoaderCircle,
} from "lucide-react";

import {
  useEffect,
  useRef,
  useState,
} from "react";

import gsap from "gsap";

import {
  getDocumentProcessingJob,
  startDocumentProcessing,
} from "@/lib/api";

import type {
  ProcessingJob,
  ProcessingStage,
  ProcessedDocument,
} from "@/types/document";

type ProcessingViewProps = {
  file: File;

  onComplete: (
    document: ProcessedDocument,
  ) => void;
};

const STAGES: {
  key: ProcessingStage;
  label: string;
}[] = [
  {
    key: "received",
    label: "Document received",
  },
  {
    key: "extracting",
    label: "Extracting content",
  },
  {
    key: "chunking",
    label: "Creating retrieval chunks",
  },
  {
    key: "embedding",
    label: "Generating embeddings",
  },
  {
    key: "indexing",
    label: "Indexing vector data",
  },
  {
    key: "ready",
    label: "Knowledge index ready",
  },
];

const STAGE_INDEX =
  new Map<ProcessingStage, number>(
    STAGES.map((stage, index) => [
      stage.key,
      index,
    ]),
  );

export default function ProcessingView({
  file,
  onComplete,
}: ProcessingViewProps) {
  const progressRef =
    useRef<HTMLDivElement>(null);

  const onCompleteRef =
    useRef(onComplete);

  const [job, setJob] =
    useState<ProcessingJob | null>(null);

  const [error, setError] =
    useState("");

  useEffect(() => {
    onCompleteRef.current =
      onComplete;
  }, [onComplete]);

  useEffect(() => {
    let cancelled = false;

    const delay = (
      milliseconds: number,
    ) =>
      new Promise<void>(
        (resolve) =>
          setTimeout(
            resolve,
            milliseconds,
          ),
      );

    const run = async () => {
      try {
        const createdJob =
          await startDocumentProcessing(
            file,
          );

        if (cancelled) {
          return;
        }

        setJob(createdJob);

        while (!cancelled) {
          const currentJob =
            await getDocumentProcessingJob(
              createdJob.jobId,
            );

          if (cancelled) {
            return;
          }

          setJob(currentJob);

          if (
            currentJob.status ===
            "ready"
          ) {
            if (
              currentJob.result
            ) {
              onCompleteRef.current(
                currentJob.result,
              );
            }

            return;
          }

          if (
            currentJob.status ===
            "failed"
          ) {
            setError(
              currentJob.error ??
                currentJob.message ??
                "Document processing failed.",
            );

            return;
          }

          await delay(900);
        }
      } catch (processingError) {
        if (cancelled) {
          return;
        }

        setError(
          processingError instanceof
            Error
            ? processingError.message
            : "Document processing failed.",
        );
      }
    };

    const startTimer = setTimeout(() => {
      void run();
    }, 0);

    return () => {
      cancelled = true;
      clearTimeout(startTimer);
    };
  }, [file]);

  useEffect(() => {
    if (!progressRef.current) {
      return;
    }

    const progress =
      job?.progress ?? 0;

    gsap.to(
      progressRef.current,
      {
        width: `${progress}%`,
        duration: 0.45,
        ease: "power2.out",
      },
    );
  }, [job?.progress]);

  const currentStage =
    job?.stage ?? "received";

  const currentStageIndex =
    STAGE_INDEX.get(
      currentStage,
    ) ?? 0;

  const isFailed =
    Boolean(error) ||
    job?.status === "failed";

  const isReady =
    job?.status === "ready";

  return (
    <div className="border border-foreground/15">
      <div className="border-b border-foreground/10 p-5">
        <div className="flex items-start gap-4">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center border border-foreground/15">
            {isFailed ? (
              <AlertTriangle
                size={18}
                strokeWidth={1.5}
              />
            ) : isReady ? (
              <Check
                size={18}
                strokeWidth={1.7}
              />
            ) : (
              <LoaderCircle
                size={18}
                strokeWidth={1.5}
                className="animate-spin"
              />
            )}
          </div>

          <div className="min-w-0 flex-1">
            <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-muted">
              {isFailed
                ? "Ingestion failed"
                : isReady
                  ? "Ingestion complete"
                  : "Live ingestion pipeline"}
            </p>

            <h3 className="mt-2 truncate text-sm font-semibold uppercase tracking-wider">
              {file.name}
            </h3>
          </div>

          <div className="font-mono text-lg">
            {job?.progress ?? 0}%
          </div>
        </div>

        <div className="mt-5 h-2 overflow-hidden bg-foreground/10">
          <div
            ref={progressRef}
            className="h-full bg-foreground"
            style={{
              width: "0%",
            }}
          />
        </div>

        {job && (
          <div className="mt-3 flex items-center justify-between gap-4">
            <p className="font-mono text-[8px] uppercase tracking-[0.15em] text-muted">
              {job.message}
            </p>

            <span className="shrink-0 font-mono text-[8px] uppercase tracking-[0.15em] text-muted">
              JOB
              {" "}
              {job.jobId.slice(-8)}
            </span>
          </div>
        )}
      </div>

      {isFailed ? (
        <ErrorState
          message={
            error ||
            job?.error ||
            "Processing failed."
          }
        />
      ) : (
        <div className="p-5">
          <div className="mb-4 flex items-center justify-between">
            <p className="font-mono text-[9px] uppercase tracking-[0.22em] text-muted">
              Server ingestion pipeline
            </p>

            <span className="font-mono text-[8px] uppercase tracking-[0.15em] text-muted">
              {isReady
                ? "READY"
                : "RUNNING"}
            </span>
          </div>

          <div className="space-y-2">
            {STAGES.map(
              (stage, index) => {
                const stageIndex =
                  STAGE_INDEX.get(
                    stage.key,
                  ) ?? 0;

                const completed =
                  isReady ||
                  stageIndex <
                    currentStageIndex;

                const active =
                  !isReady &&
                  stage.key ===
                    currentStage;

                return (
                  <PipelineRow
                    key={stage.key}
                    index={String(
                      index + 1,
                    ).padStart(2, "0")}
                    label={
                      stage.label
                    }
                    state={
                      completed
                        ? "complete"
                        : active
                          ? "active"
                          : "pending"
                    }
                  />
                );
              },
            )}
          </div>

          {isReady &&
            job?.result && (
              <CompleteSummary
                result={
                  job.result
                }
              />
            )}
        </div>
      )}
    </div>
  );
}

function PipelineRow({
  index,
  label,
  state,
}: {
  index: string;
  label: string;
  state:
    | "active"
    | "complete"
    | "pending";
}) {
  return (
    <div
      className={[
        "flex items-center gap-3 border px-3 py-3",
        state === "active"
          ? "border-foreground/25 bg-foreground/[0.025]"
          : "border-foreground/10",
      ].join(" ")}
    >
      <span className="font-mono text-[8px] text-muted">
        {index}
      </span>

      <div className="flex h-5 w-5 shrink-0 items-center justify-center">
        {state === "complete" ? (
          <Check
            size={13}
            strokeWidth={1.7}
          />
        ) : state === "active" ? (
          <LoaderCircle
            size={13}
            strokeWidth={1.5}
            className="animate-spin"
          />
        ) : (
          <span className="h-1.5 w-1.5 bg-foreground/20" />
        )}
      </div>

      <span
        className={[
          "flex-1 font-mono text-[9px] uppercase tracking-[0.12em]",
          state === "pending"
            ? "text-muted"
            : "text-foreground",
        ].join(" ")}
      >
        {label}
      </span>

      <span className="font-mono text-[8px] uppercase text-muted">
        {state === "complete"
          ? "OK"
          : state === "active"
            ? "RUN"
            : "WAIT"}
      </span>
    </div>
  );
}

function CompleteSummary({
  result,
}: {
  result: ProcessedDocument;
}) {
  return (
    <div className="mt-5">
      <div className="mb-4 flex items-center gap-3">
        <FileText
          size={15}
          strokeWidth={1.5}
        />

        <p className="font-mono text-[9px] uppercase tracking-[0.2em]">
          Index summary
        </p>
      </div>

      <div className="grid gap-2 sm:grid-cols-3">
        <Metric
          label="Text"
          value={formatNumber(
            result.textLength,
          )}
        />

        <Metric
          label="Chunks"
          value={String(
            result.chunkCount,
          )}
        />

        <Metric
          label="Vectors"
          value={String(
            result.embeddedChunkCount,
          )}
        />
      </div>
    </div>
  );
}

function ErrorState({
  message,
}: {
  message: string;
}) {
  return (
    <div className="p-5">
      <div className="border border-foreground/20 p-4">
        <div className="flex items-start gap-3">
          <AlertTriangle
            size={15}
            className="shrink-0"
            strokeWidth={1.5}
          />

          <div>
            <p className="font-mono text-[9px] uppercase tracking-[0.18em]">
              Processing error
            </p>

            <p className="mt-2 text-sm leading-6 text-muted">
              {message}
            </p>
          </div>
        </div>
      </div>

      <p className="mt-4 font-mono text-[8px] uppercase tracking-[0.14em] text-muted">
        Check the server terminal for detailed
        ingestion information.
      </p>
    </div>
  );
}

function Metric({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="border border-foreground/10 p-4">
      <p className="font-mono text-[8px] uppercase tracking-[0.15em] text-muted">
        {label}
      </p>

      <p className="mt-2 font-mono text-lg">
        {value}
      </p>
    </div>
  );
}

function formatNumber(
  value: number,
) {
  return new Intl.NumberFormat().format(
    value,
  );
}