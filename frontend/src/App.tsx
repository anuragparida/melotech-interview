import type React from "react";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

// UI Components
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

// Icons
import { Music, LogIn } from "lucide-react";

// Hooks and Utils
import { toast, useToast } from "@/lib/hooks/useToast";
import { useAuth } from "./lib/hooks/useAuth";
import supabase from "./lib/supabase";

export default function App() {
  const { isAuthenticated, isAdmin, loading } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [loginData, setLoginData] = useState({
    email: "",
    password: "",
  });

  // Redirect if already authenticated
  useEffect(() => {
    if (!loading && isAuthenticated) {
      if (isAdmin) {
        navigate("/admin");
      } else {
        navigate("/artist");
      }
    }
  }, [loading, isAuthenticated, isAdmin, navigate]);

  const handleInputChange = (field: string, value: string) => {
    setLoginData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Login attempt:", loginData);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: loginData.email,
        password: loginData.password,
      });

      if (error) {
        console.error("Login error:", error.message);
        toast({
          title: "Login Failed",
          description: error.message || "Invalid email or password",
          variant: "destructive",
        });
        return;
      }

      console.log("Logged in:", data);
      toast({
        title: "Login Successful",
        description: "Welcome back!",
      });
      // The useAuth hook will automatically handle the redirect
      // based on the user's admin status
    } catch (error) {
      console.error("Login error:", error);
      toast({
        title: "Login Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Show loading state if checking authentication
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

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-8">
      <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 pointer-events-none" />

      <div className="relative z-10 w-full max-w-md">
        <div className="text-center space-y-6 mb-8">
          <div className="inline-flex items-center gap-3 px-6 py-3 rounded-full bg-slate-800/50 backdrop-blur-sm border border-slate-700/50">
            <Music className="h-5 w-5 text-blue-400" />
            <span className="text-sm font-medium text-slate-300">MeloTech</span>
          </div>

          <div className="space-y-2">
            <h1 className="text-3xl font-bold text-white text-balance">
              Welcome Back
            </h1>
            <p className="text-slate-400">Sign in to your artist portal</p>
          </div>
        </div>

        <Card className="bg-slate-800/50 backdrop-blur-sm border-slate-700/50 shadow-2xl shadow-black/20">
          <CardHeader className="text-center pb-6">
            <CardTitle className="text-2xl font-bold text-white">
              Sign In
            </CardTitle>
          </CardHeader>
          <CardContent className="p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-3">
                <Label
                  htmlFor="email"
                  className="text-sm font-semibold text-slate-200"
                >
                  Email Address
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={loginData.email}
                  onChange={(e) => handleInputChange("email", e.target.value)}
                  placeholder="Enter your email"
                  required
                  className="bg-slate-700/50 border-slate-600/50 focus:border-blue-500/50 focus:ring-blue-500/25 text-white placeholder:text-slate-400 transition-all duration-300"
                />
              </div>

              <div className="space-y-3">
                <Label
                  htmlFor="password"
                  className="text-sm font-semibold text-slate-200"
                >
                  Password
                </Label>
                <Input
                  id="password"
                  type="password"
                  value={loginData.password}
                  onChange={(e) =>
                    handleInputChange("password", e.target.value)
                  }
                  placeholder="Enter your password"
                  required
                  className="bg-slate-700/50 border-slate-600/50 focus:border-blue-500/50 focus:ring-blue-500/25 text-white placeholder:text-slate-400 transition-all duration-300"
                />
              </div>

              <Button
                type="submit"
                className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-600/25 transition-all duration-300 py-3"
              >
                <LogIn className="h-4 w-4" />
                Sign In
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
