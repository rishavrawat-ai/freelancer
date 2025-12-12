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

export const getProposal = asyncHandler(async (req, res) => {
  const userId = req.user?.sub;
  const proposalId = req.params.id;

  if (!userId) {
    throw new AppError("Authentication required", 401);
  }

  const proposal = await prisma.proposal.findUnique({
    where: { id: proposalId },
    include: {
      project: {
        include: {
          owner: true
        }
      },
      freelancer: true
    }
  });

  if (!proposal) {
    throw new AppError("Proposal not found", 404);
  }

  // Check if user has permission to view this proposal
  const isOwner = proposal.project?.ownerId === userId;
  const isFreelancer = proposal.freelancerId === userId;

  if (!isOwner && !isFreelancer) {
    throw new AppError("You do not have permission to view this proposal", 403);
  }

  res.json({ data: proposal });
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

  // Fetch chat conversations to get latest activity
  const serviceKeys = proposals.map(p => {
    const ownerId = p.project.ownerId;
    const freelancerId = p.freelancerId;
    return `CHAT:${ownerId}:${freelancerId}`;
  });

  const conversations = await prisma.chatConversation.findMany({
    where: { service: { in: serviceKeys } },
    select: { service: true, updatedAt: true }
  });

  const conversationMap = new Map();
  conversations.forEach(c => {
    if (c.service) conversationMap.set(c.service, c.updatedAt);
  });

  const proposalsWithActivity = proposals.map(p => {
    const key = `CHAT:${p.project.ownerId}:${p.freelancerId}`;
    const chatUpdated = conversationMap.get(key);
    // Use the later of proposal update or chat update
    const lastActivity = chatUpdated ? new Date(chatUpdated) : new Date(p.updatedAt);
    return { ...p, lastActivity };
  });

  // Sort by last activity descending
  const sortedProposals = proposalsWithActivity.sort((a, b) => 
    b.lastActivity.getTime() - a.lastActivity.getTime()
  );

  res.json({ data: sortedProposals });
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

  // Ensure only one proposal can be accepted per project
  if (normalizedStatus === "ACCEPTED") {
    const existingAccepted = await prisma.proposal.findFirst({
      where: {
        projectId: proposal.projectId,
        status: "ACCEPTED",
        id: { not: proposalId }
      }
    });

    if (existingAccepted) {
      throw new AppError(
        "This project has already been awarded to another freelancer. You cannot accept this proposal.",
        409
      );
    }
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

    // MARKIFY: If status is ACCEPTED (by freelancer), send an automated chat message to the client.
    if (normalizedStatus === "ACCEPTED" && isFreelancer) {
      // 1. Update Project Status to "IN_PROGRESS" to close it for other proposals
      try {
        await prisma.project.update({
          where: { id: updated.projectId },
          data: { status: "IN_PROGRESS" }
        });
      } catch (projError) {
        console.error("Failed to update project status:", projError);
      }

      try {
        const ownerId = updated.project.ownerId;
        const freelancerId = updated.freelancerId;
        const serviceKey = `CHAT:${ownerId}:${freelancerId}`;

        // 2. Find or create conversation
        let conversation = await prisma.chatConversation.findFirst({
          where: { service: serviceKey }
        });

        if (!conversation) {
          conversation = await prisma.chatConversation.create({
            data: {
              service: serviceKey,
              createdById: freelancerId
            }
          });
        }

        // 3. Create the message
        const messageContent = `I have accepted your proposal for "${updated.project.title}". I'm ready to start!`;
        const userMessage = await prisma.chatMessage.create({
          data: {
            conversationId: conversation.id,
            senderId: freelancerId,
            senderName: updated.freelancer.fullName || updated.freelancer.name || updated.freelancer.email || "Freelancer",
            senderRole: "FREELANCER",
            role: "user",
            content: messageContent
          }
        });

        // 4. Update conversation timestamp
        await prisma.chatConversation.update({
          where: { id: conversation.id },
          data: { updatedAt: new Date() }
        });

        // 5. Emit detailed socket notification (same as socket.js/chat.controller.js)
        // Since we are not in a socket handler here, assuming socket is not available to emit chat:message directly
        // But we can trigger a notification if we import sendNotificationToUser - which we don't have here yet.
        // For now, rely on polling or the dashboard update.
        // Ideally we would send a notification here too.
        
      } catch (chatError) {
        console.error("Failed to send automated acceptance message:", chatError);
        // Don't fail the request, just log it.
      }
    }

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
