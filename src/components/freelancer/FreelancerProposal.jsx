"use client";

import React, { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  CheckCircle2,
  Clock,
  FileText,
  MoreVertical,
  XCircle,
} from "lucide-react";
import { RoleAwareSidebar } from "@/components/dashboard/RoleAwareSidebar";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FreelancerTopBar } from "@/components/freelancer/FreelancerTopBar";

const statusConfig = {
  pending: {
    label: "Pending",
    icon: Clock,
    className:
      "bg-yellow-500/15 text-yellow-700 border-yellow-200 dark:text-yellow-400 dark:border-yellow-500/30",
    dotColor: "bg-yellow-500",
  },
  received: {
    label: "Received",
    icon: FileText,
    className:
      "bg-blue-500/15 text-blue-700 border-blue-200 dark:text-blue-400 dark:border-blue-500/30",
    dotColor: "bg-blue-500",
  },
  accepted: {
    label: "Accepted",
    icon: CheckCircle2,
    className:
      "bg-green-500/15 text-green-700 border-green-200 dark:text-green-400 dark:border-green-500/30",
    dotColor: "bg-green-500",
  },
  draft: {
    label: "Draft",
    icon: XCircle,
    className:
      "bg-slate-500/15 text-slate-700 border-slate-200 dark:text-slate-300 dark:border-slate-500/30",
    dotColor: "bg-slate-500",
  },
};

const initialProposals = [
  {
    id: "launch-hero",
    title: "Product Launch Creative",
    category: "Development & Tech",
    status: "pending",
    recipientName: "Nova Design Lab",
    recipientId: "ORG-2214",
    submittedDate: "Nov 17, 2025",
    proposalId: "PRP-8234",
    avatar:
      "https://images.unsplash.com/photo-1544723795-3fb6469f5b39?auto=format&fit=crop&w=256&q=80",
  },
  {
    id: "email-suite",
    title: "Lifecycle Email Automation",
    category: "Marketing",
    status: "received",
    recipientName: "Atlas Collective",
    recipientId: "ORG-1998",
    submittedDate: "Nov 15, 2025",
    proposalId: "PRP-8120",
    avatar:
      "https://images.unsplash.com/photo-1504593811423-6dd665756598?auto=format&fit=crop&w=256&q=80",
  },
  {
    id: "portal-refresh",
    title: "Investor Portal Refresh",
    category: "Product",
    status: "accepted",
    recipientName: "Beacon Ventures",
    recipientId: "ORG-2056",
    submittedDate: "Nov 08, 2025",
    proposalId: "PRP-7791",
    avatar:
      "https://images.unsplash.com/photo-1545239351-1141bd82e8a6?auto=format&fit=crop&w=256&q=80",
  },
  {
    id: "draft-rebrand",
    title: "Brand System Refresh",
    category: "Design",
    status: "draft",
    recipientName: "Aether Labs",
    recipientId: "ORG-2077",
    submittedDate: "Oct 28, 2025",
    proposalId: "PRP-7601",
    avatar:
      "https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=256&q=80",
  },
];

const ProposalCard = ({ proposal, onStatusChange }) => {
  const config = statusConfig[proposal.status];
  const StatusIcon = config.icon;

  const handleMove = (nextStatus) => onStatusChange(proposal.id, nextStatus);

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
                <p className="uppercase tracking-widest text-[10px]">
                  Recipient
                </p>
                <p className="font-medium text-foreground">
                  {proposal.recipientName}
                </p>
              </div>
              <div>
                <p className="uppercase tracking-widest text-[10px]">ID</p>
                <p className="font-medium text-foreground">
                  {proposal.recipientId}
                </p>
              </div>
              <div className="hidden lg:block">
                <p className="uppercase tracking-widest text-[10px]">
                  Proposal ID
                </p>
                <p className="font-mono text-foreground">
                  {proposal.proposalId}
                </p>
              </div>
              <div>
                <p className="uppercase tracking-widest text-[10px]">
                  Submitted
                </p>
                <p className="font-medium text-foreground">
                  {proposal.submittedDate}
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-shrink-0 items-center gap-2 self-start lg:self-auto">
            <Button
              asChild
              size="sm"
              className="hidden sm:inline-flex bg-primary text-primary-foreground hover:bg-primary/90"
            >
              <Link to={`/freelancer/proposals/${proposal.id}`}>Open</Link>
            </Button>
            {proposal.status === "pending" && (
              <>
                <Button
                  size="sm"
                  variant="secondary"
                  className="border-border"
                  onClick={() => handleMove("received")}
                >
                  Mark received
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="border-border"
                  onClick={() => handleMove("draft")}
                >
                  Reject to draft
                </Button>
              </>
            )}
            {proposal.status === "received" && (
              <>
                <Button
                  size="sm"
                  className="bg-primary text-primary-foreground hover:bg-primary/90"
                  onClick={() => handleMove("accepted")}
                >
                  Accept
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="border-border"
                  onClick={() => handleMove("draft")}
                >
                  Reject to draft
                </Button>
              </>
            )}
            {proposal.status === "draft" && (
              <Button
                size="sm"
                variant="secondary"
                className="border-border"
                onClick={() => handleMove("pending")}
              >
                Resubmit
              </Button>
            )}
            <button className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground lg:hidden">
              <MoreVertical className="h-4 w-4" />
            </button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

const Section = ({ title, items, onStatusChange, empty }) => (
  <div className="space-y-3">
    <div className="flex items-center justify-between">
      <h2 className="text-lg font-semibold">{title}</h2>
      <Badge variant="outline">{items.length}</Badge>
    </div>
    {items.length === 0 ? (
      <div className="rounded-xl border border-dashed border-border/60 bg-card/40 px-4 py-6 text-sm text-muted-foreground">
        {empty}
      </div>
    ) : (
      <div className="space-y-3">
        {items.map((proposal) => (
          <ProposalCard
            key={proposal.id}
            proposal={proposal}
            onStatusChange={onStatusChange}
          />
        ))}
      </div>
    )}
  </div>
);

const FreelancerProposalContent = ({ filter = "all" }) => {
  const [proposals, setProposals] = useState(initialProposals);

  const grouped = useMemo(() => {
    return proposals.reduce(
      (acc, proposal) => {
        acc[proposal.status] = [...(acc[proposal.status] || []), proposal];
        return acc;
      },
      { pending: [], received: [], accepted: [], draft: [] }
    );
  }, [proposals]);

  const handleStatusChange = (id, nextStatus) => {
    setProposals((prev) =>
      prev.map((proposal) =>
        proposal.id === id ? { ...proposal, status: nextStatus } : proposal
      )
    );
  };

  const sectionsToRender =
    filter === "all"
      ? ["pending", "received", "accepted", "draft"]
      : [filter];

  return (
    <div className="space-y-6 p-6">
      <FreelancerTopBar />
      <div className="space-y-3">
        <p className="text-sm uppercase tracking-[0.4em] text-primary/70">
          Freelancer proposals
        </p>
        <div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className="text-3xl font-semibold">Proposals board</h1>
            <p className="text-muted-foreground">
              Move proposals from pending to received, accept them, or send back
              to drafts.
            </p>
          </div>
          <Button asChild size="lg" className="rounded-full">
            <Link to="/freelancer">Back to dashboard</Link>
          </Button>
        </div>
      </div>

      <div className="space-y-8">
        {sectionsToRender.includes("pending") && (
          <Section
            title="Pending"
            items={grouped.pending}
            onStatusChange={handleStatusChange}
            empty="No pending proposals right now."
          />
        )}
        {sectionsToRender.includes("received") && (
          <Section
            title="Received"
            items={grouped.received}
            onStatusChange={handleStatusChange}
            empty="Nothing has been marked received yet."
          />
        )}
        {sectionsToRender.includes("accepted") && (
          <Section
            title="Accepted"
            items={grouped.accepted}
            onStatusChange={handleStatusChange}
            empty="Accepted proposals will appear here."
          />
        )}
        {sectionsToRender.includes("draft") && (
          <Section
            title="Drafts"
            items={grouped.draft}
            onStatusChange={handleStatusChange}
            empty="Rejected items move to drafts for edits."
          />
        )}
      </div>
    </div>
  );
};

const FreelancerProposal = ({ filter = "all" }) => {
  return (
    <RoleAwareSidebar>
      <FreelancerProposalContent filter={filter} />
    </RoleAwareSidebar>
  );
};

export default FreelancerProposal;
