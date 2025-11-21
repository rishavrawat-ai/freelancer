"use client";

import * as React from "react";
import {
  BarChart,
  CreditCard,
  FileText,
  LayoutDashboard,
  MessageSquare,
} from "lucide-react";

import { NavMain } from "@/components/nav-main";
import { NavUser } from "@/components/nav-user";
import { TeamSwitcher } from "@/components/team-switcher";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "@/components/ui/sidebar";
import { getSession } from "@/lib/auth-storage";

// This is sample data.
const fallbackUser = {
  name: "shadcn",
  email: "m@example.com",
  avatar: "/avatars/shadcn.jpg",
};

const brandPresets = {
  FREELANCER: {
    name: "Freelancer HQ",
    plan: "Creator workspace",
    logoText: "FR",
  },
  CLIENT: {
    name: "Client Portal",
    plan: "Client workspace",
    logoText: "CL",
  },
};

const navConfigs = {
  FREELANCER: [
    {
      title: "Dashboard",
      url: "/freelancer",
      icon: LayoutDashboard,
      isActive: true,
    },
    {
      title: "Proposals",
      url: "/freelancer/proposals",
      icon: FileText,
      items: [
        { title: "Drafts", url: "/freelancer/proposals/drafts" },
        { title: "Received", url: "/freelancer/proposals/received" },
        { title: "Accepted", url: "/freelancer/proposals/accepted" },
      ],
    },
    {
      title: "Project",
      url: "/freelancer/project",
      icon: BarChart,
      isActive: true,
    },
    {
      title: "Messages",
      url: "/freelancer/messages",
      icon: MessageSquare,
      isActive: true,
    },
    {
      title: "Payments",
      url: "/freelancer/payments",
      icon: CreditCard,
      isActive: true,
    },
  ],
  CLIENT: [
    {
      title: "Dashboard",
      url: "/client",
      icon: LayoutDashboard,
      isActive: true,
    },
    {
      title: "Proposal",
      url: "/client/proposal",
      icon: FileText,
      items: [
        { title: "Drafts", url: "/client/proposal/drafts" },
        { title: "Sent", url: "/client/proposal" },
      ],
    },
    {
      title: "Project",
      url: "/client/project",
      icon: BarChart,
      isActive: true,
    },
    {
      title: "Messages",
      url: "/client/messages",
      icon: MessageSquare,
      isActive: true,
    },
  ],
};

export function AppSidebar({ ...props }) {
  const session = typeof window !== "undefined" ? getSession() : null;
  const sessionUser = session?.user ?? null;
  const role = sessionUser?.role ?? "FREELANCER";
  const brand = brandPresets[role] ?? brandPresets.FREELANCER;
  const navItems = navConfigs[role] ?? navConfigs.FREELANCER;

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <TeamSwitcher brand={brand} />
      </SidebarHeader>
      <SidebarContent className="!overflow-hidden">
        <NavMain items={navItems} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={sessionUser ?? fallbackUser} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
