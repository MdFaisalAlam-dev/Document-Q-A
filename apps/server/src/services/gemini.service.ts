import { GoogleGenAI } from "@google/genai";
import PQueue from "p-queue";

import { env } from "../config/env.js";

const gemini = new GoogleGenAI({
  apiKey: env.GEMINI_API_KEY,
});

const EMBEDDING_MODEL = "gemini-embedding-2";
const GENERATION_MODEL = "gemini-3.8-flash";
const MAX_RETRIES = 3;
const MAX_BACKOFF_MS = 60_000;

const geminiQueue = new PQueue({
  concurrency: 1,
  intervalCap: 1,
  interval: 3_000,
  carryoverConcurrencyCount: true,
});

function isRateLimitError(error: unknown): boolean {
  const candidate = error as {
    status?: number;
    statusCode?: number;
    message?: string;
  };

  return (
    candidate?.status === 429 ||
    candidate?.statusCode === 429 ||
    /429|resource[_ ]?exhausted|too many requests/i.test(
      candidate?.message ?? String(error),
    )
  );
}

function getRetryDelayMs(error: unknown, attempt: number): number {
  const errorText = JSON.stringify(error) ?? String(error);
  const retrySeconds = errorText.match(
    /(?:retryDelay|retry[- ]?after|retry in)[^\d]*(\d+(?:\.\d+)?)\s*s/i,
  )?.[1];

  if (retrySeconds) {
    return Math.min(
      Math.ceil(Number(retrySeconds) * 1_000),
      MAX_BACKOFF_MS,
    );
  }

  return Math.min(
    2_000 * 2 ** attempt,
    MAX_BACKOFF_MS,
  );
}

async function runGeminiRequest<T>(
  request: () => Promise<T>,
): Promise<T> {
  return geminiQueue.add(async () => {
    for (let attempt = 0; ; attempt += 1) {
      try {
        return await request();
      } catch (error) {
        if (
          !isRateLimitError(error) ||
          attempt >= MAX_RETRIES
        ) {
          throw error;
        }

        const delayMs = getRetryDelayMs(error, attempt);
        console.warn(
          `Gemini rate limit reached. Retrying in ${delayMs}ms (attempt ${attempt + 1}/${MAX_RETRIES}).`,
        );
        await new Promise((resolve) =>
          setTimeout(resolve, delayMs),
        );
      }
    }
  });
}

export async function testGeminiConnection(): Promise<string> {
  const response = await runGeminiRequest(() =>
    gemini.models.generateContent({
      model: GENERATION_MODEL,
      contents: "Reply with exactly: DOCUMENT QNA GEMINI ONLINE",
    }),
  );

  return response.text ?? "";
}

export async function generateText(
  prompt: string,
): Promise<string> {
  const response = await runGeminiRequest(() =>
    gemini.models.generateContent({
      model: GENERATION_MODEL,
      contents: prompt,
    }),
  );

  return response.text ?? "";
}

export async function generateEmbedding(
  text: string,
): Promise<number[]> {
  if (!text.trim()) {
    throw new Error("Cannot generate embedding for empty text.");
  }

  const response = await runGeminiRequest(() =>
    gemini.models.embedContent({
      model: EMBEDDING_MODEL,
      contents: text,
      config: {
        outputDimensionality: 768,
      },
    }),
  );

  const values = response.embeddings?.[0]?.values;

  if (!values || values.length !== 768) {
    throw new Error(
      `Invalid embedding response. Expected 768 dimensions, received ${
        values?.length ?? 0
      }.`,
    );
  }

  return values;
}

export async function generateEmbeddings(
  texts: string[],
): Promise<number[][]> {
  if (texts.length === 0) {
    return [];
  }

  if (texts.some((text) => !text.trim())) {
    throw new Error(
      "Cannot generate embeddings for empty text.",
    );
  }

  const response = await runGeminiRequest(() =>
    gemini.models.embedContent({
      model: EMBEDDING_MODEL,
      contents: texts.map((text) => ({
        parts: [{ text }],
      })),
      config: {
        outputDimensionality: 768,
      },
    }),
  );

  const embeddings = response.embeddings ?? [];

  if (
    embeddings.length !== texts.length ||
    embeddings.some(
      (embedding) =>
        !embedding.values ||
        embedding.values.length !== 768,
    )
  ) {
    throw new Error(
      `Invalid embedding response. Expected ${texts.length} embeddings with 768 dimensions.`,
    );
  }

  return embeddings.map((embedding) => embedding.values!);
}

