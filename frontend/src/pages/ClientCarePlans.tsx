import { useState } from "react";
import { AppLayout } from "@/components/AppLayout";
import { motion, AnimatePresence } from "framer-motion";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Heart, FileText, Users, Clock, Plus, ChevronRight, User,
  Calendar, CheckCircle, Edit, Save, X, Loader2,
} from "lucide-react";
import { SearchInput, PrimaryButton, EmptyState } from "@/components/ui-kit";

// ─── Types ────────────────────────────────────────────────────────────────────
const SECTION_KEYS = ["about_me", "daily_living", "health", "communication", "goals", "support_network"] as const;
type SectionKey = typeof SECTION_KEYS[number];

const SECTIONS: { key: SectionKey; label: string; description: string; placeholder: string }[] = [
  { key: "about_me", label: "About Me", description: "Personal history, preferences, and what matters most", placeholder: "Describe the client's background, interests, and personal preferences..." },
  { key: "daily_living", label: "Daily Living", description: "Support needs for everyday activities", placeholder: "Detail the support needed for daily tasks such as personal care, meal prep, mobility..." },
  { key: "health", label: "Health & Medical", description: "Medical conditions, medications, and health goals", placeholder: "List medical conditions, current medications, health goals, and any restrictions..." },
  { key: "communication", label: "Communication", description: "How the client communicates and their preferences", placeholder: "Describe communication methods, preferences, AAC devices, language needs..." },
  { key: "goals", label: "Goals & Aspirations", description: "Short and long-term goals", placeholder: "List short-term and long-term goals, aspirations, and milestones..." },
  { key: "support_network", label: "Support Network", description: "Family, friends, and key contacts", placeholder: "Detail family members, carers, allied health, community connections..." },
];

type CarePlanData = Record<SectionKey, string>;

function parseCareData(notesStr: string | null): CarePlanData {
  if (!notesStr) return SECTION_KEYS.reduce((a, k) => ({ ...a, [k]: "" }), {} as CarePlanData);
  try {
    const parsed = JSON.parse(notesStr);
    if (parsed.__carePlan) return parsed.__carePlan;
  } catch {/* not JSON */}
  return SECTION_KEYS.reduce((a, k) => ({ ...a, [k]: "" }), {} as CarePlanData);
}

function buildNotesWithCarePlan(existingNotes: string | null, carePlan: CarePlanData): string {
  // We store care plan as JSON with a marker key, preserving any plain-text notes that existed
  try {
    const existing = existingNotes ? JSON.parse(existingNotes) : {};
    return JSON.stringify({ ...existing, __carePlan: carePlan });
  } catch {
    // Notes was plain text — wrap it
    return JSON.stringify({ __legacyNotes: existingNotes, __carePlan: carePlan });
  }
}

// ─── Section Editor ───────────────────────────────────────────────────────────
function SectionCard({
  section,
  value,
  onSave,
  isSaving,
}: {
  section: typeof SECTIONS[number];
  value: string;
  onSave: (key: SectionKey, text: string) => void;
  isSaving: boolean;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);

  function handleSave() {
    onSave(section.key, draft);
    setEditing(false);
  }

  function handleCancel() {
    setDraft(value);
    setEditing(false);
  }

  return (
    <div className="rounded-xl bg-white border border-border/50 hover:shadow-sm transition-shadow">
      <div className="flex items-start gap-3 p-3">
        <div className="h-8 w-8 rounded-lg bg-pink-100 flex items-center justify-center shrink-0 mt-0.5">
          <Heart className="h-4 w-4 text-pink-500" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <p className="font-medium text-foreground text-sm">{section.label}</p>
            {!editing && (
              <button
                onClick={() => { setDraft(value); setEditing(true); }}
                className="p-1 rounded-lg hover:bg-slate-100 text-muted-foreground hover:text-foreground transition-colors"
              >
                <Edit className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
          <p className="text-xs text-muted-foreground">{section.description}</p>

          <AnimatePresence mode="wait">
            {editing ? (
              <motion.div key="edit" initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="mt-2">
                <textarea
                  className="w-full text-xs rounded-lg border border-border/60 p-2 focus:outline-none focus:ring-2 focus:ring-pink-300 resize-none bg-slate-50"
                  rows={4}
                  value={draft}
                  onChange={e => setDraft(e.target.value)}
                  placeholder={section.placeholder}
                  autoFocus
                />
                <div className="flex gap-2 mt-2">
                  <button
                    onClick={handleSave}
                    disabled={isSaving}
                    className="flex items-center gap-1.5 text-xs font-semibold text-white bg-pink-500 hover:bg-pink-600 rounded-lg px-3 py-1.5 transition-colors disabled:opacity-60"
                  >
                    {isSaving ? <Loader2 className="h-3 w-3 animate-spin" /> : <Save className="h-3 w-3" />}
                    Save
                  </button>
                  <button
                    onClick={handleCancel}
                    className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg px-3 py-1.5 transition-colors"
                  >
                    <X className="h-3 w-3" /> Cancel
                  </button>
                </div>
              </motion.div>
            ) : (
              <motion.div key="view" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-1.5">
                {value ? (
                  <p className="text-xs text-foreground whitespace-pre-wrap leading-relaxed line-clamp-3">{value}</p>
                ) : (
                  <p className="text-xs text-muted-foreground italic">Not completed — tap edit to add</p>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function ClientCarePlans() {
  const [search, setSearch] = useState("");
  const [selectedClient, setSelectedClient] = useState<string | null>(null);
  const qc = useQueryClient();

  const { data: clientsData = [], isLoading } = useQuery({
    queryKey: ["clients-care-plans"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("clients")
        .select("id, first_name, last_name, preferred_name, funding_type, status, notes, updated_at")
        .order("first_name");
      if (error) throw error;
      return data;
    },
  });

  const filteredClients = clientsData.filter((c: any) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return c.first_name?.toLowerCase().includes(q) || c.last_name?.toLowerCase().includes(q);
  });

  // Count clients with any care plan data
  const completedCount = clientsData.filter((c: any) => {
    const cp = parseCareData(c.notes);
    return SECTION_KEYS.some(k => cp[k]?.trim());
  }).length;

  const saveMutation = useMutation({
    mutationFn: async ({ clientId, notes }: { clientId: string; notes: string }) => {
      const { error } = await supabase
        .from("clients")
        .update({ notes, updated_at: new Date().toISOString() })
        .eq("id", clientId);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["clients-care-plans"] });
    },
  });

  function handleSaveSection(clientId: string, currentNotes: string | null, key: SectionKey, text: string) {
    const existing = parseCareData(currentNotes);
    const updated = { ...existing, [key]: text };
    const newNotes = buildNotesWithCarePlan(currentNotes, updated);
    saveMutation.mutate({ clientId, notes: newNotes });
  }

  return (
    <AppLayout title="Care Plans">
      <div className="space-y-5">
        {/* Header Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Care Plans", value: clientsData.length, icon: Heart, cls: "icon-pink" },
            { label: "Completed", value: completedCount, icon: CheckCircle, cls: "icon-green" },
            { label: "Pending", value: clientsData.length - completedCount, icon: Clock, cls: "icon-orange" },
            { label: "Sections", value: SECTIONS.length, icon: FileText, cls: "icon-blue" },
          ].map((m, i) => (
            <motion.div key={m.label} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
              className="rounded-2xl bg-white border border-border/50 shadow-sm p-4 flex items-center gap-3">
              <div className={`h-10 w-10 rounded-xl flex items-center justify-center shrink-0 shadow-sm ${m.cls}`}>
                <m.icon className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="text-xl font-bold text-foreground">{m.value}</p>
                <p className="text-xs text-muted-foreground">{m.label}</p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Toolbar */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <SearchInput value={search} onChange={setSearch} placeholder="Search clients..." className="w-full sm:w-72" />
        </div>

        {/* Clients List */}
        <div className="bg-white rounded-2xl border border-border/50 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-border/50">
            <h3 className="font-semibold text-foreground">Client Care Plans</h3>
            <p className="text-xs text-muted-foreground mt-0.5">Expand a client to view and edit their care plan sections</p>
          </div>

          {isLoading ? (
            <div className="flex justify-center py-12">
              <div className="h-8 w-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : filteredClients.length === 0 ? (
            <EmptyState icon={<Users className="h-10 w-10 text-slate-300" />} title="No clients found" description="Add clients or adjust your search." />
          ) : (
            <div className="divide-y divide-border/50">
              {filteredClients.map((client: any) => {
                const carePlan = parseCareData(client.notes);
                const filledSections = SECTION_KEYS.filter(k => carePlan[k]?.trim()).length;
                const pct = Math.round((filledSections / SECTIONS.length) * 100);

                return (
                  <div key={client.id}>
                    <button
                      onClick={() => setSelectedClient(selectedClient === client.id ? null : client.id)}
                      className="w-full flex items-center justify-between p-4 hover:bg-slate-50 transition-colors text-left"
                    >
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full flex items-center justify-center text-white text-sm font-bold shrink-0"
                          style={{ background: "linear-gradient(135deg, #f472b6, #ec4899)" }}>
                          {client.first_name?.[0]}{client.last_name?.[0]}
                        </div>
                        <div>
                          <p className="font-semibold text-foreground">
                            {client.preferred_name || client.first_name} {client.last_name}
                          </p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <p className="text-xs text-muted-foreground">{client.funding_type || "NDIS"}</p>
                            <div className="flex items-center gap-1">
                              <div className="h-1.5 w-16 rounded-full bg-slate-100 overflow-hidden">
                                <div className="h-1.5 rounded-full bg-gradient-to-r from-pink-400 to-pink-500" style={{ width: `${pct}%` }} />
                              </div>
                              <span className="text-[10px] text-muted-foreground">{filledSections}/{SECTIONS.length}</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                          pct === 100 ? "bg-emerald-100 text-emerald-700" :
                          pct > 0 ? "bg-amber-100 text-amber-700" :
                          "bg-slate-100 text-slate-600"
                        }`}>
                          {pct === 100 ? "Complete" : pct > 0 ? "In Progress" : "Not Started"}
                        </span>
                        <ChevronRight className={`h-4 w-4 text-slate-400 transition-transform ${selectedClient === client.id ? "rotate-90" : ""}`} />
                      </div>
                    </button>

                    <AnimatePresence>
                      {selectedClient === client.id && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.2 }}
                          className="overflow-hidden"
                        >
                          <div className="bg-slate-50 border-t border-border/50 p-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                              {SECTIONS.map(section => (
                                <SectionCard
                                  key={section.key}
                                  section={section}
                                  value={carePlan[section.key]}
                                  onSave={(key, text) => handleSaveSection(client.id, client.notes, key, text)}
                                  isSaving={saveMutation.isPending}
                                />
                              ))}
                            </div>
                            <p className="text-[10px] text-muted-foreground mt-3">
                              Last updated: {new Date(client.updated_at).toLocaleDateString("en-AU", { day: "numeric", month: "short", year: "numeric" })}
                            </p>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
