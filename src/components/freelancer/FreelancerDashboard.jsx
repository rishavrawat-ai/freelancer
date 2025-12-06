import React, { useEffect, useMemo, useState } from "react";
import { Briefcase, Clock, Sparkles, Banknote } from "lucide-react";
import { RoleAwareSidebar } from "@/components/dashboard/RoleAwareSidebar";
import { getSession } from "@/lib/auth-storage";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FreelancerTopBar } from "@/components/freelancer/FreelancerTopBar";
import { useAuth } from "@/context/AuthContext";

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
  const { authFetch } = useAuth();
  const [metrics, setMetrics] = useState(dashboardTemplates.FREELANCER.metrics || []);

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

  const templateMetrics = template.metrics || [];

  useEffect(() => {
    const loadMetrics = async () => {
      // Only run when authenticated fetch is available
      if (!authFetch) return;
      try {
        const response = await authFetch("/proposals?as=freelancer");
        const payload = await response.json().catch(() => null);
        const list = Array.isArray(payload?.data) ? payload.data : [];

        const pending = list.filter(
          (p) => (p.status || "").toUpperCase() === "PENDING"
        );
        const accepted = list.filter(
          (p) => (p.status || "").toUpperCase() === "ACCEPTED"
        );
        const activeProjects = accepted.length;
        // MARKIFY: Only show pending proposals in the "Proposals Received" count
        const proposalsReceived = pending.length;
        const earnings = accepted.reduce(
          (acc, p) => acc + (Number(p.amount) || 0),
          0
        );

        setMetrics([
          {
            label: "Active Projects",
            value: String(activeProjects),
            trend: `${pending.length} pending decisions`,
            icon: Briefcase,
          },
          {
            label: "Proposals Received",
            value: String(proposalsReceived),
            trend: `${pending.length} awaiting reply`,
            icon: Sparkles,
          },
          {
            label: "Accepted Proposals",
            value: String(accepted.length),
            trend: accepted.length ? "Keep momentum going" : "No wins yet",
            icon: Clock,
          },
          {
            label: "Total Earnings",
            value: earnings ? `₹${earnings.toLocaleString()}` : "₹0",
            trend: accepted.length ? "Based on accepted proposals" : "Close a deal to start earning",
            icon: Banknote,
          },
        ]);
      } catch (error) {
        console.error("Failed to load freelancer metrics", error);
        setMetrics(templateMetrics);
      }
    };

    loadMetrics();
  }, [authFetch, templateMetrics]);

  return (
    <>
      <div className="relative flex flex-col gap-6 p-6">
        <FreelancerTopBar label={dashboardLabel} />

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
