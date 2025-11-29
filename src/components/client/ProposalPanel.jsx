import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const ProposalPanel = ({ content }) => {
    if (!content) return null;

    // Simple parsing to make it look a bit better
    const cleanContent = content.replace(/\[PROPOSAL_DATA\]|\[\/PROPOSAL_DATA\]/g, "").trim();
    const lines = cleanContent.split("\n");
    const title = lines.find((l) => l.includes("Project Title:")) || "Project Proposal";

    return (
        <Card className="border border-border/50 bg-card/70 h-full overflow-hidden flex flex-col">
            <CardContent className="flex h-full flex-col gap-4 overflow-hidden p-4">
                <div className="space-y-1 border-b border-border/40 pb-4">
                    <p className="text-xs uppercase tracking-[0.32em] text-emerald-500 font-bold">
                        Proposal Ready
                    </p>
                    <p className="text-lg font-semibold">{title.replace("Project Title:", "").trim()}</p>
                </div>
                <div className="flex-1 overflow-y-auto pr-1 text-sm leading-relaxed text-muted-foreground whitespace-pre-wrap font-mono">
                    {cleanContent}
                </div>
                <div className="pt-4 border-t border-border/40 flex gap-3">
                    <Button variant="outline" className="flex-1 border-primary/20 hover:bg-primary/5 text-primary">
                        Edit Proposal
                    </Button>
                    <Button className="flex-[2] bg-emerald-600 hover:bg-emerald-700 text-white">
                        Accept Proposal
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
};

export default ProposalPanel;
