import { useEffect, useMemo, useState } from "react";
import {
  Briefcase,
  CalendarRange,
  CheckCircle2,
  ChevronRight,
  Clock,
  MessageSquare,
  PanelLeftClose,
  PanelLeftOpen,
  Sparkles
} from "lucide-react";
import { RoleAwareSidebar } from "@/components/dashboard/RoleAwareSidebar";
import { useSidebar } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { getSession } from "@/lib/auth-storage";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

const dashboardTemplates = {
  FREELANCER: {
    heroSubtitle: "Track pitches, monitor replies, and stay ahead of deliverables.",
    metrics: [
      { label: "Active contracts", value: "4", trend: "+1 this week", icon: Briefcase },
      { label: "Proposals sent", value: "12", trend: "3 awaiting reply", icon: Sparkles },
      { label: "Avg. response time", value: "2.4 hrs", trend: "Faster than 82% of peers", icon: Clock }
    ],
    pipelineTitle: "Active pipeline",
    pipelineDescription: "Priority projects requiring action",
    pipeline: [
      { title: "AI onboarding revamp", client: "Arcadia Systems", status: "Review in progress", due: "Due Friday" },
      { title: "Brand film microsite", client: "Northwind Films", status: "Kickoff scheduled", due: "Starts next week" },
      { title: "Founder deck polish", client: "Chroma Labs", status: "Waiting on feedback", due: "Revisions due tomorrow" }
    ],
    availabilityTitle: "Practice load",
    availabilityDescription: "Where your hours are committed",
    availability: [
      { label: "Discovery & ideation", progress: 80 },
      { label: "Design & prototyping", progress: 55 },
      { label: "Implementation & QA", progress: 35 }
    ],
    messagesTitle: "Inbox",
    messagesDescription: "Replies and invites waiting on you",
    messages: [
      {
        from: "Leah Park",
        company: "Tempo.fm",
        excerpt: "Loved your exploration - can you add a version with darker gradients?",
        time: "12m ago"
      },
      {
        from: "Ahmed Rafay",
        company: "Lightspeed",
        excerpt: "Contracts signed! Kicking off as soon as you drop the onboarding doc.",
        time: "1h ago"
      }
    ],
    remindersTitle: "Reminders",
    remindersDescription: "Keep the momentum with quick nudges",
    reminders: [
      { icon: Clock, title: "Follow up with Chroma Labs", subtitle: "Draft ready to send" },
      { icon: Briefcase, title: "Prep Aurora workshop assets", subtitle: "Session in 36 hours" }
    ]
  },
  CLIENT: {
    heroSubtitle: "Review proposals, unlock talent, and keep budgets on track.",
    metrics: [
      { label: "Open briefs", value: "6", trend: "2 awaiting review", icon: Briefcase },
      { label: "Active freelancers", value: "3", trend: "1 onboarding", icon: Sparkles },
      { label: "Avg. response time", value: "1.9 hrs", trend: "Vendors are responsive", icon: Clock }
    ],
    pipelineTitle: "Hiring pipeline",
    pipelineDescription: "Where decisions are pending",
    pipeline: [
      { title: "Product launch video", client: "Internal", status: "Interviewing", due: "Pick this week" },
      { title: "Lifecycle email flows", client: "Internal", status: "Shortlist ready", due: "Review today" },
      { title: "Investor portal UI", client: "Internal", status: "Waiting on proposal", due: "ETA tomorrow" }
    ],
    availabilityTitle: "Budget allocation",
    availabilityDescription: "Hours committed by phase",
    availability: [
      { label: "Discovery & scoping", progress: 65 },
      { label: "Production", progress: 40 },
      { label: "QA & rollout", progress: 25 }
    ],
    messagesTitle: "Vendor updates",
    messagesDescription: "Latest freelancer communication",
    messages: [
      {
        from: "Nova Design Lab",
        company: "Vendor",
        excerpt: "Shared the figma handoff and notes for review.",
        time: "30m ago"
      },
      {
        from: "Atlas Collective",
        company: "Vendor",
        excerpt: "Budget tweak approved—sending updated agreement.",
        time: "2h ago"
      }
    ],
    remindersTitle: "Approvals",
    remindersDescription: "Actions to keep work moving",
    reminders: [
      { icon: Clock, title: "Approve Nova invoice", subtitle: "Due in 2 days" },
      { icon: Briefcase, title: "Review Atlas contract", subtitle: "Legal feedback ready" }
    ]
  }
};

const DashboardContent = ({ roleOverride }) => {
  const { state, toggleSidebar } = useSidebar();
  const [sessionUser, setSessionUser] = useState(null);

  useEffect(() => {
    const session = getSession();
    setSessionUser(session?.user ?? null);
  }, []);

  const effectiveRole = roleOverride ?? sessionUser?.role ?? "FREELANCER";

  const roleLabel = useMemo(() => {
    const baseRole = effectiveRole;
    const normalized = baseRole.toLowerCase();
    return normalized.charAt(0).toUpperCase() + normalized.slice(1);
  }, [effectiveRole]);

  const dashboardLabel = sessionUser?.fullName?.trim()
    ? `${sessionUser.fullName.trim()}'s dashboard`
    : `${roleLabel} dashboard`;

  const template = useMemo(() => {
    const roleKey = effectiveRole;
    return dashboardTemplates[roleKey] ?? dashboardTemplates.FREELANCER;
  }, [effectiveRole]);

  const {
    heroSubtitle,
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
    remindersDescription
  } = template;

  const heroTitle = sessionUser?.fullName?.trim()
    ? `${sessionUser.fullName.split(" ")[0]}'s control room`
    : `${roleLabel} control room`;

  const sidebarClosed = state === "collapsed";
  const SidebarToggleIcon = sidebarClosed ? PanelLeftOpen : PanelLeftClose;

  return (
    <div className="relative flex flex-col gap-6 p-6">
      <div className="absolute left-6 top-4 flex items-center gap-2">
        <Button
          variant="ghost"
          size="icon"
          className="rounded-full border border-border text-muted-foreground hover:text-foreground"
          onClick={toggleSidebar}
        >
          <SidebarToggleIcon className="size-4" />
          <span className="sr-only">
            {sidebarClosed ? "Open navigation" : "Close navigation"}
          </span>
        </Button>
        <div className="flex items-center gap-1 rounded-full px-3 py-1 text-sm font-medium text-muted-foreground">
          <span className="truncate">{dashboardLabel}</span>
          <ChevronRight className="size-3.5" />
        </div>
      </div>
      <header className="flex flex-col gap-4 pt-12 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-sm text-muted-foreground">Today</p>
          <h1 className="text-2xl font-semibold leading-tight">{heroTitle}</h1>
          <p className="text-muted-foreground">{heroSubtitle}</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" className="gap-2">
            <CalendarRange className="size-4" />
            Sync calendar
          </Button>
          <Button size="sm" className="gap-2">
            <MessageSquare className="size-4" />
            Quick reply
          </Button>
        </div>
      </header>

        <section className="grid gap-4 md:grid-cols-3">
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
                  <p className="text-sm text-muted-foreground">{metric.trend}</p>
                </CardContent>
              </Card>
            );
          })}
        </section>

        <section className="grid gap-4 lg:grid-cols-3">
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>{pipelineTitle ?? "Pipeline"}</CardTitle>
              <CardDescription>{pipelineDescription}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {pipeline.map((project) => (
                <div
                  key={project.title}
                  className="flex flex-col gap-2 rounded-lg border bg-card/50 p-4 md:flex-row md:items-center md:justify-between"
                >
                  <div>
                    <p className="font-semibold leading-tight">{project.title}</p>
                    <p className="text-sm text-muted-foreground">{project.client}</p>
                  </div>
                  <div className="flex items-center gap-4">
                    <Badge variant="secondary">{project.status}</Badge>
                    <p className="text-sm text-muted-foreground">{project.due}</p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{availabilityTitle ?? "Workload"}</CardTitle>
              <CardDescription>{availabilityDescription}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {availability.map((track) => (
                <div key={track.label} className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span>{track.label}</span>
                    <span className="text-muted-foreground">{track.progress}%</span>
                  </div>
                  <Progress value={track.progress} />
                </div>
              ))}
            </CardContent>
          </Card>
        </section>

        <section className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>{messagesTitle ?? "Messages"}</CardTitle>
              <CardDescription>{messagesDescription}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {messages.map((message) => (
                <div
                  key={message.from}
                  className="rounded-lg border bg-card/60 p-4 shadow-sm"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{message.from}</p>
                      <p className="text-sm text-muted-foreground">{message.company}</p>
                    </div>
                    <Badge variant="outline" className="gap-1">
                      <CheckCircle2 className="size-3" />
                      High intent
                    </Badge>
                  </div>
                  <p className="mt-2 text-sm text-muted-foreground">{message.excerpt}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{message.time}</p>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{remindersTitle ?? "Reminders"}</CardTitle>
              <CardDescription>{remindersDescription}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {reminders.map(({ icon: ReminderIcon, title, subtitle }) => (
                <div key={title} className="flex items-center gap-3 rounded-lg border bg-card/40 p-3">
                  <ReminderIcon className="size-5 text-primary" />
                  <div>
                    <p className="text-sm font-medium">{title}</p>
                    <p className="text-xs text-muted-foreground">{subtitle}</p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </section>
      </div>
  );
};

const FreelancerDashboard = () => {
  return (
    <RoleAwareSidebar>
      <DashboardContent />
    </RoleAwareSidebar>
  );
};

export const ClientDashboard = () => {
  return (
    <RoleAwareSidebar>
      <DashboardContent roleOverride="CLIENT" />
    </RoleAwareSidebar>
  );
};

export default FreelancerDashboard;







