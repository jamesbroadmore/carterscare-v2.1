import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { useNavigate, Navigate } from "react-router-dom";
import {
  Loader2, Mail, Lock, Eye, EyeOff, AlertCircle,
  Users, Shield, UserCircle, Heart, User, Hash
} from "lucide-react";
import cartersLogo from "@/assets/Carters-Logo.png";
import cartersIcon from "@/assets/icon.png";
import { DEMO_PASSWORD } from "@/contexts/DemoContext";

const DEMO_QUICK_ACCESS = [
  { email: "demo@admin.carterscare.com", label: "Admin", icon: Shield, color: "from-purple-500 to-violet-500", desc: "Full platform access" },
  { email: "demo@manager.carterscare.com", label: "Manager", icon: Users, color: "from-blue-500 to-cyan-500", desc: "Team management" },
  { email: "demo@worker.carterscare.com", label: "Support Worker", icon: UserCircle, color: "from-teal-500 to-green-500", desc: "Care delivery" },
  { email: "demo@client.carterscare.com", label: "Client", icon: Heart, color: "from-pink-500 to-rose-500", desc: "Client portal" },
];

export default function Login() {
  const { signIn, signInClientPortal, session, loading: authLoading, isDemoMode, clientPortalSession, demoRole } = useAuth();
  const navigate = useNavigate();

  // Tab: "staff" | "client"
  const [loginTab, setLoginTab] = useState<"staff" | "client">("staff");

  // Staff login fields
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const [touched, setTouched] = useState<{ email?: boolean; password?: boolean }>({});

  // Client portal fields
  const [username, setUsername] = useState("");
  const [accessCode, setAccessCode] = useState("");
  const [clientErrors, setClientErrors] = useState<{ username?: string; accessCode?: string }>({});
  const [clientTouched, setClientTouched] = useState<{ username?: boolean; accessCode?: boolean }>({});

  const [loading, setLoading] = useState(false);
  const [showDemoAccounts, setShowDemoAccounts] = useState(false);

  // Show spinner while auth is resolving
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "linear-gradient(135deg, #f5f3ff 0%, #ede9fe 30%, #dbeafe 70%, #e0f2fe 100%)" }}>
        <Loader2 className="h-8 w-8 animate-spin text-purple-500" />
      </div>
    );
  }

  // Already logged in — redirect
  if (clientPortalSession) return <Navigate to="/client-portal" replace />;
  if (isDemoMode) {
    if (demoRole === "support_worker") return <Navigate to="/worker" replace />;
    if (demoRole === "client") return <Navigate to="/client-portal" replace />;
    return <Navigate to="/" replace />;
  }
  if (session) return <Navigate to="/" replace />;

  // --- Staff login ---
  const validateEmail = (v: string) => !v ? "Email is required" : !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) ? "Enter a valid email" : undefined;
  const validatePassword = (v: string) => !v ? "Password is required" : v.length < 6 ? "Min 6 characters" : undefined;

  const handleBlur = (field: "email" | "password") => {
    setTouched((p) => ({ ...p, [field]: true }));
    if (field === "email") setErrors((p) => ({ ...p, email: validateEmail(email) }));
    else setErrors((p) => ({ ...p, password: validatePassword(password) }));
  };

  const handleStaffSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const emailErr = validateEmail(email);
    const pwErr = validatePassword(password);
    setErrors({ email: emailErr, password: pwErr });
    setTouched({ email: true, password: true });
    if (emailErr || pwErr) return;

    setLoading(true);
    try {
      const redirectTo = await signIn(email, password);
      toast.success("Welcome back!");
      navigate(redirectTo, { replace: true });
    } catch (err: any) {
      toast.error(err.message || "Authentication failed");
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = async (demoEmail: string) => {
    setLoading(true);
    try {
      const redirectTo = await signIn(demoEmail, DEMO_PASSWORD);
      toast.success("Welcome to the demo!");
      navigate(redirectTo, { replace: true });
    } catch (err: any) {
      toast.error("Demo login failed");
    } finally {
      setLoading(false);
    }
  };

  // --- Client portal login ---
  const validateUsername = (v: string) => !v.trim() ? "Username is required" : undefined;
  const validateAccessCode = (v: string) => !v.trim() ? "Access code is required" : !/^\d{6}$/.test(v.trim()) ? "Must be 6 digits" : undefined;

  const handleClientBlur = (field: "username" | "accessCode") => {
    setClientTouched((p) => ({ ...p, [field]: true }));
    if (field === "username") setClientErrors((p) => ({ ...p, username: validateUsername(username) }));
    else setClientErrors((p) => ({ ...p, accessCode: validateAccessCode(accessCode) }));
  };

  const handleClientSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const unErr = validateUsername(username);
    const acErr = validateAccessCode(accessCode);
    setClientErrors({ username: unErr, accessCode: acErr });
    setClientTouched({ username: true, accessCode: true });
    if (unErr || acErr) return;

    setLoading(true);
    try {
      await signInClientPortal(username, accessCode);
      toast.success("Welcome to your portal!");
      navigate("/client-portal", { replace: true });
    } catch (err: any) {
      toast.error(err.message || "Invalid username or access code");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex"
      style={{ background: "linear-gradient(135deg, #f5f3ff 0%, #ede9fe 30%, #dbeafe 70%, #e0f2fe 100%)" }}
      data-testid="login-page"
    >
      {/* Left decorative panel */}
      <div className="hidden lg:flex lg:w-1/2 flex-col items-center justify-center p-12 relative overflow-hidden">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-20 -left-20 w-72 h-72 rounded-full opacity-20" style={{ background: "linear-gradient(135deg, #a78bfa, #8b5cf6)" }} />
          <div className="absolute -bottom-20 -right-20 w-96 h-96 rounded-full opacity-15" style={{ background: "linear-gradient(135deg, #60a5fa, #3b82f6)" }} />
          <div className="absolute top-1/2 left-1/3 w-48 h-48 rounded-full opacity-10" style={{ background: "linear-gradient(135deg, #4ade80, #22c55e)" }} />
        </div>
        <div className="relative z-10 text-center max-w-md">
          <div className="flex items-center justify-center gap-4 mb-8">
            <img src={cartersIcon} alt="" className="h-20 w-20 sm:h-24 sm:w-24 md:h-28 md:w-28 rounded-2xl shadow-xl" loading="lazy" />
            <div className="text-left">
              <h1 className="text-4xl sm:text-5xl font-black text-slate-800 leading-tight">Carters</h1>
              <h1 className="text-4xl sm:text-5xl font-black leading-tight" style={{ background: "linear-gradient(135deg, #8b5cf6, #3b82f6)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>Care</h1>
            </div>
          </div>
          <h2 className="text-2xl font-bold text-slate-700 mb-4">Care Management Platform</h2>
          <p className="text-slate-500 leading-relaxed">
            Streamline your NDIS and aged care operations — rostering, compliance, incidents, timesheets and more.
          </p>
          <div className="flex flex-wrap gap-2 justify-center mt-8">
            {["Rostering", "Compliance", "Case Notes", "Timesheets", "Incidents", "Reports"].map((f) => (
              <span key={f} className="text-xs font-semibold px-3 py-1.5 rounded-full bg-white/60 backdrop-blur text-slate-600 shadow-sm border border-white/80">{f}</span>
            ))}
          </div>
        </div>
      </div>

      {/* Right login panel */}
      <div className="flex-1 flex items-center justify-center p-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-sm"
        >
          {/* Mobile logo */}
          <div className="lg:hidden text-center mb-8">
            <img src={cartersLogo} alt="Carters Care Group" className="h-12 sm:h-14 mx-auto" loading="lazy" />
          </div>

          <div className="bg-white rounded-3xl shadow-2xl border border-white/80 overflow-hidden" data-testid="login-card">
            <div className="h-2" style={{ background: "linear-gradient(90deg, #8b5cf6, #60a5fa, #4ade80)" }} />

            {/* Tab switcher */}
            <div className="flex border-b border-slate-100">
              <button
                onClick={() => setLoginTab("staff")}
                className={`flex-1 py-3.5 text-sm font-semibold flex items-center justify-center gap-2 transition-colors ${
                  loginTab === "staff"
                    ? "text-purple-700 border-b-2 border-purple-500 bg-purple-50/40"
                    : "text-slate-500 hover:text-slate-700"
                }`}
              >
                <Shield className="h-4 w-4" />
                Staff Login
              </button>
              <button
                onClick={() => setLoginTab("client")}
                className={`flex-1 py-3.5 text-sm font-semibold flex items-center justify-center gap-2 transition-colors ${
                  loginTab === "client"
                    ? "text-teal-700 border-b-2 border-teal-500 bg-teal-50/40"
                    : "text-slate-500 hover:text-slate-700"
                }`}
              >
                <Heart className="h-4 w-4" />
                Client Portal
              </button>
            </div>

            <div className="p-8">
              {/* ---- STAFF LOGIN ---- */}
              {loginTab === "staff" && (
                <>
                  <div className="mb-7">
                    <h2 className="text-2xl font-bold text-slate-800">Welcome back</h2>
                    <p className="text-sm text-slate-500 mt-1">Sign in to your Carters Care account</p>
                  </div>

                  <form onSubmit={handleStaffSubmit} className="space-y-4">
                    <div>
                      <label htmlFor="email" className="text-xs font-semibold text-slate-600 mb-2 block uppercase tracking-wide">Email</label>
                      <div className="relative">
                        <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <input
                          id="email"
                          type="email"
                          value={email}
                          onChange={(e) => { setEmail(e.target.value); if (touched.email) setErrors((p) => ({ ...p, email: validateEmail(e.target.value) })); }}
                          onBlur={() => handleBlur("email")}
                          placeholder="you@example.com"
                          autoComplete="email"
                          className={`w-full h-11 pl-10 pr-4 rounded-xl border ${touched.email && errors.email ? "border-red-400 bg-red-50" : "border-slate-200 bg-slate-50"} text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent transition-all`}
                        />
                      </div>
                      {touched.email && errors.email && (
                        <p className="text-xs text-red-500 mt-1.5 flex items-center gap-1">
                          <AlertCircle className="h-3 w-3" />{errors.email}
                        </p>
                      )}
                    </div>

                    <div>
                      <label htmlFor="password" className="text-xs font-semibold text-slate-600 mb-2 block uppercase tracking-wide">Password</label>
                      <div className="relative">
                        <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <input
                          id="password"
                          type={showPw ? "text" : "password"}
                          value={password}
                          onChange={(e) => { setPassword(e.target.value); if (touched.password) setErrors((p) => ({ ...p, password: validatePassword(e.target.value) })); }}
                          onBlur={() => handleBlur("password")}
                          placeholder="••••••••"
                          autoComplete="current-password"
                          className={`w-full h-11 pl-10 pr-10 rounded-xl border ${touched.password && errors.password ? "border-red-400 bg-red-50" : "border-slate-200 bg-slate-50"} text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent transition-all`}
                        />
                        <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                          {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                      {touched.password && errors.password && (
                        <p className="text-xs text-red-500 mt-1.5 flex items-center gap-1">
                          <AlertCircle className="h-3 w-3" />{errors.password}
                        </p>
                      )}
                    </div>

                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full h-11 rounded-xl text-white text-sm font-bold flex items-center justify-center gap-2 transition-all hover:opacity-90 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed shadow-lg mt-2"
                      style={{ background: "linear-gradient(135deg, #8b5cf6, #7c3aed)" }}
                    >
                      {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                      {loading ? "Signing in..." : "Sign In"}
                    </button>
                  </form>

                  <p className="text-center text-xs text-slate-400 mt-5">Contact your administrator for account access.</p>

                  {/* Demo accounts */}
                  <div className="mt-6 pt-5 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => setShowDemoAccounts(!showDemoAccounts)}
                      className="w-full text-sm text-purple-600 font-medium hover:text-purple-700 transition-colors flex items-center justify-center gap-2"
                    >
                      <Users className="h-4 w-4" />
                      {showDemoAccounts ? "Hide Demo Accounts" : "Try Demo Accounts"}
                    </button>
                    {showDemoAccounts && (
                      <div className="mt-4 space-y-2 animate-in fade-in slide-in-from-top-2 duration-300">
                        <p className="text-xs text-slate-500 text-center mb-3">Click any role to explore the platform</p>
                        <div className="grid grid-cols-2 gap-2">
                          {DEMO_QUICK_ACCESS.map((demo) => {
                            const Icon = demo.icon;
                            return (
                              <button
                                key={demo.email}
                                type="button"
                                onClick={() => handleDemoLogin(demo.email)}
                                disabled={loading}
                                className={`p-3 rounded-xl bg-gradient-to-br ${demo.color} text-white text-left hover:opacity-90 transition-all hover:scale-[1.02] disabled:opacity-50`}
                              >
                                <Icon className="h-5 w-5 mb-1.5" />
                                <p className="text-xs font-bold">{demo.label}</p>
                                <p className="text-[10px] opacity-80">{demo.desc}</p>
                              </button>
                            );
                          })}
                        </div>
                        <p className="text-[10px] text-slate-400 text-center mt-3">
                          Demo accounts use sample data for presentations
                        </p>
                      </div>
                    )}
                  </div>
                </>
              )}

              {/* ---- CLIENT PORTAL LOGIN ---- */}
              {loginTab === "client" && (
                <>
                  <div className="mb-7">
                    <h2 className="text-2xl font-bold text-slate-800">Client Portal</h2>
                    <p className="text-sm text-slate-500 mt-1">Access your care information and schedule</p>
                  </div>

                  <form onSubmit={handleClientSubmit} className="space-y-4">
                    <div>
                      <label htmlFor="portal-username" className="text-xs font-semibold text-slate-600 mb-2 block uppercase tracking-wide">Username</label>
                      <div className="relative">
                        <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <input
                          id="portal-username"
                          type="text"
                          value={username}
                          onChange={(e) => { setUsername(e.target.value); if (clientTouched.username) setClientErrors((p) => ({ ...p, username: validateUsername(e.target.value) })); }}
                          onBlur={() => handleClientBlur("username")}
                          placeholder="firstname.lastname"
                          autoComplete="username"
                          className={`w-full h-11 pl-10 pr-4 rounded-xl border ${clientTouched.username && clientErrors.username ? "border-red-400 bg-red-50" : "border-slate-200 bg-slate-50"} text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-400 focus:border-transparent transition-all`}
                        />
                      </div>
                      {clientTouched.username && clientErrors.username && (
                        <p className="text-xs text-red-500 mt-1.5 flex items-center gap-1">
                          <AlertCircle className="h-3 w-3" />{clientErrors.username}
                        </p>
                      )}
                    </div>

                    <div>
                      <label htmlFor="access-code" className="text-xs font-semibold text-slate-600 mb-2 block uppercase tracking-wide">Access Code</label>
                      <div className="relative">
                        <Hash className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <input
                          id="access-code"
                          type="text"
                          inputMode="numeric"
                          pattern="[0-9]*"
                          maxLength={6}
                          value={accessCode}
                          onChange={(e) => {
                            const v = e.target.value.replace(/\D/g, "").slice(0, 6);
                            setAccessCode(v);
                            if (clientTouched.accessCode) setClientErrors((p) => ({ ...p, accessCode: validateAccessCode(v) }));
                          }}
                          onBlur={() => handleClientBlur("accessCode")}
                          placeholder="6-digit code"
                          autoComplete="one-time-code"
                          className={`w-full h-11 pl-10 pr-4 rounded-xl border ${clientTouched.accessCode && clientErrors.accessCode ? "border-red-400 bg-red-50" : "border-slate-200 bg-slate-50"} text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-400 focus:border-transparent transition-all tracking-widest font-mono`}
                        />
                      </div>
                      {clientTouched.accessCode && clientErrors.accessCode && (
                        <p className="text-xs text-red-500 mt-1.5 flex items-center gap-1">
                          <AlertCircle className="h-3 w-3" />{clientErrors.accessCode}
                        </p>
                      )}
                    </div>

                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full h-11 rounded-xl text-white text-sm font-bold flex items-center justify-center gap-2 transition-all hover:opacity-90 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed shadow-lg mt-2"
                      style={{ background: "linear-gradient(135deg, #14b8a6, #0891b2)" }}
                    >
                      {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                      {loading ? "Accessing portal..." : "Access My Portal"}
                    </button>
                  </form>

                  <div className="mt-5 p-4 rounded-xl bg-teal-50 border border-teal-100">
                    <p className="text-xs text-teal-700 font-medium mb-1">Your access credentials</p>
                    <p className="text-xs text-teal-600">Your username and 6-digit access code are provided by your Carters Care coordinator.</p>
                  </div>

                  {/* Demo hint */}
                  <div className="mt-4 pt-4 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => { setUsername("robert.thompson"); setAccessCode("472819"); }}
                      className="w-full text-xs text-teal-600 font-medium hover:text-teal-700 transition-colors flex items-center justify-center gap-2 py-2 rounded-lg hover:bg-teal-50"
                    >
                      <Heart className="h-3.5 w-3.5" />
                      Fill Demo Credentials
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
