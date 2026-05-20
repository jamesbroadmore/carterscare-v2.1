import { AppLayout } from "@/components/AppLayout";
import { Users, UserCircle, CalendarDays, AlertTriangle, ShieldCheck, FileText, Loader2, ChevronRight, Clock, TrendingUp, Phone, MapPin, Heart } from "lucide-react";
import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { getPerthDate, formatPerthTime } from "@/lib/perth-time";
import { getDashboardGreeting } from "@/lib/dashboard-greetings";
import { useNavigate, Navigate } from "react-router-dom";
import { fullName } from "@/lib/display-names";

// Generate avatar initials + color from name
function getAvatarProps(name: string) {
  const colors = [
    "linear-gradient(135deg, #f472b6, #ec4899)",
    "linear-gradient(135deg, #fb923c, #f97316)",
    "linear-gradient(135deg, #fbbf24, #f59e0b)",
    "linear-gradient(135deg, #4ade80, #22c55e)",
    "linear-gradient(135deg, #60a5fa, #3b82f6)",
    "linear-gradient(135deg, #a78bfa, #8b5cf6)",
    "linear-gradient(135deg, #2dd4bf, #14b8a6)",
  ];
  const initials = name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
  const colorIdx = name.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0) % colors.length;
  return { initials, color: colors[colorIdx] };
}

function StatCard({
  label,
  value,
  sub,
  gradient,
  icon: Icon,
  href,
  testId,
}: {
  label: string;
  value: number | string;
  sub?: string;
  gradient: string;
  icon: any;
  href?: string;
  testId?: string;
}) {
  const navigate = useNavigate();
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      onClick={href ? () => navigate(href) : undefined}
      onKeyDown={href ? (e) => e.key === 'Enter' && navigate(href) : undefined}
      tabIndex={href ? 0 : undefined}
      role={href ? "button" : undefined}
      aria-label={href ? `${label}: ${value}. Click to view details.` : `${label}: ${value}`}
      className={`relative overflow-hidden rounded-2xl bg-white p-5 shadow-sm border border-border/50 flex items-center gap-4 ${href ? "cursor-pointer hover:shadow-md hover:border-primary/20 transition-all focus:outline-none focus:ring-2 focus:ring-primary/50" : ""}`}
      data-testid={testId || `stat-card-${label.toLowerCase().replace(/\s+/g, '-')}`}
    >
      {/* Icon box */}
      <div
        className="h-14 w-14 rounded-2xl flex items-center justify-center shrink-0 shadow-md"
        style={{ background: gradient }}
        aria-hidden="true"
      >
        <Icon className="h-6 w-6 text-white" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[26px] font-bold text-foreground leading-tight">{value}</p>
        <p className="text-sm font-semibold text-foreground/70">{label}</p>
        {sub && <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>}
      </div>
      {href && (
        <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" aria-hidden="true" />
      )}
    </motion.div>
  );
}

export default function Dashboard() {
  const { user, isSupportWorker, isDemoMode, demoRole } = useAuth();
  const navigate = useNavigate();

  // Support workers belong in the worker app, not the admin dashboard
  if (isSupportWorker || (isDemoMode && demoRole === "support_worker")) {
    return <Navigate to="/worker" replace />;
  }

  const { data: greetingName } = useQuery({
    queryKey: ["dashboard-greeting", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data: profile } = await supabase
        .from("profiles").select("display_name, staff_id").eq("user_id", user!.id).single();
      if (profile?.staff_id) {
        const { data: staff } = await supabase.from("staff").select("preferred_name, first_name").eq("id", profile.staff_id).single();
        if (staff?.preferred_name) return staff.preferred_name;
        if (staff?.first_name) return staff.first_name;
      }
      return profile?.display_name || user!.email?.split("@")[0] || "there";
    },
  });

  const greeting = getDashboardGreeting(greetingName ?? "there");

  const { data: staffCount = 0 } = useQuery({
    queryKey: ["dashboard-staff-count"],
    queryFn: async () => {
      const { count } = await supabase.from("staff").select("*", { count: "exact", head: true }).eq("status", "active");
      return count ?? 0;
    },
  });

  const { data: clientCount = 0 } = useQuery({
    queryKey: ["dashboard-client-count"],
    queryFn: async () => {
      const { count } = await supabase.from("clients").select("*", { count: "exact", head: true }).eq("status", "active");
      return count ?? 0;
    },
  });

  const { data: todayCheckins = 0 } = useQuery({
    queryKey: ["dashboard-checkins-today"],
    queryFn: async () => {
      const today = getPerthDate();
      const { count } = await supabase.from("shift_checkins").select("*", { count: "exact", head: true }).eq("shift_date", today);
      return count ?? 0;
    },
  });

  const { data: openIncidents = 0 } = useQuery({
    queryKey: ["dashboard-incidents"],
    queryFn: async () => {
      const { count } = await supabase.from("incidents").select("*", { count: "exact", head: true }).in("status", ["open", "investigating"]);
      return count ?? 0;
    },
  });

  const { data: complianceAlerts = 0 } = useQuery({
    queryKey: ["dashboard-compliance-alerts"],
    queryFn: async () => {
      const { count } = await supabase.from("compliance_records").select("*", { count: "exact", head: true }).in("status", ["expiring_soon", "expired"]);
      return count ?? 0;
    },
  });

  const { data: todayNotes = 0 } = useQuery({
    queryKey: ["dashboard-notes-today"],
    queryFn: async () => {
      const today = getPerthDate();
      const { count } = await supabase.from("case_notes").select("*", { count: "exact", head: true }).eq("note_date", today);
      return count ?? 0;
    },
  });

  const { data: recentCheckins = [], isLoading: checkinsLoading } = useQuery({
    queryKey: ["dashboard-recent-checkins"],
    queryFn: async () => {
      const { data } = await supabase
        .from("shift_checkins")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(6);
      return data ?? [];
    },
  });

  const { data: upcomingShifts = [], isLoading: shiftsLoading } = useQuery({
    queryKey: ["dashboard-upcoming-shifts"],
    queryFn: async () => {
      const today = getPerthDate();
      const { data } = await supabase
        .from("timesheets")
        .select("*, staff:staff_id(first_name, last_name, preferred_name), client:client_id(first_name, last_name)")
        .gte("shift_date", today)
        .order("shift_date")
        .order("start_time")
        .limit(5);
      return data ?? [];
    },
  });

  // Fetch recent clients for dashboard cards
  const { data: recentClients = [], isLoading: clientsLoading } = useQuery({
    queryKey: ["dashboard-recent-clients"],
    queryFn: async () => {
      const { data } = await supabase
        .from("clients")
        .select("id, first_name, last_name, preferred_name, phone, address, status, ndis_number, funding_type")
        .eq("status", "active")
        .order("created_at", { ascending: false })
        .limit(6);
      return data ?? [];
    },
  });

  const totalAlerts = openIncidents + complianceAlerts;

  return (
    <AppLayout title="Dashboard">
      <div className="space-y-6 max-w-6xl">
        {/* Greeting Header */}
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between"
        >
          <div>
            <h2 className="text-2xl font-bold text-foreground">
              {greetingName ? greeting.message : "Your Dashboard"}
            </h2>
            <p className="text-sm text-muted-foreground mt-0.5">
              {greetingName ? greeting.sub : "Welcome back"}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div className="text-right hidden sm:block">
              <p className="text-xs text-muted-foreground">Today</p>
              <p className="text-sm font-semibold text-foreground">
                {new Date().toLocaleDateString("en-AU", { weekday: "short", day: "numeric", month: "short" })}
              </p>
            </div>
          </div>
        </motion.div>

        {/* Quick Actions Bar - Easy staff access */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.02 }}
          className="flex flex-wrap gap-2"
          role="navigation"
          aria-label="Quick actions"
          data-testid="dashboard-quick-actions"
        >
          <button
            onClick={() => navigate("/clients")}
            className="flex items-center gap-2 h-10 px-4 rounded-xl bg-gradient-to-r from-teal-500 to-cyan-500 text-white text-sm font-semibold shadow-md hover:shadow-lg hover:scale-[1.02] transition-all focus:outline-none focus:ring-2 focus:ring-teal-400"
            data-testid="quick-action-clients"
          >
            <Heart className="h-4 w-4" />
            View Clients
          </button>
          <button
            onClick={() => navigate("/roster")}
            className="flex items-center gap-2 h-10 px-4 rounded-xl bg-gradient-to-r from-orange-400 to-amber-500 text-white text-sm font-semibold shadow-md hover:shadow-lg hover:scale-[1.02] transition-all focus:outline-none focus:ring-2 focus:ring-orange-400"
            data-testid="quick-action-roster"
          >
            <CalendarDays className="h-4 w-4" />
            Today's Roster
          </button>
          <button
            onClick={() => navigate("/timesheets")}
            className="flex items-center gap-2 h-10 px-4 rounded-xl bg-gradient-to-r from-yellow-400 to-amber-400 text-white text-sm font-semibold shadow-md hover:shadow-lg hover:scale-[1.02] transition-all focus:outline-none focus:ring-2 focus:ring-yellow-400"
            data-testid="quick-action-timesheets"
          >
            <Clock className="h-4 w-4" />
            Timesheets
          </button>
          <button
            onClick={() => navigate("/case-notes")}
            className="flex items-center gap-2 h-10 px-4 rounded-xl bg-gradient-to-r from-blue-400 to-indigo-500 text-white text-sm font-semibold shadow-md hover:shadow-lg hover:scale-[1.02] transition-all focus:outline-none focus:ring-2 focus:ring-blue-400"
            data-testid="quick-action-notes"
          >
            <FileText className="h-4 w-4" />
            Case Notes
          </button>
        </motion.div>

        {/* Top Stat Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4" role="region" aria-label="Key metrics">
          <StatCard
            label="Staff on Shift"
            value={todayCheckins}
            sub="Active check-ins today"
            gradient="linear-gradient(135deg, #a78bfa, #8b5cf6)"
            icon={Users}
            href="/check-in"
            testId="dashboard-staff-on-shift"
          />
          <StatCard
            label="Active Staff"
            value={staffCount}
            sub="Registered care workers"
            gradient="linear-gradient(135deg, #60a5fa, #3b82f6)"
            icon={UserCircle}
            href="/staff"
            testId="dashboard-active-staff"
          />
          <StatCard
            label={`Alert${totalAlerts !== 1 ? "s" : ""}`}
            value={totalAlerts}
            sub={totalAlerts > 0 ? "Requires attention" : "All clear"}
            gradient={totalAlerts > 0 ? "linear-gradient(135deg, #fb923c, #f97316)" : "linear-gradient(135deg, #4ade80, #22c55e)"}
            icon={totalAlerts > 0 ? AlertTriangle : ShieldCheck}
            href="/compliance"
            testId="dashboard-alerts"
          />
        </div>

        {/* Secondary Stats Row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4" role="region" aria-label="Secondary metrics">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            onClick={() => navigate("/clients")}
            onKeyDown={(e) => e.key === 'Enter' && navigate("/clients")}
            tabIndex={0}
            role="button"
            aria-label={`${clientCount} Active Clients. Click to view.`}
            className="rounded-2xl bg-white border border-border/50 shadow-sm p-4 flex items-center gap-3 cursor-pointer hover:shadow-md hover:border-primary/20 transition-all focus:outline-none focus:ring-2 focus:ring-primary/50"
            data-testid="dashboard-active-clients"
          >
            <div className="h-10 w-10 rounded-xl flex items-center justify-center" style={{ background: "linear-gradient(135deg, #2dd4bf, #14b8a6)" }} aria-hidden="true">
              <UserCircle className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="text-xl font-bold text-foreground">{clientCount}</p>
              <p className="text-xs text-muted-foreground font-medium">Active Clients</p>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.08 }}
            onClick={() => navigate("/case-notes")}
            onKeyDown={(e) => e.key === 'Enter' && navigate("/case-notes")}
            tabIndex={0}
            role="button"
            aria-label={`${todayNotes} Notes Today. Click to view.`}
            className="rounded-2xl bg-white border border-border/50 shadow-sm p-4 flex items-center gap-3 cursor-pointer hover:shadow-md hover:border-primary/20 transition-all focus:outline-none focus:ring-2 focus:ring-primary/50"
            data-testid="dashboard-notes-today"
          >
            <div className="h-10 w-10 rounded-xl flex items-center justify-center" style={{ background: "linear-gradient(135deg, #fbbf24, #f59e0b)" }} aria-hidden="true">
              <FileText className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="text-xl font-bold text-foreground">{todayNotes}</p>
              <p className="text-xs text-muted-foreground font-medium">Notes Today</p>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            onClick={() => navigate("/incidents")}
            onKeyDown={(e) => e.key === 'Enter' && navigate("/incidents")}
            tabIndex={0}
            role="button"
            aria-label={`${openIncidents} Open Incidents. Click to view.`}
            className="rounded-2xl bg-white border border-border/50 shadow-sm p-4 flex items-center gap-3 cursor-pointer hover:shadow-md hover:border-primary/20 transition-all focus:outline-none focus:ring-2 focus:ring-primary/50"
            data-testid="dashboard-open-incidents"
          >
            <div className="h-10 w-10 rounded-xl flex items-center justify-center" style={{ background: openIncidents > 0 ? "linear-gradient(135deg, #f87171, #ef4444)" : "linear-gradient(135deg, #4ade80, #22c55e)" }} aria-hidden="true">
              <AlertTriangle className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="text-xl font-bold text-foreground">{openIncidents}</p>
              <p className="text-xs text-muted-foreground font-medium">Open Incidents</p>
            </div>
          </motion.div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
          {/* Upcoming Shifts - wider */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.12 }}
            className="lg:col-span-3 rounded-2xl bg-white border border-border/50 shadow-sm overflow-hidden"
          >
            <div className="flex items-center justify-between px-5 py-4 border-b border-border/40">
              <div className="flex items-center gap-2">
                <div className="h-7 w-7 rounded-lg flex items-center justify-center" style={{ background: "linear-gradient(135deg, #fb923c, #f97316)" }}>
                  <CalendarDays className="h-3.5 w-3.5 text-white" />
                </div>
                <h3 className="text-sm font-semibold text-foreground">Upcoming Shifts</h3>
              </div>
              <button
                onClick={() => navigate("/roster")}
                className="text-xs text-primary font-medium hover:underline flex items-center gap-1"
              >
                View Roster <ChevronRight className="h-3 w-3" />
              </button>
            </div>

            {shiftsLoading ? (
              <div className="flex justify-center py-10">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            ) : upcomingShifts.length === 0 ? (
              <div className="py-10 text-center">
                <CalendarDays className="h-8 w-8 text-muted-foreground/30 mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">No upcoming shifts scheduled</p>
              </div>
            ) : (
              <div className="divide-y divide-border/30">
                {upcomingShifts.map((shift: any, i: number) => {
                  const staffName = shift.staff
                    ? `${shift.staff.preferred_name || shift.staff.first_name} ${shift.staff.last_name}`
                    : "Unknown";
                  const clientName = shift.client
                    ? `${shift.client.first_name} ${shift.client.last_name}`
                    : "No client";
                  const avatarProps = getAvatarProps(staffName);
                  const shiftDate = new Date(shift.shift_date + "T00:00:00");
                  const isToday = shift.shift_date === getPerthDate();

                  return (
                    <div key={shift.id || i} className="flex items-center gap-4 px-5 py-3.5 hover:bg-secondary/30 transition-colors">
                      {/* Avatar */}
                      <div
                        className="h-9 w-9 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0 shadow-sm"
                        style={{ background: avatarProps.color }}
                      >
                        {avatarProps.initials}
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-foreground truncate">{staffName}</p>
                        <p className="text-xs text-muted-foreground truncate">
                          {clientName}
                          {isToday ? "" : ` · ${shiftDate.toLocaleDateString("en-AU", { weekday: "short", day: "numeric", month: "short" })}`}
                        </p>
                      </div>

                      {/* Time */}
                      <div className="text-right shrink-0">
                        <p className="text-sm font-semibold text-foreground">
                          {shift.start_time ? shift.start_time.slice(0, 5) : "—"}
                        </p>
                        {isToday && (
                          <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-primary/10 text-primary">
                            Today
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </motion.div>

          {/* Recent Activity - narrower */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="lg:col-span-2 rounded-2xl bg-white border border-border/50 shadow-sm overflow-hidden"
          >
            <div className="flex items-center justify-between px-5 py-4 border-b border-border/40">
              <div className="flex items-center gap-2">
                <div className="h-7 w-7 rounded-lg flex items-center justify-center" style={{ background: "linear-gradient(135deg, #4ade80, #22c55e)" }}>
                  <Clock className="h-3.5 w-3.5 text-white" />
                </div>
                <h3 className="text-sm font-semibold text-foreground">Recent Activity</h3>
              </div>
              <button
                onClick={() => navigate("/check-in")}
                className="text-xs text-primary font-medium hover:underline flex items-center gap-1"
              >
                All <ChevronRight className="h-3 w-3" />
              </button>
            </div>

            {checkinsLoading ? (
              <div className="flex justify-center py-10">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            ) : recentCheckins.length === 0 ? (
              <div className="py-10 text-center">
                <TrendingUp className="h-8 w-8 text-muted-foreground/30 mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">No recent activity</p>
              </div>
            ) : (
              <div className="divide-y divide-border/30">
                {recentCheckins.map((c: any) => {
                  const avatarProps = getAvatarProps(c.staff_name || "UN");
                  return (
                    <div key={c.id} className="flex items-center gap-3 px-4 py-3 hover:bg-secondary/30 transition-colors">
                      <div
                        className="h-8 w-8 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0"
                        style={{ background: avatarProps.color }}
                      >
                        {avatarProps.initials}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-foreground truncate">{c.staff_name}</p>
                        <p className="text-[10px] text-muted-foreground truncate">
                          {c.client_name || "No client"} · {c.check_in_time ? formatPerthTime(c.check_in_time) : "—"}
                        </p>
                      </div>
                      <span
                        className={`text-[10px] font-medium px-2 py-0.5 rounded-full shrink-0 ${
                          c.status === "checked_in"
                            ? "bg-success/10 text-success"
                            : "bg-muted text-muted-foreground"
                        }`}
                      >
                                        {c.status === "checked_in" ? "Active" : "Done"}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </motion.div>
        </div>

        {/* Client Cards Section */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.18 }}
          className="rounded-2xl bg-white border border-border/50 shadow-sm overflow-hidden"
          data-testid="dashboard-client-cards"
        >
          <div className="flex items-center justify-between px-5 py-4 border-b border-border/40">
            <div className="flex items-center gap-2">
              <div className="h-7 w-7 rounded-lg flex items-center justify-center" style={{ background: "linear-gradient(135deg, #2dd4bf, #14b8a6)" }}>
                <Heart className="h-3.5 w-3.5 text-white" />
              </div>
              <h3 className="text-sm font-semibold text-foreground">Active Clients</h3>
              <span className="text-xs text-muted-foreground bg-slate-100 px-2 py-0.5 rounded-full">{clientCount}</span>
            </div>
            <button
              onClick={() => navigate("/clients")}
              className="text-xs text-primary font-medium hover:underline flex items-center gap-1"
              data-testid="dashboard-view-all-clients"
            >
              View All <ChevronRight className="h-3 w-3" />
            </button>
          </div>

          {clientsLoading ? (
            <div className="flex justify-center py-10">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : recentClients.length === 0 ? (
            <div className="py-10 text-center">
              <UserCircle className="h-8 w-8 text-muted-foreground/30 mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">No clients found</p>
              <p className="text-xs text-muted-foreground mt-1">Add your first client to get started</p>
            </div>
          ) : (
            <div className="p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {recentClients.map((client: any, i: number) => {
                const clientName = fullName(client);
                const avatarProps = getAvatarProps(clientName);
                return (
                  <motion.div
                    key={client.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.02 * i }}
                    onClick={() => navigate("/clients")}
                    onKeyDown={(e) => e.key === 'Enter' && navigate("/clients")}
                    tabIndex={0}
                    role="button"
                    aria-label={`View ${clientName}'s profile`}
                    className="rounded-xl border border-border/50 bg-gradient-to-br from-white to-slate-50 p-4 cursor-pointer hover:shadow-md hover:border-teal-200 transition-all focus:outline-none focus:ring-2 focus:ring-teal-400/50"
                    data-testid={`client-card-${client.id}`}
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className="h-10 w-10 rounded-full flex items-center justify-center text-white text-sm font-bold shrink-0 shadow-sm"
                        style={{ background: avatarProps.color }}
                      >
                        {avatarProps.initials}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-foreground truncate">{clientName}</p>
                        {client.ndis_number && (
                          <p className="text-[10px] text-teal-600 font-medium">NDIS: {client.ndis_number}</p>
                        )}
                        {client.funding_type && !client.ndis_number && (
                          <p className="text-[10px] text-muted-foreground capitalize">{client.funding_type.replace(/_/g, " ")}</p>
                        )}
                      </div>
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-200 shrink-0">
                        Active
                      </span>
                    </div>
                    
                    <div className="mt-3 pt-3 border-t border-slate-100 space-y-1.5">
                      {client.phone && (
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Phone className="h-3 w-3 text-slate-400" />
                          <span className="truncate">{client.phone}</span>
                        </div>
                      )}
                      {client.address && (
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <MapPin className="h-3 w-3 text-slate-400" />
                          <span className="truncate">{client.address}</span>
                        </div>
                      )}
                      {!client.phone && !client.address && (
                        <p className="text-xs text-muted-foreground italic">No contact info</p>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </motion.div>
      </div>
    </AppLayout>
  );
}
