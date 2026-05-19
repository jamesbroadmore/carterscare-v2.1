import { AppLayout } from "@/components/AppLayout";
import { MetricCard } from "@/components/MetricCard";
import { DollarSign, TrendingUp, Users, BarChart3, Receipt, Clock, FileText, CheckCircle, AlertCircle } from "lucide-react";
import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export default function Financials() {
  const { data: stats } = useQuery({
    queryKey: ["financials-stats"],
    queryFn: async () => {
      const { count: staffCount } = await supabase.from("staff").select("*", { count: "exact", head: true }).eq("status", "active");
      const { count: clientCount } = await supabase.from("clients").select("*", { count: "exact", head: true }).eq("status", "active");
      const { data: tData } = await supabase.from("timesheets").select("total_hours, status").not("total_hours", "is", null);
      const totalHours = (tData || []).reduce((sum: number, t: any) => sum + (t.total_hours || 0), 0);
      const pendingCount = (tData || []).filter((t: any) => t.status === "pending").length;

      const { data: invoiceData } = await supabase.from("invoices").select("status, total");
      const allInvoices = invoiceData || [];
      const totalInvoiced = allInvoices.reduce((s: number, i: any) => s + Number(i.total || 0), 0);
      const totalPaid = allInvoices.filter((i: any) => i.status === "paid").reduce((s: number, i: any) => s + Number(i.total || 0), 0);
      const totalOutstanding = allInvoices
        .filter((i: any) => ["draft", "submitted", "approved"].includes(i.status))
        .reduce((s: number, i: any) => s + Number(i.total || 0), 0);
      const invoiceCount = allInvoices.length;
      const paidCount = allInvoices.filter((i: any) => i.status === "paid").length;
      const submittedCount = allInvoices.filter((i: any) => i.status === "submitted").length;
      const draftCount = allInvoices.filter((i: any) => i.status === "draft").length;

      return { staffCount: staffCount ?? 0, clientCount: clientCount ?? 0, totalHours, pendingCount, totalInvoiced, totalPaid, totalOutstanding, invoiceCount, paidCount, submittedCount, draftCount };
    },
  });

  const fmt = (n: number) => n.toLocaleString("en-AU", { style: "currency", currency: "AUD", maximumFractionDigits: 0 });

  return (
    <AppLayout title="Financials">
      <div className="space-y-6">
        {/* Invoice revenue cards */}
        <div>
          <h2 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-3">Invoice Revenue</h2>
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
            <MetricCard
              title="Total Invoiced"
              value={stats ? fmt(stats.totalInvoiced) : "—"}
              icon={FileText}
              gradient="linear-gradient(135deg, #6366f1, #4f46e5)"
            />
            <MetricCard
              title="Total Paid"
              value={stats ? fmt(stats.totalPaid) : "—"}
              icon={CheckCircle}
              gradient="linear-gradient(135deg, #4ade80, #22c55e)"
            />
            <MetricCard
              title="Outstanding"
              value={stats ? fmt(stats.totalOutstanding) : "—"}
              icon={AlertCircle}
              gradient="linear-gradient(135deg, #fbbf24, #f59e0b)"
            />
          </div>
        </div>

        {/* Invoice status breakdown */}
        {stats && stats.invoiceCount > 0 && (
          <div className="rounded-2xl bg-white border border-border/50 shadow-sm p-5">
            <h3 className="text-sm font-bold text-foreground mb-4">Invoice Breakdown</h3>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div className="rounded-xl bg-slate-50 p-3">
                <p className="text-2xl font-black text-slate-700">{stats.draftCount}</p>
                <p className="text-xs text-muted-foreground mt-0.5">Draft</p>
              </div>
              <div className="rounded-xl bg-amber-50 p-3">
                <p className="text-2xl font-black text-amber-700">{stats.submittedCount}</p>
                <p className="text-xs text-muted-foreground mt-0.5">Submitted</p>
              </div>
              <div className="rounded-xl bg-blue-50 p-3">
                <p className="text-2xl font-black text-blue-700">{stats.paidCount}</p>
                <p className="text-xs text-muted-foreground mt-0.5">Paid</p>
              </div>
            </div>
            {stats.totalInvoiced > 0 && (
              <div className="mt-4">
                <div className="flex justify-between text-[11px] text-muted-foreground mb-1">
                  <span>Collection rate</span>
                  <span className="font-semibold text-foreground">{Math.round((stats.totalPaid / stats.totalInvoiced) * 100)}%</span>
                </div>
                <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                  <div
                    className="h-2 rounded-full"
                    style={{
                      width: `${Math.round((stats.totalPaid / stats.totalInvoiced) * 100)}%`,
                      background: "linear-gradient(90deg, #4ade80, #22c55e)",
                    }}
                  />
                </div>
              </div>
            )}
          </div>
        )}

        {/* Workforce stats */}
        <div>
          <h2 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-3">Workforce</h2>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <MetricCard
              title="Active Staff"
              value={stats?.staffCount ?? 0}
              icon={Users}
              gradient="linear-gradient(135deg, #a78bfa, #8b5cf6)"
            />
            <MetricCard
              title="Active Clients"
              value={stats?.clientCount ?? 0}
              icon={TrendingUp}
              gradient="linear-gradient(135deg, #60a5fa, #3b82f6)"
            />
            <MetricCard
              title="Total Hours"
              value={stats?.totalHours ? `${stats.totalHours.toFixed(0)}h` : "0h"}
              icon={Clock}
              gradient="linear-gradient(135deg, #4ade80, #22c55e)"
            />
            <MetricCard
              title="Pending Approval"
              value={stats?.pendingCount ?? 0}
              icon={Receipt}
              gradient="linear-gradient(135deg, #fbbf24, #f59e0b)"
            />
          </div>
        </div>

        {/* Coming soon panels */}
        <div>
          <h2 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-3">Coming Soon</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              { label: "Payroll Processing", desc: "Automated payroll calculations from approved timesheets. Export to Xero or MYOB.", icon: Receipt, gradient: "linear-gradient(135deg, #60a5fa, #3b82f6)" },
              { label: "NDIS Claiming", desc: "Generate NDIS payment requests and track claim status against plan budgets.", icon: FileText, gradient: "linear-gradient(135deg, #a78bfa, #8b5cf6)" },
              { label: "Profit & Loss", desc: "Margin analysis by service type, client funding stream and support worker.", icon: BarChart3, gradient: "linear-gradient(135deg, #fb923c, #f97316)" },
              { label: "Client Budgets", desc: "Track NDIS plan budgets in real time and alert when clients are approaching their limits.", icon: DollarSign, gradient: "linear-gradient(135deg, #4ade80, #22c55e)" },
            ].map((item, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                className="rounded-2xl bg-white border border-border/50 shadow-sm p-5 flex items-start gap-4">
                <div className="h-12 w-12 rounded-2xl flex items-center justify-center shrink-0 shadow-md" style={{ background: item.gradient }}>
                  <item.icon className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-foreground">{item.label}</h3>
                  <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{item.desc}</p>
                  <span className="inline-block mt-2 text-[10px] font-bold uppercase tracking-wider text-purple-500 bg-purple-50 border border-purple-200 px-2 py-0.5 rounded-full">Coming Soon</span>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
