import cors from "cors";
import express from "express";
import helmet from "helmet";
import morgan from "morgan";
import { env, envInitError } from "./config/env.js";
import { errorHandler } from "./middlewares/error-handler.js";
import { notFoundHandler } from "./middlewares/not-found.js";
import { apiRouter } from "./routes/index.js";
import { prisma, prismaInitError } from "./lib/prisma.js";

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

  if (envInitError || prismaInitError) {
    app.use((_req, res) => {
      if (envInitError) {
        res.status(500).json({
          error: "Server configuration error",
          message:
            "Missing or invalid environment variables. Check server logs for details."
        });
        return;
      }

      res.status(500).json({
        error: "Database configuration error",
        message:
          "Prisma Client failed to initialize. Make sure `prisma generate` runs during the build (see https://pris.ly/d/vercel-build)."
      });
    });

    return app;
  }

  app.use("/api", apiRouter);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
};

const app = createApp();

if (envInitError) {
  console.error("Environment validation failed:", envInitError);

  if (!runningInVercel) {
    console.error("Exiting due to invalid environment configuration.");
    process.exit(1);
  }
}

if (prismaInitError) {
  console.error("Prisma initialization failed:", prismaInitError);

  if (!runningInVercel) {
    console.error("Exiting due to Prisma client initialization failure.");
    process.exit(1);
  }
}

if (!runningInVercel) {
  const server = app.listen(env.PORT, () => {
    console.log(`API server ready on http://localhost:${env.PORT}`);
  });

  server.on("error", (error) => {
    if (error && error.code === "EADDRINUSE") {
      console.error(
        `Port ${env.PORT} is already in use. Make sure another backend instance is not running or change the PORT in your environment.`
      );
    } else {
      console.error("Server error:", error);
    }
    process.exit(1);
  });

  const gracefulShutdown = async () => {
    console.log("Shutting down server...");
    server.close();
    if (prisma && typeof prisma.$disconnect === "function") {
      try {
        await prisma.$disconnect();
      } catch (error) {
        console.warn("Error disconnecting Prisma client:", error);
      }
    }
    process.exit(0);
  };

  process.on("SIGINT", gracefulShutdown);
  process.on("SIGTERM", gracefulShutdown);
}

export default app;
