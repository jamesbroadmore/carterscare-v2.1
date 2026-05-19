import { useState, useRef, useEffect } from "react";
import {
  LayoutDashboard,
  Users,
  UserCircle,
  CalendarDays,
  Clock,
  AlertTriangle,
  Receipt,
  BarChart3,
  Settings,
  LogOut,
  ChevronDown,
  Briefcase,
  Heart,
  FileText,
  MessageSquare,
  PieChart,
  GraduationCap,
  MessageCircle,
} from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  useSidebar,
} from "@/components/ui/sidebar";
import cartersIcon from "@/assets/icon.png";
import maureenImg from "@/assets/maureen.png";

type NavItem = {
  title: string;
  url: string;
  icon: any;
  requiredRole: "support_worker" | "manager" | "admin"; // Minimum role required
  iconClass: string;
  badge?: string;
};

type NavGroup = {
  label: string;
  requiredRole?: "support_worker" | "manager" | "admin";
  collapsible?: boolean;
  defaultExpanded?: boolean;
  items: NavItem[];
};

// Role-based navigation - Clean, no duplicates
// Levels: support_worker < manager < admin
const navGroups: NavGroup[] = [
  {
    label: "Quick Access",
    items: [
      { title: "Dashboard", url: "/", icon: LayoutDashboard, requiredRole: "support_worker", iconClass: "icon-purple" },
      { title: "Clients", url: "/clients", icon: Heart, requiredRole: "support_worker", iconClass: "icon-teal", badge: "★" },
    ],
  },
  {
    label: "My Work",
    collapsible: true,
    defaultExpanded: true,
    items: [
      { title: "My Roster", url: "/my-roster", icon: CalendarDays, requiredRole: "support_worker", iconClass: "icon-blue" },
      { title: "My Timesheets", url: "/my-timesheets", icon: Clock, requiredRole: "support_worker", iconClass: "icon-yellow" },
      { title: "Case Notes", url: "/case-notes", icon: FileText, requiredRole: "support_worker", iconClass: "icon-blue" },
      { title: "Incidents", url: "/incidents", icon: AlertTriangle, requiredRole: "support_worker", iconClass: "icon-red" },
      { title: "Onboarding", url: "/staff-onboarding", icon: GraduationCap, requiredRole: "support_worker", iconClass: "icon-green" },
    ],
  },
  {
    label: "Team Management",
    requiredRole: "manager",
    collapsible: true,
    defaultExpanded: true,
    items: [
      { title: "Full Roster", url: "/roster", icon: CalendarDays, requiredRole: "manager", iconClass: "icon-orange" },
      { title: "Timesheets", url: "/timesheets", icon: Clock, requiredRole: "manager", iconClass: "icon-yellow" },
      { title: "Staff", url: "/staff", icon: Users, requiredRole: "manager", iconClass: "icon-blue" },
      { title: "Requests", url: "/requests", icon: MessageSquare, requiredRole: "manager", iconClass: "icon-pink" },
    ],
  },
  {
    label: "Admin",
    requiredRole: "admin",
    collapsible: true,
    defaultExpanded: false,
    items: [
      { title: "HR & Docs", url: "/staff/hr", icon: Briefcase, requiredRole: "admin", iconClass: "icon-purple" },
      { title: "Analytics", url: "/analytics", icon: PieChart, requiredRole: "admin", iconClass: "icon-indigo" },
      { title: "Invoices", url: "/invoices", icon: Receipt, requiredRole: "admin", iconClass: "icon-green" },
      { title: "Reports", url: "/reports", icon: BarChart3, requiredRole: "admin", iconClass: "icon-teal" },
      { title: "Settings", url: "/settings", icon: Settings, requiredRole: "admin", iconClass: "icon-slate" },
    ],
  },
];

// Helper to check if user has required role
function hasAccess(userRole: string | null, requiredRole: string): boolean {
  const roleHierarchy = { support_worker: 1, manager: 2, admin: 3 };
  const userLevel = roleHierarchy[userRole as keyof typeof roleHierarchy] || 1;
  const requiredLevel = roleHierarchy[requiredRole as keyof typeof roleHierarchy] || 1;
  return userLevel >= requiredLevel;
}

interface AppSidebarProps {
  onMaureenClick?: () => void;
  maureenHasAlert?: boolean;
}

export function AppSidebar({ onMaureenClick, maureenHasAlert }: AppSidebarProps) {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const location = useLocation();
  const { user, signOut, role } = useAuth();
  const scrollRef = useRef<HTMLDivElement>(null);
  const prevPathRef = useRef(location.pathname);
  
  // Track expanded groups - start with defaults
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(() => {
    const expanded = new Set<string>();
    navGroups.forEach(group => {
      // Expand if defaultExpanded or if current path is in this group
      if (group.defaultExpanded || group.items.some(item => 
        location.pathname.startsWith(item.url) && item.url !== "/"
      )) {
        expanded.add(group.label);
      }
    });
    return expanded;
  });

  // Auto-expand group when navigating to it
  useEffect(() => {
    if (prevPathRef.current !== location.pathname) {
      prevPathRef.current = location.pathname;
      navGroups.forEach(group => {
        if (group.items.some(item => location.pathname.startsWith(item.url) && item.url !== "/")) {
          setExpandedGroups(prev => new Set([...prev, group.label]));
        }
      });
    }
  }, [location.pathname]);

  const toggleGroup = (label: string) => {
    setExpandedGroups(prev => {
      const next = new Set(prev);
      if (next.has(label)) {
        next.delete(label);
      } else {
        next.add(label);
      }
      return next;
    });
  };

  // Filter groups based on user role
  const visibleGroups = navGroups
    .filter((g) => !g.requiredRole || hasAccess(role, g.requiredRole))
    .map((g) => ({
      ...g,
      items: g.items.filter((i) => hasAccess(role, i.requiredRole)),
    }))
    .filter((g) => g.items.length > 0);

  const initials = user?.user_metadata?.display_name
    ? user.user_metadata.display_name.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2)
    : user?.email?.slice(0, 2).toUpperCase() ?? "??";

  const displayName = user?.user_metadata?.display_name || user?.email?.split("@")[0] || "User";
  const displayEmail = user?.email || "";

  return (
    <Sidebar
      collapsible="icon"
      className="border-r border-slate-200/80 bg-white"
      style={{ "--sidebar-width": "240px", "--sidebar-width-icon": "60px" } as any}
      data-testid="app-sidebar"
    >
      {/* Logo Header - Larger & Responsive */}
      <div
        className={`flex items-center border-b border-slate-100 ${
          collapsed ? "justify-center px-2 py-4" : "gap-3 px-4 py-4"
        }`}
      >
        <img
          src={cartersIcon}
          alt="Carters Care"
          className={`shrink-0 transition-all duration-200 ${
            collapsed 
              ? "h-10 w-10 sm:h-11 sm:w-11" 
              : "h-11 w-11 sm:h-12 sm:w-12 md:h-14 md:w-14"
          }`}
        />
        {!collapsed && (
          <div className="flex flex-col leading-tight">
            <span className="text-base sm:text-lg md:text-xl font-bold text-slate-800">Carters Care</span>
            <span className="text-[10px] sm:text-[11px] text-slate-400 font-medium uppercase tracking-wider">Platform</span>
          </div>
        )}
      </div>

      <SidebarContent 
        ref={scrollRef}
        className="py-2 overflow-y-auto scrollbar-thin"
      >
        {visibleGroups.map((group, groupIndex) => {
          const isExpanded = expandedGroups.has(group.label);
          const hasActiveItem = group.items.some(item => 
            item.url === "/" ? location.pathname === "/" : location.pathname.startsWith(item.url)
          );

          return (
            <div key={group.label} className={groupIndex > 0 ? "mt-2" : ""}>
              {/* Group Header */}
              {!collapsed && (
                group.collapsible ? (
                  <button
                    onClick={() => toggleGroup(group.label)}
                    className={`w-full flex items-center justify-between text-[10px] uppercase tracking-wider font-semibold px-3 py-1.5 transition-colors ${
                      hasActiveItem ? "text-purple-600" : "text-slate-400 hover:text-slate-600"
                    }`}
                  >
                    <span>{group.label}</span>
                    <ChevronDown className={`h-3 w-3 transition-transform duration-200 ${isExpanded ? "" : "-rotate-90"}`} />
                  </button>
                ) : (
                  <p className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold px-3 py-1.5">
                    {group.label}
                  </p>
                )
              )}
              
              {/* Group Items */}
              {(!group.collapsible || isExpanded || collapsed) && (
                <div className="space-y-0.5 px-2">
                  {group.items.map((item) => {
                    const isActive = item.url === "/"
                      ? location.pathname === "/"
                      : location.pathname.startsWith(item.url);

                    return (
                      <NavLink
                        key={item.title}
                        to={item.url}
                        end={item.url === "/"}
                        className={`group flex items-center gap-2.5 rounded-lg px-2 py-1.5 transition-all duration-150 ${
                          isActive
                            ? "bg-purple-50 border border-purple-100"
                            : "hover:bg-slate-50 border border-transparent"
                        } ${collapsed ? "justify-center px-2" : ""}`}
                        activeClassName=""
                        title={collapsed ? item.title : undefined}
                        data-testid={`nav-link-${item.url.replace(/\//g, '-').replace(/^-/, '')}`}
                      >
                        {/* Icon */}
                        <div
                          className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg transition-all ${item.iconClass} ${
                            isActive ? "shadow-sm" : "opacity-75 group-hover:opacity-100"
                          }`}
                        >
                          <item.icon className="h-3.5 w-3.5 text-white" />
                        </div>

                        {!collapsed && (
                          <div className="flex items-center justify-between flex-1 min-w-0">
                            <span
                              className={`text-[13px] truncate ${
                                isActive
                                  ? "text-purple-700 font-semibold"
                                  : "text-slate-600 group-hover:text-slate-800 font-medium"
                              }`}
                            >
                              {item.title}
                            </span>
                            {item.badge && (
                              <span className="text-[10px] text-amber-500 font-bold ml-1">{item.badge}</span>
                            )}
                          </div>
                        )}
                      </NavLink>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </SidebarContent>

      {/* User Profile Footer */}
      <SidebarFooter className="border-t border-slate-100 p-2 space-y-2">
        {/* Ask Maureen Button */}
        <button
          onClick={onMaureenClick}
          className={`w-full flex items-center gap-2.5 rounded-lg p-2 hover:bg-purple-50 transition-colors ${
            collapsed ? "justify-center" : ""
          } ${maureenHasAlert ? "bg-amber-50 hover:bg-amber-100" : ""}`}
          data-testid="sidebar-maureen-button"
        >
          <div className="relative shrink-0">
            <img 
              src={maureenImg} 
              alt="Ask Maureen" 
              className="h-8 w-8 rounded-full object-cover border-2 border-purple-200 shadow-sm"
            />
            {maureenHasAlert && (
              <div className="absolute -top-0.5 -right-0.5 h-3 w-3 rounded-full bg-amber-400 border-2 border-white" />
            )}
          </div>
          {!collapsed && (
            <div className="flex flex-col min-w-0 text-left">
              <span className="text-xs font-semibold text-purple-700">Ask Maureen</span>
              <span className="text-[10px] text-slate-400">AI Assistant</span>
            </div>
          )}
        </button>

        {/* User Profile */}
        <div
          className={`flex items-center gap-2.5 rounded-lg p-2 hover:bg-slate-50 transition-colors ${
            collapsed ? "justify-center" : ""
          }`}
        >
          {/* Avatar */}
          <div className="relative shrink-0">
            <div
              className="flex h-8 w-8 items-center justify-center rounded-full text-white text-xs font-bold"
              style={{ background: "linear-gradient(135deg, #a78bfa, #8b5cf6)" }}
            >
              {initials}
            </div>
            <div className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-emerald-400 border-2 border-white" />
          </div>

          {!collapsed && (
            <div className="flex flex-1 items-center justify-between min-w-0">
              <div className="flex flex-col min-w-0">
                <span className="text-xs font-semibold text-slate-700 truncate">
                  {displayName}
                </span>
                <span className="text-[10px] text-slate-400 truncate">{displayEmail}</span>
              </div>
              <button
                onClick={() => signOut()}
                className="text-slate-400 hover:text-red-500 transition-colors p-1.5 rounded-lg hover:bg-red-50"
                title="Sign out"
              >
                <LogOut className="h-3.5 w-3.5" />
              </button>
            </div>
          )}
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
