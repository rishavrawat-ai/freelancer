"use client";

import PropTypes from "prop-types";
import { Sparkles } from "lucide-react";
import { SidebarMenu, SidebarMenuButton, SidebarMenuItem } from "@/components/ui/sidebar";

export function TeamSwitcher({ teams }) {
  const activeTeam = teams?.[0];

  if (!activeTeam) {
    return null;
  }

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <SidebarMenuButton
          size="lg"
          className="w-full rounded-2xl bg-sidebar-accent/40 text-left data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground hover:bg-sidebar-accent/60 transition-colors overflow-hidden group-data-[collapsible=icon]:min-w-0 group-data-[collapsible=icon]:w-[3rem] group-data-[collapsible=icon]:px-0"
        >
          <div className="flex items-center gap-3 w-full group-data-[collapsible=icon]:justify-center">
            <div className="bg-sidebar-primary text-sidebar-primary-foreground flex size-10 items-center justify-center rounded-xl shadow-inner">
              <activeTeam.logo className="size-5" />
            </div>
            <div className="flex-1 group-data-[collapsible=icon]:hidden">
              <p className="text-sm font-semibold leading-tight">{activeTeam.name}</p>
              <p className="text-xs text-muted-foreground">{activeTeam.plan}</p>
            </div>
            <Sparkles className="size-4 text-muted-foreground group-data-[collapsible=icon]:hidden" />
          </div>
        </SidebarMenuButton>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}

TeamSwitcher.propTypes = {
  teams: PropTypes.arrayOf(
    PropTypes.shape({
      name: PropTypes.string.isRequired,
      plan: PropTypes.string,
      logo: PropTypes.elementType.isRequired
    })
  )
};

TeamSwitcher.defaultProps = {
  teams: []
};
