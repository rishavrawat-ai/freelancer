import cors from "cors";
import express from "express";
import helmet from "helmet";
import morgan from "morgan";
import { env, envInitError } from "./src/config/env.js";
import { errorHandler } from "./src/middlewares/error-handler.js";
import { notFoundHandler } from "./src/middlewares/not-found.js";
import { apiRouter } from "./src/routes/index.js";
import { prisma } from "./src/lib/prisma.js";

const runningInVercel = process.env.VERCEL === "1";

export const createApp = () => {
  const app = express();

  const allowedOrigins =
    env.CORS_ORIGIN === "*"
      ? undefined
      : env.CORS_ORIGIN.split(",").map((origin) => origin.trim());

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

// If environment validation failed during import, keep the process alive in
// serverless (Vercel) so requests can return a helpful 500, but in local/dev
// fail fast so the developer can fix the configuration.
if (envInitError) {
  console.error("Environment validation failed:", envInitError);

  if (runningInVercel) {
    app.use((req, res) => {
      res.status(500).json({
        error: "Server configuration error",
        message:
          "Missing or invalid environment variables. Check server logs for details."
      });
    });
  } else {
    console.error("Exiting due to invalid environment configuration.");
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
    await prisma.$disconnect();
    process.exit(0);
  };

  process.on("SIGINT", gracefulShutdown);
  process.on("SIGTERM", gracefulShutdown);
}

export default app;
