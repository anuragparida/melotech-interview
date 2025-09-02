import { useEffect, useRef, useState } from "react";
import { useNavigate, Link } from "react-router-dom";

// UI Components
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

// Icons
import { Play, Pause, ArrowLeft, Music, Star } from "lucide-react";

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
import { getSubmissions, getUser } from "@/lib/supabaseutils/api";

interface Submission {
  id: string;
  title: string;
  genre: string;
  bpm: number;
  key: string;
  description: string;
  rating: number;
  feedback: string;
  status: "pending" | "in-review" | "approved" | "rejected";
  created_at: string;
  files: string[];
  duration?: string;
}

export default function ViewSubmissionsPage() {
  const { isAdmin, loading, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [metaLoaded, setMetaLoaded] = useState(false);
  const [progress, setProgress] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [userData, setUserData] = useState<{ name: string } | null>(null);

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

  // Fetch submissions
  useEffect(() => {
    if (isAuthenticated && !isAdmin) {
      fetchSubmissions();
    }
  }, [isAuthenticated, isAdmin]);

  // Fetch user data
  useEffect(() => {
    if (isAuthenticated && !isAdmin) {
      getUser()
        .then((data) => {
          setUserData(data);
        })
        .catch((error) => {
          // Error fetching user data
          toast({
            title: "Error Loading Profile",
            description: "Failed to load your profile data.",
            variant: "destructive",
          });
        });
    }
  }, [isAuthenticated, isAdmin, toast]);

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

  // Don't render if not authenticated or if admin (redirects will handle this)
  if (!isAuthenticated || isAdmin) {
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

  const fetchSubmissions = async () => {
    try {
      const data = await getSubmissions();
      // Fetched submissions successfully
      setSubmissions(data);
    } catch (err: any) {
      // Error fetching submissions
      toast({
        title: "Error Loading Submissions",
        description:
          "Failed to load your submissions. Please refresh the page.",
        variant: "destructive",
      });
    }
  };

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
  const handleAudioError = (e: any) => {
    // Audio error occurred
    setIsPlaying(false);
    toast({
      title: "Audio Error",
      description: "Failed to load or play the audio file.",
      variant: "destructive",
    });
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
        <div className="max-w-6xl mx-auto space-y-8">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link to="/artist">
                <Button
                  variant="outline"
                  size="sm"
                  className="bg-slate-800/30 backdrop-blur-sm border-slate-700/50 hover:bg-slate-700/50 text-slate-200 hover:text-white"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Profile
                </Button>
              </Link>
              <div>
                <h1 className="text-3xl font-bold text-white">
                  {userData?.name || "Loading..."}
                </h1>
                <p className="text-slate-400">Artist</p>
              </div>
              <audio
                ref={audioRef}
                onTimeUpdate={handleTimeUpdate}
                onLoadedMetadata={handleLoadedMetadata}
                onEnded={handleAudioEnded}
                onPause={handleAudioPause}
                onPlay={handleAudioPlay}
                onError={handleAudioError}
              />
            </div>
          </div>

          {/* Submissions List */}
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <Music className="h-6 w-6 text-blue-400" />
              <h2 className="text-2xl font-bold text-white">
                Your Submissions
              </h2>
              <Badge
                variant="secondary"
                className="bg-slate-700/50 text-slate-300"
              >
                {submissions.length}{" "}
                {submissions.length === 1 ? "track" : "tracks"}
              </Badge>
            </div>

            <div className="grid gap-6">
              {submissions.map((submission: Submission) => (
                <Card
                  key={submission.id}
                  className="bg-slate-800/50 backdrop-blur-sm border-slate-700/50 shadow-xl"
                >
                  <CardContent className="p-6">
                    <div className="grid lg:grid-cols-12 gap-6 items-start">
                      {/* Play Button & Waveform */}
                      <div className="lg:col-span-4 space-y-4">
                        <div className="flex items-center gap-4">
                          <Button
                            size="sm"
                            onClick={() => handlePlayPause(submission.files[0])}
                            className="h-12 w-12 rounded-full bg-blue-600 hover:bg-blue-700 text-white shadow-lg"
                          >
                            {playingId === submission.files[0] && isPlaying ? (
                              <Pause className="h-5 w-5" />
                            ) : (
                              <Play className="h-5 w-5 ml-0.5" />
                            )}
                          </Button>
                          <div className="flex-1">
                            <h3 className="font-semibold text-white text-lg">
                              {submission.title}
                            </h3>
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
                                  playingId === submission.files[0] && isPlaying
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

                      {/* Track Details */}
                      <div className="lg:col-span-5 space-y-4">
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
                            <p className="text-slate-400 text-sm">Submitted</p>
                            <p className="text-white font-medium">
                              {new Date(
                                submission.created_at
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
                          <p className="text-slate-200 text-sm leading-relaxed">
                            {submission.description}
                          </p>
                        </div>
                      </div>

                      {/* Rating, Status & Feedback */}
                      <div className="lg:col-span-3 space-y-4">
                        <div className="flex items-center justify-between">
                          <Badge className={getStatusColor(submission.status)}>
                            {submission.status === "in-review"
                              ? "In Review"
                              : submission.status.charAt(0).toUpperCase() +
                                submission.status.slice(1)}
                          </Badge>
                        </div>

                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <Star className="h-4 w-4 text-slate-400" />
                            <span className="text-slate-400 text-sm">
                              Rating
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            {submission.rating ? (
                              <>
                                <span
                                  className={`text-2xl font-bold ${getRatingColor(
                                    submission.rating
                                  )}`}
                                >
                                  {submission.rating}
                                </span>
                                <span className="text-slate-400">/10</span>
                              </>
                            ) : (
                              <span className="text-slate-400 text-lg">
                                Unrated
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Feedback Section */}
                        <div className="space-y-2">
                          <p className="text-slate-400 text-sm">Feedback</p>
                          <div className="bg-slate-700/30 rounded-lg p-3 min-h-[80px]">
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
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {submissions.length === 0 && (
              <Card className="bg-slate-800/50 backdrop-blur-sm border-slate-700/50">
                <CardContent className="p-12 text-center">
                  <Music className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-white mb-2">
                    No submissions yet
                  </h3>
                  <p className="text-slate-400 mb-6">
                    Start by creating your first submission
                  </p>
                  <Link to="/submissions/create">
                    <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                      Create Submission
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
