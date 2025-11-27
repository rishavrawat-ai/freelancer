import { Router } from "express";
import {
  createProposal,
  listProposals,
  updateProposalStatus
} from "../controllers/proposal.controller.js";
import { requireAuth } from "../middlewares/require-auth.js";
import { validateResource } from "../middlewares/validate-resource.js";
import {
  createProposalSchema,
  listProposalsSchema
} from "../modules/proposals/proposal.schema.js";
import { z } from "zod";
import { deleteProposal } from "../controllers/proposal.controller.js";

export const proposalRouter = Router();

proposalRouter.get("/", requireAuth, validateResource(listProposalsSchema), listProposals);

proposalRouter.post(
  "/",
  requireAuth,
  validateResource(createProposalSchema),
  createProposal
);

proposalRouter.patch(
  "/:id/status",
  requireAuth,
  validateResource({
    params: z.object({ id: z.string().min(1) }),
    body: z.object({ status: z.string().min(1) })
  }),
  updateProposalStatus
);

proposalRouter.delete(
  "/:id",
  requireAuth,
  validateResource({ params: z.object({ id: z.string().min(1) }) }),
  deleteProposal
);
