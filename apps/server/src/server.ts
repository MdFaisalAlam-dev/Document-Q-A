import app from "./app.js";
import { env } from "./config/env.js";

const port = env?.PORT ?? 3000;
const nodeEnv = env?.NODE_ENV ?? "development";

const server = app.listen(port, () => {
  console.log("");
  console.log("========================================");
  console.log("        DOCUMENT QNA API");
  console.log("========================================");
  console.log(`Environment : ${nodeEnv}`);
  console.log(`Server      : http://localhost:${port}`);
  console.log(`Health      : http://localhost:${port}/health`);
  console.log("Status      : ONLINE");
  console.log("========================================");
  console.log("");
});

const shutdown = (signal: string) => {
  console.log(`\n${signal} received. Shutting down server...`);

  server.close(() => {
    console.log("HTTP server closed.");
    process.exit(0);
  });
};

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));