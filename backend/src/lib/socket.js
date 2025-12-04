import { Server } from "socket.io";
import { env } from "../config/env.js";
import { prisma } from "./prisma.js";
import { generateChatReply } from "../controllers/chat.controller.js";
import {
  ensureConversation,
  createConversation as createInMemoryConversation,
  addMessage,
  listMessages,
  getConversation
} from "./chat-store.js";

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
  "http://localhost:5173",
  "http://localhost:5174"
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
  const corsOrigins =
    allowedOrigins.includes("*") || allowedOrigins.length === 0
      ? true
      : allowedOrigins;

  const conversationPresence = new Map(); // conversationId -> Set<userId>

  const io = new Server(server, {
    path: env.SOCKET_IO_PATH || "/socket.io",
    cors: {
      origin: corsOrigins,
      credentials: true
    }
  });

  io.on("connection", (socket) => {
    const joinedConversations = new Set();
    const presenceKeys = new Map(); // conversationId -> userKey

    const broadcastPresence = (conversationId) => {
      const set = conversationPresence.get(conversationId) || new Set();
      const online = Array.from(set);
      io.to(conversationId).emit("chat:presence", {
        conversationId,
        online
      });
    };

    socket.on("chat:join", async ({ conversationId, service, senderId }) => {
      try {
        const serviceKey = service ? service.toString().trim() : null;
        let useMemory = false;
        let conversation = getConversation(conversationId);
        if (conversation) {
          useMemory = true;
        }

        if (!conversation && conversationId) {
          conversation = await prisma.chatConversation.findUnique({
            where: { id: conversationId }
          });
        }

        if (!conversation) {
          if (serviceKey) {
            const candidates = await prisma.chatConversation.findMany({
              where: { service: serviceKey },
              include: {
                _count: { select: { messages: true } }
              },
              orderBy: { updatedAt: "desc" }
            });
            conversation = candidates.find(c => c._count.messages > 0) || candidates[0];
          }
        }

        if (!conversation) {
          // Default to persisted conversation for client/freelancer chat.
          conversation = await prisma.chatConversation.create({
            data: { service: serviceKey || null, createdById: senderId || null }
          });
        }

        socket.join(conversation.id);
        socket.emit("chat:joined", { conversationId: conversation.id });
        joinedConversations.add(conversation.id);

        // Track presence
        const userKey = senderId || socket.id;
        const set = conversationPresence.get(conversation.id) || new Set();
        set.add(userKey);
        conversationPresence.set(conversation.id, set);
        presenceKeys.set(conversation.id, userKey);
        broadcastPresence(conversation.id);

        const history = useMemory
          ? listMessages(conversation.id, 100)
          : await prisma.chatMessage.findMany({
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
          const memoryConversation = getConversation(conversationId);
          const useMemory = !skipAssistant || Boolean(memoryConversation);

          // Ephemeral AI chat path
          if (useMemory) {
            let conversation = ensureConversation({
              id: conversationId,
              service: serviceKey || null,
              createdById: senderId || null
            });

            if (!conversationId) {
              socket.emit("chat:joined", { conversationId: conversation.id });
            }

            socket.join(conversation.id);

            const userMessage = addMessage({
              conversationId: conversation.id,
              senderId: senderId || null,
              senderName: senderName || null,
              senderRole: senderRole || null,
              role: "user",
              content
            });

            io.to(conversation.id).emit(
              "chat:message",
              serializeMessage(userMessage)
            );

            if (skipAssistant) return;

            const dbHistory = listMessages(conversation.id, 20);

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
              const assistantMessage = addMessage({
                conversationId: conversation.id,
                senderName: "Assistant",
                senderRole: "assistant",
                role: "assistant",
                content: assistantReply
              });

              io.to(conversation.id).emit(
                "chat:message",
                serializeMessage(assistantMessage)
              );
            }
            return;
          }

          // Persisted client/freelancer chat path
          let conversation = null;

          if (conversationId) {
            conversation = await prisma.chatConversation.findUnique({
              where: { id: conversationId }
            });
          }

          if (!conversation) {
            if (serviceKey) {
              const candidates = await prisma.chatConversation.findMany({
                where: { service: serviceKey },
                include: {
                  _count: { select: { messages: true } }
                },
                orderBy: { updatedAt: "desc" }
              });
              conversation = candidates.find(c => c._count.messages > 0) || candidates[0];
            }
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
        } catch (error) {
          console.error("chat:message failed", error);
          socket.emit("chat:error", {
            message: "Unable to send message right now."
          });
        }
      }
    );

    socket.on(
      "chat:typing",
      ({ conversationId, typing = true, userId, userName }) => {
        if (!conversationId) return;
        socket.to(conversationId).emit("chat:typing", {
          conversationId,
          typing,
          userId: userId || socket.id,
          userName
        });
      }
    );

    socket.on("disconnect", () => {
      joinedConversations.forEach((conversationId) => {
        const set = conversationPresence.get(conversationId);
        if (!set) return;
        const key = presenceKeys.get(conversationId) || socket.id;
        set.delete(key);
        if (set.size === 0) {
          conversationPresence.delete(conversationId);
        } else {
          conversationPresence.set(conversationId, set);
        }
        broadcastPresence(conversationId);
      });
    });
  });

  return io;
};
