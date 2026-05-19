/**
 * Analytics Dashboard
 * Service usage, staff performance, incident trends
 */

import { useState } from "react";
import { AppLayout } from "@/components/AppLayout";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { motion } from "framer-motion";
import {
  BarChart3, TrendingUp, TrendingDown, Users, Clock, AlertTriangle,
  Calendar, DollarSign, FileText, Activity, ArrowUpRight, ArrowDownRight,
  Loader2, ChevronRight, Filter
} from "lucide-react";
import { format, subDays, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from "date-fns";

type TimeRange = "7d" | "30d" | "90d" | "year";

export default function Analytics() {
  const [timeRange, setTimeRange] = useState<TimeRange>("30d");

  // Get date range based on selection
  const getDateRange = () => {
    const now = new Date();
    switch (timeRange) {
      case "7d": return { start: subDays(now, 7), end: now };
      case "30d": return { start: subDays(now, 30), end: now };
      case "90d": return { start: subDays(now, 90), end: now };
      case "year": return { start: subDays(now, 365), end: now };
    }
  };

  const { start, end } = getDateRange();

  // Fetch analytics data
  const { data: analyticsData, isLoading } = useQuery({
    queryKey: ["analytics", timeRange],
    queryFn: async () => {
      const startDate = format(start, "yyyy-MM-dd");
      const endDate = format(end, "yyyy-MM-dd");

      // Fetch multiple data points in parallel
      const [
        staffResult,
        clientsResult,
        timesheetsResult,
        incidentsResult,
        shiftsResult,
        notesResult,
      ] = await Promise.all([
        supabase.from("staff").select("id, status, created_at"),
        supabase.from("clients").select("id, status, created_at"),
        supabase.from("timesheets").select("id, status, total_hours, shift_date").gte("shift_date", startDate).lte("shift_date", endDate),
        supabase.from("incidents").select("id, status, severity, incident_date, created_at").gte("incident_date", startDate).lte("incident_date", endDate),
        supabase.from("timesheets").select("id, shift_date, start_time, end_time").gte("shift_date", startDate).lte("shift_date", endDate),
        supabase.from("case_notes").select("id, created_at").gte("created_at", startDate),
      ]);

      const staff = staffResult.data || [];
      const clients = clientsResult.data || [];
      const timesheets = timesheetsResult.data || [];
      const incidents = incidentsResult.data || [];
      const shifts = shiftsResult.data || [];
      const notes = notesResult.data || [];

      // Calculate metrics
      const totalHours = timesheets.reduce((sum, t) => sum + (t.total_hours || 0), 0);
      const approvedTimesheets = timesheets.filter(t => t.status === "approved").length;
      const pendingTimesheets = timesheets.filter(t => t.status === "submitted" || t.status === "pending").length;
      
      const openIncidents = incidents.filter(i => i.status === "open" || i.status === "investigating").length;
      const highSeverityIncidents = incidents.filter(i => i.severity === "high" || i.severity === "critical").length;

      // Calculate trends (comparing to previous period)
      const prevStart = subDays(start, timeRange === "7d" ? 7 : timeRange === "30d" ? 30 : timeRange === "90d" ? 90 : 365);
      const prevShiftsResult = await supabase
        .from("timesheets")
        .select("id, total_hours")
        .gte("shift_date", format(prevStart, "yyyy-MM-dd"))
        .lt("shift_date", startDate);
      
      const prevHours = (prevShiftsResult.data || []).reduce((sum, t) => sum + (t.total_hours || 0), 0);
      const hoursTrend = prevHours > 0 ? ((totalHours - prevHours) / prevHours * 100) : 0;

      return {
        staff: {
          total: staff.length,
          active: staff.filter(s => s.status === "active").length,
        },
        clients: {
          total: clients.length,
          active: clients.filter(c => c.status === "active").length,
        },
        timesheets: {
          total: timesheets.length,
          approved: approvedTimesheets,
          pending: pendingTimesheets,
          totalHours,
          hoursTrend,
        },
        incidents: {
          total: incidents.length,
          open: openIncidents,
          highSeverity: highSeverityIncidents,
        },
        shifts: {
          total: shifts.length,
        },
        notes: {
          total: notes.length,
        },
      };
    },
  });

  return (
    <AppLayout title="Analytics">
      <div className="space-y-6">
        {/* Header with Time Range Selector */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-slate-800">Platform Analytics</h2>
            <p className="text-sm text-slate-500">Track performance and trends across your organisation</p>
          </div>
          <div className="flex items-center gap-2">
            {(["7d", "30d", "90d", "year"] as TimeRange[]).map((range) => (
              <button
                key={range}
                onClick={() => setTimeRange(range)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  timeRange === range
                    ? "bg-purple-100 text-purple-700"
                    : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
                }`}
                data-testid={`time-range-${range}`}
              >
                {range === "7d" ? "7 Days" : range === "30d" ? "30 Days" : range === "90d" ? "90 Days" : "Year"}
              </button>
            ))}
          </div>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
          </div>
        ) : analyticsData ? (
          <>
            {/* Key Metrics Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <MetricCard
                title="Total Hours"
                value={analyticsData.timesheets.totalHours.toFixed(1)}
                suffix="hrs"
                trend={analyticsData.timesheets.hoursTrend}
                icon={Clock}
                color="purple"
              />
              <MetricCard
                title="Active Staff"
                value={analyticsData.staff.active}
                subtitle={`of ${analyticsData.staff.total} total`}
                icon={Users}
                color="blue"
              />
              <MetricCard
                title="Active Clients"
                value={analyticsData.clients.active}
                subtitle={`of ${analyticsData.clients.total} total`}
                icon={Activity}
                color="teal"
              />
              <MetricCard
                title="Open Incidents"
                value={analyticsData.incidents.open}
                subtitle={analyticsData.incidents.highSeverity > 0 ? `${analyticsData.incidents.highSeverity} high severity` : "All normal"}
                icon={AlertTriangle}
                color={analyticsData.incidents.open > 0 ? "red" : "green"}
              />
            </div>

            {/* Secondary Stats */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              {/* Timesheets Overview */}
              <div className="bg-white rounded-2xl border p-5">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-bold text-slate-700">Timesheets</h3>
                  <FileText className="h-5 w-5 text-slate-400" />
                </div>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-500">Total Submitted</span>
                    <span className="text-sm font-bold text-slate-800">{analyticsData.timesheets.total}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-500">Approved</span>
                    <span className="text-sm font-bold text-green-600">{analyticsData.timesheets.approved}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-500">Pending Review</span>
                    <span className="text-sm font-bold text-amber-600">{analyticsData.timesheets.pending}</span>
                  </div>
                  {/* Progress bar */}
                  <div className="mt-2">
                    <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-green-400 to-emerald-500 rounded-full"
                        style={{ width: `${analyticsData.timesheets.total > 0 ? (analyticsData.timesheets.approved / analyticsData.timesheets.total * 100) : 0}%` }}
                      />
                    </div>
                    <p className="text-xs text-slate-400 mt-1">
                      {analyticsData.timesheets.total > 0 
                        ? `${Math.round(analyticsData.timesheets.approved / analyticsData.timesheets.total * 100)}% approved`
                        : "No timesheets yet"
                      }
                    </p>
                  </div>
                </div>
              </div>

              {/* Incidents Overview */}
              <div className="bg-white rounded-2xl border p-5">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-bold text-slate-700">Incidents</h3>
                  <AlertTriangle className="h-5 w-5 text-slate-400" />
                </div>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-500">Total Reported</span>
                    <span className="text-sm font-bold text-slate-800">{analyticsData.incidents.total}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-500">Open Cases</span>
                    <span className={`text-sm font-bold ${analyticsData.incidents.open > 0 ? "text-red-600" : "text-green-600"}`}>
                      {analyticsData.incidents.open}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-500">High Severity</span>
                    <span className={`text-sm font-bold ${analyticsData.incidents.highSeverity > 0 ? "text-red-600" : "text-slate-400"}`}>
                      {analyticsData.incidents.highSeverity}
                    </span>
                  </div>
                  {analyticsData.incidents.open === 0 ? (
                    <div className="mt-2 p-2 bg-green-50 rounded-lg text-center">
                      <p className="text-xs font-medium text-green-700">All incidents resolved</p>
                    </div>
                  ) : (
                    <div className="mt-2 p-2 bg-amber-50 rounded-lg text-center">
                      <p className="text-xs font-medium text-amber-700">{analyticsData.incidents.open} incident{analyticsData.incidents.open > 1 ? "s" : ""} need attention</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Activity Summary */}
              <div className="bg-white rounded-2xl border p-5">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-bold text-slate-700">Activity</h3>
                  <BarChart3 className="h-5 w-5 text-slate-400" />
                </div>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-500">Shifts Scheduled</span>
                    <span className="text-sm font-bold text-slate-800">{analyticsData.shifts.total}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-500">Case Notes Added</span>
                    <span className="text-sm font-bold text-slate-800">{analyticsData.notes.total}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-500">Avg Hours/Shift</span>
                    <span className="text-sm font-bold text-slate-800">
                      {analyticsData.shifts.total > 0 
                        ? (analyticsData.timesheets.totalHours / analyticsData.shifts.total).toFixed(1) 
                        : "0"
                      } hrs
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Insights Section */}
            <div className="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-2xl border border-purple-100 p-6">
              <div className="flex items-start gap-4">
                <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-500 flex items-center justify-center flex-shrink-0">
                  <TrendingUp className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-800 mb-2">Insights from Maureen</h3>
                  <div className="space-y-2 text-sm text-slate-600">
                    {analyticsData.timesheets.hoursTrend > 10 && (
                      <p>• Service hours are up {Math.round(analyticsData.timesheets.hoursTrend)}% compared to the previous period. Good progress.</p>
                    )}
                    {analyticsData.timesheets.hoursTrend < -10 && (
                      <p>• Service hours are down {Math.abs(Math.round(analyticsData.timesheets.hoursTrend))}%. You may want to review scheduling.</p>
                    )}
                    {analyticsData.timesheets.pending > 5 && (
                      <p>• There are {analyticsData.timesheets.pending} timesheets awaiting review. Consider clearing the backlog.</p>
                    )}
                    {analyticsData.incidents.open > 0 && (
                      <p>• {analyticsData.incidents.open} incident{analyticsData.incidents.open > 1 ? "s" : ""} require{analyticsData.incidents.open === 1 ? "s" : ""} attention. Please review.</p>
                    )}
                    {analyticsData.incidents.open === 0 && analyticsData.timesheets.pending === 0 && (
                      <p>• Everything looks well-managed. No immediate actions required.</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="text-center py-12 text-slate-500">Unable to load analytics data</div>
        )}
      </div>
    </AppLayout>
  );
}

// Metric Card Component
function MetricCard({
  title,
  value,
  suffix,
  subtitle,
  trend,
  icon: Icon,
  color,
}: {
  title: string;
  value: string | number;
  suffix?: string;
  subtitle?: string;
  trend?: number;
  icon: React.ElementType;
  color: string;
}) {
  const colors: Record<string, string> = {
    purple: "from-purple-500 to-violet-500",
    blue: "from-blue-500 to-cyan-500",
    teal: "from-teal-500 to-cyan-500",
    green: "from-green-500 to-emerald-500",
    red: "from-red-500 to-rose-500",
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-2xl border p-5"
    >
      <div className="flex items-start justify-between mb-3">
        <div className={`h-10 w-10 rounded-xl bg-gradient-to-br ${colors[color]} flex items-center justify-center`}>
          <Icon className="h-5 w-5 text-white" />
        </div>
        {trend !== undefined && trend !== 0 && (
          <div className={`flex items-center gap-1 text-xs font-semibold ${trend > 0 ? "text-green-600" : "text-red-600"}`}>
            {trend > 0 ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
            {Math.abs(Math.round(trend))}%
          </div>
        )}
      </div>
      <div>
        <p className="text-2xl font-bold text-slate-800">
          {value}{suffix && <span className="text-sm font-medium text-slate-400 ml-1">{suffix}</span>}
        </p>
        <p className="text-xs text-slate-500 mt-0.5">{subtitle || title}</p>
      </div>
    </motion.div>
  );
}
