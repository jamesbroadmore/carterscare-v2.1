import { createContext, useContext, useState, useEffect, ReactNode } from "react";

// Demo account for sales presentations
// Role hierarchy: client < support_worker < manager < admin
export type DemoRole = "admin" | "manager" | "support_worker" | "client";

interface DemoUser {
  id: string;
  email: string;
  display_name: string;
  role: DemoRole;
  avatar_initials: string;
}

// Demo accounts for sales team
export const DEMO_ACCOUNTS: Record<string, DemoUser> = {
  "demo@admin.carterscare.com": {
    id: "demo-admin-001",
    email: "demo@admin.carterscare.com",
    display_name: "Sarah Mitchell",
    role: "admin",
    avatar_initials: "SM",
  },
  "demo@manager.carterscare.com": {
    id: "demo-manager-001",
    email: "demo@manager.carterscare.com",
    display_name: "David Chen",
    role: "manager",
    avatar_initials: "DC",
  },
  "demo@worker.carterscare.com": {
    id: "demo-worker-001",
    email: "demo@worker.carterscare.com",
    display_name: "Emma Johnson",
    role: "support_worker",
    avatar_initials: "EJ",
  },
  "demo@client.carterscare.com": {
    id: "demo-client-001",
    email: "demo@client.carterscare.com",
    display_name: "Robert Thompson",
    role: "client",
    avatar_initials: "RT",
  },
};

// Demo password (same for all demo accounts)
export const DEMO_PASSWORD = "CartersCare2025!";

// Demo data for presentations
export const DEMO_DATA = {
  staff: [
    { id: "s1", first_name: "Emma", last_name: "Johnson", preferred_name: "Em", status: "active", email: "emma@example.com", phone: "0412 345 678", role: "support_worker" },
    { id: "s2", first_name: "James", last_name: "Wilson", preferred_name: "Jim", status: "active", email: "james@example.com", phone: "0423 456 789", role: "support_worker" },
    { id: "s3", first_name: "Sophie", last_name: "Brown", preferred_name: null, status: "active", email: "sophie@example.com", phone: "0434 567 890", role: "support_worker" },
    { id: "s4", first_name: "Michael", last_name: "Davis", preferred_name: "Mike", status: "active", email: "michael@example.com", phone: "0445 678 901", role: "manager" },
    { id: "s5", first_name: "Olivia", last_name: "Martinez", preferred_name: "Liv", status: "on_leave", email: "olivia@example.com", phone: "0456 789 012", role: "support_worker" },
  ],
  clients: [
    { id: "c1", first_name: "Robert", last_name: "Thompson", preferred_name: "Bob", status: "active", phone: "0467 890 123", address: "123 Care Street, Perth WA 6000", ndis_number: "431234567", funding_type: "ndis" },
    { id: "c2", first_name: "Margaret", last_name: "Williams", preferred_name: "Maggie", status: "active", phone: "0478 901 234", address: "456 Support Ave, Fremantle WA 6160", ndis_number: "432345678", funding_type: "ndis" },
    { id: "c3", first_name: "William", last_name: "Anderson", preferred_name: "Bill", status: "active", phone: "0489 012 345", address: "789 Care Lane, Subiaco WA 6008", ndis_number: null, funding_type: "private" },
    { id: "c4", first_name: "Dorothy", last_name: "Taylor", preferred_name: "Dot", status: "active", phone: "0490 123 456", address: "321 Wellness Rd, Joondalup WA 6027", ndis_number: "433456789", funding_type: "ndis" },
    { id: "c5", first_name: "Thomas", last_name: "Moore", preferred_name: "Tom", status: "inactive", phone: "0401 234 567", address: "654 Health St, Rockingham WA 6168", ndis_number: null, funding_type: "aged_care" },
  ],
  timesheets: [
    { id: "t1", staff_id: "s1", client_id: "c1", shift_date: "2025-05-19", start_time: "09:00", end_time: "15:00", total_hours: 6, status: "approved" },
    { id: "t2", staff_id: "s2", client_id: "c2", shift_date: "2025-05-19", start_time: "14:00", end_time: "20:00", total_hours: 6, status: "submitted" },
    { id: "t3", staff_id: "s3", client_id: "c3", shift_date: "2025-05-20", start_time: "08:00", end_time: "14:00", total_hours: 6, status: "pending" },
    { id: "t4", staff_id: "s1", client_id: "c4", shift_date: "2025-05-20", start_time: "10:00", end_time: "16:00", total_hours: 6, status: "approved" },
    { id: "t5", staff_id: "s2", client_id: "c1", shift_date: "2025-05-21", start_time: "09:00", end_time: "17:00", total_hours: 8, status: "draft" },
  ],
  incidents: [
    { id: "i1", client_id: "c1", staff_id: "s1", incident_date: "2025-05-15", incident_type: "fall", severity: "medium", status: "investigating", description: "Minor fall in bathroom, no injuries" },
    { id: "i2", client_id: "c2", staff_id: "s2", incident_date: "2025-05-10", incident_type: "medication", severity: "low", status: "resolved", description: "Missed morning medication, administered later" },
  ],
  case_notes: [
    { id: "n1", client_id: "c1", staff_id: "s1", created_at: "2025-05-18T10:00:00Z", note_type: "daily_care", summary: "Good day, client engaged well in activities. Assisted with morning routine.", is_visible_to_client: true },
    { id: "n2", client_id: "c1", staff_id: "s2", created_at: "2025-05-17T14:00:00Z", note_type: "progress", summary: "Mobility improving, walked around garden independently.", is_visible_to_client: true },
    { id: "n3", client_id: "c2", staff_id: "s3", created_at: "2025-05-16T09:00:00Z", note_type: "daily_care", summary: "Regular visit completed. Client in good spirits.", is_visible_to_client: true },
  ],
  compliance_records: [
    { id: "cr1", staff_id: "s1", record_type: "police_check", record_name: "National Police Check", status: "current", expiry_date: "2026-03-15" },
    { id: "cr2", staff_id: "s1", record_type: "wwcc", record_name: "Working with Children Check", status: "current", expiry_date: "2027-01-20" },
    { id: "cr3", staff_id: "s2", record_type: "police_check", record_name: "National Police Check", status: "expiring_soon", expiry_date: "2025-06-01" },
    { id: "cr4", staff_id: "s3", record_type: "first_aid", record_name: "First Aid Certificate", status: "expired", expiry_date: "2025-04-15" },
  ],
  requests: [
    { id: "r1", title: "Change visit time", description: "Please change Monday visit from 9am to 10am", type: "schedule", status: "pending", priority: "medium", requester_type: "client", requester_id: "c1", created_at: "2025-05-17T08:00:00Z" },
    { id: "r2", title: "Additional support hours", description: "Requesting 2 extra hours on Wednesdays for shopping assistance", type: "service", status: "in_progress", priority: "high", requester_type: "client", requester_id: "c2", created_at: "2025-05-15T10:00:00Z" },
  ],
};

interface DemoContextType {
  isDemoMode: boolean;
  demoUser: DemoUser | null;
  enableDemoMode: (email: string) => boolean;
  disableDemoMode: () => void;
  getDemoData: <T extends keyof typeof DEMO_DATA>(key: T) => typeof DEMO_DATA[T];
}

const DemoContext = createContext<DemoContextType | undefined>(undefined);

export function DemoProvider({ children }: { children: ReactNode }) {
  const [isDemoMode, setIsDemoMode] = useState(false);
  const [demoUser, setDemoUser] = useState<DemoUser | null>(null);

  const enableDemoMode = (email: string): boolean => {
    const user = DEMO_ACCOUNTS[email.toLowerCase()];
    if (user) {
      setIsDemoMode(true);
      setDemoUser(user);
      localStorage.setItem("demo_mode", "true");
      localStorage.setItem("demo_user", JSON.stringify(user));
      return true;
    }
    return false;
  };

  const disableDemoMode = () => {
    setIsDemoMode(false);
    setDemoUser(null);
    localStorage.removeItem("demo_mode");
    localStorage.removeItem("demo_user");
  };

  const getDemoData = <T extends keyof typeof DEMO_DATA>(key: T) => {
    return DEMO_DATA[key];
  };

  // Restore demo session on mount
  useEffect(() => {
    const savedMode = localStorage.getItem("demo_mode");
    const savedUser = localStorage.getItem("demo_user");
    if (savedMode === "true" && savedUser) {
      try {
        setIsDemoMode(true);
        setDemoUser(JSON.parse(savedUser));
      } catch {
        disableDemoMode();
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <DemoContext.Provider value={{ isDemoMode, demoUser, enableDemoMode, disableDemoMode, getDemoData }}>
      {children}
    </DemoContext.Provider>
  );
}

export function useDemo() {
  const context = useContext(DemoContext);
  if (!context) throw new Error("useDemo must be used within DemoProvider");
  return context;
}
