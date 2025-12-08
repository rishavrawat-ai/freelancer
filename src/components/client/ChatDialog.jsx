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
  const [answeredOptions, setAnsweredOptions] = useState({});
  const [pricingSelections, setPricingSelections] = useState({});
  const { user } = useAuth();
  const scrollRef = useRef(null);
  const inputRef = useRef(null);
  const socketRef = useRef(null);
  const loadingSinceRef = useRef(null);
  const serviceKey = service?.title || "Project";
  const messageStorageKey = useMemo(() => getMessageStorageKey(serviceKey), [serviceKey]);
  const getMessageKey = (msg, index) => msg?.id || msg?._id || msg?.createdAt || index;

  const PRICING_FEATURES = [
    {
      match: ["cgi videos", "cgi video", "cgi", "product cgi"],
      label: "CGI Videos - Rs 10,000 (up to 15s)",
      features: [
        "High-Precision 1–2 Product Models",
        "Ultra-Realistic Texturing",
        "Dynamic Product Animation",
        "Cinematic Camera Angles & Movements",
        "Studio-Grade Lighting & Rendering",
        "Impactful Text & Graphic Overlays",
        "Engaging Sound Design",
        "1–2 Rounds of Creative Revisions"
      ]
    },
    {
      match: ["ugc videos", "ugc video", "ugc"],
      label: "UGC Videos - Rs 7,000 (up to 30s)",
      features: [
        "Real People, Authentic Reactions",
        "Scriptwriting focused on relatability & conversion",
        "Brand integration in a natural tone",
        "Voiceover or on-camera dialogue options",
        "Vertical format optimized for Reels & Shorts",
        "Fast-paced editing with jump cuts",
        "On-screen text & captions"
      ]
    },
    {
      match: ["gmb optimisation", "gmb optimization", "google my business", "gmb"],
      label: "Google My Business Optimisation - Rs 25,000 (3 months)",
      features: [
        "Profile optimization & products/services updates",
        "Graphics posts for your service/product",
        "Local SEO with 7 keywords",
        "Citations (NAP) & content optimization",
        "Online reputation management",
        "Track traffic and phone calls",
        "Analyze GMB insights (views, clicks, calls)",
        "Improve Google ranking"
      ]
    },
    {
      match: ["gmb indian review"],
      label: "GMB Indian Reviews - Rs 80/review",
      features: ["Reputation uplift with local reviews"]
    },
    {
      match: ["gmb international review", "gmb intl review"],
      label: "GMB International Reviews - Rs 150/review",
      features: ["Reputation uplift with international reviews"]
    },
    {
      match: ["seo", "search engine optimisation", "search engine optimization", "search engine"],
      label: "Search Engine Optimisation - Rs 12,000/month",
      features: [
        "SEO audit and analysis",
        "Website bugs fix & tag updates",
        "12 keyword optimization",
        "200+ backlinks",
        "6-7 blogs every month",
        "Content optimization",
        "Competitor analysis & research",
        "On-page & off-page SEO",
        "ORM & reviews"
      ]
    },
    {
      match: ["social media marketing", "smm", "social media"],
      label: "Social Media Marketing - Rs 18,000/month",
      features: [
        "Brand tone & strategy definition",
        "10 static posts & 6 quality reels",
        "Content calendar & creative designs",
        "Video ideation & designing",
        "Cross-platform integration",
        "Analytics and reporting"
      ]
    },
    {
      match: ["meta ads", "facebook", "instagram", "fb ads", "ig ads", "meta"],
      label: "Meta Ads (Facebook/Instagram) - Rs 10,000/month",
      features: [
        "Campaign strategy development",
        "Detailed audience targeting",
        "Engaging & persuasive ad copy",
        "Ad spend allocation & management",
        "Retargeting & re-engagement",
        "A/B testing for improvement",
        "Performance tracking & reporting"
      ]
    },
    {
      match: ["google ads", "google adwords", "adwords"],
      label: "Google Ads - Rs 10,000/month",
      features: [
        "High-performing keyword research",
        "Text, display, and video ads",
        "Bid optimization for ROI",
        "Ad extensions setup",
        "Conversion tracking",
        "Ongoing optimization & reporting"
      ]
    },
    {
      match: ["landing page", "lp"],
      label: "Landing Page - Rs 10,000",
      features: [
        "Website development & design",
        "Content, graphics, and videos",
        "Responsive design",
        "Performance optimization",
        "Forms & surveys",
        "Social media integration"
      ]
    },
    {
      match: [
        "informative (upto 5 pages)",
        "informative (up to 5 pages)",
        "informative website",
        "basic website",
        "5 page website"
      ],
      label: "Informative Website (up to 5 pages) - Rs 20,000",
      features: [
        "Content & graphics",
        "Responsive design",
        "API integration",
        "Performance optimization",
        "Social media integration",
        "Forms & surveys"
      ]
    },
    {
      match: [
        "informative (3d on wordpress)",
        "3d informative wordpress",
        "3d informative"
      ],
      label: "Informative 3D on Wordpress - Rs 35,000",
      features: [
        "3D visuals on Wordpress",
        "Content & graphics",
        "Responsive design",
        "Performance optimization",
        "Forms & surveys"
      ]
    },
    {
      match: ["custom - rs 60,000", "custom website", "bespoke website"],
      label: "Custom Website - Rs 60,000",
      features: [
        "Custom design & development",
        "Content & graphics",
        "Responsive design",
        "Performance optimization",
        "Social media integration"
      ]
    },
    {
      match: [
        "3d website (framer",
        "3d website (webflow",
        "3d website (framer/webflow)",
        "framer website",
        "webflow website",
        "3d framer",
        "3d webflow"
      ],
      label: "3D Website (Framer/WebFlow) - Rs 80,000",
      features: [
        "3D interactive experience",
        "Responsive design",
        "Performance optimization",
        "Content & graphics"
      ]
    },
    {
      match: ["3d custom", "3d custom website"],
      label: "3D Custom Website - Rs 1,00,000",
      features: [
        "Fully custom 3D experience",
        "Responsive design",
        "Performance optimization",
        "Content & graphics"
      ]
    },
    {
      match: [
        "e-commerce wordpress",
        "ecommerce wordpress",
        "wordpress store",
        "woocommerce",
        "wordpress - rs 30,000"
      ],
      label: "E-Commerce (Wordpress) - Rs 30,000",
      features: [
        "Product pages & cart/checkout",
        "Payment gateway integration",
        "Shipping & logistics integration",
        "CMS & social integration",
        "Legal compliance"
      ]
    },
    {
      match: [
        "3d wordpress",
        "3d wordpress store",
        "3d woocommerce"
      ],
      label: "E-Commerce (3D Wordpress) - Rs 45,000",
      features: [
        "3D enhanced storefront",
        "Payment gateway integration",
        "Shipping & logistics integration",
        "CMS & social integration"
      ]
    },
    {
      match: ["wordpress", "word press", "wp"],
      label: "WordPress Website - Rs 20,000 - 45,000",
      features: [
        "Informative site (up to 5 pages) ~ Rs 20,000",
        "WooCommerce store ~ Rs 30,000",
        "3D-enhanced WordPress experience ~ Rs 45,000",
        "Responsive, performance tuned, SEO basics"
      ]
    },
    {
      match: [
        "shopify - rs 30,000",
        "shopify",
        "shopify store",
        "shopify ecommerce"
      ],
      label: "E-Commerce (Shopify) - Rs 30,000",
      features: [
        "Shopify setup with product pages",
        "Payment gateway integration",
        "Shipping & logistics integration",
        "Cart & checkout",
        "Support integration"
      ]
    },
    {
      match: [
        "custom(shopify)",
        "custom (shopify)",
        "custom shopify",
        "shopify custom"
      ],
      label: "E-Commerce Custom (Shopify) - Rs 80,000",
      features: [
        "Custom Shopify theme",
        "Payment gateway integration",
        "Shipping & logistics integration",
        "Cart & checkout",
        "Support integration"
      ]
    },
    {
      match: [
        "react store",
        "next store",
        "react ecommerce",
        "react e-commerce",
        "next ecommerce",
        "next e-commerce",
        "mern ecommerce",
        "mern e-commerce",
        "mern store",
        "custom react store",
        "custom(react store",
        "custom (react store",
        "custom react ecommerce",
        "custom react e-commerce",
        "react commerce",
        "next commerce"
      ],
      label: "E-Commerce Custom (ReactJS + NodeJS) - Rs 1,50,000",
      features: [
        "Custom React + Node build",
        "Payment gateway integration",
        "Shipping & logistics integration",
        "Cart & checkout",
        "Support integration"
      ]
    },
    {
      match: ["react/next", "react + next", "react next", "next.js", "nextjs", "next js", "react"],
      label: "React/Next.js Website - Rs 60,000 - 1,00,000",
      features: [
        "Custom UI/UX with animations",
        "API-driven architecture (Node/Express/Next API routes)",
        "Performance & SEO tuned for web/app experiences",
        "Responsive across devices",
        "Can extend to 3D/immersive if needed"
      ]
    },
    {
      match: ["node.js", "nodejs", "node js"],
      label: "Node.js Backend/API - Rs 60,000 - 1,50,000",
      features: [
        "REST/GraphQL APIs with auth & RBAC",
        "Database schema, migrations, and seed data",
        "Integrations (payments, CRM, analytics)",
        "Scalable deployment (cloud/serverless)",
        "Pair with React/Next frontend if required"
      ]
    },
    {
      match: ["laravel"],
      label: "Laravel Web App - Rs 50,000 - 1,20,000",
      features: [
        "Blade/SPA frontends with auth",
        "CRUD dashboards & validation",
        "Queues, mailers, and payments",
        "Testing & deployment pipelines",
        "API-first option for mobile/web"
      ]
    },
    {
      match: [
        "3d website (custom",
        "3d website (custom)",
        "3d ecommerce",
        "3d e-commerce",
        "3d custom store"
      ],
      label: "E-Commerce 3D Custom - Rs 1,00,000 - 4,00,000",
      features: [
        "Custom 3D commerce experience",
        "Payment gateway integration",
        "Shipping & logistics integration",
        "Cart & checkout",
        "Support integration"
      ]
    }
  ];

  const resolvePricingDetails = (option) => {
    if (!option) return null;
    const lower = option.toLowerCase();
    const match = PRICING_FEATURES.find((item) =>
      item.match.some((m) => lower.includes(m))
    );
    return match || null;
  };

  // Show pricing only after a tech stack has been selected to avoid premature pricing.
  const hasSelectedStack = useMemo(() => {
    const stackKeywords = ["react", "next", "wordpress", "shopify", "laravel", "node"];
    return Object.values(answeredOptions).some((value) => {
      const lower = (value || "").toLowerCase();
      return stackKeywords.some((kw) => lower.includes(kw));
    });
  }, [answeredOptions]);

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

        // In production, always start a fresh conversation to avoid stale IDs that 404 after deploys.
        if (!isLocalhost && typeof window !== "undefined") {
          window.localStorage.removeItem(storageKey);
        }

        const stored =
          isLocalhost && typeof window !== "undefined"
            ? window.localStorage.getItem(storageKey)
            : null;

        if (stored && isLocalhost) {
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
        const finish = () => {
          const next = [...filtered, message];
          persistMessagesToStorage(messageStorageKey, next);
          setIsLoading(false);
          return next;
        };
        if (message?.role === "assistant") {
          const minDelay = 700;
          const elapsed = loadingSinceRef.current
            ? Date.now() - loadingSinceRef.current
            : 0;
          const delay = Math.max(0, minDelay - elapsed);
          if (delay > 0) {
            setTimeout(() => {
              setMessages((prevInner) => finish(prevInner));
            }, delay);
            return filtered;
          }
        }
        return finish();
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

    const storageKey = `markify:chatConversationId:${serviceKey}`;

    const load = async () => {
      try {
        const payload = await apiClient.fetchChatMessages(conversationId);
        const nextMessages =
          payload?.data?.messages || payload?.messages || [];
        setMessages(nextMessages);
        persistMessagesToStorage(messageStorageKey, nextMessages);
      } catch (error) {
        console.error("Failed to load messages (HTTP):", error);
        const notFound = (error?.message || "").toLowerCase().includes("not found");

        if (notFound) {
          try {
            if (typeof window !== "undefined") {
              window.localStorage.removeItem(storageKey);
              window.localStorage.removeItem(messageStorageKey);
            }
            setConversationId(null);
            setMessages([]);

            const conversation = await apiClient.createChatConversation({
              service: serviceKey,
              mode: "assistant",
              ephemeral: isLocalhost
            });

            if (conversation?.id) {
              setConversationId(conversation.id);
              if (typeof window !== "undefined") {
                window.localStorage.setItem(storageKey, conversation.id);
              }
            }
          } catch (recoveryError) {
            console.error("Failed to recover chat conversation:", recoveryError);
          }
        }
      }
    };

    load();
  }, [conversationId, isOpen, useSocket, messageStorageKey, serviceKey, isLocalhost]);

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
      loadingSinceRef.current = Date.now();
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
    loadingSinceRef.current = Date.now();
    apiClient
      .sendChatMessage(payload)
      .then((response) => {
        const userMsg =
          response?.data?.message || response?.message || payload;
        const assistant =
          response?.data?.assistant || response?.assistant || null;
        const finish = () => {
          setMessages((prev) => {
            const withoutPending = prev.filter(
              (msg) => !(msg.pending && msg.role === "user" && msg.content === msgContent)
            );
            const next = assistant
              ? [...withoutPending, userMsg, assistant]
              : [...withoutPending, userMsg];
            persistMessagesToStorage(messageStorageKey, next);
            return next;
          });
          setIsLoading(false);
        };

        const minDelay = 700; // ms to simulate "thinking"
        const elapsed = loadingSinceRef.current
          ? Date.now() - loadingSinceRef.current
          : 0;
        const delay = Math.max(0, minDelay - elapsed);
        setTimeout(finish, delay);
      })
      .catch((error) => {
        console.error("Failed to send chat via HTTP:", error);
      })
      .finally(() => {
        queueMicrotask(() => inputRef.current?.focus());
      });
  };

  const handleSuggestionSelect = (option, msgKey) => {
    setAnsweredOptions((prev) => ({ ...prev, [msgKey]: option }));
    const pricing = resolvePricingDetails(option);
    if (pricing) {
      setPricingSelections((prev) => ({
        ...prev,
        [msgKey]: pricing
      }));
    }
    handleSend(option);
  };

  const proposalMessage = useMemo(() => {
    return [...messages].reverse().find(m => m.content && m.content.includes("PROJECT PROPOSAL"));
  }, [messages]);

  // Once a proposal is generated, drop any cached chat data so the next chat starts clean.
  useEffect(() => {
    if (!proposalMessage) return;
    const storageKey = `markify:chatConversationId:${serviceKey}`;
    if (typeof window !== "undefined") {
      window.localStorage.removeItem(storageKey);
      if (messageStorageKey) {
        window.localStorage.removeItem(messageStorageKey);
      }
    }
  }, [proposalMessage, messageStorageKey, serviceKey]);

  const resolveSenderChip = (msg) => {
    if (msg.role === "assistant") return "Assistant";
    return "You";
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
                  const msgKey = getMessageKey(msg, index);
                  const isAssistant = msg.role === "assistant";
                  // For AI chat: user messages (role !== "assistant") go on RIGHT
                  // Assistant messages go on LEFT
                  const isUserMessage = !isAssistant;
                  const alignment = isUserMessage ? "flex-row-reverse" : "flex-row";

                  const bubbleTone = (() => {
                    if (isAssistant) return "bg-muted text-foreground";
                    if (msg.senderRole === "CLIENT")
                      return "bg-amber-100 text-amber-900 dark:bg-amber-900/20 dark:text-amber-100";
                    if (msg.senderRole === "FREELANCER")
                      return "bg-sky-100 text-sky-900 dark:bg-sky-900/25 dark:text-sky-50";
                    // User messages in AI chat get primary color
                    return "bg-primary text-primary-foreground";
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
                      className={`flex flex-col gap-2 min-w-0 ${isUserMessage ? "items-end" : "items-start"}`}
                    >
                      <div className={`flex items-start gap-3 max-w-[85%] ${alignment}`}>
                        <div
                          className={`p-2 rounded-full flex-shrink-0 ${isUserMessage ? "bg-primary text-primary-foreground" : "bg-muted"
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
                      {suggestions.length > 0 &&
                        msg.role === "assistant" &&
                        !isLoading &&
                        !answeredOptions[msgKey] && (
                          <div className="flex flex-wrap gap-2 pl-12">
                            {suggestions.map((suggestion, idx) => (
                              <button
                                key={idx}
                                onClick={() => handleSuggestionSelect(suggestion, msgKey)}
                                className="text-xs bg-primary/10 hover:bg-primary/20 text-primary px-3 py-1.5 rounded-full transition-colors border border-primary/20 disabled:opacity-40 disabled:pointer-events-none"
                                disabled={isLoading}
                              >
                                {suggestion}
                              </button>
                            ))}
                          </div>
                        )}

                      {answeredOptions[msgKey] && (
                        <div className="pl-12 space-y-1">
                          <div className="text-xs text-muted-foreground">
                            Selected: {answeredOptions[msgKey]}
                          </div>
                          {hasSelectedStack &&
                            !proposalMessage &&
                            pricingSelections[msgKey]?.features?.length ? (
                            <div className="rounded-md border border-border/60 bg-muted/40 p-3 text-xs text-foreground space-y-1">
                              <div className="font-semibold">
                                {pricingSelections[msgKey].label}
                              </div>
                              <ul className="list-disc ml-4 space-y-0.5">
                                {pricingSelections[msgKey].features.map((feat, i) => (
                                  <li key={i}>{feat}</li>
                                ))}
                              </ul>
                            </div>
                          ) : null}
                        </div>
                      )}

                      {/* Render Multi-Select Options */}
                      {multiSelectOptions.length > 0 && msg.role === "assistant" && !isLoading && (
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
