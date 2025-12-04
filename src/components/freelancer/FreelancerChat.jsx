"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { io } from "socket.io-client";
import { RoleAwareSidebar } from "@/components/dashboard/RoleAwareSidebar";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FreelancerTopBar } from "@/components/freelancer/FreelancerTopBar";
import { SendHorizontal, Paperclip, Loader2, Clock4 } from "lucide-react";
import { apiClient, SOCKET_IO_URL, SOCKET_OPTIONS, SOCKET_ENABLED } from "@/lib/api-client";
import { useAuth } from "@/context/AuthContext";

const SERVICE_LABEL = "Project Chat";

const formatTime = (value) => {
  if (!value) return "";
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
};

const ChatArea = ({
  conversationName,
  messages,
  messageInput,
  onMessageInputChange,
  onSendMessage,
  sending,
  currentUser,
  typingUsers,
  online
}) => {
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      onSendMessage();
    }
  };

  return (
    <div className="flex h-full flex-1 flex-col overflow-hidden rounded-3xl border border-border/40 bg-gradient-to-br from-background to-background/70">
      <div className="sticky top-0 z-10 flex items-center gap-4 border-b border-border/40 bg-card/60 px-8 py-5 backdrop-blur-xl">
        <div className="relative">
          <Avatar className="h-12 w-12">
            <AvatarImage src={"/placeholder.svg"} alt={conversationName} />
            <AvatarFallback className="bg-primary/20 text-primary">
              {conversationName?.[0] || "C"}
            </AvatarFallback>
          </Avatar>
          <span
            className={`absolute -bottom-1 -right-1 h-3 w-3 rounded-full border-2 border-card ${
              online ? "bg-emerald-500" : "bg-muted-foreground/40"
            }`}
            aria-label={online ? "Online" : "Offline"}
          />
        </div>
        <div>
          <p className="text-lg font-semibold">{conversationName}</p>
          <p className="text-xs text-muted-foreground">{online ? "Online" : "Offline"}</p>
        </div>
        <Badge variant="outline" className="ml-auto">
          Live
        </Badge>
      </div>

      <div className="flex-1 space-y-3 overflow-y-auto overflow-x-hidden px-6 py-4">
        {messages.map((message, index) => {
          const isSelf = message.senderId && currentUser?.id && message.senderId === currentUser.id;
          const isAssistant = message.role === "assistant";
          const align = isAssistant || !isSelf ? "justify-start" : "justify-end";
          const isDeleted = message.deleted || message.isDeleted;
          const isClient = message.senderRole === "CLIENT";
          const isFreelancer = message.senderRole === "FREELANCER";

          const bubbleStyle = (() => {
            if (isAssistant) {
              return {
                backgroundColor: "var(--chat-bubble-assistant)",
                color: "var(--chat-bubble-assistant-text)",
                border: `1px solid var(--chat-bubble-border)`
              };
            }
            if (isDeleted) {
              return {
                backgroundColor: "var(--chat-bubble-assistant)",
                color: "var(--chat-bubble-assistant-text)",
                border: `1px solid var(--chat-bubble-border)`
              };
            }
            if (isClient) {
              return {
                backgroundColor: "var(--chat-bubble-client)",
                color: "var(--chat-bubble-client-text)",
                border: `1px solid var(--chat-bubble-border)`
              };
            }
            if (isFreelancer) {
              return {
                backgroundColor: "var(--chat-bubble-freelancer)",
                color: "var(--chat-bubble-freelancer-text)",
                border: `1px solid var(--chat-bubble-border)`
              };
            }
            if (isSelf) {
              return {
                backgroundColor: "var(--chat-bubble-self)",
                color: "var(--chat-bubble-self-text)",
                border: `1px solid var(--chat-bubble-border)`
              };
            }
            return {
              backgroundColor: "var(--chat-bubble-assistant)",
              color: "var(--chat-bubble-assistant-text)",
              border: `1px solid var(--chat-bubble-border)`
            };
          })();

          return (
            <div key={message.id || index} className={`flex ${align}`}>
              <div
                className="max-w-[85%] md:max-w-[85%] rounded-sm px-4 py-1.5 text-sm flex items-baseline gap-2 overflow-hidden"
                style={bubbleStyle}
                role="group"
              >
                {isDeleted ? (
                  <>
                    <Clock4 className="h-4 w-4 flex-shrink-0 opacity-70" />
                    <span className="italic text-foreground/90 flex-1">
                      {isSelf ? "You deleted this message." : "This message was deleted."}
                    </span>
                  </>
                ) : (
                  <p
                    className="leading-relaxed whitespace-pre-wrap flex-1"
                    style={{
                      overflowWrap: "break-word",
                      wordBreak: "break-all"
                    }}
                  >
                    {message.content}
                  </p>
                )}
                {message.createdAt ? (
                  <span className="text-[10px] lowercase opacity-70 whitespace-nowrap">
                    {formatTime(message.createdAt)}
                  </span>
                ) : null}
              </div>
            </div>
          );
        })}
        {typingUsers.length > 0 ? (
          <div className="flex justify-start">
            <div className="max-w-[60%] rounded-sm border border-border/60 bg-card/70 px-3 py-2 text-xs text-muted-foreground flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>
                {typingUsers[0]} {typingUsers.length > 1 ? "and others" : ""} typing...
              </span>
            </div>
          </div>
        ) : null}
        <div ref={messagesEndRef} />
      </div>

      <div className="border-t border-border/40 px-6 py-5">
        <div className="flex items-center gap-3 rounded-full bg-card/60 px-4 py-2">
          <Button
            variant="ghost"
            size="icon"
            className="rounded-full hover:bg-muted"
            type="button"
            disabled
            title="Attachments coming soon"
          >
            <Paperclip className="h-5 w-5 text-muted-foreground" />
          </Button>
          <Input
            placeholder="Type a message..."
            value={messageInput}
            onChange={(event) => onMessageInputChange(event.target.value)}
            onKeyDown={handleKeyPress}
            className="border-none bg-transparent focus-visible:ring-0"
            disabled={sending}
          />
          <Button
            onClick={onSendMessage}
            size="icon"
            className="rounded-full bg-primary"
            disabled={sending || !messageInput.trim()}
          >
            <SendHorizontal className="h-5 w-5 text-primary-foreground" />
          </Button>
        </div>
      </div>
    </div>
  );
};

const FreelancerChatContent = () => {
  const { user, authFetch } = useAuth();
  const [conversationId, setConversationId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [messageInput, setMessageInput] = useState("");
  const [sending, setSending] = useState(false);
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [useSocket, setUseSocket] = useState(SOCKET_ENABLED);
  const socketRef = useRef(null);
  const pollRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const [typingUsers, setTypingUsers] = useState([]);
  const [online, setOnline] = useState(false);

  const stopPolling = () => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  };

  const fetchMessages = async () => {
    if (!conversationId) return;
    try {
      const payload = await apiClient.fetchChatMessages(conversationId);
      const nextMessages =
        payload?.data?.messages || payload?.messages || [];
      setMessages(nextMessages);
    } catch (error) {
      console.error("Failed to fetch messages:", error);
    }
  };

  const emitTyping = () => {
    if (!useSocket || !socketRef.current || !conversationId) return;
    const payload = {
      conversationId,
      typing: true,
      userId: user?.id || socketRef.current.id,
      userName: user?.fullName || user?.name || user?.email || "Someone"
    };
    socketRef.current.emit("chat:typing", payload);
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    typingTimeoutRef.current = setTimeout(() => {
      socketRef.current?.emit("chat:typing", {
        ...payload,
        typing: false
      });
    }, 1500);
  };

  const startPolling = () => {
    stopPolling();
    fetchMessages();
    pollRef.current = setInterval(fetchMessages, 5000);
  };

  // Reset state when switching conversation to avoid cross-chat bleed.
  useEffect(() => {
    setConversationId(null);
    setMessages([]);
    setTypingUsers([]);
    setOnline(false);
  }, [selectedConversation?.serviceKey, selectedConversation?.id]);

  // Load clients that have sent proposals/own projects for this freelancer
  useEffect(() => {
    let cancelled = false;
    const loadConversations = async () => {
      if (!authFetch) return;
      try {
        const response = await authFetch("/proposals?as=freelancer");
        const payload = await response.json().catch(() => null);
        const items = Array.isArray(payload?.data) ? payload.data : [];

        const uniq = [];
        const seen = new Set();
        for (const item of items) {
          const owner = item.project?.owner;
          if (!owner?.id) continue;
          if (seen.has(owner.id)) continue;
          seen.add(owner.id);
          const sharedKey = `CHAT:${owner.id}:${user?.id || "freelancer"}`;
          uniq.push({
            id: owner.id,
            name: owner.fullName || owner.name || owner.email || "Client",
            avatar:
              owner.avatar ||
              "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=256&q=80",
            label: item.project?.title || "Client Project",
            serviceKey: sharedKey
          });
        }

        const fallback = [
          {
            id: "assistant",
            name: "Project Assistant",
            avatar: "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=256&q=80",
            label: "General Assistant",
            serviceKey: "assistant"
          }
        ];

        const finalList = uniq.length ? uniq : fallback;
        if (!cancelled) {
          setConversations(finalList);
          setSelectedConversation(finalList[0]);
        }
      } catch (error) {
        console.error("Failed to load conversations:", error);
        setConversations([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    loadConversations();
    return () => {
      cancelled = true;
    };
  }, [authFetch]);

  useEffect(() => {
    if (!selectedConversation) return;
    let cancelled = false;

    const ensureConversation = async () => {
      const storageKey = `markify:chatConversationId:${selectedConversation.serviceKey || selectedConversation.id}`;
      try {
        const stored =
          typeof window !== "undefined" ? window.localStorage.getItem(storageKey) : null;
        if (stored) {
          setConversationId(stored);
          return;
        }
        const conversation = await apiClient.createChatConversation({
          service: selectedConversation.serviceKey || selectedConversation.label || SERVICE_LABEL
        });
        if (!cancelled && conversation?.id) {
          setConversationId(conversation.id);
          if (typeof window !== "undefined") {
            window.localStorage.setItem(storageKey, conversation.id);
          }
        }
      } catch (error) {
        console.error("Failed to start chat conversation:", error);
      }
    };
    ensureConversation();

    return () => {
      cancelled = true;
    };
  }, [selectedConversation]);

  useEffect(() => {
    if (!conversationId || !selectedConversation) return;

    const storageKey = `markify:chatConversationId:${selectedConversation.serviceKey || selectedConversation.id}`;
    const socket = useSocket && SOCKET_IO_URL ? io(SOCKET_IO_URL, SOCKET_OPTIONS) : null;
    socketRef.current = socket;

    if (!socket) {
      startPolling();
      return () => stopPolling();
    }

    socket.emit("chat:join", {
      conversationId,
      service: selectedConversation.serviceKey || selectedConversation.label || SERVICE_LABEL,
      senderId: user?.id || null
    });

    socket.on("chat:joined", (payload) => {
      if (payload?.conversationId) {
        setConversationId(payload.conversationId);
        if (typeof window !== "undefined") {
          window.localStorage.setItem(storageKey, payload.conversationId);
        }
      }
    });

    socket.on("chat:history", (history = []) => {
      const sorted = [...history].sort(
        (a, b) => new Date(a.createdAt || 0) - new Date(b.createdAt || 0)
      );
      setMessages(sorted);
    });

    socket.on("chat:message", (message) => {
      setSending(message?.role !== "assistant");
      setMessages((prev) => {
        const filtered = prev.filter(
          (msg) =>
            !msg.pending ||
            msg.content !== message?.content ||
            msg.role !== message?.role
        );
        return [...filtered, message];
      });
    });

    socket.on("chat:error", (payload) => {
      console.error("Socket error:", payload);
      setSending(false);
    });

    socket.on("chat:typing", ({ conversationId: cid, typing, userId: uid, userName }) => {
      if (!cid || cid !== conversationId) return;
      if (uid && user?.id && uid === user.id) return;
      setTypingUsers((prev) => {
        const existing = new Map(prev.map((u) => [u.id, u.name]));
        if (typing) {
          existing.set(uid || userName || "unknown", userName || "Someone");
        } else {
          existing.delete(uid || userName || "unknown");
        }
        return Array.from(existing.entries()).map(([id, name]) => ({
          id,
          name
        }));
      });
    });

    socket.on("chat:presence", ({ conversationId: cid, online: list = [] }) => {
      if (!cid || cid !== conversationId) return;
      setOnline(Array.isArray(list) && list.length > 0);
    });

    socket.on("connect_error", (error) => {
      console.error("Socket connection error:", error?.message || error);
      setUseSocket(false);
      stopPolling();
      startPolling();
      socket.disconnect();
    });

    return () => {
      stopPolling();
      if (socket) {
        socket.disconnect();
      }
      socketRef.current = null;
    };
  }, [conversationId, selectedConversation, useSocket, user?.id]);

  const handleSendMessage = () => {
    if (!messageInput.trim()) return;

    const payload = {
      content: messageInput,
      service: selectedConversation?.serviceKey || selectedConversation?.label || SERVICE_LABEL,
      senderId: user?.id || null,
      senderRole: user?.role || "GUEST",
      senderName: user?.fullName || user?.name || user?.email || "Freelancer",
      skipAssistant: true
    };

    setMessages((prev) => [
      ...prev,
      { ...payload, role: "user", pending: true }
    ]);
    setMessageInput("");
    setSending(true);
    if (useSocket && socketRef.current) {
      socketRef.current.emit("chat:message", payload);
    } else {
      apiClient
        .sendChatMessage({ ...payload, conversationId })
        .then((response) => {
          const userMsg =
            response?.data?.message || response?.message || payload;
          const assistant =
            response?.data?.assistant || response?.assistant || null;
          setMessages((prev) =>
            assistant ? [...prev, userMsg, assistant] : [...prev, userMsg]
          );
        })
        .catch((error) => {
          console.error("Failed to send message via HTTP:", error);
        })
        .finally(() => setSending(false));
    }
  };

  const handleInputChange = (value) => {
    setMessageInput(value);
    emitTyping();
  };

  const activeMessages = useMemo(() => messages, [messages]);

  return (
    <div className="flex h-screen flex-col gap-4 overflow-hidden p-2">
      <FreelancerTopBar />

      <div className="grid h-full gap-4 overflow-hidden lg:grid-cols-[320px_minmax(0,1fr)]">
        <Card className="border border-border/50 bg-card/70">
          <CardContent className="flex h-full flex-col gap-4 overflow-hidden p-4">
            <div className="flex items-center justify-between border-b border-border/40 pb-4">
              <p className="text-xs uppercase tracking-[0.32em] text-muted-foreground">
                Conversations
              </p>
              {selectedConversation?.name ? (
                <p className="text-lg font-semibold">{selectedConversation.name}</p>
              ) : null}
            </div>
            <div className="flex-1 space-y-3 overflow-y-auto pr-1">
              {loading ? (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" /> Loading chats...
                </div>
              ) : conversations.length === 0 ? (
                <div className="text-sm text-muted-foreground">
                  No conversations yet.
                </div>
              ) : (
                conversations.map((conversation) => {
                  const isActive =
                    (conversation.serviceKey || conversation.id) ===
                    (selectedConversation?.serviceKey || selectedConversation?.id);
                  const nameClass = isActive ? "text-neutral-900" : "text-foreground";
                  const labelClass = isActive ? "text-neutral-800" : "text-muted-foreground";
                  return (
                    <button
                      key={conversation.serviceKey || conversation.id}
                      onClick={() => setSelectedConversation(conversation)}
                      className={`flex w-full items-center gap-3 rounded-2xl border px-4 py-3 text-left transition ${
                        isActive
                        ? "border-primary/40 bg-primary"
                        : "border-border/50 hover:border-primary/30"
                      }`}
                    >
                      <Avatar className="h-10 w-10">
                        <AvatarImage
                          src={conversation.avatar || "/placeholder.svg"}
                          alt={conversation.name}
                        />
                        <AvatarFallback className="bg-primary/30 text-primary">
                          {conversation.name?.[0] || "C"}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex flex-1 flex-col">
                        <p className={`font-semibold ${nameClass}`}>{conversation.name}</p>
                        <p className={`text-xs line-clamp-1 ${labelClass}`}>
                          {conversation.label || SERVICE_LABEL}
                        </p>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </CardContent>
        </Card>

        <ChatArea
          conversationName={selectedConversation?.label || SERVICE_LABEL}
          messages={activeMessages}
          messageInput={messageInput}
          onMessageInputChange={handleInputChange}
          onSendMessage={handleSendMessage}
          sending={sending}
          currentUser={user}
          typingUsers={typingUsers.map((u) => u.name)}
          online={online}
        />
      </div>
    </div>
  );
};

const FreelancerChat = () => {
  return (
    <RoleAwareSidebar>
      <FreelancerChatContent />
    </RoleAwareSidebar>
  );
};

export default FreelancerChat;
