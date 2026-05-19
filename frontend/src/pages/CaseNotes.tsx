import { useState } from "react";
import { AppLayout } from "@/components/AppLayout";
import { Plus, FileText, Loader2, Lock, CheckCircle2, Wand2, ChevronDown, ChevronRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { fullName } from "@/lib/display-names";
import { format } from "date-fns";

const CATEGORIES = [
  { value: "general", label: "General" },
  { value: "personal_care", label: "Personal Care" },
  { value: "community_access", label: "Community Access" },
  { value: "behaviour", label: "Behaviour" },
  { value: "medication", label: "Medication" },
  { value: "health", label: "Health" },
  { value: "skill_development", label: "Skill Development" },
  { value: "other", label: "Other" },
];

const CATEGORY_COLORS: Record<string, string> = {
  general: "bg-slate-100 text-slate-600",
  personal_care: "bg-pink-100 text-pink-700",
  community_access: "bg-teal-100 text-teal-700",
  behaviour: "bg-orange-100 text-orange-700",
  medication: "bg-red-100 text-red-700",
  health: "bg-blue-100 text-blue-700",
  skill_development: "bg-purple-100 text-purple-700",
  other: "bg-gray-100 text-gray-600",
};

// ── Note Templates ────────────────────────────────────────────────────────────
// Each template has prompts (checked by worker) + a generator function
interface TemplateOption {
  id: string;
  label: string;
  description: string;
  category: string;
  prompts: TemplatePrompt[];
}

interface TemplatePrompt {
  id: string;
  label: string;
  defaultChecked?: boolean;
  detail?: string; // optional freetext detail prompt shown when checked
}

const NOTE_TEMPLATES: TemplateOption[] = [
  {
    id: "personal_care",
    label: "Personal Care",
    description: "Hygiene, grooming, dressing",
    category: "personal_care",
    prompts: [
      { id: "shower", label: "Showered / bathed", defaultChecked: true },
      { id: "hair", label: "Hair washed and groomed" },
      { id: "oral", label: "Oral hygiene completed" },
      { id: "dressed", label: "Assisted with dressing", defaultChecked: true },
      { id: "skin", label: "Skin check performed — no concerns", detail: "Any concerns noted?" },
      { id: "continence", label: "Continence care provided" },
      { id: "mood_good", label: "Client was cooperative and in good mood", defaultChecked: true },
      { id: "mood_difficult", label: "Client showed resistance or distress", detail: "Describe briefly" },
    ],
  },
  {
    id: "community_access",
    label: "Community Access",
    description: "Outings, errands, social activities",
    category: "community_access",
    prompts: [
      { id: "left_home", label: "Left home for community activity", defaultChecked: true },
      { id: "transport", label: "Transport provided by worker" },
      { id: "shopping", label: "Assisted with shopping or errands" },
      { id: "social", label: "Participated in social activity", detail: "Where / what activity?" },
      { id: "returned_safely", label: "Returned home safely", defaultChecked: true },
      { id: "client_engaged", label: "Client was engaged and enthusiastic" },
      { id: "incident", label: "Incident or concern occurred during outing", detail: "Brief description" },
    ],
  },
  {
    id: "medication",
    label: "Medication",
    description: "Administration and monitoring",
    category: "medication",
    prompts: [
      { id: "administered", label: "Medication administered as per care plan", defaultChecked: true },
      { id: "refused", label: "Client refused medication", detail: "Which medication?" },
      { id: "side_effects", label: "Side effects observed", detail: "Describe" },
      { id: "witnessed", label: "Administration witnessed by client" },
      { id: "recorded_mar", label: "Recorded in MAR" },
      { id: "stock_ok", label: "Medication stock checked — sufficient supply" },
      { id: "reorder", label: "Medication reorder required", detail: "What medication?" },
    ],
  },
  {
    id: "daily_living",
    label: "Daily Living",
    description: "Meals, home tasks, routine support",
    category: "general",
    prompts: [
      { id: "breakfast", label: "Assisted with / prepared breakfast" },
      { id: "lunch", label: "Assisted with / prepared lunch" },
      { id: "dinner", label: "Assisted with / prepared dinner" },
      { id: "ate_well", label: "Client ate well", defaultChecked: true },
      { id: "ate_poorly", label: "Client had limited appetite", detail: "Reason if known" },
      { id: "cleaning", label: "Assisted with light cleaning / domestic tasks" },
      { id: "laundry", label: "Laundry completed" },
      { id: "safe_home", label: "Home environment safe and tidy", defaultChecked: true },
    ],
  },
  {
    id: "health",
    label: "Health & Wellbeing",
    description: "Obs, appointments, concerns",
    category: "health",
    prompts: [
      { id: "vitals", label: "Vital signs monitored — within normal range" },
      { id: "vitals_concern", label: "Vital sign concern noted", detail: "What was observed?" },
      { id: "appointment", label: "Attended medical / allied health appointment", detail: "Type of appointment" },
      { id: "pain", label: "Client reported pain or discomfort", detail: "Location and level (1-10)" },
      { id: "no_concerns", label: "No health concerns observed during shift", defaultChecked: true },
      { id: "fall", label: "Fall or near-miss occurred", detail: "Brief description" },
      { id: "gp_contact", label: "GP or medical contact required" },
    ],
  },
  {
    id: "behaviour",
    label: "Behaviour Support",
    description: "Behaviours of concern, strategies used",
    category: "behaviour",
    prompts: [
      { id: "calm", label: "Client calm throughout shift", defaultChecked: true },
      { id: "verbal", label: "Verbal aggression / distress observed", detail: "Briefly describe triggers and response" },
      { id: "physical", label: "Physical behaviour of concern observed", detail: "Briefly describe" },
      { id: "strategy", label: "Behaviour support strategy implemented", detail: "Which strategy?" },
      { id: "deescalated", label: "Situation de-escalated successfully" },
      { id: "bsp_followed", label: "BSP followed throughout" },
      { id: "family_notified", label: "Family / guardian notified" },
      { id: "incident_report", label: "Incident report completed" },
    ],
  },
];

// ── Note generator ────────────────────────────────────────────────────────────
function generateNoteFromTemplate(
  template: TemplateOption,
  checked: Set<string>,
  details: Record<string, string>,
  clientName: string,
  workerName: string,
): string {
  const selected = template.prompts.filter(p => checked.has(p.id));
  if (selected.length === 0) return "";

  const lines: string[] = [];

  // Intro line
  lines.push(`Support provided to ${clientName} during today's shift.`);
  lines.push("");

  // Group positives and concerns
  const positives = selected.filter(p =>
    !["mood_difficult", "incident", "refused", "side_effects", "reorder",
      "vitals_concern", "pain", "fall", "gp_contact", "verbal", "physical",
      "ate_poorly", "family_notified", "incident_report"].includes(p.id)
  );
  const concerns = selected.filter(p =>
    ["mood_difficult", "incident", "refused", "side_effects", "reorder",
      "vitals_concern", "pain", "fall", "gp_contact", "verbal", "physical",
      "ate_poorly", "family_notified", "incident_report"].includes(p.id)
  );

  if (positives.length > 0) {
    positives.forEach(p => {
      const detail = details[p.id] ? ` — ${details[p.id]}` : "";
      lines.push(`• ${p.label}${detail}.`);
    });
  }

  if (concerns.length > 0) {
    lines.push("");
    lines.push("Concerns / follow-up:");
    concerns.forEach(p => {
      const detail = details[p.id] ? ` — ${details[p.id]}` : "";
      lines.push(`• ${p.label}${detail}.`);
    });
  }

  lines.push("");
  lines.push(`Note recorded by ${workerName}.`);

  return lines.join("\n");
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function getNowLocal() {
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}T${pad(now.getHours())}:${pad(now.getMinutes())}`;
}

// ── Main Component ─────────────────────────────────────────────────────────────
export default function CaseNotes() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [submitted, setSubmitted] = useState(false);

  // Template flow
  const [selectedTemplate, setSelectedTemplate] = useState<TemplateOption | null>(null);
  const [checkedPrompts, setCheckedPrompts] = useState<Set<string>>(new Set());
  const [promptDetails, setPromptDetails] = useState<Record<string, string>>({});
  const [templateStep, setTemplateStep] = useState<"pick" | "fill" | null>(null);

  const { data: clientList = [] } = useQuery({
    queryKey: ["client-list-notes"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("clients")
        .select("id, first_name, last_name, preferred_name")
        .eq("status", "active")
        .order("first_name");
      if (error) throw error;
      return data;
    },
  });

  const { data: staffList = [] } = useQuery({
    queryKey: ["staff-list-notes"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("staff")
        .select("id, first_name, last_name, preferred_name")
        .eq("status", "active")
        .order("first_name");
      if (error) throw error;
      return data;
    },
  });

  const [form, setForm] = useState({
    client_id: "",
    staff_id: "",
    note_date: getNowLocal(),
    category: "general",
    content: "",
    is_confidential: false,
  });

  const mutation = useMutation({
    mutationFn: async () => {
      if (!form.client_id) throw new Error("Please select a client");
      if (!form.staff_id) throw new Error("Please select a support worker");
      if (!form.note_date) throw new Error("Please set a date and time");
      if (!form.content.trim()) throw new Error("Note content is required");
      const { error } = await supabase.from("case_notes").insert({
        client_id: form.client_id,
        staff_id: form.staff_id,
        note_date: new Date(form.note_date).toISOString(),
        category: form.category,
        content: form.content.trim(),
        is_confidential: form.is_confidential,
        created_by: user?.id,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["case-notes"] });
      queryClient.invalidateQueries({ queryKey: ["client-notes"] });
      setSubmitted(true);
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const handleReset = () => {
    setForm({
      client_id: "",
      staff_id: "",
      note_date: getNowLocal(),
      category: "general",
      content: "",
      is_confidential: false,
    });
    setSubmitted(false);
    setSelectedTemplate(null);
    setCheckedPrompts(new Set());
    setPromptDetails({});
    setTemplateStep(null);
  };

  // When a template is chosen, pre-check defaults
  const pickTemplate = (t: TemplateOption) => {
    setSelectedTemplate(t);
    const defaults = new Set(t.prompts.filter(p => p.defaultChecked).map(p => p.id));
    setCheckedPrompts(defaults);
    setPromptDetails({});
    setForm(f => ({ ...f, category: t.category }));
    setTemplateStep("fill");
  };

  const togglePrompt = (id: string) => {
    setCheckedPrompts(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // Generate note content from template selections
  const applyTemplate = () => {
    if (!selectedTemplate) return;
    const client = clientList.find((c: any) => c.id === form.client_id);
    const worker = staffList.find((s: any) => s.id === form.staff_id);
    const clientName = client ? fullName(client) : "the client";
    const workerName = worker ? fullName(worker) : "Support Worker";
    const generated = generateNoteFromTemplate(selectedTemplate, checkedPrompts, promptDetails, clientName, workerName);
    setForm(f => ({ ...f, content: generated }));
    setTemplateStep(null);
  };

  return (
    <AppLayout title="Case Notes">
      <div className="max-w-2xl mx-auto">
        <AnimatePresence mode="wait">
          {submitted ? (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl border border-border/50 shadow-sm p-10 flex flex-col items-center text-center gap-4"
            >
              <div className="h-16 w-16 rounded-full bg-green-50 flex items-center justify-center">
                <CheckCircle2 className="h-8 w-8 text-green-500" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-800">Note saved</h2>
                <p className="text-sm text-slate-500 mt-1">
                  Filed to the client's card. Immutable after 1 hour.
                </p>
              </div>
              <button
                onClick={handleReset}
                className="mt-2 h-10 px-6 rounded-xl text-white text-sm font-semibold shadow-md hover:opacity-90 transition-opacity"
                style={{ background: "linear-gradient(135deg, #60a5fa, #3b82f6)" }}
              >
                <Plus className="h-4 w-4 inline mr-1.5" />
                New Note
              </button>
            </motion.div>
          ) : (
            <motion.div
              key="form"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="space-y-4"
            >
              {/* Template Picker Modal overlay */}
              <AnimatePresence>
                {templateStep === "pick" && (
                  <motion.div
                    key="template-pick"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    className="bg-white rounded-2xl border border-border/50 shadow-sm overflow-hidden"
                  >
                    <div className="px-6 py-4 border-b border-border/40 flex items-center gap-3"
                      style={{ background: "linear-gradient(90deg, #a78bfa22, #8b5cf611)" }}>
                      <div className="h-9 w-9 rounded-xl flex items-center justify-center"
                        style={{ background: "linear-gradient(135deg, #a78bfa, #8b5cf6)" }}>
                        <Wand2 className="h-4 w-4 text-white" />
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-slate-800">Choose a Note Template</h3>
                        <p className="text-xs text-slate-500">Select the type of support to pre-fill the note</p>
                      </div>
                      <button
                        onClick={() => setTemplateStep(null)}
                        className="ml-auto text-xs text-slate-400 hover:text-slate-600 px-3 py-1.5 rounded-lg hover:bg-slate-100"
                      >
                        Cancel
                      </button>
                    </div>
                    <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {NOTE_TEMPLATES.map(t => (
                        <button
                          key={t.id}
                          onClick={() => pickTemplate(t)}
                          className="text-left p-4 rounded-xl border border-border hover:border-purple-300 hover:bg-purple-50/50 transition-all group"
                        >
                          <p className="text-sm font-semibold text-slate-800 group-hover:text-purple-700">{t.label}</p>
                          <p className="text-xs text-slate-500 mt-0.5">{t.description}</p>
                        </button>
                      ))}
                      <button
                        onClick={() => setTemplateStep(null)}
                        className="text-left p-4 rounded-xl border border-dashed border-slate-200 hover:border-slate-400 transition-all text-sm text-slate-500"
                      >
                        Write manually — no template
                      </button>
                    </div>
                  </motion.div>
                )}

                {templateStep === "fill" && selectedTemplate && (
                  <motion.div
                    key="template-fill"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    className="bg-white rounded-2xl border border-purple-200 shadow-sm overflow-hidden"
                  >
                    <div className="px-6 py-4 border-b border-purple-100 flex items-center gap-3"
                      style={{ background: "linear-gradient(90deg, #a78bfa22, #8b5cf611)" }}>
                      <div className="h-9 w-9 rounded-xl flex items-center justify-center"
                        style={{ background: "linear-gradient(135deg, #a78bfa, #8b5cf6)" }}>
                        <Wand2 className="h-4 w-4 text-white" />
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-slate-800">{selectedTemplate.label} Template</h3>
                        <p className="text-xs text-slate-500">Tick what applies — a note will be generated</p>
                      </div>
                      <button
                        onClick={() => setTemplateStep("pick")}
                        className="ml-auto text-xs text-slate-400 hover:text-slate-600 px-3 py-1.5 rounded-lg hover:bg-slate-100"
                      >
                        ← Change
                      </button>
                    </div>

                    <div className="p-5 space-y-3">
                      {selectedTemplate.prompts.map(p => (
                        <div key={p.id} className="space-y-1.5">
                          <label className="flex items-center gap-3 cursor-pointer group">
                            <input
                              type="checkbox"
                              checked={checkedPrompts.has(p.id)}
                              onChange={() => togglePrompt(p.id)}
                              className="h-4 w-4 rounded border-slate-300 text-purple-500 focus:ring-purple-400"
                            />
                            <span className={`text-sm font-medium transition-colors ${checkedPrompts.has(p.id) ? "text-slate-800" : "text-slate-500"}`}>
                              {p.label}
                            </span>
                          </label>
                          {/* Detail input when checked and has a detail prompt */}
                          {checkedPrompts.has(p.id) && p.detail && (
                            <div className="ml-7">
                              <input
                                type="text"
                                placeholder={p.detail}
                                value={promptDetails[p.id] || ""}
                                onChange={e => setPromptDetails(prev => ({ ...prev, [p.id]: e.target.value }))}
                                className="w-full h-8 rounded-lg border border-purple-200 bg-purple-50/50 px-3 text-xs focus:outline-none focus:ring-2 focus:ring-purple-300"
                              />
                            </div>
                          )}
                        </div>
                      ))}
                    </div>

                    <div className="px-5 pb-5 flex gap-2">
                      <button
                        onClick={applyTemplate}
                        className="flex-1 h-10 rounded-xl text-white text-sm font-bold flex items-center justify-center gap-2 hover:opacity-90 transition-opacity shadow-md"
                        style={{ background: "linear-gradient(135deg, #a78bfa, #8b5cf6)" }}
                      >
                        <Wand2 className="h-4 w-4" />
                        Generate Note
                      </button>
                      <button
                        onClick={() => setTemplateStep(null)}
                        className="h-10 px-4 rounded-xl border text-sm font-medium text-slate-600 hover:bg-slate-50"
                      >
                        Cancel
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Main form — only shown when not in template flow */}
              {!templateStep && (
                <div className="bg-white rounded-2xl border border-border/50 shadow-sm overflow-hidden">
                  {/* Header */}
                  <div className="px-6 py-5 border-b border-border/50 flex items-center gap-3"
                    style={{ background: "linear-gradient(90deg, #60a5fa22, #3b82f611)" }}>
                    <div className="h-10 w-10 rounded-xl flex items-center justify-center shadow-sm"
                      style={{ background: "linear-gradient(135deg, #60a5fa, #3b82f6)" }}>
                      <FileText className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <h2 className="text-base font-bold text-slate-800">New Case Note</h2>
                      <p className="text-xs text-slate-500">Saved to the client's card, visible based on role</p>
                    </div>
                    {/* Template button */}
                    <button
                      type="button"
                      onClick={() => setTemplateStep("pick")}
                      className="ml-auto flex items-center gap-1.5 h-8 px-3 rounded-lg text-xs font-semibold text-purple-700 bg-purple-50 hover:bg-purple-100 border border-purple-200 transition-colors"
                    >
                      <Wand2 className="h-3.5 w-3.5" />
                      Use Template
                    </button>
                  </div>

                  <form
                    onSubmit={(e) => { e.preventDefault(); mutation.mutate(); }}
                    className="p-6 space-y-5"
                  >
                    {/* Date & Time */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                        Date & Time <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="datetime-local"
                        value={form.note_date}
                        onChange={(e) => setForm({ ...form, note_date: e.target.value })}
                        required
                        className="w-full h-10 rounded-xl border border-border px-3 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-200"
                      />
                    </div>

                    {/* Client */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                        Client <span className="text-red-500">*</span>
                      </label>
                      <select
                        value={form.client_id}
                        onChange={(e) => setForm({ ...form, client_id: e.target.value })}
                        required
                        className="w-full h-10 rounded-xl border border-border px-3 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-200"
                      >
                        <option value="">Select client...</option>
                        {clientList.map((c: any) => (
                          <option key={c.id} value={c.id}>
                            {c.preferred_name ? `${c.preferred_name} ${c.last_name}` : `${c.first_name} ${c.last_name}`}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Support Worker */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                        Support Worker <span className="text-red-500">*</span>
                      </label>
                      <select
                        value={form.staff_id}
                        onChange={(e) => setForm({ ...form, staff_id: e.target.value })}
                        required
                        className="w-full h-10 rounded-xl border border-border px-3 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-200"
                      >
                        <option value="">Select support worker...</option>
                        {staffList.map((s: any) => (
                          <option key={s.id} value={s.id}>
                            {s.preferred_name ? `${s.preferred_name} ${s.last_name}` : `${s.first_name} ${s.last_name}`}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Category */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1.5">Category</label>
                      <select
                        value={form.category}
                        onChange={(e) => setForm({ ...form, category: e.target.value })}
                        className="w-full h-10 rounded-xl border border-border px-3 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-200"
                      >
                        {CATEGORIES.map((c) => (
                          <option key={c.value} value={c.value}>{c.label}</option>
                        ))}
                      </select>
                      {form.category && (
                        <span className={`inline-block mt-1.5 text-[11px] font-semibold px-2 py-0.5 rounded-full capitalize ${CATEGORY_COLORS[form.category] || "bg-slate-100 text-slate-600"}`}>
                          {form.category.replace(/_/g, " ")}
                        </span>
                      )}
                    </div>

                    {/* Note Content */}
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="block text-xs font-semibold text-slate-600">
                          Note <span className="text-red-500">*</span>
                        </label>
                        {form.content && selectedTemplate && (
                          <button
                            type="button"
                            onClick={() => setTemplateStep("fill")}
                            className="text-[11px] text-purple-600 hover:text-purple-800 font-medium flex items-center gap-1"
                          >
                            <Wand2 className="h-3 w-3" /> Regenerate from template
                          </button>
                        )}
                      </div>
                      <textarea
                        value={form.content}
                        onChange={(e) => setForm({ ...form, content: e.target.value })}
                        placeholder="Describe what occurred during the support session, or use the template above to generate a note automatically..."
                        required
                        rows={8}
                        className="w-full rounded-xl border border-border px-3 py-2.5 text-sm bg-white resize-none focus:outline-none focus:ring-2 focus:ring-blue-200"
                      />
                      <p className="text-[11px] text-slate-400 mt-1 text-right">{form.content.length} characters</p>
                    </div>

                    {/* Confidential toggle */}
                    <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 border border-border/50">
                      <input
                        type="checkbox"
                        id="confidential"
                        checked={form.is_confidential}
                        onChange={(e) => setForm({ ...form, is_confidential: e.target.checked })}
                        className="h-4 w-4 rounded border-slate-300 text-blue-500"
                      />
                      <label htmlFor="confidential" className="text-sm font-medium text-slate-700 cursor-pointer">
                        Mark as confidential
                      </label>
                      {form.is_confidential && (
                        <span className="ml-auto text-[11px] font-semibold px-2 py-0.5 rounded-full bg-red-50 text-red-600 border border-red-200">
                          Confidential
                        </span>
                      )}
                    </div>

                    {/* Privacy notice */}
                    <div className="rounded-xl bg-amber-50 border border-amber-200 p-3 flex items-start gap-2">
                      <Lock className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
                      <p className="text-xs text-amber-700">
                        This note will be saved directly to the client's card. It is immutable after 1 hour and visible only to assigned staff, managers, and admin.
                      </p>
                    </div>

                    {/* Actions */}
                    <div className="flex justify-end gap-2 pt-1">
                      <button
                        type="button"
                        onClick={handleReset}
                        className="h-10 px-4 rounded-xl border text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors"
                      >
                        Clear
                      </button>
                      <button
                        type="submit"
                        disabled={mutation.isPending}
                        className="h-10 px-6 rounded-xl text-white text-sm font-bold flex items-center gap-2 hover:opacity-90 transition-opacity disabled:opacity-50 shadow-md"
                        style={{ background: "linear-gradient(135deg, #60a5fa, #3b82f6)" }}
                      >
                        {mutation.isPending ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <FileText className="h-4 w-4" />
                        )}
                        Save Note
                      </button>
                    </div>
                  </form>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </AppLayout>
  );
}
