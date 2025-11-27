"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { CheckCircle2, Clock, FileText, MoreVertical, XCircle } from "lucide-react";
import { RoleAwareSidebar } from "@/components/dashboard/RoleAwareSidebar";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FreelancerTopBar } from "@/components/freelancer/FreelancerTopBar";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";

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
  rejected: {
    label: "Rejected",
    icon: XCircle,
    className:
      "bg-red-500/15 text-red-700 border-red-200 dark:text-red-400 dark:border-red-500/30",
    dotColor: "bg-red-500",
  },
};

const normalizeProposalStatus = (status = "") => {
  switch (status.toUpperCase()) {
    case "ACCEPTED":
      return "accepted";
    case "REJECTED":
      return "rejected";
    case "RECEIVED":
    case "PENDING":
      return "received";
    default:
      return "pending";
  }
};

const mapApiProposal = (proposal = {}) => {
  return {
    id: proposal.id,
    title: proposal.project?.title || proposal.title || "Proposal",
    category: proposal.project?.description ? "Project" : proposal.category || "General",
    status: normalizeProposalStatus(proposal.status || "PENDING"),
    recipientName: proposal.project?.owner?.fullName || "Client",
    recipientId: proposal.project?.owner?.id || "CLIENT",
    projectId: proposal.project?.id || null,
    freelancerId: proposal.freelancerId || null,
    submittedDate: proposal.createdAt
      ? new Date(proposal.createdAt).toLocaleDateString()
      : new Date().toLocaleDateString(),
    proposalId: proposal.id
      ? `PRP-${proposal.id.slice(0, 6).toUpperCase()}`
      : `PRP-${Math.floor(Math.random() * 9000 + 1000)}`,
    avatar:
      proposal.avatar ||
      "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=256&q=80",
    budget: proposal.amount || null
  };
};

const ProposalCard = ({ proposal, onStatusChange }) => {
  const config = statusConfig[proposal.status];
  const StatusIcon = config.icon;

  const handleMove = (nextStatus) => onStatusChange(proposal.id, nextStatus);
  const handleDelete = () => onStatusChange(proposal.id, "delete");

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
              <Button
                size="sm"
                variant="secondary"
                className="border-border"
                onClick={() => handleMove("received")}
              >
                Mark received
              </Button>
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
                  onClick={() => handleMove("rejected")}
                >
                  Reject
                </Button>
              </>
            )}
            <Button
              size="sm"
              variant="outline"
              className="border-border"
              onClick={handleDelete}>
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

const loadStoredProposals = () => {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem("freelancer:receivedProposals") || "[]");
  } catch {
    return [];
  }
};

const saveStoredProposals = (proposals) => {
  if (typeof window === "undefined") return;
  localStorage.setItem("freelancer:receivedProposals", JSON.stringify(proposals));
};

const FreelancerProposalContent = ({ filter = "all" }) => {
  const { authFetch, isAuthenticated } = useAuth();
  const [proposals, setProposals] = useState([]);

  useEffect(() => {
    if (!isAuthenticated) return;

    const fetchProposals = async () => {
      try {
        const response = await authFetch("/proposals");
        const payload = await response.json().catch(() => null);
        const remote = Array.isArray(payload?.data) ? payload.data : [];
        setProposals(remote.map(mapApiProposal));
      } catch (error) {
        console.error("Failed to load freelancer proposals from API:", error);
      }
    };

    fetchProposals();
  }, [authFetch, isAuthenticated]);

  const grouped = useMemo(() => {
    return proposals.reduce(
      (acc, proposal) => {
        acc[proposal.status] = [...(acc[proposal.status] || []), proposal];
        return acc;
      },
      { pending: [], received: [], accepted: [], rejected: [] }
    );
  }, [proposals]);

  const handleStatusChange = async (id, nextStatus) => {
    if (nextStatus === "delete") {
      try {
        await authFetch(`/proposals/${id}`, { method: "DELETE" });
        setProposals((prev) => prev.filter((p) => p.id !== id));
      } catch (error) {
        console.error("Failed to delete proposal:", error);
        toast.error("Unable to delete proposal. Please try again.");
      }
      return;
    }

    const apiStatus =
      nextStatus === "received" ? "PENDING" : nextStatus.toUpperCase();

    try {
      const response = await authFetch(`/proposals/${id}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status: apiStatus })
      });
      const payload = await response.json().catch(() => null);
      const apiProposal = payload?.data ? mapApiProposal(payload.data) : null;
      if (apiProposal) {
        setProposals((prev) =>
          prev.map((proposal) => (proposal.id === id ? apiProposal : proposal))
        );
      }
    } catch (error) {
      console.error("Failed to persist proposal status:", error);
      toast.error(error?.message || "Unable to update proposal status.");
    }
  };

  const allowedFilters = ["pending", "received", "accepted", "rejected"];
  const sectionsToRender =
    filter === "all" || !allowedFilters.includes(filter)
      ? ["pending", "received", "accepted", "rejected"]
      : [filter];

  return (
    <div className="space-y-6 p-6">
      <FreelancerTopBar />

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
        {sectionsToRender.includes("rejected") && (
          <Section
            title="Rejected"
            items={grouped.rejected}
            onStatusChange={handleStatusChange}
            empty="Rejected items will show here."
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
