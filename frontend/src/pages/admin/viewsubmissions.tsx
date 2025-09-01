"use client";

import { useState } from "react";
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
import { Play, Pause, Save, Settings, Star } from "lucide-react";
import { useAdmin } from "@/lib/hooks/useAdmin";

interface AdminSubmission {
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
  duration: string;
}

export default function AdminViewSubmissions() {
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [playProgress, setPlayProgress] = useState<{ [key: string]: number }>(
    {}
  );
  const [submissions, setSubmissions] = useState<AdminSubmission[]>([
    {
      id: "1",
      title: "Midnight Dreams",
      artist: "Maya Rodriguez",
      genre: "Electronic",
      bpm: 128,
      key: "Am",
      description:
        "A dreamy electronic track with ambient textures and a driving beat.",
      rating: 8,
      feedback:
        "Great production quality and unique sound design. The arrangement flows well and the mix is clean. Consider adding more variation in the breakdown section.",
      status: "accepted",
      submittedAt: "2024-01-15",
      duration: "3:42",
    },
    {
      id: "2",
      title: "Urban Pulse",
      artist: "Maya Rodriguez",
      genre: "Hip Hop",
      bpm: 95,
      key: "Gm",
      description:
        "Hard-hitting hip hop beat with trap influences and heavy 808s.",
      rating: 6,
      feedback:
        "Solid foundation but needs more dynamic elements. The 808s are well-tuned but consider adding more melodic content to keep listener engagement.",
      status: "pending",
      submittedAt: "2024-01-20",
      duration: "2:58",
    },
    {
      id: "3",
      title: "Neon Nights",
      artist: "Alex Chen",
      genre: "Synthwave",
      bpm: 110,
      key: "Dm",
      description:
        "Retro-futuristic synthwave with nostalgic melodies and punchy drums.",
      rating: 7,
      feedback: "",
      status: "pending",
      submittedAt: "2024-01-22",
      duration: "4:05",
    },
    {
      id: "4",
      title: "Jazz Fusion Experiment",
      artist: "Sarah Williams",
      genre: "Jazz Fusion",
      bpm: 140,
      key: "Bb",
      description:
        "Modern jazz fusion with complex harmonies and intricate rhythms.",
      rating: 5,
      feedback: "",
      status: "pending",
      submittedAt: "2024-01-21",
      duration: "5:20",
    },
  ]);

  const handlePlayPause = (id: string) => {
    if (playingId === id) {
      setPlayingId(null);
    } else {
      setPlayingId(id);
      // Simulate progress update
      const interval = setInterval(() => {
        setPlayProgress((prev) => {
          const current = prev[id] || 0;
          if (current >= 100) {
            clearInterval(interval);
            setPlayingId(null);
            return { ...prev, [id]: 0 };
          }
          return { ...prev, [id]: current + 1 };
        });
      }, 100);
    }
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

  const handleSaveChanges = (id: string) => {
    console.log("Saving changes for submission:", id);
    // Here you would typically make an API call to save the changes
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

  const { isAdmin, loading } = useAdmin();

  const getRatingColor = (rating: number) => {
    if (rating >= 8) return "text-green-400";
    if (rating >= 6) return "text-yellow-400";
    return "text-red-400";
  };

  if (loading) return <p>Loading...</p>;

  return !isAdmin ? (
    <p>You do not have access to this page.</p>
  ) : (
    <div className="min-h-screen bg-slate-900">
      <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 pointer-events-none" />

      <div className="relative z-10 p-8">
        <div className="max-w-7xl mx-auto space-y-8">
          {/* Header */}
          <div className="text-center space-y-4">
            <div className="inline-flex items-center gap-3 px-6 py-3 rounded-full bg-slate-800/50 backdrop-blur-sm border border-slate-700/50">
              <Settings className="h-5 w-5 text-blue-400" />
              <span className="text-sm font-medium text-slate-300">
                Admin Portal
              </span>
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
                {submissions.length} tracks
              </Badge>
            </div>

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
                            onClick={() => handlePlayPause(submission.id)}
                            className="h-12 w-12 rounded-full bg-blue-600 hover:bg-blue-700 text-white shadow-lg"
                          >
                            {playingId === submission.id ? (
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
                                  i < (playProgress[submission.id] || 0) / 2
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
                                width: `${playProgress[submission.id] || 0}%`,
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
                              {submission.genre}
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
                              {submission.key}
                            </p>
                          </div>
                          <div>
                            <p className="text-slate-400 text-sm">Submitted</p>
                            <p className="text-white font-medium">
                              {new Date(
                                submission.submittedAt
                              ).toLocaleDateString()}
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
                        {/* Rating Slider */}
                        <div className="space-y-3">
                          <div className="flex items-center gap-2">
                            <Star className="h-4 w-4 text-slate-400" />
                            <span className="text-slate-400 text-sm">
                              Rating
                            </span>
                            <span
                              className={`text-lg font-bold ${getRatingColor(
                                submission.rating
                              )}`}
                            >
                              {submission.rating}/10
                            </span>
                          </div>
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
                        </div>

                        {/* Status Select */}
                        <div className="space-y-3">
                          <p className="text-slate-400 text-sm">Status</p>
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
                        </div>

                        {/* Feedback Textarea */}
                        <div className="space-y-3">
                          <p className="text-slate-400 text-sm">Feedback</p>
                          <Textarea
                            value={submission.feedback}
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
                        </div>

                        {/* Save Button */}
                        <Button
                          onClick={() => handleSaveChanges(submission.id)}
                          className="w-full bg-blue-600 hover:bg-blue-700 text-white shadow-lg"
                        >
                          <Save className="h-4 w-4 mr-2" />
                          Save Changes
                        </Button>
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
