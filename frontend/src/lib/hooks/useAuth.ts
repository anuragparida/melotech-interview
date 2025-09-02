import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import supabase from "../supabase";

interface AuthState {
  user: any | null;
  isAdmin: boolean;
  loading: boolean;
  isAuthenticated: boolean;
}

export function useAuth() {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    isAdmin: false,
    loading: true,
    isAuthenticated: false,
  });
  const navigate = useNavigate();

  const fetchUserData = async () => {
    setAuthState((prev) => ({ ...prev, loading: true }));

    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        setAuthState({
          user: null,
          isAdmin: false,
          loading: false,
          isAuthenticated: false,
        });
        return;
      }

      // Get admin status from users table
      const { data: userData, error: userDataError } = await supabase
        .from("users")
        .select("admin")
        .eq("authid", user.id)
        .single();

      if (userDataError) {
        console.error("Error fetching user data:", userDataError);
        setAuthState({
          user,
          isAdmin: false,
          loading: false,
          isAuthenticated: true,
        });
      } else {
        setAuthState({
          user,
          isAdmin: userData?.admin === true,
          loading: false,
          isAuthenticated: true,
        });
      }
    } catch (error) {
      console.error("Error in fetchUserData:", error);
      setAuthState({
        user: null,
        isAdmin: false,
        loading: false,
        isAuthenticated: false,
      });
    }
  };

  useEffect(() => {
    // Initial fetch
    fetchUserData();

    // Subscribe to auth state changes
    const { data: subscription } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (event === "SIGNED_OUT" || !session) {
          setAuthState({
            user: null,
            isAdmin: false,
            loading: false,
            isAuthenticated: false,
          });
        } else {
          fetchUserData();
        }
      }
    );

    return () => {
      subscription?.subscription?.unsubscribe();
    };
  }, []);

  const redirectBasedOnAuth = (requiredRole: "admin" | "artist" | "any") => {
    if (authState.loading) return;

    if (!authState.isAuthenticated) {
      navigate("/");
      return;
    }

    if (requiredRole === "admin" && !authState.isAdmin) {
      navigate("/artist");
      return;
    }

    if (requiredRole === "artist" && authState.isAdmin) {
      navigate("/admin");
      return;
    }
  };

  return {
    ...authState,
    redirectBasedOnAuth,
    refetch: fetchUserData,
  };
}
