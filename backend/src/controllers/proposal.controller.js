import { Prisma } from "@prisma/client";
import { asyncHandler } from "../utils/async-handler.js";
import { prisma } from "../lib/prisma.js";
import { AppError } from "../utils/app-error.js";

const normalizeAmount = (value) => {
  if (value === undefined || value === null || Number.isNaN(Number(value))) {
    return 0;
  }
  const parsed = Math.round(Number(value));
  return parsed < 0 ? 0 : parsed;
};

export const createProposal = asyncHandler(async (req, res) => {
  const userId = req.user?.sub;

  if (!userId) {
    throw new AppError("Authentication required", 401);
  }

  const { projectId, coverLetter, amount, status, freelancerId } = req.body;

  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: { ownerId: true }
  });

  if (!project) {
    throw new AppError("Project not found", 404);
  }

  const actingFreelancerId = freelancerId || userId;
  const isOwner = project.ownerId === userId;
  const isSelf = actingFreelancerId === userId;

  if (!isOwner && !isSelf) {
    throw new AppError(
      "You do not have permission to add a proposal to this project",
      403
    );
  }

  const proposal = await prisma.proposal.create({
    data: {
      coverLetter,
      amount: normalizeAmount(amount),
      status: status || "PENDING",
      freelancerId: actingFreelancerId,
      projectId
    }
  });

  res.status(201).json({ data: proposal });
});

export const listProposals = asyncHandler(async (req, res) => {
  const userId = req.user?.sub;

  if (!userId) {
    throw new AppError("Authentication required", 401);
  }

  const mode = req.query.as === "owner" ? "owner" : "freelancer";

  const proposals = await prisma.proposal.findMany({
    where:
      mode === "owner"
        ? { project: { ownerId: userId } }
        : { freelancerId: userId },
    include: {
      project: {
        include: {
          owner: true
        }
      },
      freelancer: true
    },
    orderBy: { createdAt: "desc" }
  });

  res.json({ data: proposals });
});

export const deleteProposal = asyncHandler(async (req, res) => {
  const userId = req.user?.sub;
  const proposalId = req.params.id;

  if (!userId) {
    throw new AppError("Authentication required", 401);
  }

  const proposal = await prisma.proposal.findUnique({
    where: { id: proposalId },
    include: {
      project: { select: { ownerId: true } }
    }
  });

  if (!proposal) {
    throw new AppError("Proposal not found", 404);
  }

  const isOwner = proposal.project?.ownerId === userId;
  const isFreelancer = proposal.freelancerId === userId;

  if (!isOwner && !isFreelancer) {
    throw new AppError("You do not have permission to delete this proposal", 403);
  }

  await prisma.proposal.delete({
    where: { id: proposalId }
  });

  res.json({ data: { deleted: true } });
});

export const updateProposalStatus = asyncHandler(async (req, res) => {
  const userId = req.user?.sub;
  const proposalId = req.params.id;
  const { status } = req.body || {};

  if (!userId) {
    throw new AppError("Authentication required", 401);
  }

  const normalizedStatus = (() => {
    const incoming = (status || "").toString().trim().toUpperCase();
    if (incoming === "RECEIVED") return "PENDING";
    if (["PENDING", "ACCEPTED", "REJECTED"].includes(incoming)) {
      return incoming;
    }
    return null;
  })();

  if (!normalizedStatus) {
    throw new AppError("Invalid proposal status", 400);
  }

  const proposal = await prisma.proposal.findUnique({
    where: { id: proposalId },
    include: {
      project: { select: { ownerId: true } }
    }
  });

  if (!proposal) {
    throw new AppError("Proposal not found", 404);
  }
  if (!proposal.project) {
    throw new AppError("Proposal project not found", 404);
  }

  const isOwner = proposal.project.ownerId === userId;
  const isFreelancer = proposal.freelancerId === userId;

  if (!isOwner && !isFreelancer) {
    throw new AppError("You do not have permission to update this proposal", 403);
  }

  try {
    const updated = await prisma.proposal.update({
      where: { id: proposalId },
      data: { status: normalizedStatus },
      include: {
        project: { include: { owner: true } },
        freelancer: true
      }
    });

    res.json({ data: updated });
  } catch (error) {
    console.error("Failed to update proposal status", {
      proposalId,
      normalizedStatus,
      error
    });
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2004"
    ) {
      throw new AppError("Invalid proposal status value", 400);
    }
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      throw new AppError(`Database error (${error.code}) updating proposal`, 500, {
        code: error.code,
        meta: error.meta
      });
    }

    throw error;
  }
});
