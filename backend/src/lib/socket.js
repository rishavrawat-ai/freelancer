import { Server } from "socket.io";
import { env } from "../config/env.js";
import { prisma } from "./prisma.js";
import { generateChatReply } from "../controllers/chat.controller.js";

const normalizeOrigin = (value = "") => value.trim().replace(/\/$/, "");
const parseOrigins = (value = "") =>
  value
    .split(",")
    .map(normalizeOrigin)
    .filter(Boolean);

const allowedOrigins = [
  ...parseOrigins(env.CORS_ORIGIN || ""),
  normalizeOrigin(env.LOCAL_CORS_ORIGIN || ""),
  normalizeOrigin(env.VERCEL_CORS_ORIGIN || ""),
  "http://localhost:5173"
].filter(Boolean);

const serializeMessage = (message) => ({
  ...message,
  createdAt:
    message.createdAt instanceof Date
      ? message.createdAt.toISOString()
      : message.createdAt
});

const toHistoryMessage = (message) => ({
  role: message.role === "assistant" ? "assistant" : "user",
  content: message.content
});

export const initSocket = (server) => {
  const io = new Server(server, {
    cors: {
      origin: allowedOrigins.includes("*") ? true : allowedOrigins,
      credentials: true
    }
  });

  io.on("connection", (socket) => {
    socket.on("chat:join", async ({ conversationId, service }) => {
      try {
        const serviceKey = service ? service.toString().trim() : null;
        let conversation = null;

        if (conversationId) {
          conversation = await prisma.chatConversation.findUnique({
            where: { id: conversationId }
          });
        }

        if (!conversation && serviceKey) {
          conversation = await prisma.chatConversation.findFirst({
            where: { service: serviceKey }
          });
        }

        if (!conversation) {
          conversation = await prisma.chatConversation.create({
            data: { service: serviceKey || null }
          });
        }

        socket.join(conversation.id);
        socket.emit("chat:joined", { conversationId: conversation.id });

        const history = await prisma.chatMessage.findMany({
          where: { conversationId: conversation.id },
          orderBy: { createdAt: "asc" },
          take: 100
        });

        if (history.length) {
          socket.emit(
            "chat:history",
            history.map((msg) => serializeMessage(msg))
          );
        }
      } catch (error) {
        console.error("chat:join failed", error);
        socket.emit("chat:error", {
          message: "Unable to join chat. Please try again."
        });
      }
    });

    socket.on(
      "chat:message",
      async ({
        conversationId,
        content,
        service,
        senderId,
        senderRole,
        senderName,
        skipAssistant = false
      }) => {
        if (!content) {
          socket.emit("chat:error", {
            message: "Message content is required"
          });
          return;
        }

        try {
          const serviceKey = service ? service.toString().trim() : null;
          let conversation = null;

          if (conversationId) {
            conversation = await prisma.chatConversation.findUnique({
              where: { id: conversationId }
            });
          }

          if (!conversation && serviceKey) {
            conversation = await prisma.chatConversation.findFirst({
              where: { service: serviceKey }
            });
          }

          if (!conversation) {
            conversation = await prisma.chatConversation.create({
              data: {
                service: serviceKey || null,
                createdById: senderId || null
              }
            });
            socket.emit("chat:joined", { conversationId: conversation.id });
          }

          socket.join(conversation.id);

          const userMessage = await prisma.chatMessage.create({
            data: {
              conversationId: conversation.id,
              senderId: senderId || null,
              senderName: senderName || null,
              senderRole: senderRole || null,
              role: "user",
              content
            }
          });

          io.to(conversation.id).emit(
            "chat:message",
            serializeMessage(userMessage)
          );

          if (skipAssistant) return;

          const dbHistory = await prisma.chatMessage.findMany({
            where: { conversationId: conversation.id },
            orderBy: { createdAt: "asc" },
            take: 20
          });

          let assistantReply = null;
          try {
            assistantReply = await generateChatReply({
              message: content,
              service: service || conversation.service || "",
              history: dbHistory.map(toHistoryMessage)
            });
          } catch (error) {
            console.error("Assistant generation failed", error);
            socket.emit("chat:error", {
              message:
                "Assistant is temporarily unavailable. Please continue the chat."
            });
          }

          if (assistantReply) {
            const assistantMessage = await prisma.chatMessage.create({
              data: {
                conversationId: conversation.id,
                senderName: "Assistant",
                senderRole: "assistant",
                role: "assistant",
                content: assistantReply
              }
            });

            io.to(conversation.id).emit(
              "chat:message",
              serializeMessage(assistantMessage)
            );
          }
        } catch (error) {
          console.error("chat:message failed", error);
          socket.emit("chat:error", {
            message: "Unable to send message right now."
          });
        }
      }
    );
  });

  return io;
};
