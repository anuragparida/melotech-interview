import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

// UI Components
import { Button } from "@/components/ui/button";

// Icons
import { LogOut } from "lucide-react";

// Hooks
import { useAuth } from "@/lib/hooks/useAuth";
import { useLogout } from "@/lib/hooks/useLogout";

function Admin() {
  const { isAdmin, loading, isAuthenticated } = useAuth();
  const { logout } = useLogout();
  const navigate = useNavigate();

  // Authentication check and redirects
  useEffect(() => {
    if (!loading) {
      if (!isAuthenticated) {
        navigate("/");
      } else if (!isAdmin) {
        navigate("/artist");
      }
    }
  }, [loading, isAuthenticated, isAdmin, navigate]);

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

  // Don't render if not authenticated or not admin (redirects will handle this)
  if (!isAuthenticated || !isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center">
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold text-white">Welcome, Admin!</h1>
        <p className="text-slate-400">
          You have successfully accessed the admin panel.
        </p>
        <div className="flex gap-4 justify-center">
          <Button
            onClick={() => navigate("/adminview")}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white"
          >
            Go to Admin Dashboard
          </Button>
          <Button
            onClick={logout}
            variant="outline"
            className="px-6 py-3 border-slate-600 text-slate-300 hover:bg-slate-800"
          >
            <LogOut className="h-4 w-4 mr-2" />
            Logout
          </Button>
        </div>
      </div>
    </div>
  );
}

export default Admin;
