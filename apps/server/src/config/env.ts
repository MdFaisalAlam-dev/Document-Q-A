import "dotenv/config";
import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),

  PORT: z.coerce.number().int().positive().default(3001),

  FRONTEND_URL: z
    .string()
    .url()
    .default("http://localhost:3000"),

  GEMINI_API_KEY: z
    .string()
    .min(1, "GEMINI_API_KEY is required"),

  QDRANT_URL: z
    .string()
    .url("QDRANT_URL must be a valid URL"),

  QDRANT_API_KEY: z
    .string()
    .min(1, "QDRANT_API_KEY is required"),
});

const parsedEnv = envSchema.safeParse(process.env);

if (!parsedEnv.success) {
  console.error("Invalid environment configuration:");
  console.error(parsedEnv.error.flatten().fieldErrors);

  process.exit(1);
}

export const env = parsedEnv.data;