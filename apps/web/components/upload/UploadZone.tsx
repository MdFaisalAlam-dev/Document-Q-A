"use client";

import { useRef, useState } from "react";
import {
  Upload,
  FileText,
  FileSpreadsheet,
  File,
  X,
} from "lucide-react";
type UploadZoneProps = {
  onProcessingStart?: (file: File) => void;
};

const ACCEPTED_TYPES = {
  ".pdf": "PDF",
  ".doc": "DOC",
  ".docx": "DOCX",
  ".xls": "XLS",
  ".xlsx": "XLSX",
  ".txt": "TXT",
};

function getFileIcon(fileName: string) {
  const extension = `.${fileName.split(".").pop()?.toLowerCase()}`;

  if (extension === ".xlsx" || extension === ".xls") {
    return <FileSpreadsheet size={18} strokeWidth={1.5} />;
  }

  if (extension === ".pdf" || extension === ".doc" || extension === ".docx") {
    return <FileText size={18} strokeWidth={1.5} />;
  }

  return <File size={18} strokeWidth={1.5} />;
}

export default function UploadZone({
  onProcessingStart,
}: UploadZoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  const [dragActive, setDragActive] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState("");

  const validateFile = (selectedFile: File) => {
    const extension = `.${selectedFile.name
      .split(".")
      .pop()
      ?.toLowerCase()}`;

    if (!Object.keys(ACCEPTED_TYPES).includes(extension)) {
      setError(
        "Unsupported file type. Use PDF, DOC, DOCX, XLS, XLSX or TXT.",
      );

      return false;
    }

    if (selectedFile.size > 20 * 1024 * 1024) {
      setError("File exceeds the 20 MB development limit.");

      return false;
    }

    return true;
  };

  const handleFile = (selectedFile: File) => {
    setError("");

    if (!validateFile(selectedFile)) {
      return;
    }

    setFile(selectedFile);
  };

  const handleInputChange = (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const selectedFile = event.target.files?.[0];

    if (selectedFile) {
      handleFile(selectedFile);
    }
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setDragActive(false);

    const droppedFile = event.dataTransfer.files?.[0];

    if (droppedFile) {
      handleFile(droppedFile);
    }
  };

  const handleProcess = () => {
    if (!file) {
      return;
    }

    onProcessingStart?.(file);
  };

  return (
    <div className="w-full">
      {!file ? (
        <>
          <div
            onDragEnter={(event) => {
              event.preventDefault();
              setDragActive(true);
            }}
            onDragOver={(event) => {
              event.preventDefault();
              setDragActive(true);
            }}
            onDragLeave={(event) => {
              event.preventDefault();
              setDragActive(false);
            }}
            onDrop={handleDrop}
            onClick={() => inputRef.current?.click()}
            className={[
              "group cursor-pointer border border-dashed p-8 transition-all duration-300 sm:p-12",
              dragActive
                ? "border-foreground bg-foreground/[0.04]"
                : "border-foreground/20 hover:border-foreground/40 hover:bg-foreground/[0.02]",
            ].join(" ")}
          >
            <input
              ref={inputRef}
              type="file"
              accept=".pdf,.doc,.docx,.xls,.xlsx,.txt"
              className="hidden"
              onChange={handleInputChange}
            />

            <div className="mx-auto flex max-w-lg flex-col items-center text-center">
              <div className="mb-5 flex h-14 w-14 items-center justify-center border border-foreground/15 transition-transform duration-300 group-hover:-translate-y-1">
                <Upload size={20} strokeWidth={1.5} />
              </div>

              <p className="font-mono text-[10px] uppercase tracking-[0.25em]">
                Drop document here
              </p>

              <p className="mt-3 max-w-md text-sm leading-6 text-muted">
                Drag and drop a document into the workspace or select a file
                from your computer.
              </p>

              <div className="mt-6 flex flex-wrap justify-center gap-2">
                {Object.keys(ACCEPTED_TYPES).map((type) => (
                  <span
                    key={type}
                    className="border border-foreground/10 px-2 py-1 font-mono text-[8px] uppercase tracking-[0.12em] text-muted"
                  >
                    {type.replace(".", "")}
                  </span>
                ))}
              </div>

              <p className="mt-6 font-mono text-[8px] uppercase tracking-[0.15em] text-muted">
                Maximum development upload size // 20 MB
              </p>
            </div>
          </div>

          {error && (
            <div className="mt-3 border border-red-500/30 px-4 py-3 font-mono text-[9px] uppercase tracking-[0.12em] text-red-500">
              {error}
            </div>
          )}
        </>
      ) : (
        <div className="border border-foreground/15">
          <div className="flex items-center gap-4 p-4">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center border border-foreground/15">
              {getFileIcon(file.name)}
            </div>

            <div className="min-w-0 flex-1">
              <p className="truncate font-mono text-[10px] uppercase tracking-[0.08em]">
                {file.name}
              </p>

              <p className="mt-1 font-mono text-[8px] uppercase tracking-[0.12em] text-muted">
                {(file.size / 1024 / 1024).toFixed(2)} MB
              </p>
            </div>

            <button
              type="button"
              onClick={() => {
                setFile(null);

                if (inputRef.current) {
                  inputRef.current.value = "";
                }
              }}
              className="flex h-8 w-8 shrink-0 items-center justify-center text-muted transition-colors hover:text-foreground"
              aria-label="Remove selected file"
            >
              <X size={15} />
            </button>
          </div>

          <div className="border-t border-foreground/10 p-3">
            <button
              type="button"
              onClick={handleProcess}
              className="w-full bg-foreground px-4 py-3 font-mono text-[9px] uppercase tracking-[0.2em] text-background transition-opacity hover:opacity-80"
            >
              Begin document processing
            </button>
          </div>
        </div>
      )}
    </div>
  );
}