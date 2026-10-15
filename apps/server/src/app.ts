import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";

import { env } from "./config/env.js";
import healthRouter from "./routes/health.routes.js";
import { errorMiddleware } from "./middleware/error.middleware.js";
import aiRouter from "./routes/ai.routes.js";
import documentRouter from "./routes/document.routes.js";
import retrievalRouter from "./routes/retrieval.routes.js";
import chatRouter from "./routes/chat.routes.js";
const app = express();

app.disable("x-powered-by");

const frontendOrigin = env?.FRONTEND_URL ?? true;

app.use(
  cors({
    origin: frontendOrigin,
    credentials: true,
  }),
);

app.use(helmet());
app.use(morgan("dev"));

app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true, limit: "1mb" }));

app.use("/ai", aiRouter);
app.use("/documents", documentRouter);
app.use("/retrieval", retrievalRouter);
app.use("/chat", chatRouter);

app.get("/", (_req, res) => {
  res.json({
    success: true,
    service: "document-qna-api",
    message: "Document QnA API is running.",
  });
});

app.use("/health", healthRouter);

app.use(errorMiddleware);

export default app;