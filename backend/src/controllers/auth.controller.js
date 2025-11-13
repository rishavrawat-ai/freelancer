import { asyncHandler } from "../utils/async-handler.js";
import {
  authenticateUser,
  registerUser
} from "../modules/users/user.service.js";

export const signupHandler = asyncHandler(async (req, res) => {
  const authPayload = await registerUser(req.body);
  res.status(201).json({ data: authPayload });
});

export const loginHandler = asyncHandler(async (req, res) => {
  const authPayload = await authenticateUser(req.body);
  res.json({ data: authPayload });
});
