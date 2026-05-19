/**
 * Request Management Page
 * Track client/staff requests with status workflow
 */

import { useState } from "react";
import { AppLayout } from "@/components/AppLayout";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Plus, Search, Filter, Clock, CheckCircle, XCircle, 
  AlertCircle, MessageSquare, User, Calendar, ChevronRight,
  Loader2, FileText, ArrowUpRight, MoreHorizontal
} from "lucide-react";
import { PrimaryButton, SearchInput, Avatar, StatusBadge } from "@/components/ui-kit";
import { format } from "date-fns";
import { toast } from "sonner";
import { fullName } from "@/lib/display-names";

type RequestStatus = "pending" | "in_progress" | "completed" | "cancelled";
type RequestPriority = "low" | "medium" | "high" | "urgent";
type RequestType = "service" | "schedule" | "billing" | "complaint" | "feedback" | "other";

interface Request {
  id: string;
  title: string;
  description: string;
  type: RequestType;
  status: RequestStatus;
  priority: RequestPriority;
  requester_type: "client" | "staff";
  requester_id: string;
  assigned_to?: string;
  created_at: string;
  updated_at: string;
  resolved_at?: string;
  notes?: string;
  // Joined data
  requester?: { first_name: string; last_name: string };
  assignee?: { first_name: string; last_name: string };
}

const STATUS_CONFIG: Record<RequestStatus, { label: string; color: string; icon: React.ElementType }> = {
  pending: { label: "Pending", color: "bg-amber-100 text-amber-700 border-amber-200", icon: Clock },
  in_progress: { label: "In Progress", color: "bg-blue-100 text-blue-700 border-blue-200", icon: ArrowUpRight },
  completed: { label: "Completed", color: "bg-green-100 text-green-700 border-green-200", icon: CheckCircle },
  cancelled: { label: "Cancelled", color: "bg-slate-100 text-slate-500 border-slate-200", icon: XCircle },
};

const PRIORITY_CONFIG: Record<RequestPriority, { label: string; color: string }> = {
  low: { label: "Low", color: "bg-slate-100 text-slate-600" },
  medium: { label: "Medium", color: "bg-blue-100 text-blue-600" },
  high: { label: "High", color: "bg-orange-100 text-orange-600" },
  urgent: { label: "Urgent", color: "bg-red-100 text-red-600" },
};

const TYPE_CONFIG: Record<RequestType, { label: string; color: string }> = {
  service: { label: "Service", color: "text-purple-600" },
  schedule: { label: "Schedule", color: "text-blue-600" },
  billing: { label: "Billing", color: "text-green-600" },
  complaint: { label: "Complaint", color: "text-red-600" },
  feedback: { label: "Feedback", color: "text-amber-600" },
  other: { label: "Other", color: "text-slate-600" },
};

export default function Requests() {
  const { user, isAdmin } = useAuth();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<RequestStatus | "all">("all");
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<Request | null>(null);

  // Fetch requests
  const { data: requests = [], isLoading } = useQuery({
    queryKey: ["requests", statusFilter],
    queryFn: async () => {
      let query = supabase
        .from("requests")
        .select(`
          *,
          requester:clients!requests_requester_id_fkey(first_name, last_name),
          assignee:staff!requests_assigned_to_fkey(first_name, last_name)
        `)
        .order("created_at", { ascending: false });

      if (statusFilter !== "all") {
        query = query.eq("status", statusFilter);
      }

      const { data, error } = await query;
      if (error) {
        // Table might not exist yet, return empty array
        // Table might not exist yet, return empty array silently
        return [];
      }
      return data as Request[];
    },
  });

  // Filter requests by search
  const filteredRequests = requests.filter((req) => {
    const searchLower = search.toLowerCase();
    return (
      req.title?.toLowerCase().includes(searchLower) ||
      req.description?.toLowerCase().includes(searchLower) ||
      req.requester?.first_name?.toLowerCase().includes(searchLower) ||
      req.requester?.last_name?.toLowerCase().includes(searchLower)
    );
  });

  // Update request status
  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: RequestStatus }) => {
      const updates: any = { status, updated_at: new Date().toISOString() };
      if (status === "completed") {
        updates.resolved_at = new Date().toISOString();
      }
      const { error } = await supabase.from("requests").update(updates).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["requests"] });
      toast.success("Request updated");
    },
    onError: () => {
      toast.error("Failed to update request");
    },
  });

  // Stats
  const stats = {
    total: requests.length,
    pending: requests.filter((r) => r.status === "pending").length,
    inProgress: requests.filter((r) => r.status === "in_progress").length,
    completed: requests.filter((r) => r.status === "completed").length,
  };

  return (
    <AppLayout title="Requests">
      <div className="space-y-5">
        {/* Stats Row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <StatCard label="Total Requests" value={stats.total} color="purple" />
          <StatCard label="Pending" value={stats.pending} color="amber" />
          <StatCard label="In Progress" value={stats.inProgress} color="blue" />
          <StatCard label="Completed" value={stats.completed} color="green" />
        </div>

        {/* Toolbar */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <SearchInput
              value={search}
              onChange={setSearch}
              placeholder="Search requests..."
              className="w-full sm:w-64"
              data-testid="requests-search"
            />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as RequestStatus | "all")}
              className="h-9 px-3 rounded-xl border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-400"
              data-testid="requests-status-filter"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="in_progress">In Progress</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
          <PrimaryButton onClick={() => setShowCreateDialog(true)} data-testid="create-request-btn">
            <Plus className="h-4 w-4" /> New Request
          </PrimaryButton>
        </div>

        {/* Requests List */}
        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
          </div>
        ) : filteredRequests.length === 0 ? (
          <div className="bg-white rounded-2xl border p-12 text-center">
            <MessageSquare className="h-12 w-12 text-slate-200 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-slate-700">No requests found</h3>
            <p className="text-sm text-slate-500 mt-1">
              {search ? "Try adjusting your search" : "Create your first request to get started"}
            </p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border overflow-hidden">
            <div className="divide-y divide-slate-100">
              {filteredRequests.map((request) => (
                <RequestRow
                  key={request.id}
                  request={request}
                  onStatusChange={(status) => updateStatusMutation.mutate({ id: request.id, status })}
                  onSelect={() => setSelectedRequest(request)}
                  isAdmin={isAdmin}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Request Detail Modal would go here */}
    </AppLayout>
  );
}

// Request Row Component
function RequestRow({ 
  request, 
  onStatusChange, 
  onSelect, 
  isAdmin 
}: { 
  request: Request; 
  onStatusChange: (status: RequestStatus) => void;
  onSelect: () => void;
  isAdmin: boolean;
}) {
  const statusConfig = STATUS_CONFIG[request.status];
  const priorityConfig = PRIORITY_CONFIG[request.priority];
  const typeConfig = TYPE_CONFIG[request.type];
  const StatusIcon = statusConfig.icon;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="p-4 hover:bg-slate-50 cursor-pointer transition-colors"
      onClick={onSelect}
      data-testid={`request-row-${request.id}`}
    >
      <div className="flex items-start gap-4">
        {/* Status Icon */}
        <div className={`h-10 w-10 rounded-xl flex items-center justify-center ${statusConfig.color} border`}>
          <StatusIcon className="h-5 w-5" />
        </div>

        {/* Main Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h4 className="text-sm font-semibold text-slate-800 truncate">{request.title}</h4>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${priorityConfig.color}`}>
              {priorityConfig.label}
            </span>
            <span className={`text-[10px] font-medium ${typeConfig.color}`}>
              {typeConfig.label}
            </span>
          </div>
          
          <p className="text-xs text-slate-500 mt-1 line-clamp-1">{request.description}</p>
          
          <div className="flex items-center gap-4 mt-2 text-xs text-slate-400">
            {request.requester && (
              <span className="flex items-center gap-1">
                <User className="h-3 w-3" />
                {request.requester.first_name} {request.requester.last_name}
              </span>
            )}
            <span className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              {format(new Date(request.created_at), "MMM d, yyyy")}
            </span>
          </div>
        </div>

        {/* Quick Status Change (Admin only) */}
        {isAdmin && request.status !== "completed" && request.status !== "cancelled" && (
          <div className="flex items-center gap-2">
            {request.status === "pending" && (
              <button
                onClick={(e) => { e.stopPropagation(); onStatusChange("in_progress"); }}
                className="text-xs px-3 py-1.5 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors"
              >
                Start
              </button>
            )}
            {request.status === "in_progress" && (
              <button
                onClick={(e) => { e.stopPropagation(); onStatusChange("completed"); }}
                className="text-xs px-3 py-1.5 rounded-lg bg-green-50 text-green-600 hover:bg-green-100 transition-colors"
              >
                Complete
              </button>
            )}
          </div>
        )}

        <ChevronRight className="h-5 w-5 text-slate-300 flex-shrink-0" />
      </div>
    </motion.div>
  );
}

// Stat Card Component
function StatCard({ label, value, color }: { label: string; value: number; color: string }) {
  const colors: Record<string, string> = {
    purple: "from-purple-500 to-violet-500",
    amber: "from-amber-400 to-orange-500",
    blue: "from-blue-400 to-cyan-500",
    green: "from-green-400 to-emerald-500",
  };

  return (
    <div className="bg-white rounded-xl border p-4">
      <div className="flex items-center gap-3">
        <div className={`h-10 w-10 rounded-xl bg-gradient-to-br ${colors[color]} flex items-center justify-center`}>
          <span className="text-white text-sm font-bold">{value}</span>
        </div>
        <p className="text-xs text-slate-500 font-medium">{label}</p>
      </div>
    </div>
  );
}
