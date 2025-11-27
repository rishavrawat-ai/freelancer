"use client";

import React, { useEffect, useMemo, useState } from "react";
import { CheckCircle2, Clock, FileText, MoreVertical, XCircle } from "lucide-react";
import { RoleAwareSidebar } from "@/components/dashboard/RoleAwareSidebar";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FreelancerTopBar } from "@/components/freelancer/FreelancerTopBar";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";

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
  const clientName =
    proposal.project?.owner?.fullName ||
    proposal.project?.owner?.name ||
    proposal.project?.owner?.email ||
    proposal.client?.fullName ||
    proposal.client?.name ||
    proposal.client?.email ||
    proposal.owner?.fullName ||
    proposal.owner?.name ||
    proposal.owner?.email ||
    proposal.user?.fullName ||
    proposal.user?.name ||
    proposal.user?.email ||
    proposal.clientName ||
    proposal.ownerName ||
    proposal.senderName ||
    "Client";
  return {
    id: proposal.id,
    title: proposal.project?.title || proposal.title || "Proposal",
    category: proposal.project?.description ? "Project" : proposal.category || "General",
    status: normalizeProposalStatus(proposal.status || "PENDING"),
    recipientName: clientName,
    recipientId:
      proposal.project?.owner?.id ||
      proposal.client?.id ||
      proposal.owner?.id ||
      proposal.user?.id ||
      proposal.ownerId ||
      "CLIENT",
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
    budget: proposal.amount || null,
    content:
      proposal.content ||
      proposal.description ||
      proposal.summary ||
      proposal.project?.description ||
      "",
  };
};

const ProposalCard = ({ proposal, onStatusChange, onOpen }) => {
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
                  Client
                </p>
                <p className="font-medium text-foreground">
                  {proposal.recipientName}
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
              size="sm"
              className="bg-primary text-primary-foreground hover:bg-primary/90"
              onClick={() => onOpen?.(proposal)}
            >
              Open
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

const Section = ({ title, items, onStatusChange, onOpenProposal, empty }) => (
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
            onOpen={onOpenProposal}
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

const mapLocalProposal = (proposal = {}) => ({
  id: proposal.id,
  title: proposal.title || "Proposal",
  category: proposal.category || "General",
  status: normalizeProposalStatus(proposal.status || "PENDING"),
  recipientName:
    proposal.clientName ||
    proposal.preparedFor ||
    proposal.senderName ||
    proposal.ownerName ||
    proposal.recipientName ||
    "Client",
  recipientId: proposal.recipientId || proposal.ownerId || "CLIENT",
  projectId: proposal.projectId || null,
  freelancerId: proposal.freelancerId || null,
  submittedDate: proposal.submittedDate || new Date().toLocaleDateString(),
  proposalId: proposal.proposalId || `PRP-${(proposal.id || "").slice(0, 6)}`,
  avatar:
    proposal.avatar ||
    "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=256&q=80",
  budget: proposal.budget || null,
  content: proposal.content || "",
  isLocal: true,
});

const FreelancerProposalContent = ({ filter = "all" }) => {
  const { authFetch, isAuthenticated } = useAuth();
  const [proposals, setProposals] = useState([]);
  const [selectedProposal, setSelectedProposal] = useState(null);
  const [isLoadingProposal, setIsLoadingProposal] = useState(false);

  const syncClientLocalCache = (proposalId, status) => {
    if (typeof window === "undefined" || !proposalId) return;
    try {
      const stored =
        JSON.parse(window.localStorage.getItem("client:sentProposals") || "[]") ||
        [];
      const updated = stored.map((item) => {
        const matches =
          item?.id === proposalId ||
          item?.proposalId === proposalId ||
          (item?.proposalId && proposalId?.startsWith(item.proposalId.replace(/^PRP-/, "")));
        return matches ? { ...item, status } : item;
      });
      window.localStorage.setItem("client:sentProposals", JSON.stringify(updated));
    } catch (error) {
      console.warn("Unable to sync client cache for proposal", proposalId, error);
    }
  };

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
        setSelectedProposal((prev) => (prev?.id === id ? null : prev));
      } catch (error) {
        console.error("Failed to delete proposal:", error);
        toast.error("Unable to delete proposal. Please try again.");
      }
      return;
    }

    const apiStatus =
      nextStatus === "received"
        ? "PENDING"
        : nextStatus === "accepted"
        ? "ACCEPTED"
        : nextStatus === "rejected"
        ? "REJECTED"
        : "PENDING";

    try {
      const response = await authFetch(`/proposals/${id}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ status: apiStatus })
      });

      if (!response.ok) {
        const errorPayload = await response.json().catch(() => null);
        const message =
          errorPayload?.message ||
          errorPayload?.error ||
          "Unable to update proposal status.";
        throw new Error(message);
      }

      const payload = await response.json().catch(() => null);
      const apiProposal = payload?.data ? mapApiProposal(payload.data) : null;
      if (apiProposal) {
        setProposals((prev) =>
          prev.map((proposal) => (proposal.id === id ? apiProposal : proposal))
        );
        setSelectedProposal((prev) => (prev?.id === id ? apiProposal : prev));
      }
    } catch (error) {
      console.error("Failed to persist proposal status:", error);
      toast.error(error?.message || "Unable to update proposal status.");
    }
  };

  const handleOpenProposal = async (proposal) => {
    setSelectedProposal(proposal);
    if (!proposal?.id || proposal.isLocal) return;
    setIsLoadingProposal(true);
    try {
      const response = await authFetch(`/proposals/${proposal.id}`);
      const payload = await response.json().catch(() => null);
      if (payload?.data) {
        setSelectedProposal(mapApiProposal(payload.data));
        // hydrate local cache with fresh content for this proposal if it exists locally
        try {
          const stored = loadStoredProposals();
          const idx = stored.findIndex((p) => p.id === proposal.id);
          if (idx >= 0) {
            stored[idx] = mapApiProposal(payload.data);
            saveStoredProposals(stored);
          }
        } catch {
          /* ignore */
        }
      }
    } catch (error) {
      console.error("Failed to load proposal details:", error);
      toast.error("Unable to load full proposal details right now.");
    } finally {
      setIsLoadingProposal(false);
    }
  };
  const handleCloseProposal = () => setSelectedProposal(null);

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
            onOpenProposal={handleOpenProposal}
            empty="No pending proposals right now."
          />
        )}
        {sectionsToRender.includes("received") && (
          <Section
            title="Received"
            items={grouped.received}
            onStatusChange={handleStatusChange}
            onOpenProposal={handleOpenProposal}
            empty="Nothing has been marked received yet."
          />
        )}
        {sectionsToRender.includes("accepted") && (
          <Section
            title="Accepted"
            items={grouped.accepted}
            onStatusChange={handleStatusChange}
            onOpenProposal={handleOpenProposal}
            empty="Accepted proposals will appear here."
          />
        )}
        {sectionsToRender.includes("rejected") && (
          <Section
            title="Rejected"
            items={grouped.rejected}
            onStatusChange={handleStatusChange}
            onOpenProposal={handleOpenProposal}
            empty="Rejected items will show here."
          />
        )}
      </div>

      <Dialog
        open={Boolean(selectedProposal)}
        onOpenChange={(open) => {
          if (!open) handleCloseProposal();
        }}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selectedProposal?.title || "Proposal"}</DialogTitle>
            <DialogDescription>
              A quick snapshot of this proposal without leaving the page.
            </DialogDescription>
          </DialogHeader>

          {selectedProposal && (
            <div className="space-y-4">
              <div className="flex flex-wrap gap-2">
                <Badge
                  variant="outline"
                  className={`flex items-center gap-1 border px-2 py-0.5 text-xs font-medium ${statusConfig[selectedProposal.status]?.className || ""}`}>
                  {statusConfig[selectedProposal.status]?.icon ? (
                    React.createElement(statusConfig[selectedProposal.status].icon, {
                      className: "h-3 w-3",
                    })
                  ) : null}
                  {statusConfig[selectedProposal.status]?.label || "Pending"}
                </Badge>
                {selectedProposal.proposalId && (
                  <Badge variant="outline" className="text-xs font-mono">
                    {selectedProposal.proposalId}
                  </Badge>
                )}
                {isLoadingProposal && (
                  <Badge variant="secondary" className="text-xs">
                    Loading details…
                  </Badge>
                )}
              </div>

              <div className="grid gap-3 sm:grid-cols-2 text-sm">
                <div className="rounded-lg border border-border/60 bg-muted/40 p-3">
                  <p className="text-xs uppercase tracking-widest text-muted-foreground">
                    Recipient
                  </p>
                  <p className="font-semibold text-foreground">
                    {selectedProposal.recipientName}
                  </p>
                </div>
                <div className="rounded-lg border border-border/60 bg-muted/40 p-3">
                  <p className="text-xs uppercase tracking-widest text-muted-foreground">
                    Submitted
                  </p>
                  <p className="font-semibold text-foreground">
                    {selectedProposal.submittedDate}
                  </p>
                </div>
                <div className="rounded-lg border border-border/60 bg-muted/40 p-3">
                  <p className="text-xs uppercase tracking-widest text-muted-foreground">
                    Category
                  </p>
                  <p className="font-semibold text-foreground">
                    {selectedProposal.category}
                  </p>
                </div>
                <div className="rounded-lg border border-border/60 bg-muted/40 p-3">
                  <p className="text-xs uppercase tracking-widest text-muted-foreground">
                    Budget
                  </p>
                  <p className="font-semibold text-foreground">
                    {selectedProposal.budget ? `$${selectedProposal.budget}` : "Not specified"}
                  </p>
                </div>
              </div>

              <div className="rounded-lg border border-border/60 bg-muted/40 p-3">
                <p className="text-xs uppercase tracking-widest text-muted-foreground">
                  Proposal Details
                </p>
                <ScrollArea className="mt-2 pr-2 h-[50vh] w-full">
                  <p className="text-sm leading-relaxed text-foreground whitespace-pre-line">
                    {selectedProposal.content?.trim() || "No proposal content provided."}
                  </p>
                </ScrollArea>
              </div>
            </div>
          )}

          <DialogFooter className="flex items-center justify-end gap-2">
            <Button variant="outline" onClick={handleCloseProposal}>
              Close
            </Button>
            {selectedProposal?.status === "received" && (
              <Button
                className="bg-primary text-primary-foreground hover:bg-primary/90"
                onClick={() => handleStatusChange(selectedProposal.id, "accepted")}>
                Mark as accepted
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
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
