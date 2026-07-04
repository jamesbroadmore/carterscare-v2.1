import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AIChatbot } from "@/components/AIChatbot";
import { AppSidebar } from "@/components/AppSidebar";
import { NotificationBell, type SystemAlert } from "@/components/NotificationBell";
import { AlertTriangle, ShieldCheck, Clock } from "lucide-react";
import { getPerthDate } from "@/lib/perth-time";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import cartersIcon from "@/assets/icon.png";
import { useAuth } from "@/contexts/AuthContext";
import { ServiceStatusBadge } from "@/components/ServiceStatus";

interface AppLayoutProps {
  children: React.ReactNode;
  title?: string;
}

export function AppLayout({ children, title }: AppLayoutProps) {
  const [maureenOpen, setMaureenOpen] = useState(false);
  const { user } = useAuth();

  const { data: openIncidents = 0 } = useQuery({
    queryKey: ["notif-incidents"],
    queryFn: async () => {
      const { count } = await supabase.from("incidents").select("*", { count: "exact", head: true }).in("status", ["open", "investigating"]);
      return count ?? 0;
    },
  });

  const { data: complianceAlerts = 0 } = useQuery({
    queryKey: ["notif-compliance"],
    queryFn: async () => {
      const { count } = await supabase.from("compliance_records").select("*", { count: "exact", head: true }).in("status", ["expiring_soon", "expired"]);
      return count ?? 0;
    },
  });

  const { data: activeCheckins = 0 } = useQuery({
    queryKey: ["notif-checkins"],
    queryFn: async () => {
      const today = getPerthDate();
      const { count } = await supabase.from("shift_checkins").select("*", { count: "exact", head: true }).eq("shift_date", today).eq("status", "checked_in");
      return count ?? 0;
    },
  });

  const systemAlerts: SystemAlert[] = [];
  if (openIncidents > 0) {
    systemAlerts.push({
      id: "incidents",
      icon: AlertTriangle,
      iconColor: "text-destructive bg-destructive/10",
      title: `${openIncidents} Open Incident${openIncidents > 1 ? "s" : ""}`,
      description: "Requires immediate attention",
      href: "/incidents",
    });
  }
  if (complianceAlerts > 0) {
    systemAlerts.push({
      id: "compliance",
      icon: ShieldCheck,
      iconColor: "text-warning bg-warning/10",
      title: `${complianceAlerts} Compliance Alert${complianceAlerts > 1 ? "s" : ""}`,
      description: "Expiring or expired records",
      href: "/compliance",
    });
  }
  if (activeCheckins > 0) {
    systemAlerts.push({
      id: "checkins",
      icon: Clock,
      iconColor: "text-primary bg-primary/10",
      title: `${activeCheckins} Active Check-in${activeCheckins > 1 ? "s" : ""}`,
      description: "Staff currently on shift",
      href: "/check-in",
    });
  }

  const totalAlerts = openIncidents + complianceAlerts;

  // Build urgent message for Maureen based on alerts
  const urgentMessages: string[] = [];
  if (openIncidents > 0) {
    urgentMessages.push(`**${openIncidents} Open Incident${openIncidents > 1 ? "s"  : ""}** - Please review and address immediately.`);
  }
  if (complianceAlerts > 0) {
    urgentMessages.push(`**${complianceAlerts} Compliance Alert${complianceAlerts > 1 ? "s" : ""}** - Documents expiring or expired.`);
  }
  const urgentMessage = urgentMessages.join("\n\n");

  const initials = user?.user_metadata?.display_name
    ? user.user_metadata.display_name.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2)
    : user?.email?.slice(0, 2).toUpperCase() ?? "??";

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <AppSidebar 
          onMaureenClick={() => setMaureenOpen(true)} 
          maureenHasAlert={totalAlerts > 0}
        />
        <div className="flex-1 flex flex-col min-w-0">
          {/* Professional Header */}
          <header className="h-14 flex items-center justify-between bg-white border-b border-border/60 px-4 shrink-0 shadow-sm">
            <div className="flex items-center gap-3">
              <SidebarTrigger className="text-muted-foreground hover:text-foreground h-8 w-8 rounded-lg hover:bg-secondary transition-colors" />
              {title && (
                <div className="flex items-center gap-2">
                  <h1 className="text-[15px] font-semibold text-foreground">{title}</h1>
                </div>
              )}
            </div>

            <div className="flex items-center gap-2">
              {/* Service Status */}
              <ServiceStatusBadge size="sm" showLabel={false} />

              {/* Notifications (approvals, system alerts) */}
              <NotificationBell systemAlerts={systemAlerts} />

              {/* User Avatar */}
              <div
                className="h-8 w-8 rounded-full flex items-center justify-center text-white text-xs font-bold cursor-pointer shrink-0 shadow-sm"
                style={{ background: "linear-gradient(135deg, #a78bfa, #8b5cf6)" }}
              >
                {initials}
              </div>
            </div>
          </header>

          <main className="flex-1 overflow-auto p-4 md:p-6 bg-background relative">
            {/* Decorative background swirls and waves */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
              {/* Top right purple swirl */}
              <div className="absolute -top-20 -right-20 w-96 h-96 rounded-full opacity-[0.04]" 
                style={{ background: "radial-gradient(circle, #8b5cf6 0%, transparent 70%)" }} />
              
              {/* Bottom left teal wave */}
              <div className="absolute -bottom-32 -left-32 w-[500px] h-[500px] rounded-full opacity-[0.03]" 
                style={{ background: "radial-gradient(circle, #14b8a6 0%, transparent 70%)" }} />
              
              {/* Center blue gradient */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] rounded-full opacity-[0.02] rotate-12" 
                style={{ background: "radial-gradient(ellipse, #3b82f6 0%, transparent 60%)" }} />
              
              {/* Top left pink accent */}
              <div className="absolute top-20 left-20 w-64 h-64 rounded-full opacity-[0.03]" 
                style={{ background: "radial-gradient(circle, #ec4899 0%, transparent 70%)" }} />
              
              {/* Bottom right green wave */}
              <div className="absolute -bottom-10 right-1/4 w-72 h-72 rounded-full opacity-[0.03]" 
                style={{ background: "radial-gradient(circle, #22c55e 0%, transparent 70%)" }} />
            </div>
            
            {/* Main content */}
            <div className="relative z-10">
              {children}
            </div>
          </main>
        </div>
        <AIChatbot 
          isOpen={maureenOpen} 
          onOpenChange={setMaureenOpen}
          urgentMessage={urgentMessage} 
        />
      </div>
    </SidebarProvider>
  );
}
