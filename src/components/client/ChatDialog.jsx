import { useState, useEffect, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Send, Loader2, User, Bot } from "lucide-react";
import { apiClient } from "@/lib/api-client";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/context/AuthContext";
import { useNavigate } from "react-router-dom";

const ChatDialog = ({ isOpen, onClose, service }) => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [savedProposal, setSavedProposal] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editedText, setEditedText] = useState("");
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const scrollRef = useRef(null);
  const inputRef = useRef(null);

  const persistSavedProposalToStorage = (proposal) => {
    if (typeof window === "undefined" || !proposal) return;
    const payload = {
      content: proposal.content || proposal,
      service: proposal.service || service?.title || "Project",
      createdAt: proposal.createdAt || new Date().toISOString(),
      projectTitle: proposal.projectTitle || proposal.service || service?.title || "Proposal",
      preparedFor: proposal.preparedFor || proposal.name || "Client",
      budget: proposal.budget || null,
      summary: proposal.summary || (typeof proposal === "string" ? proposal : proposal.content) || "",
    };
    window.localStorage.setItem("markify:savedProposal", JSON.stringify(payload));
  };

  useEffect(() => {
    if (isOpen && service) {
      setMessages([
        {
          role: "assistant",
          content: `Hi! I see you're interested in ${service.title}. How can I help you with that?`,
        },
      ]);
      // Focus the input when chat opens.
      queueMicrotask(() => {
        inputRef.current?.focus();
      });
    }
  }, [isOpen, service]);

  const handleSend = async () => {
    if (!input.trim() || !service?.title) return;

    const userMessage = { role: "user", content: input };
    const nextMessages = [...messages, userMessage];
    setMessages(nextMessages);
    setInput("");
    setIsLoading(true);

    try {
      const data = await apiClient.chat({
        message: input,
        service: service.title,
        history: nextMessages,
      });

      const safeData = data || {};
      if (safeData.error) {
        throw new Error(safeData.error);
      }

      const botMessage = {
        role: "assistant",
        content: safeData.response || "I'm here—please share a bit more so I can prepare your proposal.",
      };
      setMessages((prev) => [...prev, botMessage]);
    } catch (error) {
      console.error("Failed to send message:", error);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "Sorry, I encountered an error reaching the assistant. Please try again in a moment.",
        },
      ]);
    } finally {
      setIsLoading(false);
      queueMicrotask(() => {
        inputRef.current?.focus();
      });
    }
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
        createdAt: new Date().toISOString(),
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

  useEffect(() => {
    // Auto-scroll to the latest message/loading indicator.
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isLoading, latestProposalMessage]);

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
            {messages.map((msg, index) => (
              <div
                key={index}
                className={`flex items-start gap-3 min-w-0 ${
                  msg.role === "user" ? "flex-row-reverse" : ""
                }`}>
                <div
                  className={`p-2 rounded-full ${
                    msg.role === "user"
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted"
                  }`}>
                  {msg.role === "user" ? (
                    <User className="w-4 h-4" />
                  ) : (
                    <Bot className="w-4 h-4" />
                  )}
                </div>
                <div
                  className={`p-3 rounded-lg max-w-[80%] min-w-0 text-sm break-words overflow-wrap-anywhere hyphens-auto ${
                    msg.role === "user"
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted"
                  }`}
                  style={{
                    wordBreak: "break-word",
                    overflowWrap: "anywhere",
                    whiteSpace: "pre-wrap",
                  }}>
                  {msg.content}
                </div>
              </div>
            ))}
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
            {latestProposalMessage && (
              <div className="rounded-lg bg-slate-900 text-slate-50 p-4 shadow-sm space-y-3 border border-slate-800">
                <div className="text-xs uppercase tracking-wide text-slate-300">
                  Proposal Ready
                </div>
                <pre className="whitespace-pre-wrap text-sm leading-relaxed font-medium">
                  {latestProposalMessage.content}
                </pre>
                <div className="flex gap-2">
                  <Button size="sm" variant="secondary" onClick={handleEditProposal}>
                    Edit
                  </Button>
                  <Button size="sm" onClick={handleSaveProposal}>
                    Save
                  </Button>
                </div>
                {savedProposal && (
                  <div className="text-xs text-slate-300">
                    Saved for this session.
                  </div>
                )}
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
            className="flex w-full items-center space-x-2">
            <Input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type your message..."
            />
            <Button type="submit" size="icon" disabled={isLoading}>
              <Send className="w-4 h-4" />
            </Button>
          </form>
        </DialogFooter>
      </DialogContent>
      <Dialog open={isEditing} onOpenChange={setIsEditing}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Edit proposal</DialogTitle>
            <DialogDescription>Adjust the text before saving.</DialogDescription>
          </DialogHeader>
          <Textarea
            value={editedText}
            onChange={(e) => setEditedText(e.target.value)}
            rows={8}
            className="w-full"
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
