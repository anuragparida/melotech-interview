import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";

// UI Components
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

// Icons
import {
  Edit,
  Save,
  X,
  ExternalLink,
  Eye,
  Plus,
  Music,
  Headphones,
  Play,
} from "lucide-react";

// Hooks and Utils
import { toast, useToast } from "@/lib/hooks/useToast";
import { useAuth } from "@/lib/hooks/useAuth";
import { useLogout } from "@/lib/hooks/useLogout";
import { getUser, updateUser } from "@/lib/supabaseutils/api";

export default function Artist() {
  const { isAdmin, loading, isAuthenticated, redirectBasedOnAuth } = useAuth();
  const { logout } = useLogout();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [isEditing, setIsEditing] = useState(false);
  const [artistData, setArtistData] = useState({
    name: "",
    email: "",
    phone: "",
    instagram: "",
    soundcloud: "",
    spotify: "",
    biography: "",
  });

  // Authentication check and redirects
  useEffect(() => {
    if (!loading) {
      if (!isAuthenticated) {
        navigate("/");
      } else if (isAdmin) {
        navigate("/admin");
      }
    }
  }, [loading, isAuthenticated, isAdmin, navigate]);

  // Fetch user data
  useEffect(() => {
    if (isAuthenticated && !isAdmin) {
      getUser()
        .then((data) => {
          // Fetched artist data successfully
          setArtistData(data);
        })
        .catch((error) => {
          // Error fetching user data
          toast({
            title: "Error Loading Profile",
            description:
              "Failed to load your profile data. Please refresh the page.",
            variant: "destructive",
          });
        });
    }
  }, [isAuthenticated, isAdmin, toast]);

  const handleInputChange = (field: string, value: string) => {
    setArtistData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    setIsEditing(false);
    // Saving artist data
    try {
      const updated = await updateUser(artistData);
      setArtistData(updated);
      toast({
        title: "Profile Updated",
        description: "Your profile has been saved successfully.",
      });
    } catch (err) {
      // Error saving profile
      toast({
        title: "Save Failed",
        description:
          err.message || "Failed to save your profile. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
  };

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

  // Don't render if not authenticated or if admin (redirects will handle this)
  if (!isAuthenticated || isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-slate-900">
      <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 pointer-events-none" />

      <div className="relative z-10 p-8">
        <div className="max-w-7xl mx-auto space-y-8">
          <div className="text-center space-y-6">
            <div className="inline-flex items-center gap-3 px-6 py-3 rounded-full bg-slate-800/50 backdrop-blur-sm border border-slate-700/50">
              <Music className="h-5 w-5 text-blue-400" />
              <span className="text-sm font-medium text-slate-300">
                Artist Management Portal
              </span>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-4 justify-center">
              <Link to="/submissions/view" style={{ textDecoration: "none" }}>
                <Button
                  variant="outline"
                  className="flex items-center gap-2 bg-slate-800/30 backdrop-blur-sm border-slate-700/50 hover:bg-slate-700/50 text-slate-200 hover:text-white transition-all duration-300"
                >
                  <Eye className="h-4 w-4" />
                  View Submissions
                </Button>
              </Link>
              <Link to="/submissions/create" style={{ textDecoration: "none" }}>
                <Button className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-600/25 transition-all duration-300">
                  <Plus className="h-4 w-4" />
                  Create Submission
                </Button>
              </Link>
              <Button
                onClick={logout}
                variant="outline"
                className="flex items-center gap-2 bg-slate-800/30 backdrop-blur-sm border-slate-700/50 hover:bg-slate-700/50 text-slate-200 hover:text-white transition-all duration-300"
              >
                <X className="h-4 w-4" />
                Logout
              </Button>
            </div>
          </div>

          {/* Main Content */}
          <div className="grid lg:grid-cols-5 gap-8">
            <div className="lg:col-span-2">
              <Card className="bg-slate-800/50 backdrop-blur-sm border-slate-700/50 shadow-2xl shadow-black/20">
                <CardContent className="p-8">
                  <div className="flex flex-col items-center space-y-6">
                    <div className="relative">
                      <div className="absolute inset-0 bg-blue-500/20 rounded-full blur-xl scale-110" />
                      <Avatar className="h-56 w-56 relative border-4 border-blue-500/20 shadow-2xl">
                        <AvatarImage
                          src="/professional-female-artist-headshot.png"
                          alt={artistData.name}
                        />
                        <AvatarFallback className="text-3xl bg-gradient-to-br from-blue-500/20 to-purple-500/20 text-white">
                          {artistData.name
                            .split(" ")
                            .map((n) => n[0])
                            .join("")}
                        </AvatarFallback>
                      </Avatar>
                    </div>

                    <div className="text-center space-y-2">
                      <h1 className="text-3xl font-bold text-balance text-white">
                        {artistData.name}
                      </h1>
                      <div className="flex items-center justify-center gap-4 text-slate-400">
                        <div className="flex items-center gap-1">
                          <Headphones className="h-4 w-4" />
                          <span className="text-sm">Producer</span>
                        </div>
                        <div className="w-1 h-1 bg-slate-400 rounded-full" />
                        <div className="flex items-center gap-1">
                          <Play className="h-4 w-4" />
                          <span className="text-sm">Artist</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="lg:col-span-3">
              <Card className="bg-slate-800/50 backdrop-blur-sm border-slate-700/50 shadow-2xl shadow-black/20">
                <CardHeader className="flex flex-row items-center justify-between border-b border-slate-700/50 pb-6">
                  <CardTitle className="text-2xl font-bold text-white">
                    Artist Details
                  </CardTitle>
                  {!isEditing ? (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setIsEditing(true)}
                      className="flex items-center gap-2 bg-slate-800/30 backdrop-blur-sm border-slate-700/50 hover:bg-blue-600/10 hover:border-blue-500/50 text-slate-200 hover:text-white transition-all duration-300"
                    >
                      <Edit className="h-4 w-4" />
                      Edit Profile
                    </Button>
                  ) : (
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={handleSave}
                        className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-600/25"
                      >
                        <Save className="h-4 w-4" />
                        Save Changes
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleCancel}
                        className="flex items-center gap-2 bg-slate-800/30 backdrop-blur-sm border-slate-700/50 hover:bg-red-600/10 hover:border-red-500/50 text-slate-200 hover:text-white"
                      >
                        <X className="h-4 w-4" />
                        Cancel
                      </Button>
                    </div>
                  )}
                </CardHeader>
                <CardContent className="p-8 space-y-8">
                  <div className="grid md:grid-cols-2 gap-8">
                    {/* Name */}
                    <div className="space-y-3">
                      <Label
                        htmlFor="name"
                        className="text-sm font-semibold text-slate-200"
                      >
                        Full Name
                      </Label>
                      {isEditing ? (
                        <Input
                          id="name"
                          value={artistData.name}
                          onChange={(e) =>
                            handleInputChange("name", e.target.value)
                          }
                          className="bg-slate-700/50 border-slate-600/50 focus:border-blue-500/50 focus:ring-blue-500/25 text-white transition-all duration-300"
                        />
                      ) : (
                        <p className="text-slate-200 font-medium py-2">
                          {artistData.name}
                        </p>
                      )}
                    </div>

                    {/* Email */}
                    <div className="space-y-3">
                      <Label
                        htmlFor="email"
                        className="text-sm font-semibold text-slate-200"
                      >
                        Email Address
                      </Label>
                      <p className="text-slate-400 font-medium py-2 select-none">
                        {artistData.email}
                      </p>
                    </div>
                    {/* <div className="space-y-3">
                      <Label
                        htmlFor="email"
                        className="text-sm font-semibold text-slate-200"
                      >
                        Email Address
                      </Label>
                      {isEditing ? (
                        <Input
                          id="email"
                          type="email"
                          value={artistData.email}
                          onChange={(e) =>
                            handleInputChange("email", e.target.value)
                          }
                          className="bg-slate-700/50 border-slate-600/50 focus:border-blue-500/50 focus:ring-blue-500/25 text-white transition-all duration-300"
                        />
                      ) : (
                        <p className="text-slate-200 font-medium py-2">
                          {artistData.email}
                        </p>
                      )}
                    </div> */}

                    {/* Phone */}
                    <div className="space-y-3">
                      <Label
                        htmlFor="phone"
                        className="text-sm font-semibold text-slate-200"
                      >
                        Phone Number
                      </Label>
                      {isEditing ? (
                        <Input
                          id="phone"
                          value={artistData.phone}
                          onChange={(e) =>
                            handleInputChange("phone", e.target.value)
                          }
                          className="bg-slate-700/50 border-slate-600/50 focus:border-blue-500/50 focus:ring-blue-500/25 text-white transition-all duration-300"
                        />
                      ) : (
                        <p className="text-slate-200 font-medium py-2">
                          {artistData.phone}
                        </p>
                      )}
                    </div>

                    {/* Instagram */}
                    <div className="space-y-3">
                      <Label
                        htmlFor="instagram"
                        className="text-sm font-semibold text-slate-200"
                      >
                        Instagram
                      </Label>
                      {isEditing ? (
                        <Input
                          id="instagram"
                          value={artistData.instagram}
                          onChange={(e) =>
                            handleInputChange("instagram", e.target.value)
                          }
                          placeholder="@username"
                          className="bg-slate-700/50 border-slate-600/50 focus:border-blue-500/50 focus:ring-blue-500/25 text-white transition-all duration-300"
                        />
                      ) : (
                        <div className="flex items-center gap-3 py-2">
                          <p className="text-slate-200 font-medium flex-1">
                            {artistData.instagram}
                          </p>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 hover:bg-blue-600/10 hover:text-blue-400 text-slate-400 transition-all duration-300"
                          >
                            <ExternalLink className="h-4 w-4" />
                          </Button>
                        </div>
                      )}
                    </div>

                    {/* SoundCloud */}
                    <div className="space-y-3">
                      <Label
                        htmlFor="soundcloud"
                        className="text-sm font-semibold text-slate-200"
                      >
                        SoundCloud
                      </Label>
                      {isEditing ? (
                        <Input
                          id="soundcloud"
                          value={artistData.soundcloud}
                          onChange={(e) =>
                            handleInputChange("soundcloud", e.target.value)
                          }
                          placeholder="username"
                          className="bg-slate-700/50 border-slate-600/50 focus:border-blue-500/50 focus:ring-blue-500/25 text-white transition-all duration-300"
                        />
                      ) : (
                        <div className="flex items-center gap-3 py-2">
                          <p className="text-slate-200 font-medium flex-1">
                            {artistData.soundcloud}
                          </p>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 hover:bg-blue-600/10 hover:text-blue-400 text-slate-400 transition-all duration-300"
                          >
                            <ExternalLink className="h-4 w-4" />
                          </Button>
                        </div>
                      )}
                    </div>

                    {/* Spotify */}
                    <div className="space-y-3">
                      <Label
                        htmlFor="spotify"
                        className="text-sm font-semibold text-slate-200"
                      >
                        Spotify
                      </Label>
                      {isEditing ? (
                        <Input
                          id="spotify"
                          value={artistData.spotify}
                          onChange={(e) =>
                            handleInputChange("spotify", e.target.value)
                          }
                          placeholder="Artist name"
                          className="bg-slate-700/50 border-slate-600/50 focus:border-blue-500/50 focus:ring-blue-500/25 text-white transition-all duration-300"
                        />
                      ) : (
                        <div className="flex items-center gap-3 py-2">
                          <p className="text-slate-200 font-medium flex-1">
                            {artistData.spotify}
                          </p>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 hover:bg-blue-600/10 hover:text-blue-400 text-slate-400 transition-all duration-300"
                          >
                            <ExternalLink className="h-4 w-4" />
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Biography */}
                  <div className="space-y-3">
                    <Label
                      htmlFor="biography"
                      className="text-sm font-semibold text-slate-200"
                    >
                      Artist Biography
                    </Label>
                    {isEditing ? (
                      <Textarea
                        id="biography"
                        value={artistData.biography}
                        onChange={(e) =>
                          handleInputChange("biography", e.target.value)
                        }
                        rows={6}
                        placeholder="Tell us about your musical journey, influences, and achievements..."
                        className="bg-slate-700/50 border-slate-600/50 focus:border-blue-500/50 focus:ring-blue-500/25 text-white transition-all duration-300 resize-none"
                      />
                    ) : (
                      <div className="bg-slate-700/20 rounded-lg p-6 border border-slate-600/30">
                        <p className="text-slate-200 leading-relaxed text-pretty">
                          {artistData.biography}
                        </p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
