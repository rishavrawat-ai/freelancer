import { asyncHandler } from "../utils/async-handler.js";
import { prisma } from "../lib/prisma.js";
import { AppError } from "../utils/app-error.js";

const MAX_INT = 2147483647; // PostgreSQL INT4 upper bound

const normalizeAmount = (value) => {
  if (value === undefined || value === null) return 0;
  if (typeof value === "number") {
    const parsed = Math.round(value);
    if (parsed < 0) return 0;
    return parsed > MAX_INT ? MAX_INT : parsed;
  }

  if (typeof value === "string") {
    // Strip currency, commas, and pull the first number if a range is provided.
    const sanitized = value
      .replace(/[₹,$\s]/g, "")
      .replace(/[–—]/g, "-");

    const rangePart = sanitized.includes("-")
      ? sanitized.split("-")[0]
      : sanitized;

    const parsed = Number(rangePart);
    if (!Number.isNaN(parsed)) {
      const rounded = Math.round(parsed);
      if (rounded < 0) return 0;
      return rounded > MAX_INT ? MAX_INT : rounded;
    }
  }

  return 0;
};

const normalizeBudget = (value) => {
  if (value === undefined || value === null) return null;
  if (typeof value === "number") {
    const parsed = Math.round(value);
    if (parsed < 0) return 0;
    return parsed > MAX_INT ? MAX_INT : parsed;
  }

  if (typeof value === "string") {
    // Handle currency symbols, commas, and ranges like "₹60,001–1,00,000"
    const sanitized = value
      .replace(/[₹,\s]/g, "")
      .replace(/[–—]/g, "-"); // normalize dash variants

    const rangePart = sanitized.includes("-")
      ? sanitized.split("-")[0]
      : sanitized;

    const parsed = Number(rangePart);
    if (!Number.isNaN(parsed)) {
      const rounded = Math.round(parsed);
      if (rounded < 0) return 0;
      return rounded > MAX_INT ? MAX_INT : rounded;
    }
  }

  return null;
};

export const createProject = asyncHandler(async (req, res) => {
  const userId = req.user?.sub;

  if (!userId) {
    throw new AppError("Authentication required", 401);
  }

  const { title, description, budget, status, proposal } = req.body;

  const project = await prisma.project.create({
    data: {
      title,
      description,
      budget: normalizeBudget(budget),
      status: status || "DRAFT",
      ownerId: userId
    }
  });

  let createdProposal = null;

  if (proposal?.coverLetter) {
    const freelancerId = proposal.freelancerId || userId;

    createdProposal = await prisma.proposal.create({
      data: {
        coverLetter: proposal.coverLetter,
        amount: normalizeAmount(proposal.amount),
        status: proposal.status || "PENDING",
        freelancerId,
        projectId: project.id
      }
    });
  }

  res.status(201).json({
    data: {
      project,
      proposal: createdProposal
    }
  });
});

export const listProjects = asyncHandler(async (req, res) => {
  const userId = req.user?.sub;

  if (!userId) {
    throw new AppError("Authentication required", 401);
  }

  const projects = await prisma.project.findMany({
    where: { ownerId: userId },
    include: {
      proposals: {
        include: {
          freelancer: true
        },
        orderBy: { createdAt: "desc" }
      }
    },
    orderBy: { createdAt: "desc" }
  });

  res.json({ data: projects });
});
