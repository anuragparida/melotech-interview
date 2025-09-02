"use client";

import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Play, Pause, Save, Settings, Star, Edit, X } from "lucide-react";
import { toast, useToast } from "@/lib/hooks/useToast";
import { getSubmissions, updateSubmissionAdmin } from "@/lib/supabaseutils/api";
import { useAuth } from "@/lib/hooks/useAuth";
import { useLogout } from "@/lib/hooks/useLogout";

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
  status: "pending" | "accepted" | "rejected";
  submittedAt: string;
  files: string[];
}

export default function AdminPage() {
  const { isAdmin, loading, isAuthenticated, redirectBasedOnAuth } = useAuth();
  const { logout } = useLogout();
  const navigate = useNavigate();
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [metaLoaded, setMetaLoaded] = useState(false);
  const [progress, setProgress] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const { toast } = useToast();

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

  // Handle when audio metadata loads for a new track
  useEffect(() => {
    if (playingId && metaLoaded && !isPlaying && audioRef.current?.paused) {
      const audio = audioRef.current;
      if (audio) {
        audio.play().catch(console.error);
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

  const fetchSubmissions = async () => {
    try {
      const data = await getSubmissions();
      setSubmissions(data);
    } catch (err) {
      if (err instanceof Error) {
        console.error("Error fetching submissions:", err.message);
      } else {
        console.error("Error fetching submissions:", err);
      }
    }
  };

  const handlePlayPause = (file: string) => {
    const audio = audioRef.current;
    if (!audio) return;

    if (playingId === file) {
      // Same file - toggle play/pause
      if (isPlaying) {
        audio.pause();
        // Don't set isPlaying here - let the onPause event handle it
      } else {
        if (metaLoaded) {
          audio.play().catch(console.error);
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
    setSubmissions((prev) =>
      prev.map((sub) => (sub.id === id ? { ...sub, rating: rating[0] } : sub))
    );
  };

  const handleFeedbackChange = (id: string, feedback: string) => {
    setSubmissions((prev) =>
      prev.map((sub) => (sub.id === id ? { ...sub, feedback } : sub))
    );
  };

  const handleStatusChange = (
    id: string,
    status: "pending" | "accepted" | "rejected"
  ) => {
    setSubmissions((prev) =>
      prev.map((sub) => (sub.id === id ? { ...sub, status } : sub))
    );
  };

  const handleSave = async (id: string) => {
    const submission = submissions.find((sub) => sub.id === id);
    if (!submission) {
      console.error("Submission not found:", id);
      return;
    }

    try {
      const updates = {
        rating: submission.rating,
        status: submission.status,
        feedback: submission.feedback,
      };

      console.log("Updating submission:", id, updates);
      await updateSubmissionAdmin(id, updates);
      setEditingId(null);
      toast({
        title: "Success",
        description: "Submission updated successfully",
      });
    } catch (error) {
      console.error("Error updating submission:", error);
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
      case "accepted":
        return "bg-green-500/20 text-green-400 border-green-500/30";
      case "rejected":
        return "bg-red-500/20 text-red-400 border-red-500/30";
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
              <div></div>
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
                {submissions.length}{" "}
                {submissions.length === 1 ? "track" : "tracks"}
              </Badge>
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

            <div className="grid gap-6">
              {submissions.map((submission) => (
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
                            <p className="text-blue-400 text-sm font-medium">
                              {submission.artist}
                            </p>
                            <p className="text-slate-400 text-sm">
                              {submission.duration}
                            </p>
                          </div>
                        </div>

                        {/* Dummy Waveform */}
                        <div className="bg-slate-700/30 rounded-lg p-4">
                          <div className="flex items-end gap-1 h-16">
                            {Array.from({ length: 50 }).map((_, i) => (
                              <div
                                key={i}
                                className={`flex-1 rounded-sm transition-all duration-200 ${
                                  playingId === submission.id &&
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
                              onValueChange={(
                                value: "pending" | "accepted" | "rejected"
                              ) => handleStatusChange(submission.id, value)}
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
                                  value="accepted"
                                  className="text-green-400"
                                >
                                  Accepted
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
                              {submission.status.charAt(0).toUpperCase() +
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
                              onChange={(e) =>
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
                            <div className="bg-slate-700/20 rounded-lg p-3 min-h-[100px]">
                              <p className="text-slate-200 text-sm leading-relaxed">
                                {submission.feedback ||
                                  "No feedback provided yet."}
                              </p>
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
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
