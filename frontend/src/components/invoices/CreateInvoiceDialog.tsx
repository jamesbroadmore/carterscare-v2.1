import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format, parseISO, getDay } from "date-fns";
import { Loader2, Plus, Trash2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

interface ServiceLine {
  id: string;
  date: string;       // yyyy-MM-dd
  serviceType: string;
  startTime: string;  // HH:mm
  endTime: string;    // HH:mm
}

function dayOfWeekName(dateStr: string): string {
  const d = getDay(parseISO(dateStr));
  return ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][d];
}

function rateForDate(dateStr: string): number {
  const d = getDay(parseISO(dateStr));
  if (d === 0) return 120; // Sunday
  if (d === 6) return 90;  // Saturday
  return 60;               // Weekday
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
}

export function CreateInvoiceDialog({ open, onClose }: Props) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [clientId, setClientId] = useState("");
  const [lines, setLines] = useState<ServiceLine[]>([]);
  const [notes, setNotes] = useState("");

  // Get admin's staff_id (required by invoices table)
  const { data: profile } = useQuery({
    queryKey: ["my-profile-inv", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("staff_id")
        .eq("user_id", user!.id)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  // Load all clients
  const { data: clients = [], isLoading: loadingClients } = useQuery({
    queryKey: ["clients-for-invoice"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("clients")
        .select("id, first_name, last_name, plan_manager, address, suburb, state, postcode")
        .order("first_name");
      if (error) throw error;
      return data;
    },
  });

  const selectedClient = clients.find((c: any) => c.id === clientId);

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
      },
    ]);
  };

  const removeLine = (id: string) => setLines((prev) => prev.filter((l) => l.id !== id));

  const updateLine = (id: string, field: keyof ServiceLine, value: string) =>
    setLines((prev) => prev.map((l) => (l.id === id ? { ...l, [field]: value } : l)));

  // Compute amounts aligned with lines array
  const lineAmounts = lines.map((l) => {
    const hrs = parseHours(l.startTime, l.endTime);
    const rate = rateForDate(l.date);
    return { hrs, rate, amount: hrs * rate };
  });
  const subtotal = lineAmounts.reduce((s, l) => s + l.amount, 0);

  const createMutation = useMutation({
    mutationFn: async () => {
      if (!clientId) throw new Error("Select a client");
      if (lines.length === 0) throw new Error("Add at least one service line");
      if (!profile?.staff_id) throw new Error("Admin staff profile not found");

      const { data: numData, error: numError } = await supabase.rpc("generate_invoice_number");
      if (numError) throw numError;
      const invoiceNumber = numData as string;

      const { data: invoice, error: invError } = await supabase
        .from("invoices")
        .insert({
          invoice_number: invoiceNumber,
          staff_id: profile.staff_id,
          status: "draft",
          invoice_date: format(new Date(), "yyyy-MM-dd"),
          subtotal,
          gst: 0,
          total: subtotal,
          notes: notes.trim() || null,
        })
        .select()
        .single();
      if (invError) throw invError;

      // Pack service details into description: "Service Type | 9:00am - 11:00am"
      const items = lines.map((l, i) => {
        const { hrs, rate, amount } = lineAmounts[i];
        return {
          invoice_id: invoice.id,
          client_id: clientId,
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
      toast.success("Invoice created");
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
      setClientId("");
      setLines([]);
      setNotes("");
      onClose();
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const sortedLines = [...lines].sort((a, b) => a.date.localeCompare(b.date));

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create Invoice</DialogTitle>
        </DialogHeader>

        <div className="space-y-5 mt-2">
          {/* Client */}
          <div>
            <label className="text-xs font-medium text-muted-foreground">Client *</label>
            <select
              value={clientId}
              onChange={(e) => setClientId(e.target.value)}
              className="mt-1 w-full h-9 px-3 rounded-lg border bg-card text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="">Select client...</option>
              {clients.map((c: any) => (
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
                <p className="text-xs text-muted-foreground">No service lines yet — click Add Line</p>
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
          <div className="flex gap-4 text-[11px] text-muted-foreground">
            <span>Mon–Fri: <strong className="text-foreground">$60/hr</strong></span>
            <span>Saturday: <strong className="text-foreground">$90/hr</strong></span>
            <span>Sunday: <strong className="text-foreground">$120/hr</strong></span>
          </div>

          <button
            onClick={() => createMutation.mutate()}
            disabled={!clientId || lines.length === 0 || createMutation.isPending || !profile?.staff_id}
            className="w-full h-10 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {createMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            Create Invoice
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
