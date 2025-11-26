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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { getSession } from "@/lib/auth-storage";
import { ClientTopBar } from "@/components/client/ClientTopBar";
import { listFreelancers } from "@/lib/api-client";
import { toast } from "sonner";

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

const recommendedFreelancers = [
  { name: "Nova Stack", specialty: "Full-stack • Next.js, Node", rating: "4.9", projects: "48", availability: "2 slots", serviceMatch: "Development & Tech" },
  { name: "Lumen Creative", specialty: "UI/UX • Figma, Framer", rating: "4.8", projects: "36", availability: "3 slots", serviceMatch: "Creative & Design" },
  { name: "Growth Loop", specialty: "Performance Marketing • Meta/Google Ads", rating: "4.7", projects: "52", availability: "1 slot", serviceMatch: "Digital Marketing" },
  { name: "Opsline", specialty: "DevOps • AWS, CI/CD", rating: "4.9", projects: "41", availability: "2 slots", serviceMatch: "Development & Tech" },
];

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
  const [isFreelancerModalOpen, setIsFreelancerModalOpen] = useState(false);
  const [freelancers, setFreelancers] = useState([]);
  const [freelancersLoading, setFreelancersLoading] = useState(false);
  const [sentProposals, setSentProposals] = useState(() => {
    if (typeof window === "undefined") return [];
    try {
      return JSON.parse(localStorage.getItem("client:sentProposals") || "[]");
    } catch {
      return [];
    }
  });
  const [notificationsChecked, setNotificationsChecked] = useState(false);

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

  const cleanProposalContent = (content = "") => {
    if (!content || typeof content !== "string") return "";
    let cleaned = content;
    cleaned = cleaned.replace(/\*\*PROJECT PROPOSAL\*\*/gi, "");
    cleaned = cleaned.replace(/\*\*Project Title:\*\*.*(\r?\n)?/gi, "");
    cleaned = cleaned.replace(/\*\*Prepared for:\*\*.*(\r?\n)?/gi, "");
    cleaned = cleaned.replace(/^-+\s*Project Proposal\s*-+/gi, "");
    cleaned = cleaned.replace(/\n{3,}/g, "\n\n");
    return cleaned.trim();
  };

  const formatDateTime = (value) => {
    if (!value) return null;
    const parsed = value instanceof Date ? value : new Date(value);
    if (Number.isNaN(parsed.getTime())) return String(value);
    return new Intl.DateTimeFormat(undefined, {
      year: "numeric",
      month: "short",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true
    }).format(parsed);
  };

  const savedProposalDetails = useMemo(() => {
    if (!savedProposal) {
      return null;
    }

    const baseProposal =
      typeof savedProposal === "object" && savedProposal !== null
        ? savedProposal
        : { content: savedProposal };

      const service =
        baseProposal.service ||
        baseProposal.category ||
        baseProposal.professionalField ||
        baseProposal.serviceType ||
        baseProposal.projectTitle ||
        "General services";

      const projectTitle =
        baseProposal.projectTitle ||
        baseProposal.title ||
        baseProposal.project ||
        service ||
        "Untitled project";

      const projectSubtype =
        baseProposal.projectSubtype ||
        baseProposal.projectType ||
        baseProposal.buildType ||
        baseProposal.appType ||
        baseProposal.siteType ||
        null;

    const summary =
      baseProposal.summary ||
      baseProposal.executiveSummary ||
      baseProposal.description ||
      baseProposal.notes ||
      baseProposal.content ||
      "";
    const cleanedSummary = cleanProposalContent(summary);

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

      const createdAtDisplay = formatDateTime(
        createdAtValue || baseProposal.createdAt || new Date()
      );

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
        summary: cleanedSummary,
        projectSubtype,
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

  const matchingFreelancers = useMemo(() => {
    const source = freelancers.length ? freelancers : recommendedFreelancers;
    if (!savedProposalDetails?.service) return source;
    const term = savedProposalDetails.service.toLowerCase();
    const filtered = source.filter((f) => {
      const specialty = f.specialty?.toLowerCase() || "";
      const match = f.serviceMatch?.toLowerCase() || "";
      return match.includes(term) || specialty.includes(term);
    });
    return filtered.length ? filtered : source;
  }, [savedProposalDetails, freelancers]);

  const sendProposalToFreelancer = (freelancer) => {
    if (!savedProposalDetails) return;
    const existing =
      typeof window !== "undefined"
        ? JSON.parse(localStorage.getItem("freelancer:receivedProposals") || "[]")
        : [];
    const uniqueId =
      (typeof crypto !== "undefined" && crypto.randomUUID && crypto.randomUUID()) ||
      `prp-${Date.now()}-${Math.floor(Math.random() * 1e6)}`;
    const newProposal = {
      id: uniqueId,
      title: savedProposalDetails.projectTitle,
      category: savedProposalDetails.service,
      status: "received",
      recipientName: freelancer.name,
      recipientId: freelancer.id || "CLIENT",
      submittedDate: savedProposalDetails.createdAtDisplay,
      proposalId: `PRP-${Math.floor(Math.random() * 9000 + 1000)}`,
      avatar:
        freelancer.avatar ||
        "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=256&q=80",
      content: savedProposalDetails.summary
    };
    const updated = [newProposal, ...existing].slice(0, 50);
    if (typeof window !== "undefined") {
      localStorage.setItem("freelancer:receivedProposals", JSON.stringify(updated));
    }
    const clientSentEntry = {
      id: newProposal.id,
      title: savedProposalDetails.projectTitle,
      service: savedProposalDetails.service,
      status: "sent",
      recipientName: freelancer.name,
      recipientId: freelancer.id || "FREELANCER",
      submittedDate: newProposal.submittedDate,
      proposalId: newProposal.proposalId,
      avatar:
        freelancer.avatar ||
        "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=256&q=80"
    };
    const nextSent = [clientSentEntry, ...sentProposals].slice(0, 10);
    setSentProposals(nextSent);
    if (typeof window !== "undefined") {
      localStorage.setItem("client:sentProposals", JSON.stringify(nextSent));
    }
    toast.success(`Proposal sent to ${freelancer.name}`);
    setIsFreelancerModalOpen(false);
  };

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
    setIsFreelancerModalOpen(true);
  };

  useEffect(() => {
    const fetchFreelancers = async () => {
      try {
        setFreelancersLoading(true);
        const data = await listFreelancers();
        const normalized = Array.isArray(data)
          ? data.map((f) => {
              const skillsText =
                Array.isArray(f.skills) && f.skills.length
                  ? f.skills.join(", ")
                  : f.bio || "Freelancer";
              return {
                name: f.fullName || f.name || "Freelancer",
                specialty: skillsText,
                rating: f.rating || "4.7",
                projects: f.projects || "—",
                availability: f.availability || (f.hourlyRate ? `$${f.hourlyRate}/hr` : "Available"),
                serviceMatch: skillsText || "Freelancer"
              };
            })
          : [];
        setFreelancers(normalized);
      } catch (error) {
        console.error("Failed to load freelancers", error);
      } finally {
        setFreelancersLoading(false);
      }
    };

    if (isFreelancerModalOpen && freelancers.length === 0 && !freelancersLoading) {
      fetchFreelancers();
    }
  }, [isFreelancerModalOpen, freelancers.length, freelancersLoading]);

  useEffect(() => {
    if (notificationsChecked) return;
    if (typeof window === "undefined") return;
    const stored = JSON.parse(localStorage.getItem("client:notifications") || "[]");
    if (stored.length) {
      stored.forEach((notif) => {
        toast.success(notif.message);
      });
      localStorage.removeItem("client:notifications");
    }
    setNotificationsChecked(true);
  }, [notificationsChecked]);

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
          <Card className="overflow-hidden border border-border bg-card text-card-foreground shadow-lg">
            <CardHeader className="space-y-1 border-b border-border bg-card">
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
                  <div
                    className="mt-4 rounded-2xl border border-border bg-card p-6 text-card-foreground shadow-lg"
                    style={{
                      backgroundColor: "var(--card)",
                      color: "var(--card-foreground)",
                      backgroundImage:
                        "linear-gradient(to bottom, rgba(0,0,0,0.03), rgba(0,0,0,0.05))"
                    }}>
                    <p className="text-[11px] uppercase tracking-[0.5em] text-primary">
                      --- Project Proposal ---
                    </p>
                    {hasSavedProposal ? (
                      <div className="mt-4 space-y-5">
                        <div className="space-y-2">
                          <p className="text-xs font-semibold uppercase text-muted-foreground">
                            Project Title
                          </p>
                          <div className="flex flex-col gap-1">
                            <p className="text-xl font-semibold text-primary">
                              {savedProposalDetails.projectTitle}
                            </p>
                            {savedProposalDetails.projectSubtype ? (
                              <p className="text-xs uppercase tracking-[0.25em] text-primary/70">
                                {savedProposalDetails.projectSubtype}
                              </p>
                            ) : null}
                            <p className="text-xs text-muted-foreground">
                              Service: {savedProposalDetails.service}
                            </p>
                          </div>
                        </div>
                        <div className="grid gap-4 text-sm sm:grid-cols-3">
                          <div className="space-y-1">
                            <p className="text-xs font-semibold uppercase text-primary/70">
                              Prepared for
                            </p>
                            <p className="text-foreground">
                              {savedProposalDetails.preparedFor}
                            </p>
                          </div>
                          {savedProposalDetails.budget ? (
                            <div className="space-y-1">
                              <p className="text-xs font-semibold uppercase text-primary/70">
                                Budget
                              </p>
                              <p className="text-foreground">
                                {savedProposalDetails.budget}
                              </p>
                            </div>
                          ) : null}
                          <div className="space-y-1">
                            <p className="text-xs font-semibold uppercase text-primary/70">
                              Created
                            </p>
                            <p className="text-foreground">
                              {savedProposalDetails.createdAtDisplay}
                            </p>
                          </div>
                        </div>
                        <div className="space-y-2 rounded-xl border border-border bg-muted/40 p-4 text-sm leading-relaxed text-foreground">
                          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-primary/70">
                            Proposal Overview
                          </p>
                          <div className="max-h-80 overflow-y-auto pr-2 scrollbar-thin">
                            <pre className="whitespace-pre-wrap font-sans text-[14px] leading-7 text-foreground">
                              {savedProposalDetails.summary ||
                                "Proposal details recovered from your previous session."}
                            </pre>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <p className="mt-4 text-sm text-muted-foreground">
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
        {sentProposals.length > 0 && (
          <section className="grid gap-3">
            <Card className="border border-border bg-card/80 shadow-sm">
              <CardHeader>
                <CardTitle className="text-base text-foreground">Recently sent proposals</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm text-muted-foreground">
                {sentProposals.slice(0, 5).map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between rounded-lg border border-border/60 bg-muted/30 px-3 py-2">
                    <div className="min-w-0">
                      <p className="text-foreground font-medium truncate">{item.title}</p>
                      <p className="text-xs text-muted-foreground truncate">
                        {item.service} • Sent to {item.freelancer}
                      </p>
                    </div>
                    <p className="text-xs text-muted-foreground whitespace-nowrap">
                      {item.sentAt}
                    </p>
                  </div>
                ))}
              </CardContent>
            </Card>
          </section>
        )}

        <Dialog open={isFreelancerModalOpen} onOpenChange={setIsFreelancerModalOpen}>
          <DialogContent className="sm:max-w-[560px]">
            <DialogHeader>
              <DialogTitle>Send to a freelancer</DialogTitle>
              <DialogDescription>
                Based on this proposal, here are freelancers that fit. Pick one to send the proposal.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-3 max-h-[360px] overflow-y-auto pr-2">
              {(matchingFreelancers.length ? matchingFreelancers : recommendedFreelancers).map(
                (freelancer, idx) => (
                  <div
                    key={`${freelancer.name}-${idx}`}
                    className="rounded-lg border border-border bg-muted/40 p-3 flex items-center justify-between gap-3">
                    <div className="space-y-1">
                      <p className="text-base font-semibold text-foreground">{freelancer.name}</p>
                      <p className="text-sm text-muted-foreground">{freelancer.specialty}</p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span className="font-semibold text-primary">★ {freelancer.rating}</span>
                        <span>•</span>
                        <span>{freelancer.projects} projects</span>
                        <span>•</span>
                        <span>{freelancer.availability}</span>
                      </div>
                    </div>
                      <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm">
                          View profile
                        </Button>
                      <Button size="sm" onClick={() => sendProposalToFreelancer(freelancer)}>
                        Send
                      </Button>
                    </div>
                  </div>
                )
              )}
              {freelancersLoading && (
                <p className="text-sm text-muted-foreground">Loading freelancers...</p>
              )}
              {!matchingFreelancers.length && (
                <p className="text-sm text-muted-foreground">
                  Showing recommended freelancers across all services.
                </p>
              )}
            </div>
            <DialogFooter className="justify-end">
              <Button variant="ghost" onClick={() => setIsFreelancerModalOpen(false)}>
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
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
