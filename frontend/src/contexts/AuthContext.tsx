import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Session, User } from "@supabase/supabase-js";
import { DEMO_ACCOUNTS, DEMO_PASSWORD, type DemoRole } from "./DemoContext";

// Security clearance levels: support_worker < manager < admin
type AppRole = "admin" | "manager" | "support_worker";

// Client portal session (separate from Supabase auth)
export interface ClientPortalSession {
  client_id: string;
  username: string;
  display_name: string;
}

interface AuthContextType {
  session: Session | null;
  user: User | null;
  loading: boolean;
  role: AppRole | null;
  isAdmin: boolean;
  isManager: boolean;
  isSupportWorker: boolean;
  isClient: boolean;
  isDemoMode: boolean;
  demoRole: DemoRole | null;
  clientPortalSession: ClientPortalSession | null;
  /** Returns the path to redirect to after login */
  signIn: (email: string, password: string) => Promise<string>;
  /** Returns "/client-portal" on success */
  signInClientPortal: (username: string, accessCode: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState<AppRole | null>(null);
  const [isDemoMode, setIsDemoMode] = useState(false);
  const [demoRole, setDemoRole] = useState<DemoRole | null>(null);
  const [clientPortalSession, setClientPortalSession] = useState<ClientPortalSession | null>(null);

  const fetchRole = async (userId: string) => {
    const { data } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .single();
    const rawRole = data?.role;
    if (rawRole === "admin") {
      setRole("admin");
    } else if (rawRole === "moderator" || rawRole === "manager") {
      setRole("manager");
    } else {
      setRole("support_worker");
    }
  };

  // Restore sessions on mount
  useEffect(() => {
    // Check for demo session first
    const savedDemoMode = localStorage.getItem("demo_mode");
    const savedDemoUser = localStorage.getItem("demo_user");
    if (savedDemoMode === "true" && savedDemoUser) {
      try {
        const demoUser = JSON.parse(savedDemoUser);
        setIsDemoMode(true);
        setDemoRole(demoUser.role);
        if (demoUser.role === "admin") setRole("admin");
        else if (demoUser.role === "manager") setRole("manager");
        else if (demoUser.role === "support_worker") setRole("support_worker");
        // client role — no staff role
        setLoading(false);
        return;
      } catch {
        localStorage.removeItem("demo_mode");
        localStorage.removeItem("demo_user");
      }
    }

    // Check for client portal session
    const savedClientSession = localStorage.getItem("client_portal_session");
    if (savedClientSession) {
      try {
        setClientPortalSession(JSON.parse(savedClientSession));
        setLoading(false);
        return;
      } catch {
        localStorage.removeItem("client_portal_session");
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

  /** Returns the redirect path for the caller to navigate to */
  const signIn = async (email: string, password: string): Promise<string> => {
    const demoAccount = DEMO_ACCOUNTS[email.toLowerCase()];
    if (demoAccount && password === DEMO_PASSWORD) {
      setIsDemoMode(true);
      setDemoRole(demoAccount.role);

      if (demoAccount.role === "admin") setRole("admin");
      else if (demoAccount.role === "manager") setRole("manager");
      else if (demoAccount.role === "support_worker") setRole("support_worker");

      localStorage.setItem("demo_mode", "true");
      localStorage.setItem("demo_user", JSON.stringify(demoAccount));

      // Return role-based redirect path
      if (demoAccount.role === "client") return "/client-portal";
      if (demoAccount.role === "support_worker") return "/worker";
      return "/";
    }

    // Regular Supabase auth
    const { data: authData, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;

    // Fetch role to determine redirect
    if (authData.user) {
      const { data: roleData } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", authData.user.id)
        .single();
      if (roleData?.role === "support_worker") return "/worker";
    }
    return "/";
  };

  const signInClientPortal = async (username: string, accessCode: string): Promise<void> => {
    // Demo client portal credentials
    const DEMO_CLIENT_USERNAME = "robert.thompson";
    const DEMO_CLIENT_ACCESS_CODE = "472819";

    if (username.toLowerCase().trim() === DEMO_CLIENT_USERNAME && accessCode.trim() === DEMO_CLIENT_ACCESS_CODE) {
      const portalSession: ClientPortalSession = {
        client_id: "c1",
        username: DEMO_CLIENT_USERNAME,
        display_name: "Robert Thompson",
      };
      setClientPortalSession(portalSession);
      localStorage.setItem("client_portal_session", JSON.stringify(portalSession));
      return;
    }

    // Real Supabase lookup
    const { data, error } = await supabase
      .from("clients")
      .select("id, first_name, last_name, portal_username, access_code")
      .eq("portal_username", username.toLowerCase().trim())
      .single();

    if (error || !data) throw new Error("Invalid username or access code");
    if (data.access_code !== accessCode.trim()) throw new Error("Invalid username or access code");

    const portalSession: ClientPortalSession = {
      client_id: data.id,
      username: data.portal_username,
      display_name: `${data.first_name} ${data.last_name}`,
    };
    setClientPortalSession(portalSession);
    localStorage.setItem("client_portal_session", JSON.stringify(portalSession));
  };

  const signOut = async () => {
    // Clear client portal session
    if (clientPortalSession) {
      setClientPortalSession(null);
      localStorage.removeItem("client_portal_session");
      return;
    }

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
  const isClient = !!clientPortalSession || demoRole === "client";

  const demoUserRaw = isDemoMode && localStorage.getItem("demo_user")
    ? JSON.parse(localStorage.getItem("demo_user")!)
    : null;

  const effectiveUser = isDemoMode && demoUserRaw ? {
    id: demoUserRaw.id,
    email: demoUserRaw.email,
    user_metadata: {
      display_name: demoUserRaw.display_name,
      role: demoUserRaw.role,
    },
  } as unknown as User : session?.user ?? null;

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
      isClient,
      isDemoMode,
      demoRole,
      clientPortalSession,
      signIn,
      signInClientPortal,
      signOut,
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
