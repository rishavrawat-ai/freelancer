import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Briefcase,
  CalendarRange,
  CheckCircle2,
  ChevronRight,
  Clock,
  MessageSquare,
  PanelLeftClose,
  PanelLeftOpen,
  Sparkles,
  Sun,
  Moon,
  Banknote,
} from "lucide-react";
import { RoleAwareSidebar } from "@/components/dashboard/RoleAwareSidebar";
import { useSidebar } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useTheme } from "@/components/theme-provider";
import { getSession } from "@/lib/auth-storage";

const dashboardTemplate = {
  heroSubtitle: "Review proposals, unlock talent, and keep budgets on track.",
  completion: 72,
  metrics: [
    {
      label: "Active projects",
      value: "6",
      trend: "2 awaiting review",
      icon: Briefcase,
    },
    {
      label: "Completed projects",
      value: "3",
      trend: "1 onboarding",
      icon: Sparkles,
    },
    {
      label: "Proposals Sent",
      value: "2",
      trend: "Vendors are responsive",
      icon: Clock,
    },
    {
      label: "Total Spend",
      value: "$ 24",
      trend: "Vendors are responsive",
      icon: Banknote,
    },
  ],
  pipelineTitle: "Hiring pipeline",
  pipelineDescription: "Where decisions are pending",
  pipeline: [
    {
      title: "Product launch video",
      client: "Internal",
      status: "Interviewing",
      due: "Pick this week",
    },
    {
      title: "Lifecycle email flows",
      client: "Internal",
      status: "Shortlist ready",
      due: "Review today",
    },
    {
      title: "Investor portal UI",
      client: "Internal",
      status: "Waiting on proposal",
      due: "ETA tomorrow",
    },
  ],
  availabilityTitle: "Budget allocation",
  availabilityDescription: "Hours committed by phase",
  availability: [
    { label: "Discovery & scoping", progress: 65 },
    { label: "Production", progress: 40 },
    { label: "QA & rollout", progress: 25 },
  ],
  messagesTitle: "Vendor updates",
  messagesDescription: "Latest freelancer communication",
  messages: [
    {
      from: "Nova Design Lab",
      company: "Vendor",
      excerpt: "Shared the figma handoff and notes for review.",
      time: "30m ago",
    },
    {
      from: "Atlas Collective",
      company: "Vendor",
      excerpt: "Budget tweak approved - sending updated agreement.",
      time: "2h ago",
    },
  ],
  remindersTitle: "Approvals",
  remindersDescription: "Actions to keep work moving",
  reminders: [
    { icon: Clock, title: "Approve Nova invoice", subtitle: "Due in 2 days" },
    {
      icon: Briefcase,
      title: "Review Atlas contract",
      subtitle: "Legal feedback ready",
    },
  ],
};

const PROPOSAL_STORAGE_KEYS = [
  "markify:savedProposal",
  "markify:pendingProposal",
  "pendingProposal",
  "savedProposal",
];

const PRIMARY_PROPOSAL_STORAGE_KEY = PROPOSAL_STORAGE_KEYS[0];

const loadSavedProposalFromStorage = () => {
  if (typeof window === "undefined") {
    return null;
  }

  for (const storageKey of PROPOSAL_STORAGE_KEYS) {
    const rawValue = window.localStorage.getItem(storageKey);
    if (!rawValue) continue;
    try {
      return JSON.parse(rawValue);
    } catch {
      return { content: rawValue };
    }
  }

  return null;
};

const persistSavedProposalToStorage = (proposal) => {
  if (typeof window === "undefined" || !proposal) {
    return;
  }

  window.localStorage.setItem(
    PRIMARY_PROPOSAL_STORAGE_KEY,
    JSON.stringify(proposal)
  );
};

const clearSavedProposalFromStorage = () => {
  if (typeof window === "undefined") {
    return;
  }

  PROPOSAL_STORAGE_KEYS.forEach((storageKey) =>
    window.localStorage.removeItem(storageKey)
  );
};

const ClientDashboardContent = () => {
  const { state, toggleSidebar } = useSidebar();
  const navigate = useNavigate();
  const [sessionUser, setSessionUser] = useState(null);
  const [showBriefPrompt, setShowBriefPrompt] = useState(false);
  const [briefPromptDismissed, setBriefPromptDismissed] = useState(false);
  const [savedProposal, setSavedProposal] = useState(null);
  const [proposalDeliveryState, setProposalDeliveryState] = useState("idle");

  useEffect(() => {
    const session = getSession();
    setSessionUser(session?.user ?? null);
  }, []);

  useEffect(() => {
    if (!sessionUser || briefPromptDismissed) {
      setShowBriefPrompt(false);
      return;
    }
    setShowBriefPrompt(true);
  }, [sessionUser, briefPromptDismissed]);

  useEffect(() => {
    setSavedProposal(loadSavedProposalFromStorage());
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") {
      return undefined;
    }

    const handleStorageChange = (event) => {
      if (event?.key && !PROPOSAL_STORAGE_KEYS.includes(event.key)) {
        return;
      }
      setSavedProposal(loadSavedProposalFromStorage());
    };

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  useEffect(() => {
    if (savedProposal && proposalDeliveryState === "idle") {
      setProposalDeliveryState("pending");
      return;
    }

    if (!savedProposal && proposalDeliveryState === "pending") {
      setProposalDeliveryState("idle");
    }
  }, [savedProposal, proposalDeliveryState]);

  const roleLabel = useMemo(() => {
    const baseRole = sessionUser?.role ?? "CLIENT";
    const normalized = baseRole.toLowerCase();
    return normalized.charAt(0).toUpperCase() + normalized.slice(1);
  }, [sessionUser]);

  const dashboardLabel = sessionUser?.fullName?.trim()
    ? `${sessionUser.fullName.trim()}'s dashboard`
    : `${roleLabel} dashboard`;

  const avatarInitials = useMemo(() => {
    if (sessionUser?.fullName) {
      const parts = sessionUser.fullName.trim().split(/\s+/);
      return (
        parts
          .slice(0, 2)
          .map((part) => part[0]?.toUpperCase() ?? "")
          .join("") || "CL"
      );
    }
    return "CL";
  }, [sessionUser]);

  const template = useMemo(() => dashboardTemplate, []);

  const {
    heroSubtitle,
    completion: templateCompletion = 68,
    metrics = [],
    pipeline = [],
    pipelineTitle,
    pipelineDescription,
    availability = [],
    availabilityTitle,
    availabilityDescription,
    messages = [],
    messagesTitle,
    messagesDescription,
    reminders = [],
    remindersTitle,
    remindersDescription,
  } = template;

  const [messagesFeed, setMessagesFeed] = useState(messages);

  useEffect(() => {
    setMessagesFeed(messages);
  }, [messages]);

  const heroTitle = sessionUser?.fullName?.trim()
    ? `${sessionUser.fullName.split(" ")[0]}'s control room`
    : `${roleLabel} control room`;

  const savedProposalDetails = useMemo(() => {
    if (!savedProposal) {
      return null;
    }

    const baseProposal =
      typeof savedProposal === "object" && savedProposal !== null
        ? savedProposal
        : { content: savedProposal };

    const projectTitle =
      baseProposal.projectTitle ||
      baseProposal.title ||
      baseProposal.project ||
      "Untitled project";

    const service =
      baseProposal.service ||
      baseProposal.category ||
      baseProposal.professionalField ||
      baseProposal.serviceType ||
      "General services";

    const summary =
      baseProposal.summary ||
      baseProposal.executiveSummary ||
      baseProposal.description ||
      baseProposal.notes ||
      baseProposal.content ||
      "";

    const budgetValue =
      baseProposal.budget || baseProposal.budgetRange || baseProposal.estimate;

    const preparedFor =
      baseProposal.preparedFor ||
      baseProposal.client ||
      baseProposal.clientName ||
      sessionUser?.fullName ||
      "Client";

    const createdAtValue =
      baseProposal.createdAt ||
      baseProposal.savedAt ||
      baseProposal.timestamp ||
      baseProposal.created_on ||
      baseProposal.created;

    let createdAtDisplay = null;
    if (createdAtValue) {
      const parsed = new Date(createdAtValue);
      createdAtDisplay = Number.isNaN(parsed.getTime())
        ? String(createdAtValue)
        : parsed.toLocaleString();
    }

    const freelancerName =
      baseProposal.freelancerName ||
      baseProposal.targetFreelancer ||
      baseProposal.vendor ||
      baseProposal.recipient ||
      "Freelancer";

    return {
      projectTitle,
      service,
      preparedFor,
      summary,
      budget:
        typeof budgetValue === "number"
          ? `$${budgetValue.toLocaleString()}`
          : budgetValue,
      createdAtDisplay: createdAtDisplay ?? new Date().toLocaleString(),
      freelancerName,
      raw: baseProposal,
    };
  }, [savedProposal, sessionUser]);

  const hasSavedProposal = Boolean(savedProposalDetails);

  const proposalStatusCopy = useMemo(() => {
    switch (proposalDeliveryState) {
      case "sent":
        return {
          title: "Proposal sent",
          body: "We added it to your vendor updates so you can track replies.",
        };
      case "cleared":
        return {
          title: "Proposal dismissed",
          body: "You cleared the saved content from this dashboard view.",
        };
      case "saved":
        return {
          title: "Saved to dashboard",
          body: "We'll keep it handy here until you decide to send it.",
        };
      case "pending":
        return {
          title: "Pending proposal",
          body: "Found a proposal you created before logging in.",
        };
      default:
        return {
          title: "No saved proposals",
          body: "Create a proposal and save it to find it here later.",
        };
    }
  }, [proposalDeliveryState]);

  const { theme, setTheme } = useTheme();
  const isDarkMode = theme === "dark";
  const themeIcon = isDarkMode ? Sun : Moon;
  const toggleTheme = () => setTheme(isDarkMode ? "light" : "dark");
  const sidebarClosed = state === "collapsed";
  const SidebarToggleIcon = sidebarClosed ? PanelLeftOpen : PanelLeftClose;
  const completionValue = Math.min(Math.max(templateCompletion || 0, 0), 100);

  const handleBriefRedirect = () => {
    setShowBriefPrompt(false);
    navigate("/client/briefs");
  };

  const handleBriefDismiss = () => {
    setBriefPromptDismissed(true);
    setShowBriefPrompt(false);
  };

  const handleClearSavedProposal = () => {
    clearSavedProposalFromStorage();
    setSavedProposal(null);
    setProposalDeliveryState("cleared");
  };

  const handleExploreFreelancers = () => {
    navigate("/service");
  };

  const handleSaveProposalToDashboard = () => {
    if (!savedProposal) {
      return;
    }
    persistSavedProposalToStorage(savedProposal);
    setProposalDeliveryState("saved");
  };

  const handleSendProposal = () => {
    if (!savedProposalDetails) {
      return;
    }

    setMessagesFeed((prev) => [
      {
        from: savedProposalDetails.freelancerName,
        company: savedProposalDetails.service,
        excerpt:
          savedProposalDetails.summary?.slice(0, 160) ||
          "Proposal shared from dashboard.",
        time: "Just now",
      },
      ...prev,
    ]);
    setProposalDeliveryState("sent");
  };

  return (
    <>
      <div className="relative flex flex-col gap-6 p-6">
        <div className="absolute left-6 top-4 flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            className="rounded-full border border-border text-muted-foreground hover:text-foreground"
            onClick={toggleSidebar}>
            <SidebarToggleIcon className="size-4" />
            <span className="sr-only">
              {sidebarClosed ? "Open navigation" : "Close navigation"}
            </span>
          </Button>
          <div className="flex items-center gap-1 rounded-full px-3 py-1 text-sm font-medium text-muted-foreground">
            <span className="truncate">{dashboardLabel}</span>
            <ChevronRight className="size-3.5" />
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="rounded-full border border-border text-muted-foreground hover:text-foreground"
            onClick={toggleTheme}
            aria-label="Toggle theme">
            {React.createElement(themeIcon, { className: "size-4" })}
          </Button>
        </div>
        <header className="flex flex-col gap-4 pt-12 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-sm text-muted-foreground">Today</p>
            <h1 className="text-2xl font-semibold leading-tight">
              {heroTitle}
            </h1>
            <p className="text-muted-foreground">{heroSubtitle}</p>
          </div>
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:gap-4">
            <div className="flex shrink-0 items-center gap-3">
              <Button variant="outline" size="sm" className="gap-2">
                <CalendarRange className="size-4" />
                Sync calendar
              </Button>
              <Button size="sm" className="gap-2">
                <MessageSquare className="size-4" />
                Quick reply
              </Button>
            </div>
          </div>
        </header>

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {metrics.map((metric) => {
            const Icon = metric.icon;
            return (
              <Card key={metric.label} className="border-dashed">
                <CardHeader className="flex-row items-center justify-between">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Icon className="size-4 text-primary" />
                    {metric.label}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <p className="text-3xl font-semibold">{metric.value}</p>
                  <p className="text-sm text-muted-foreground">
                    {metric.trend}
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </section>

        <section className="grid gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
          <Card className="border border-yellow-500/60 bg-background/60 shadow-lg">
            <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <CardTitle className="text-lg font-semibold text-yellow-400">
                  Saved proposal
                </CardTitle>
                <CardDescription className="text-xs text-muted-foreground">
                  {hasSavedProposal
                    ? `Service: ${savedProposalDetails.service} · Created: ${savedProposalDetails.createdAtDisplay}`
                    : "Save a proposal before logging in and it will appear here."}
                </CardDescription>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="border border-transparent text-yellow-400 hover:border-yellow-500/60 hover:bg-yellow-500/10 disabled:opacity-40"
                onClick={handleClearSavedProposal}
                disabled={!hasSavedProposal}>
                Clear
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-2xl border border-yellow-500/40 bg-card/60 p-4 text-sm text-muted-foreground shadow-inner">
                <p className="text-[11px] font-semibold uppercase tracking-[0.4em] text-yellow-400">
                  --- Project Proposal ---
                </p>
                {hasSavedProposal ? (
                  <>
                    <div className="mt-3 space-y-1.5 text-foreground">
                      <p className="text-base font-semibold">
                        {savedProposalDetails.projectTitle}
                      </p>
                      <p>
                        <span className="text-muted-foreground">
                          Prepared for:
                        </span>{" "}
                        {savedProposalDetails.preparedFor}
                      </p>
                      {savedProposalDetails.budget ? (
                        <p>
                          <span className="text-muted-foreground">Budget:</span>{" "}
                          {savedProposalDetails.budget}
                        </p>
                      ) : null}
                    </div>
                    <p className="mt-4 whitespace-pre-wrap text-sm leading-relaxed">
                      {savedProposalDetails.summary ||
                        "Proposal details recovered from your previous session."}
                    </p>
                  </>
                ) : (
                  <p className="mt-3 text-sm text-muted-foreground">
                    Draft a proposal from the services page and we&apos;ll keep
                    a copy here so you can send it once you sign in.
                  </p>
                )}
              </div>
              <div className="flex flex-wrap gap-3">
                <Button
                  variant="outline"
                  className="border-yellow-500/60 text-yellow-400 hover:bg-yellow-500/10"
                  onClick={handleExploreFreelancers}>
                  Show matching freelancers
                </Button>
                <Button
                  className="bg-yellow-400 text-black hover:bg-yellow-300 disabled:opacity-40"
                  onClick={handleSaveProposalToDashboard}
                  disabled={!hasSavedProposal}>
                  Save to dashboard
                </Button>
                <Button
                  variant="secondary"
                  className="bg-yellow-500/20 text-yellow-300 hover:bg-yellow-500/30 disabled:opacity-40"
                  onClick={handleSendProposal}
                  disabled={!hasSavedProposal}>
                  Use as message (Send)
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="border border-yellow-500/40 bg-yellow-500/5">
            <CardContent className="flex h-full flex-col justify-center gap-3 p-6">
              <p className="text-sm font-semibold uppercase tracking-[0.3em] text-yellow-400">
                {proposalStatusCopy.title}
              </p>
              <p className="text-sm text-muted-foreground">
                {proposalStatusCopy.body}
              </p>
              {hasSavedProposal ? (
                <p className="text-xs text-muted-foreground">
                  Ready to send to {savedProposalDetails.freelancerName}.
                </p>
              ) : (
                <p className="text-xs text-muted-foreground">
                  Create a proposal draft to unlock quick-send actions here.
                </p>
              )}
            </CardContent>
          </Card>
        </section>
      </div>
    </>
  );
};

const ClientDashboard = () => {
  return (
    <RoleAwareSidebar>
      <ClientDashboardContent />
    </RoleAwareSidebar>
  );
};

export default ClientDashboard;
