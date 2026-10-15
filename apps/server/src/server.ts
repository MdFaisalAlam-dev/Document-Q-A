import app from "./app.js";
import { env } from "./config/env.js";

const server = app.listen(
  env.PORT,
  "0.0.0.0",
  () => {
    console.log(
      `Document QnA API running on port ${env.PORT}`,
    );
  },
);

const shutdown = (signal: string) => {
  console.log(`\n${signal} received. Shutting down server...`);

  server.close(() => {
    console.log("HTTP server closed.");
    process.exit(0);
  });
};

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));