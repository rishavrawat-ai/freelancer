import React, { useMemo, useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";

const stripUnavailableSections = (text = "") => {
    const withoutTags = text.replace(/\[PROPOSAL_DATA\]|\[\/PROPOSAL_DATA\]/g, "");
    const filtered = [];

    const shouldDropLine = (line) => {
        const trimmed = line.trim();
        if (!trimmed) return false;
        if (/not provided/i.test(trimmed) || /not specified/i.test(trimmed)) return true;
        // Drop leftover placeholder tokens like [Portfolio]
        if (/^\[[^\]]+\]$/.test(trimmed)) return true;
        return false;
    };

    withoutTags.split("\n").forEach((line) => {
        if (shouldDropLine(line)) return;

        const trimmed = line.trim();
        if (!trimmed) {
            if (filtered[filtered.length - 1] === "") return;
            filtered.push("");
            return;
        }

        filtered.push(trimmed);
    });

    return filtered.join("\n").trim();
};

const ProposalPanel = ({ content }) => {
    if (!content) return null;

    const navigate = useNavigate();
    const { user } = useAuth();

    const cleanContent = useMemo(() => stripUnavailableSections(content), [content]);

    // Local state for editing
    const [isEditing, setIsEditing] = useState(false);
    const [editableContent, setEditableContent] = useState(cleanContent);

    // Sync state if prop changes (e.g. re-generation matches)
    useEffect(() => {
        setEditableContent(cleanContent);
    }, [cleanContent]);

    // Parse from editableContent so updates reflect immediately in the title/budget
    const parsed = useMemo(() => {
        const getValue = (label) => {
            const match = editableContent.match(new RegExp(`${label}:\\s*(.*)`, "i"));
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
            summary: editableContent,
            raw: { content: editableContent }
        };
    }, [editableContent]);

    const persistProposal = () => {
        if (typeof window === "undefined") return;
        const payload = {
            ...parsed,
            createdAt: new Date().toISOString(),
            savedAt: new Date().toISOString(), // Mark as explicitly saved
            isSavedDraft: true // Flag to indicate this is a saved draft
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

    const handleSaveEdit = () => {
        setIsEditing(false);
        toast.success("Changes saved");
    };

    const handleCancelEdit = () => {
        setEditableContent(cleanContent);
        setIsEditing(false);
    };

    return (
        <>
            <Card className="border border-border/50 bg-card/70 h-full overflow-hidden flex flex-col">
                <CardContent className="flex h-full flex-col gap-4 overflow-hidden p-4">
                    <div className="space-y-1 border-b border-border/40 pb-4">
                        <p className="text-xs uppercase tracking-[0.32em] text-emerald-500 font-bold">
                            proposal ready
                        </p>
                        <p className="text-lg font-semibold">{parsed.projectTitle}</p>
                    </div>

                    <div className="flex-1 overflow-hidden">
                        <div className="h-full overflow-y-auto pr-1 text-sm leading-relaxed text-muted-foreground whitespace-pre-wrap font-mono">
                            {editableContent}
                        </div>
                    </div>

                    <div className="pt-4 border-t border-border/40 flex gap-3">
                        <Button
                            variant="outline"
                            onClick={() => setIsEditing(true)}
                            className="flex-1 border-primary/20 hover:bg-primary/5 text-primary"
                        >
                            Edit Proposal
                        </Button>
                        <Button
                            className="flex-[2] bg-emerald-600 hover:bg-emerald-700 text-white"
                            onClick={handleAccept}
                        >
                            Accept Proposal
                        </Button>
                    </div>
                </CardContent>
            </Card>

            <Dialog open={isEditing} onOpenChange={setIsEditing}>
                <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col">
                    <DialogHeader>
                        <DialogTitle>Edit Proposal</DialogTitle>
                    </DialogHeader>
                    <div className="flex-1 py-4 overflow-hidden">
                        <Textarea
                            value={editableContent}
                            onChange={(e) => setEditableContent(e.target.value)}
                            className="h-[50vh] w-full font-mono text-sm resize-none"
                        />
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={handleCancelEdit}>
                            Cancel
                        </Button>
                        <Button onClick={handleSaveEdit}>Save Changes</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
};

export default ProposalPanel;
