import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { fullName } from "@/lib/display-names";
import { Avatar, StatusBadge, PrimaryButton, OutlineButton } from "@/components/ui-kit";
import {
  X, User, Heart, Calendar, FileText, FolderOpen, Phone, Mail, MapPin,
  AlertTriangle, Clock, Plus, ChevronLeft, ChevronRight, Edit, Save,
  FileCheck, Shield, Users, Activity, Loader2
} from "lucide-react";

// Tab configuration
const WORKSPACE_TABS = [
  { key: "general", label: "General Info", icon: User },
  { key: "care-plan", label: "Care Plan", icon: Heart },
  { key: "schedule", label: "Schedule", icon: Calendar },
  { key: "notes", label: "Notes", icon: FileText },
  { key: "documents", label: "Documents", icon: FolderOpen },
];

// Days of week for schedule
const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const HOURS = Array.from({ length: 13 }, (_, i) => i + 7); // 7am to 7pm

interface ClientWorkspaceProps {
  client: any;
  onClose: () => void;
  assignedStaff?: any[];
}

export function ClientWorkspaceCard({ client, onClose, assignedStaff = [] }: ClientWorkspaceProps) {
  const { isAdmin } = useAuth();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("general");
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState<any>({});

  // Fetch client notes
  const { data: notes = [], isLoading: notesLoading } = useQuery({
    queryKey: ["client-notes", client.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("case_notes")
        .select("*, staff:staff_id(first_name, last_name)")
        .eq("client_id", client.id)
        .order("created_at", { ascending: false })
        .limit(20);
      if (error) {
        console.warn("shifts query failed:", error.message);
        return [];
      }
      return data;
    },
  });

  // Fetch client incidents
  const { data: incidents = [] } = useQuery({
    queryKey: ["client-incidents", client.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("incidents")
        .select("*")
        .eq("client_id", client.id)
        .order("incident_date", { ascending: false })
        .limit(10);
      if (error) {
        console.warn("incidents query failed:", error.message);
        return [];
      }
      return data ?? [];
    },
  });

  // Fetch client shifts/schedule
  const { data: shifts = [] } = useQuery({
    queryKey: ["client-shifts", client.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("shifts")
        .select("*, staff:staff_id(first_name, last_name)")
        .eq("client_id", client.id)
        .gte("start_time", new Date().toISOString().split("T")[0])
        .order("start_time")
        .limit(50);
      if (error) {
        console.warn("shifts query failed:", error.message);
        return [];
      }
      return data ?? [];
    },
  });

  // Initialize edit data when client changes
  useEffect(() => {
    if (client) {
      setEditData({ ...client });
    }
  }, [client]);

  // Save mutation
  const saveMutation = useMutation({
    mutationFn: async (data: any) => {
      const { error } = await supabase.from("clients").update(data).eq("id", client.id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Client updated");
      queryClient.invalidateQueries({ queryKey: ["clients"] });
      setIsEditing(false);
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const handleSave = () => {
    const { id, created_at, updated_at, ...rest } = editData;
    saveMutation.mutate(rest);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.95, y: 20 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-5xl max-h-[90vh] bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col"
        data-testid="client-workspace-card"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-teal-500 to-cyan-500 px-6 py-4 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Avatar name={fullName(client)} size="lg" className="ring-4 ring-white/30" />
              <div>
                <h2 className="text-xl font-bold">{fullName(client)}</h2>
                <div className="flex items-center gap-3 mt-1 text-sm text-white/80">
                  {client.ndis_number && <span>NDIS: {client.ndis_number}</span>}
                  <StatusBadge status={client.status} />
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {isAdmin && !isEditing && (
                <button
                  onClick={() => setIsEditing(true)}
                  className="h-9 px-4 rounded-xl bg-white/20 hover:bg-white/30 text-white text-sm font-medium flex items-center gap-2 transition-colors"
                >
                  <Edit className="h-4 w-4" /> Edit
                </button>
              )}
              {isEditing && (
                <>
                  <button
                    onClick={() => setIsEditing(false)}
                    className="h-9 px-4 rounded-xl bg-white/20 hover:bg-white/30 text-white text-sm font-medium transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={saveMutation.isPending}
                    className="h-9 px-4 rounded-xl bg-white text-teal-600 text-sm font-semibold flex items-center gap-2 hover:bg-white/90 transition-colors"
                  >
                    {saveMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                    Save
                  </button>
                </>
              )}
              <button
                onClick={onClose}
                className="h-9 w-9 rounded-xl bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b bg-slate-50 px-6">
          <div className="flex gap-1 -mb-px overflow-x-auto">
            {WORKSPACE_TABS.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.key;
              return (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                    isActive
                      ? "border-teal-500 text-teal-600 bg-white"
                      : "border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-100"
                  }`}
                  data-testid={`tab-${tab.key}`}
                >
                  <Icon className="h-4 w-4" />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <AnimatePresence mode="wait">
            {activeTab === "general" && (
              <GeneralInfoTab
                key="general"
                client={client}
                assignedStaff={assignedStaff}
                isEditing={isEditing}
                editData={editData}
                setEditData={setEditData}
              />
            )}
            {activeTab === "care-plan" && (
              <CarePlanTab key="care-plan" client={client} isEditing={isEditing} />
            )}
            {activeTab === "schedule" && (
              <ScheduleTab key="schedule" client={client} shifts={shifts} />
            )}
            {activeTab === "notes" && (
              <NotesTab key="notes" client={client} notes={notes} incidents={incidents} isLoading={notesLoading} />
            )}
            {activeTab === "documents" && (
              <DocumentsTab key="documents" client={client} />
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </motion.div>
  );
}

// General Info Tab
function GeneralInfoTab({ client, assignedStaff, isEditing, editData, setEditData }: any) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="grid grid-cols-1 lg:grid-cols-2 gap-6"
    >
      {/* Personal Details */}
      <div className="bg-slate-50 rounded-2xl p-5">
        <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider mb-4 flex items-center gap-2">
          <User className="h-4 w-4 text-teal-500" /> Personal Details
        </h3>
        <div className="space-y-3">
          <InfoRow label="Full Name" value={`${client.first_name} ${client.last_name}`} />
          {client.preferred_name && <InfoRow label="Preferred Name" value={client.preferred_name} />}
          <InfoRow label="Date of Birth" value={client.date_of_birth || "Not set"} />
          <InfoRow label="Gender" value={client.gender || "Not specified"} />
          {isEditing ? (
            <div>
              <label className="text-xs font-medium text-slate-500">Status</label>
              <select
                value={editData.status || "active"}
                onChange={(e) => setEditData({ ...editData, status: e.target.value })}
                className="w-full mt-1 h-9 px-3 rounded-lg border text-sm"
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="onboarding">Onboarding</option>
                <option value="suspended">Suspended</option>
              </select>
            </div>
          ) : (
            <InfoRow label="Status" value={<StatusBadge status={client.status} />} />
          )}
        </div>
      </div>

      {/* Contact Information */}
      <div className="bg-slate-50 rounded-2xl p-5">
        <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider mb-4 flex items-center gap-2">
          <Phone className="h-4 w-4 text-teal-500" /> Contact Information
        </h3>
        <div className="space-y-3">
          {isEditing ? (
            <>
              <div>
                <label className="text-xs font-medium text-slate-500">Phone</label>
                <input
                  type="tel"
                  value={editData.phone || ""}
                  onChange={(e) => setEditData({ ...editData, phone: e.target.value })}
                  className="w-full mt-1 h-9 px-3 rounded-lg border text-sm"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-slate-500">Email</label>
                <input
                  type="email"
                  value={editData.email || ""}
                  onChange={(e) => setEditData({ ...editData, email: e.target.value })}
                  className="w-full mt-1 h-9 px-3 rounded-lg border text-sm"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-slate-500">Address</label>
                <input
                  type="text"
                  value={editData.address || ""}
                  onChange={(e) => setEditData({ ...editData, address: e.target.value })}
                  className="w-full mt-1 h-9 px-3 rounded-lg border text-sm"
                />
              </div>
            </>
          ) : (
            <>
              <InfoRow label="Phone" value={client.phone || "Not set"} icon={<Phone className="h-3.5 w-3.5" />} />
              <InfoRow label="Email" value={client.email || "Not set"} icon={<Mail className="h-3.5 w-3.5" />} />
              <InfoRow label="Address" value={client.address || "Not set"} icon={<MapPin className="h-3.5 w-3.5" />} />
            </>
          )}
        </div>
      </div>

      {/* Funding Information */}
      <div className="bg-slate-50 rounded-2xl p-5">
        <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider mb-4 flex items-center gap-2">
          <FileCheck className="h-4 w-4 text-teal-500" /> Funding Details
        </h3>
        <div className="space-y-3">
          <InfoRow label="Funding Type" value={client.funding_type?.replace(/_/g, " ") || "Not set"} />
          {client.ndis_number && <InfoRow label="NDIS Number" value={client.ndis_number} />}
          {client.plan_manager && <InfoRow label="Plan Manager" value={client.plan_manager} />}
          {client.support_coordinator && <InfoRow label="Support Coordinator" value={client.support_coordinator} />}
        </div>
      </div>

      {/* Emergency Contact */}
      <div className="bg-red-50 rounded-2xl p-5 border border-red-100">
        <h3 className="text-sm font-bold text-red-700 uppercase tracking-wider mb-4 flex items-center gap-2">
          <AlertTriangle className="h-4 w-4" /> Emergency Contact
        </h3>
        <div className="space-y-3">
          {isEditing ? (
            <>
              <div>
                <label className="text-xs font-medium text-slate-500">Contact Name</label>
                <input
                  type="text"
                  value={editData.emergency_contact_name || ""}
                  onChange={(e) => setEditData({ ...editData, emergency_contact_name: e.target.value })}
                  className="w-full mt-1 h-9 px-3 rounded-lg border text-sm"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-slate-500">Contact Phone</label>
                <input
                  type="tel"
                  value={editData.emergency_contact_phone || ""}
                  onChange={(e) => setEditData({ ...editData, emergency_contact_phone: e.target.value })}
                  className="w-full mt-1 h-9 px-3 rounded-lg border text-sm"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-slate-500">Relationship</label>
                <input
                  type="text"
                  value={editData.emergency_contact_relationship || ""}
                  onChange={(e) => setEditData({ ...editData, emergency_contact_relationship: e.target.value })}
                  className="w-full mt-1 h-9 px-3 rounded-lg border text-sm"
                />
              </div>
            </>
          ) : (
            <>
              <InfoRow label="Name" value={client.emergency_contact_name || "Not set"} />
              <InfoRow label="Phone" value={client.emergency_contact_phone || "Not set"} />
              <InfoRow label="Relationship" value={client.emergency_contact_relationship || "Not set"} />
            </>
          )}
        </div>
      </div>

      {/* Assigned Staff */}
      {assignedStaff.length > 0 && (
        <div className="bg-purple-50 rounded-2xl p-5 lg:col-span-2">
          <h3 className="text-sm font-bold text-purple-700 uppercase tracking-wider mb-4 flex items-center gap-2">
            <Users className="h-4 w-4" /> Assigned Support Workers
          </h3>
          <div className="flex flex-wrap gap-2">
            {assignedStaff.map((staff: any) => (
              <div
                key={staff.id}
                className="flex items-center gap-2 px-3 py-2 bg-white rounded-xl border border-purple-200"
              >
                <Avatar name={fullName(staff)} size="sm" />
                <span className="text-sm font-medium text-slate-700">{fullName(staff)}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </motion.div>
  );
}

// Care Plan Tab
function CarePlanTab({ client, isEditing }: any) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="space-y-6"
    >
      {/* Goals */}
      <div className="bg-green-50 rounded-2xl p-5 border border-green-100">
        <h3 className="text-sm font-bold text-green-700 uppercase tracking-wider mb-4 flex items-center gap-2">
          <Activity className="h-4 w-4" /> Goals & Objectives
        </h3>
        <div className="space-y-3">
          {client.goals ? (
            <p className="text-sm text-slate-700 whitespace-pre-wrap">{client.goals}</p>
          ) : (
            <p className="text-sm text-slate-400 italic">No goals documented yet</p>
          )}
        </div>
      </div>

      {/* Support Needs */}
      <div className="bg-blue-50 rounded-2xl p-5 border border-blue-100">
        <h3 className="text-sm font-bold text-blue-700 uppercase tracking-wider mb-4 flex items-center gap-2">
          <Heart className="h-4 w-4" /> Support Needs
        </h3>
        <div className="space-y-3">
          {client.support_needs ? (
            <p className="text-sm text-slate-700 whitespace-pre-wrap">{client.support_needs}</p>
          ) : (
            <p className="text-sm text-slate-400 italic">No support needs documented</p>
          )}
        </div>
      </div>

      {/* Medical Information */}
      <div className="bg-red-50 rounded-2xl p-5 border border-red-100">
        <h3 className="text-sm font-bold text-red-700 uppercase tracking-wider mb-4 flex items-center gap-2">
          <AlertTriangle className="h-4 w-4" /> Medical & Health Information
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p className="text-xs font-medium text-slate-500 mb-1">Medical Conditions</p>
            <p className="text-sm text-slate-700">{client.medical_conditions || "None documented"}</p>
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500 mb-1">Allergies</p>
            <p className="text-sm text-slate-700">{client.allergies || "None documented"}</p>
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500 mb-1">Medications</p>
            <p className="text-sm text-slate-700">{client.medications || "None documented"}</p>
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500 mb-1">GP / Doctor</p>
            <p className="text-sm text-slate-700">{client.gp_name || "Not specified"}</p>
          </div>
        </div>
      </div>

      {/* Risk & Safety */}
      <div className="bg-amber-50 rounded-2xl p-5 border border-amber-100">
        <h3 className="text-sm font-bold text-amber-700 uppercase tracking-wider mb-4 flex items-center gap-2">
          <Shield className="h-4 w-4" /> Risk & Safety
        </h3>
        <div className="space-y-3">
          {client.risk_assessment ? (
            <p className="text-sm text-slate-700 whitespace-pre-wrap">{client.risk_assessment}</p>
          ) : (
            <p className="text-sm text-slate-400 italic">No risk assessment documented</p>
          )}
        </div>
      </div>
    </motion.div>
  );
}

// Schedule Tab
function ScheduleTab({ client, shifts }: any) {
  const [weekOffset, setWeekOffset] = useState(0);

  const getWeekDates = () => {
    const today = new Date();
    const start = new Date(today);
    start.setDate(today.getDate() - today.getDay() + 1 + weekOffset * 7);
    return DAYS.map((_, i) => {
      const date = new Date(start);
      date.setDate(start.getDate() + i);
      return date;
    });
  };

  const weekDates = getWeekDates();
  const weekStart = weekDates[0].toLocaleDateString("en-AU", { month: "short", day: "numeric" });
  const weekEnd = weekDates[6].toLocaleDateString("en-AU", { month: "short", day: "numeric" });

  const getShiftsForDay = (date: Date) => {
    const dateStr = date.toISOString().split("T")[0];
    return shifts.filter((s: any) => s.start_time?.startsWith(dateStr));
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="space-y-4"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold text-slate-800">Client Schedule</h3>
        <div className="flex items-center gap-2">
          <span className="text-sm text-slate-500">Time Block: 7am to 7pm</span>
          <PrimaryButton variant="teal" className="ml-4">
            <Plus className="h-4 w-4" /> Add Service
          </PrimaryButton>
        </div>
      </div>

      {/* Week Navigation */}
      <div className="flex items-center justify-center gap-4 py-2">
        <button
          onClick={() => setWeekOffset(weekOffset - 1)}
          className="h-8 w-8 rounded-lg bg-slate-100 hover:bg-slate-200 flex items-center justify-center transition-colors"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <span className="text-sm font-semibold text-slate-700 min-w-[160px] text-center">
          {weekStart} - {weekEnd}
        </span>
        <button
          onClick={() => setWeekOffset(weekOffset + 1)}
          className="h-8 w-8 rounded-lg bg-slate-100 hover:bg-slate-200 flex items-center justify-center transition-colors"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
        {weekOffset !== 0 && (
          <button
            onClick={() => setWeekOffset(0)}
            className="text-xs text-teal-600 hover:underline"
          >
            Today
          </button>
        )}
      </div>

      {/* Weekly Grid */}
      <div className="border rounded-2xl overflow-hidden bg-white">
        {/* Day Headers */}
        <div className="grid grid-cols-7 bg-slate-100 border-b">
          {DAYS.map((day, i) => {
            const date = weekDates[i];
            const isToday = date.toDateString() === new Date().toDateString();
            return (
              <div
                key={day}
                className={`px-2 py-3 text-center border-r last:border-r-0 ${isToday ? "bg-teal-50" : ""}`}
              >
                <p className={`text-xs font-bold uppercase ${isToday ? "text-teal-600" : "text-slate-500"}`}>{day}</p>
                <p className={`text-lg font-bold ${isToday ? "text-teal-600" : "text-slate-700"}`}>
                  {date.getDate()}
                </p>
              </div>
            );
          })}
        </div>

        {/* Schedule Rows */}
        <div className="grid grid-cols-7 min-h-[300px]">
          {DAYS.map((_, i) => {
            const date = weekDates[i];
            const dayShifts = getShiftsForDay(date);
            const isToday = date.toDateString() === new Date().toDateString();

            return (
              <div
                key={i}
                className={`border-r last:border-r-0 p-2 space-y-2 ${isToday ? "bg-teal-50/30" : ""}`}
              >
                {dayShifts.length > 0 ? (
                  dayShifts.map((shift: any) => (
                    <div
                      key={shift.id}
                      className="p-2 rounded-lg bg-teal-100 border border-teal-200 cursor-pointer hover:bg-teal-200 transition-colors"
                    >
                      <p className="text-xs font-bold text-teal-700">
                        {new Date(shift.start_time).toLocaleTimeString("en-AU", { hour: "2-digit", minute: "2-digit" })}
                        {" - "}
                        {new Date(shift.end_time).toLocaleTimeString("en-AU", { hour: "2-digit", minute: "2-digit" })}
                      </p>
                      <p className="text-xs text-teal-600 mt-1">Service</p>
                      {shift.staff && (
                        <p className="text-xs text-slate-500 mt-1">
                          {shift.staff.first_name} {shift.staff.last_name}
                        </p>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="h-full flex items-center justify-center">
                    <button className="text-xs text-slate-400 hover:text-teal-500 transition-colors">
                      + Add
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </motion.div>
  );
}

// Notes Tab
function NotesTab({ client, notes, incidents, isLoading }: any) {
  const [noteText, setNoteText] = useState("");

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="space-y-6"
    >
      {/* Quick Note Entry */}
      <div className="bg-slate-50 rounded-2xl p-4">
        <textarea
          value={noteText}
          onChange={(e) => setNoteText(e.target.value)}
          placeholder="Add a quick note..."
          className="w-full h-20 p-3 rounded-xl border resize-none text-sm"
        />
        <div className="flex justify-end mt-2">
          <PrimaryButton disabled={!noteText.trim()}>
            <Plus className="h-4 w-4" /> Add Note
          </PrimaryButton>
        </div>
      </div>

      {/* Incidents Alert */}
      {incidents.length > 0 && (
        <div className="bg-red-50 rounded-2xl p-4 border border-red-200">
          <h4 className="text-sm font-bold text-red-700 flex items-center gap-2 mb-3">
            <AlertTriangle className="h-4 w-4" /> Recent Incidents ({incidents.length})
          </h4>
          <div className="space-y-2">
            {incidents.slice(0, 3).map((incident: any) => (
              <div key={incident.id} className="bg-white rounded-lg p-3 border border-red-100">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-slate-700">{incident.incident_type}</span>
                  <span className="text-xs text-slate-500">
                    {new Date(incident.incident_date).toLocaleDateString()}
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-1 line-clamp-2">{incident.description}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Notes List */}
      <div>
        <h4 className="text-sm font-bold text-slate-700 mb-3">Case Notes</h4>
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
          </div>
        ) : notes.length > 0 ? (
          <div className="space-y-3">
            {notes.map((note: any) => (
              <div key={note.id} className="bg-white rounded-xl border p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Avatar name={note.staff ? `${note.staff.first_name} ${note.staff.last_name}` : "Unknown"} size="sm" />
                    <span className="text-sm font-medium text-slate-700">
                      {note.staff ? `${note.staff.first_name} ${note.staff.last_name}` : "Unknown"}
                    </span>
                  </div>
                  <span className="text-xs text-slate-400">
                    {new Date(note.created_at).toLocaleString()}
                  </span>
                </div>
                <p className="text-sm text-slate-600">{note.content}</p>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-slate-400">
            <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No notes yet</p>
          </div>
        )}
      </div>
    </motion.div>
  );
}

// Documents Tab
function DocumentsTab({ client }: any) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="space-y-6"
    >
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold text-slate-800">Documents</h3>
        <PrimaryButton variant="teal">
          <Plus className="h-4 w-4" /> Upload Document
        </PrimaryButton>
      </div>

      {/* Document Categories */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[
          { label: "Service Agreement", count: 1, icon: FileCheck },
          { label: "NDIS Plan", count: client.ndis_number ? 1 : 0, icon: FileText },
          { label: "Care Plan", count: 1, icon: Heart },
          { label: "Risk Assessment", count: 1, icon: Shield },
          { label: "Consent Forms", count: 0, icon: FolderOpen },
          { label: "Other Documents", count: 0, icon: FolderOpen },
        ].map((doc) => {
          const Icon = doc.icon;
          return (
            <div
              key={doc.label}
              className="bg-white border rounded-xl p-4 hover:border-teal-300 hover:shadow-sm transition-all cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-teal-50 flex items-center justify-center">
                  <Icon className="h-5 w-5 text-teal-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-700">{doc.label}</p>
                  <p className="text-xs text-slate-400">{doc.count} document{doc.count !== 1 ? "s" : ""}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </motion.div>
  );
}

// Helper component
function InfoRow({ label, value, icon }: { label: string; value: React.ReactNode; icon?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-xs font-medium text-slate-500 flex items-center gap-1.5">
        {icon}
        {label}
      </span>
      <span className="text-sm font-medium text-slate-700">{value}</span>
    </div>
  );
}
