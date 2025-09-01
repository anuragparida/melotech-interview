import { useEffect, useState } from "react";
import supabase from "../supabase";

export function useAdmin() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  // Function to check admin status
  const fetchAdminStatus = async () => {
    setLoading(true);

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      setIsAdmin(false);
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from("users") // or "profiles"
      .select("admin")
      .eq("authid", user.id)
      .single();

    if (error) {
      console.error("Error fetching admin flag:", error);
      setIsAdmin(false);
    } else {
      setIsAdmin(data?.admin === true);
    }

    setLoading(false);
  };

  useEffect(() => {
    // Run on mount
    fetchAdminStatus();

    // Subscribe to auth state changes (login, logout, refresh)
    const { data: subscription } = supabase.auth.onAuthStateChange(() => {
      fetchAdminStatus();
    });

    // Cleanup listener on unmount
    return () => {
      subscription?.subscription?.unsubscribe();
    };
  }, []);

  return { isAdmin, loading };
}
