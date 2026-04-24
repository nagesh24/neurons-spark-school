import { NavLink, useLocation } from "react-router-dom";
import {
  LayoutDashboard, Users, GraduationCap, BookOpen, ClipboardCheck,
  FileText, Megaphone, Wallet, BarChart3, BookMarked, LogOut, School, ShieldCheck,
} from "lucide-react";
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel,
  SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarFooter, SidebarHeader,
  useSidebar,
} from "@/components/ui/sidebar";
import { useAuth, AppRole } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";

type Item = { title: string; url: string; icon: any; roles: AppRole[] };

const items: Item[] = [
  { title: "Dashboard",    url: "/",            icon: LayoutDashboard, roles: ["admin", "teacher", "student"] },
  { title: "Teachers",     url: "/teachers",    icon: Users,           roles: ["admin"] },
  { title: "Students",     url: "/students",    icon: GraduationCap,   roles: ["admin", "teacher"] },
  { title: "Classes",      url: "/classes",     icon: BookOpen,        roles: ["admin"] },
  { title: "Subjects",     url: "/subjects",    icon: BookMarked,      roles: ["admin"] },
  { title: "Attendance",   url: "/attendance",  icon: ClipboardCheck,  roles: ["admin", "teacher", "student"] },
  { title: "Homework",     url: "/homework",    icon: FileText,        roles: ["admin", "teacher", "student"] },
  { title: "Notices",      url: "/notices",     icon: Megaphone,       roles: ["admin", "teacher", "student"] },
  { title: "Fees",         url: "/fees",        icon: Wallet,          roles: ["admin", "student"] },
  { title: "Reports",      url: "/reports",     icon: BarChart3,       roles: ["admin", "teacher", "student"] },
  { title: "User Roles",   url: "/users",       icon: ShieldCheck,     roles: ["admin"] },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const { primaryRole, signOut, user } = useAuth();
  const location = useLocation();

  const visible = items.filter((i) => primaryRole && i.roles.includes(primaryRole));

  return (
    <Sidebar collapsible="icon" className="border-r-sidebar-border">
      <SidebarHeader className="gradient-sidebar border-b border-sidebar-border">
        <div className="flex items-center gap-3 px-2 py-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg gradient-primary shadow-glow shrink-0">
            <School className="h-5 w-5 text-primary-foreground" />
          </div>
          {!collapsed && (
            <div className="overflow-hidden">
              <p className="font-display font-bold text-sidebar-foreground text-sm leading-tight">Neurons</p>
              <p className="text-[10px] uppercase tracking-wider text-sidebar-foreground/60">Int'l School</p>
            </div>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent className="gradient-sidebar">
        <SidebarGroup>
          {!collapsed && <SidebarGroupLabel className="text-sidebar-foreground/50">Workspace</SidebarGroupLabel>}
          <SidebarGroupContent>
            <SidebarMenu>
              {visible.map((item) => {
                const active = location.pathname === item.url;
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild tooltip={item.title}>
                      <NavLink
                        to={item.url}
                        end
                        className={
                          active
                            ? "!bg-sidebar-accent !text-sidebar-accent-foreground font-medium border-l-2 border-primary"
                            : "text-sidebar-foreground hover:!bg-sidebar-accent/60 hover:!text-sidebar-foreground"
                        }
                      >
                        <item.icon className="h-4 w-4" />
                        {!collapsed && <span>{item.title}</span>}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="gradient-sidebar border-t border-sidebar-border">
        <div className="px-2 py-2">
          {!collapsed && (
            <p className="text-[11px] text-sidebar-foreground/60 truncate mb-2 px-2">{user?.email}</p>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={signOut}
            className="w-full justify-start text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-foreground"
          >
            <LogOut className="h-4 w-4" />
            {!collapsed && <span className="ml-2">Sign out</span>}
          </Button>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
