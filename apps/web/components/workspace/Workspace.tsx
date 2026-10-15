"use client";

import {
  Command,
  Moon,
  Sun,
} from "lucide-react";

import {
  useEffect,
  useState,
} from "react";

import Sidebar from "./Sidebar";
import ChatPanel from "./ChatPanel";
import SourcePanel from "./SourcePanel";
import UploadPanel from "./UploadPanel";

import {
  streamDocumentQuestion,
  getDocuments,
  deleteDocument,
} from "@/lib/api";

import type {
  ChatMessage,
  ChatRetrieval,
  ChatSource,
  ChatStreamEvent,
} from "@/types/chat";

import type {
  DocumentRegistryItem,
} from "@/types/document";

type Theme = "light" | "dark";
type View = "workspace" | "upload";

export default function Workspace() {
  const [theme, setTheme] =
    useState<Theme>(() => {
      if (typeof window === "undefined") {
        return "light";
      }

      const storedTheme =
        localStorage.getItem(
          "document-qna-theme",
        );

      return storedTheme === "dark" ||
        storedTheme === "light"
        ? storedTheme
        : "light";
    });

  const [view, setView] =
    useState<View>("workspace");

  const [question, setQuestion] =
    useState("");

  const [messages, setMessages] =
    useState<ChatMessage[]>([]);

  const [sources, setSources] =
    useState<ChatSource[]>([]);

  const [documents, setDocuments] =
    useState<DocumentRegistryItem[]>([]);

  const [
    activeDocumentId,
    setActiveDocumentId,
  ] = useState<string | null>(null);

  const [retrieval, setRetrieval] =
    useState<ChatRetrieval | null>(null);

  const [isLoading, setIsLoading] =
    useState(false);

  const [pipelineStatus, setPipelineStatus] =
    useState<{
      stage: string;
      message: string;
    } | null>(null);

  const activeDocument =
    documents.find(
      (document) =>
        document.documentId ===
        activeDocumentId,
    ) ?? null;

  useEffect(() => {
    document.documentElement.classList.toggle(
      "dark",
      theme === "dark",
    );

    localStorage.setItem(
      "document-qna-theme",
      theme,
    );
  }, [theme]);

  useEffect(() => {
    const loadDocuments = async () => {
      try {
        const indexedDocuments =
          await getDocuments();

        setDocuments(
          indexedDocuments,
        );
      } catch (error) {
        console.error(
          "Failed to load documents:",
          error,
        );
      }
    };

    void loadDocuments();
  }, []);

  const toggleTheme = () => {
    setTheme((current) =>
      current === "light"
        ? "dark"
        : "light",
    );
  };

  const handleSelectDocument = (
    documentId: string | null,
  ) => {
    setActiveDocumentId(
      documentId,
    );

    setMessages([]);
    setSources([]);
    setRetrieval(null);
    setQuestion("");
  };

  const handleDeleteDocument = async (
    documentId: string,
  ) => {
    const confirmed =
      window.confirm(
        "Delete this indexed document?",
      );

    if (!confirmed) {
      return;
    }

    try {
      await deleteDocument(
        documentId,
      );

      setDocuments((current) =>
        current.filter(
          (document) =>
            document.documentId !==
            documentId,
        ),
      );

      setActiveDocumentId((current) =>
        current === documentId ? null : current,
      );

      setSources([]);
      setRetrieval(null);
      setMessages([]);
    } catch (error) {
      console.error(
        "Failed to delete document:",
        error,
      );
    }
  };

  const handleAskQuestion = async () => {
    const trimmedQuestion = question.trim();

    if (!trimmedQuestion || isLoading) {
      return;
    }

    const userMessageId = `user_${Date.now()}`;
    const assistantMessageId = `assistant_${Date.now() + 1}`;

    const userMessage: ChatMessage = {
      id: userMessageId,
      role: "user",
      content: trimmedQuestion,
    };

    const assistantMessage: ChatMessage = {
      id: assistantMessageId,
      role: "assistant",
      content: "",
      sources: [],
    };

    setMessages((current) => [
      ...current,
      userMessage,
      assistantMessage,
    ]);

    setQuestion("");
    setIsLoading(true);

    setSources([]);
    setRetrieval(null);

    setPipelineStatus({
      stage: "retrieving",
      message: "Searching indexed document chunks...",
    });

    try {
      await streamDocumentQuestion(
        {
          question: trimmedQuestion,
          documentId: activeDocumentId ?? undefined,
          limit: 5,
        },
        (event: ChatStreamEvent) => {
          if (event.type === "status") {
            setPipelineStatus({
              stage: event.stage,
              message: event.message,
            });

            return;
          }

          if (event.type === "sources") {
            setSources(event.sources);
            setRetrieval(event.retrieval);

            setMessages((current) =>
              current.map((message) =>
                message.id === assistantMessageId
                  ? {
                      ...message,
                      sources: event.sources,
                    }
                  : message,
              ),
            );

            return;
          }

          if (event.type === "token") {
            setMessages((current) =>
              current.map((message) =>
                message.id === assistantMessageId
                  ? {
                      ...message,
                      content: message.content + event.token,
                    }
                  : message,
              ),
            );

            return;
          }

          if (event.type === "complete") {
            // Use the complete server answer as the final source of truth.
            setMessages((current) =>
              current.map((message) =>
                message.id === assistantMessageId
                  ? {
                      ...message,
                      content: event.answer,
                      sources: event.sources,
                    }
                  : message,
              ),
            );

            setSources(event.sources);
            setRetrieval(event.retrieval);

            setPipelineStatus({
              stage: "complete",
              message: "Answer generated successfully.",
            });
          }
        },
      );

      setPipelineStatus(null);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "An unexpected error occurred.";

      setMessages((current) => [
        ...current.map((chatMessage) =>
          chatMessage.id === assistantMessageId
            ? {
                ...chatMessage,
                content: `SYSTEM ERROR: ${message}`,
              }
            : chatMessage,
        ),
      ]);

      setSources([]);
      setRetrieval(null);
      setPipelineStatus(null);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground transition-colors duration-300">
      <header className="flex h-16 items-center justify-between border-b border-foreground/10 px-4 sm:px-6">
        <div className="flex items-center gap-4">
          <div className="flex h-8 w-8 items-center justify-center border border-foreground">
            <Command
              size={14}
              strokeWidth={1.5}
            />
          </div>

          <div>
            <h1 className="text-xs font-semibold uppercase tracking-[0.2em]">
              Document QnA
            </h1>

            <p className="mt-0.5 font-mono text-[8px] uppercase tracking-[0.15em] text-muted">
              Document Intelligence System
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden max-w-65 items-center gap-2 font-mono text-[8px] uppercase tracking-[0.15em] text-muted sm:flex">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-current" />

            <span className="truncate">
              {isLoading
                ? "RAG processing"
                : activeDocument
                  ? `Scope // ${activeDocument.fileName}`
                  : "Scope // All documents"}
            </span>
          </div>

          <button
            type="button"
            onClick={toggleTheme}
            aria-label="Toggle theme"
            className="flex h-9 w-9 items-center justify-center border border-foreground/15 transition-colors hover:border-foreground/30"
          >
            {theme === "light" ? (
              <Moon
                size={15}
                strokeWidth={1.5}
              />
            ) : (
              <Sun
                size={15}
                strokeWidth={1.5}
              />
            )}
          </button>
        </div>
      </header>

      {view === "workspace" ? (
        <div className="flex min-h-[calc(100vh-4rem)] flex-col lg:flex-row">
          <Sidebar
            documents={documents}
            activeDocumentId={activeDocumentId}
            onUpload={() =>
              setView("upload")
            }
            onSelectDocument={
              handleSelectDocument
            }
            onDelete={handleDeleteDocument}
          />

          <div className="flex flex-1 flex-col">
            <div className="border-b border-foreground/10 bg-foreground/[0.02] px-5 py-3 lg:hidden">
              <button
                type="button"
                onClick={() =>
                  setView("upload")
                }
                className="w-full border border-foreground/15 px-4 py-3 font-mono text-[9px] uppercase tracking-[0.2em]"
              >
                + Upload document
              </button>
            </div>

            <ChatPanel
              messages={messages}
              question={question}
              onQuestionChange={
                setQuestion
              }
              onSubmit={
                handleAskQuestion
              }
              isLoading={isLoading}
              pipelineStatus={pipelineStatus}
              activeDocument={
                activeDocument
              }
            />
          </div>

          <SourcePanel
            sources={sources}
            retrieval={retrieval}
            activeDocument={activeDocument}
          />
        </div>
      ) : (
        <UploadPanel
          onClose={() =>
            setView("workspace")
          }
          onDocumentReady={async () => {
            try {
              const indexedDocuments =
                await getDocuments();

              setDocuments(
                indexedDocuments,
              );

              const newestDocument =
                indexedDocuments[0];

              if (newestDocument) {
                setActiveDocumentId(
                  newestDocument.documentId,
                );
              }
            } catch (error) {
              console.error(
                "Failed to refresh documents:",
                error,
              );
            }

            setView("workspace");
          }}
        />
      )}
    </div>
  );
}