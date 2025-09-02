import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

// UI Components
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// Icons
import {
  Play,
  Pause,
  Save,
  Settings,
  Star,
  Edit,
  X,
  Wifi,
  WifiOff,
  RefreshCw,
  Search,
  Filter,
  X as XIcon,
} from "lucide-react";

// Audio Visualization - Conditional import to avoid React 19 compatibility issues
let AudioVisualizer: any = null;
try {
  const audioVisualizeModule = require("react-audio-visualize");
  AudioVisualizer = audioVisualizeModule.AudioVisualizer;
} catch (error) {
  // Audio visualizer not available, using fallback
}

// Hooks and Utils
import { useToast } from "@/lib/hooks/useToast";
import { useAuth } from "@/lib/hooks/useAuth";
import { useLogout } from "@/lib/hooks/useLogout";
import { getSubmissions, updateSubmissionAdmin } from "@/lib/supabaseutils/api";
import { useAdminWebSocket } from "@/lib/hooks/useAdminWebSocket";

interface Submission {
  id: string;
  title: string;
  artist: string;
  genre: string;
  bpm: number;
  key: string;
  description: string;
  rating: number;
  feedback: string;
  status: "pending" | "in-review" | "approved" | "rejected";
  submittedAt: string;
  files: string[];
  duration?: string;
  users?: {
    name: string;
  } | null;
}

export default function AdminPage() {
  const { isAdmin, loading, isAuthenticated } = useAuth();
  const { logout } = useLogout();
  const navigate = useNavigate();
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [metaLoaded, setMetaLoaded] = useState(false);
  const [progress, setProgress] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [filteredSubmissions, setFilteredSubmissions] = useState<Submission[]>(
    []
  );
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [genreFilter, setGenreFilter] = useState<string>("all");
  const [ratingFilter, setRatingFilter] = useState<string>("all");
  const { toast } = useToast();

  // WebSocket for real-time updates
  const { isConnected: isWebSocketConnected } = useAdminWebSocket({
    onSubmissionUpdate: (update: any) => {
      // Update the specific submission in the list
      setSubmissions((prev: Submission[]) =>
        prev.map((submission: Submission) =>
          submission.id === update.submission_id
            ? {
                ...submission,
                status: update.new_data.status as
                  | "pending"
                  | "in-review"
                  | "approved"
                  | "rejected",
                rating: update.new_data.rating,
                feedback: update.new_data.feedback,
              }
            : submission
        )
      );

      // Show toast notification
      toast({
        title: "Submission Updated",
        description: `${update.title} has been updated`,
      });
    },
    onConnectionChange: (connected: boolean) => {
      if (connected) {
        toast({
          title: "Real-time Updates Connected",
          description: "You'll receive live updates for submission changes",
        });
      } else {
        // If WebSocket connection fails, fallback to normal fetching
        toast({
          title: "Real-time Updates Unavailable",
          description: "Using standard refresh mode",
          variant: "destructive",
        });
      }
    },
  });

  // Fetch submissions function
  const fetchSubmissions = async () => {
    try {
      const data = await getSubmissions();
      // Fetched submissions successfully
      console.log("Submissions data:", data);
      setSubmissions(data);
      setFilteredSubmissions(data);
    } catch (err) {
      // Error fetching submissions
      console.error("Error fetching submissions:", err);
      toast({
        title: "Error Loading Submissions",
        description: "Failed to load submissions. Please refresh the page.",
        variant: "destructive",
      });
    }
  };

  // Filter submissions based on search and filters
  const filterSubmissions = () => {
    let filtered = submissions;

    // Debug: Log unique genres to help diagnose filtering issues
    if (submissions.length > 0) {
      const uniqueGenres = [
        ...new Set(submissions.map((s) => s.genre).filter(Boolean)),
      ];
      console.log("Available genres in database:", uniqueGenres);
    }

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(
        (submission) =>
          submission.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          submission.artist?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          submission.users?.name
            ?.toLowerCase()
            .includes(searchTerm.toLowerCase())
      );
    }

    // Status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter(
        (submission) => submission.status === statusFilter
      );
    }

    // Genre filter
    if (genreFilter !== "all") {
      filtered = filtered.filter(
        (submission) =>
          submission.genre?.toLowerCase() === genreFilter.toLowerCase()
      );
    }

    // Rating filter
    if (ratingFilter !== "all") {
      const ratingValue = parseInt(ratingFilter);
      filtered = filtered.filter(
        (submission) => submission.rating >= ratingValue
      );
    }

    setFilteredSubmissions(filtered);
  };

  // Apply filters whenever search term or filters change
  useEffect(() => {
    filterSubmissions();
  }, [searchTerm, statusFilter, genreFilter, ratingFilter, submissions]);

  // Clear all filters
  const clearFilters = () => {
    setSearchTerm("");
    setStatusFilter("all");
    setGenreFilter("all");
    setRatingFilter("all");
  };

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

  // Fetch submissions
  useEffect(() => {
    if (isAuthenticated && isAdmin) {
      fetchSubmissions();
    }
  }, [isAuthenticated, isAdmin]);

  // Set up periodic refresh when WebSocket is not connected
  useEffect(() => {
    let intervalId: NodeJS.Timeout | null = null;

    if (isAuthenticated && isAdmin && !isWebSocketConnected) {
      // Refresh submissions every 30 seconds when WebSocket is not connected
      intervalId = setInterval(() => {
        fetchSubmissions();
      }, 30000);
    }

    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [isAuthenticated, isAdmin, isWebSocketConnected]);

  // Handle when audio metadata loads for a new track
  useEffect(() => {
    if (playingId && metaLoaded && !isPlaying && audioRef.current?.paused) {
      const audio = audioRef.current;
      if (audio) {
        audio.play().catch(() => {});
      }
    }
  }, [playingId, metaLoaded]);

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

  //demodata
  //   const [submissions, setSubmissions] = useState<Submission[]>([
  //     {
  //       id: "1",
  //       title: "Midnight Dreams",
  //       genre: "Electronic",
  //       bpm: 128,
  //       key: "Am",
  //       description:
  //         "A dreamy electronic track with ambient textures and a driving beat.",
  //       rating: 8,
  //       feedback:
  //         "Great production quality and unique sound design. The arrangement flows well and the mix is clean. Consider adding more variation in the breakdown section.",
  //       status: "accepted",
  //       submittedAt: "2024-01-15",
  //       duration: "3:42",
  //     },
  //     {
  //       id: "2",
  //       title: "Urban Pulse",
  //       genre: "Hip Hop",
  //       bpm: 95,
  //       key: "Gm",
  //       description:
  //         "Hard-hitting hip hop beat with trap influences and heavy 808s.",
  //       rating: 6,
  //       feedback:
  //         "Solid foundation but needs more dynamic elements. The 808s are well-tuned but consider adding more melodic content to keep listener engagement.",
  //       status: "pending",
  //       submittedAt: "2024-01-20",
  //       duration: "2:58",
  //     },
  //     {
  //       id: "3",
  //       title: "Sunset Vibes",
  //       genre: "Lo-Fi",
  //       bpm: 85,
  //       key: "C",
  //       description: "Chill lo-fi track perfect for studying or relaxing.",
  //       rating: 4,
  //       feedback:
  //         "While the vibe is nice, the track lacks originality and the mix feels muddy. Work on cleaning up the low-end and adding more unique elements.",
  //       status: "rejected",
  //       submittedAt: "2024-01-18",
  //       duration: "4:15",
  //     },
  //   ]);

  const handlePlayPause = (file: string) => {
    const audio = audioRef.current;
    if (!audio) return;

    // Attempting to play audio file

    if (playingId === file) {
      // Same file - toggle play/pause
      if (isPlaying) {
        audio.pause();
        // Don't set isPlaying here - let the onPause event handle it
      } else {
        if (metaLoaded) {
          audio.play().catch(() => {});
          // Don't set isPlaying here - let the onPlay event handle it
        }
      }
    } else {
      // Different file - stop current and start new
      audio.pause();
      setPlayingId(file);
      setMetaLoaded(false);
      setIsPlaying(false);
      setProgress(0);

      // Set new source and wait for metadata
      audio.src = file;
      audio.load();
    }
  };

  // Update progress as audio plays
  const handleTimeUpdate = () => {
    const audio = audioRef.current;
    if (!audio) return;
    setProgress(audio.currentTime);
  };

  // When audio metadata loads
  const handleLoadedMetadata = () => {
    const audio = audioRef.current;
    if (!audio) return;
    setMetaLoaded(true);
  };

  // Handle audio ended
  const handleAudioEnded = () => {
    setIsPlaying(false);
    setProgress(0);
  };

  // Handle audio pause
  const handleAudioPause = () => {
    setIsPlaying(false);
  };

  // Handle audio play
  const handleAudioPlay = () => {
    setIsPlaying(true);
  };

  // Handle audio error
  const handleAudioError = () => {
    setIsPlaying(false);
    toast({
      title: "Audio Error",
      description: "Failed to load or play the audio file.",
      variant: "destructive",
    });
  };

  const handleRatingChange = (id: string, rating: number[]) => {
    setSubmissions((prev: Submission[]) =>
      prev.map((sub: Submission) =>
        sub.id === id ? { ...sub, rating: rating[0] } : sub
      )
    );
  };

  const handleFeedbackChange = (id: string, feedback: string) => {
    setSubmissions((prev: Submission[]) =>
      prev.map((sub: Submission) =>
        sub.id === id ? { ...sub, feedback } : sub
      )
    );
  };

  const handleStatusChange = (
    id: string,
    status: "pending" | "in-review" | "approved" | "rejected"
  ) => {
    setSubmissions((prev: Submission[]) =>
      prev.map((sub: Submission) => (sub.id === id ? { ...sub, status } : sub))
    );
  };

  const handleSave = async (id: string) => {
    const submission = submissions.find((sub: Submission) => sub.id === id);
    if (!submission) {
      // Submission not found
      return;
    }

    try {
      const updates = {
        rating: submission.rating,
        status: submission.status,
        feedback: submission.feedback,
      };

      // Updating submission
      await updateSubmissionAdmin(id, updates);
      setEditingId(null);
      toast({
        title: "Success",
        description: "Submission updated successfully",
      });
    } catch (error) {
      // Error updating submission
      toast({
        title: "Error",
        description: "Failed to update submission",
        variant: "destructive",
      });
    }
  };

  const handleEditSubmission = (id: string) => {
    setEditingId(id);
  };

  const handleCancelEdit = () => {
    setEditingId(null);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "approved":
        return "bg-green-500/20 text-green-400 border-green-500/30";
      case "rejected":
        return "bg-red-500/20 text-red-400 border-red-500/30";
      case "in-review":
        return "bg-blue-500/20 text-blue-400 border-blue-500/30";
      case "pending":
      default:
        return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30";
    }
  };

  const getRatingColor = (rating: number) => {
    if (rating >= 8) return "text-green-400";
    if (rating >= 6) return "text-yellow-400";
    return "text-red-400";
  };

  return (
    <div className="min-h-screen bg-slate-900">
      <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 pointer-events-none" />

      <div className="relative z-10 p-8">
        <div className="max-w-7xl mx-auto space-y-8">
          {/* Header */}
          <div className="text-center space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {isWebSocketConnected ? (
                  <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-green-500/20 border border-green-500/30">
                    <Wifi className="h-4 w-4 text-green-400" />
                    <span className="text-xs text-green-400">Live Updates</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-red-500/20 border border-red-500/30">
                      <WifiOff className="h-4 w-4 text-red-400" />
                      <span className="text-xs text-red-400">Offline</span>
                    </div>
                    <Button
                      onClick={fetchSubmissions}
                      size="sm"
                      variant="outline"
                      className="h-8 px-2 bg-slate-800/30 border-slate-700/50 hover:bg-slate-700/50 text-slate-200 hover:text-white"
                    >
                      <RefreshCw className="h-3 w-3" />
                    </Button>
                  </div>
                )}
              </div>
              <div className="inline-flex items-center gap-3 px-6 py-3 rounded-full bg-slate-800/50 backdrop-blur-sm border border-slate-700/50">
                <Settings className="h-5 w-5 text-blue-400" />
                <span className="text-sm font-medium text-slate-300">
                  Admin Portal
                </span>
              </div>
              <Button
                onClick={logout}
                variant="outline"
                size="sm"
                className="bg-slate-800/30 backdrop-blur-sm border-slate-700/50 hover:bg-slate-700/50 text-slate-200 hover:text-white"
              >
                Logout
              </Button>
            </div>
            <h1 className="text-4xl font-bold text-white">MeloTech</h1>
            <p className="text-slate-400">Submission Management Dashboard</p>
          </div>

          {/* Submissions List */}
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-white">All Submissions</h2>
              <Badge
                variant="secondary"
                className="bg-slate-700/50 text-slate-300"
              >
                {filteredSubmissions.length}{" "}
                {filteredSubmissions.length === 1 ? "track" : "tracks"}
                {filteredSubmissions.length !== submissions.length && (
                  <span className="ml-1 text-slate-400">
                    of {submissions.length}
                  </span>
                )}
              </Badge>
            </div>

            {/* Search and Filters */}
            <Card className="bg-slate-800/50 border-slate-700/50 backdrop-blur-sm">
              <CardContent className="p-6">
                <div className="space-y-4">
                  {/* Search Bar */}
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input
                      placeholder="Search by title, artist, or submitter name..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-400 focus:border-blue-500/50 focus:ring-blue-500/25"
                    />
                    {searchTerm && (
                      <Button
                        onClick={() => setSearchTerm("")}
                        size="sm"
                        variant="ghost"
                        className="absolute right-2 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0 text-slate-400 hover:text-white"
                      >
                        <XIcon className="h-3 w-3" />
                      </Button>
                    )}
                  </div>

                  {/* Filters Row */}
                  <div className="flex flex-wrap gap-4 items-center">
                    <div className="flex items-center gap-2">
                      <Filter className="h-4 w-4 text-slate-400" />
                      <span className="text-slate-300 text-sm font-medium">
                        Filters:
                      </span>
                    </div>

                    {/* Status Filter */}
                    <Select
                      value={statusFilter}
                      onValueChange={setStatusFilter}
                    >
                      <SelectTrigger className="w-32 bg-slate-700/50 border-slate-600 text-white">
                        <SelectValue placeholder="Status" />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-800 border-slate-700">
                        <SelectItem value="all" className="text-white">
                          All Status
                        </SelectItem>
                        <SelectItem value="pending" className="text-yellow-400">
                          Pending
                        </SelectItem>
                        <SelectItem value="in-review" className="text-blue-400">
                          In Review
                        </SelectItem>
                        <SelectItem value="approved" className="text-green-400">
                          Approved
                        </SelectItem>
                        <SelectItem value="rejected" className="text-red-400">
                          Rejected
                        </SelectItem>
                      </SelectContent>
                    </Select>

                    {/* Genre Filter */}
                    <Select value={genreFilter} onValueChange={setGenreFilter}>
                      <SelectTrigger className="w-32 bg-slate-700/50 border-slate-600 text-white">
                        <SelectValue placeholder="Genre" />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-800 border-slate-700">
                        <SelectItem value="all" className="text-white">
                          All Genres
                        </SelectItem>
                        <SelectItem value="Electronic" className="text-white">
                          Electronic
                        </SelectItem>
                        <SelectItem value="Rap" className="text-white">
                          Rap
                        </SelectItem>
                        <SelectItem value="Pop" className="text-white">
                          Pop
                        </SelectItem>
                        <SelectItem value="House" className="text-white">
                          House
                        </SelectItem>
                        <SelectItem value="Reggae" className="text-white">
                          Reggae
                        </SelectItem>
                        <SelectItem value="Jazz" className="text-white">
                          Jazz
                        </SelectItem>
                        <SelectItem value="Blues" className="text-white">
                          Blues
                        </SelectItem>
                      </SelectContent>
                    </Select>

                    {/* Rating Filter */}
                    <Select
                      value={ratingFilter}
                      onValueChange={setRatingFilter}
                    >
                      <SelectTrigger className="w-32 bg-slate-700/50 border-slate-600 text-white">
                        <SelectValue placeholder="Rating" />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-800 border-slate-700">
                        <SelectItem value="all" className="text-white">
                          All Ratings
                        </SelectItem>
                        <SelectItem value="8" className="text-green-400">
                          8+ Stars
                        </SelectItem>
                        <SelectItem value="6" className="text-yellow-400">
                          6+ Stars
                        </SelectItem>
                        <SelectItem value="4" className="text-orange-400">
                          4+ Stars
                        </SelectItem>
                        <SelectItem value="1" className="text-red-400">
                          1+ Stars
                        </SelectItem>
                      </SelectContent>
                    </Select>

                    {/* Clear Filters Button */}
                    {(searchTerm ||
                      statusFilter !== "all" ||
                      genreFilter !== "all" ||
                      ratingFilter !== "all") && (
                      <Button
                        onClick={clearFilters}
                        size="sm"
                        variant="outline"
                        className="bg-slate-700/50 border-slate-600 text-slate-300 hover:bg-slate-600 hover:text-white"
                      >
                        <XIcon className="h-3 w-3 mr-1" />
                        Clear All
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
            <audio
              ref={audioRef}
              onTimeUpdate={handleTimeUpdate}
              onLoadedMetadata={handleLoadedMetadata}
              onEnded={handleAudioEnded}
              onPause={handleAudioPause}
              onPlay={handleAudioPlay}
              onError={handleAudioError}
            />

            <div className="grid gap-6">
              {filteredSubmissions.length === 0 ? (
                <Card className="bg-slate-800/50 border-slate-700/50 backdrop-blur-sm">
                  <CardContent className="p-8 text-center">
                    <div className="space-y-4">
                      <Search className="h-12 w-12 text-slate-400 mx-auto" />
                      <h3 className="text-lg font-semibold text-white">
                        No submissions found
                      </h3>
                      <p className="text-slate-400">
                        {searchTerm ||
                        statusFilter !== "all" ||
                        genreFilter !== "all" ||
                        ratingFilter !== "all"
                          ? "Try adjusting your search or filters"
                          : "No submissions have been submitted yet"}
                      </p>
                      {(searchTerm ||
                        statusFilter !== "all" ||
                        genreFilter !== "all" ||
                        ratingFilter !== "all") && (
                        <Button
                          onClick={clearFilters}
                          variant="outline"
                          className="bg-slate-700/50 border-slate-600 text-slate-300 hover:bg-slate-600 hover:text-white"
                        >
                          Clear All Filters
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ) : (
                filteredSubmissions.map((submission: Submission) => (
                  <Card
                    key={submission.id}
                    className="bg-slate-800/50 backdrop-blur-sm border-slate-700/50 shadow-xl"
                  >
                    <CardContent className="p-6">
                      <div className="grid lg:grid-cols-12 gap-6 items-start">
                        {/* Play Button & Waveform */}
                        <div className="lg:col-span-4 space-y-4">
                          {/* User Name */}
                          <div className="mb-2">
                            <p className="text-slate-300 text-sm font-medium">
                              Submitted by:{" "}
                              <span className="text-white">
                                {submission.users?.name || "Unknown User"}
                              </span>
                            </p>
                          </div>
                          <div className="flex items-center gap-4">
                            <Button
                              size="sm"
                              onClick={() =>
                                handlePlayPause(submission.files[0])
                              }
                              className="h-12 w-12 rounded-full bg-blue-600 hover:bg-blue-700 text-white shadow-lg"
                            >
                              {playingId === submission.files[0] &&
                              isPlaying ? (
                                <Pause className="h-5 w-5" />
                              ) : (
                                <Play className="h-5 w-5 ml-0.5" />
                              )}
                            </Button>
                            <div className="flex-1">
                              <h3 className="font-semibold text-white text-lg">
                                {submission.title}
                              </h3>
                              <p className="text-blue-400 text-sm font-medium">
                                {submission.artist}
                              </p>
                              <p className="text-slate-400 text-sm">
                                {submission.duration}
                              </p>
                            </div>
                          </div>

                          {/* Audio Visualizer */}
                          <div className="bg-slate-700/30 rounded-lg p-4">
                            <div className="h-16 w-full">
                              {AudioVisualizer ? (
                                <AudioVisualizer
                                  audioRef={audioRef}
                                  barWidth={2}
                                  gap={1}
                                  barColor={
                                    playingId === submission.files[0] &&
                                    isPlaying
                                      ? "#60a5fa"
                                      : "#64748b"
                                  }
                                  barPlayedColor="#60a5fa"
                                  className="w-full h-full"
                                />
                              ) : (
                                // Fallback to simple waveform bars
                                <div className="flex items-end gap-1 h-16">
                                  {Array.from({ length: 50 }).map((_, i) => (
                                    <div
                                      key={i}
                                      className={`flex-1 rounded-sm transition-all duration-200 ${
                                        playingId === submission.files[0] &&
                                        isPlaying &&
                                        i < (progress || 0) / 2
                                          ? "bg-blue-400"
                                          : "bg-slate-600"
                                      }`}
                                      style={{
                                        height: `${Math.random() * 60 + 10}%`,
                                      }}
                                    />
                                  ))}
                                </div>
                              )}
                            </div>

                            {/* Progress Bar */}
                            <div className="mt-3 bg-slate-600 rounded-full h-1">
                              <div
                                className="bg-blue-400 h-1 rounded-full transition-all duration-100"
                                style={{
                                  width: `${progress || 0}%`,
                                }}
                              />
                            </div>
                          </div>
                        </div>

                        {/* Track Details (Read-only) */}
                        <div className="lg:col-span-4 space-y-4">
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <p className="text-slate-400 text-sm">Genre</p>
                              <p className="text-white font-medium">
                                {submission.genre.charAt(0).toUpperCase() +
                                  submission.genre.slice(1)}
                              </p>
                            </div>
                            <div>
                              <p className="text-slate-400 text-sm">BPM</p>
                              <p className="text-white font-medium">
                                {submission.bpm}
                              </p>
                            </div>
                            <div>
                              <p className="text-slate-400 text-sm">Key</p>
                              <p className="text-white font-medium">
                                {submission.key.charAt(0).toUpperCase() +
                                  submission.key.slice(1)}
                              </p>
                            </div>
                            <div>
                              <p className="text-slate-400 text-sm">
                                Submitted
                              </p>
                              <p className="text-white font-medium">
                                {new Date(
                                  submission.submittedAt
                                ).toLocaleDateString("en-GB", {
                                  day: "2-digit",
                                  month: "2-digit",
                                  year: "2-digit",
                                })}
                              </p>
                            </div>
                          </div>

                          <div>
                            <p className="text-slate-400 text-sm mb-2">
                              Description
                            </p>
                            <div className="bg-slate-700/20 rounded-lg p-3">
                              <p className="text-slate-200 text-sm leading-relaxed">
                                {submission.description}
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* Admin Controls */}
                        <div className="lg:col-span-4 space-y-6">
                          {/* Edit/Cancel Buttons */}
                          <div className="flex items-center justify-between">
                            <h4 className="text-slate-400 text-sm font-medium">
                              Admin Controls
                            </h4>
                            {editingId === submission.id ? (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={handleCancelEdit}
                                className="border-slate-600 text-slate-300 hover:bg-slate-700 bg-transparent"
                              >
                                <X className="h-4 w-4 mr-1" />
                                Cancel
                              </Button>
                            ) : (
                              <Button
                                size="sm"
                                onClick={() =>
                                  handleEditSubmission(submission.id)
                                }
                                className="bg-blue-600 hover:bg-blue-700 text-white"
                              >
                                <Edit className="h-4 w-4 mr-1" />
                                Edit
                              </Button>
                            )}
                          </div>

                          {/* Rating */}
                          <div className="space-y-3">
                            <div className="flex items-center gap-2">
                              <Star className="h-4 w-4 text-slate-400" />
                              <span className="text-slate-400 text-sm">
                                Rating
                              </span>
                              {submission.rating ? (
                                <span
                                  className={`text-lg font-bold ${getRatingColor(
                                    submission.rating
                                  )}`}
                                >
                                  {submission.rating}/10
                                </span>
                              ) : (
                                <span className="text-slate-400 text-lg">
                                  Unrated
                                </span>
                              )}
                            </div>
                            {editingId === submission.id ? (
                              <Slider
                                value={[submission.rating]}
                                onValueChange={(value) =>
                                  handleRatingChange(submission.id, value)
                                }
                                max={10}
                                min={1}
                                step={1}
                                className="w-full"
                              />
                            ) : (
                              <div className="bg-slate-700/20 rounded-lg p-3">
                                <div className="flex items-center gap-2">
                                  {Array.from({ length: 10 }).map((_, i) => (
                                    <Star
                                      key={i}
                                      className={`h-4 w-4 ${
                                        i < submission.rating
                                          ? "text-yellow-400 fill-current"
                                          : "text-slate-600"
                                      }`}
                                    />
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>

                          {/* Status */}
                          <div className="space-y-3">
                            <p className="text-slate-400 text-sm">Status</p>
                            {editingId === submission.id ? (
                              <Select
                                value={submission.status}
                                onValueChange={(value: string) =>
                                  handleStatusChange(
                                    submission.id,
                                    value as
                                      | "pending"
                                      | "in-review"
                                      | "approved"
                                      | "rejected"
                                  )
                                }
                              >
                                <SelectTrigger className="bg-slate-700/50 border-slate-600/50 text-white">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="bg-slate-800 border-slate-700">
                                  <SelectItem
                                    value="pending"
                                    className="text-yellow-400"
                                  >
                                    Pending
                                  </SelectItem>
                                  <SelectItem
                                    value="in-review"
                                    className="text-blue-400"
                                  >
                                    In Review
                                  </SelectItem>
                                  <SelectItem
                                    value="approved"
                                    className="text-green-400"
                                  >
                                    Approved
                                  </SelectItem>
                                  <SelectItem
                                    value="rejected"
                                    className="text-red-400"
                                  >
                                    Rejected
                                  </SelectItem>
                                </SelectContent>
                              </Select>
                            ) : (
                              <Badge
                                className={getStatusColor(submission.status)}
                              >
                                {submission.status === "in-review"
                                  ? "In Review"
                                  : submission.status.charAt(0).toUpperCase() +
                                    submission.status.slice(1)}
                              </Badge>
                            )}
                          </div>

                          {/* Feedback */}
                          <div className="space-y-3">
                            <p className="text-slate-400 text-sm">Feedback</p>
                            {editingId === submission.id ? (
                              <Textarea
                                value={submission.feedback || ""}
                                onChange={(
                                  e: React.ChangeEvent<HTMLTextAreaElement>
                                ) =>
                                  handleFeedbackChange(
                                    submission.id,
                                    e.target.value
                                  )
                                }
                                placeholder="Provide detailed feedback for the artist..."
                                rows={4}
                                className="bg-slate-700/50 border-slate-600/50 focus:border-blue-500/50 focus:ring-blue-500/25 text-white resize-none"
                              />
                            ) : (
                              <div className="bg-slate-700/30 rounded-lg p-3 min-h-[100px]">
                                {submission.feedback ? (
                                  <p className="text-slate-200 text-sm leading-relaxed">
                                    {submission.feedback}
                                  </p>
                                ) : (
                                  <p className="text-slate-500 text-sm italic">
                                    No feedback provided yet
                                  </p>
                                )}
                              </div>
                            )}
                          </div>

                          {/* Save Button */}
                          {editingId === submission.id && (
                            <Button
                              onClick={() => handleSave(submission.id)}
                              className="w-full bg-blue-600 hover:bg-blue-700 text-white shadow-lg"
                            >
                              <Save className="h-4 w-4 mr-2" />
                              Save Changes
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
