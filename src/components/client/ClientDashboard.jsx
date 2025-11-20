import React, { useEffect, useMemo, useState } from "react";
import {
  Briefcase,
  CalendarRange,
  Clock,
  Copy,
  MessageSquare,
  PanelLeftClose,
  Sparkles,
  Banknote,
  Save,
  Send,
} from "lucide-react";
import { RoleAwareSidebar } from "@/components/dashboard/RoleAwareSidebar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getSession } from "@/lib/auth-storage";
import { ClientTopBar } from "@/components/client/ClientTopBar";

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
  const [sessionUser, setSessionUser] = useState(null);
  const [savedProposal, setSavedProposal] = useState(null);
  const [proposalDeliveryState, setProposalDeliveryState] = useState("idle");

  useEffect(() => {
    const session = getSession();
    setSessionUser(session?.user ?? null);
  }, []);

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

  const template = useMemo(() => dashboardTemplate, []);

  const {
    heroSubtitle,
    metrics = [],
  } = template;

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

  const handleClearSavedProposal = () => {
    clearSavedProposalFromStorage();
    setSavedProposal(null);
    setProposalDeliveryState("cleared");
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

    setProposalDeliveryState("sent");
  };

  const handleDuplicateProposal = () => {
    if (!savedProposal) {
      return;
    }
    const duplicatedProposal = {
      ...savedProposal,
      duplicatedAt: new Date().toISOString(),
    };
    persistSavedProposalToStorage(duplicatedProposal);
    setSavedProposal(duplicatedProposal);
    setProposalDeliveryState("saved");
  };

  return (
    <>
      <div className="flex flex-col gap-6 p-6">
        <ClientTopBar label={dashboardLabel} />
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

        <section className="grid gap-6">
          <Card className="overflow-hidden border border-primary/40 bg-gradient-to-b from-[#1a0d04] via-[#070402] to-[#050404] text-white shadow-[0_50px_120px_-60px_rgba(253,200,0,0.55)]">
            <CardHeader className="space-y-1 border-b border-white/5 bg-black/30">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-full border border-primary/40 bg-primary/10 text-primary">
                    <Briefcase className="h-4 w-4" />
                  </div>
                  <div>
                    <CardTitle className="text-2xl font-semibold text-white">
                      Saved Proposal
                    </CardTitle>
                    <p className="text-xs text-white/70">
                      {hasSavedProposal
                        ? `${savedProposalDetails.service} • Created ${savedProposalDetails.createdAtDisplay}`
                        : "Save a proposal before logging in and it will appear here."}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Badge className="border border-primary/50 bg-primary/20 text-primary">
                    Ready to Send
                  </Badge>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-white/70 hover:text-white"
                    onClick={handleClearSavedProposal}
                    disabled={!hasSavedProposal}
                    aria-label="Clear saved proposal">
                    <PanelLeftClose className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6 p-6">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.4em] text-primary/70">
                  Project details
                </p>
                <div className="mt-4 rounded-2xl border border-primary/25 bg-black/60 p-5 font-mono text-sm text-primary/80">
                  <p className="text-[11px] uppercase tracking-[0.5em] text-primary/60">
                    --- Project Proposal ---
                  </p>
                  {hasSavedProposal ? (
                    <div className="mt-4 space-y-4 text-white">
                      <div className="space-y-1">
                        <p className="text-sm font-semibold uppercase text-white/60">
                          Project Title:
                        </p>
                        <p className="text-lg font-semibold text-primary">
                          {savedProposalDetails.projectTitle}
                        </p>
                      </div>
                      <div className="grid gap-2 text-sm sm:grid-cols-2">
                        <div>
                          <p className="text-xs font-semibold uppercase text-primary/70">
                            Prepared for
                          </p>
                          <p className="text-white/80">
                            {savedProposalDetails.preparedFor}
                          </p>
                        </div>
                        {savedProposalDetails.budget ? (
                          <div>
                            <p className="text-xs font-semibold uppercase text-primary/70">
                              Budget
                            </p>
                            <p className="text-white/80">
                              {savedProposalDetails.budget}
                            </p>
                          </div>
                        ) : null}
                      </div>
                      <div className="space-y-1 rounded-xl bg-black/50 p-4 text-sm leading-relaxed text-white/70 scrollbar-thin">
                        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-primary/60">
                          Executive summary
                        </p>
                        <p className="max-h-48 overflow-y-auto pr-2">
                          {savedProposalDetails.summary ||
                            "Proposal details recovered from your previous session."}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <p className="mt-4 text-sm text-white/60">
                      Draft a proposal from the services page and we&apos;ll keep a copy here so you can send it once you sign in.
                    </p>
                  )}
                </div>
              </div>
              <div className="flex flex-wrap gap-3">
                <Button
                  variant="outline"
                  size="lg"
                  className="h-11 flex-1 min-w-[140px] gap-2 rounded-full border-white/20 bg-transparent text-white hover:bg-white/10"
                  onClick={handleDuplicateProposal}
                  disabled={!hasSavedProposal}>
                  <Copy className="h-4 w-4" />
                  Duplicate
                </Button>
                <Button
                  size="lg"
                  className="h-11 flex-1 min-w-[160px] gap-2 rounded-full bg-primary text-black hover:bg-primary/90 disabled:opacity-30"
                  onClick={handleSendProposal}
                  disabled={!hasSavedProposal}>
                  <Send className="h-4 w-4" />
                  Send to Freelancer
                </Button>
                <Button
                  size="lg"
                  variant="secondary"
                  className="h-11 flex-1 min-w-[120px] gap-2 rounded-full border border-white/10 bg-white/10 text-white hover:bg-white/20 disabled:opacity-30"
                  onClick={handleSaveProposalToDashboard}
                  disabled={!hasSavedProposal}>
                  <Save className="h-4 w-4" />
                  Save
                </Button>
              </div>
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
