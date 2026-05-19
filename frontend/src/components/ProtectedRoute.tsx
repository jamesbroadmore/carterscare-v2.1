import { useAuth } from "@/contexts/AuthContext";
import { Navigate } from "react-router-dom";
import { Loader2 } from "lucide-react";

interface ProtectedRouteProps {
  children: React.ReactNode;
  adminOnly?: boolean;
  managerOnly?: boolean; // Manager or Admin can access
}

export function ProtectedRoute({ children, adminOnly = false, managerOnly = false }: ProtectedRouteProps) {
  const { session, loading, isAdmin, isManager, role } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
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
    return <Navigate to="/worker" replace />;
  }

  // Manager-only routes (managers and admins can access)
  if (managerOnly && !isManager && !isAdmin) {
    return <Navigate to="/worker" replace />;
  }

  return <>{children}</>;
}
