/**
 * Client Portal
 * Secure client login - view notes, requests, mock invoices
 */

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { motion, AnimatePresence } from "framer-motion";
import {
  FileText, Calendar, Clock, DollarSign, MessageSquare,
  Bell, User, ChevronRight, Loader2, AlertCircle, CheckCircle,
  Phone, Mail, Heart, Shield, Download, Eye
} from "lucide-react";
import { format } from "date-fns";
import cartersIcon from "@/assets/icon.png";

// This is a client-facing portal with security clearance level 1
// Clients can only view their own data

export default function ClientPortal() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<"overview" | "notes" | "schedule" | "invoices" | "requests">("overview");
  
  // Get client ID from user metadata or a lookup
  const clientId = user?.user_metadata?.client_id;

  // Fetch client data
  const { data: clientData, isLoading: clientLoading } = useQuery({
    queryKey: ["client-portal", clientId],
    queryFn: async () => {
      if (!clientId) return null;
      const { data, error } = await supabase
        .from("clients")
        .select("*")
        .eq("id", clientId)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!clientId,
  });

  // Fetch client's case notes (limited view)
  const { data: notes = [] } = useQuery({
    queryKey: ["client-portal-notes", clientId],
    queryFn: async () => {
      if (!clientId) return [];
      const { data } = await supabase
        .from("case_notes")
        .select(`
          id,
          created_at,
          note_type,
          summary,
          staff:staff_id(first_name, last_name)
        `)
        .eq("client_id", clientId)
        .eq("is_visible_to_client", true)
        .order("created_at", { ascending: false })
        .limit(20);
      return data || [];
    },
    enabled: !!clientId,
  });

  // Fetch upcoming shifts/appointments
  const { data: schedule = [] } = useQuery({
    queryKey: ["client-portal-schedule", clientId],
    queryFn: async () => {
      if (!clientId) return [];
      const today = format(new Date(), "yyyy-MM-dd");
      const { data } = await supabase
        .from("timesheets")
        .select(`
          id,
          shift_date,
          start_time,
          end_time,
          status,
          staff:staff_id(first_name, last_name)
        `)
        .eq("client_id", clientId)
        .gte("shift_date", today)
        .order("shift_date")
        .order("start_time")
        .limit(10);
      return data || [];
    },
    enabled: !!clientId,
  });

  // Fetch mock invoices
  const { data: invoices = [] } = useQuery({
    queryKey: ["client-portal-invoices", clientId],
    queryFn: async () => {
      if (!clientId) return [];
      const { data } = await supabase
        .from("invoices")
        .select("*")
        .eq("client_id", clientId)
        .order("created_at", { ascending: false })
        .limit(10);
      return data || [];
    },
    enabled: !!clientId,
  });

  // If no client ID linked to user
  if (!clientId) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md text-center">
          <img src={cartersIcon} alt="Carters Care" className="h-16 w-16 mx-auto mb-4 rounded-xl" />
          <h1 className="text-xl font-bold text-slate-800 mb-2">Client Portal</h1>
          <p className="text-slate-500 text-sm">
            Your account is not linked to a client profile. Please contact Carters Care to set up your portal access.
          </p>
          <a href="tel:+61000000000" className="mt-6 inline-flex items-center gap-2 text-teal-600 font-medium text-sm hover:underline">
            <Phone className="h-4 w-4" /> Contact Support
          </a>
        </div>
      </div>
    );
  }

  if (clientLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-teal-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <img src={cartersIcon} alt="Carters Care" className="h-10 w-10 rounded-xl shadow-sm" />
              <div>
                <h1 className="text-lg font-bold text-slate-800">My Care Portal</h1>
                <p className="text-xs text-slate-500">Welcome back, {clientData?.preferred_name || clientData?.first_name}</p>
              </div>
            </div>
            <button className="h-10 w-10 rounded-full bg-slate-100 flex items-center justify-center">
              <Bell className="h-5 w-5 text-slate-500" />
            </button>
          </div>
        </div>
      </header>

      {/* Navigation Tabs */}
      <nav className="bg-white border-b">
        <div className="max-w-5xl mx-auto px-4">
          <div className="flex gap-1 overflow-x-auto">
            {[
              { id: "overview", label: "Overview", icon: User },
              { id: "schedule", label: "My Schedule", icon: Calendar },
              { id: "notes", label: "Care Notes", icon: FileText },
              { id: "invoices", label: "Invoices", icon: DollarSign },
              { id: "requests", label: "Requests", icon: MessageSquare },
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                    isActive
                      ? "border-teal-500 text-teal-600"
                      : "border-transparent text-slate-500 hover:text-slate-700"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-5xl mx-auto px-4 py-6">
        <AnimatePresence mode="wait">
          {activeTab === "overview" && (
            <motion.div
              key="overview"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-6"
            >
              {/* Welcome Card */}
              <div className="bg-gradient-to-br from-teal-500 to-cyan-500 rounded-2xl p-6 text-white">
                <h2 className="text-xl font-bold mb-2">Hello, {clientData?.preferred_name || clientData?.first_name}</h2>
                <p className="text-teal-100 text-sm">
                  {schedule.length > 0 
                    ? `You have ${schedule.length} upcoming visit${schedule.length > 1 ? "s" : ""} scheduled.`
                    : "No upcoming visits scheduled."
                  }
                </p>
              </div>

              {/* Quick Stats */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <QuickStat icon={Calendar} label="Upcoming Visits" value={schedule.length} color="blue" />
                <QuickStat icon={FileText} label="Care Notes" value={notes.length} color="purple" />
                <QuickStat icon={DollarSign} label="Invoices" value={invoices.length} color="green" />
                <QuickStat icon={Heart} label="Your Status" value="Active" color="teal" isText />
              </div>

              {/* Next Visit */}
              {schedule.length > 0 && (
                <div className="bg-white rounded-2xl border p-5">
                  <h3 className="text-sm font-bold text-slate-700 mb-4 flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-blue-500" /> Next Visit
                  </h3>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-lg font-bold text-slate-800">
                        {format(new Date(schedule[0].shift_date), "EEEE, MMMM d")}
                      </p>
                      <p className="text-sm text-slate-500">
                        {schedule[0].start_time?.slice(0, 5)} - {schedule[0].end_time?.slice(0, 5)}
                      </p>
                      {schedule[0].staff && (
                        <p className="text-xs text-slate-400 mt-1">
                          Support Worker: {schedule[0].staff.first_name} {schedule[0].staff.last_name}
                        </p>
                      )}
                    </div>
                    <div className="h-12 w-12 rounded-xl bg-blue-100 flex items-center justify-center">
                      <Clock className="h-6 w-6 text-blue-600" />
                    </div>
                  </div>
                </div>
              )}

              {/* Recent Notes Preview */}
              {notes.length > 0 && (
                <div className="bg-white rounded-2xl border p-5">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-bold text-slate-700 flex items-center gap-2">
                      <FileText className="h-4 w-4 text-purple-500" /> Recent Notes
                    </h3>
                    <button
                      onClick={() => setActiveTab("notes")}
                      className="text-xs text-teal-600 font-medium hover:underline flex items-center gap-1"
                    >
                      View All <ChevronRight className="h-3 w-3" />
                    </button>
                  </div>
                  <div className="space-y-3">
                    {notes.slice(0, 3).map((note: any) => (
                      <div key={note.id} className="p-3 bg-slate-50 rounded-xl">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-medium text-purple-600 capitalize">{note.note_type?.replace(/_/g, " ")}</span>
                          <span className="text-xs text-slate-400">{format(new Date(note.created_at), "MMM d")}</span>
                        </div>
                        <p className="text-sm text-slate-600 line-clamp-2">{note.summary}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {activeTab === "schedule" && (
            <motion.div
              key="schedule"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-4"
            >
              <h2 className="text-lg font-bold text-slate-800">Upcoming Visits</h2>
              {schedule.length === 0 ? (
                <div className="bg-white rounded-2xl border p-12 text-center">
                  <Calendar className="h-12 w-12 text-slate-200 mx-auto mb-4" />
                  <p className="text-slate-500">No upcoming visits scheduled</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {schedule.map((visit: any) => (
                    <div key={visit.id} className="bg-white rounded-xl border p-4">
                      <div className="flex items-center gap-4">
                        <div className="h-12 w-12 rounded-xl bg-blue-100 flex items-center justify-center flex-shrink-0">
                          <Calendar className="h-6 w-6 text-blue-600" />
                        </div>
                        <div className="flex-1">
                          <p className="font-semibold text-slate-800">
                            {format(new Date(visit.shift_date), "EEEE, MMMM d, yyyy")}
                          </p>
                          <p className="text-sm text-slate-500">
                            {visit.start_time?.slice(0, 5)} - {visit.end_time?.slice(0, 5)}
                          </p>
                          {visit.staff && (
                            <p className="text-xs text-slate-400 mt-1">
                              {visit.staff.first_name} {visit.staff.last_name}
                            </p>
                          )}
                        </div>
                        <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                          visit.status === "confirmed" ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"
                        }`}>
                          {visit.status === "confirmed" ? "Confirmed" : "Scheduled"}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          )}

          {activeTab === "notes" && (
            <motion.div
              key="notes"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-4"
            >
              <h2 className="text-lg font-bold text-slate-800">Care Notes</h2>
              <p className="text-sm text-slate-500">Notes shared by your care team about your visits and progress.</p>
              {notes.length === 0 ? (
                <div className="bg-white rounded-2xl border p-12 text-center">
                  <FileText className="h-12 w-12 text-slate-200 mx-auto mb-4" />
                  <p className="text-slate-500">No care notes available</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {notes.map((note: any) => (
                    <div key={note.id} className="bg-white rounded-xl border p-4">
                      <div className="flex items-start justify-between mb-2">
                        <span className="text-xs font-bold text-purple-600 uppercase tracking-wide">
                          {note.note_type?.replace(/_/g, " ")}
                        </span>
                        <span className="text-xs text-slate-400">
                          {format(new Date(note.created_at), "MMM d, yyyy")}
                        </span>
                      </div>
                      <p className="text-sm text-slate-700">{note.summary}</p>
                      {note.staff && (
                        <p className="text-xs text-slate-400 mt-2">
                          By {note.staff.first_name} {note.staff.last_name}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          )}

          {activeTab === "invoices" && (
            <motion.div
              key="invoices"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-4"
            >
              <h2 className="text-lg font-bold text-slate-800">Invoices</h2>
              <p className="text-sm text-slate-500">View and download your service invoices.</p>
              {invoices.length === 0 ? (
                <div className="bg-white rounded-2xl border p-12 text-center">
                  <DollarSign className="h-12 w-12 text-slate-200 mx-auto mb-4" />
                  <p className="text-slate-500">No invoices available</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {invoices.map((invoice: any) => (
                    <div key={invoice.id} className="bg-white rounded-xl border p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-semibold text-slate-800">Invoice #{invoice.id.slice(0, 8)}</p>
                          <p className="text-sm text-slate-500">
                            {format(new Date(invoice.created_at), "MMMM d, yyyy")}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-bold text-slate-800">
                            ${invoice.total_amount?.toFixed(2) || "0.00"}
                          </p>
                          <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                            invoice.status === "paid" 
                              ? "bg-green-100 text-green-700" 
                              : invoice.status === "pending"
                              ? "bg-amber-100 text-amber-700"
                              : "bg-slate-100 text-slate-600"
                          }`}>
                            {invoice.status?.charAt(0).toUpperCase() + invoice.status?.slice(1)}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 mt-3 pt-3 border-t">
                        <button className="text-xs text-teal-600 font-medium hover:underline flex items-center gap-1">
                          <Eye className="h-3 w-3" /> View
                        </button>
                        <button className="text-xs text-teal-600 font-medium hover:underline flex items-center gap-1">
                          <Download className="h-3 w-3" /> Download PDF
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          )}

          {activeTab === "requests" && (
            <motion.div
              key="requests"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-4"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-bold text-slate-800">My Requests</h2>
                  <p className="text-sm text-slate-500">Submit and track service requests.</p>
                </div>
                <button className="h-9 px-4 rounded-xl bg-gradient-to-r from-teal-500 to-cyan-500 text-white text-sm font-semibold shadow-sm hover:shadow-md transition-shadow">
                  New Request
                </button>
              </div>
              <div className="bg-white rounded-2xl border p-12 text-center">
                <MessageSquare className="h-12 w-12 text-slate-200 mx-auto mb-4" />
                <p className="text-slate-500">No requests submitted</p>
                <p className="text-xs text-slate-400 mt-1">Submit a request to contact your care team</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t mt-12 py-6">
        <div className="max-w-5xl mx-auto px-4 text-center">
          <img src={cartersIcon} alt="Carters Care" className="h-8 w-8 mx-auto mb-2 rounded-lg opacity-50" />
          <p className="text-xs text-slate-400">Carters Care Client Portal</p>
          <p className="text-xs text-slate-400 mt-1">Need help? Call us or contact your care coordinator.</p>
        </div>
      </footer>
    </div>
  );
}

// Quick Stat Component
function QuickStat({ 
  icon: Icon, 
  label, 
  value, 
  color, 
  isText 
}: { 
  icon: React.ElementType; 
  label: string; 
  value: string | number; 
  color: string;
  isText?: boolean;
}) {
  const colors: Record<string, string> = {
    blue: "from-blue-500 to-cyan-500",
    purple: "from-purple-500 to-violet-500",
    green: "from-green-500 to-emerald-500",
    teal: "from-teal-500 to-cyan-500",
  };

  return (
    <div className="bg-white rounded-xl border p-4">
      <div className={`h-9 w-9 rounded-lg bg-gradient-to-br ${colors[color]} flex items-center justify-center mb-2`}>
        <Icon className="h-4 w-4 text-white" />
      </div>
      <p className={`${isText ? "text-sm" : "text-xl"} font-bold text-slate-800`}>{value}</p>
      <p className="text-xs text-slate-500">{label}</p>
    </div>
  );
}
