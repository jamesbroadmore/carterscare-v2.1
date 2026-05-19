/**
 * Right-Click Context Menu System
 * Provides quick actions across the platform
 */

import { createContext, useContext, useState, useCallback, ReactNode } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Edit, Trash2, Copy, Plus, FileText, MessageSquare, 
  Calendar, Clock, AlertTriangle, Download, Share, 
  Eye, Archive, Pin, Star, MoreHorizontal 
} from "lucide-react";
import maureenImg from "@/assets/maureen.png";

// Context menu action types
export type ContextAction = {
  id: string;
  label: string;
  icon: React.ElementType;
  onClick: () => void;
  variant?: "default" | "danger" | "maureen";
  shortcut?: string;
  disabled?: boolean;
  divider?: boolean;
};

// Context menu position
type MenuPosition = { x: number; y: number } | null;

// Context for the menu
type ContextMenuState = {
  isOpen: boolean;
  position: MenuPosition;
  actions: ContextAction[];
  title?: string;
};

type ContextMenuContextType = {
  showMenu: (e: React.MouseEvent, actions: ContextAction[], title?: string) => void;
  hideMenu: () => void;
  state: ContextMenuState;
};

const ContextMenuContext = createContext<ContextMenuContextType | null>(null);

// Provider component
export function ContextMenuProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<ContextMenuState>({
    isOpen: false,
    position: null,
    actions: [],
    title: undefined,
  });

  const showMenu = useCallback((e: React.MouseEvent, actions: ContextAction[], title?: string) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Calculate position, ensuring menu stays within viewport
    const x = Math.min(e.clientX, window.innerWidth - 220);
    const y = Math.min(e.clientY, window.innerHeight - 300);
    
    setState({
      isOpen: true,
      position: { x, y },
      actions,
      title,
    });
  }, []);

  const hideMenu = useCallback(() => {
    setState(prev => ({ ...prev, isOpen: false }));
  }, []);

  return (
    <ContextMenuContext.Provider value={{ showMenu, hideMenu, state }}>
      {children}
      <ContextMenuOverlay />
    </ContextMenuContext.Provider>
  );
}

// Hook to use context menu
export function useContextMenu() {
  const context = useContext(ContextMenuContext);
  if (!context) {
    throw new Error("useContextMenu must be used within ContextMenuProvider");
  }
  return context;
}

// The actual menu overlay component
function ContextMenuOverlay() {
  const { state, hideMenu } = useContextMenu();
  const { isOpen, position, actions, title } = state;

  // Close on click outside or escape
  const handleBackdropClick = () => hideMenu();

  if (!isOpen || !position) return null;

  return (
    <>
      {/* Invisible backdrop to catch clicks */}
      <div 
        className="fixed inset-0 z-[100]" 
        onClick={handleBackdropClick}
        onContextMenu={(e) => { e.preventDefault(); hideMenu(); }}
      />
      
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: -5 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: -5 }}
          transition={{ duration: 0.1 }}
          className="fixed z-[101] min-w-[200px] max-w-[280px] bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden"
          style={{ left: position.x, top: position.y }}
          data-testid="context-menu"
        >
          {/* Title if provided */}
          {title && (
            <div className="px-3 py-2 bg-slate-50 border-b border-slate-100">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide truncate">{title}</p>
            </div>
          )}
          
          {/* Actions */}
          <div className="py-1">
            {actions.map((action, index) => (
              <div key={action.id}>
                {action.divider && index > 0 && (
                  <div className="my-1 border-t border-slate-100" />
                )}
                <button
                  onClick={() => {
                    if (!action.disabled) {
                      action.onClick();
                      hideMenu();
                    }
                  }}
                  disabled={action.disabled}
                  className={`w-full flex items-center gap-3 px-3 py-2 text-left text-sm transition-colors ${
                    action.disabled
                      ? "opacity-50 cursor-not-allowed"
                      : action.variant === "danger"
                      ? "text-red-600 hover:bg-red-50"
                      : action.variant === "maureen"
                      ? "text-purple-600 hover:bg-purple-50"
                      : "text-slate-700 hover:bg-slate-50"
                  }`}
                  data-testid={`context-action-${action.id}`}
                >
                  {action.variant === "maureen" ? (
                    <img src={maureenImg} alt="Maureen" className="h-4 w-4 rounded-full" />
                  ) : (
                    <action.icon className="h-4 w-4 flex-shrink-0" />
                  )}
                  <span className="flex-1 truncate">{action.label}</span>
                  {action.shortcut && (
                    <span className="text-xs text-slate-400 ml-2">{action.shortcut}</span>
                  )}
                </button>
              </div>
            ))}
          </div>
        </motion.div>
      </AnimatePresence>
    </>
  );
}

// Pre-built action generators for common operations
export const contextActions = {
  edit: (onClick: () => void): ContextAction => ({
    id: "edit",
    label: "Edit",
    icon: Edit,
    onClick,
    shortcut: "E",
  }),
  
  delete: (onClick: () => void): ContextAction => ({
    id: "delete",
    label: "Delete",
    icon: Trash2,
    onClick,
    variant: "danger",
    shortcut: "Del",
  }),
  
  copy: (onClick: () => void): ContextAction => ({
    id: "copy",
    label: "Copy",
    icon: Copy,
    onClick,
    shortcut: "C",
  }),
  
  addNote: (onClick: () => void): ContextAction => ({
    id: "add-note",
    label: "Add Note",
    icon: FileText,
    onClick,
    divider: true,
  }),
  
  addAttachment: (onClick: () => void): ContextAction => ({
    id: "add-attachment",
    label: "Add Attachment",
    icon: Plus,
    onClick,
  }),
  
  viewDetails: (onClick: () => void): ContextAction => ({
    id: "view-details",
    label: "View Details",
    icon: Eye,
    onClick,
  }),
  
  schedule: (onClick: () => void): ContextAction => ({
    id: "schedule",
    label: "Schedule",
    icon: Calendar,
    onClick,
  }),
  
  logHours: (onClick: () => void): ContextAction => ({
    id: "log-hours",
    label: "Log Hours",
    icon: Clock,
    onClick,
  }),
  
  reportIncident: (onClick: () => void): ContextAction => ({
    id: "report-incident",
    label: "Report Incident",
    icon: AlertTriangle,
    onClick,
    variant: "danger",
  }),
  
  download: (onClick: () => void): ContextAction => ({
    id: "download",
    label: "Download",
    icon: Download,
    onClick,
  }),
  
  share: (onClick: () => void): ContextAction => ({
    id: "share",
    label: "Share",
    icon: Share,
    onClick,
  }),
  
  archive: (onClick: () => void): ContextAction => ({
    id: "archive",
    label: "Archive",
    icon: Archive,
    onClick,
    divider: true,
  }),
  
  pin: (onClick: () => void): ContextAction => ({
    id: "pin",
    label: "Pin to Top",
    icon: Pin,
    onClick,
  }),
  
  star: (onClick: () => void): ContextAction => ({
    id: "star",
    label: "Star",
    icon: Star,
    onClick,
  }),
  
  askMaureen: (context: string, onClick: () => void): ContextAction => ({
    id: "ask-maureen",
    label: `Ask Maureen about this`,
    icon: MessageSquare,
    onClick,
    variant: "maureen",
    divider: true,
  }),
};

export default ContextMenuProvider;
