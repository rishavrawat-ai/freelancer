"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { CheckCircle2, Clock, FileText, MoreVertical, XCircle } from "lucide-react";
import { RoleAwareSidebar } from "@/components/dashboard/RoleAwareSidebar";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ClientTopBar } from "@/components/client/ClientTopBar";
import { useAuth } from "@/context/AuthContext";

const statusConfig = {
  pending: {
    label: "Pending",
    icon: Clock,
    className:
      "bg-yellow-500/15 text-yellow-700 border-yellow-200 dark:text-yellow-400 dark:border-yellow-500/30",
    dotColor: "bg-yellow-500"
  },
  accepted: {
    label: "Accepted",
    icon: CheckCircle2,
    className:
      "bg-green-500/15 text-green-700 border-green-200 dark:text-green-400 dark:border-green-500/30",
    dotColor: "bg-green-500"
  },
  sent: {
    label: "Sent",
    icon: FileText,
    className:
      "bg-blue-500/15 text-blue-700 border-blue-200 dark:text-blue-400 dark:border-blue-500/30",
    dotColor: "bg-blue-500"
  },
  rejected: {
    label: "Rejected",
    icon: XCircle,
    className:
      "bg-red-500/15 text-red-700 border-red-200 dark:text-red-400 dark:border-red-500/30",
    dotColor: "bg-red-500"
  }
};

const normalizeProposalStatus = (status = "") => {
  switch (status.toUpperCase()) {
    case "ACCEPTED":
      return "accepted";
    case "REJECTED":
      return "rejected";
    case "PENDING":
      return "pending";
    default:
      return "sent";
  }
};

const mapApiProposal = (proposal = {}) => {
  return {
    id: proposal.id,
    title: proposal.project?.title || proposal.title || "Proposal",
    category: proposal.project?.description ? "Project" : proposal.category || "General",
    status: normalizeProposalStatus(proposal.status || "PENDING"),
    recipientName: proposal.freelancer?.fullName || "Freelancer",
    recipientId: proposal.freelancer?.id || "FREELANCER",
    submittedDate: proposal.createdAt
      ? new Date(proposal.createdAt).toLocaleDateString()
      : new Date().toLocaleDateString(),
    proposalId: proposal.id
      ? `PRP-${proposal.id.slice(0, 6).toUpperCase()}`
      : `PRP-${Math.floor(Math.random() * 9000 + 1000)}`,
    avatar:
      proposal.avatar ||
      "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=256&q=80"
  };
};

const loadLocalSent = () => {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(window.localStorage.getItem("client:sentProposals") || "[]");
  } catch {
    return [];
  }
};

const mapLocalProposal = (proposal = {}) => ({
  id: proposal.id || proposal.proposalId || `prp-${Math.floor(Math.random() * 1e6)}`,
  title: proposal.title || "Proposal",
  category: proposal.service || proposal.category || "General",
  status: normalizeProposalStatus(proposal.status || "SENT"),
  recipientName: proposal.recipientName || "Freelancer",
  recipientId: proposal.recipientId || "FREELANCER",
  submittedDate: proposal.submittedDate || new Date().toLocaleDateString(),
  proposalId: proposal.proposalId || `PRP-${Math.floor(Math.random() * 9000 + 1000)}`,
  avatar:
    proposal.avatar ||
    "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=256&q=80"
});

const ProposalCard = ({ proposal }) => {
  const config = statusConfig[proposal.status] || statusConfig.sent;
  const StatusIcon = config.icon;

  return (
    <Card className="group overflow-hidden border border-border/50 bg-card/70 shadow-sm transition-all duration-300 hover:border-primary/30 hover:shadow-lg">
      <CardContent className="p-5 lg:p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:gap-6">
          <div className="relative h-16 w-16 flex-shrink-0 rounded-2xl border border-border/50 bg-muted/60 shadow-inner">
            <img
              src={proposal.avatar}
              alt={proposal.recipientName}
              className="h-full w-full rounded-2xl object-cover"
            />
            <span
              className={`absolute bottom-1 right-1 h-3.5 w-3.5 rounded-full ring-2 ring-card ${config.dotColor}`}
            />
          </div>

          <div className="flex-1 min-w-0 space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="truncate text-lg font-semibold text-foreground">
                {proposal.title}
              </h3>
              <Badge
                variant="outline"
                className={`flex items-center gap-1 border px-2 py-0.5 text-xs font-medium ${config.className}`}
              >
                <StatusIcon className="h-3 w-3" />
                {config.label}
              </Badge>
            </div>

            <div className="grid gap-3 text-xs text-muted-foreground sm:grid-cols-2 lg:grid-cols-4">
              <div>
                <p className="uppercase tracking-widest text-[10px]">Recipient</p>
                <p className="font-medium text-foreground">{proposal.recipientName}</p>
              </div>
              <div>
                <p className="uppercase tracking-widest text-[10px]">Submitted</p>
                <p className="font-medium text-foreground">{proposal.submittedDate}</p>
              </div>
            </div>
          </div>

          <div className="flex flex-shrink-0 flex-col items-center gap-2 self-start lg:self-auto">
            <Button
              asChild
              size="sm"
              className="hidden sm:inline-flex bg-primary text-primary-foreground hover:bg-primary/90"
            >
              <Link to={`/client/proposal/${proposal.id}`}>Open</Link>
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="border-border bg-transparent hover:bg-muted"
            >
              Delete
            </Button>
            <button className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground lg:hidden">
              <MoreVertical className="h-4 w-4" />
            </button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

const ClientProposalContent = () => {
  const { isAuthenticated, authFetch } = useAuth();
  const [proposals, setProposals] = useState([]);

  useEffect(() => {
    if (!isAuthenticated) return;

    let isMounted = true;

    const fetchProposals = async () => {
      try {
        const response = await authFetch("/proposals?as=owner");
        const payload = await response.json().catch(() => null);
        const remote = Array.isArray(payload?.data) ? payload.data : [];
        if (!isMounted) return;

        const remoteNormalized = remote.map(mapApiProposal);
        const localNormalized = loadLocalSent().map(mapLocalProposal);

        const mergedMap = new Map();
        [...remoteNormalized, ...localNormalized].forEach((p) => {
          if (p?.id) mergedMap.set(p.id, p);
        });

        setProposals(Array.from(mergedMap.values()));
      } catch (error) {
        console.error("Failed to load proposals from API:", error);
      }
    };

    fetchProposals();

    return () => {
      isMounted = false;
    };
  }, [authFetch, isAuthenticated]);

  const grouped = useMemo(() => {
    return proposals.reduce(
      (acc, proposal) => {
        const bucket = proposal.status === "accepted" ? "accepted" : "sent";
        acc[bucket] = [...(acc[bucket] || []), proposal];
        return acc;
      },
      { sent: [], accepted: [] }
    );
  }, [proposals]);

  const sectionsToRender = [
    { key: "sent", title: "Sent" },
    { key: "accepted", title: "Accepted" }
  ];

  return (
    <div className="space-y-6 p-6">
      <ClientTopBar />

      <div className="space-y-6">
        {sectionsToRender.map(({ key, title }) => (
          <div key={key} className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">{title}</h2>
              <Badge variant="outline">{grouped[key]?.length || 0}</Badge>
            </div>
            {grouped[key]?.length ? (
              <div className="space-y-4">
                {grouped[key].map((proposal) => (
                  <ProposalCard key={proposal.id} proposal={proposal} />
                ))}
              </div>
            ) : (
              <div className="rounded-xl border border-dashed border-border/60 bg-card/40 px-4 py-6 text-sm text-muted-foreground">
                No {title.toLowerCase()} proposals yet.
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

const ClientProposal = () => {
  return (
    <RoleAwareSidebar>
      <ClientProposalContent />
    </RoleAwareSidebar>
  );
};

export default ClientProposal;
