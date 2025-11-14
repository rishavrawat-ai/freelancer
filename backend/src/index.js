import cors from "cors";
import express from "express";
import helmet from "helmet";
import morgan from "morgan";
import { env } from "./config/env.js";
import { errorHandler } from "./middlewares/error-handler.js";
import { notFoundHandler } from "./middlewares/not-found.js";
import { apiRouter } from "./routes/index.js";
import { prisma } from "./lib/prisma.js";

const runningInVercel = process.env.VERCEL === "1";
const normalizeOrigin = (origin) =>
  typeof origin === "string" ? origin.replace(/\/+$/, "") : origin;

export const createApp = () => {
  const app = express();

  const allowedOrigins =
    env.CORS_ORIGIN === "*" || !env.CORS_ORIGIN
      ? undefined
      : env.CORS_ORIGIN
        .split(",")
        .map((origin) => normalizeOrigin(origin.trim()))
        .filter(Boolean);

  app.use(
    cors({
      origin: allowedOrigins
    })
  );
  app.use(helmet());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  app.use(morgan(env.NODE_ENV === "production" ? "combined" : "dev"));

  app.use("/api", apiRouter);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
};

const app = createApp();

if (!runningInVercel) {
  const server = app.listen(env.PORT, () => {
    console.log(`API server ready on http://localhost:${env.PORT}`);
  });

  const gracefulShutdown = async () => {
    console.log("Shutting down server...");
    server.close();
    await prisma.$disconnect();
    process.exit(0);
  };

  process.on("SIGINT", gracefulShutdown);
  process.on("SIGTERM", gracefulShutdown);
}

export default app;
