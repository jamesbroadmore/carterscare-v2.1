/**
 * B2B Enterprise Dashboard
 * Multi-site / multi-team views with aggregated billing and cross-site reports
 */

import { useState } from "react";
import { AppLayout } from "@/components/AppLayout";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { motion } from "framer-motion";
import {
  Building2, Users, DollarSign, TrendingUp, MapPin, Clock,
  BarChart3, PieChart, Calendar, AlertTriangle, ChevronRight,
  Loader2, Filter, Download, ArrowUpRight, ArrowDownRight
} from "lucide-react";
import { PrimaryButton, OutlineButton } from "@/components/ui-kit";
import { format, subDays } from "date-fns";
import maureenImg from "@/assets/maureen.png";

// Mock multi-site data (in real implementation, this would come from tenant-aware queries)
const SITES = [
  { id: "site-1", name: "Perth Central", region: "WA", active: true },
  { id: "site-2", name: "Sydney North", region: "NSW", active: true },
  { id: "site-3", name: "Melbourne CBD", region: "VIC", active: true },
  { id: "site-4", name: "Brisbane South", region: "QLD", active: false },
];

export default function B2BDashboard() {
  const [selectedSite, setSelectedSite] = useState<string | "all">("all");
  const [timeRange, setTimeRange] = useState<"7d" | "30d" | "90d">("30d");

  // Fetch aggregated data
  const { data: aggregatedData, isLoading } = useQuery({
    queryKey: ["b2b-dashboard", selectedSite, timeRange],
    queryFn: async () => {
      const days = timeRange === "7d" ? 7 : timeRange === "30d" ? 30 : 90;
      const startDate = format(subDays(new Date(), days), "yyyy-MM-dd");

      // Fetch real data from Supabase
      const [staffResult, clientsResult, timesheetsResult, invoicesResult] = await Promise.all([
        supabase.from("staff").select("id, status"),
        supabase.from("clients").select("id, status"),
        supabase.from("timesheets").select("id, total_hours, status").gte("shift_date", startDate),
        supabase.from("invoices").select("id, total_amount, status"),
      ]);

      const staff = staffResult.data || [];
      const clients = clientsResult.data || [];
      const timesheets = timesheetsResult.data || [];
      const invoices = invoicesResult.data || [];

      const totalHours = timesheets.reduce((sum, t) => sum + (t.total_hours || 0), 0);
      const totalRevenue = invoices.reduce((sum, i) => sum + (i.total_amount || 0), 0);
      const pendingInvoices = invoices.filter(i => i.status === "pending").length;

      return {
        sites: SITES.length,
        activeSites: SITES.filter(s => s.active).length,
        totalStaff: staff.length,
        activeStaff: staff.filter(s => s.status === "active").length,
        totalClients: clients.length,
        activeClients: clients.filter(c => c.status === "active").length,
        totalHours,
        totalRevenue,
        pendingInvoices,
        avgHoursPerSite: totalHours / Math.max(SITES.filter(s => s.active).length, 1),
        // Mock site breakdown
        siteBreakdown: SITES.map(site => ({
          ...site,
          staff: Math.floor(staff.length / SITES.length) + Math.floor(Math.random() * 5),
          clients: Math.floor(clients.length / SITES.length) + Math.floor(Math.random() * 10),
          hours: Math.floor(totalHours / SITES.length) + Math.floor(Math.random() * 50),
          revenue: Math.floor(totalRevenue / SITES.length) + Math.floor(Math.random() * 5000),
        })),
      };
    },
  });

  return (
    <AppLayout title="Enterprise Dashboard">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-slate-800">Enterprise Overview</h2>
            <p className="text-sm text-slate-500">Multi-site performance and aggregated metrics</p>
          </div>
          <div className="flex items-center gap-3">
            {/* Site Filter */}
            <select
              value={selectedSite}
              onChange={(e) => setSelectedSite(e.target.value)}
              className="h-9 px-3 rounded-xl border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-400"
            >
              <option value="all">All Sites</option>
              {SITES.map(site => (
                <option key={site.id} value={site.id}>{site.name}</option>
              ))}
            </select>
            {/* Time Range */}
            <div className="flex items-center rounded-xl border border-slate-200 overflow-hidden">
              {(["7d", "30d", "90d"] as const).map((range) => (
                <button
                  key={range}
                  onClick={() => setTimeRange(range)}
                  className={`px-3 py-1.5 text-sm font-medium ${
                    timeRange === range
                      ? "bg-purple-100 text-purple-700"
                      : "bg-white text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  {range === "7d" ? "7D" : range === "30d" ? "30D" : "90D"}
                </button>
              ))}
            </div>
            <OutlineButton>
              <Download className="h-4 w-4" /> Export
            </OutlineButton>
          </div>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-purple-500" />
          </div>
        ) : aggregatedData && (
          <>
            {/* Key Metrics */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <MetricCard
                title="Active Sites"
                value={aggregatedData.activeSites}
                subtitle={`of ${aggregatedData.sites} total`}
                icon={Building2}
                color="purple"
              />
              <MetricCard
                title="Total Staff"
                value={aggregatedData.activeStaff}
                subtitle={`${aggregatedData.totalStaff} registered`}
                icon={Users}
                color="blue"
              />
              <MetricCard
                title="Total Hours"
                value={aggregatedData.totalHours.toFixed(0)}
                subtitle="This period"
                icon={Clock}
                color="teal"
                trend={12}
              />
              <MetricCard
                title="Revenue"
                value={`$${(aggregatedData.totalRevenue / 1000).toFixed(1)}k`}
                subtitle={`${aggregatedData.pendingInvoices} pending`}
                icon={DollarSign}
                color="green"
                trend={8}
              />
            </div>

            {/* Site Breakdown */}
            <div className="bg-white rounded-2xl border overflow-hidden">
              <div className="px-5 py-4 border-b flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-800">Site Performance</h3>
                <span className="text-xs text-slate-500">Last {timeRange === "7d" ? "7 days" : timeRange === "30d" ? "30 days" : "90 days"}</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-slate-50 border-b">
                    <tr>
                      <th className="text-left px-5 py-3 text-xs font-bold text-slate-600 uppercase">Site</th>
                      <th className="text-left px-5 py-3 text-xs font-bold text-slate-600 uppercase">Region</th>
                      <th className="text-right px-5 py-3 text-xs font-bold text-slate-600 uppercase">Staff</th>
                      <th className="text-right px-5 py-3 text-xs font-bold text-slate-600 uppercase">Clients</th>
                      <th className="text-right px-5 py-3 text-xs font-bold text-slate-600 uppercase">Hours</th>
                      <th className="text-right px-5 py-3 text-xs font-bold text-slate-600 uppercase">Revenue</th>
                      <th className="text-center px-5 py-3 text-xs font-bold text-slate-600 uppercase">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {aggregatedData.siteBreakdown.map((site) => (
                      <tr key={site.id} className="hover:bg-slate-50">
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <div className="h-8 w-8 rounded-lg bg-purple-100 flex items-center justify-center">
                              <Building2 className="h-4 w-4 text-purple-600" />
                            </div>
                            <span className="text-sm font-medium text-slate-800">{site.name}</span>
                          </div>
                        </td>
                        <td className="px-5 py-4 text-sm text-slate-600">{site.region}</td>
                        <td className="px-5 py-4 text-sm text-slate-800 text-right font-medium">{site.staff}</td>
                        <td className="px-5 py-4 text-sm text-slate-800 text-right font-medium">{site.clients}</td>
                        <td className="px-5 py-4 text-sm text-slate-800 text-right font-medium">{site.hours}</td>
                        <td className="px-5 py-4 text-sm text-slate-800 text-right font-medium">${site.revenue.toLocaleString()}</td>
                        <td className="px-5 py-4 text-center">
                          <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                            site.active ? "bg-green-100 text-green-700" : "bg-slate-100 text-slate-500"
                          }`}>
                            {site.active ? "Active" : "Inactive"}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-slate-50 border-t">
                    <tr>
                      <td className="px-5 py-3 text-sm font-bold text-slate-800" colSpan={2}>Total</td>
                      <td className="px-5 py-3 text-sm font-bold text-slate-800 text-right">{aggregatedData.activeStaff}</td>
                      <td className="px-5 py-3 text-sm font-bold text-slate-800 text-right">{aggregatedData.activeClients}</td>
                      <td className="px-5 py-3 text-sm font-bold text-slate-800 text-right">{aggregatedData.totalHours.toFixed(0)}</td>
                      <td className="px-5 py-3 text-sm font-bold text-slate-800 text-right">${aggregatedData.totalRevenue.toLocaleString()}</td>
                      <td></td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>

            {/* Maureen Enterprise Insights */}
            <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-2xl border border-indigo-100 p-6">
              <div className="flex items-start gap-4">
                <img src={maureenImg} alt="Maureen" className="h-12 w-12 rounded-full" />
                <div>
                  <h3 className="text-base font-bold text-slate-800 mb-2">Enterprise Insights</h3>
                  <div className="space-y-2 text-sm text-slate-600">
                    <p>• <strong>{SITES.filter(s => s.active).length} of {SITES.length}</strong> sites are currently active.</p>
                    <p>• Average service hours per site: <strong>{aggregatedData.avgHoursPerSite.toFixed(1)} hours</strong>.</p>
                    {aggregatedData.pendingInvoices > 0 && (
                      <p>• There are <strong>{aggregatedData.pendingInvoices} pending invoices</strong> across all sites that need attention.</p>
                    )}
                    <p>• Cross-site reports can be exported for compliance and billing purposes.</p>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </AppLayout>
  );
}

// Metric Card Component
function MetricCard({
  title,
  value,
  subtitle,
  icon: Icon,
  color,
  trend,
}: {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ElementType;
  color: string;
  trend?: number;
}) {
  const colors: Record<string, string> = {
    purple: "from-purple-500 to-violet-500",
    blue: "from-blue-500 to-cyan-500",
    teal: "from-teal-500 to-cyan-500",
    green: "from-green-500 to-emerald-500",
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
        {trend !== undefined && (
          <div className={`flex items-center gap-1 text-xs font-semibold ${trend > 0 ? "text-green-600" : "text-red-600"}`}>
            {trend > 0 ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
            {Math.abs(trend)}%
          </div>
        )}
      </div>
      <p className="text-2xl font-bold text-slate-800">{value}</p>
      <p className="text-xs text-slate-500 mt-0.5">{subtitle || title}</p>
    </motion.div>
  );
}
