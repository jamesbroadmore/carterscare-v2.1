import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format, parseISO, getDay } from "date-fns";
import { Loader2, Plus, Trash2 } from "lucide-react";

interface ServiceLine {
  id: string;           // local UI id
  dbId?: string;        // actual DB id (set for existing lines)
  date: string;
  serviceType: string;
  startTime: string;
  endTime: string;
  clientId: string;
}

function dayOfWeekName(dateStr: string): string {
  const d = getDay(parseISO(dateStr));
  return ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][d];
}

interface ClientRates {
  rate_weekday: number | null;
  rate_saturday: number | null;
  rate_sunday: number | null;
  rate_public_holiday: number | null;
}

function rateForDate(dateStr: string, clientRates?: ClientRates | null): number {
  const d = getDay(parseISO(dateStr));
  if (d === 0) return clientRates?.rate_sunday ?? 0;
  if (d === 6) return clientRates?.rate_saturday ?? 0;
  return clientRates?.rate_weekday ?? 0;
}

function parseHours(start: string, end: string): number {
  if (!start || !end) return 0;
  const [sh, sm] = start.split(":").map(Number);
  const [eh, em] = end.split(":").map(Number);
  const mins = (eh * 60 + em) - (sh * 60 + sm);
  return Math.max(0, mins / 60);
}

function fmt12h(t: string): string {
  if (!t) return "";
  const [h, m] = t.split(":").map(Number);
  const ampm = h < 12 ? "am" : "pm";
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:${m.toString().padStart(2, "0")}${ampm}`;
}

/** Parse "Service Type | 9:00am - 11:00am" back into parts */
function parseDescription(desc: string): { serviceType: string; startTime: string; endTime: string } {
  const parts = desc.split(" | ");
  const serviceType = parts[0]?.trim() || "Other";
  const timePart = parts[1]?.trim() || "";
  const [startRaw, endRaw] = timePart.split(" - ");

  function to24h(t: string): string {
    if (!t) return "09:00";
    const lower = t.toLowerCase();
    const pm = lower.includes("pm");
    const am = lower.includes("am");
    const clean = lower.replace("am", "").replace("pm", "").trim();
    const [hStr, mStr] = clean.split(":");
    let h = parseInt(hStr, 10);
    const m = parseInt(mStr || "0", 10);
    if (pm && h !== 12) h += 12;
    if (am && h === 12) h = 0;
    return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`;
  }

  return {
    serviceType,
    startTime: to24h(startRaw),
    endTime: to24h(endRaw),
  };
}

const SERVICE_TYPES = [
  "Domestic Assistance",
  "Personal Care",
  "Community Support",
  "Social Support",
  "Transport",
  "Other",
];

interface Props {
  open: boolean;
  onClose: () => void;
  invoiceId: string;
}

export function EditInvoiceDialog({ open, onClose, invoiceId }: Props) {
  const queryClient = useQueryClient();
  const [lines, setLines] = useState<ServiceLine[]>([]);
  const [notes, setNotes] = useState("");
  const [clientId, setClientId] = useState("");
  const [initialized, setInitialized] = useState(false);

  const { data: invoice, isLoading: loadingInvoice } = useQuery({
    queryKey: ["invoice-edit", invoiceId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("invoices")
        .select("*")
        .eq("id", invoiceId)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: open && !!invoiceId,
  });

  const { data: existingItems = [], isLoading: loadingItems } = useQuery({
    queryKey: ["invoice-line-items-edit", invoiceId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("invoice_line_items")
        .select("*")
        .eq("invoice_id", invoiceId)
        .order("service_date");
      if (error) throw error;
      return data;
    },
    enabled: open && !!invoiceId,
  });

  const { data: clients = [] } = useQuery({
    queryKey: ["clients-for-invoice"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("clients")
        .select("id, first_name, last_name, plan_manager, rate_weekday, rate_saturday, rate_sunday, rate_public_holiday")
        .order("first_name");
      if (error) throw error;
      return data;
    },
  });

  // Populate form from existing data (only once)
  useEffect(() => {
    if (!initialized && invoice && existingItems.length > 0) {
      setNotes(invoice.notes || "");
      // Detect clientId from first line item
      const firstClientId = (existingItems as any[])[0]?.client_id || "";
      setClientId(firstClientId);

      setLines((existingItems as any[]).map((item) => {
        const parsed = parseDescription(item.description || "");
        return {
          id: crypto.randomUUID(),
          dbId: item.id,
          date: item.service_date || format(new Date(), "yyyy-MM-dd"),
          serviceType: parsed.serviceType,
          startTime: parsed.startTime,
          endTime: parsed.endTime,
          clientId: item.client_id || "",
        };
      }));
      setInitialized(true);
    } else if (!initialized && invoice && existingItems.length === 0 && !loadingItems) {
      // Invoice exists but no line items yet
      setNotes(invoice.notes || "");
      setInitialized(true);
    }
  }, [invoice, existingItems, loadingItems, initialized]);

  // Reset when dialog closes
  useEffect(() => {
    if (!open) {
      setInitialized(false);
      setLines([]);
      setNotes("");
      setClientId("");
    }
  }, [open]);

  const addLine = () => {
    const today = format(new Date(), "yyyy-MM-dd");
    setLines((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        date: today,
        serviceType: "Domestic Assistance",
        startTime: "09:00",
        endTime: "11:00",
        clientId,
      },
    ]);
  };

  const removeLine = (id: string) => setLines((prev) => prev.filter((l) => l.id !== id));

  const updateLine = (id: string, field: keyof ServiceLine, value: string) =>
    setLines((prev) => prev.map((l) => (l.id === id ? { ...l, [field]: value } : l)));

  const selectedClientObj = (clients as any[]).find((c) => c.id === clientId);
  const clientRates: ClientRates | null = selectedClientObj ? {
    rate_weekday: selectedClientObj.rate_weekday,
    rate_saturday: selectedClientObj.rate_saturday,
    rate_sunday: selectedClientObj.rate_sunday,
    rate_public_holiday: selectedClientObj.rate_public_holiday,
  } : null;
  const hasRates = clientRates && (clientRates.rate_weekday != null || clientRates.rate_saturday != null || clientRates.rate_sunday != null);

  const lineAmounts = lines.map((l) => {
    const hrs = parseHours(l.startTime, l.endTime);
    const rate = rateForDate(l.date, clientRates);
    return { hrs, rate, amount: hrs * rate };
  });
  const subtotal = lineAmounts.reduce((s, l) => s + l.amount, 0);

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (lines.length === 0) throw new Error("Add at least one service line");

      const effectiveClientId = clientId || lines[0]?.clientId || "";

      // Update invoice header
      const { error: invError } = await supabase
        .from("invoices")
        .update({
          notes: notes.trim() || null,
          subtotal,
          gst: 0,
          total: subtotal,
        })
        .eq("id", invoiceId);
      if (invError) throw invError;

      // Delete all existing line items then re-insert (simplest approach)
      const { error: delError } = await supabase
        .from("invoice_line_items")
        .delete()
        .eq("invoice_id", invoiceId);
      if (delError) throw delError;

      const items = lines.map((l, i) => {
        const { hrs, rate, amount } = lineAmounts[i];
        return {
          invoice_id: invoiceId,
          client_id: effectiveClientId || null,
          description: `${l.serviceType} | ${fmt12h(l.startTime)} - ${fmt12h(l.endTime)}`,
          hours: hrs,
          rate,
          amount,
          service_date: l.date,
        };
      });

      const { error: liError } = await supabase.from("invoice_line_items").insert(items);
      if (liError) throw liError;
    },
    onSuccess: () => {
      toast.success("Invoice updated");
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
      queryClient.invalidateQueries({ queryKey: ["invoice-detail"] });
      queryClient.invalidateQueries({ queryKey: ["invoice-line-items"] });
      queryClient.invalidateQueries({ queryKey: ["invoice-line-items-edit", invoiceId] });
      onClose();
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const isLoading = loadingInvoice || loadingItems;
  const sortedLines = [...lines].sort((a, b) => a.date.localeCompare(b.date));
  const selectedClient = selectedClientObj;

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Invoice {invoice?.invoice_number}</DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="flex justify-center py-10">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="space-y-5 mt-2">
            {/* Client */}
            <div>
              <label className="text-xs font-medium text-muted-foreground">Client</label>
              <select
                value={clientId}
                onChange={(e) => setClientId(e.target.value)}
                className="mt-1 w-full h-9 px-3 rounded-lg border bg-card text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="">Select client...</option>
                {(clients as any[]).map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.first_name} {c.last_name}
                  </option>
                ))}
              </select>
              {selectedClient?.plan_manager && (
                <p className="mt-1 text-xs text-muted-foreground">
                  Bill to: <span className="font-medium text-foreground">{selectedClient.plan_manager}</span>
                </p>
              )}
            </div>

            {/* Service lines */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-medium text-muted-foreground">Service Lines</label>
                <button
                  type="button"
                  onClick={addLine}
                  className="h-7 px-3 rounded-lg bg-primary text-primary-foreground text-xs font-medium flex items-center gap-1.5 hover:opacity-90 transition-opacity"
                >
                  <Plus className="h-3.5 w-3.5" /> Add Line
                </button>
              </div>

              {lines.length === 0 ? (
                <div className="rounded-lg border border-dashed border-border p-4 text-center">
                  <p className="text-xs text-muted-foreground">No service lines — click Add Line</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {sortedLines.map((line) => {
                    const origIdx = lines.findIndex((l) => l.id === line.id);
                    const { hrs, rate, amount } = lineAmounts[origIdx];
                    const dow = line.date ? dayOfWeekName(line.date) : "";
                    return (
                      <div key={line.id} className="rounded-lg border bg-card p-3 space-y-2">
                        <div className="grid grid-cols-[1fr_auto_auto] gap-2 items-center">
                          <div className="flex gap-2 items-center">
                            <input
                              type="date"
                              value={line.date}
                              onChange={(e) => updateLine(line.id, "date", e.target.value)}
                              className="h-8 px-2 rounded-lg border bg-background text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                            />
                            {dow && (
                              <span className="text-xs font-medium text-muted-foreground w-8 shrink-0">{dow}</span>
                            )}
                          </div>
                          <div className="text-right text-xs">
                            <span className="text-muted-foreground">${rate}/hr</span>
                            {hrs > 0 && (
                              <span className="ml-2 font-semibold text-foreground">${amount.toFixed(2)}</span>
                            )}
                          </div>
                          <button
                            type="button"
                            onClick={() => removeLine(line.id)}
                            className="h-8 w-8 flex items-center justify-center rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>

                        <div className="grid grid-cols-3 gap-2">
                          <select
                            value={line.serviceType}
                            onChange={(e) => updateLine(line.id, "serviceType", e.target.value)}
                            className="h-8 px-2 rounded-lg border bg-background text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                          >
                            {SERVICE_TYPES.map((s) => (
                              <option key={s} value={s}>{s}</option>
                            ))}
                          </select>
                          <input
                            type="time"
                            value={line.startTime}
                            onChange={(e) => updateLine(line.id, "startTime", e.target.value)}
                            className="h-8 px-2 rounded-lg border bg-background text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                          />
                          <input
                            type="time"
                            value={line.endTime}
                            onChange={(e) => updateLine(line.id, "endTime", e.target.value)}
                            className="h-8 px-2 rounded-lg border bg-background text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                          />
                        </div>
                        {hrs > 0 && (
                          <p className="text-[11px] text-muted-foreground">
                            {fmt12h(line.startTime)} – {fmt12h(line.endTime)} ={" "}
                            {hrs % 1 === 0 ? hrs : hrs.toFixed(1)}hrs × ${rate} = ${amount.toFixed(2)}
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Total */}
            {subtotal > 0 && (
              <div className="rounded-lg bg-secondary/50 p-3 flex items-center justify-between">
                <div className="space-y-0.5 text-xs text-muted-foreground">
                  <p>{lines.length} service line{lines.length !== 1 ? "s" : ""}</p>
                  <p className="text-[10px]">All services GST-free</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-muted-foreground">Total (GST-free)</p>
                  <p className="text-lg font-bold text-foreground">${subtotal.toFixed(2)}</p>
                </div>
              </div>
            )}

            {/* Notes */}
            <div>
              <label className="text-xs font-medium text-muted-foreground">Notes (optional)</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
                className="mt-1 w-full px-3 py-2 rounded-lg border bg-card text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none"
                placeholder="Optional notes..."
              />
            </div>

            {/* Rate legend */}
            {selectedClientObj && hasRates ? (
              <div className="flex gap-4 text-[11px] text-muted-foreground">
                <span>Mon–Fri: <strong className="text-foreground">${clientRates?.rate_weekday ?? 0}/hr</strong></span>
                <span>Saturday: <strong className="text-foreground">${clientRates?.rate_saturday ?? 0}/hr</strong></span>
                <span>Sunday: <strong className="text-foreground">${clientRates?.rate_sunday ?? 0}/hr</strong></span>
                {clientRates?.rate_public_holiday != null && (
                  <span>Public Holiday: <strong className="text-foreground">${clientRates.rate_public_holiday}/hr</strong></span>
                )}
              </div>
            ) : selectedClientObj && !hasRates ? (
              <div className="rounded-lg bg-amber-50 border border-amber-200 p-2 text-[11px] text-amber-700">
                No rates configured for this client. Go to Clients → Edit to set hourly rates.
              </div>
            ) : null}

            <button
              onClick={() => saveMutation.mutate()}
              disabled={lines.length === 0 || saveMutation.isPending}
              className="w-full h-10 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {saveMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              Save Changes
            </button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
