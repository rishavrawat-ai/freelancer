import { asyncHandler } from "../utils/async-handler.js";
import { prisma } from "../lib/prisma.js";
import { AppError } from "../utils/app-error.js";

const parseExtras = (value) => {
  try {
    if (!value) {
      return {};
    }
    return JSON.parse(value);
  } catch {
    return {};
  }
};

export const getProfile = asyncHandler(async (req, res) => {
  const email = req.query.email;
  if (!email) {
    throw new AppError("Email is required to fetch profile", 400);
  }
  const user = await prisma.user.findUnique({
    where: { email }
  });
  if (!user) {
    throw new AppError("User not found", 404);
  }
  const extras = parseExtras(user.bio);
  res.json({
    data: {
      personal: {
        name: user.fullName ?? "",
        email: user.email,
        phone: extras.phone ?? "",
        location: extras.location ?? ""
      },
      skills: user.skills ?? [],
      workExperience: extras.workExperience ?? [],
      services: extras.services ?? []
    }
  });
});

export const saveProfile = asyncHandler(async (req, res) => {
  const { personal, skills, workExperience, services } = req.body;
  if (!personal?.email) {
    throw new AppError("Personal email is required", 400);
  }
  const extras = {
    phone: personal.phone,
    location: personal.location,
    workExperience: workExperience ?? [],
    services: services ?? []
  };

  await prisma.user.update({
    where: { email: personal.email },
    data: {
      fullName: personal.name ?? undefined,
      skills: skills ?? [],
      bio: JSON.stringify(extras)
    }
  });

  res.json({ data: { success: true } });
});
