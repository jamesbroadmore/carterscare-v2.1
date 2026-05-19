import { useState, useRef, useEffect, useCallback } from "react";
import { X, Send, Loader2, User, Maximize2, Minimize2, ExternalLink, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import ReactMarkdown from "react-markdown";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import maureenImg from "@/assets/maureen.png";

type Msg = { role: "user" | "assistant"; content: string };

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
const QUICK_HELP: Record<string, { worker: string; manager: string; admin: string; links?: { text: string; url: string }[] }> = {
  "check in": {
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
    links: [{ text: "My Timesheets", url: "/my-timesheets" }, { text: "All Timesheets", url: "/timesheets" }]
  },
  "client note": {
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
    links: [{ text: "Report Incident", url: "/incidents" }]
  },
  "invoice": {
    worker: `**About invoices:**

Invoices are managed by administrators. Once your timesheet is approved, it can be included in billing.

Keep your timesheets accurate and up to date.`,
    manager: `**About invoices:**

Invoices are managed by administrators. You can view approved timesheets ready for billing.`,
    admin: `**Generating invoices:**

1. Go to **Invoices** in Admin
2. Click **Generate Invoice**
3. Select approved timesheets
4. Set the hourly rate
5. Download CSV invoice

Only approved timesheets can be invoiced.`,
    links: [{ text: "Invoices", url: "/invoices" }, { text: "Timesheets", url: "/timesheets" }]
  },
  "staff": {
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
    links: [{ text: "Staff List", url: "/staff" }, { text: "HR & Docs", url: "/staff/hr" }]
  },
  "roster": {
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
    links: [{ text: "Open Tidy Up", url: "/tidy-up" }]
  },
  "help": {
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
  const { role, isAdmin, isManager } = useAuth();
  const navigate = useNavigate();

  // Determine suggestions based on role
  const suggestions = isAdmin ? ADMIN_SUGGESTIONS : isManager ? MANAGER_SUGGESTIONS : WORKER_SUGGESTIONS;

  // Get response based on role
  const getRoleResponse = (helpItem: typeof QUICK_HELP[string]) => {
    if (isAdmin) return helpItem.admin;
    if (isManager) return helpItem.manager;
    return helpItem.worker;
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
          // Filter links based on role
          const filteredLinks = value.links.filter(link => {
            if (link.url === "/tidy-up") return isAdmin;
            if (link.url === "/staff/hr") return isAdmin;
            if (["/roster", "/timesheets", "/staff"].includes(link.url)) return isManager || isAdmin;
            return true;
          });
          setQuickLinks(filteredLinks);
        }
        setIsLoading(false);
        quickHelpFound = true;
        break;
      }
    }

    // Fallback response
    if (!quickHelpFound) {
      await new Promise(resolve => setTimeout(resolve, 500));
      
      let fallbackResponse = "";
      if (isAdmin) {
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
      } else if (isManager) {
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
      } else {
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
      }
      
      setMessages(prev => [...prev, { role: "assistant", content: fallbackResponse }]);
      setIsLoading(false);
    }
  }, [messages, isLoading, isAdmin, isManager]);

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
                <div className="flex items-start gap-2">
                  <div className="h-8 w-8 sm:h-9 sm:w-9 rounded-full overflow-hidden shrink-0 mt-0.5 shadow-sm border border-purple-100">
                    <img src={maureenImg} alt="Maureen" className="h-full w-full object-cover" />
                  </div>
                  <div className="rounded-2xl rounded-tl-none bg-slate-100 px-3 sm:px-4 py-2.5 text-sm sm:text-base text-slate-700 max-w-[85%]">
                    G'day! I'm Maureen, your care assistant. {
                      isAdmin 
                        ? "As an admin, I can help you manage staff, approvals, invoices, and run Tidy Up." 
                        : isManager 
                          ? "As a manager, I can help you with team rosters, approvals, and staff management."
                          : "I can help you with your shifts, timesheets, and client notes."
                    } Just ask!
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
