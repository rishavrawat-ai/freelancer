"use client"

import * as React from "react"
import {
  BarChart,
  CreditCard,
  FileText,
  LayoutDashboard,
  MessageSquare,
  Users
} from "lucide-react"

import { NavMain } from "@/components/nav-main"
import { NavUser } from "@/components/nav-user"
import { TeamSwitcher } from "@/components/team-switcher"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "@/components/ui/sidebar"
import { getSession } from "@/lib/auth-storage"

// This is sample data.
const fallbackUser = {
  name: "shadcn",
  email: "m@example.com",
  avatar: "/avatars/shadcn.jpg"
};

const brandPresets = {
  FREELANCER: {
    name: "Freelancer HQ",
    plan: "Creator workspace",
    logoText: "FR"
  },
  CLIENT: {
    name: "Client Portal",
    plan: "Client workspace",
    logoText: "CL"
  }
};

const navConfigs = {
  FREELANCER: [
    {
      title: "Dashboard",
      url: "/freelancer",
      icon: LayoutDashboard,
      isActive: true
    },
    {
      title: "Proposals",
      url: "/freelancer/proposals",
      icon: FileText,
      items: [
        { title: "Drafts", url: "/freelancer/proposals/drafts" },
        { title: "Received", url: "/freelancer/proposals/received" },
        { title: "Accepted", url: "/freelancer/proposals/accepted" }
      ]
    },
    {
      title: "Messages",
      url: "/freelancer/messages",
      icon: MessageSquare,
      items: [
        { title: "Inbox", url: "/freelancer/messages/inbox" },
        { title: "Archive", url: "/freelancer/messages/archive" },
        { title: "Templates", url: "/freelancer/messages/templates" }
      ]
    },
    {
      title: "Payments",
      url: "/freelancer/payments",
      icon: CreditCard,
      items: [
        { title: "Invoices", url: "/freelancer/payments/invoices" },
        { title: "Payouts", url: "/freelancer/payments/payouts" },
        { title: "Taxes", url: "/freelancer/payments/taxes" }
      ]
    }
  ],
  CLIENT: [
    {
      title: "Dashboard",
      url: "/client",
      icon: LayoutDashboard,
      isActive: true
    },
    {
      title: "Proposal",
      url: "/client/proposal",
      icon: FileText,
      items: [
        { title: "Drafts", url: "/client/briefs/drafts" },
        { title: "Published", url: "/client/briefs/published" },
        { title: "Awarded", url: "/client/briefs/awarded" }
      ]
    },
    {
      title: "Project",
      url: "/client/project",
      icon: BarChart,
      items: [
        { title: "Shortlist", url: "/client/vendors/shortlist" },
        { title: "Contracts", url: "/client/vendors/contracts" },
        { title: "Reviews", url: "/client/vendors/reviews" }
      ]
    },
    {
      title: "Messages",
      url: "/client/messages",
      icon: MessageSquare,
      items: [
        { title: "Inbox", url: "/client/messages/inbox" },
        { title: "Archive", url: "/client/messages/archive" },
        { title: "Approvals", url: "/client/messages/approvals" }
      ]
    },
    {
      title: "Payments",
      url: "/client/payments",
      icon: CreditCard,
      items: [
        { title: "Invoices", url: "/client/payments/invoices" },
        { title: "Disbursements", url: "/client/payments/disbursements" },
        { title: "Reports", url: "/client/payments/reports" }
      ]
    }
  ]
};

export function AppSidebar({
  ...props
}) {
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
