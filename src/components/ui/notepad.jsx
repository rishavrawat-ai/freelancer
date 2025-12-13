"use client";

import { StickyNote } from "lucide-react";
import { Button } from "@/components/ui/button";

export function Notepad() {
  const openNotepadPage = () => {
    window.open('/notepad', '_blank');
  };

  return (
    <Button
      variant="ghost"
      size="icon"
      className="rounded-full border border-border text-muted-foreground hover:text-foreground"
      onClick={openNotepadPage}
      aria-label="Open Notepad in new tab"
    >
      <StickyNote className="size-4" />
    </Button>
  );
}
