import { Loader2, Plus, Trash2, X, Copy, Calendar } from "lucide-react";
import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { perthToISO } from "@/lib/perth-time";
import { fullName } from "@/lib/display-names";
import { PrimaryButton } from "@/components/ui-kit";
import { getClientReadiness, getStaffReadiness } from "@/lib/compliance-gates";

interface ServiceEntry {
  id: string;
  staffId: string;
  date: string;
  startHour: string;
  endHour: string;
  notes: string;
}

interface ScheduleServiceDialogProps {
  open: boolean;
  onClose: () => void;
  clientId: string;
  clientName: string;
  client: Record<string, unknown>;
  defaultDate?: string;
  defaultHour?: number;
}

const createEntry = (date: string, hour: number): ServiceEntry => ({
  id: crypto.randomUUID(),
  staffId: "",
  date,
  startHour: `${String(hour).padStart(2, "0")}:00`,
  endHour: `${String(Math.min(hour + 2, 20)).padStart(2, "0")}:00`,
  notes: "",
});

export function ScheduleServiceDialog({
  open,
  onClose,
  clientId,
  clientName,
  client,
  defaultDate = new Date().toISOString().split("T")[0],
  defaultHour = 9,
}: ScheduleServiceDialogProps) {
  const queryClient = useQueryClient();
  const [entries, setEntries] = useState<ServiceEntry[]>([createEntry(defaultDate, defaultHour)]);

  // Fetch staff list
  const { data: staffList = [] } = useQuery({
    queryKey: ["staff-list"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("staff")
        .select("*")
        .eq("status", "active")
        .order("first_name");
      if (error) throw error;
      return data || [];
    },
  });

  const { data: complianceRecords = [] } = useQuery({
    queryKey: ["staff-compliance-for-scheduling"],
    queryFn: async () => {
      const { data, error } = await supabase.from("compliance_records").select("staff_id, record_type, status");
      if (error) throw error;
      return data || [];
    },
  });

  useEffect(() => {
    if (open) setEntries([createEntry(defaultDate, defaultHour)]);
  }, [open, defaultDate, defaultHour]);

  const mutation = useMutation({
    mutationFn: async (shifts: ServiceEntry[]) => {
      const clientReadiness = getClientReadiness(client);
      if (!clientReadiness.eligible) throw new Error(clientReadiness.reasons.join("; "));
      for (const shift of shifts) {
        const worker = staffList.find((staff: any) => staff.id === shift.staffId);
        const workerRecords = complianceRecords.filter((record: any) => record.staff_id === shift.staffId);
        const staffReadiness = getStaffReadiness(worker, workerRecords);
        if (!staffReadiness.eligible) throw new Error(staffReadiness.reasons.join("; "));
      }
      const rows = shifts.map((s) => ({
        staff_id: s.staffId,
        client_id: clientId,
        shift_date: s.date,
        start_time: perthToISO(s.date, s.startHour),
        end_time: perthToISO(s.date, s.endHour),
        notes: s.notes || null,
        status: "pending",
      }));
      const { error } = await supabase.from("timesheets").insert(rows);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success(`${entries.length} care visit${entries.length > 1 ? "s" : ""} scheduled!`);
      queryClient.invalidateQueries({ queryKey: ["roster-timesheets"] });
      queryClient.invalidateQueries({ queryKey: ["timesheets"] });
      queryClient.invalidateQueries({ queryKey: ["client-shifts", clientId] });
      onClose();
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const updateEntry = (id: string, patch: Partial<ServiceEntry>) => {
    setEntries((prev) => prev.map((e) => (e.id === id ? { ...e, ...patch } : e)));
  };

  const removeEntry = (id: string) => setEntries((prev) => prev.filter((e) => e.id !== id));
  const duplicateEntry = (entry: ServiceEntry) => setEntries((prev) => [...prev, { ...entry, id: crypto.randomUUID() }]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (entries.some((s) => !s.staffId)) {
      toast.error("Every care visit must have a support worker assigned");
      return;
    }
    mutation.mutate(entries);
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-lg max-h-[85vh] flex flex-col rounded-xl bg-card shadow-xl border border-border"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-5 border-b shrink-0">
          <div>
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-teal-500" />
              <h2 className="text-lg font-semibold text-card-foreground">Schedule Care Visit</h2>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              For {clientName} {entries.length > 1 && <span className="ml-1">({entries.length} visits)</span>}
            </p>
            <p className="text-[10px] text-muted-foreground mt-0.5">Times are in Perth AWST (UTC+8)</p>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">
          <div className="flex-1 min-h-0 overflow-y-auto p-5 space-y-4">
            {entries.map((entry, idx) => (
              <motion.div
                key={entry.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="border rounded-lg p-4 bg-slate-50 space-y-3"
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-slate-600">Visit {idx + 1}</span>
                  <div className="flex gap-1">
                    {entries.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeEntry(entry.id)}
                        className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                        title="Remove visit"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => duplicateEntry(entry)}
                      className="p-1.5 text-slate-400 hover:bg-slate-200 rounded-lg transition-colors"
                      title="Duplicate visit"
                    >
                      <Copy className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-medium text-slate-600 block mb-1.5">Date</label>
                    <input
                      type="date"
                      value={entry.date}
                      onChange={(e) => updateEntry(entry.id, { date: e.target.value })}
                      className="w-full h-9 px-3 rounded-lg border text-sm bg-white"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-slate-600 block mb-1.5">Support Worker</label>
                    <select
                      value={entry.staffId}
                      onChange={(e) => updateEntry(entry.id, { staffId: e.target.value })}
                      className="w-full h-9 px-3 rounded-lg border text-sm bg-white"
                      required
                    >
                      <option value="">Select worker...</option>
                      {staffList.map((staff: any) => (
                        <option key={staff.id} value={staff.id}>
                          {fullName(staff)}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-medium text-slate-600 block mb-1.5">Start Time</label>
                    <input
                      type="time"
                      value={entry.startHour}
                      onChange={(e) => updateEntry(entry.id, { startHour: e.target.value })}
                      className="w-full h-9 px-3 rounded-lg border text-sm bg-white"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-slate-600 block mb-1.5">End Time</label>
                    <input
                      type="time"
                      value={entry.endHour}
                      onChange={(e) => updateEntry(entry.id, { endHour: e.target.value })}
                      className="w-full h-9 px-3 rounded-lg border text-sm bg-white"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-medium text-slate-600 block mb-1.5">Notes (Optional)</label>
                  <textarea
                    value={entry.notes}
                    onChange={(e) => updateEntry(entry.id, { notes: e.target.value })}
                    placeholder="E.g., Support with personal care, medication reminders..."
                    className="w-full h-20 px-3 py-2 rounded-lg border text-sm bg-white resize-none"
                  />
                </div>
              </motion.div>
            ))}
          </div>

          <div className="border-t p-5 space-y-3 shrink-0">
            <button
              type="button"
              onClick={() => setEntries((prev) => [...prev, createEntry(defaultDate, defaultHour)])}
              className="w-full h-9 rounded-lg border border-teal-200 text-teal-600 hover:bg-teal-50 text-sm font-medium transition-colors flex items-center justify-center gap-2"
            >
              <Plus className="h-4 w-4" /> Add Another Visit
            </button>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 h-10 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 font-medium transition-colors"
              >
                Cancel
              </button>
              <PrimaryButton
                type="submit"
                disabled={mutation.isPending}
                className="flex-1"
              >
                {mutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" /> Scheduling...
                  </>
                ) : (
                  <>
                    <Calendar className="h-4 w-4" /> Schedule {entries.length} Visit{entries.length > 1 ? "s" : ""}
                  </>
                )}
              </PrimaryButton>
            </div>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
