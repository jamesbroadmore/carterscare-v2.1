import { useState, useMemo, useRef, useEffect } from "react";
import { AppLayout } from "@/components/AppLayout";
import { Plus, Search, UserCircle, Users, ChevronRight, ChevronLeft, Phone, MapPin, Calendar, FileText, Heart, FolderOpen, AlertTriangle, Clock, Edit, Save, X, Loader2, Activity, Shield, Mail, FileCheck, PanelLeftClose, PanelLeft, DollarSign } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AddClientDialog } from "@/components/AddClientDialog";
import { EditClientDialog } from "@/components/EditClientDialog";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { fullName } from "@/lib/display-names";
import { Avatar, PrimaryButton, StatusBadge, OutlineButton } from "@/components/ui-kit";

// Tab configuration for workspace
const WORKSPACE_TABS = [
  { key: "overview", label: "Overview", icon: UserCircle },
  { key: "care-plan", label: "Care Plan", icon: Heart },
  { key: "schedule", label: "Schedule", icon: Calendar },
  { key: "notes", label: "Notes", icon: FileText },
  { key: "documents", label: "Documents", icon: FolderOpen },
];

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export default function Clients() {
  const { isAdmin } = useAuth();
  const queryClient = useQueryClient();
  const [showAdd, setShowAdd] = useState(false);
  const [editClient, setEditClient] = useState<any>(null);
  const [selectedClient, setSelectedClient] = useState<any>(null);
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState("overview");
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState<any>({});
  
  // Panel collapse state - always start expanded so list is visible first
  const [isPanelCollapsed, setIsPanelCollapsed] = useState(false);



  // Fetch clients
  const { data: clientsData = [], isLoading } = useQuery({
    queryKey: ["clients"],
    queryFn: async () => {
      const { data, error } = await supabase.from("clients").select("*").order("first_name");
      if (error) throw error;
      return data;
    },
  });

  // Fetch staff assignments
  const { data: assignmentsData = [] } = useQuery({
    queryKey: ["client-staff-assignments"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("client_staff_assignments")
        .select("*, staff:staff_id(id, first_name, last_name)");
      if (error) throw error;
      return data;
    },
  });

  // Group assignments by client
  const assignmentsByClient = useMemo(() => {
    const map: Record<string, any[]> = {};
    assignmentsData.forEach((a: any) => {
      if (!map[a.client_id]) map[a.client_id] = [];
      if (a.staff) map[a.client_id].push(a.staff);
    });
    return map;
  }, [assignmentsData]);

  // Filter clients
  const filteredClients = useMemo(() => {
    if (!search) return clientsData;
    const s = search.toLowerCase();
    return clientsData.filter((c: any) =>
      `${c.first_name} ${c.last_name}`.toLowerCase().includes(s) ||
      c.ndis_number?.toLowerCase().includes(s) ||
      c.phone?.includes(s)
    );
  }, [clientsData, search]);

  // Do NOT auto-select — user should pick from list first

  // Update edit data when client changes
  useEffect(() => {
    if (selectedClient) {
      setEditData({ ...selectedClient });
      setIsEditing(false);
    }
  }, [selectedClient]);

  // Fetch client-specific data
  const { data: clientNotes = [], isLoading: notesLoading } = useQuery({
    queryKey: ["client-notes", selectedClient?.id],
    enabled: !!selectedClient,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("case_notes")
        .select("*, staff:staff_id(first_name, last_name, preferred_name), client:client_id(first_name, last_name, preferred_name)")
        .eq("client_id", selectedClient.id)
        .order("note_date", { ascending: false })
        .limit(20);
      if (error) throw error;
      return data;
    },
  });

  const { data: clientIncidents = [] } = useQuery({
    queryKey: ["client-incidents", selectedClient?.id],
    enabled: !!selectedClient,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("incidents")
        .select("*")
        .eq("client_id", selectedClient.id)
        .order("incident_date", { ascending: false })
        .limit(10);
      if (error) throw error;
      return data;
    },
  });

  const { data: clientShifts = [] } = useQuery({
    queryKey: ["client-shifts", selectedClient?.id],
    enabled: !!selectedClient,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("shifts")
        .select("*, staff:staff_id(first_name, last_name)")
        .eq("client_id", selectedClient.id)
        .gte("start_time", new Date().toISOString().split("T")[0])
        .order("start_time")
        .limit(50);
      if (error) throw error;
      return data;
    },
  });

  // Save mutation
  const saveMutation = useMutation({
    mutationFn: async (data: any) => {
      const { error } = await supabase.from("clients").update(data).eq("id", selectedClient.id);
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

  const assignedStaff = selectedClient ? assignmentsByClient[selectedClient.id] || [] : [];

  return (
    <AppLayout title="Clients">
      <div className="h-[calc(100vh-120px)] flex flex-col lg:flex-row gap-4 relative">
        
        {/* Mobile/Tablet: Floating toggle when panel is collapsed */}
        {isPanelCollapsed && (
          <motion.button
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            onClick={() => setIsPanelCollapsed(false)}
            className="absolute top-0 left-0 z-20 h-10 px-3 rounded-xl bg-gradient-to-r from-teal-500 to-cyan-500 text-white shadow-lg flex items-center gap-2 hover:shadow-xl transition-shadow lg:relative lg:hidden"
            data-testid="expand-client-panel-btn"
          >
            <PanelLeft className="h-4 w-4" />
            <span className="text-sm font-medium">Clients</span>
            <span className="text-xs bg-white/20 px-1.5 py-0.5 rounded-full">{clientsData.length}</span>
          </motion.button>
        )}

        {/* Left Panel - Client List */}
        <AnimatePresence mode="wait">
          {!isPanelCollapsed && (
            <motion.div
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: "auto", opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ duration: 0.2, ease: "easeInOut" }}
              className="w-full lg:w-80 flex-shrink-0 bg-white rounded-2xl border shadow-sm flex flex-col overflow-hidden"
              data-testid="client-list-panel"
            >
              {/* Header */}
              <div className="p-4 border-b bg-gradient-to-r from-teal-500 to-cyan-500">
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-lg font-bold text-white">Clients</h2>
                  <div className="flex items-center gap-2">
                    {isAdmin && (
                      <button
                        onClick={() => setShowAdd(true)}
                        className="h-8 w-8 rounded-lg bg-white/20 hover:bg-white/30 flex items-center justify-center text-white transition-colors"
                        data-testid="add-client-btn"
                      >
                        <Plus className="h-4 w-4" />
                      </button>
                    )}
                    <button
                      onClick={() => setIsPanelCollapsed(true)}
                      className="h-8 w-8 rounded-lg bg-white/20 hover:bg-white/30 flex items-center justify-center text-white transition-colors"
                      title="Collapse panel"
                      data-testid="collapse-client-panel-btn"
                    >
                      <PanelLeftClose className="h-4 w-4" />
                    </button>
                  </div>
                </div>
                {/* Search */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/60" />
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search clients..."
                    className="w-full h-9 pl-9 pr-3 rounded-lg bg-white/20 border border-white/30 text-white placeholder:text-white/60 text-sm focus:outline-none focus:bg-white/30"
                    data-testid="client-search-input"
                  />
                </div>
              </div>

              {/* Client List */}
              <div className="flex-1 overflow-y-auto max-h-[50vh] lg:max-h-none">
                {isLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
                  </div>
                ) : filteredClients.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-8 text-center px-4">
                    <UserCircle className="h-10 w-10 text-slate-300 mb-2" />
                    <p className="text-sm text-slate-500">No clients found</p>
                  </div>
                ) : (
                  <div className="p-2 space-y-1">
                    {filteredClients.map((client: any) => {
                      const isSelected = selectedClient?.id === client.id;
                      return (
                        <button
                          key={client.id}
                          onClick={() => {
                            setSelectedClient(client);
                            // Auto-collapse on mobile after selection
                            if (window.innerWidth < 1024) {
                              setIsPanelCollapsed(true);
                            }
                          }}
                          className={`w-full flex items-center gap-3 p-3 rounded-xl text-left transition-all ${
                            isSelected
                              ? "bg-teal-50 border-2 border-teal-200"
                              : "hover:bg-slate-50 border-2 border-transparent"
                          }`}
                          data-testid={`client-list-item-${client.id}`}
                        >
                          <Avatar name={fullName(client)} size="sm" />
                          <div className="flex-1 min-w-0">
                            <p className={`text-sm font-semibold truncate ${isSelected ? "text-teal-700" : "text-slate-700"}`}>
                              {fullName(client)}
                            </p>
                            <p className="text-xs text-slate-400 truncate">
                              {client.ndis_number || client.phone || "No contact"}
                            </p>
                          </div>
                          <ChevronRight className={`h-4 w-4 flex-shrink-0 ${isSelected ? "text-teal-500" : "text-slate-300"}`} />
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Stats Footer */}
              <div className="p-3 border-t bg-slate-50 text-center">
                <p className="text-xs text-slate-500">
                  <span className="font-semibold text-slate-700">{clientsData.length}</span> total clients
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Right Panel - Client Workspace (Front & Center) */}
        <div className="flex-1 bg-white rounded-2xl border shadow-sm flex flex-col overflow-hidden min-w-0">
          {selectedClient ? (
            <>
              {/* Client Header */}
              <div className="bg-gradient-to-r from-teal-500 to-cyan-500 px-4 sm:px-6 py-4 sm:py-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3 sm:gap-4">
                    {/* Back button on mobile when panel is collapsed */}
                    {isPanelCollapsed && (
                      <button
                        onClick={() => setIsPanelCollapsed(false)}
                        className="h-9 w-9 rounded-xl bg-white/20 hover:bg-white/30 flex items-center justify-center text-white transition-colors lg:hidden"
                        data-testid="back-to-clients-btn"
                      >
                        <ChevronLeft className="h-5 w-5" />
                      </button>
                    )}
                    <Avatar name={fullName(selectedClient)} size="xl" className="ring-4 ring-white/30 hidden sm:flex" />
                    <Avatar name={fullName(selectedClient)} size="lg" className="ring-4 ring-white/30 sm:hidden" />
                    <div className="min-w-0">
                      <h1 className="text-xl sm:text-2xl font-bold text-white truncate">{fullName(selectedClient)}</h1>
                      <div className="flex flex-wrap items-center gap-2 sm:gap-3 mt-1 text-sm text-white/80">
                        {selectedClient.ndis_number && (
                          <span className="flex items-center gap-1">
                            <FileCheck className="h-3.5 w-3.5" /> <span className="hidden sm:inline">NDIS:</span> {selectedClient.ndis_number}
                          </span>
                        )}
                        <StatusBadge status={selectedClient.status} />
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 self-end sm:self-auto">
                    {isAdmin && !isEditing && (
                      <button
                        onClick={() => setIsEditing(true)}
                        className="h-9 sm:h-10 px-3 sm:px-5 rounded-xl bg-white/20 hover:bg-white/30 text-white text-sm font-medium flex items-center gap-2 transition-colors"
                        data-testid="edit-client-btn"
                      >
                        <Edit className="h-4 w-4" /> <span className="hidden sm:inline">Edit Client</span>
                      </button>
                    )}
                    {isEditing && (
                      <>
                        <button
                          onClick={() => setIsEditing(false)}
                          className="h-9 sm:h-10 px-3 sm:px-4 rounded-xl bg-white/20 hover:bg-white/30 text-white text-sm font-medium transition-colors"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={handleSave}
                          disabled={saveMutation.isPending}
                          className="h-9 sm:h-10 px-3 sm:px-5 rounded-xl bg-white text-teal-600 text-sm font-semibold flex items-center gap-2 hover:bg-white/90 transition-colors"
                          data-testid="save-client-btn"
                        >
                          {saveMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                          <span className="hidden sm:inline">Save Changes</span>
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Tabs - Scrollable on mobile */}
              <div className="border-b bg-slate-50 px-2 sm:px-6 overflow-x-auto">
                <div className="flex gap-0.5 sm:gap-1 -mb-px min-w-max">
                  {WORKSPACE_TABS.map((tab) => {
                    const Icon = tab.icon;
                    const isActive = activeTab === tab.key;
                    return (
                      <button
                        key={tab.key}
                        onClick={() => setActiveTab(tab.key)}
                        className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-5 py-3 sm:py-3.5 text-xs sm:text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                          isActive
                            ? "border-teal-500 text-teal-600 bg-white"
                            : "border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-100"
                        }`}
                        data-testid={`tab-${tab.key}`}
                      >
                        <Icon className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                        <span className="hidden xs:inline sm:inline">{tab.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Tab Content */}
              <div className="flex-1 overflow-y-auto p-4 sm:p-6">
                <AnimatePresence mode="wait">
                  {activeTab === "overview" && (
                    <OverviewTab
                      key="overview"
                      client={selectedClient}
                      assignedStaff={assignedStaff}
                      incidents={clientIncidents}
                      shifts={clientShifts}
                      isEditing={isEditing}
                      editData={editData}
                      setEditData={setEditData}
                    />
                  )}
                  {activeTab === "care-plan" && (
                    <CarePlanTab key="care-plan" client={selectedClient} />
                  )}
                  {activeTab === "schedule" && (
                    <ScheduleTab key="schedule" client={selectedClient} shifts={clientShifts} />
                  )}
                  {activeTab === "notes" && (
                    <NotesTab key="notes" client={selectedClient} notes={clientNotes} incidents={clientIncidents} isLoading={notesLoading} />
                  )}
                  {activeTab === "documents" && (
                    <DocumentsTab key="documents" client={selectedClient} />
                  )}
                </AnimatePresence>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center p-4">
              <div className="text-center max-w-xs">
                <div className="h-16 w-16 rounded-2xl bg-teal-50 flex items-center justify-center mx-auto mb-4">
                  <UserCircle className="h-8 w-8 text-teal-400" />
                </div>
                <h3 className="text-base sm:text-lg font-semibold text-slate-700">Select a client</h3>
                <p className="text-sm text-slate-400 mt-1.5">Choose a client from the list on the left to view their full profile, care plan, notes, and schedule.</p>
                {isPanelCollapsed && (
                  <button
                    onClick={() => setIsPanelCollapsed(false)}
                    className="mt-4 h-10 px-4 rounded-xl bg-teal-500 hover:bg-teal-600 text-white text-sm font-medium flex items-center gap-2 mx-auto transition-colors"
                    data-testid="show-clients-btn"
                  >
                    <PanelLeft className="h-4 w-4" />
                    Show Client List
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      <AddClientDialog open={showAdd} onClose={() => setShowAdd(false)} />
      <EditClientDialog open={!!editClient} onClose={() => setEditClient(null)} client={editClient} />
    </AppLayout>
  );
}

// Overview Tab - Quick summary with key info
function OverviewTab({ client, assignedStaff, incidents, shifts, isEditing, editData, setEditData }: any) {
  const upcomingShifts = shifts.filter((s: any) => new Date(s.start_time) > new Date()).slice(0, 3);
  const openIncidents = incidents.filter((i: any) => i.status === "open" || i.status === "investigating");

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="space-y-4 sm:space-y-6"
    >
      {/* Quick Stats - Responsive grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-4">
        <StatCard label="Upcoming Shifts" value={upcomingShifts.length} icon={Calendar} color="blue" />
        <StatCard label="Open Incidents" value={openIncidents.length} icon={AlertTriangle} color={openIncidents.length > 0 ? "red" : "green"} />
        <StatCard label="Assigned Staff" value={assignedStaff.length} icon={Users} color="purple" />
        <StatCard label="Status" value={client.status || "Active"} icon={Activity} color="teal" isText />
      </div>

      {/* Main Content Grid - Responsive */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* Personal Details */}
        <div className="bg-slate-50 rounded-2xl p-4 sm:p-5">
          <h3 className="text-xs sm:text-sm font-bold text-slate-700 uppercase tracking-wider mb-3 sm:mb-4 flex items-center gap-2">
            <UserCircle className="h-4 w-4 text-teal-500" /> Personal Details
          </h3>
          <div className="space-y-2 sm:space-y-3">
            {isEditing ? (
              <>
                <EditableField label="First Name" value={editData.first_name} onChange={(v) => setEditData({...editData, first_name: v})} />
                <EditableField label="Last Name" value={editData.last_name} onChange={(v) => setEditData({...editData, last_name: v})} />
                <EditableField label="Preferred Name" value={editData.preferred_name} onChange={(v) => setEditData({...editData, preferred_name: v})} />
                <EditableField label="Date of Birth" value={editData.date_of_birth} onChange={(v) => setEditData({...editData, date_of_birth: v})} type="date" />
              </>
            ) : (
              <>
                <InfoRow label="Full Name" value={fullName(client)} />
                {client.preferred_name && <InfoRow label="Preferred Name" value={client.preferred_name} />}
                <InfoRow label="Date of Birth" value={client.date_of_birth || "Not set"} />
                <InfoRow label="Gender" value={client.gender || "Not specified"} />
              </>
            )}
          </div>
        </div>

        {/* Contact Information */}
        <div className="bg-slate-50 rounded-2xl p-4 sm:p-5">
          <h3 className="text-xs sm:text-sm font-bold text-slate-700 uppercase tracking-wider mb-3 sm:mb-4 flex items-center gap-2">
            <Phone className="h-4 w-4 text-teal-500" /> Contact Information
          </h3>
          <div className="space-y-2 sm:space-y-3">
            {isEditing ? (
              <>
                <EditableField label="Phone" value={editData.phone} onChange={(v) => setEditData({...editData, phone: v})} />
                <EditableField label="Email" value={editData.email} onChange={(v) => setEditData({...editData, email: v})} type="email" />
                <EditableField label="Address" value={editData.address} onChange={(v) => setEditData({...editData, address: v})} />
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

        {/* Emergency Contact */}
        <div className="bg-red-50 rounded-2xl p-4 sm:p-5 border border-red-100">
          <h3 className="text-xs sm:text-sm font-bold text-red-700 uppercase tracking-wider mb-3 sm:mb-4 flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" /> Emergency Contact
          </h3>
          <div className="space-y-2 sm:space-y-3">
            {isEditing ? (
              <>
                <EditableField label="Contact Name" value={editData.emergency_contact_name} onChange={(v) => setEditData({...editData, emergency_contact_name: v})} />
                <EditableField label="Contact Phone" value={editData.emergency_contact_phone} onChange={(v) => setEditData({...editData, emergency_contact_phone: v})} />
                <EditableField label="Relationship" value={editData.emergency_contact_relationship} onChange={(v) => setEditData({...editData, emergency_contact_relationship: v})} />
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

        {/* Funding Details */}
        <div className="bg-blue-50 rounded-2xl p-4 sm:p-5 border border-blue-100">
          <h3 className="text-xs sm:text-sm font-bold text-blue-700 uppercase tracking-wider mb-3 sm:mb-4 flex items-center gap-2">
            <FileCheck className="h-4 w-4" /> Funding Details
          </h3>
          <div className="space-y-2 sm:space-y-3">
            <InfoRow label="Funding Type" value={client.funding_type?.replace(/_/g, " ") || "Not set"} />
            {client.ndis_number && <InfoRow label="NDIS Number" value={client.ndis_number} />}
            {client.plan_manager && <InfoRow label="Plan Manager" value={client.plan_manager} />}
            {client.support_coordinator && <InfoRow label="Support Coordinator" value={client.support_coordinator} />}
          </div>
        </div>

        {/* Pricing / Hourly Rates */}
        <div className="bg-emerald-50 rounded-2xl p-4 sm:p-5 border border-emerald-100">
          <h3 className="text-xs sm:text-sm font-bold text-emerald-700 uppercase tracking-wider mb-3 sm:mb-4 flex items-center gap-2">
            <DollarSign className="h-4 w-4" /> Hourly Rates
          </h3>
          {isEditing ? (
            <div className="grid grid-cols-2 gap-3">
              <EditableField label="Weekday Rate" value={editData.rate_weekday ?? ""} onChange={(v: string) => setEditData({...editData, rate_weekday: v ? parseFloat(v) : null})} type="number" />
              <EditableField label="Saturday Rate" value={editData.rate_saturday ?? ""} onChange={(v: string) => setEditData({...editData, rate_saturday: v ? parseFloat(v) : null})} type="number" />
              <EditableField label="Sunday Rate" value={editData.rate_sunday ?? ""} onChange={(v: string) => setEditData({...editData, rate_sunday: v ? parseFloat(v) : null})} type="number" />
              <EditableField label="Public Holiday Rate" value={editData.rate_public_holiday ?? ""} onChange={(v: string) => setEditData({...editData, rate_public_holiday: v ? parseFloat(v) : null})} type="number" />
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2 sm:gap-3">
              <InfoRow label="Weekday" value={client.rate_weekday != null ? `${Number(client.rate_weekday).toFixed(2)}/hr` : "Not set"} />
              <InfoRow label="Saturday" value={client.rate_saturday != null ? `${Number(client.rate_saturday).toFixed(2)}/hr` : "Not set"} />
              <InfoRow label="Sunday" value={client.rate_sunday != null ? `${Number(client.rate_sunday).toFixed(2)}/hr` : "Not set"} />
              <InfoRow label="Public Holiday" value={client.rate_public_holiday != null ? `${Number(client.rate_public_holiday).toFixed(2)}/hr` : "Not set"} />
            </div>
          )}
        </div>
      </div>

      {/* Upcoming Shifts - Responsive */}
      {upcomingShifts.length > 0 && (
        <div className="bg-white border rounded-2xl p-4 sm:p-5">
          <h3 className="text-xs sm:text-sm font-bold text-slate-700 uppercase tracking-wider mb-3 sm:mb-4 flex items-center gap-2">
            <Calendar className="h-4 w-4 text-blue-500" /> Upcoming Shifts
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-3">
            {upcomingShifts.map((shift: any) => (
              <div key={shift.id} className="bg-blue-50 rounded-xl p-3 border border-blue-100">
                <p className="text-xs font-bold text-blue-700">
                  {new Date(shift.start_time).toLocaleDateString("en-AU", { weekday: "short", month: "short", day: "numeric" })}
                </p>
                <p className="text-sm text-slate-600 mt-1">
                  {new Date(shift.start_time).toLocaleTimeString("en-AU", { hour: "2-digit", minute: "2-digit" })} - {new Date(shift.end_time).toLocaleTimeString("en-AU", { hour: "2-digit", minute: "2-digit" })}
                </p>
                {shift.staff && (
                  <p className="text-xs text-slate-400 mt-1">{shift.staff.first_name} {shift.staff.last_name}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Assigned Staff */}
      {assignedStaff.length > 0 && (
        <div className="bg-purple-50 rounded-2xl p-4 sm:p-5 border border-purple-100">
          <h3 className="text-xs sm:text-sm font-bold text-purple-700 uppercase tracking-wider mb-3 sm:mb-4 flex items-center gap-2">
            <Users className="h-4 w-4" /> Assigned Support Workers
          </h3>
          <div className="flex flex-wrap gap-2">
            {assignedStaff.map((staff: any) => (
              <div key={staff.id} className="flex items-center gap-2 px-3 py-2 bg-white rounded-xl border border-purple-200">
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
function CarePlanTab({ client }: any) {
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-4 sm:space-y-6">
      <div className="bg-green-50 rounded-2xl p-4 sm:p-5 border border-green-100">
        <h3 className="text-xs sm:text-sm font-bold text-green-700 uppercase tracking-wider mb-3 sm:mb-4 flex items-center gap-2">
          <Activity className="h-4 w-4" /> Goals & Objectives
        </h3>
        <p className="text-xs sm:text-sm text-slate-700 whitespace-pre-wrap">{client.goals || "No goals documented yet"}</p>
      </div>

      <div className="bg-blue-50 rounded-2xl p-4 sm:p-5 border border-blue-100">
        <h3 className="text-xs sm:text-sm font-bold text-blue-700 uppercase tracking-wider mb-3 sm:mb-4 flex items-center gap-2">
          <Heart className="h-4 w-4" /> Support Needs
        </h3>
        <p className="text-xs sm:text-sm text-slate-700 whitespace-pre-wrap">{client.support_needs || "No support needs documented"}</p>
      </div>

      <div className="bg-red-50 rounded-2xl p-4 sm:p-5 border border-red-100">
        <h3 className="text-xs sm:text-sm font-bold text-red-700 uppercase tracking-wider mb-3 sm:mb-4 flex items-center gap-2">
          <AlertTriangle className="h-4 w-4" /> Medical & Health
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
          <div><p className="text-[10px] sm:text-xs font-medium text-slate-500 mb-1">Medical Conditions</p><p className="text-xs sm:text-sm text-slate-700">{client.medical_conditions || "None"}</p></div>
          <div><p className="text-[10px] sm:text-xs font-medium text-slate-500 mb-1">Allergies</p><p className="text-xs sm:text-sm text-slate-700">{client.allergies || "None"}</p></div>
          <div><p className="text-[10px] sm:text-xs font-medium text-slate-500 mb-1">Medications</p><p className="text-xs sm:text-sm text-slate-700">{client.medications || "None"}</p></div>
          <div><p className="text-[10px] sm:text-xs font-medium text-slate-500 mb-1">GP</p><p className="text-xs sm:text-sm text-slate-700">{client.gp_name || "Not specified"}</p></div>
        </div>
      </div>

      <div className="bg-amber-50 rounded-2xl p-4 sm:p-5 border border-amber-100">
        <h3 className="text-xs sm:text-sm font-bold text-amber-700 uppercase tracking-wider mb-3 sm:mb-4 flex items-center gap-2">
          <Shield className="h-4 w-4" /> Risk & Safety
        </h3>
        <p className="text-xs sm:text-sm text-slate-700 whitespace-pre-wrap">{client.risk_assessment || "No risk assessment documented"}</p>
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
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <h3 className="text-base sm:text-lg font-bold text-slate-800">Weekly Schedule</h3>
        <div className="flex flex-wrap items-center gap-2 sm:gap-4">
          <div className="flex items-center gap-2">
            <button onClick={() => setWeekOffset(weekOffset - 1)} className="h-8 w-8 rounded-lg bg-slate-100 hover:bg-slate-200 flex items-center justify-center">←</button>
            <span className="text-xs sm:text-sm font-semibold text-slate-700 min-w-[100px] sm:min-w-[140px] text-center">{weekStart} - {weekEnd}</span>
            <button onClick={() => setWeekOffset(weekOffset + 1)} className="h-8 w-8 rounded-lg bg-slate-100 hover:bg-slate-200 flex items-center justify-center">→</button>
            {weekOffset !== 0 && <button onClick={() => setWeekOffset(0)} className="text-xs text-teal-600 hover:underline">Today</button>}
          </div>
          <PrimaryButton variant="teal" className="text-xs sm:text-sm"><Plus className="h-4 w-4" /> <span className="hidden sm:inline">Add Service</span></PrimaryButton>
        </div>
      </div>

      {/* Mobile: Vertical list view */}
      <div className="block lg:hidden space-y-2">
        {DAYS.map((day, i) => {
          const date = weekDates[i];
          const dayShifts = getShiftsForDay(date);
          const isToday = date.toDateString() === new Date().toDateString();
          return (
            <div key={day} className={`border rounded-xl p-3 ${isToday ? "bg-teal-50 border-teal-200" : "bg-white"}`}>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className={`text-xs font-bold uppercase ${isToday ? "text-teal-600" : "text-slate-500"}`}>{day}</span>
                  <span className={`text-sm font-bold ${isToday ? "text-teal-600" : "text-slate-700"}`}>{date.getDate()}</span>
                </div>
                {dayShifts.length > 0 && (
                  <span className="text-xs bg-teal-100 text-teal-700 px-2 py-0.5 rounded-full">{dayShifts.length} shift{dayShifts.length > 1 ? "s" : ""}</span>
                )}
              </div>
              {dayShifts.length > 0 ? (
                <div className="space-y-1">
                  {dayShifts.map((shift: any) => (
                    <div key={shift.id} className="p-2 rounded-lg bg-teal-100 border border-teal-200">
                      <p className="text-xs font-bold text-teal-700">
                        {new Date(shift.start_time).toLocaleTimeString("en-AU", { hour: "2-digit", minute: "2-digit" })} - {new Date(shift.end_time).toLocaleTimeString("en-AU", { hour: "2-digit", minute: "2-digit" })}
                      </p>
                      <p className="text-xs text-teal-600">{shift.service_type || "Service"}</p>
                      {shift.staff && <p className="text-xs text-slate-500">{shift.staff.first_name}</p>}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-400 text-center py-2">No shifts</p>
              )}
            </div>
          );
        })}
      </div>

      {/* Desktop: Grid view */}
      <div className="hidden lg:block border rounded-2xl overflow-hidden bg-white">
        <div className="grid grid-cols-7 bg-slate-100 border-b">
          {DAYS.map((day, i) => {
            const date = weekDates[i];
            const isToday = date.toDateString() === new Date().toDateString();
            return (
              <div key={day} className={`px-2 py-3 text-center border-r last:border-r-0 ${isToday ? "bg-teal-50" : ""}`}>
                <p className={`text-xs font-bold uppercase ${isToday ? "text-teal-600" : "text-slate-500"}`}>{day}</p>
                <p className={`text-xl font-bold ${isToday ? "text-teal-600" : "text-slate-700"}`}>{date.getDate()}</p>
              </div>
            );
          })}
        </div>
        <div className="grid grid-cols-7 min-h-[350px]">
          {DAYS.map((_, i) => {
            const date = weekDates[i];
            const dayShifts = getShiftsForDay(date);
            const isToday = date.toDateString() === new Date().toDateString();
            return (
              <div key={i} className={`border-r last:border-r-0 p-2 space-y-2 ${isToday ? "bg-teal-50/30" : ""}`}>
                {dayShifts.length > 0 ? dayShifts.map((shift: any) => (
                  <div key={shift.id} className="p-2.5 rounded-lg bg-teal-100 border border-teal-200 cursor-pointer hover:bg-teal-200 transition-colors">
                    <p className="text-xs font-bold text-teal-700">{new Date(shift.start_time).toLocaleTimeString("en-AU", { hour: "2-digit", minute: "2-digit" })} - {new Date(shift.end_time).toLocaleTimeString("en-AU", { hour: "2-digit", minute: "2-digit" })}</p>
                    <p className="text-xs text-teal-600 mt-1">{shift.service_type || "Service"}</p>
                    {shift.staff && <p className="text-xs text-slate-500 mt-1">{shift.staff.first_name}</p>}
                  </div>
                )) : (
                  <div className="h-full flex items-center justify-center min-h-[100px]">
                    <button className="text-xs text-slate-400 hover:text-teal-500 transition-colors">+ Add</button>
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
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-4 sm:space-y-6">
      <div className="bg-slate-50 rounded-2xl p-3 sm:p-4">
        <textarea value={noteText} onChange={(e) => setNoteText(e.target.value)} placeholder="Add a quick note..." className="w-full h-16 sm:h-20 p-3 rounded-xl border resize-none text-sm" />
        <div className="flex justify-end mt-2"><PrimaryButton disabled={!noteText.trim()} className="text-xs sm:text-sm"><Plus className="h-4 w-4" /> Add Note</PrimaryButton></div>
      </div>

      {incidents.length > 0 && (
        <div className="bg-red-50 rounded-2xl p-3 sm:p-4 border border-red-200">
          <h4 className="text-xs sm:text-sm font-bold text-red-700 flex items-center gap-2 mb-3"><AlertTriangle className="h-4 w-4" /> Recent Incidents ({incidents.length})</h4>
          <div className="space-y-2">
            {incidents.slice(0, 3).map((incident: any) => (
              <div key={incident.id} className="bg-white rounded-lg p-2 sm:p-3 border border-red-100">
                <div className="flex items-center justify-between">
                  <span className="text-xs sm:text-sm font-medium text-slate-700">{incident.incident_type}</span>
                  <span className="text-[10px] sm:text-xs text-slate-500">{new Date(incident.incident_date).toLocaleDateString()}</span>
                </div>
                <p className="text-[10px] sm:text-xs text-slate-500 mt-1 line-clamp-2">{incident.description}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      <div>
        <h4 className="text-xs sm:text-sm font-bold text-slate-700 mb-3">Case Notes</h4>
        <p className="text-[10px] sm:text-xs text-slate-400 mb-3">Visible to assigned staff, managers and admin based on note visibility.</p>
        {isLoading ? (
          <div className="flex items-center justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-slate-400" /></div>
        ) : notes.length > 0 ? (
          <div className="space-y-2 sm:space-y-3">
            {notes.map((note: any) => (
              <div key={note.id} className="bg-white rounded-xl border p-3 sm:p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Avatar name={note.staff ? `${note.staff.first_name} ${note.staff.last_name}` : "Unknown"} size="sm" />
                    <span className="text-xs sm:text-sm font-medium text-slate-700">{note.staff ? `${note.staff.first_name} ${note.staff.last_name}` : "Unknown"}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] sm:text-xs text-slate-400 block">{new Date(note.note_date || note.created_at).toLocaleString()}</span>
                    <span className="text-[10px] font-semibold uppercase tracking-wide text-teal-600">{(note.category || "general").replace(/_/g, " ")}</span>
                  </div>
                </div>
                <p className="text-xs sm:text-sm text-slate-600">{note.content}</p>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-slate-400"><FileText className="h-8 w-8 mx-auto mb-2 opacity-50" /><p className="text-sm">No notes yet</p></div>
        )}
      </div>
    </motion.div>
  );
}

// Documents Tab
function DocumentsTab({ client }: any) {
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <h3 className="text-base sm:text-lg font-bold text-slate-800">Documents</h3>
        <PrimaryButton variant="teal" className="text-xs sm:text-sm w-full sm:w-auto"><Plus className="h-4 w-4" /> Upload Document</PrimaryButton>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
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
            <div key={doc.label} className="bg-white border rounded-xl p-3 sm:p-4 hover:border-teal-300 hover:shadow-sm transition-all cursor-pointer">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 sm:h-10 sm:w-10 rounded-lg bg-teal-50 flex items-center justify-center"><Icon className="h-4 w-4 sm:h-5 sm:w-5 text-teal-600" /></div>
                <div><p className="text-xs sm:text-sm font-medium text-slate-700">{doc.label}</p><p className="text-[10px] sm:text-xs text-slate-400">{doc.count} document{doc.count !== 1 ? "s" : ""}</p></div>
              </div>
            </div>
          );
        })}
      </div>
    </motion.div>
  );
}

// Helper Components
function StatCard({ label, value, icon: Icon, color, isText }: any) {
  const colors: Record<string, string> = {
    blue: "bg-blue-50 text-blue-600 border-blue-100",
    red: "bg-red-50 text-red-600 border-red-100",
    green: "bg-green-50 text-green-600 border-green-100",
    purple: "bg-purple-50 text-purple-600 border-purple-100",
    teal: "bg-teal-50 text-teal-600 border-teal-100",
  };
  return (
    <div className={`rounded-xl p-3 sm:p-4 border ${colors[color]}`}>
      <div className="flex items-center justify-between">
        <Icon className="h-4 w-4 sm:h-5 sm:w-5" />
        <span className={`${isText ? "text-xs sm:text-sm font-semibold capitalize" : "text-xl sm:text-2xl font-bold"}`}>{value}</span>
      </div>
      <p className="text-[10px] sm:text-xs mt-1.5 sm:mt-2 opacity-80 truncate">{label}</p>
    </div>
  );
}

function InfoRow({ label, value, icon }: { label: string; value: React.ReactNode; icon?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-xs font-medium text-slate-500 flex items-center gap-1.5">{icon}{label}</span>
      <span className="text-sm font-medium text-slate-700">{value}</span>
    </div>
  );
}

function EditableField({ label, value, onChange, type = "text" }: any) {
  return (
    <div>
      <label className="text-xs font-medium text-slate-500">{label}</label>
      <input type={type} value={value || ""} onChange={(e) => onChange(e.target.value)} className="w-full mt-1 h-9 px-3 rounded-lg border text-sm" />
    </div>
  );
}
