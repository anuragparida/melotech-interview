import { useEffect } from "react";
import { useAuth } from "@/lib/hooks/useAuth";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole: "admin" | "artist" | "any";
  fallback?: React.ReactNode;
}

export default function ProtectedRoute({
  children,
  requiredRole,
  fallback,
}: ProtectedRouteProps) {
  const { loading, isAuthenticated, isAdmin, redirectBasedOnAuth } = useAuth();

  useEffect(() => {
    if (!loading) {
      redirectBasedOnAuth(requiredRole);
    }
  }, [loading, isAuthenticated, isAdmin, requiredRole, redirectBasedOnAuth]);

  // Show loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="text-slate-400">Loading...</p>
        </div>
      </div>
    );
  }

  // Check authentication
  if (!isAuthenticated) {
    return (
      fallback || (
        <div className="min-h-screen bg-slate-900 flex items-center justify-center">
          <div className="text-center space-y-4">
            <h2 className="text-2xl font-bold text-white">
              Authentication Required
            </h2>
            <p className="text-slate-400">Please log in to access this page.</p>
          </div>
        </div>
      )
    );
  }

  // Check role-based access
  if (requiredRole === "admin" && !isAdmin) {
    return (
      fallback || (
        <div className="min-h-screen bg-slate-900 flex items-center justify-center">
          <div className="text-center space-y-4">
            <h2 className="text-2xl font-bold text-white">Access Denied</h2>
            <p className="text-slate-400">You don't have admin privileges.</p>
          </div>
        </div>
      )
    );
  }

  if (requiredRole === "artist" && isAdmin) {
    return (
      fallback || (
        <div className="min-h-screen bg-slate-900 flex items-center justify-center">
          <div className="text-center space-y-4">
            <h2 className="text-2xl font-bold text-white">Access Denied</h2>
            <p className="text-slate-400">This page is for artists only.</p>
          </div>
        </div>
      )
    );
  }

  // Render children if all checks pass
  return <>{children}</>;
}
