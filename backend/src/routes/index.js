import { Router } from "express";
import { healthRouter } from "./health.route.js";
import { userRouter } from "./user.routes.js";
import { authRouter } from "./auth.routes.js";

export const apiRouter = Router();

apiRouter.use("/health", healthRouter);
apiRouter.use("/users", userRouter);
apiRouter.use("/auth", authRouter);
