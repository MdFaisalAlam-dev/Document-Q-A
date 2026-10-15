import { ChatGoogle } from "@langchain/google";

import { env } from "../config/env.js";

export const llm = new ChatGoogle({
  apiKey: env.GEMINI_API_KEY,
  model: "gemini-3.8-flash",
  temperature: 0.2,
});