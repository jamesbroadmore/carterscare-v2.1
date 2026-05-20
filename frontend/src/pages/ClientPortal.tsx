/**
 * Client Portal — self-contained page with its own auth state.
 * Uses username + access code stored in localStorage (no Supabase auth).
 * Falls back to DEMO_DATA when clientPortalSession.client_id === "c1".
 */

import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Navigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { formatPerthTime } from "@/lib/perth-time";
import { DEMO_DATA } from "@/contexts/DemoContext";
import { format, parseISO, isAfter, startOfToday } from "date-fns";
import { toast } from "sonner";
import {
  FileText, Calendar, Clock, MessageSquare, Bell, User,
  ChevronRight, Heart, LogOut, Phone, CheckCircle,
  PlusCircle, Send, X, AlertCircle, Loader2
} from "lucide-react";
import cartersIcon from "@/assets/icon.png";

// ── Types ─────────────────────────────────────────────────────────────────────

interface ClientData {
  id: string;
  first_name: string;
  last_name: string;
  preferred_name: string | null;
  phone: string;
  address: string;
  ndis_number: string | null;
  funding_type: string;
  status: string;
}

interface Visit {
  id: string;
  shift_date: string;
  start_time: string;
  end_time: string;
  status: string;
  staff_name: string;
  total_hours: number;
}

interface CareNote {
  id: string;
  created_at: string;
  note_type: string;
  summary: string;
  staff_name: string;
}

interface Request {
  id: string;
  title: string;
  description: string;
  type: string;
  status: string;
  priority: string;
  created_at: string;
}

// ── Demo data helpers ─────────────────────────────────────────────────────────

function getClientData(clientId: string): ClientData | null {
  const c = DEMO_DATA.clients.find((c) => c.id === clientId);
  if (!c) return null;
  return c as ClientData;
}

function getVisits(clientId: string): Visit[] {
  const today = startOfToday();
  return DEMO_DATA.timesheets
    .filter((t) => t.client_id === clientId)
    .map((t) => {
      const staff = DEMO_DATA.staff.find((s) => s.id === t.staff_id);
      return {
        id: t.id,
        shift_date: t.shift_date,
        start_time: t.start_time,
        end_time: t.end_time,
        status: t.status,
        staff_name: staff ? `${staff.first_name} ${staff.last_name}` : "TBA",
        total_hours: t.total_hours,
      };
    })
    .sort((a, b) => a.shift_date.localeCompare(b.shift_date));
}

function getUpcomingVisits(clientId: string): Visit[] {
  const today = format(startOfToday(), "yyyy-MM-dd");
  return getVisits(clientId).filter((v) => v.shift_date >= today);
}

function getCareNotes(clientId: string): CareNote[] {
  return DEMO_DATA.case_notes
    .filter((n) => n.client_id === clientId && n.is_visible_to_client)
    .map((n) => {
      const staff = DEMO_DATA.staff.find((s) => s.id === n.staff_id);
      return {
        id: n.id,
        created_at: n.created_at,
        note_type: n.note_type,
        summary: n.summary,
        staff_name: staff ? `${staff.first_name} ${staff.last_name}` : "Care Team",
      };
    })
    .sort((a, b) => b.created_at.localeCompare(a.created_at));
}

function getRequests(clientId: string): Request[] {
  return DEMO_DATA.requests
    .filter((r) => r.requester_id === clientId)
    .sort((a, b) => b.created_at.localeCompare(a.created_at));
}

// ── Main component ────────────────────────────────────────────────────────────

export default function ClientPortal() {
  const { clientPortalSession, demoRole, isDemoMode, signOut, loading } = useAuth();

  // Not authenticated via client portal — redirect to login
  if (!loading && !clientPortalSession && !(isDemoMode && demoRole === "client")) {
    return <Navigate to="/login?tab=client" replace />;
  }

  const clientId = clientPortalSession?.client_id ?? "c1"; // demo fallback
  const clientData = getClientData(clientId);
  const upcomingVisits = getUpcomingVisits(clientId);
  const allVisits = getVisits(clientId);
  const careNotes = getCareNotes(clientId);
  const requests = getRequests(clientId);

  const displayName = clientPortalSession?.display_name
    ?? (clientData ? (clientData.preferred_name || clientData.first_name) : "there");

  return (
    <ClientPortalUI
      clientData={clientData}
      displayName={displayName}
      upcomingVisits={upcomingVisits}
      allVisits={allVisits}
      careNotes={careNotes}
      requests={requests}
      clientId={clientId}
      onSignOut={async () => {
        await signOut();
      }}
    />
  );
}

// ── UI component (receives data as props — easy to swap to real data later) ───

function ClientPortalUI({
  clientData,
  displayName,
  upcomingVisits,
  allVisits,
  careNotes,
  requests: initialRequests,
  clientId,
  onSignOut,
}: {
  clientData: ClientData | null;
  displayName: string;
  upcomingVisits: Visit[];
  allVisits: Visit[];
  careNotes: CareNote[];
  requests: Request[];
  clientId: string;
  onSignOut: () => void;
}) {
  const [activeTab, setActiveTab] = useState<"overview" | "schedule" | "notes" | "requests">("overview");
  const [requests, setRequests] = useState(initialRequests);
  const [showNewRequest, setShowNewRequest] = useState(false);
  const [newReq, setNewReq] = useState({ title: "", description: "", type: "schedule" });
  const [submittingReq, setSubmittingReq] = useState(false);

  const handleSubmitRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newReq.title.trim() || !newReq.description.trim()) {
      toast.error("Please fill in all fields");
      return;
    }
    setSubmittingReq(true);
    // Simulate submission delay
    await new Promise((r) => setTimeout(r, 800));
    const newRequest: Request = {
      id: `r${Date.now()}`,
      title: newReq.title,
      description: newReq.description,
      type: newReq.type,
      status: "pending",
      priority: "medium",
      created_at: new Date().toISOString(),
    };
    setRequests((prev) => [newRequest, ...prev]);
    setNewReq({ title: "", description: "", type: "schedule" });
    setShowNewRequest(false);
    setSubmittingReq(false);
    toast.success("Request submitted! Your care team will be in touch.");
  };

  const TABS = [
    { id: "overview", label: "Overview", icon: User },
    { id: "schedule", label: "My Schedule", icon: Calendar },
    { id: "notes", label: "Care Notes", icon: FileText },
    { id: "requests", label: "Requests", icon: MessageSquare },
  ] as const;

  return (
    <div className="min-h-screen" style={{ background: "linear-gradient(135deg, #f0fdfa 0%, #e6fffa 40%, #f0fdf4 100%)" }}>
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md border-b border-teal-100 sticky top-0 z-20">
        <div className="max-w-2xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl overflow-hidden shadow-sm">
                <img src={cartersIcon} alt="Carters Care" className="h-full w-full object-cover" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <h1 className="text-base font-bold text-slate-800">My Care Portal</h1>
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-teal-100 text-teal-700">DEMO</span>
                </div>
                <p className="text-xs text-slate-500">Hello, {displayName}</p>
              </div>
            </div>
            <button
              onClick={onSignOut}
              className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-red-500 transition-colors px-3 py-2 rounded-lg hover:bg-red-50"
              title="Sign out"
            >
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:block">Sign Out</span>
            </button>
          </div>
        </div>
      </header>

      {/* Tab nav */}
      <nav className="bg-white/70 backdrop-blur border-b border-teal-50 sticky top-[73px] z-10">
        <div className="max-w-2xl mx-auto px-4">
          <div className="flex overflow-x-auto scrollbar-none">
            {TABS.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setActiveTab(id as any)}
                className={`flex items-center gap-1.5 px-4 py-3 text-sm font-medium border-b-2 whitespace-nowrap transition-all ${
                  activeTab === id
                    ? "border-teal-500 text-teal-700 bg-teal-50/50"
                    : "border-transparent text-slate-500 hover:text-slate-700"
                }`}
              >
                <Icon className="h-4 w-4" />
                {label}
              </button>
            ))}
          </div>
        </div>
      </nav>

      {/* Content */}
      <main className="max-w-2xl mx-auto px-4 py-6 pb-20">
        <AnimatePresence mode="wait">

          {/* ── OVERVIEW ── */}
          {activeTab === "overview" && (
            <motion.div key="overview" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-5">
              {/* Welcome banner */}
              <div className="rounded-2xl p-6 text-white relative overflow-hidden" style={{ background: "linear-gradient(135deg, #0d9488, #0891b2)" }}>
                <div className="absolute top-0 right-0 w-32 h-32 rounded-full opacity-10 translate-x-8 -translate-y-8" style={{ background: "white" }} />
                <h2 className="text-xl font-bold mb-1">Hello, {displayName}! 👋</h2>
                <p className="text-teal-100 text-sm">
                  {upcomingVisits.length > 0
                    ? `You have ${upcomingVisits.length} upcoming visit${upcomingVisits.length > 1 ? "s" : ""} scheduled.`
                    : "Welcome to your care portal."
                  }
                </p>
                {clientData?.ndis_number && (
                  <p className="text-teal-200 text-xs mt-2">NDIS: {clientData.ndis_number}</p>
                )}
              </div>

              {/* Stats row */}
              <div className="grid grid-cols-3 gap-3">
                <StatCard icon={Calendar} label="Upcoming" value={upcomingVisits.length} color="blue" onClick={() => setActiveTab("schedule")} />
                <StatCard icon={FileText} label="Care Notes" value={careNotes.length} color="purple" onClick={() => setActiveTab("notes")} />
                <StatCard icon={MessageSquare} label="Requests" value={requests.length} color="teal" onClick={() => setActiveTab("requests")} />
              </div>

              {/* Next visit */}
              {upcomingVisits.length > 0 && (
                <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm">
                  <h3 className="text-sm font-bold text-slate-700 mb-4 flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-blue-500" /> Next Visit
                  </h3>
                  <div className="flex items-center gap-4">
                    <div className="h-14 w-14 rounded-xl bg-blue-50 flex flex-col items-center justify-center flex-shrink-0 border border-blue-100">
                      <span className="text-xs font-bold text-blue-600 uppercase">
                        {format(parseISO(upcomingVisits[0].shift_date), "MMM")}
                      </span>
                      <span className="text-xl font-black text-blue-700">
                        {format(parseISO(upcomingVisits[0].shift_date), "d")}
                      </span>
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-slate-800">
                        {format(parseISO(upcomingVisits[0].shift_date), "EEEE")}
                      </p>
                      <p className="text-sm text-slate-500 flex items-center gap-1">
                        <Clock className="h-3.5 w-3.5" />
                        {upcomingVisits[0].start_time.length > 5 ? formatPerthTime(upcomingVisits[0].start_time) : upcomingVisits[0].start_time} – {upcomingVisits[0].end_time.length > 5 ? formatPerthTime(upcomingVisits[0].end_time) : upcomingVisits[0].end_time}
                        <span className="text-slate-400">·</span>
                        {upcomingVisits[0].total_hours}h
                      </p>
                      <p className="text-xs text-slate-400 mt-0.5">
                        {upcomingVisits[0].staff_name}
                      </p>
                    </div>
                    <StatusBadge status={upcomingVisits[0].status} />
                  </div>
                </div>
              )}

              {/* Recent care note */}
              {careNotes.length > 0 && (
                <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-bold text-slate-700 flex items-center gap-2">
                      <FileText className="h-4 w-4 text-purple-500" /> Latest Note
                    </h3>
                    <button onClick={() => setActiveTab("notes")} className="text-xs text-teal-600 font-medium flex items-center gap-1 hover:underline">
                      View all <ChevronRight className="h-3 w-3" />
                    </button>
                  </div>
                  <div className="p-3 bg-purple-50 rounded-xl border border-purple-100">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs font-semibold text-purple-700 capitalize">
                        {careNotes[0].note_type.replace(/_/g, " ")}
                      </span>
                      <span className="text-xs text-slate-400">
                        {format(parseISO(careNotes[0].created_at), "d MMM")}
                      </span>
                    </div>
                    <p className="text-sm text-slate-700 leading-relaxed">{careNotes[0].summary}</p>
                    <p className="text-xs text-slate-400 mt-2">by {careNotes[0].staff_name}</p>
                  </div>
                </div>
              )}

              {/* Contact card */}
              <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm">
                <h3 className="text-sm font-bold text-slate-700 mb-3 flex items-center gap-2">
                  <Heart className="h-4 w-4 text-pink-500" /> Need Help?
                </h3>
                <p className="text-sm text-slate-500 mb-4">Contact your Carters Care coordinator for support.</p>
                <a
                  href="tel:+61800000000"
                  className="flex items-center gap-3 p-3 rounded-xl bg-teal-50 border border-teal-100 text-teal-700 hover:bg-teal-100 transition-colors"
                >
                  <Phone className="h-5 w-5 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-semibold">Call Us</p>
                    <p className="text-xs text-teal-600">1800 CARTERS</p>
                  </div>
                </a>
              </div>
            </motion.div>
          )}

          {/* ── SCHEDULE ── */}
          {activeTab === "schedule" && (
            <motion.div key="schedule" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-4">
              <div>
                <h2 className="text-lg font-bold text-slate-800">My Schedule</h2>
                <p className="text-sm text-slate-500 mt-0.5">Your upcoming and recent care visits</p>
              </div>

              {upcomingVisits.length === 0 && allVisits.length === 0 ? (
                <EmptyState icon={Calendar} message="No visits scheduled" sub="Your care coordinator will be in touch to arrange visits" />
              ) : (
                <div className="space-y-3">
                  {(upcomingVisits.length > 0 ? upcomingVisits : allVisits).map((visit) => (
                    <div key={visit.id} className="bg-white rounded-xl border border-slate-100 p-4 shadow-sm">
                      <div className="flex items-center gap-4">
                        <div className="h-12 w-12 rounded-xl bg-blue-50 border border-blue-100 flex flex-col items-center justify-center flex-shrink-0">
                          <span className="text-[9px] font-bold text-blue-500 uppercase">
                            {format(parseISO(visit.shift_date), "MMM")}
                          </span>
                          <span className="text-base font-black text-blue-700">
                            {format(parseISO(visit.shift_date), "d")}
                          </span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-slate-800">
                            {format(parseISO(visit.shift_date), "EEEE, d MMMM")}
                          </p>
                          <p className="text-sm text-slate-500 flex items-center gap-1 flex-wrap">
                            <Clock className="h-3 w-3 flex-shrink-0" />
                            {visit.start_time.length > 5 ? formatPerthTime(visit.start_time) : visit.start_time} – {visit.end_time.length > 5 ? formatPerthTime(visit.end_time) : visit.end_time}
                            <span className="text-slate-300">·</span>
                            {visit.total_hours}h
                          </p>
                          <p className="text-xs text-slate-400 mt-0.5 truncate">with {visit.staff_name}</p>
                        </div>
                        <StatusBadge status={visit.status} />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          )}

          {/* ── CARE NOTES ── */}
          {activeTab === "notes" && (
            <motion.div key="notes" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-4">
              <div>
                <h2 className="text-lg font-bold text-slate-800">Care Notes</h2>
                <p className="text-sm text-slate-500 mt-0.5">Updates shared by your care team</p>
              </div>

              {careNotes.length === 0 ? (
                <EmptyState icon={FileText} message="No care notes yet" sub="Notes from your care team will appear here" />
              ) : (
                <div className="space-y-3">
                  {careNotes.map((note) => (
                    <div key={note.id} className="bg-white rounded-xl border border-slate-100 p-4 shadow-sm">
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-purple-100 text-purple-700 capitalize whitespace-nowrap">
                          {note.note_type.replace(/_/g, " ")}
                        </span>
                        <span className="text-xs text-slate-400 whitespace-nowrap flex-shrink-0">
                          {format(parseISO(note.created_at), "d MMM yyyy")}
                        </span>
                      </div>
                      <p className="text-sm text-slate-700 leading-relaxed">{note.summary}</p>
                      <div className="flex items-center gap-1.5 mt-3 pt-3 border-t border-slate-50">
                        <div className="h-5 w-5 rounded-full bg-teal-100 flex items-center justify-center">
                          <User className="h-3 w-3 text-teal-600" />
                        </div>
                        <p className="text-xs text-slate-400">{note.staff_name}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          )}

          {/* ── REQUESTS ── */}
          {activeTab === "requests" && (
            <motion.div key="requests" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-bold text-slate-800">My Requests</h2>
                  <p className="text-sm text-slate-500 mt-0.5">Contact your care team</p>
                </div>
                <button
                  onClick={() => setShowNewRequest(true)}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold text-white shadow-sm hover:shadow-md transition-shadow"
                  style={{ background: "linear-gradient(135deg, #0d9488, #0891b2)" }}
                >
                  <PlusCircle className="h-4 w-4" />
                  New
                </button>
              </div>

              {/* New request form */}
              <AnimatePresence>
                {showNewRequest && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="overflow-hidden"
                  >
                    <form onSubmit={handleSubmitRequest} className="bg-white rounded-xl border border-teal-200 p-4 shadow-sm space-y-3">
                      <div className="flex items-center justify-between">
                        <h3 className="font-semibold text-slate-800 text-sm">New Request</h3>
                        <button type="button" onClick={() => setShowNewRequest(false)} className="text-slate-400 hover:text-slate-600">
                          <X className="h-4 w-4" />
                        </button>
                      </div>

                      <div>
                        <label className="text-xs font-semibold text-slate-600 mb-1.5 block uppercase tracking-wide">Type</label>
                        <select
                          value={newReq.type}
                          onChange={(e) => setNewReq((p) => ({ ...p, type: e.target.value }))}
                          className="w-full h-10 px-3 rounded-lg border border-slate-200 bg-slate-50 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-400"
                        >
                          <option value="schedule">Schedule Change</option>
                          <option value="service">Service Request</option>
                          <option value="feedback">Feedback</option>
                          <option value="other">Other</option>
                        </select>
                      </div>

                      <div>
                        <label className="text-xs font-semibold text-slate-600 mb-1.5 block uppercase tracking-wide">Subject</label>
                        <input
                          type="text"
                          value={newReq.title}
                          onChange={(e) => setNewReq((p) => ({ ...p, title: e.target.value }))}
                          placeholder="Brief description of your request"
                          className="w-full h-10 px-3 rounded-lg border border-slate-200 bg-slate-50 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-400"
                        />
                      </div>

                      <div>
                        <label className="text-xs font-semibold text-slate-600 mb-1.5 block uppercase tracking-wide">Details</label>
                        <textarea
                          value={newReq.description}
                          onChange={(e) => setNewReq((p) => ({ ...p, description: e.target.value }))}
                          placeholder="Tell us more about your request..."
                          rows={3}
                          className="w-full px-3 py-2.5 rounded-lg border border-slate-200 bg-slate-50 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-400 resize-none"
                        />
                      </div>

                      <button
                        type="submit"
                        disabled={submittingReq}
                        className="w-full h-10 rounded-lg text-white text-sm font-semibold flex items-center justify-center gap-2 disabled:opacity-50"
                        style={{ background: "linear-gradient(135deg, #0d9488, #0891b2)" }}
                      >
                        {submittingReq ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                        {submittingReq ? "Submitting..." : "Submit Request"}
                      </button>
                    </form>
                  </motion.div>
                )}
              </AnimatePresence>

              {requests.length === 0 ? (
                <EmptyState icon={MessageSquare} message="No requests yet" sub="Tap New to send a message to your care team" />
              ) : (
                <div className="space-y-3">
                  {requests.map((req) => (
                    <div key={req.id} className="bg-white rounded-xl border border-slate-100 p-4 shadow-sm">
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <p className="font-semibold text-slate-800 text-sm leading-tight">{req.title}</p>
                        <RequestStatusBadge status={req.status} />
                      </div>
                      <p className="text-sm text-slate-500 leading-relaxed">{req.description}</p>
                      <div className="flex items-center gap-3 mt-3 pt-3 border-t border-slate-50 text-xs text-slate-400">
                        <span className="capitalize px-2 py-0.5 bg-slate-100 rounded-full">{req.type}</span>
                        <span>{format(parseISO(req.created_at), "d MMM yyyy")}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          )}

        </AnimatePresence>
      </main>

      {/* Footer */}
      <footer className="border-t border-teal-100 bg-white/60 py-6 mt-4">
        <div className="max-w-2xl mx-auto px-4 text-center">
          <img src={cartersIcon} alt="" className="h-8 w-8 mx-auto mb-2 rounded-lg opacity-40" />
          <p className="text-xs text-slate-400">Carters Care Client Portal · Secure access</p>
          <p className="text-xs text-slate-400 mt-1">Need help? Call us or contact your care coordinator.</p>
        </div>
      </footer>
    </div>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────

function StatCard({
  icon: Icon, label, value, color, onClick
}: { icon: React.ElementType; label: string; value: number; color: string; onClick?: () => void }) {
  const gradients: Record<string, string> = {
    blue: "from-blue-500 to-cyan-500",
    purple: "from-purple-500 to-violet-500",
    teal: "from-teal-500 to-cyan-500",
    pink: "from-pink-500 to-rose-500",
  };
  return (
    <button
      onClick={onClick}
      className="bg-white rounded-xl border border-slate-100 p-4 shadow-sm text-left hover:shadow-md transition-shadow w-full"
    >
      <div className={`h-8 w-8 rounded-lg bg-gradient-to-br ${gradients[color]} flex items-center justify-center mb-2`}>
        <Icon className="h-4 w-4 text-white" />
      </div>
      <p className="text-xl font-black text-slate-800">{value}</p>
      <p className="text-xs text-slate-500 leading-tight">{label}</p>
    </button>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; className: string }> = {
    approved: { label: "Approved", className: "bg-green-100 text-green-700" },
    confirmed: { label: "Confirmed", className: "bg-green-100 text-green-700" },
    submitted: { label: "Submitted", className: "bg-blue-100 text-blue-700" },
    pending: { label: "Scheduled", className: "bg-amber-100 text-amber-700" },
    draft: { label: "Draft", className: "bg-slate-100 text-slate-600" },
  };
  const s = map[status] ?? { label: status, className: "bg-slate-100 text-slate-600" };
  return (
    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full whitespace-nowrap ${s.className}`}>
      {s.label}
    </span>
  );
}

function RequestStatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; className: string; icon: React.ElementType }> = {
    pending: { label: "Pending", className: "bg-amber-100 text-amber-700", icon: Clock },
    in_progress: { label: "In Progress", className: "bg-blue-100 text-blue-700", icon: Clock },
    resolved: { label: "Resolved", className: "bg-green-100 text-green-700", icon: CheckCircle },
    rejected: { label: "Declined", className: "bg-red-100 text-red-700", icon: AlertCircle },
  };
  const s = map[status] ?? { label: status, className: "bg-slate-100 text-slate-600", icon: Clock };
  const Icon = s.icon;
  return (
    <span className={`flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full whitespace-nowrap ${s.className}`}>
      <Icon className="h-3 w-3" />{s.label}
    </span>
  );
}

function EmptyState({ icon: Icon, message, sub }: { icon: React.ElementType; message: string; sub?: string }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-100 p-12 text-center shadow-sm">
      <Icon className="h-12 w-12 text-slate-200 mx-auto mb-3" />
      <p className="text-slate-500 font-medium">{message}</p>
      {sub && <p className="text-xs text-slate-400 mt-1">{sub}</p>}
    </div>
  );
}
