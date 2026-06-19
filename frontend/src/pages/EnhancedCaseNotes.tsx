/**
 * Enhanced Case Notes Page
 * Video uploads, album-style layout for images/videos, tick-box checklists
 */

import { useState, useRef } from "react";
import { AppLayout } from "@/components/AppLayout";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus, Search, Filter, Image, Video, FileText, Calendar,
  User, ChevronRight, Loader2, Check, X, Upload, Play,
  Camera, Paperclip, Clock, CheckSquare, Square, MoreHorizontal,
  Download, Trash2, Eye, Grid, List, Heart
} from "lucide-react";
import { PrimaryButton, SearchInput, Avatar, OutlineButton } from "@/components/ui-kit";
import { format } from "date-fns";
import { toast } from "sonner";
import { fullName } from "@/lib/display-names";

// Checklist templates for quick note entry
const CHECKLIST_TEMPLATES = {
  daily_care: [
    { id: "medication", label: "Medication administered", checked: false },
    { id: "meals", label: "Meals provided", checked: false },
    { id: "hygiene", label: "Personal hygiene assistance", checked: false },
    { id: "mobility", label: "Mobility support", checked: false },
    { id: "vitals", label: "Vitals checked", checked: false },
  ],
  cleaning: [
    { id: "kitchen", label: "Kitchen cleaned", checked: false },
    { id: "bathroom", label: "Bathroom cleaned", checked: false },
    { id: "bedroom", label: "Bedroom tidied", checked: false },
    { id: "laundry", label: "Laundry done", checked: false },
    { id: "general", label: "General cleaning", checked: false },
  ],
  social: [
    { id: "conversation", label: "Had conversation", checked: false },
    { id: "activity", label: "Engaged in activity", checked: false },
    { id: "outing", label: "Went on outing", checked: false },
    { id: "exercise", label: "Exercise/movement", checked: false },
  ],
};

type NoteType = "general" | "daily_care" | "incident" | "progress" | "medical";
type ViewMode = "list" | "album";

interface CaseNote {
  id: string;
  client_id: string;
  staff_id: string;
  note_type: NoteType;
  content: string;
  summary?: string;
  checklist?: { id: string; label: string; checked: boolean }[];
  attachments?: { type: "image" | "video" | "document"; url: string; name: string }[];
  is_visible_to_client: boolean;
  created_at: string;
  // Joined data
  client?: { first_name: string; last_name: string; preferred_name?: string };
  staff?: { first_name: string; last_name: string };
}

export default function EnhancedCaseNotes() {
  const { user, isAdmin } = useAuth();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [selectedClient, setSelectedClient] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [showAddNote, setShowAddNote] = useState(false);
  const [selectedNote, setSelectedNote] = useState<CaseNote | null>(null);
  const [mediaLightbox, setMediaLightbox] = useState<{ type: string; url: string } | null>(null);

  // Fetch clients for filter
  const { data: clients = [] } = useQuery({
    queryKey: ["clients-for-notes"],
    queryFn: async () => {
      const { data } = await supabase
        .from("clients")
        .select("id, first_name, last_name, preferred_name")
        .eq("status", "active")
        .order("first_name");
      return data || [];
    },
  });

  // Fetch case notes
  const { data: notes = [], isLoading } = useQuery({
    queryKey: ["enhanced-case-notes", selectedClient],
    queryFn: async () => {
      let query = supabase
        .from("case_notes")
        .select(`
          *,
          client:client_id(first_name, last_name, preferred_name),
          staff:staff_id(first_name, last_name)
        `)
        .order("created_at", { ascending: false });

      if (selectedClient) {
        query = query.eq("client_id", selectedClient);
      }

      const { data, error } = await query.limit(100);
      if (error) {
        console.error("Error fetching notes:", error);
        return [];
      }
      return data as CaseNote[];
    },
  });

  // Filter notes by search
  const filteredNotes = notes.filter((note) => {
    const searchLower = search.toLowerCase();
    return (
      note.content?.toLowerCase().includes(searchLower) ||
      note.summary?.toLowerCase().includes(searchLower) ||
      note.client?.first_name?.toLowerCase().includes(searchLower) ||
      note.client?.last_name?.toLowerCase().includes(searchLower)
    );
  });

  // Get all media from notes for album view
  const allMedia = filteredNotes.flatMap((note) => 
    (note.attachments || []).map((att) => ({
      ...att,
      noteId: note.id,
      clientName: note.client ? fullName(note.client) : "Unknown",
      date: note.created_at,
    }))
  );

  // Group media by date for album view
  const mediaByDate = allMedia.reduce((acc, media) => {
    const date = format(new Date(media.date), "yyyy-MM-dd");
    if (!acc[date]) acc[date] = [];
    acc[date].push(media);
    return acc;
  }, {} as Record<string, typeof allMedia>);

  return (
    <AppLayout title="Case Notes">
      <div className="space-y-5">
        {/* Toolbar */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-3">
            <SearchInput
              value={search}
              onChange={setSearch}
              placeholder="Search notes..."
              className="w-full sm:w-64"
              data-testid="notes-search"
            />
            <select
              value={selectedClient || ""}
              onChange={(e) => setSelectedClient(e.target.value || null)}
              className="h-9 px-3 rounded-xl border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-400"
              data-testid="notes-client-filter"
            >
              <option value="">All Clients</option>
              {clients.map((client: any) => (
                <option key={client.id} value={client.id}>
                  {client.preferred_name || client.first_name} {client.last_name}
                </option>
              ))}
            </select>
            {/* View Mode Toggle */}
            <div className="flex items-center rounded-xl border border-slate-200 bg-white overflow-hidden">
              <button
                onClick={() => setViewMode("list")}
                className={`h-9 px-3 flex items-center gap-1 text-sm ${
                  viewMode === "list" ? "bg-purple-100 text-purple-700" : "text-slate-500"
                }`}
                data-testid="view-mode-list"
              >
                <List className="h-4 w-4" />
              </button>
              <button
                onClick={() => setViewMode("album")}
                className={`h-9 px-3 flex items-center gap-1 text-sm ${
                  viewMode === "album" ? "bg-purple-100 text-purple-700" : "text-slate-500"
                }`}
                data-testid="view-mode-album"
              >
                <Grid className="h-4 w-4" />
              </button>
            </div>
          </div>
          <PrimaryButton onClick={() => setShowAddNote(true)} data-testid="add-note-btn">
            <Plus className="h-4 w-4" /> Add Note
          </PrimaryButton>
        </div>

        {/* Content */}
        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
          </div>
        ) : viewMode === "list" ? (
          /* List View */
          filteredNotes.length === 0 ? (
            <EmptyState />
          ) : (
            <div className="space-y-3">
              {filteredNotes.map((note) => (
                <NoteCard
                  key={note.id}
                  note={note}
                  onClick={() => setSelectedNote(note)}
                  onMediaClick={setMediaLightbox}
                />
              ))}
            </div>
          )
        ) : (
          /* Album View */
          Object.keys(mediaByDate).length === 0 ? (
            <div className="bg-white rounded-2xl border p-12 text-center">
              <Image className="h-12 w-12 text-slate-200 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-slate-700">No media found</h3>
              <p className="text-sm text-slate-500 mt-1">Add photos or videos to your case notes</p>
            </div>
          ) : (
            <div className="space-y-6">
              {Object.entries(mediaByDate).sort((a, b) => b[0].localeCompare(a[0])).map(([date, media]) => (
                <div key={date}>
                  <h3 className="text-sm font-bold text-slate-700 mb-3 flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-purple-500" />
                    {format(new Date(date), "EEEE, MMMM d, yyyy")}
                  </h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
                    {media.map((item, index) => (
                      <motion.div
                        key={`${item.noteId}-${index}`}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="relative aspect-square rounded-xl overflow-hidden bg-slate-100 cursor-pointer group"
                        onClick={() => setMediaLightbox({ type: item.type, url: item.url })}
                      >
                        {item.type === "image" ? (
                          <img
                            src={item.url}
                            alt={item.name}
                            className="w-full h-full object-cover"
                          />
                        ) : item.type === "video" ? (
                          <div className="w-full h-full bg-slate-800 flex items-center justify-center">
                            <Play className="h-10 w-10 text-white" />
                          </div>
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <FileText className="h-10 w-10 text-slate-400" />
                          </div>
                        )}
                        {/* Overlay */}
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-end">
                          <div className="p-2 w-full opacity-0 group-hover:opacity-100 transition-opacity">
                            <p className="text-xs text-white font-medium truncate">{item.clientName}</p>
                          </div>
                        </div>
                        {/* Type badge */}
                        <div className="absolute top-2 right-2">
                          {item.type === "video" && (
                            <div className="h-6 w-6 rounded-full bg-black/50 flex items-center justify-center">
                              <Video className="h-3 w-3 text-white" />
                            </div>
                          )}
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )
        )}
      </div>

      {/* Add Note Dialog */}
      <AddNoteDialog
        open={showAddNote}
        onClose={() => setShowAddNote(false)}
        clients={clients}
      />

      {/* Media Lightbox */}
      <AnimatePresence>
        {mediaLightbox && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
            onClick={() => setMediaLightbox(null)}
          >
            <button
              className="absolute top-4 right-4 h-10 w-10 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-white/20"
              onClick={() => setMediaLightbox(null)}
            >
              <X className="h-5 w-5" />
            </button>
            {mediaLightbox.type === "image" ? (
              <img
                src={mediaLightbox.url}
                alt="Full size"
                className="max-w-full max-h-full object-contain rounded-lg"
                onClick={(e) => e.stopPropagation()}
              />
            ) : mediaLightbox.type === "video" ? (
              <video
                src={mediaLightbox.url}
                controls
                autoPlay
                className="max-w-full max-h-full rounded-lg"
                onClick={(e) => e.stopPropagation()}
              />
            ) : null}
          </motion.div>
        )}
      </AnimatePresence>
    </AppLayout>
  );
}

// Note Card Component
function NoteCard({ 
  note, 
  onClick, 
  onMediaClick 
}: { 
  note: CaseNote; 
  onClick: () => void;
  onMediaClick: (media: { type: string; url: string }) => void;
}) {
  const hasMedia = note.attachments && note.attachments.length > 0;
  const hasChecklist = note.checklist && note.checklist.length > 0;
  const completedItems = note.checklist?.filter(item => item.checked).length || 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-2xl border p-4 hover:shadow-md transition-shadow cursor-pointer"
      onClick={onClick}
      data-testid={`note-card-${note.id}`}
    >
      <div className="flex items-start gap-4">
        {/* Avatar */}
        <Avatar name={note.client ? fullName(note.client) : "?"} size="md" />

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-sm font-semibold text-slate-800">
              {note.client ? fullName(note.client) : "Unknown Client"}
            </span>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
              note.note_type === "incident" ? "bg-red-100 text-red-600" :
              note.note_type === "medical" ? "bg-blue-100 text-blue-600" :
              note.note_type === "progress" ? "bg-green-100 text-green-600" :
              "bg-purple-100 text-purple-600"
            }`}>
              {note.note_type?.replace(/_/g, " ")}
            </span>
          </div>

          <p className="text-sm text-slate-600 line-clamp-2 mb-2">
            {note.summary || note.content}
          </p>

          {/* Checklist Preview */}
          {hasChecklist && (
            <div className="flex items-center gap-2 text-xs text-slate-500 mb-2">
              <CheckSquare className="h-3 w-3" />
              {completedItems}/{note.checklist?.length} tasks completed
            </div>
          )}

          {/* Media Preview */}
          {hasMedia && (
            <div className="flex gap-2 mb-2">
              {note.attachments?.slice(0, 4).map((att, idx) => (
                <div
                  key={idx}
                  onClick={(e) => { e.stopPropagation(); onMediaClick({ type: att.type, url: att.url }); }}
                  className="h-12 w-12 rounded-lg overflow-hidden bg-slate-100 flex items-center justify-center cursor-pointer hover:opacity-80 transition-opacity"
                >
                  {att.type === "image" ? (
                    <img src={att.url} alt="" className="w-full h-full object-cover" />
                  ) : att.type === "video" ? (
                    <Video className="h-5 w-5 text-slate-400" />
                  ) : (
                    <FileText className="h-5 w-5 text-slate-400" />
                  )}
                </div>
              ))}
              {note.attachments && note.attachments.length > 4 && (
                <div className="h-12 w-12 rounded-lg bg-slate-100 flex items-center justify-center text-xs font-medium text-slate-500">
                  +{note.attachments.length - 4}
                </div>
              )}
            </div>
          )}

          {/* Meta */}
          <div className="flex items-center gap-4 text-xs text-slate-400">
            <span className="flex items-center gap-1">
              <User className="h-3 w-3" />
              {note.staff ? `${note.staff.first_name} ${note.staff.last_name}` : "Unknown"}
            </span>
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {format(new Date(note.created_at), "MMM d, h:mm a")}
            </span>
            {note.is_visible_to_client && (
              <span className="flex items-center gap-1 text-teal-500">
                <Eye className="h-3 w-3" /> Visible to client
              </span>
            )}
          </div>
        </div>

        <ChevronRight className="h-5 w-5 text-slate-300 flex-shrink-0" />
      </div>
    </motion.div>
  );
}

// Empty State
function EmptyState() {
  return (
    <div className="bg-white rounded-2xl border p-12 text-center">
      <FileText className="h-12 w-12 text-slate-200 mx-auto mb-4" />
      <h3 className="text-lg font-semibold text-slate-700">No case notes found</h3>
      <p className="text-sm text-slate-500 mt-1">Add your first note to get started</p>
    </div>
  );
}

// Add Note Dialog Component
function AddNoteDialog({ 
  open, 
  onClose, 
  clients 
}: { 
  open: boolean; 
  onClose: () => void;
  clients: any[];
}) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [selectedClient, setSelectedClient] = useState("");
  const [noteType, setNoteType] = useState<NoteType>("general");
  const [content, setContent] = useState("");
  const [summary, setSummary] = useState("");
  const [checklist, setChecklist] = useState<{ id: string; label: string; checked: boolean }[]>([]);
  const [attachments, setAttachments] = useState<File[]>([]);
  const [isVisibleToClient, setIsVisibleToClient] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Load checklist template
  const loadTemplate = (templateKey: keyof typeof CHECKLIST_TEMPLATES) => {
    setChecklist(CHECKLIST_TEMPLATES[templateKey].map(item => ({ ...item })));
  };

  // Toggle checklist item
  const toggleChecklistItem = (id: string) => {
    setChecklist(prev => prev.map(item => 
      item.id === id ? { ...item, checked: !item.checked } : item
    ));
  };

  // Handle file selection
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setAttachments(prev => [...prev, ...files]);
  };

  // Remove attachment
  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  // Submit note
  const handleSubmit = async () => {
    if (!selectedClient || !content.trim()) {
      toast.error("Please select a client and enter note content");
      return;
    }

    setIsSubmitting(true);
    try {
      // Upload attachments first (if any)
      const uploadedAttachments: { type: string; url: string; name: string }[] = [];
      
      for (const file of attachments) {
        const fileType = file.type.startsWith("image/") ? "image" : 
                         file.type.startsWith("video/") ? "video" : "document";
        const fileName = `${Date.now()}-${file.name}`;
        
        // Upload to Supabase Storage
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from("case-notes-media")
          .upload(fileName, file);

        if (uploadError) {
          console.error("Upload error:", uploadError);
          // Continue with note creation even if upload fails
        } else {
          const { data: urlData } = supabase.storage
            .from("case-notes-media")
            .getPublicUrl(fileName);
          
          uploadedAttachments.push({
            type: fileType,
            url: urlData.publicUrl,
            name: file.name,
          });
        }
      }

      // Get staff ID
      const { data: staffData } = await supabase
        .from("staff")
        .select("id")
        .eq("user_id", user?.id)
        .single();

      // Create the note
      const { error } = await supabase.from("case_notes").insert({
        client_id: selectedClient,
        staff_id: staffData?.id,
        note_type: noteType,
        content,
        summary: summary || content.slice(0, 200),
        checklist: checklist.length > 0 ? checklist : null,
        attachments: uploadedAttachments.length > 0 ? uploadedAttachments : null,
        is_visible_to_client: isVisibleToClient,
      });

      if (error) throw error;

      toast.success("Note added successfully");
      queryClient.invalidateQueries({ queryKey: ["enhanced-case-notes"] });
      onClose();
      
      // Reset form
      setSelectedClient("");
      setNoteType("general");
      setContent("");
      setSummary("");
      setChecklist([]);
      setAttachments([]);
      setIsVisibleToClient(false);
    } catch (error) {
      console.error("Error creating note:", error);
      toast.error("Failed to create note");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
      >
        {/* Header */}
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-800">Add Case Note</h2>
          <button onClick={onClose} className="h-8 w-8 rounded-lg hover:bg-slate-100 flex items-center justify-center">
            <X className="h-5 w-5 text-slate-500" />
          </button>
        </div>

        {/* Form */}
        <div className="p-6 space-y-4">
          {/* Client & Type Row */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Client *</label>
              <select
                value={selectedClient}
                onChange={(e) => setSelectedClient(e.target.value)}
                className="w-full h-10 px-3 rounded-xl border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-400"
              >
                <option value="">Select client...</option>
                {clients.map((client: any) => (
                  <option key={client.id} value={client.id}>
                    {client.preferred_name || client.first_name} {client.last_name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Note Type</label>
              <select
                value={noteType}
                onChange={(e) => setNoteType(e.target.value as NoteType)}
                className="w-full h-10 px-3 rounded-xl border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-400"
              >
                <option value="general">General</option>
                <option value="daily_care">Daily Care</option>
                <option value="progress">Progress</option>
                <option value="medical">Medical</option>
                <option value="incident">Incident</option>
              </select>
            </div>
          </div>

          {/* Content */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Note Content *</label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Enter your case note..."
              rows={4}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-purple-400"
            />
          </div>

          {/* Checklist Templates */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Quick Checklist</label>
            <div className="flex flex-wrap gap-2 mb-3">
              <button
                type="button"
                onClick={() => loadTemplate("daily_care")}
                className="text-xs px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50"
              >
                Daily Care
              </button>
              <button
                type="button"
                onClick={() => loadTemplate("cleaning")}
                className="text-xs px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50"
              >
                Cleaning
              </button>
              <button
                type="button"
                onClick={() => loadTemplate("social")}
                className="text-xs px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50"
              >
                Social Activity
              </button>
              {checklist.length > 0 && (
                <button
                  type="button"
                  onClick={() => setChecklist([])}
                  className="text-xs px-3 py-1.5 rounded-lg border border-red-200 text-red-600 hover:bg-red-50"
                >
                  Clear
                </button>
              )}
            </div>
            
            {/* Checklist Items */}
            {checklist.length > 0 && (
              <div className="space-y-2 p-3 bg-slate-50 rounded-xl">
                {checklist.map((item) => (
                  <label
                    key={item.id}
                    className="flex items-center gap-3 cursor-pointer"
                  >
                    <button
                      type="button"
                      onClick={() => toggleChecklistItem(item.id)}
                      className={`h-5 w-5 rounded flex items-center justify-center transition-colors ${
                        item.checked ? "bg-green-500 text-white" : "border-2 border-slate-300"
                      }`}
                    >
                      {item.checked && <Check className="h-3 w-3" />}
                    </button>
                    <span className={`text-sm ${item.checked ? "text-slate-400 line-through" : "text-slate-700"}`}>
                      {item.label}
                    </span>
                  </label>
                ))}
              </div>
            )}
          </div>

          {/* Attachments */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Attachments</label>
            <div className="flex flex-wrap gap-2 mb-2">
              {attachments.map((file, index) => (
                <div
                  key={index}
                  className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 rounded-lg text-sm"
                >
                  {file.type.startsWith("image/") ? <Image className="h-4 w-4 text-blue-500" /> :
                   file.type.startsWith("video/") ? <Video className="h-4 w-4 text-purple-500" /> :
                   <FileText className="h-4 w-4 text-slate-500" />}
                  <span className="truncate max-w-[150px]">{file.name}</span>
                  <button
                    type="button"
                    onClick={() => removeAttachment(index)}
                    className="text-slate-400 hover:text-red-500"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/*,video/*,.pdf,.doc,.docx"
              onChange={handleFileSelect}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-2 text-sm text-purple-600 hover:underline"
            >
              <Upload className="h-4 w-4" /> Add photos, videos, or documents
            </button>
          </div>

          {/* Visibility Toggle */}
          <label className="flex items-center gap-3 cursor-pointer">
            <button
              type="button"
              onClick={() => setIsVisibleToClient(!isVisibleToClient)}
              className={`h-5 w-5 rounded flex items-center justify-center transition-colors ${
                isVisibleToClient ? "bg-teal-500 text-white" : "border-2 border-slate-300"
              }`}
            >
              {isVisibleToClient && <Check className="h-3 w-3" />}
            </button>
            <span className="text-sm text-slate-700">Make visible to client in their portal</span>
          </label>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-white border-t px-6 py-4 flex items-center justify-end gap-3">
          <OutlineButton onClick={onClose}>Cancel</OutlineButton>
          <PrimaryButton onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
            Save Note
          </PrimaryButton>
        </div>
      </motion.div>
    </div>
  );
}
