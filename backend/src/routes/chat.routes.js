import { Router } from "express";
import {
  chatController,
  listUserConversations,
  createConversation,
  getConversationMessages,
  addConversationMessage
} from "../controllers/chat.controller.js";
import { requireAuth } from "../middlewares/require-auth.js";

export const chatRouter = Router();

chatRouter.post("/", chatController);
// Protected conversation routes
chatRouter.get("/conversations", requireAuth, listUserConversations);
chatRouter.post("/conversations", requireAuth, createConversation);
chatRouter.get("/conversations/:id/messages", requireAuth, getConversationMessages);
chatRouter.post("/conversations/:id/messages", requireAuth, addConversationMessage);
