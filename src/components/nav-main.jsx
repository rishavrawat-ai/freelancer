import { ChevronRight } from "lucide-react";
import { Link, useLocation } from "react-router-dom";

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@/components/ui/sidebar"
import { useNotifications } from "@/context/NotificationContext";

export function NavMain({
  items
}) {
  const { unreadCount } = useNotifications();
  const location = useLocation();

  return (
    <SidebarGroup>
      <SidebarGroupLabel>Platform</SidebarGroupLabel>
      <SidebarMenu>
        {items.map((item) => {
          const Icon = item.icon;
          const hasChildren = Array.isArray(item.items) && item.items.length > 0;

          // Show badge on Messages item
          const showBadge = item.title === "Messages" && unreadCount > 0;

          if (!hasChildren) {
             const isActive = location.pathname === item.url;
             return (
               <SidebarMenuItem key={item.title}>
                 <SidebarMenuButton asChild tooltip={item.title} isActive={isActive}>
                   <Link to={item.url ?? "#"} className={`relative ${isActive ? "text-primary font-medium" : ""}`}>
                     {Icon && <Icon className={isActive ? "text-primary" : ""} />}
                     <span>{item.title}</span>
                     {showBadge && (
                       <span className="ml-auto flex h-5 min-w-5 items-center justify-center rounded-full bg-emerald-500 px-1.5 text-[10px] font-bold text-white">
                         {unreadCount > 99 ? "99+" : unreadCount}
                       </span>
                     )}
                   </Link>
                 </SidebarMenuButton>
               </SidebarMenuItem>
             );
           }

          return (
            <Collapsible
              key={item.title}
              asChild
              defaultOpen={item.isActive}
              className="group/collapsible">
              <SidebarMenuItem>
                <CollapsibleTrigger asChild>
                  <SidebarMenuButton tooltip={item.title}>
                    {Icon && <Icon />}
                    <span>{item.title}</span>
                    <ChevronRight
                      className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                  </SidebarMenuButton>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <SidebarMenuSub>
                    {item.items.map((subItem) => (
                      <SidebarMenuSubItem key={subItem.title}>
                        <SidebarMenuSubButton asChild>
                          <Link to={subItem.url}>
                            <span>{subItem.title}</span>
                          </Link>
                        </SidebarMenuSubButton>
                      </SidebarMenuSubItem>
                    ))}
                  </SidebarMenuSub>
                </CollapsibleContent>
              </SidebarMenuItem>
            </Collapsible>
          );
        })}
      </SidebarMenu>
    </SidebarGroup>
  );
}
