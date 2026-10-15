"use client";

import {
  ArrowLeft,
  UploadCloud,
} from "lucide-react";
import { useState } from "react";

import UploadZone from "@/components/upload/UploadZone";
import ProcessingView from "@/components/upload/ProcessingView";

type UploadPanelProps = {
  onClose: () => void;
  onDocumentReady: () => void;
};

export default function UploadPanel({
  onClose,
  onDocumentReady,
}: UploadPanelProps) {
  const [file, setFile] =
    useState<File | null>(null);

  const [processing, setProcessing] =
    useState(false);

  const handleProcessingStart = (
    selectedFile: File,
  ) => {
    setFile(selectedFile);
    setProcessing(true);
  };

  const handleProcessingComplete = () => {
    onDocumentReady();
  };

  return (
    <section className="min-h-[calc(100vh-4rem)] bg-background px-5 py-8 text-foreground sm:px-8 lg:px-12">
      <div className="mx-auto w-full max-w-5xl">
        <button
          type="button"
          onClick={onClose}
          className="mb-10 flex items-center gap-2 font-mono text-[9px] uppercase tracking-[0.2em] text-muted transition-colors hover:text-foreground"
        >
          <ArrowLeft size={14} />
          Back to workspace
        </button>

        <div className="mb-10">
          <div className="mb-4 flex items-center gap-3 font-mono text-[9px] uppercase tracking-[0.24em] text-muted">
            <UploadCloud size={14} />
            Ingestion module
          </div>

          <h2 className="text-4xl font-black uppercase tracking-[-0.04em] sm:text-6xl">
            Add document
          </h2>

          <p className="mt-4 max-w-2xl text-sm leading-7 text-muted">
            Upload a document to extract its contents, create
            vector representations, and make it searchable
            through Document QnA.
          </p>
        </div>

        {processing && file ? (
          <ProcessingView
            file={file}
            onComplete={
              handleProcessingComplete
            }
          />
        ) : (
          <UploadZone
            onProcessingStart={
              handleProcessingStart
            }
          />
        )}
      </div>
    </section>
  );
}