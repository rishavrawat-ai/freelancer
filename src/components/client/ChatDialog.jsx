import { useState, useEffect, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Send, Loader2, User, Bot } from "lucide-react";
import { apiClient, SOCKET_IO_URL } from "@/lib/api-client";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/context/AuthContext";
import { useNavigate } from "react-router-dom";
import { io } from "socket.io-client";

const ChatDialog = ({ isOpen, onClose, service }) => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [savedProposal, setSavedProposal] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editedText, setEditedText] = useState("");
  const [isProposalModalOpen, setIsProposalModalOpen] = useState(false);
  const [conversationId, setConversationId] = useState(null);
  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();
  const scrollRef = useRef(null);
  const inputRef = useRef(null);
  const socketRef = useRef(null);
  const serviceKey = service?.title || "Project";

  const formatTime = (value) => {
    if (!value) return "";
    const date = value instanceof Date ? value : new Date(value);
    if (Number.isNaN(date.getTime())) return "";
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  const persistSavedProposalToStorage = (proposal) => {
    if (typeof window === "undefined" || !proposal) return;
    const payload = {
      content: proposal.content || proposal,
      service: proposal.service || service?.title || "Project",
      createdAt: proposal.createdAt || new Date().toISOString(),
      projectTitle:
        proposal.projectTitle || proposal.service || service?.title || "Proposal",
      preparedFor: proposal.preparedFor || proposal.name || "Client",
      budget: proposal.budget || null,
      summary:
        proposal.summary ||
        (typeof proposal === "string" ? proposal : proposal.content) ||
        ""
    };
    window.localStorage.setItem("markify:savedProposal", JSON.stringify(payload));
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
          service: serviceKey
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

  // Wire up socket.io for real-time chat.
  useEffect(() => {
    if (!isOpen || !conversationId) return;

    const socket = io(SOCKET_IO_URL, {
      transports: ["websocket"]
    });
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
        return [...filtered, message];
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
  }, [conversationId, isOpen, service]);

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

  const handleSend = async () => {
    if (!input.trim()) return;
    if (!socketRef.current) {
      console.warn("Chat socket not ready");
      return;
    }

    const payload = {
      conversationId,
      content: input,
      service: serviceKey,
      senderId: user?.id || null,
      senderRole: user?.role || "GUEST"
    };

    setMessages((prev) => [
      ...prev,
      { ...payload, role: "user", pending: true }
    ]);
    setInput("");
    setIsLoading(true);
    socketRef.current.emit("chat:message", payload);
    queueMicrotask(() => {
      inputRef.current?.focus();
    });
  };

  const latestProposalMessage =
    messages
      .slice()
      .reverse()
      .find(
        (msg) =>
          msg.role === "assistant" &&
          (msg.content?.includes("Quick Proposal") ||
            msg.content?.includes("PROJECT PROPOSAL") ||
            msg.content?.includes("Scope") ||
            msg.content?.includes("Budget"))
      ) || null;

  const handleEditProposal = () => {
    if (latestProposalMessage?.content) {
      setEditedText(latestProposalMessage.content);
      setIsEditing(true);
    }
  };

  const handleSaveProposal = () => {
    if (latestProposalMessage?.content) {
      const proposalPayload = {
        content: latestProposalMessage.content,
        service: service?.title || "Project",
        createdAt: new Date().toISOString()
      };
      setSavedProposal(latestProposalMessage.content);
      persistSavedProposalToStorage(proposalPayload);
      if (!isAuthenticated) {
        navigate("/login");
        return;
      }
      navigate("/client/proposal");
    }
  };

  const applyEdit = () => {
    if (!latestProposalMessage || !editedText.trim()) {
      setIsEditing(false);
      return;
    }
    const nextMessages = messages.map((msg) =>
      msg === latestProposalMessage ? { ...msg, content: editedText } : msg
    );
    setMessages(nextMessages);
    setSavedProposal(editedText);
    setIsEditing(false);
  };

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
  }, [messages, isLoading, latestProposalMessage]);

  useEffect(() => {
    if (latestProposalMessage?.content) {
      setIsProposalModalOpen(true);
    }
  }, [latestProposalMessage]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px] h-[600px] flex flex-col overflow-hidden">
        <DialogHeader>
          <DialogTitle>Chat about {service?.title}</DialogTitle>
          <DialogDescription>
            Discuss your requirements and get a proposal.
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="flex-1 pr-4 overflow-y-auto">
          <div className="space-y-4 min-w-0">
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

              return (
                <div
                  key={msg.id || index}
                  className={`flex items-start gap-3 min-w-0 ${alignment}`}
                >
                  <div
                    className={`p-2 rounded-full ${
                      isSelf ? "bg-primary text-primary-foreground" : "bg-muted"
                    }`}
                  >
                    {isAssistant ? (
                      <Bot className="w-4 h-4" />
                    ) : (
                      <User className="w-4 h-4" />
                    )}
                  </div>
                  <div
                    className={`p-3 rounded-lg max-w-[80%] min-w-0 text-sm break-words overflow-wrap-anywhere hyphens-auto ${bubbleTone}`}
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
                    {msg.content}
                  </div>
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

        <DialogFooter className="pt-4">
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
        </DialogFooter>
      </DialogContent>
      <Dialog open={isProposalModalOpen} onOpenChange={setIsProposalModalOpen}>
        <DialogContent className="sm:max-w-[520px]">
          <DialogHeader>
            <DialogTitle>Proposal ready</DialogTitle>
            <DialogDescription>
              Review, edit, or save this proposal.
            </DialogDescription>
          </DialogHeader>
          <pre className="whitespace-pre-wrap rounded-md bg-slate-900 text-slate-50 p-4 text-sm leading-relaxed border border-slate-800 max-h-[360px] overflow-y-auto">
            {latestProposalMessage?.content}
          </pre>
          <DialogFooter className="flex justify-between gap-2">
            <div className="text-xs text-muted-foreground">
              {savedProposal ? "Saved for this session." : null}
            </div>
            <div className="flex gap-2">
              <Button variant="secondary" onClick={handleEditProposal}>
                Edit
              </Button>
              <Button onClick={handleSaveProposal}>Save</Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <Dialog open={isEditing} onOpenChange={setIsEditing}>
        <DialogContent className="sm:max-w-[460px]">
          <DialogHeader>
            <DialogTitle>Edit proposal</DialogTitle>
            <DialogDescription>Adjust the text before saving.</DialogDescription>
          </DialogHeader>
          <Textarea
            value={editedText}
            onChange={(e) => setEditedText(e.target.value)}
            rows={7}
            className="w-full text-sm leading-relaxed max-h-[320px] min-h-[160px]"
          />
          <DialogFooter className="justify-end gap-2">
            <Button variant="ghost" onClick={() => setIsEditing(false)}>
              Cancel
            </Button>
            <Button onClick={applyEdit}>Update</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Dialog>
  );
};

export default ChatDialog;
