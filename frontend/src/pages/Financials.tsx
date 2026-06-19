import { useState, useMemo } from "react";
import { AppLayout } from "@/components/AppLayout";
import { MetricCard } from "@/components/MetricCard";
import {
  DollarSign, TrendingUp, Users, BarChart3, Receipt, Clock,
  FileText, CheckCircle, AlertCircle, Download, ChevronDown, ChevronUp,
  TrendingDown, Loader2
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

// ─── helpers ────────────────────────────────────────────────────────────────
const fmt = (n: number) =>
  n.toLocaleString("en-AU", { style: "currency", currency: "AUD", maximumFractionDigits: 0 });

function downloadCSV(filename: string, rows: string[][]) {
  const csv = rows.map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

// ─── Payroll Processing ───────────────────────────────────────────────────────
function PayrollPanel() {
  const [expanded, setExpanded] = useState<string | null>(null);

  const { data: payrollData, isLoading } = useQuery({
    queryKey: ["payroll-timesheets"],
    queryFn: async () => {
      const { data: timesheets } = await supabase
        .from("timesheets")
        .select("id, staff_id, shift_date, start_time, end_time, total_hours, rate_per_hour, status, break_minutes")
        .eq("status", "approved")
        .order("shift_date", { ascending: false });

      const { data: staff } = await supabase
        .from("staff")
        .select("id, first_name, last_name, employment_type, role");

      const staffMap: Record<string, { first_name: string; last_name: string; employment_type: string; role: string }> =
        Object.fromEntries((staff || []).map(s => [s.id, s]));

      // Group timesheets by staff
      const byStaff: Record<string, {
        staff: typeof staffMap[string];
        rows: typeof timesheets;
        totalHours: number;
        totalPay: number;
      }> = {};

      for (const t of timesheets || []) {
        if (!byStaff[t.staff_id]) {
          byStaff[t.staff_id] = { staff: staffMap[t.staff_id], rows: [], totalHours: 0, totalPay: 0 };
        }
        byStaff[t.staff_id].rows!.push(t);
        byStaff[t.staff_id].totalHours += t.total_hours || 0;
        byStaff[t.staff_id].totalPay += (t.total_hours || 0) * (t.rate_per_hour || 0);
      }

      return Object.entries(byStaff).map(([staffId, d]) => ({ staffId, ...d }));
    },
  });

  const grandTotal = useMemo(() =>
    (payrollData || []).reduce((s, r) => s + r.totalPay, 0), [payrollData]);

  function exportXero() {
    const header = ["EmployeeName", "Date", "StartTime", "EndTime", "Hours", "RatePerHour", "Amount", "Status"];
    const rows: string[][] = [header];
    for (const p of payrollData || []) {
      for (const t of p.rows || []) {
        rows.push([
          `${p.staff?.first_name || ""} ${p.staff?.last_name || ""}`,
          t.shift_date,
          t.start_time || "",
          t.end_time || "",
          String((t.total_hours || 0).toFixed(2)),
          String(t.rate_per_hour || 0),
          String(((t.total_hours || 0) * (t.rate_per_hour || 0)).toFixed(2)),
          t.status,
        ]);
      }
    }
    downloadCSV(`payroll_xero_${new Date().toISOString().slice(0, 10)}.csv`, rows);
  }

  function exportMYOB() {
    const header = ["Co./Last Name", "First Name", "Date", "Hours", "Hourly Rate", "Total Pay"];
    const rows: string[][] = [header];
    for (const p of payrollData || []) {
      rows.push([
        p.staff?.last_name || "",
        p.staff?.first_name || "",
        new Date().toLocaleDateString("en-AU"),
        String(p.totalHours.toFixed(2)),
        String((p.rows?.[0]?.rate_per_hour || 0)),
        String(p.totalPay.toFixed(2)),
      ]);
    }
    downloadCSV(`payroll_myob_${new Date().toISOString().slice(0, 10)}.csv`, rows);
  }

  return (
    <div className="rounded-2xl bg-white border border-border/50 shadow-sm overflow-hidden">
      <div className="p-5 flex items-center justify-between border-b border-border/40">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl flex items-center justify-center shadow-sm" style={{ background: "linear-gradient(135deg, #60a5fa, #3b82f6)" }}>
            <Receipt className="h-5 w-5 text-white" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-foreground">Payroll Processing</h3>
            <p className="text-xs text-muted-foreground">Approved timesheets</p>
          </div>
        </div>
        {!isLoading && (payrollData?.length || 0) > 0 && (
          <div className="flex gap-2">
            <button onClick={exportXero}
              className="flex items-center gap-1.5 text-xs font-semibold text-blue-600 bg-blue-50 border border-blue-200 rounded-lg px-3 py-1.5 hover:bg-blue-100 transition-colors">
              <Download className="h-3.5 w-3.5" /> Xero CSV
            </button>
            <button onClick={exportMYOB}
              className="flex items-center gap-1.5 text-xs font-semibold text-purple-600 bg-purple-50 border border-purple-200 rounded-lg px-3 py-1.5 hover:bg-purple-100 transition-colors">
              <Download className="h-3.5 w-3.5" /> MYOB CSV
            </button>
          </div>
        )}
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : (payrollData?.length || 0) === 0 ? (
        <div className="py-10 text-center text-sm text-muted-foreground">No approved timesheets found</div>
      ) : (
        <div>
          <div className="divide-y divide-border/30">
            {payrollData!.map(p => (
              <div key={p.staffId}>
                <button
                  className="w-full flex items-center justify-between px-5 py-3.5 hover:bg-slate-50 transition-colors text-left"
                  onClick={() => setExpanded(expanded === p.staffId ? null : p.staffId)}
                >
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white text-xs font-bold shrink-0">
                      {p.staff?.first_name?.[0]}{p.staff?.last_name?.[0]}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-foreground">{p.staff?.first_name} {p.staff?.last_name}</p>
                      <p className="text-xs text-muted-foreground">{p.staff?.role} · {p.rows?.length} shift{p.rows?.length !== 1 ? "s" : ""}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="text-sm font-bold text-foreground">{fmt(p.totalPay)}</p>
                      <p className="text-xs text-muted-foreground">{p.totalHours.toFixed(1)}h</p>
                    </div>
                    {expanded === p.staffId ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                  </div>
                </button>

                <AnimatePresence>
                  {expanded === p.staffId && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }}>
                      <div className="px-5 pb-3 bg-slate-50">
                        <div className="rounded-xl overflow-hidden border border-border/40 mt-1">
                          <table className="w-full text-xs">
                            <thead>
                              <tr className="bg-slate-100 text-muted-foreground">
                                <th className="text-left px-3 py-2 font-semibold">Date</th>
                                <th className="text-left px-3 py-2 font-semibold">Time</th>
                                <th className="text-right px-3 py-2 font-semibold">Hours</th>
                                <th className="text-right px-3 py-2 font-semibold">Rate</th>
                                <th className="text-right px-3 py-2 font-semibold">Amount</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-border/20 bg-white">
                              {p.rows?.map(t => (
                                <tr key={t.id}>
                                  <td className="px-3 py-2 text-foreground">{new Date(t.shift_date).toLocaleDateString("en-AU")}</td>
                                  <td className="px-3 py-2 text-muted-foreground">{t.start_time?.slice(0, 5)} – {t.end_time?.slice(0, 5) || "—"}</td>
                                  <td className="px-3 py-2 text-right text-foreground">{(t.total_hours || 0).toFixed(2)}</td>
                                  <td className="px-3 py-2 text-right text-muted-foreground">${t.rate_per_hour || 0}/hr</td>
                                  <td className="px-3 py-2 text-right font-semibold text-foreground">{fmt((t.total_hours || 0) * (t.rate_per_hour || 0))}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </div>
          <div className="px-5 py-3 bg-slate-50 border-t border-border/40 flex justify-between items-center">
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Total Payroll</span>
            <span className="text-base font-black text-foreground">{fmt(grandTotal)}</span>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── NDIS Claiming ────────────────────────────────────────────────────────────
function NDISClaimPanel() {
  const { data: claimData, isLoading } = useQuery({
    queryKey: ["ndis-claims"],
    queryFn: async () => {
      // Get invoices with status submitted or approved (claimable)
      const { data: invoices } = await supabase
        .from("invoices")
        .select("id, invoice_number, invoice_date, total, status, staff_id")
        .in("status", ["submitted", "approved"]);

      const { data: lineItems } = await supabase
        .from("invoice_line_items")
        .select("id, invoice_id, client_id, description, hours, rate, amount, funding_program, service_date")
        .in("invoice_id", (invoices || []).map(i => i.id));

      const { data: clients } = await supabase
        .from("clients")
        .select("id, first_name, last_name, ndis_number, ndis_plan_start, ndis_plan_end, rate_weekday");

      const clientMap: Record<string, { first_name: string; last_name: string; ndis_number: string | null; ndis_plan_start: string | null; ndis_plan_end: string | null; rate_weekday: number | null }> =
        Object.fromEntries((clients || []).map(c => [c.id, c]));

      const invoiceMap: Record<string, { invoice_number: string; invoice_date: string; status: string }> =
        Object.fromEntries((invoices || []).map(i => [i.id, i]));

      // Group line items by client
      const byClient: Record<string, {
        client: typeof clientMap[string];
        items: typeof lineItems;
        totalAmount: number;
      }> = {};

      for (const li of lineItems || []) {
        if (!li.client_id) continue;
        if (!byClient[li.client_id]) {
          byClient[li.client_id] = { client: clientMap[li.client_id], items: [], totalAmount: 0 };
        }
        byClient[li.client_id].items!.push({ ...li, _invoice: invoiceMap[li.invoice_id] });
        byClient[li.client_id].totalAmount += Number(li.amount || 0);
      }

      return Object.entries(byClient).map(([clientId, d]) => ({ clientId, ...d }));
    },
  });

  const grandTotal = useMemo(() =>
    (claimData || []).reduce((s, r) => s + r.totalAmount, 0), [claimData]);

  function exportNDISBulk() {
    // NDIS bulk payment request format
    const header = [
      "RegistrationNumber", "NDISNumber", "SupportsDeliveredFrom", "SupportsDeliveredTo",
      "SupportNumber", "ClaimReference", "Quantity", "Hours", "UnitPrice",
      "GSTCode", "AuthorisedBy", "ParticipantApproved", "InKindFundingProgram",
      "ClaimType", "CancellationReason", "ABN of Support Provider"
    ];
    const rows: string[][] = [header];
    for (const c of claimData || []) {
      for (const item of c.items || []) {
        rows.push([
          "", // RegistrationNumber - org specific
          c.client?.ndis_number || "",
          item.service_date || "",
          item.service_date || "",
          "01_002_0107_1_1", // default support number - Core Supports
          (item as any)._invoice?.invoice_number || "",
          "1",
          String((item.hours || 0).toFixed(2)),
          String((item.rate || 0).toFixed(2)),
          "P1", // No GST
          "", // AuthorisedBy
          "Y",
          item.funding_program || "",
          "NDIS",
          "",
          "",
        ]);
      }
    }
    downloadCSV(`ndis_bulk_payment_${new Date().toISOString().slice(0, 10)}.csv`, rows);
  }

  const [expanded, setExpanded] = useState<string | null>(null);

  return (
    <div className="rounded-2xl bg-white border border-border/50 shadow-sm overflow-hidden">
      <div className="p-5 flex items-center justify-between border-b border-border/40">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl flex items-center justify-center shadow-sm" style={{ background: "linear-gradient(135deg, #a78bfa, #8b5cf6)" }}>
            <FileText className="h-5 w-5 text-white" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-foreground">NDIS Claiming</h3>
            <p className="text-xs text-muted-foreground">Submitted &amp; approved invoices</p>
          </div>
        </div>
        {!isLoading && (claimData?.length || 0) > 0 && (
          <button onClick={exportNDISBulk}
            className="flex items-center gap-1.5 text-xs font-semibold text-purple-600 bg-purple-50 border border-purple-200 rounded-lg px-3 py-1.5 hover:bg-purple-100 transition-colors">
            <Download className="h-3.5 w-3.5" /> Bulk Payment CSV
          </button>
        )}
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : (claimData?.length || 0) === 0 ? (
        <div className="py-10 text-center text-sm text-muted-foreground">No claimable invoices found</div>
      ) : (
        <div>
          <div className="divide-y divide-border/30">
            {claimData!.map(c => (
              <div key={c.clientId}>
                <button
                  className="w-full flex items-center justify-between px-5 py-3.5 hover:bg-slate-50 transition-colors text-left"
                  onClick={() => setExpanded(expanded === c.clientId ? null : c.clientId)}
                >
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-gradient-to-br from-purple-400 to-purple-600 flex items-center justify-center text-white text-xs font-bold shrink-0">
                      {c.client?.first_name?.[0]}{c.client?.last_name?.[0]}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-foreground">{c.client?.first_name} {c.client?.last_name}</p>
                      <p className="text-xs text-muted-foreground">
                        {c.client?.ndis_number ? `NDIS: ${c.client.ndis_number}` : "No NDIS number"} · {c.items?.length} line item{c.items?.length !== 1 ? "s" : ""}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="text-sm font-bold text-foreground">{fmt(c.totalAmount)}</p>
                      {c.client?.ndis_plan_end && (
                        <p className="text-xs text-muted-foreground">Plan ends {new Date(c.client.ndis_plan_end).toLocaleDateString("en-AU")}</p>
                      )}
                    </div>
                    {expanded === c.clientId ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                  </div>
                </button>

                <AnimatePresence>
                  {expanded === c.clientId && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }}>
                      <div className="px-5 pb-3 bg-slate-50">
                        <div className="rounded-xl overflow-hidden border border-border/40 mt-1">
                          <table className="w-full text-xs">
                            <thead>
                              <tr className="bg-slate-100 text-muted-foreground">
                                <th className="text-left px-3 py-2 font-semibold">Invoice</th>
                                <th className="text-left px-3 py-2 font-semibold">Service Date</th>
                                <th className="text-left px-3 py-2 font-semibold">Description</th>
                                <th className="text-right px-3 py-2 font-semibold">Hrs</th>
                                <th className="text-right px-3 py-2 font-semibold">Rate</th>
                                <th className="text-right px-3 py-2 font-semibold">Amount</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-border/20 bg-white">
                              {c.items?.map((item: any) => (
                                <tr key={item.id}>
                                  <td className="px-3 py-2 text-muted-foreground">{item._invoice?.invoice_number || "—"}</td>
                                  <td className="px-3 py-2 text-foreground">{item.service_date ? new Date(item.service_date).toLocaleDateString("en-AU") : "—"}</td>
                                  <td className="px-3 py-2 text-foreground max-w-[160px] truncate">{item.description}</td>
                                  <td className="px-3 py-2 text-right text-foreground">{(item.hours || 0).toFixed(2)}</td>
                                  <td className="px-3 py-2 text-right text-muted-foreground">${item.rate || 0}/hr</td>
                                  <td className="px-3 py-2 text-right font-semibold text-foreground">{fmt(item.amount || 0)}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </div>
          <div className="px-5 py-3 bg-slate-50 border-t border-border/40 flex justify-between items-center">
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Total Claimable</span>
            <span className="text-base font-black text-foreground">{fmt(grandTotal)}</span>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Profit & Loss ────────────────────────────────────────────────────────────
function ProfitLossPanel() {
  const { data: plData, isLoading } = useQuery({
    queryKey: ["profit-loss"],
    queryFn: async () => {
      const { data: invoices } = await supabase
        .from("invoices")
        .select("invoice_date, total, status")
        .eq("status", "paid");

      const { data: timesheets } = await supabase
        .from("timesheets")
        .select("shift_date, total_hours, rate_per_hour, status")
        .in("status", ["approved", "paid"]);

      // Group by month
      const months: Record<string, { revenue: number; cost: number; month: string }> = {};

      for (const inv of invoices || []) {
        const m = inv.invoice_date.slice(0, 7);
        if (!months[m]) months[m] = { revenue: 0, cost: 0, month: m };
        months[m].revenue += Number(inv.total || 0);
      }

      for (const ts of timesheets || []) {
        const m = ts.shift_date.slice(0, 7);
        if (!months[m]) months[m] = { revenue: 0, cost: 0, month: m };
        months[m].cost += (ts.total_hours || 0) * (ts.rate_per_hour || 0);
      }

      return Object.values(months)
        .sort((a, b) => a.month.localeCompare(b.month))
        .slice(-6) // last 6 months
        .map(m => ({ ...m, margin: m.revenue - m.cost, marginPct: m.revenue > 0 ? ((m.revenue - m.cost) / m.revenue) * 100 : 0 }));
    },
  });

  const totals = useMemo(() => ({
    revenue: (plData || []).reduce((s, m) => s + m.revenue, 0),
    cost: (plData || []).reduce((s, m) => s + m.cost, 0),
    margin: (plData || []).reduce((s, m) => s + m.margin, 0),
  }), [plData]);

  const maxValue = useMemo(() =>
    Math.max(...(plData || []).map(m => Math.max(m.revenue, m.cost)), 1), [plData]);

  return (
    <div className="rounded-2xl bg-white border border-border/50 shadow-sm overflow-hidden">
      <div className="p-5 border-b border-border/40 flex items-center gap-3">
        <div className="h-10 w-10 rounded-xl flex items-center justify-center shadow-sm" style={{ background: "linear-gradient(135deg, #fb923c, #f97316)" }}>
          <BarChart3 className="h-5 w-5 text-white" />
        </div>
        <div>
          <h3 className="text-sm font-bold text-foreground">Profit &amp; Loss</h3>
          <p className="text-xs text-muted-foreground">Revenue vs cost · last 6 months</p>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : (plData?.length || 0) === 0 ? (
        <div className="py-10 text-center text-sm text-muted-foreground">No paid invoices or timesheets yet</div>
      ) : (
        <div className="p-5">
          {/* Summary row */}
          <div className="grid grid-cols-3 gap-3 mb-5">
            <div className="rounded-xl bg-green-50 p-3 text-center">
              <p className="text-xs text-muted-foreground mb-0.5">Revenue</p>
              <p className="text-base font-black text-green-700">{fmt(totals.revenue)}</p>
            </div>
            <div className="rounded-xl bg-red-50 p-3 text-center">
              <p className="text-xs text-muted-foreground mb-0.5">Cost</p>
              <p className="text-base font-black text-red-600">{fmt(totals.cost)}</p>
            </div>
            <div className={`rounded-xl p-3 text-center ${totals.margin >= 0 ? "bg-blue-50" : "bg-red-50"}`}>
              <p className="text-xs text-muted-foreground mb-0.5">Margin</p>
              <p className={`text-base font-black ${totals.margin >= 0 ? "text-blue-700" : "text-red-600"}`}>
                {totals.margin >= 0 ? "+" : ""}{fmt(totals.margin)}
              </p>
            </div>
          </div>

          {/* Bar chart */}
          <div className="space-y-3">
            {plData!.map(m => {
              const monthLabel = new Date(m.month + "-01").toLocaleString("en-AU", { month: "short", year: "2-digit" });
              return (
                <div key={m.month}>
                  <div className="flex justify-between text-[11px] text-muted-foreground mb-1">
                    <span className="font-medium">{monthLabel}</span>
                    <span className={`font-semibold ${m.margin >= 0 ? "text-green-600" : "text-red-500"}`}>
                      {m.margin >= 0 ? "+" : ""}{fmt(m.margin)} ({m.marginPct.toFixed(0)}%)
                    </span>
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] w-10 text-right text-green-600 font-medium">Rev</span>
                      <div className="flex-1 h-2.5 rounded-full bg-slate-100 overflow-hidden">
                        <div className="h-2.5 rounded-full bg-gradient-to-r from-green-400 to-green-500"
                          style={{ width: `${(m.revenue / maxValue) * 100}%` }} />
                      </div>
                      <span className="text-[10px] w-16 text-right text-foreground font-medium">{fmt(m.revenue)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] w-10 text-right text-red-500 font-medium">Cost</span>
                      <div className="flex-1 h-2.5 rounded-full bg-slate-100 overflow-hidden">
                        <div className="h-2.5 rounded-full bg-gradient-to-r from-red-400 to-red-500"
                          style={{ width: `${(m.cost / maxValue) * 100}%` }} />
                      </div>
                      <span className="text-[10px] w-16 text-right text-foreground font-medium">{fmt(m.cost)}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Client Budgets ────────────────────────────────────────────────────────────
function ClientBudgetsPanel() {
  const { data: budgetData, isLoading } = useQuery({
    queryKey: ["client-budgets"],
    queryFn: async () => {
      const { data: clients } = await supabase
        .from("clients")
        .select("id, first_name, last_name, ndis_number, ndis_plan_start, ndis_plan_end, rate_weekday, funding_type")
        .eq("status", "active")
        .eq("funding_type", "NDIS");

      const { data: lineItems } = await supabase
        .from("invoice_line_items")
        .select("client_id, amount");

      // Sum spent per client
      const spentMap: Record<string, number> = {};
      for (const li of lineItems || []) {
        if (!li.client_id) continue;
        spentMap[li.client_id] = (spentMap[li.client_id] || 0) + Number(li.amount || 0);
      }

      return (clients || []).map(c => {
        const spent = spentMap[c.id] || 0;
        // Estimate plan budget from rate × weekday hours (rough: 40hrs/week × plan weeks)
        const planDays = c.ndis_plan_start && c.ndis_plan_end
          ? Math.max(1, Math.round((new Date(c.ndis_plan_end).getTime() - new Date(c.ndis_plan_start).getTime()) / (1000 * 60 * 60 * 24)))
          : 365;
        const planBudget = c.rate_weekday ? c.rate_weekday * (planDays / 7) * 10 : 0; // ~10hrs/wk
        const pct = planBudget > 0 ? Math.min((spent / planBudget) * 100, 100) : 0;
        const daysLeft = c.ndis_plan_end
          ? Math.max(0, Math.round((new Date(c.ndis_plan_end).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
          : null;
        return { ...c, spent, planBudget, pct, daysLeft };
      }).sort((a, b) => b.pct - a.pct);
    },
  });

  return (
    <div className="rounded-2xl bg-white border border-border/50 shadow-sm overflow-hidden">
      <div className="p-5 border-b border-border/40 flex items-center gap-3">
        <div className="h-10 w-10 rounded-xl flex items-center justify-center shadow-sm" style={{ background: "linear-gradient(135deg, #4ade80, #22c55e)" }}>
          <DollarSign className="h-5 w-5 text-white" />
        </div>
        <div>
          <h3 className="text-sm font-bold text-foreground">Client Budgets</h3>
          <p className="text-xs text-muted-foreground">NDIS plan spend vs estimated budget</p>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : (budgetData?.length || 0) === 0 ? (
        <div className="py-10 text-center text-sm text-muted-foreground">No active NDIS clients found</div>
      ) : (
        <div className="divide-y divide-border/30">
          {budgetData!.map(c => {
            const alertHigh = c.pct >= 90;
            const alertMid = c.pct >= 75;
            const barColor = alertHigh
              ? "linear-gradient(90deg, #f87171, #ef4444)"
              : alertMid
              ? "linear-gradient(90deg, #fbbf24, #f59e0b)"
              : "linear-gradient(90deg, #4ade80, #22c55e)";

            return (
              <div key={c.id} className="px-5 py-4">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <p className="text-sm font-semibold text-foreground">{c.first_name} {c.last_name}</p>
                    <p className="text-xs text-muted-foreground">
                      {c.ndis_number ? `NDIS: ${c.ndis_number}` : "No NDIS #"}
                      {c.daysLeft !== null && (
                        <span className={c.daysLeft < 30 ? " text-red-500 font-semibold" : ""}> · {c.daysLeft}d left</span>
                      )}
                    </p>
                  </div>
                  <div className="text-right">
                    {alertHigh && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-red-600 bg-red-50 border border-red-200 px-2 py-0.5 rounded-full mb-1">
                        <AlertCircle className="h-3 w-3" /> Near limit
                      </span>
                    )}
                    <p className="text-xs text-muted-foreground">{fmt(c.spent)} / {c.planBudget > 0 ? fmt(c.planBudget) : "—"}</p>
                  </div>
                </div>
                {c.planBudget > 0 && (
                  <div>
                    <div className="flex justify-between text-[10px] text-muted-foreground mb-1">
                      <span>Spent</span>
                      <span className="font-semibold text-foreground">{c.pct.toFixed(0)}%</span>
                    </div>
                    <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                      <div className="h-2 rounded-full transition-all duration-500" style={{ width: `${c.pct}%`, background: barColor }} />
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────
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

  return (
    <AppLayout title="Financials">
      <div className="space-y-6">
        {/* Invoice revenue cards */}
        <div>
          <h2 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-3">Invoice Revenue</h2>
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
            <MetricCard title="Total Invoiced" value={stats ? fmt(stats.totalInvoiced) : "—"} icon={FileText} gradient="linear-gradient(135deg, #6366f1, #4f46e5)" />
            <MetricCard title="Total Paid" value={stats ? fmt(stats.totalPaid) : "—"} icon={CheckCircle} gradient="linear-gradient(135deg, #4ade80, #22c55e)" />
            <MetricCard title="Outstanding" value={stats ? fmt(stats.totalOutstanding) : "—"} icon={AlertCircle} gradient="linear-gradient(135deg, #fbbf24, #f59e0b)" />
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
                  <div className="h-2 rounded-full" style={{ width: `${Math.round((stats.totalPaid / stats.totalInvoiced) * 100)}%`, background: "linear-gradient(90deg, #4ade80, #22c55e)" }} />
                </div>
              </div>
            )}
          </div>
        )}

        {/* Workforce stats */}
        <div>
          <h2 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-3">Workforce</h2>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <MetricCard title="Active Staff" value={stats?.staffCount ?? 0} icon={Users} gradient="linear-gradient(135deg, #a78bfa, #8b5cf6)" />
            <MetricCard title="Active Clients" value={stats?.clientCount ?? 0} icon={TrendingUp} gradient="linear-gradient(135deg, #60a5fa, #3b82f6)" />
            <MetricCard title="Total Hours" value={stats?.totalHours ? `${stats.totalHours.toFixed(0)}h` : "0h"} icon={Clock} gradient="linear-gradient(135deg, #4ade80, #22c55e)" />
            <MetricCard title="Pending Approval" value={stats?.pendingCount ?? 0} icon={Receipt} gradient="linear-gradient(135deg, #fbbf24, #f59e0b)" />
          </div>
        </div>

        {/* Functional panels */}
        <div>
          <h2 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-3">Tools</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <PayrollPanel />
            <NDISClaimPanel />
            <ProfitLossPanel />
            <ClientBudgetsPanel />
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
