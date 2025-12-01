import React, { useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";

const ProposalPanel = ({ content }) => {
    if (!content) return null;

    const navigate = useNavigate();
    const { user } = useAuth();

    // Simple parsing to make it look a bit better
    const cleanContent = content.replace(/\[PROPOSAL_DATA\]|\[\/PROPOSAL_DATA\]/g, "").trim();
    const lines = cleanContent.split("\n").map((line) => line.trim());

    const parsed = useMemo(() => {
        const getValue = (label) => {
            const match = cleanContent.match(new RegExp(`${label}:\\s*(.*)`, "i"));
            return match?.[1]?.trim() || "";
        };

        const projectTitle = getValue("Project Title") || "Project Proposal";
        const preparedFor = getValue("Prepared for") || "Client";
        const budget = getValue("Budget") || "";
        const service = projectTitle;

        return {
            service,
            projectTitle,
            preparedFor,
            budget,
            summary: cleanContent,
            raw: { content }
        };
    }, [cleanContent, content]);

    const persistProposal = () => {
        if (typeof window === "undefined") return;
        const payload = {
            ...parsed,
            createdAt: new Date().toISOString()
        };
        // Keep keys in sync with dashboard/auth sync logic
        window.localStorage.setItem("markify:savedProposal", JSON.stringify(payload));
        window.localStorage.removeItem("markify:savedProposalSynced");
        toast.success("Proposal saved. Log in to send it.");
    };

    const handleAccept = () => {
        persistProposal();
        if (user?.role === "CLIENT") {
            navigate("/client");
            return;
        }
        navigate("/login", { state: { redirectTo: "/client" } });
    };

    return (
        <Card className="border border-border/50 bg-card/70 h-full overflow-hidden flex flex-col">
            <CardContent className="flex h-full flex-col gap-4 overflow-hidden p-4">
                <div className="space-y-1 border-b border-border/40 pb-4">
                    <p className="text-xs uppercase tracking-[0.32em] text-emerald-500 font-bold">
                        Proposal Ready
                    </p>
                    <p className="text-lg font-semibold">{parsed.projectTitle}</p>
                </div>
                <div className="flex-1 overflow-y-auto pr-1 text-sm leading-relaxed text-muted-foreground whitespace-pre-wrap font-mono">
                    {cleanContent}
                </div>
                <div className="pt-4 border-t border-border/40 flex gap-3">
                    <Button variant="outline" className="flex-1 border-primary/20 hover:bg-primary/5 text-primary">
                        Edit Proposal
                    </Button>
                    <Button className="flex-[2] bg-emerald-600 hover:bg-emerald-700 text-white" onClick={handleAccept}>
                        Accept Proposal
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
};

export default ProposalPanel;
