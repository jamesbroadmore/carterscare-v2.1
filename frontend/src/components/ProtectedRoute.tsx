import { useAuth } from "@/contexts/AuthContext";
import { Navigate } from "react-router-dom";
import { Loader2 } from "lucide-react";

interface ProtectedRouteProps {
  children: React.ReactNode;
  adminOnly?: boolean;
  managerOnly?: boolean; // Manager or Admin can access
  allowWorker?: boolean; // Explicit: support_worker can access
}

export function ProtectedRoute({
  children,
  adminOnly = false,
  managerOnly = false,
  allowWorker = false,
}: ProtectedRouteProps) {
  const { session, loading, isAdmin, isManager, isSupportWorker, role, isDemoMode, demoRole, clientPortalSession } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  // Client portal session has no business in staff routes — send to portal
  if (clientPortalSession) {
    return <Navigate to="/client-portal" replace />;
  }

  // Demo client role — send to client portal
  if (isDemoMode && demoRole === "client") {
    return <Navigate to="/client-portal" replace />;
  }

  if (!session) {
    return <Navigate to="/login" replace />;
  }

  // Wait for role to load
  if (role === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  // Admin-only routes
  if (adminOnly && !isAdmin) {
    return <Navigate to={isSupportWorker ? "/worker" : "/"} replace />;
  }

  // Manager-only routes
  if (managerOnly && !isManager && !isAdmin) {
    return <Navigate to={isSupportWorker ? "/worker" : "/"} replace />;
  }

  return <>{children}</>;
}
