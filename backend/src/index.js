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

const resolveAllowedOrigins = () => {
  const sources = [
    env.CORS_ORIGIN,
    env.LOCAL_CORS_ORIGIN,
    env.VERCEL_CORS_ORIGIN
  ].filter((value) => typeof value === "string" && value.length > 0);

  if (sources.length === 0) {
    return undefined;
  }

  const parsedOrigins = sources.flatMap((value) =>
    value
      .split(",")
      .map((origin) => normalizeOrigin(origin.trim()))
      .filter(Boolean)
  );

  if (parsedOrigins.length === 0 || parsedOrigins.includes("*")) {
    return undefined;
  }

  return [...new Set(parsedOrigins)];
};

export const createApp = () => {
  const app = express();

  const allowedOrigins = resolveAllowedOrigins();

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
