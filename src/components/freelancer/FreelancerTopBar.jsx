"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronRight, PanelLeftClose, PanelLeftOpen, Sun, Moon } from "lucide-react";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useSidebar } from "@/components/ui/sidebar";
import { useTheme } from "@/components/theme-provider";
import { getSession } from "@/lib/auth-storage";

const getInitials = (fullName) => {
  if (!fullName) return "FL";
  const parts = fullName.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0] ?? ""}${parts[parts.length - 1][0] ?? ""}`.toUpperCase();
};

export const FreelancerTopBar = ({ label }) => {
  const { state, toggleSidebar } = useSidebar();
  const { theme, setTheme } = useTheme();
  const [sessionUser, setSessionUser] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const session = getSession();
    setSessionUser(session?.user ?? null);
  }, []);

  const computedLabel = useMemo(() => {
    if (label) return label;
    const fullName = sessionUser?.fullName?.trim();
    if (fullName) return `${fullName}'s dashboard`;
    const baseRole = sessionUser?.role ?? "FREELANCER";
    const normalized = baseRole.toLowerCase();
    return `${normalized.charAt(0).toUpperCase()}${normalized.slice(1)} dashboard`;
  }, [label, sessionUser]);

  const sidebarClosed = state === "collapsed";
  const SidebarToggleIcon = sidebarClosed ? PanelLeftOpen : PanelLeftClose;
  const isDarkMode = theme === "dark";
  const ThemeIcon = isDarkMode ? Sun : Moon;

  const initials = getInitials(sessionUser?.fullName);

  const handleProfileNavigate = () => navigate("/freelancer/profile");

  return (
    <div className="flex w-full items-center gap-2 rounded-full border border-border/60 bg-card/70 px-3 py-2">
      <Button
        variant="ghost"
        size="icon"
        className="rounded-full border border-border text-muted-foreground hover:text-foreground"
        onClick={toggleSidebar}>
        <SidebarToggleIcon className="size-4" />
        <span className="sr-only">
          {sidebarClosed ? "Open navigation" : "Close navigation"}
        </span>
      </Button>

      <button
        type="button"
        onClick={handleProfileNavigate}
        className="flex items-center gap-2 rounded-full px-2 py-1 text-left transition hover:bg-muted/60">
        <Avatar className="h-8 w-8">
          <AvatarFallback className="text-xs font-semibold uppercase">
            {initials}
          </AvatarFallback>
        </Avatar>
        <div className="flex items-center gap-1 text-sm font-medium text-muted-foreground">
          <span className="truncate">{computedLabel}</span>
          <ChevronRight className="size-3.5" />
        </div>
      </button>

      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="ml-auto rounded-full border border-border text-muted-foreground hover:text-foreground"
        onClick={() => setTheme(isDarkMode ? "light" : "dark")}
        aria-label="Toggle theme">
        <ThemeIcon className="size-4" />
      </Button>
    </div>
  );
};

export default FreelancerTopBar;
