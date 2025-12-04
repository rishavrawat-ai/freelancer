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

  Star,
  MapPin,
  CheckCircle,
  Heart,
  ChevronRight,
  Zap,
  X,
} from "lucide-react";
import { RoleAwareSidebar } from "@/components/dashboard/RoleAwareSidebar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
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
import { useAuth } from "@/context/AuthContext";

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
      value: "₹ 24",
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
  {
    name: "Nova Stack",
    specialty: "Full-stack • Next.js, Node",
    rating: "4.9",
    projects: "48",
    availability: "2 slots",
    serviceMatch: "Development & Tech",
  },
  {
    name: "Lumen Creative",
    specialty: "UI/UX • Figma, Framer",
    rating: "4.8",
    projects: "36",
    availability: "3 slots",
    serviceMatch: "Creative & Design",
  },
  {
    name: "Growth Loop",
    specialty: "Performance Marketing • Meta/Google Ads",
    rating: "4.7",
    projects: "52",
    availability: "1 slot",
    serviceMatch: "Digital Marketing",
  },
  {
    name: "Opsline",
    specialty: "DevOps • AWS, CI/CD",
    rating: "4.9",
    projects: "41",
    availability: "2 slots",
    serviceMatch: "Development & Tech",
  },
];

const SAVED_PROPOSAL_STORAGE_KEYS = [
  "markify:savedProposal",
  "savedProposal",
];

const PRIMARY_PROPOSAL_STORAGE_KEY = SAVED_PROPOSAL_STORAGE_KEYS[0];
const PROPOSAL_DRAFT_STORAGE_KEY = "markify:pendingProposal";

const loadSavedProposalFromStorage = () => {
  if (typeof window === "undefined") {
    return null;
  }

  for (const storageKey of SAVED_PROPOSAL_STORAGE_KEYS) {
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

const persistProposalDraftToStorage = (proposal) => {
  if (typeof window === "undefined" || !proposal) {
    return;
  }
  window.localStorage.setItem(
    PROPOSAL_DRAFT_STORAGE_KEY,
    JSON.stringify(proposal)
  );
};

const clearSavedProposalFromStorage = () => {
  if (typeof window === "undefined") {
    return;
  }

  SAVED_PROPOSAL_STORAGE_KEYS.forEach((storageKey) => {
    window.localStorage.removeItem(storageKey);
  });
  // keep drafts (markify:pendingProposal) intact so they remain available on drafts page
  window.localStorage.removeItem("markify:savedProposalSynced");
};

const templateMetrics = dashboardTemplate.metrics || [];

const FreelancerCard = ({ freelancer, onSend, canSend }) => {
  return (
    <Card className="group w-full hover:shadow-xl hover:border-primary/20 flex flex-col h-full overflow-hidden bg-card transition-all duration-300">
      {/* Header Section */}
      <div className="p-6 pb-2">
        <div className="flex justify-between items-start mb-4">
          <div className="flex gap-4">
            <div className="relative">
              <div className="relative flex h-16 w-16 shrink-0 overflow-hidden rounded-full border-2 border-background shadow-sm ring-1 ring-border">
                {freelancer.avatar ? (
                  <img
                    className="aspect-square h-full w-full object-cover transition-transform duration-500 hover:scale-110"
                    src={freelancer.avatar}
                    alt={freelancer.name}
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-muted text-muted-foreground font-bold text-lg">
                    {freelancer.name?.charAt(0) || "F"}
                  </div>
                )}
              </div>
              {/* Simulated verified badge for demo purposes or if data exists */}
              <div className="absolute -bottom-1 -right-1 bg-background rounded-full p-[2px] shadow-sm ring-1 ring-border">
              </div>
            </div>
            <div className="pt-1">
              <h3 className="font-bold text-xl leading-none tracking-tight text-foreground flex items-center gap-2 group-hover:text-primary transition-colors">
                {freelancer.name}
              </h3>
              <p className="text-sm font-medium text-muted-foreground mt-1.5 flex items-center gap-1.5">
                <Briefcase className="w-3.5 h-3.5 text-muted-foreground/70" />
                {freelancer.specialty}
              </p>
              <div className="flex items-center gap-1.5 mt-1 text-xs text-muted-foreground/70 font-medium">
                <MapPin className="w-3 h-3" />
                {freelancer.availability}
              </div>
            </div>
          </div>
          <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors">
            <Heart className="w-5 h-5" />
          </Button>
        </div>
        
        {/* Stats Row */}
        <div className="flex items-center justify-center text-sm mt-5 bg-muted/50 p-3 rounded-lg border border-border/50 group-hover:bg-primary/5 group-hover:border-primary/10 transition-colors">
          <div className="flex flex-col items-center px-2">
            <span className="font-bold text-foreground flex items-center gap-1.5 text-base">
              {freelancer.rating} <Star className="w-3.5 h-3.5 fill-primary text-primary" />
            </span>
            <span className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground mt-0.5">Rating</span>
          </div>
          <div className="w-px h-8 bg-border/60 mx-4"></div>
          <div className="flex flex-col items-center px-2">
             <span className="font-bold text-foreground flex items-center gap-1.5 text-base">
              {freelancer.projects}
            </span>
            <span className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground mt-0.5">Projects</span>
          </div>
        </div>
      </div>

      <CardContent className="flex-grow pt-3 px-5">
        {/* Styled "Outline Box" */}
        <div className="relative overflow-hidden rounded-xl bg-muted/30 border border-border/50 p-5 text-foreground transition-all duration-300">
            
            <div className="flex justify-between items-center mb-3 relative z-10">
                <div className="flex items-center gap-2">
                    <Zap className="w-3.5 h-3.5 text-primary" />
                    <h4 className="font-semibold text-xs uppercase tracking-widest text-muted-foreground">About Me</h4>
                </div>
            </div>

            <p className="text-[13px] text-muted-foreground line-clamp-3 mb-5 leading-relaxed relative z-10 font-normal tracking-wide">
                {freelancer.bio || `Experienced ${freelancer.specialty} professional ready to help with your project.`}
            </p>
          
            <div className="flex flex-wrap gap-2 relative z-10">
                {(freelancer.skills || []).slice(0, 3).map((skill, index) => (
                <Badge key={index} variant="outline" className="bg-background/50 hover:bg-background">
                    {skill}
                </Badge>
                ))}
            </div>
        </div>
      </CardContent>

      <div className="px-6 pb-6 mt-auto">
         <div className="h-px w-full bg-border/50 my-4"></div>
         <div className="grid grid-cols-2 gap-3">
            <Button variant="outline" className="w-full font-semibold">
              View Profile
            </Button>
            <Button 
              className="w-full gap-2 font-semibold bg-primary text-primary-foreground hover:bg-primary/90"
              onClick={() => onSend(freelancer)}
              disabled={!canSend}
            >
              Proposal <ChevronRight className="w-4 h-4" />
            </Button>
         </div>
      </div>
    </Card>
  );
};

const FreelancerCardSkeleton = () => (
  <Card className="w-full h-full flex flex-col overflow-hidden bg-card">
    <div className="p-6 pb-2">
      <div className="flex justify-between items-start mb-4">
        <div className="flex gap-4 w-full">
          <Skeleton className="h-16 w-16 rounded-full shrink-0" />
          <div className="pt-1 flex-1 space-y-2">
            <Skeleton className="h-6 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-3 w-1/3" />
          </div>
        </div>
      </div>
      <div className="mt-5 p-3 border border-border/50 rounded-lg flex justify-center gap-4 bg-muted/50">
         <Skeleton className="h-8 w-16" />
         <div className="w-px h-8 bg-border/60"></div>
         <Skeleton className="h-8 w-16" />
      </div>
    </div>
    <CardContent className="flex-grow pt-3 px-5">
        <Skeleton className="h-32 w-full rounded-xl" />
    </CardContent>
    <div className="px-6 pb-6 mt-auto">
        <div className="h-px w-full bg-border/50 my-4"></div>
        <div className="grid grid-cols-2 gap-3">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
        </div>
    </div>
  </Card>
);

const ClientDashboardContent = () => {
  const [sessionUser, setSessionUser] = useState(null);
  const [savedProposal, setSavedProposal] = useState(null);
  const [proposalDeliveryState, setProposalDeliveryState] = useState("idle");
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [proposalDraft, setProposalDraft] = useState("");
  const [proposalDraftContent, setProposalDraftContent] = useState("");
  const [isFreelancerModalOpen, setIsFreelancerModalOpen] = useState(false);
  const [pendingSendFreelancer, setPendingSendFreelancer] = useState(null);
  const [isSendConfirmOpen, setIsSendConfirmOpen] = useState(false);
  const [freelancers, setFreelancers] = useState([]);
  const [freelancersLoading, setFreelancersLoading] = useState(false);
  const { authFetch } = useAuth();
  const [notificationsChecked, setNotificationsChecked] = useState(false);
  const [projects, setProjects] = useState([]);
  const [isLoadingProjects, setIsLoadingProjects] = useState(false);
  const heroSubtitle = dashboardTemplate.heroSubtitle;
  const [metrics, setMetrics] = useState(templateMetrics);

  useEffect(() => {
    const session = getSession();
    setSessionUser(session?.user ?? null);
  }, []);

  useEffect(() => {
    setSavedProposal(loadSavedProposalFromStorage());
  }, []);

  // Load projects for metrics
  useEffect(() => {
    const loadProjects = async () => {
      if (!authFetch) return;
      try {
        setIsLoadingProjects(true);
        const response = await authFetch("/projects");
        const payload = await response.json().catch(() => null);
        const list = Array.isArray(payload?.data) ? payload.data : [];
        setProjects(list);

        // Build metrics from project data
        const active = list.filter(
          (p) => (p.status || "").toUpperCase() === "OPEN"
        );
        const completed = list.filter(
          (p) => (p.status || "").toUpperCase() === "COMPLETED"
        );
        const proposalsSent = list.reduce(
          (acc, project) => acc + (project.proposals?.length || 0),
          0
        );
        const totalSpend = list.reduce(
          (acc, project) => acc + (project.budget || 0),
          0
        );

        setMetrics([
          {
            label: "Active projects",
            value: String(active.length),
            trend: `${list.length - active.length} awaiting review`,
            icon: Briefcase,
          },
          {
            label: "Completed projects",
            value: String(completed.length),
            trend: `${Math.max(list.length - completed.length, 0)} in progress`,
            icon: Sparkles,
          },
          {
            label: "Proposals Sent",
            value: String(proposalsSent),
            trend: proposalsSent
              ? "Vendors are responsive"
              : "Send your first proposal",
            icon: Clock,
          },
          {
            label: "Total Spend",
            value: totalSpend ? `₹${totalSpend.toLocaleString()}` : "₹0",
            trend: proposalsSent ? "Vendors are responsive" : "No spend yet",
            icon: Banknote,
          },
        ]);
      } catch (error) {
        console.error("Failed to load projects", error);
        setMetrics(templateMetrics);
      } finally {
        setIsLoadingProjects(false);
      }
    };

    loadProjects();
  }, [authFetch, templateMetrics]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return undefined;
    }

    const handleStorageChange = (event) => {
      if (event?.key && !SAVED_PROPOSAL_STORAGE_KEYS.includes(event.key)) {
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
      hour12: true,
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
          ? `₹${budgetValue.toLocaleString()}`
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

  const sendProposalToFreelancer = async (freelancer) => {
    if (!savedProposalDetails) return;
    if (!freelancer?.id) {
      toast.error(
        "Please select a freelancer with a valid account to send this proposal."
      );
      return;
    }

    const coverLetter =
      savedProposalDetails.summary ||
      savedProposalDetails.raw?.coverLetter ||
      "Proposal submission";

    const amount = Number(
      (
        savedProposalDetails.raw?.budget ||
        savedProposalDetails.raw?.budgetRange ||
        savedProposalDetails.raw?.estimate ||
        ""
      )
        .toString()
        .replace(/[^0-9.]/g, "")
    );

    const resolveProject = async () => {
      const existingProjectId =
        savedProposalDetails.raw?.projectId ||
        savedProposalDetails.raw?.project?.id ||
        savedProposalDetails.projectId ||
        null;

      if (existingProjectId)
        return { projectId: existingProjectId, proposalFromProject: null };

      // Create a minimal project and attach the proposal in one call.
      const payload = {
        title: savedProposalDetails.projectTitle || "Untitled Project",
        description:
          coverLetter ||
          savedProposalDetails.service ||
          "Project created for proposal",
        budget: Number.isFinite(amount) ? amount : undefined,
        proposal: {
          coverLetter,
          amount: Number.isFinite(amount) ? amount : 0,
          status: "PENDING",
          freelancerId: freelancer.id,
        },
      };

      const projectResp = await authFetch("/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!projectResp.ok) {
        const projectPayload = await projectResp.json().catch(() => null);
        throw new Error(
          projectPayload?.message || "Unable to create project for proposal."
        );
      }

      const projectPayload = await projectResp.json().catch(() => null);
      return {
        projectId:
          projectPayload?.data?.project?.id || projectPayload?.data?.id || null,
        proposalFromProject: projectPayload?.data?.proposal || null,
      };
    };

    try {
      const { projectId, proposalFromProject } = await resolveProject();
      if (!projectId) {
        throw new Error("No project available for this proposal.");
      }

      // If the project creation already created the proposal, we are done.
      if (proposalFromProject?.id) {
        toast.success(`Proposal sent to ${freelancer.name}`);
        setIsFreelancerModalOpen(false);
        return;
      }

      // Otherwise, create the proposal against the project.
      const response = await authFetch("/proposals", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          projectId,
          coverLetter,
          amount: Number.isFinite(amount) ? amount : 0,
          status: "PENDING",
          freelancerId: freelancer.id,
        }),
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => null);
        const message = payload?.message || "Failed to send proposal.";
        throw new Error(message);
      }

      toast.success(`Proposal sent to ${freelancer.name}`);
      setIsFreelancerModalOpen(false);
    } catch (error) {
      console.error("Failed to send proposal:", error);
      toast.error(error?.message || "Unable to send proposal right now.");
    }
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

  const requestSendToFreelancer = (freelancer) => {
    setPendingSendFreelancer(freelancer);
    setIsSendConfirmOpen(true);
  };

  const handleConfirmSend = async () => {
    if (!pendingSendFreelancer) return;
    await sendProposalToFreelancer(pendingSendFreelancer);
    setPendingSendFreelancer(null);
    setIsSendConfirmOpen(false);
  };

  const handleCancelSend = () => {
    setPendingSendFreelancer(null);
    setIsSendConfirmOpen(false);
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
                id: f.id,
                name: f.fullName || f.name || "Freelancer",
                specialty: skillsText,
                rating: f.rating || "4.7",
                projects: f.projects || "4+",
                availability:
                  f.availability ||
                  (f.hourlyRate ? `₹${f.hourlyRate}/hr` : "Available"),
                serviceMatch: skillsText || "Freelancer",
                avatar:
                  f.avatar ||
                  "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=256&q=80",
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

    if (
      isFreelancerModalOpen &&
      freelancers.length === 0 &&
      !freelancersLoading
    ) {
      fetchFreelancers();
    }
  }, [isFreelancerModalOpen, freelancers.length, freelancersLoading]);

  useEffect(() => {
    if (notificationsChecked) return;
    if (typeof window === "undefined") return;
    const stored = JSON.parse(
      localStorage.getItem("client:notifications") || "[]"
    );
    if (stored.length) {
      stored.forEach((notif) => {
        toast.success(notif.message);
      });
      localStorage.removeItem("client:notifications");
    }
    setNotificationsChecked(true);
  }, [notificationsChecked]);

  const handleOpenProposalEditor = () => {
    if (!savedProposalDetails) return;
    const draft =
      savedProposalDetails.summary ||
      savedProposalDetails.raw?.content ||
      savedProposalDetails.raw?.summary ||
      "";
    setProposalDraft(draft);
    setIsEditModalOpen(true);
  };

  const handleSaveProposalEdit = () => {
    if (!savedProposal) return;
    const updatedProposal = {
      ...savedProposal,
      summary: proposalDraft,
      content: proposalDraft,
      updatedAt: new Date().toISOString(),
    };
    persistSavedProposalToStorage(updatedProposal);
    persistProposalDraftToStorage(updatedProposal);
    setSavedProposal(updatedProposal);
    setProposalDeliveryState("saved");
    setIsEditModalOpen(false);
    toast.success("Proposal updated.");
  };

  return (
    <>
      <div className="flex flex-col gap-6 p-6">
        <ClientTopBar label={dashboardLabel} />
        <header className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
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
                    <CardTitle className="text-2xl font-semibold text-foreground">
                      Saved Proposal
                    </CardTitle>
                    <p className="text-xs text-muted-foreground">
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
                    className="text-muted-foreground hover:text-foreground"
                    onClick={handleClearSavedProposal}
                    disabled={!hasSavedProposal}
                    aria-label="Clear saved proposal"
                  >
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
                      "linear-gradient(to bottom, rgba(0,0,0,0.03), rgba(0,0,0,0.05))",
                  }}
                >
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
                      Draft a proposal from the services page and we&apos;ll
                      keep a copy here so you can send it once you sign in.
                    </p>
                  )}
                </div>
              </div>
              <div className="flex flex-wrap gap-3">
                <Button
                  variant="outline"
                  size="lg"
                  className="h-11 flex-1 min-w-[140px] gap-2 rounded-full border-border bg-background text-foreground hover:bg-accent hover:text-accent-foreground"
                  onClick={handleOpenProposalEditor}
                  disabled={!hasSavedProposal}
                >
                  <Copy className="h-4 w-4" />
                  Edit your proposal
                </Button>
                <Button
                  size="lg"
                  className="h-11 flex-1 min-w-[160px] gap-2 rounded-full bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-30"
                  onClick={handleSendProposal}
                  disabled={!hasSavedProposal}
                >
                  <Send className="h-4 w-4" />
                  Send to Freelancer
                </Button>
                <Button
                  size="lg"
                  variant="secondary"
                  className="h-11 flex-1 min-w-[120px] gap-2 rounded-full border border-border bg-secondary text-secondary-foreground hover:bg-secondary/80 disabled:opacity-30"
                  onClick={handleSaveProposalToDashboard}
                  disabled={!hasSavedProposal}
                >
                  <Save className="h-4 w-4" />
                  Save
                </Button>
              </div>
            </CardContent>
          </Card>
        </section>
        <Dialog
          open={isFreelancerModalOpen}
          onOpenChange={(open) => {
            setIsFreelancerModalOpen(open);
            if (!open) setPendingSendFreelancer(null);
          }}
        >
          <DialogContent className="sm:max-w-[1400px] w-[95vw] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Send to a freelancer</DialogTitle>
              <DialogDescription>
                Based on this proposal, here are freelancers that fit. Pick one
                to send the proposal.
              </DialogDescription>
            </DialogHeader>
            <div className="p-1">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {(matchingFreelancers.length
                ? matchingFreelancers
                : recommendedFreelancers
              ).map((freelancer, idx) => {
                const canSend = Boolean(freelancer.id);
                // Ensure skills array exists for the card
                const enrichedFreelancer = {
                    ...freelancer,
                    skills: Array.isArray(freelancer.skills) ? freelancer.skills : (freelancer.specialty ? freelancer.specialty.split("•").map(s => s.trim()) : []),
                    bio: freelancer.bio || "Professional freelancer ready to work."
                };
                
                return (
                  <FreelancerCard 
                    key={`${freelancer.name}-${idx}`} 
                    freelancer={enrichedFreelancer} 
                    onSend={requestSendToFreelancer}
                    canSend={canSend}
                  />
                );
              })}
              </div>
              {freelancersLoading && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
                  {[1, 2, 3].map((i) => (
                    <FreelancerCardSkeleton key={i} />
                  ))}
                </div>
              )}
              {!matchingFreelancers.length && !freelancersLoading && (
                <p className="text-sm text-muted-foreground mt-4 text-center">
                  Showing recommended freelancers across all services.
                </p>
              )}
            </div>
            <DialogFooter className="justify-end">
              <Button
                variant="ghost"
                onClick={() => setIsFreelancerModalOpen(false)}
              >
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
          <DialogContent className="sm:max-w-[860px]">
            <DialogHeader>
              <DialogTitle>Edit proposal</DialogTitle>
              <DialogDescription>
                Adjust the proposal content before sending. Changes are saved to your browser.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-3">
              <label className="text-sm font-medium text-foreground">
                Proposal content
              </label>
              <textarea
                className="w-full min-h-[460px] resize-vertical rounded-md border border-border bg-background p-4 text-base text-foreground leading-6"
                value={proposalDraft}
                onChange={(e) => setProposalDraft(e.target.value)}
              />
            </div>
            <DialogFooter className="justify-end gap-2">
              <Button variant="ghost" onClick={() => setIsEditModalOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleSaveProposalEdit} disabled={!proposalDraft.trim()}>
                Save changes
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        <Dialog open={isSendConfirmOpen} onOpenChange={handleCancelSend}>
          <DialogContent className="sm:max-w-[480px]">
            <DialogHeader>
              <DialogTitle>Send this proposal?</DialogTitle>
              <DialogDescription>
                This will send the proposal to {pendingSendFreelancer?.name || "the selected freelancer"}.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="justify-end gap-2">
              <Button variant="ghost" onClick={handleCancelSend}>
                Cancel
              </Button>
              <Button onClick={handleConfirmSend} disabled={!pendingSendFreelancer}>
                Send now
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
