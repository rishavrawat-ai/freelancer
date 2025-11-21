import React, { useEffect, useMemo, useState } from "react";
import {
  Briefcase,
  CalendarRange,
  CheckCircle2,
  Clock,
  MessageSquare,
  Sparkles,
  Banknote,
} from "lucide-react";
import { RoleAwareSidebar } from "@/components/dashboard/RoleAwareSidebar";
import { getSession } from "@/lib/auth-storage";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { FreelancerTopBar } from "@/components/freelancer/FreelancerTopBar";

const dashboardTemplates = {
  FREELANCER: {
    heroSubtitle:
      "Track pitches, monitor replies, and stay ahead of deliverables.",
    metrics: [
      {
        label: "Active Projects",
        value: "4",
        trend: "+1 this week",
        icon: Briefcase,
      },
      {
        label: "Proposals Received",
        value: "12",
        trend: "3 awaiting reply",
        icon: Sparkles,
      },
      {
        label: "Project Completed",
        value: "2.4 hrs",
        trend: "Faster than 82% of peers",
        icon: Clock,
      },
      {
        label: "Total Earnings",
        value: "₹ 1.2k",
        trend: "Faster than 82% of peers",
           icon: Banknote,
      },
    ],
    pipelineTitle: "Active pipeline",
    pipelineDescription: "Priority projects requiring action",
    pipeline: [
      {
        title: "AI onboarding revamp",
        client: "Arcadia Systems",
        status: "Review in progress",
        due: "Due Friday",
      },
      {
        title: "Brand film microsite",
        client: "Northwind Films",
        status: "Kickoff scheduled",
        due: "Starts next week",
      },
      {
        title: "Founder deck polish",
        client: "Chroma Labs",
        status: "Waiting on feedback",
        due: "Revisions due tomorrow",
      },
    ],
    availabilityTitle: "Practice load",
    availabilityDescription: "Where your hours are committed",
    availability: [
      { label: "Discovery & ideation", progress: 80 },
      { label: "Design & prototyping", progress: 55 },
      { label: "Implementation & QA", progress: 35 },
    ],
    messagesTitle: "Inbox",
    messagesDescription: "Replies and invites waiting on you",
    messages: [
      {
        from: "Leah Park",
        company: "Tempo.fm",
        excerpt:
          "Loved your exploration - can you add a version with darker gradients?",
        time: "12m ago",
      },
      {
        from: "Ahmed Rafay",
        company: "Lightspeed",
        excerpt:
          "Contracts signed! Kicking off as soon as you drop the onboarding doc.",
        time: "1h ago",
      },
    ],
    remindersTitle: "Reminders",
    remindersDescription: "Keep the momentum with quick nudges",
    reminders: [
      {
        icon: Clock,
        title: "Follow up with Chroma Labs",
        subtitle: "Draft ready to send",
      },
      {
        icon: Briefcase,
        title: "Prep Aurora workshop assets",
        subtitle: "Session in 36 hours",
      },
    ],
  },
};

export const DashboardContent = ({ roleOverride }) => {
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
    remindersDescription,
  } = template;

  const heroTitle = sessionUser?.fullName?.trim()
    ? `${sessionUser.fullName.split(" ")[0]}'s control room`
    : `${roleLabel} control room`;
  return (
    <>
      <div className="relative flex flex-col gap-6 p-6">
        <FreelancerTopBar label={dashboardLabel} />

        <header className="flex flex-col gap-1">
          <h1 className="text-2xl font-semibold leading-tight">{heroTitle}</h1>
          <p className="text-muted-foreground">{heroSubtitle}</p>
        </header>

        <section className="grid gap-4 md:grid-cols-4">
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
                  className="flex flex-col gap-2 rounded-lg border bg-card/50 p-4 md:flex-row md:items-center md:justify-between">
                  <div>
                    <p className="font-semibold leading-tight">
                      {project.title}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {project.client}
                    </p>
                  </div>
                  <div className="flex items-center gap-4">
                    <Badge variant="secondary">{project.status}</Badge>
                    <p className="text-sm text-muted-foreground">
                      {project.due}
                    </p>
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
                    <span className="text-muted-foreground">
                      {track.progress}%
                    </span>
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
                  className="rounded-lg border bg-card/60 p-4 shadow-sm">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{message.from}</p>
                      <p className="text-sm text-muted-foreground">
                        {message.company}
                      </p>
                    </div>
                    <Badge variant="outline" className="gap-1">
                      <CheckCircle2 className="size-3" />
                      High intent
                    </Badge>
                  </div>
                  <p className="mt-2 text-sm text-muted-foreground">
                    {message.excerpt}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {message.time}
                  </p>
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
                <div
                  key={title}
                  className="flex items-center gap-3 rounded-lg border bg-card/40 p-3">
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
    </>
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
