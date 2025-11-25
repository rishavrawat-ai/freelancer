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

const ChatDialog = ({ isOpen, onClose, service }) => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef(null);

  useEffect(() => {
    if (isOpen && service) {
      setMessages([
        {
          role: "assistant",
          content: `Hi! I see you're interested in ${service.title}. How can I help you with that?`,
        },
      ]);
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
        content: safeData.response || "Sorry, I couldn't parse the response.",
      };
      setMessages((prev) => [...prev, botMessage]);
    } catch (error) {
      console.error("Failed to send message:", error);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "Sorry, I encountered an error. Please try again.",
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

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
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type your message..."
              disabled={isLoading}
            />
            <Button type="submit" size="icon" disabled={isLoading}>
              <Send className="w-4 h-4" />
            </Button>
          </form>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ChatDialog;
