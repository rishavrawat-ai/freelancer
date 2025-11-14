import express from "express";
import cors from "cors";
import { apiRouter } from "./routes/index.js";
import { prisma } from "./lib/prisma.js";

const runningInVercel = process.env.VERCEL === "1";

const normalizeOrigin = (origin: string | undefined) =>
  typeof origin === "string" ? origin.replace(/\/+$/, "") : origin;

export const createApp = () => {
  const app = express();

  const corsOriginEnv = process.env.CORS_ORIGIN;
  const allowedOrigins =
    corsOriginEnv === "*" || !corsOriginEnv
      ? undefined
      : corsOriginEnv
          .split(",")
          .map((origin) => normalizeOrigin(origin.trim()))
          .filter(Boolean);

  app.use(
    cors({
      origin: allowedOrigins,
      // ...other cors options
    })
  );

  app.use(express.json());
  app.use("/api", apiRouter);

  return app;
};
