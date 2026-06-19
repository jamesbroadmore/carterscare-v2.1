import { useState } from "react";
import { AppLayout } from "@/components/AppLayout";
import { motion, AnimatePresence } from "framer-motion";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  AlertTriangle, ShieldCheck, FileText, Users, ChevronRight,
  AlertCircle, CheckCircle, Clock, Flame, Heart, Activity, Edit, Save, X, Loader2,
} from "lucide-react";
import { SearchInput, PrimaryButton, EmptyState } from "@/components/ui-kit";

// ─── Types & constants ─────────────────────────────────────────────────────────
const RISK_LEVELS = ["low", "medium", "high", "critical"] as const;
type RiskLevel = typeof RISK_LEVELS[number];

const RISK_CATEGORIES = [
  { key: "falls", label: "Falls Risk", icon: Activity, color: "#f97316" },
  { key: "medication", label: "Medication Risk", icon: Heart, color: "#ef4444" },
  { key: "behavior", label: "Behavioral Risk", icon: AlertTriangle, color: "#a855f7" },
  { key: "environmental", label: "Environmental", icon: Flame, color: "#eab308" },
  { key: "health", label: "Health Risk", icon: Activity, color: "#ec4899" },
  { key: "communication", label: "Communication", icon: FileText, color: "#3b82f6" },
] as const;

type RiskCategoryKey = typeof RISK_CATEGORIES[number]["key"];

const SAFETY_PLAN_SECTIONS = [
  "Emergency Contacts",
  "Medical Alerts",
  "Behavioral Strategies",
  "Environmental Modifications",
  "Supervision Requirements",
  "Communication Protocols",
];

type RiskData = {
  ratings: Partial<Record<RiskCategoryKey, RiskLevel>>;
  notes: Partial<Record<RiskCategoryKey, string>>;
  safety: Partial<Record<string, string>>;
  lastAssessed?: string;
};

function parseRiskData(raw: string | null): RiskData {
  if (!raw) return { ratings: {}, notes: {}, safety: {} };
  try {
    const parsed = JSON.parse(raw);
    if (parsed.__riskData) return parsed.__riskData;
  } catch {/* plain text */}
  return { ratings: {}, notes: {}, safety: {} };
}

function buildRiskField(existing: string | null, riskData: RiskData): string {
  try {
    const existingObj = existing ? JSON.parse(existing) : {};
    return JSON.stringify({ ...existingObj, __riskData: riskData });
  } catch {
    return JSON.stringify({ __legacyRisk: existing, __riskData: riskData });
  }
}

function getLevelColors(level: RiskLevel | undefined) {
  switch (level) {
    case "critical": return { bg: "bg-red-100", text: "text-red-700", border: "border-red-300", bar: "#ef4444" };
    case "high": return { bg: "bg-orange-100", text: "text-orange-700", border: "border-orange-300", bar: "#f97316" };
    case "medium": return { bg: "bg-yellow-100", text: "text-yellow-700", border: "border-yellow-300", bar: "#eab308" };
    case "low": return { bg: "bg-emerald-100", text: "text-emerald-700", border: "border-emerald-300", bar: "#22c55e" };
    default: return { bg: "bg-slate-100", text: "text-slate-500", border: "border-slate-200", bar: "#94a3b8" };
  }
}

function getOverallRisk(ratings: Partial<Record<RiskCategoryKey, RiskLevel>>): RiskLevel | "unassessed" {
  const values = Object.values(ratings);
  if (!values.length) return "unassessed";
  if (values.includes("critical")) return "critical";
  if (values.includes("high")) return "high";
  if (values.includes("medium")) return "medium";
  return "low";
}

// ─── Risk Category Row ─────────────────────────────────────────────────────────
function RiskCategoryRow({
  cat,
  level,
  note,
  onSave,
  isSaving,
}: {
  cat: typeof RISK_CATEGORIES[number];
  level: RiskLevel | undefined;
  note: string;
  onSave: (key: RiskCategoryKey, level: RiskLevel, note: string) => void;
  isSaving: boolean;
}) {
  const [editing, setEditing] = useState(false);
  const [draftLevel, setDraftLevel] = useState<RiskLevel>(level || "low");
  const [draftNote, setDraftNote] = useState(note);
  const colors = getLevelColors(level);

  function handleSave() {
    onSave(cat.key, draftLevel, draftNote);
    setEditing(false);
  }

  return (
    <div className={`rounded-xl border p-3 transition-all ${editing ? "border-purple-300 bg-purple-50/30" : "border-border/50 bg-white"}`}>
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <div className="h-7 w-7 rounded-lg flex items-center justify-center shrink-0" style={{ background: cat.color + "20" }}>
            <cat.icon className="h-3.5 w-3.5" style={{ color: cat.color }} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-foreground">{cat.label}</p>
            {!editing && note && <p className="text-[10px] text-muted-foreground truncate mt-0.5">{note}</p>}
            {!editing && !note && !level && <p className="text-[10px] text-muted-foreground italic">Not assessed</p>}
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {level && !editing && (
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full capitalize ${colors.bg} ${colors.text}`}>{level}</span>
          )}
          {!editing && (
            <button onClick={() => { setDraftLevel(level || "low"); setDraftNote(note); setEditing(true); }}
              className="p-1 rounded-lg hover:bg-slate-100 text-muted-foreground hover:text-foreground transition-colors">
              <Edit className="h-3 w-3" />
            </button>
          )}
        </div>
      </div>

      <AnimatePresence>
        {editing && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="mt-3 space-y-2">
            {/* Level selector */}
            <div className="flex gap-1.5 flex-wrap">
              {RISK_LEVELS.map(lvl => {
                const c = getLevelColors(lvl);
                return (
                  <button key={lvl}
                    onClick={() => setDraftLevel(lvl)}
                    className={`text-[10px] font-bold px-2.5 py-1 rounded-full capitalize border transition-all ${draftLevel === lvl ? `${c.bg} ${c.text} ${c.border} ring-1 ring-offset-1 ring-current` : "bg-slate-100 text-slate-500 border-slate-200"}`}>
                    {lvl}
                  </button>
                );
              })}
            </div>
            {/* Notes */}
            <textarea
              className="w-full text-xs rounded-lg border border-border/60 p-2 focus:outline-none focus:ring-2 focus:ring-purple-300 resize-none bg-white"
              rows={2}
              value={draftNote}
              onChange={e => setDraftNote(e.target.value)}
              placeholder="Add notes, strategies or observations..."
            />
            <div className="flex gap-2">
              <button onClick={handleSave} disabled={isSaving}
                className="flex items-center gap-1 text-[10px] font-semibold text-white bg-purple-500 hover:bg-purple-600 rounded-lg px-2.5 py-1.5 transition-colors disabled:opacity-60">
                {isSaving ? <Loader2 className="h-3 w-3 animate-spin" /> : <Save className="h-3 w-3" />} Save
              </button>
              <button onClick={() => setEditing(false)}
                className="flex items-center gap-1 text-[10px] font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg px-2.5 py-1.5 transition-colors">
                <X className="h-3 w-3" /> Cancel
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Safety plan section editor ────────────────────────────────────────────────
function SafetySection({
  label,
  value,
  onSave,
  isSaving,
}: {
  label: string;
  value: string;
  onSave: (label: string, text: string) => void;
  isSaving: boolean;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);

  return (
    <div className={`rounded-xl border p-3 transition-all ${editing ? "border-orange-300 bg-orange-50/20" : "border-border/50 bg-white"}`}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <ShieldCheck className="h-4 w-4 text-emerald-500 shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground">{label}</p>
            {!editing && (
              value
                ? <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{value}</p>
                : <p className="text-xs text-muted-foreground italic">Not documented</p>
            )}
          </div>
        </div>
        {!editing && (
          <button onClick={() => { setDraft(value); setEditing(true); }}
            className="p-1 rounded-lg hover:bg-slate-100 text-muted-foreground hover:text-foreground transition-colors shrink-0">
            <Edit className="h-3.5 w-3.5" />
          </button>
        )}
      </div>
      <AnimatePresence>
        {editing && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="mt-2 space-y-2">
            <textarea
              className="w-full text-xs rounded-lg border border-border/60 p-2 focus:outline-none focus:ring-2 focus:ring-orange-300 resize-none bg-white"
              rows={3}
              value={draft}
              onChange={e => setDraft(e.target.value)}
              placeholder={`Document ${label.toLowerCase()}...`}
              autoFocus
            />
            <div className="flex gap-2">
              <button onClick={() => { onSave(label, draft); setEditing(false); }} disabled={isSaving}
                className="flex items-center gap-1 text-[10px] font-semibold text-white bg-orange-500 hover:bg-orange-600 rounded-lg px-2.5 py-1.5 transition-colors disabled:opacity-60">
                {isSaving ? <Loader2 className="h-3 w-3 animate-spin" /> : <Save className="h-3 w-3" />} Save
              </button>
              <button onClick={() => setEditing(false)}
                className="flex items-center gap-1 text-[10px] font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg px-2.5 py-1.5 transition-colors">
                <X className="h-3 w-3" /> Cancel
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Main page ─────────────────────────────────────────────────────────────────
export default function ClientRisk() {
  const [search, setSearch] = useState("");
  const [selectedClient, setSelectedClient] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"assessments" | "safety">("assessments");
  const qc = useQueryClient();

  const { data: clientsData = [], isLoading } = useQuery({
    queryKey: ["clients-risk"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("clients")
        .select("id, first_name, last_name, preferred_name, status, risk_assessment, updated_at")
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

  const saveMutation = useMutation({
    mutationFn: async ({ clientId, risk_assessment }: { clientId: string; risk_assessment: string }) => {
      const { error } = await supabase
        .from("clients")
        .update({ risk_assessment, updated_at: new Date().toISOString() })
        .eq("id", clientId);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["clients-risk"] });
    },
  });

  function handleSaveRating(client: any, key: RiskCategoryKey, level: RiskLevel, note: string) {
    const rd = parseRiskData(client.risk_assessment);
    rd.ratings[key] = level;
    rd.notes[key] = note;
    rd.lastAssessed = new Date().toISOString();
    saveMutation.mutate({ clientId: client.id, risk_assessment: buildRiskField(client.risk_assessment, rd) });
  }

  function handleSaveSafety(client: any, label: string, text: string) {
    const rd = parseRiskData(client.risk_assessment);
    rd.safety[label] = text;
    rd.lastAssessed = new Date().toISOString();
    saveMutation.mutate({ clientId: client.id, risk_assessment: buildRiskField(client.risk_assessment, rd) });
  }

  // Stats
  const clientsWithOverall = clientsData.map((c: any) => ({
    ...c,
    _overall: getOverallRisk(parseRiskData(c.risk_assessment).ratings),
  }));
  const highCount = clientsWithOverall.filter((c: any) => c._overall === "high" || c._overall === "critical").length;
  const medCount = clientsWithOverall.filter((c: any) => c._overall === "medium").length;
  const lowCount = clientsWithOverall.filter((c: any) => c._overall === "low").length;

  return (
    <AppLayout title="Risk Management & Safety">
      <div className="space-y-5">
        {/* Header Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Total Clients", value: clientsData.length, icon: Users, gradient: "linear-gradient(135deg, #2dd4bf, #14b8a6)" },
            { label: "High Risk", value: highCount, icon: AlertTriangle, gradient: "linear-gradient(135deg, #f87171, #ef4444)" },
            { label: "Medium Risk", value: medCount, icon: AlertCircle, gradient: "linear-gradient(135deg, #fb923c, #f97316)" },
            { label: "Low Risk", value: lowCount, icon: ShieldCheck, gradient: "linear-gradient(135deg, #4ade80, #22c55e)" },
          ].map((m, i) => (
            <motion.div key={m.label} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
              className="rounded-2xl bg-white border border-border/50 shadow-sm p-4 flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl flex items-center justify-center shrink-0 shadow-sm" style={{ background: m.gradient }}>
                <m.icon className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="text-xl font-bold text-foreground">{m.value}</p>
                <p className="text-xs text-muted-foreground">{m.label}</p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex gap-2">
          {(["assessments", "safety"] as const).map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-xl text-sm font-semibold transition-colors ${
                activeTab === tab ? "bg-purple-100 text-purple-700" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}>
              {tab === "assessments" ? "Risk Assessments" : "Safety Plans"}
            </button>
          ))}
        </div>

        {/* Toolbar */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <SearchInput value={search} onChange={setSearch} placeholder="Search clients..." className="w-full sm:w-72" />
        </div>

        {/* Clients List */}
        <div className="bg-white rounded-2xl border border-border/50 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-border/50">
            <h3 className="font-semibold text-foreground">
              {activeTab === "assessments" ? "Client Risk Assessments" : "Client Safety Plans"}
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              {activeTab === "assessments" ? "Rate each risk category and add notes" : "Document safety plans and protocols"}
            </p>
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
                const rd = parseRiskData(client.risk_assessment);
                const overall = getOverallRisk(rd.ratings);
                const overallColors = getLevelColors(overall === "unassessed" ? undefined : overall);
                const assessedCount = Object.keys(rd.ratings).length;

                return (
                  <div key={client.id}>
                    <button
                      onClick={() => setSelectedClient(selectedClient === client.id ? null : client.id)}
                      className="w-full flex items-center justify-between p-4 hover:bg-slate-50 transition-colors text-left"
                    >
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full flex items-center justify-center text-white text-sm font-bold shrink-0"
                          style={{ background: "linear-gradient(135deg, #fb923c, #f97316)" }}>
                          {client.first_name?.[0]}{client.last_name?.[0]}
                        </div>
                        <div>
                          <p className="font-semibold text-foreground">
                            {client.preferred_name || client.first_name} {client.last_name}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {assessedCount === 0 ? "Not yet assessed" : `${assessedCount}/${RISK_CATEGORIES.length} categories rated`}
                            {rd.lastAssessed && ` · ${new Date(rd.lastAssessed).toLocaleDateString("en-AU")}`}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full capitalize ${
                          overall === "unassessed" ? "bg-slate-100 text-slate-500" : `${overallColors.bg} ${overallColors.text}`
                        }`}>
                          {overall === "unassessed" ? "Unassessed" : `${overall} Risk`}
                        </span>
                        <ChevronRight className={`h-4 w-4 text-slate-400 transition-transform ${selectedClient === client.id ? "rotate-90" : ""}`} />
                      </div>
                    </button>

                    <AnimatePresence>
                      {selectedClient === client.id && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.2 }} className="overflow-hidden"
                        >
                          <div className="bg-slate-50 border-t border-border/50 p-4">
                            {activeTab === "assessments" ? (
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                {RISK_CATEGORIES.map(cat => (
                                  <RiskCategoryRow
                                    key={cat.key}
                                    cat={cat}
                                    level={rd.ratings[cat.key]}
                                    note={rd.notes[cat.key] || ""}
                                    onSave={(key, level, note) => handleSaveRating(client, key, level, note)}
                                    isSaving={saveMutation.isPending}
                                  />
                                ))}
                              </div>
                            ) : (
                              <div className="space-y-2">
                                {SAFETY_PLAN_SECTIONS.map(section => (
                                  <SafetySection
                                    key={section}
                                    label={section}
                                    value={rd.safety[section] || ""}
                                    onSave={(label, text) => handleSaveSafety(client, label, text)}
                                    isSaving={saveMutation.isPending}
                                  />
                                ))}
                              </div>
                            )}
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
