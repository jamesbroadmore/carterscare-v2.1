import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Session, User } from "@supabase/supabase-js";
import { DEMO_ACCOUNTS, DEMO_PASSWORD, type DemoRole } from "./DemoContext";

// Security clearance levels: support_worker < manager < admin
type AppRole = "admin" | "manager" | "support_worker";

interface AuthContextType {
  session: Session | null;
  user: User | null;
  loading: boolean;
  role: AppRole | null;
  isAdmin: boolean;
  isManager: boolean;
  isSupportWorker: boolean;
  isDemoMode: boolean;
  demoRole: DemoRole | null;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState<AppRole | null>(null);
  const [isDemoMode, setIsDemoMode] = useState(false);
  const [demoRole, setDemoRole] = useState<DemoRole | null>(null);

  const fetchRole = async (userId: string) => {
    const { data } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .single();
    // Map old roles to new security levels
    const rawRole = data?.role;
    if (rawRole === "admin") {
      setRole("admin");
    } else if (rawRole === "moderator" || rawRole === "manager") {
      setRole("manager");
    } else {
      setRole("support_worker");
    }
  };

  // Check for demo session on mount
  useEffect(() => {
    const savedDemoMode = localStorage.getItem("demo_mode");
    const savedDemoUser = localStorage.getItem("demo_user");
    if (savedDemoMode === "true" && savedDemoUser) {
      try {
        const demoUser = JSON.parse(savedDemoUser);
        setIsDemoMode(true);
        setDemoRole(demoUser.role);
        // Map demo role to app role
        if (demoUser.role === "admin") setRole("admin");
        else if (demoUser.role === "manager") setRole("manager");
        else setRole("support_worker");
        setLoading(false);
      } catch {
        localStorage.removeItem("demo_mode");
        localStorage.removeItem("demo_user");
      }
    }
  }, []);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
        if (session?.user) {
          setTimeout(() => fetchRole(session.user.id), 0);
        } else {
          setRole(null);
        }
        setLoading(false);
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session?.user) {
        fetchRole(session.user.id);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    // Check for demo account first
    const demoAccount = DEMO_ACCOUNTS[email.toLowerCase()];
    if (demoAccount && password === DEMO_PASSWORD) {
      setIsDemoMode(true);
      setDemoRole(demoAccount.role);
      // Map demo role to app role
      if (demoAccount.role === "admin") setRole("admin");
      else if (demoAccount.role === "manager") setRole("manager");
      else setRole("support_worker");
      // Save to localStorage for persistence
      localStorage.setItem("demo_mode", "true");
      localStorage.setItem("demo_user", JSON.stringify(demoAccount));
      return;
    }

    // Regular Supabase auth
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
  };

  const signOut = async () => {
    // Clear demo mode
    if (isDemoMode) {
      setIsDemoMode(false);
      setDemoRole(null);
      setRole(null);
      localStorage.removeItem("demo_mode");
      localStorage.removeItem("demo_user");
      return;
    }

    // Regular Supabase signout
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  };

  const isAdmin = role === "admin";
  const isManager = role === "admin" || role === "manager";
  const isSupportWorker = role === "support_worker";

  // Create a fake user object for demo mode
  const demoUser = isDemoMode && localStorage.getItem("demo_user") 
    ? JSON.parse(localStorage.getItem("demo_user")!) 
    : null;

  const effectiveUser = isDemoMode && demoUser ? {
    id: demoUser.id,
    email: demoUser.email,
    user_metadata: {
      display_name: demoUser.display_name,
      role: demoUser.role,
    },
  } as unknown as User : session?.user ?? null;

  // Consider demo mode as having a session
  const effectiveSession = isDemoMode ? ({ user: effectiveUser } as Session) : session;

  return (
    <AuthContext.Provider value={{ 
      session: effectiveSession, 
      user: effectiveUser, 
      loading, 
      role, 
      isAdmin, 
      isManager, 
      isSupportWorker, 
      isDemoMode,
      demoRole,
      signIn, 
      signOut 
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
}
