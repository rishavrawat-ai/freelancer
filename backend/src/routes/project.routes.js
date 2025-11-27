import { Router } from "express";
import { createProject, listProjects } from "../controllers/project.controller.js";
import { requireAuth } from "../middlewares/require-auth.js";
import { validateResource } from "../middlewares/validate-resource.js";
import { createProjectSchema } from "../modules/projects/project.schema.js";

export const projectRouter = Router();

projectRouter.get("/", requireAuth, listProjects);
projectRouter.post("/", requireAuth, validateResource(createProjectSchema), createProject);
