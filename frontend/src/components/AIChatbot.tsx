import { useState, useRef, useEffect, useCallback } from "react";
import { X, Send, Loader2, User, Maximize2, Minimize2, ExternalLink, Sparkles, Shield } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import ReactMarkdown from "react-markdown";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import maureenImg from "@/assets/maureen.png";

type Msg = { role: "user" | "assistant"; content: string };

// Security clearance levels (1-4)
// Level 1: Client - Can only see own data, limited help
// Level 2: Support Worker - Can see assigned clients, shifts, basic operations
// Level 3: Manager - Can see team data, approve timesheets, manage staff
// Level 4: Admin - Full access including financials, reports, settings, tidy up

type SecurityLevel = 1 | 2 | 3 | 4;

const SECURITY_LEVEL_NAMES: Record<SecurityLevel, string> = {
  1: "Client",
  2: "Support Worker",
  3: "Manager",
  4: "Admin",
};

// Client suggestions (Level 1)
const CLIENT_SUGGESTIONS = [
  "When is my next visit?",
  "How do I view my care notes?",
  "How do I contact my care team?",
  "How do I submit a request?",
];

// Role-based quick actions
const WORKER_SUGGESTIONS = [
  "How do I check in for my shift?",
  "How do I submit my timesheet?",
  "How do I write a client note?",
  "What if there's an incident?",
];

const MANAGER_SUGGESTIONS = [
  "How do I approve timesheets?",
  "How do I view team roster?",
  "How do I manage staff requests?",
  "How do I review incidents?",
];

const ADMIN_SUGGESTIONS = [
  "How do I approve timesheets?",
  "How do I add a new staff member?",
  "How do I generate an invoice?",
  "Run Tidy Up",
];

// Quick help responses (role-aware) - Maureen's personality: structured, warm, precise
// Added client responses for 4-tier security
const QUICK_HELP: Record<string, { client: string; worker: string; manager: string; admin: string; links?: { text: string; url: string }[]; minLevel?: SecurityLevel }> = {
  "next visit": {
    client: `**Your Upcoming Visits:**

1. Check the **My Schedule** tab in your portal
2. Your next visit details are shown on the Overview page
3. You'll see the date, time, and support worker assigned

If you need to change a visit time, submit a request.`,
    worker: `**Viewing Client Visits:**

Check the client's profile or use the roster to see upcoming visits.`,
    manager: `**Managing Client Visits:**

Go to **Full Roster** to see all scheduled visits. Click any visit to view details.`,
    admin: `**Managing Client Visits:**

Go to **Full Roster** to see all scheduled visits. Click any visit to view or edit details.`,
    links: [{ text: "My Schedule", url: "/client-portal" }],
  },
  "care notes": {
    client: `**Viewing Your Care Notes:**

1. Go to the **Care Notes** tab in your portal
2. Notes shared by your care team will appear here
3. Only notes marked "visible to client" are shown

These notes help track your progress and care activities.`,
    worker: `**Writing Care Notes:**

1. Go to **Case Notes** from My Work
2. Select the client
3. Add your note with details of the visit
4. Mark "visible to client" if appropriate`,
    manager: `**Reviewing Care Notes:**

Go to **Case Notes** to review all notes. Filter by client, date, or staff member.`,
    admin: `**Managing Care Notes:**

Go to **Case Notes** to review all notes. You can filter, export, and manage visibility settings.`,
    links: [{ text: "Case Notes", url: "/notes" }],
  },
  "contact": {
    client: `**Contacting Your Care Team:**

1. Submit a **Request** through the portal
2. Your care coordinator will respond within 24 hours
3. For urgent matters, call our office directly

We're here to help.`,
    worker: `Contact your manager or the office for assistance.`,
    manager: `Contact the admin team or use internal communications.`,
    admin: `Use the internal communication system or contact staff directly.`,
    links: [{ text: "Submit Request", url: "/client-portal" }],
  },
  "check in": {
    client: `**About Check-ins:**

Your support worker will check in when they arrive for your visit. You'll see the visit status in your schedule.`,
    worker: `**Checking in for your shift:**

1. Go to **My Roster** from the sidebar
2. Find today's shift
3. Click the **Check In** button
4. Confirm your location if prompted

You're all set. Remember to check out when your shift ends.`,
    manager: `**Staff Check-ins:**

1. Go to **Full Roster** to see all shifts
2. Active check-ins appear on the dashboard
3. Click any shift for details

The Dashboard shows real-time check-in status.`,
    admin: `**Staff Check-ins:**

1. Go to **Full Roster** to see all shifts
2. Active check-ins appear on the dashboard
3. Click any shift for details

The Dashboard shows real-time check-in status.`,
    links: [{ text: "Go to My Roster", url: "/my-roster" }, { text: "View Dashboard", url: "/" }]
  },
  "timesheet": {
    client: `**About Timesheets:**

Timesheets track the hours your support workers spend with you. This is used for billing and service records. You don't need to do anything - your care team handles this.`,
    worker: `**Submitting your timesheet:**

1. Go to **My Timesheets**
2. Review your hours for the period
3. Click **Submit for Approval**
4. Wait for manager/admin approval

Note: Timesheets are auto-generated from your check-ins.`,
    manager: `**Approving timesheets:**

1. Go to **Timesheets** in Team Management
2. Filter by "Pending" or "Submitted"
3. Select timesheets to approve
4. Click **Approve Selected**`,
    admin: `**Approving timesheets:**

1. Go to **Timesheets** in Team Management
2. Filter by "Pending" or "Submitted"
3. Select timesheets to approve
4. Click **Approve Selected**

After approval, you can generate invoices.`,
    links: [{ text: "My Timesheets", url: "/my-timesheets" }, { text: "All Timesheets", url: "/timesheets" }],
    minLevel: 2
  },
  "client note": {
    client: `**Your Care Notes:**

Care notes are summaries of your visits. Go to the **Care Notes** tab in your portal to see notes your team has shared with you.`,
    worker: `**Writing a client note:**

1. Go to **Case Notes** in My Work
2. Select the client
3. Click **Add Note**
4. Fill in the details and save

Good notes help track client progress and care continuity.`,
    manager: `**Managing client notes:**

1. Go to **Case Notes**
2. Filter by client, date, or staff
3. Review entries as needed

You can track note completion rates in Reports.`,
    admin: `**Managing client notes:**

1. Go to **Case Notes**
2. Filter by client, date, or staff
3. Review and approve as needed

You can export notes for reporting purposes.`,
    links: [{ text: "Case Notes", url: "/notes" }]
  },
  "incident": {
    client: `**About Incidents:**

If something happens during your care that concerns you, please tell your support worker or submit a request through the portal. Your safety is our priority.`,
    worker: `**Reporting an incident:**

1. Go to **Incidents** in My Work
2. Click **Report Incident**
3. Select the incident type
4. Fill in all required details
5. Submit immediately

Important: Report all incidents as soon as they occur.`,
    manager: `**Managing incidents:**

1. Go to **Incidents**
2. Review open incidents (highlighted)
3. Investigate and update status
4. Escalate to admin if needed`,
    admin: `**Managing incidents:**

1. Go to **Incidents**
2. Review open incidents (highlighted)
3. Investigate and update status
4. Close when resolved

The Dashboard alerts you to open incidents.`,
    links: [{ text: "Report Incident", url: "/incidents" }],
    minLevel: 2
  },
  "invoice": {
    client: `**Your Invoices:**

View your invoices in the **Invoices** tab of your portal. You can see pending and paid invoices, and download copies.

For billing questions, submit a request to your care coordinator.`,
    worker: `**About invoices:**

Invoices are managed by administrators. Once your timesheet is approved, it can be included in billing.

Keep your timesheets accurate and up to date.`,
    manager: `**About invoices:**

Invoices are managed by administrators. You can view approved timesheets ready for billing.`,
    admin: `**Creating invoices:**

1. Go to **Invoices** in the sidebar
2. Click **New Invoice**
3. Select the client
4. Add service lines (date, service type, start/end time)
5. Rates: Mon–Fri $60/hr · Sat $90/hr · Sun $120/hr (GST-free)
6. Submit and approve when ready`,
    links: [{ text: "Invoices", url: "/invoices" }, { text: "Timesheets", url: "/timesheets" }],
    minLevel: 2
  },
  "staff": {
    client: `**Your Care Team:**

Your support workers are listed in your care plan. If you'd like to know more about who will be visiting, contact your care coordinator.`,
    worker: `**Your profile:**

Contact your manager or administrator to update your profile details. You can view your compliance documents in **My Work**.`,
    manager: `**Managing staff:**

1. Go to **Staff** in Team Management
2. View team members and their status
3. Track compliance and training

For HR documents, contact an administrator.`,
    admin: `**Managing staff:**

1. Go to **Staff** in Team Management
2. Click **Add Staff** or select a row to edit
3. Use **HR & Docs** for compliance documents

Track certifications and expiry dates there.`,
    links: [{ text: "Staff List", url: "/staff" }, { text: "HR & Docs", url: "/staff/hr" }],
    minLevel: 2
  },
  "roster": {
    client: `**Your Schedule:**

View your upcoming visits in the **My Schedule** tab of your portal. You'll see dates, times, and which support worker is assigned.`,
    worker: `**Viewing your roster:**

1. Go to **My Roster** in My Work
2. See your upcoming shifts
3. Check shift details (time, client, location)

Plan ahead with your schedule.`,
    manager: `**Managing the roster:**

1. Go to **Full Roster** in Team Management
2. View all scheduled shifts
3. Assign staff to shifts
4. Track attendance`,
    admin: `**Managing the roster:**

1. Go to **Full Roster** in Team Management
2. View all scheduled shifts
3. Assign staff to shifts
4. Manage recurring schedules

The Dashboard shows active shifts.`,
    links: [{ text: "My Roster", url: "/my-roster" }, { text: "Full Roster", url: "/roster" }]
  },
  "tidy": {
    client: `I'm sorry, that feature isn't available in the client portal.`,
    worker: `**Tidy Up:**

The Tidy Up feature is available to administrators only. It helps clean up old records, expired shifts, and pending items.

If you notice outdated data, let your admin know.`,
    manager: `**Tidy Up:**

The Tidy Up feature is available to administrators only. It helps clean up old records, expired shifts, and pending items.

If you notice items that need cleanup, let an admin know.`,
    admin: `**Tidy Up - Platform Cleanup:**

I can take you there now. Tidy Up helps you:
- Archive old expired shifts
- Review pending timesheets
- Clean up old case notes
- Auto sign-off missing signatures
- Archive resolved incidents

Click below to open Tidy Up.`,
    links: [{ text: "Open Tidy Up", url: "/tidy-up" }],
    minLevel: 4
  },
  "help": {
    client: `**Hello, dear. I'm Maureen.**

Welcome to your client portal! I can help you with:
- **Schedule** – View your upcoming visits
- **Care Notes** – See notes from your care team
- **Requests** – Submit questions or changes
- **Contact** – Reach your care coordinator

Just ask me anything.`,
    worker: `**Hello, dear. I'm Maureen.**

I can help you with:
- **Roster** – View your shifts
- **Timesheets** – Submit your hours
- **Notes** – Write client notes
- **Incidents** – Report issues

Just ask me anything.`,
    manager: `**Hello, dear. I'm Maureen.**

As a manager, I can help with:
- **Team Roster** – View all shifts
- **Approvals** – Timesheets
- **Staff** – Manage your team
- **Incidents** – Review reports

Just ask me anything.`,
    admin: `**Hello, dear. I'm Maureen.**

As an administrator, I can help with:
- **Staff** – Manage your team
- **Approvals** – Timesheets and documents
- **Invoices** – Generate billing
- **Tidy Up** – Clean up old records
- **Reports** – Track everything

Just ask me anything.`,
    links: []
  }
};

interface AIChatbotProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  urgentMessage?: string;
}

export function AIChatbot({ isOpen, onOpenChange, urgentMessage = "" }: AIChatbotProps) {
  const [expanded, setExpanded] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [quickLinks, setQuickLinks] = useState<{ text: string; url: string }[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const { role, isAdmin, isManager, demoRole, isDemoMode } = useAuth();
  const navigate = useNavigate();

  // Calculate security level (1-4)
  const getSecurityLevel = (): SecurityLevel => {
    if (isDemoMode && demoRole) {
      if (demoRole === "admin") return 4;
      if (demoRole === "manager") return 3;
      if (demoRole === "support_worker") return 2;
      return 1; // client
    }
    if (isAdmin) return 4;
    if (isManager) return 3;
    return 2; // default support_worker
  };

  const securityLevel = getSecurityLevel();
  const isClient = securityLevel === 1;

  // Determine suggestions based on security level
  const suggestions = isClient 
    ? CLIENT_SUGGESTIONS 
    : isAdmin 
      ? ADMIN_SUGGESTIONS 
      : isManager 
        ? MANAGER_SUGGESTIONS 
        : WORKER_SUGGESTIONS;

  // Get response based on security level (4-tier)
  const getRoleResponse = (helpItem: typeof QUICK_HELP[string]) => {
    // Check if user has required security level
    if (helpItem.minLevel && securityLevel < helpItem.minLevel) {
      return `I'm sorry, that information requires ${SECURITY_LEVEL_NAMES[helpItem.minLevel]} access or higher. Your current clearance is ${SECURITY_LEVEL_NAMES[securityLevel]}.`;
    }
    
    // Return appropriate response for security level
    if (securityLevel === 4) return helpItem.admin;
    if (securityLevel === 3) return helpItem.manager;
    if (securityLevel === 2) return helpItem.worker;
    return helpItem.client; // Level 1
  };

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  // Focus input when chat opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  // Handle escape key to close
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        if (expanded) {
          setExpanded(false);
        } else {
          onOpenChange(false);
        }
      }
    };
    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [isOpen, expanded, onOpenChange]);

  const sendMessage = useCallback(async (text: string) => {
    if (!text.trim() || isLoading) return;
    const userMsg: Msg = { role: "user", content: text.trim() };
    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    setInput("");
    setIsLoading(true);
    setQuickLinks([]);

    const q = text.toLowerCase();
    let quickHelpFound = false;

    // Check for quick help matches
    for (const [key, value] of Object.entries(QUICK_HELP)) {
      if (q.includes(key)) {
        const response = getRoleResponse(value);
        await new Promise(resolve => setTimeout(resolve, 300));
        setMessages(prev => [...prev, { role: "assistant", content: response }]);
        if (value.links && value.links.length > 0) {
          // Filter links based on security level
          const filteredLinks = value.links.filter(link => {
            if (link.url === "/tidy-up") return securityLevel >= 4;
            if (link.url === "/staff/hr" || link.url === "/invoices" || link.url === "/analytics") return securityLevel >= 4;
            if (["/roster", "/timesheets", "/staff"].includes(link.url)) return securityLevel >= 3;
            if (["/my-roster", "/my-timesheets", "/notes", "/incidents"].includes(link.url)) return securityLevel >= 2;
            // Client portal links
            if (link.url === "/client-portal") return true;
            return securityLevel >= 2;
          });
          setQuickLinks(filteredLinks);
        }
        setIsLoading(false);
        quickHelpFound = true;
        break;
      }
    }

    // Fallback response based on security level
    if (!quickHelpFound) {
      await new Promise(resolve => setTimeout(resolve, 500));
      
      let fallbackResponse = "";
      if (securityLevel === 4) { // Admin
        fallbackResponse = `I'm here to help! Here are some things I can assist with:

**Quick Actions:**
- "How do I approve timesheets?"
- "How do I add staff?"
- "How do I generate an invoice?"
- "Run Tidy Up"

**Or try:**
- Check the **Dashboard** for alerts
- Go to **Staff** to manage your team
- View **Reports** for insights

Just ask me about any topic!`;
      } else if (securityLevel === 3) { // Manager
        fallbackResponse = `I'm here to help! Here are some things I can assist with:

**Quick Actions:**
- "How do I approve timesheets?"
- "How do I view team roster?"
- "How do I manage staff?"
- "How do I review incidents?"

**Or try:**
- Check the **Dashboard** for alerts
- Go to **Full Roster** for team shifts

Just ask me about any topic!`;
      } else if (securityLevel === 2) { // Support Worker
        fallbackResponse = `I'm here to help! Here are some things I can assist with:

**Quick Actions:**
- "How do I check in?"
- "How do I submit my timesheet?"
- "How do I write a client note?"
- "What if there's an incident?"

**Or try:**
- Check **My Roster** for your shifts
- Go to **My Timesheets** to see hours

Just ask me about any topic!`;
      } else { // Client (Level 1)
        fallbackResponse = `Hello! I'm here to help with your care portal.

**Quick Actions:**
- "When is my next visit?"
- "How do I view my care notes?"
- "How do I contact my care team?"
- "How do I submit a request?"

**Or try:**
- Check your **Schedule** for upcoming visits
- View your **Care Notes** from your team

Just ask me anything!`;
      }
      
      setMessages(prev => [...prev, { role: "assistant", content: fallbackResponse }]);
      setIsLoading(false);
    }
  }, [messages, isLoading, securityLevel]);

  // Handle navigation from quick links
  const handleLinkClick = (url: string) => {
    onOpenChange(false);
    navigate(url);
  };

  // Dynamic sizing classes based on expanded state
  const getPanelClasses = () => {
    if (expanded) {
      return "fixed inset-4 sm:inset-6 md:inset-8 lg:bottom-6 lg:right-6 lg:left-auto lg:top-auto lg:w-[600px] lg:h-[700px] xl:w-[700px] xl:h-[800px]";
    }
    return "fixed bottom-4 right-4 sm:bottom-6 sm:right-6 w-[calc(100vw-2rem)] sm:w-[420px] md:w-[480px] lg:w-[520px] h-[70vh] sm:h-[580px] md:h-[620px] lg:h-[680px] max-h-[calc(100vh-2rem)]";
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.95 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          className={`${getPanelClasses()} z-50 rounded-2xl sm:rounded-3xl bg-white shadow-2xl border border-slate-100 flex flex-col overflow-hidden`}
          data-testid="maureen-chat-panel"
        >
          {/* Header with Maureen's photo */}
          <div className="relative shrink-0">
            <div className="h-1.5 w-full" style={{ background: "linear-gradient(90deg, #a78bfa, #8b5cf6, #60a5fa)" }} />
            <div className="flex items-center justify-between px-3 sm:px-4 py-3 border-b border-slate-100">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="relative">
                  <div className="h-10 w-10 sm:h-12 sm:w-12 lg:h-14 lg:w-14 rounded-full overflow-hidden shadow-sm border-2 border-purple-100">
                    <img 
                      src={maureenImg} 
                      alt="Maureen" 
                      className="h-full w-full object-cover"
                    />
                  </div>
                  <div className="absolute -bottom-0.5 -right-0.5 h-3 w-3 sm:h-3.5 sm:w-3.5 rounded-full bg-emerald-400 border-2 border-white" />
                </div>
                <div>
                  <p className="text-sm sm:text-base lg:text-lg font-bold text-slate-800">Maureen</p>
                  <p className="text-[10px] sm:text-xs text-slate-400">Your Care Assistant</p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setExpanded(!expanded)}
                  className="hidden sm:flex h-8 w-8 rounded-xl items-center justify-center text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
                  title={expanded ? "Minimize" : "Maximize"}
                  data-testid="maureen-chat-expand"
                >
                  {expanded ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
                </button>
                <button
                  onClick={() => onOpenChange(false)}
                  className="h-8 w-8 rounded-xl flex items-center justify-center text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
                  data-testid="maureen-chat-close"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Messages */}
          <div ref={scrollRef} className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-3 sm:space-y-4 scrollbar-thin">
            {messages.length === 0 && (
              <div className="space-y-3">
                {/* Security Level Badge */}
                {isDemoMode && (
                  <div className="flex items-center justify-center mb-2">
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-purple-50 border border-purple-200 text-xs font-medium text-purple-700">
                      <Shield className="h-3 w-3" />
                      {SECURITY_LEVEL_NAMES[securityLevel]} Access (Level {securityLevel})
                    </div>
                  </div>
                )}
                <div className="flex items-start gap-2">
                  <div className="h-8 w-8 sm:h-9 sm:w-9 rounded-full overflow-hidden shrink-0 mt-0.5 shadow-sm border border-purple-100">
                    <img src={maureenImg} alt="Maureen" className="h-full w-full object-cover" />
                  </div>
                  <div className="rounded-2xl rounded-tl-none bg-slate-100 px-3 sm:px-4 py-2.5 text-sm sm:text-base text-slate-700 max-w-[85%]">
                    Hello dear, I'm Maureen — your care assistant. {
                      securityLevel === 4 
                        ? "As an admin, I can help you manage staff, approvals, invoices, and run Tidy Up." 
                        : securityLevel === 3 
                          ? "As a manager, I can help you with team rosters, approvals, and staff management."
                          : securityLevel === 2
                            ? "I can help you with your shifts, timesheets, and client notes."
                            : "Welcome to your care portal, dear. I can help you with your schedule, care notes, and requests."
                    } Just ask.
                  </div>
                </div>
                <div className="flex flex-wrap gap-2 pl-10 sm:pl-11">
                  {suggestions.map((s) => (
                    <button
                      key={s}
                      onClick={() => sendMessage(s)}
                      className="text-xs sm:text-sm px-2.5 sm:px-3 py-1.5 rounded-full bg-purple-50 border border-purple-200 text-purple-600 hover:bg-purple-100 transition-colors font-medium"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {messages.map((m, i) => (
              <div key={i} className={`flex items-start gap-2 ${m.role === "user" ? "flex-row-reverse" : ""}`}>
                {m.role === "user" ? (
                  <div
                    className="h-8 w-8 sm:h-9 sm:w-9 rounded-full flex items-center justify-center shrink-0 mt-0.5"
                    style={{ background: "linear-gradient(135deg, #a78bfa, #8b5cf6)" }}
                  >
                    <User className="h-4 w-4 text-white" />
                  </div>
                ) : (
                  <div className="h-8 w-8 sm:h-9 sm:w-9 rounded-full overflow-hidden shrink-0 mt-0.5 shadow-sm border border-purple-100">
                    <img src={maureenImg} alt="Maureen" className="h-full w-full object-cover" />
                  </div>
                )}
                <div className={`rounded-2xl px-3 sm:px-4 py-2.5 text-sm sm:text-base max-w-[85%] ${
                  m.role === "user"
                    ? "rounded-tr-none text-white"
                    : "rounded-tl-none bg-slate-100 text-slate-700"
                }`}
                style={m.role === "user" ? { background: "linear-gradient(135deg, #a78bfa, #8b5cf6)" } : {}}
                >
                  {m.role === "assistant" ? (
                    <div className="prose prose-sm sm:prose max-w-none [&_p]:my-1 [&_ul]:my-1 [&_ol]:my-1 [&_li]:my-0.5 [&_h1]:text-base [&_h2]:text-sm [&_h3]:text-sm [&_strong]:text-purple-700">
                      <ReactMarkdown>{m.content}</ReactMarkdown>
                    </div>
                  ) : (
                    m.content
                  )}
                </div>
              </div>
            ))}

            {/* Quick Links after response */}
            {quickLinks.length > 0 && (
              <div className="flex flex-wrap gap-2 pl-10 sm:pl-11 mt-2">
                {quickLinks.map((link) => (
                  <button
                    key={link.url}
                    onClick={() => handleLinkClick(link.url)}
                    className="inline-flex items-center gap-1.5 text-xs sm:text-sm px-3 py-1.5 rounded-full bg-gradient-to-r from-purple-500 to-violet-500 text-white hover:from-purple-600 hover:to-violet-600 transition-all font-medium shadow-sm"
                  >
                    {link.url === "/tidy-up" ? <Sparkles className="h-3 w-3" /> : <ExternalLink className="h-3 w-3" />}
                    {link.text}
                  </button>
                ))}
              </div>
            )}

            {isLoading && messages[messages.length - 1]?.role === "user" && (
              <div className="flex items-start gap-2">
                <div className="h-8 w-8 sm:h-9 sm:w-9 rounded-full overflow-hidden shrink-0 shadow-sm border border-purple-100">
                  <img src={maureenImg} alt="Maureen" className="h-full w-full object-cover" />
                </div>
                <div className="rounded-2xl rounded-tl-none bg-slate-100 px-4 py-3">
                  <div className="flex gap-1.5">
                    <div className="h-2 w-2 rounded-full bg-slate-400 animate-bounce" />
                    <div className="h-2 w-2 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: "0.15s" }} />
                    <div className="h-2 w-2 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: "0.3s" }} />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Input */}
          <form
            onSubmit={(e) => { e.preventDefault(); sendMessage(input); }}
            className="shrink-0 p-2 sm:p-3 border-t border-slate-100 flex items-center gap-2"
          >
            <input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask Maureen anything..."
              disabled={isLoading}
              maxLength={1000}
              className="flex-1 h-10 sm:h-11 lg:h-12 rounded-xl border border-slate-200 bg-slate-50 px-3 sm:px-4 text-sm sm:text-base text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-400/50 focus:border-purple-300 transition-all disabled:opacity-50"
              data-testid="maureen-chat-input"
            />
            <button
              type="submit"
              disabled={isLoading || !input.trim()}
              className="h-10 w-10 sm:h-11 sm:w-11 lg:h-12 lg:w-12 rounded-xl text-white flex items-center justify-center hover:opacity-90 transition-opacity disabled:opacity-50 shadow-sm"
              style={{ background: "linear-gradient(135deg, #a78bfa, #8b5cf6)" }}
              data-testid="maureen-chat-send"
            >
              <Send className="h-4 w-4 sm:h-5 sm:w-5" />
            </button>
          </form>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
