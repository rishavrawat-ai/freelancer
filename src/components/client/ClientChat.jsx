"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { io } from "socket.io-client";
import { RoleAwareSidebar } from "@/components/dashboard/RoleAwareSidebar";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ClientTopBar } from "@/components/client/ClientTopBar";
import { SendHorizontal, Paperclip, Bot, User, Loader2, Clock4 } from "lucide-react";
import { apiClient, SOCKET_IO_URL } from "@/lib/api-client";
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
  currentUser
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
        <Avatar className="h-12 w-12">
          <AvatarImage src={"/placeholder.svg"} alt={conversationName} />
          <AvatarFallback className="bg-primary/20 text-primary">
            {conversationName?.[0] || "C"}
          </AvatarFallback>
        </Avatar>
        <div>
          <p className="text-lg font-semibold">{conversationName}</p>
          <p className="text-xs text-muted-foreground">Active</p>
        </div>
        <Badge variant="outline" className="ml-auto">
          Live
        </Badge>
      </div>

      <div className="flex-1 space-y-3 overflow-y-auto px-6 py-4">
        {messages.map((message, index) => {
          const isSelf = message.senderId && currentUser?.id && message.senderId === currentUser.id;
          const isAssistant = message.role === "assistant";
          const align = isAssistant || !isSelf ? "justify-start" : "justify-end";
          const isDeleted = message.deleted || message.isDeleted;
          const bubbleTone = (() => {
            if (isAssistant) return "border border-border/60 bg-card text-foreground";
            if (isDeleted) return "bg-emerald-800/40 text-emerald-50 border border-emerald-600/40";
            if (message.senderRole === "CLIENT")
              return "bg-amber-100 text-amber-900 dark:bg-amber-900/20 dark:text-amber-100";
            if (message.senderRole === "FREELANCER")
              return "bg-sky-100 text-sky-900 dark:bg-sky-900/25 dark:text-sky-50";
            return isSelf
              ? "bg-gradient-to-br from-primary to-primary/70 text-primary-foreground shadow-lg shadow-primary/30"
              : "border border-border/50 bg-card text-foreground";
          })();

          return (
            <div key={message.id || index} className={`flex ${align}`}>
              <div className={`max-w-sm rounded-sm px-4 py-1.5 text-sm flex items-baseline gap-2 ${bubbleTone}`}>
                {isDeleted ? (
                  <>
                    <Clock4 className="h-4 w-4 flex-shrink-0 opacity-70" />
                    <span className="italic text-foreground/90 flex-1">
                      {isSelf ? "You deleted this message." : "This message was deleted."}
                    </span>
                  </>
                ) : (
                  <p className="leading-relaxed whitespace-pre-wrap break-words flex-1">
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

const ClientChatContent = () => {
  const { user, authFetch } = useAuth();
  const [conversationId, setConversationId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [messageInput, setMessageInput] = useState("");
  const [sending, setSending] = useState(false);
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [loading, setLoading] = useState(true);
  const socketRef = useRef(null);

  // Load freelancers you've engaged with (from proposals as owner)
  useEffect(() => {
    let cancelled = false;
    const loadConversations = async () => {
      if (!authFetch) return;
      try {
        const response = await authFetch("/proposals?as=owner");
        const payload = await response.json().catch(() => null);
        const items = Array.isArray(payload?.data) ? payload.data : [];

        const uniq = [];
        const seen = new Set();
        for (const item of items) {
          const freelancer = item.freelancer;
          if (!freelancer?.id) continue;
          if (seen.has(freelancer.id)) continue;
          seen.add(freelancer.id);
          const clientId = user?.id || "client";
          const sharedKey = `CHAT:${clientId}:${freelancer.id}`;

          uniq.push({
            id: freelancer.id,
            name: freelancer.fullName || freelancer.name || freelancer.email || "Freelancer",
            avatar:
              freelancer.avatar ||
              "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=256&q=80",
            label: `Project with ${freelancer.fullName || freelancer.email || "Freelancer"}`,
            serviceKey: sharedKey
          });
        }

        const fallback = [
          {
            id: "assistant",
            name: "Project Assistant",
            avatar:
              "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=256&q=80",
            label: "General Assistant",
            serviceKey: "CHAT:assistant"
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
  }, [authFetch, user?.id]);

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
    const socket = io(SOCKET_IO_URL, { transports: ["websocket"] });
    socketRef.current = socket;

    socket.emit("chat:join", {
      conversationId,
      service: selectedConversation.serviceKey || selectedConversation.label || SERVICE_LABEL
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

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [conversationId, selectedConversation]);

  const handleSendMessage = () => {
    if (!messageInput.trim() || !socketRef.current) return;

    const payload = {
      conversationId,
      content: messageInput,
      service: selectedConversation?.serviceKey || selectedConversation?.label || SERVICE_LABEL,
      senderId: user?.id || null,
      senderRole: user?.role || "GUEST",
      senderName: user?.fullName || user?.name || user?.email || "Client",
      skipAssistant: true
    };

    setMessages((prev) => [...prev, { ...payload, role: "user", pending: true }]);
    setMessageInput("");
    setSending(true);
    socketRef.current.emit("chat:message", payload);
  };

  const activeMessages = useMemo(() => messages, [messages]);

  return (
    <div className="flex h-screen flex-col gap-6 overflow-hidden p-6">
      <ClientTopBar />

      <div className="grid h-full gap-6 overflow-hidden lg:grid-cols-[360px_minmax(0,1fr)]">
        <Card className="border border-border/30 bg-[#0a0d12] shadow-lg shadow-black/40">
          <CardContent className="flex h-full flex-col gap-3 overflow-hidden p-4">
            <div className="flex items-center gap-2 rounded-lg bg-slate-900/70 px-3 py-2">
              <Input
                placeholder="Search or start new chat"
                className="border-none bg-transparent text-sm focus-visible:ring-0"
                disabled
              />
            </div>
            <div className="text-xs uppercase tracking-[0.28em] text-muted-foreground px-1">
              Chats
            </div>
            <div className="flex-1 space-y-2 overflow-y-auto pr-1">
              {loading ? (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" /> Loading chats...
                </div>
              ) : conversations.length === 0 ? (
                <div className="text-sm text-muted-foreground">No conversations yet.</div>
              ) : (
                conversations.map((conversation) => {
                  const isActive = conversation.id === selectedConversation?.id;
                  const timeLabel = "";
                  const unread = conversation.unreadCount || 0;
                  const lastPreview = conversation.label || SERVICE_LABEL;
                  return (
                    <button
                      key={conversation.id}
                      onClick={() => setSelectedConversation(conversation)}
                      className={`flex w-full items-center gap-3 rounded-2xl px-3 py-2 text-left transition ${
                        isActive
                          ? "bg-emerald-500/10 ring-1 ring-emerald-400/40"
                          : "hover:bg-slate-900/60"
                      }`}
                    >
                      <Avatar className="h-11 w-11">
                        <AvatarImage
                          src={conversation.avatar || "/placeholder.svg"}
                          alt={conversation.name}
                        />
                        <AvatarFallback className="bg-primary/20 text-primary">
                          {conversation.name?.[0] || "C"}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex flex-1 flex-col min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="truncate text-sm font-semibold uppercase">
                            {conversation.name}
                          </p>
                          <span className="ml-auto text-[11px] font-semibold text-emerald-400">
                            {timeLabel}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <p className="truncate text-xs text-muted-foreground">
                            {lastPreview}
                          </p>
                          {unread > 0 ? (
                            <span className="ml-auto rounded-full bg-emerald-500 px-2 py-[2px] text-[11px] font-semibold text-emerald-950">
                              {unread}
                            </span>
                          ) : null}
                        </div>
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
          onMessageInputChange={setMessageInput}
          onSendMessage={handleSendMessage}
          sending={sending}
          currentUser={user}
        />
      </div>
    </div>
  );
};

const ClientChat = () => (
  <RoleAwareSidebar>
    <ClientChatContent />
  </RoleAwareSidebar>
);

export default ClientChat;
