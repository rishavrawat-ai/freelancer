import { useState, useEffect, useRef, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Send, Loader2, User, Bot, RotateCcw } from "lucide-react";
import { apiClient, SOCKET_IO_URL, SOCKET_OPTIONS, SOCKET_ENABLED } from "@/lib/api-client";
import { useAuth } from "@/context/AuthContext";
import { io } from "socket.io-client";
import ProposalPanel from "./ProposalPanel";

const getMessageStorageKey = (serviceKey) =>
  serviceKey ? `markify:chatMessages:${serviceKey}` : null;

const loadMessagesFromStorage = (key) => {
  if (typeof window === "undefined" || !key) return [];
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

const persistMessagesToStorage = (key, messages) => {
  if (typeof window === "undefined" || !key) return;
  try {
    window.localStorage.setItem(key, JSON.stringify(messages));
  } catch {
    // ignore write errors (quota, private mode, etc.)
  }
};

const ChatDialog = ({ isOpen, onClose, service }) => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [conversationId, setConversationId] = useState(null);
  const safeWindow = typeof window === "undefined" ? null : window;
  const isLocalhost = safeWindow?.location?.hostname === "localhost";
  const [useSocket] = useState(SOCKET_ENABLED && isLocalhost);
  const { user } = useAuth();
  const scrollRef = useRef(null);
  const inputRef = useRef(null);
  const socketRef = useRef(null);
  const serviceKey = service?.title || "Project";
  const messageStorageKey = useMemo(() => getMessageStorageKey(serviceKey), [serviceKey]);

  const formatTime = (value) => {
    if (!value) return "";
    const date = value instanceof Date ? value : new Date(value);
    if (Number.isNaN(date.getTime())) return "";
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  // Start or resume a conversation, persisting the id for the session.
  useEffect(() => {
    if (!isOpen) return;

    let cancelled = false;

    const ensureConversation = async () => {
      try {
        const storageKey = `markify:chatConversationId:${serviceKey}`;
        const stored =
          typeof window !== "undefined" ? window.localStorage.getItem(storageKey) : null;

        if (stored) {
          setConversationId(stored);
          return;
        }

        const conversation = await apiClient.createChatConversation({
          service: serviceKey,
          mode: "assistant",
          // Persist conversations in production; only ephemeral for local dev.
          ephemeral: isLocalhost
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
  }, [isOpen, serviceKey]);

  // Load local chat history for this service if present.
  useEffect(() => {
    if (!isOpen || messages.length > 0) return;
    const stored = loadMessagesFromStorage(messageStorageKey);
    if (stored.length) {
      setMessages(stored);
    }
  }, [isOpen, messages.length, messageStorageKey]);

  // Wire up socket.io for real-time chat.
  useEffect(() => {
    if (!isOpen || !conversationId || !useSocket || !SOCKET_IO_URL) return;

    const socket = io(SOCKET_IO_URL, SOCKET_OPTIONS);
    socketRef.current = socket;

    socket.emit("chat:join", { conversationId, service: service?.title });

    socket.on("chat:joined", (payload) => {
      if (payload?.conversationId) {
        setConversationId(payload.conversationId);
      }
    });

    socket.on("chat:history", (history = []) => {
      const sorted = [...history].sort((a, b) =>
        new Date(a.createdAt || 0) - new Date(b.createdAt || 0)
      );
      setMessages(sorted);
      persistMessagesToStorage(messageStorageKey, sorted);
    });

    socket.on("chat:message", (message) => {
      setIsLoading(message?.role !== "assistant");
      setMessages((prev) => {
        const filtered = prev.filter(
          (msg) =>
            !msg.pending ||
            msg.content !== message?.content ||
            msg.role !== message?.role
        );
        const next = [...filtered, message];
        persistMessagesToStorage(messageStorageKey, next);
        return next;
      });
    });

    socket.on("chat:error", (payload) => {
      console.error("Socket error:", payload);
      setIsLoading(false);
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [conversationId, isOpen, service, useSocket]);

  // Fallback: fetch messages when sockets are disabled/unavailable.
  useEffect(() => {
    if (!isOpen || !conversationId || useSocket) return;

    const load = async () => {
      try {
        const payload = await apiClient.fetchChatMessages(conversationId);
      const nextMessages =
        payload?.data?.messages || payload?.messages || [];
      setMessages(nextMessages);
      persistMessagesToStorage(messageStorageKey, nextMessages);
    } catch (error) {
      console.error("Failed to load messages (HTTP):", error);
    }
  };

  load();
  }, [conversationId, isOpen, useSocket, messageStorageKey]);

  // Seed an opening prompt if there is no history.
  useEffect(() => {
    if (!isOpen || !service || messages.length) return;

    setMessages([
      {
        role: "assistant",
        content: `Hi! I see you're interested in ${service.title}. How can I help you with that?`
      }
    ]);

    queueMicrotask(() => {
      inputRef.current?.focus();
    });
  }, [isOpen, service, messages.length]);

  // Persist any message changes to local storage for this service.
  useEffect(() => {
    if (!messageStorageKey) return;
    persistMessagesToStorage(messageStorageKey, messages);
  }, [messages, messageStorageKey]);

  const handleSend = async (contentOverride) => {
    const msgContent = contentOverride || input;
    if (!msgContent.trim()) return;

    const payload = {
      conversationId,
      content: msgContent,
      service: serviceKey,
      senderId: user?.id || null,
      senderRole: user?.role || null,
      skipAssistant: false,
      mode: "assistant",
      ephemeral: isLocalhost,
      history: messages.slice(-10).map((m) => ({
        role: m.role === "assistant" ? "assistant" : "user",
        content: m.content
      }))
    };

    if (useSocket && socketRef.current) {
      setMessages((prev) => [
        ...prev,
        { ...payload, role: "user", pending: true }
      ]);
      if (!contentOverride) setInput("");
      setIsLoading(true);
      socketRef.current.emit("chat:message", payload);
      queueMicrotask(() => {
        inputRef.current?.focus();
      });
      return;
    }

    // HTTP fallback when sockets are unavailable.
    setMessages((prev) => [
      ...prev,
      { ...payload, role: "user", pending: true }
    ]);
    if (!contentOverride) setInput("");
    setIsLoading(true);
    apiClient
      .sendChatMessage(payload)
      .then((response) => {
        const userMsg =
          response?.data?.message || response?.message || payload;
        const assistant =
          response?.data?.assistant || response?.assistant || null;
        setMessages((prev) => {
          const next = assistant ? [...prev, userMsg, assistant] : [...prev, userMsg];
          persistMessagesToStorage(messageStorageKey, next);
          return next;
        });
      })
      .catch((error) => {
        console.error("Failed to send chat via HTTP:", error);
      })
      .finally(() => {
        setIsLoading(false);
        queueMicrotask(() => inputRef.current?.focus());
      });
  };

  const proposalMessage = useMemo(() => {
    return [...messages].reverse().find(m => m.content && m.content.includes("PROJECT PROPOSAL"));
  }, [messages]);

  const resolveSenderChip = (msg) => {
    if (msg.role === "assistant") return "Assistant";
    if (msg.senderId && user?.id && msg.senderId === user.id) return "You";
    if (msg.senderRole) return msg.senderRole;
    return user?.role === "CLIENT" ? "Freelancer" : "Client";
  };

  useEffect(() => {
    // Auto-scroll to the latest message/loading indicator.
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isLoading, proposalMessage]);

  const handleResetChat = () => {
    const storageKey = `markify:chatConversationId:${serviceKey}`;

    if (typeof window !== "undefined") {
      window.localStorage.removeItem(storageKey);
      window.localStorage.removeItem(messageStorageKey);
    }
    setConversationId(null);
    setMessages([]);
    apiClient.createChatConversation({ service: serviceKey, forceNew: true, mode: "assistant", ephemeral: true }).then(conversation => {
      if (conversation?.id) {
        setConversationId(conversation.id);
        if (typeof window !== "undefined") {
          window.localStorage.setItem(storageKey, conversation.id);
        }
      }
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className={`h-[85vh] flex flex-col overflow-hidden transition-all duration-300 ${proposalMessage ? "max-w-[90vw] lg:max-w-6xl" : "max-w-2xl"}`}>
        <DialogHeader className="flex flex-row items-center justify-between border-b pb-4">
          <div className="space-y-1">
            <DialogTitle>Chat about {service?.title}</DialogTitle>
            <DialogDescription>
              Discuss your requirements and get a proposal.
            </DialogDescription>
          </div>
          <Button variant="outline" size="sm" onClick={handleResetChat} className="gap-2">
            <RotateCcw className="w-4 h-4" />
            New Chat
          </Button>
        </DialogHeader>

        <div className={`flex-1 overflow-hidden grid gap-6 ${proposalMessage ? "lg:grid-cols-[1fr_400px]" : "grid-cols-1"}`}>
          {/* Chat Area */}
          <div className="flex flex-col h-full min-h-0 overflow-hidden">
            <ScrollArea className="flex-1 h-full pr-4">
              <div className="space-y-4 min-w-0 pb-4">
                {messages.map((msg, index) => {
                  const isSelf = msg.senderId && user?.id && msg.senderId === user.id;
                  const isAssistant = msg.role === "assistant";
                  const alignment =
                    isAssistant || !isSelf ? "flex-row" : "flex-row-reverse";

                  const bubbleTone = (() => {
                    if (isAssistant) return "bg-muted text-foreground";
                    if (msg.senderRole === "CLIENT")
                      return "bg-amber-100 text-amber-900 dark:bg-amber-900/20 dark:text-amber-100";
                    if (msg.senderRole === "FREELANCER")
                      return "bg-sky-100 text-sky-900 dark:bg-sky-900/25 dark:text-sky-50";
                    return isSelf
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-foreground";
                  })();

                  // Parse content for suggestions and multi-select
                  const suggestionMatch = msg.content?.match(/\[SUGGESTIONS:\s*([\s\S]*?)\]/i);
                  const suggestions = suggestionMatch ? suggestionMatch[1].split("|").map(s => s.trim()) : [];

                  const multiSelectMatch = msg.content?.match(/\[MULTI_SELECT:\s*([\s\S]*?)\]/i);
                  const multiSelectOptions = multiSelectMatch ? multiSelectMatch[1].split("|").map(s => s.trim()) : [];

                  // Parse proposal data
                  const proposalMatch = msg.content?.match(/\[PROPOSAL_DATA\]([\s\S]*?)\[\/PROPOSAL_DATA\]/);
                  const hasProposal = !!proposalMatch;

                  // Clean content for display
                  let cleanContent = msg.content
                    ?.replace(/\[SUGGESTIONS:[\s\S]*?\]/i, "")
                    .replace(/\[MULTI_SELECT:[\s\S]*?\]/i, "")
                    .replace(/\[PROPOSAL_DATA\][\s\S]*?\[\/PROPOSAL_DATA\]/, "")
                    .trim();

                  if (hasProposal && !cleanContent) {
                    cleanContent = "I've generated a proposal based on your requirements. You can view it in the panel on the right.";
                  }

                  return (
                    <div
                      key={msg.id || index}
                      className={`flex flex-col gap-2 min-w-0 ${isAssistant || !isSelf ? "items-start" : "items-end"}`}
                    >
                      <div className={`flex items-start gap-3 max-w-[85%] ${alignment}`}>
                        <div
                          className={`p-2 rounded-full flex-shrink-0 ${isSelf ? "bg-primary text-primary-foreground" : "bg-muted"
                            }`}
                        >
                          {isAssistant ? (
                            <Bot className="w-4 h-4" />
                          ) : (
                            <User className="w-4 h-4" />
                          )}
                        </div>
                        <div
                          className={`p-3 rounded-lg min-w-0 text-sm break-words overflow-wrap-anywhere hyphens-auto ${bubbleTone}`}
                          style={{
                            wordBreak: "break-word",
                            overflowWrap: "anywhere",
                            whiteSpace: "pre-wrap"
                          }}
                        >
                          <div className="mb-1 text-[10px] uppercase tracking-[0.12em] opacity-70">
                            {resolveSenderChip(msg)}
                            {msg.createdAt ? (
                              <span className="ml-2 lowercase text-[9px] opacity-60">
                                {formatTime(msg.createdAt)}
                              </span>
                            ) : null}
                          </div>
                          {cleanContent || msg.content}
                          {hasProposal && (
                            <Button
                              variant="link"
                              className="p-0 h-auto text-xs mt-2 text-primary underline"
                              onClick={() => {
                                // Logic to ensure panel is open if on mobile/hidden
                              }}
                            >
                              View Proposal
                            </Button>
                          )}
                        </div>
                      </div>

                      {/* Render Single Select Suggestions */}
                      {suggestions.length > 0 && (
                        <div className="flex flex-wrap gap-2 pl-12">
                          {suggestions.map((suggestion, idx) => (
                            <button
                              key={idx}
                              onClick={() => handleSend(suggestion)}
                              className="text-xs bg-primary/10 hover:bg-primary/20 text-primary px-3 py-1.5 rounded-full transition-colors border border-primary/20"
                            >
                              {suggestion}
                            </button>
                          ))}
                        </div>
                      )}

                      {/* Render Multi-Select Options */}
                      {multiSelectOptions.length > 0 && (
                        <div className="flex flex-col gap-2 pl-12 w-full max-w-sm">
                          <div className="flex flex-wrap gap-2">
                            {multiSelectOptions.map((option, idx) => {
                              const currentSelections = input ? input.split(",").map(s => s.trim()).filter(Boolean) : [];
                              const isSelected = currentSelections.includes(option);

                              return (
                                <button
                                  key={idx}
                                  onClick={() => {
                                    let next;
                                    if (isSelected) {
                                      next = currentSelections.filter(c => c !== option);
                                    } else {
                                      next = [...currentSelections, option];
                                    }
                                    setInput(next.join(", "));
                                    inputRef.current?.focus();
                                  }}
                                  className={`text-xs px-3 py-1.5 rounded-full transition-colors border ${isSelected
                                    ? "bg-primary text-primary-foreground border-primary"
                                    : "bg-background hover:bg-muted border-input"
                                    }`}
                                >
                                  {option}
                                </button>
                              );
                            })}
                          </div>
                          {input && multiSelectOptions.length > 0 && (
                            <Button
                              size="sm"
                              className="self-start mt-1"
                              onClick={() => handleSend()}
                            >
                              Done
                            </Button>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
                {isLoading && (
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-full bg-muted">
                      <Bot className="w-4 h-4" />
                    </div>
                    <div className="p-3 rounded-lg bg-muted">
                      <Loader2 className="w-4 h-4 animate-spin" />
                    </div>
                  </div>
                )}
                <div ref={scrollRef} />
              </div>
            </ScrollArea>

            <div className="pt-4 border-t mt-auto">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSend();
                }}
                className="flex w-full items-center space-x-2"
              >
                <Input
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Type your message..."
                  disabled={!conversationId}
                />
                <Button type="submit" size="icon" disabled={isLoading || !input.trim()}>
                  <Send className="w-4 h-4" />
                </Button>
              </form>
            </div>
          </div>

          {/* Proposal Panel */}
          {proposalMessage && (
            <div className="h-full min-h-0 border-l pl-6 hidden lg:block overflow-hidden">
              <ProposalPanel content={proposalMessage.content} />
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ChatDialog;
