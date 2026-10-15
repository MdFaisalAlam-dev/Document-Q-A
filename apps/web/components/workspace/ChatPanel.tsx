"use client";

import {
  ArrowUp,
  Bot,
  LoaderCircle,
  Paperclip,
  User,
} from "lucide-react";
import { useEffect, useRef } from "react";

import type {
  ChatMessage,
} from "@/types/chat";

type ChatPanelProps = {
  messages: ChatMessage[];
  question: string;
  onQuestionChange: (value: string) => void;
  onSubmit: () => void;
  isLoading: boolean;
  pipelineStatus: {
    stage: string;
    message: string;
  } | null;
  activeDocument: {
    documentId: string;
    fileName: string;
    fileType: string;
  } | null;
};

export default function ChatPanel({
  messages,
  question,
  onQuestionChange,
  onSubmit,
  isLoading,
  activeDocument,
  pipelineStatus,
}: ChatPanelProps) {
  const bottomRef =
    useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({
      behavior: "smooth",
    });
  }, [messages, isLoading]);

  const canSubmit =
    question.trim().length > 0 &&
    !isLoading;

  const handleKeyDown = (
    event: React.KeyboardEvent<HTMLTextAreaElement>,
  ) => {
    if (
      event.key === "Enter" &&
      !event.shiftKey
    ) {
      event.preventDefault();

      if (canSubmit) {
        onSubmit();
      }
    }
  };

  return (
    <section className="flex min-h-155 flex-1 flex-col lg:min-h-0">
      <div className="flex items-center justify-between border-b border-foreground/10 px-5 py-4">
        <div className="flex items-center gap-2 font-mono text-[9px] uppercase tracking-[0.18em] text-muted">
          <span
            className={[
              "h-1.5 w-1.5 rounded-full",
              isLoading
                ? "animate-pulse bg-foreground"
                : "bg-current",
            ].join(" ")}
          />

          {isLoading
            ? (pipelineStatus?.stage.replace(/_/g, " ") ??
                "Processing")
            : "Ready"}
        </div>

        <div className="flex items-center gap-2 font-mono text-[9px] uppercase tracking-[0.18em] text-muted">
          <span
            className={[
              "h-1.5 w-1.5 rounded-full",
              isLoading
                ? "animate-pulse bg-foreground"
                : "bg-current",
            ].join(" ")}
          />

          {isLoading
            ? (pipelineStatus?.stage.replace(/_/g, " ") ??
                "Processing")
            : "Ready"}
        </div>
      </div>

      <div className="flex min-h-0 flex-1 flex-col">
        <div className="flex-1 overflow-y-auto p-5 md:p-8">
          <div className="mx-auto w-full max-w-3xl space-y-6">
            {messages.length === 0 ? (
              <WelcomeState
                activeDocument={activeDocument}
                onPrompt={(prompt) => {
                  onQuestionChange(prompt);
                }}
              />
            ) : (
              messages.map((message) => (
                <MessageBubble
                  key={message.id}
                  message={message}
                />
              ))
            )}

            {isLoading && (
              <div className="flex items-start gap-4">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center border border-foreground/15">
                  <LoaderCircle
                    size={16}
                    className="animate-spin"
                    strokeWidth={1.5}
                  />
                </div>

                <div className="border border-foreground/10 px-4 py-3">
                  <p className="font-mono text-[9px] uppercase tracking-[0.18em] text-muted">
                    {pipelineStatus?.message ??
                      "Preparing the retrieval pipeline..."}
                  </p>

                  <div className="mt-3 flex items-center gap-1">
                    <span className="h-1 w-8 animate-pulse bg-foreground/30" />
                    <span className="h-1 w-5 animate-pulse bg-foreground/20" />
                    <span className="h-1 w-3 animate-pulse bg-foreground/10" />
                  </div>
                </div>
              </div>
            )}

            <div ref={bottomRef} />
          </div>
        </div>

        <div className="border-t border-foreground/10 p-5 md:p-8">
          <div className="mx-auto w-full max-w-3xl">
            <div className="border border-foreground/15 bg-background">
              <div className="flex items-end gap-2 p-3">
                <button
                  type="button"
                  aria-label="Attach document"
                  className="flex h-9 w-9 shrink-0 items-center justify-center text-muted transition-colors hover:text-foreground"
                >
                  <Paperclip
                    size={16}
                    strokeWidth={1.5}
                  />
                </button>

                <textarea
                  value={question}
                  onChange={(event) =>
                    onQuestionChange(
                      event.target.value,
                    )
                  }
                  onKeyDown={handleKeyDown}
                  disabled={isLoading}
                  placeholder={
                    activeDocument
                      ? `Ask something about ${activeDocument.fileName}...`
                      : "Ask something about your documents..."
                  }
                  className="min-h-10.5 max-h-32 flex-1 resize-none bg-transparent px-1 py-2 text-sm outline-none placeholder:text-muted/70 disabled:opacity-50"
                  rows={1}
                />

                <button
                  type="button"
                  onClick={onSubmit}
                  disabled={!canSubmit}
                  aria-label="Send question"
                  className="flex h-9 w-9 shrink-0 items-center justify-center bg-foreground text-background transition-opacity hover:opacity-80 disabled:cursor-not-allowed disabled:opacity-30"
                >
                  <ArrowUp
                    size={16}
                    strokeWidth={1.6}
                  />
                </button>
              </div>

              <div className="border-t border-foreground/10 px-3 py-2 font-mono text-[8px] uppercase tracking-[0.18em] text-muted">
                LangGraph RAG // Qdrant retrieval // Gemini generation
              </div>
            </div>

            <p className="mt-3 text-center font-mono text-[8px] uppercase tracking-[0.15em] text-muted">
              Enter to send // Shift + Enter for newline
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

function WelcomeState({
  onPrompt,
  activeDocument,
}: {
  onPrompt: (prompt: string) => void;
  activeDocument: {
    fileName: string;
  } | null;
}) {
  return (
    <div className="flex min-h-105 flex-col justify-center">
      <div className="mb-8 flex items-start gap-4">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center border border-foreground/15">
          <Bot
            size={16}
            strokeWidth={1.5}
          />
        </div>

        <div>
          <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-muted">
            Document QnA Engine
          </p>

          <h3 className="mt-2 text-2xl font-semibold tracking-tight md:text-4xl">
            Ask questions.
            <br />
            <span className="text-muted">
              Get answers from your documents.
            </span>
          </h3>

          <p className="mt-5 max-w-xl text-sm leading-7 text-muted">
            {activeDocument
              ? `Questions will be answered using ${activeDocument.fileName}.`
              : "Questions will be answered using all indexed documents."}
          </p>
        </div>
      </div>

      <div className="grid gap-2 sm:grid-cols-3">
        {[
          "Summarize this document",
          "Find key information",
          "Explain this section",
        ].map((prompt) => (
          <button
            key={prompt}
            type="button"
            onClick={() => onPrompt(prompt)}
            className="border border-foreground/10 px-3 py-3 text-left text-[10px] text-muted transition-all hover:border-foreground/25 hover:bg-foreground/[0.03] hover:text-foreground"
          >
            {prompt}
          </button>
        ))}
      </div>
    </div>
  );
}

function MessageBubble({
  message,
}: {
  message: ChatMessage;
}) {
  const isUser =
    message.role === "user";

  return (
    <div
      className={[
        "flex items-start gap-4",
        isUser
          ? "justify-end"
          : "justify-start",
      ].join(" ")}
    >
      {!isUser && (
        <div className="flex h-9 w-9 shrink-0 items-center justify-center border border-foreground/15">
          <Bot
            size={16}
            strokeWidth={1.5}
          />
        </div>
      )}

      <div
        className={[
          "max-w-[85%] border p-4",
          isUser
            ? "border-foreground bg-foreground text-background"
            : "border-foreground/10 bg-foreground/[0.02]",
        ].join(" ")}
      >
        <div className="mb-2 flex items-center gap-2 font-mono text-[8px] uppercase tracking-[0.18em] opacity-60">
          {isUser ? (
            <>
              <User size={11} />
              You
            </>
          ) : (
            <>
              <Bot size={11} />
              Document QnA
            </>
          )}
        </div>

        <p className="whitespace-pre-wrap text-sm leading-7">
          {message.content}
        </p>

        {!isUser &&
          message.sources &&
          message.sources.length > 0 && (
            <div className="mt-4 border-t border-foreground/10 pt-3">
              <p className="font-mono text-[8px] uppercase tracking-[0.2em] text-muted">
                Sources attached
              </p>
            </div>
          )}
      </div>

      {isUser && (
        <div className="flex h-9 w-9 shrink-0 items-center justify-center border border-foreground/15">
          <User
            size={15}
            strokeWidth={1.5}
          />
        </div>
      )}
    </div>
  );
}