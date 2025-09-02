import type React from "react";

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Upload, ArrowLeft, Music } from "lucide-react";
import { Link } from "react-router-dom";
import { createSubmission } from "@/lib/supabaseutils/api";
import { useAuth } from "@/lib/hooks/useAuth";
import { toast, useToast } from "@/lib/hooks/useToast";

export default function CreateSubmission() {
  const { isAdmin, loading, isAuthenticated, redirectBasedOnAuth } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [estimatedTime, setEstimatedTime] = useState("");
  const [formData, setFormData] = useState({
    title: (Math.random() + 1).toString(36).substring(7),
    genre: (Math.random() + 1).toString(36).substring(7),
    bpm: 321,
    key: "F#",
    description: (Math.random() + 1).toString(36).substring(7),
  });

  const [files, setFiles] = useState(["", "", "", ""]);

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

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleFileChange = (index, event) => {
    const newFiles = [...files];
    const file = event.target.files[0];
    if (file) {
      newFiles[index] = file; // add or replace file at this index
    } else {
      newFiles[index] = undefined; // remove if cleared
    }
    setFiles(newFiles.filter(Boolean)); // remove undefined/null
  };

  const simulateUpload = () => {
    setIsUploading(true);
    setUploadProgress(0);

    const totalFiles = Object.values(files).filter(Boolean).length;
    const baseTimePerFile = 30; // seconds
    const totalEstimatedTime = totalFiles * baseTimePerFile;

    let currentProgress = 0;
    const interval = setInterval(() => {
      currentProgress += Math.random() * 15;
      if (currentProgress >= 100) {
        currentProgress = 100;
        setEstimatedTime("Upload complete!");
        clearInterval(interval);
        setTimeout(() => {
          setIsUploading(false);
          setUploadProgress(0);
          setEstimatedTime("");
          // Reset form
          setFormData({
            title: "",
            genre: "",
            bpm: "",
            key: "",
            description: "",
          });
          setFiles({ mp3: null, wav: null, flac: null, m4a: null });
        }, 2000);
      } else {
        const remainingTime = Math.ceil(
          (totalEstimatedTime * (100 - currentProgress)) / 100
        );
        setEstimatedTime(`Estimated time remaining: ${remainingTime}s`);
      }
      setUploadProgress(currentProgress);
    }, 500);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUploading(true);
    setUploadProgress(0);

    try {
      const submission = await createSubmission(formData, files);
      console.log("Submission created:", submission);

      // Simulate upload progress
      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => {
          if (prev >= 100) {
            clearInterval(progressInterval);
            setIsUploading(false);
            toast({
              title: "Submission Successful",
              description: "Your track has been submitted for review!",
            });
            // Reset form
            setFormData({
              title: "",
              genre: "",
              bpm: 0,
              key: "",
              description: "",
            });
            setFiles(["", "", "", ""]);
            return 100;
          }
          return prev + 10;
        });
      }, 200);
    } catch (err) {
      console.error("Error submitting:", err);
      setIsUploading(false);
      toast({
        title: "Submission Failed",
        description:
          err.message || "Failed to submit your track. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Link
            to="/artist"
            className="inline-flex items-center gap-2 text-slate-400 hover:text-white transition-colors mb-4"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Artist Profile
          </Link>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-lg backdrop-blur-sm border border-purple-500/20">
              <Music className="h-6 w-6 text-purple-400" />
            </div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent">
              Create Submission
            </h1>
          </div>
          <p className="text-slate-400">
            Submit your track for review and consideration
          </p>
        </div>

        {!isUploading ? (
          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Track Information */}
            <Card className="bg-slate-900/50 border-slate-800/50 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-white">Track Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="title" className="text-slate-300">
                      Track Title
                    </Label>
                    <Input
                      id="title"
                      value={formData.title}
                      onChange={(e) =>
                        handleInputChange("title", e.target.value)
                      }
                      className="bg-slate-800/50 border-slate-700 text-white placeholder:text-slate-500 focus:border-purple-500/50 focus:ring-purple-500/20"
                      placeholder="Enter track title"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="genre" className="text-slate-300">
                      Genre
                    </Label>
                    <Input
                      id="genre"
                      value={formData.genre}
                      onChange={(e) =>
                        handleInputChange("genre", e.target.value)
                      }
                      className="bg-slate-800/50 border-slate-700 text-white placeholder:text-slate-500 focus:border-purple-500/50 focus:ring-purple-500/20"
                      placeholder="e.g., Electronic, Hip-Hop, Rock"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="bpm" className="text-slate-300">
                      BPM
                    </Label>
                    <Input
                      id="bpm"
                      type="number"
                      value={formData.bpm}
                      onChange={(e) => handleInputChange("bpm", e.target.value)}
                      className="bg-slate-800/50 border-slate-700 text-white placeholder:text-slate-500 focus:border-purple-500/50 focus:ring-purple-500/20"
                      placeholder="120"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="key" className="text-slate-300">
                      Key
                    </Label>
                    <Input
                      id="key"
                      value={formData.key}
                      onChange={(e) => handleInputChange("key", e.target.value)}
                      className="bg-slate-800/50 border-slate-700 text-white placeholder:text-slate-500 focus:border-purple-500/50 focus:ring-purple-500/20"
                      placeholder="e.g., C Major, A Minor"
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description" className="text-slate-300">
                    Track Description
                  </Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) =>
                      handleInputChange("description", e.target.value)
                    }
                    className="bg-slate-800/50 border-slate-700 text-white placeholder:text-slate-500 focus:border-purple-500/50 focus:ring-purple-500/20 min-h-[100px]"
                    placeholder="Describe your track, inspiration, or any additional details..."
                    required
                  />
                </div>
              </CardContent>
            </Card>

            {/* File Uploads */}
            <Card className="bg-slate-900/50 border-slate-800/50 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-white">Audio Files</CardTitle>
                <p className="text-slate-400 text-sm">
                  Upload your track in different formats
                </p>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {(["mp3", "wav", "flac", "m4a"] as const).map(
                    (format, index) => (
                      <div key={format} className="space-y-2">
                        <Label className="text-slate-300 uppercase font-medium">
                          {format}
                        </Label>
                        <div className="relative">
                          <input
                            type="file"
                            accept={`.${format}`}
                            onChange={(e) => handleFileChange(index, e)}
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                          />
                          <div className="flex items-center gap-3 p-4 bg-slate-800/30 border-2 border-dashed border-slate-700 rounded-lg hover:border-purple-500/50 transition-colors">
                            <Upload className="h-5 w-5 text-slate-400" />
                            <div className="flex-1">
                              {files[index] ? (
                                <p className="text-white text-sm">
                                  {files[index]?.name}
                                </p>
                              ) : (
                                <p className="text-slate-400 text-sm">
                                  Click to upload {format.toUpperCase()} file
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    )
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Submit Button */}
            <div className="flex justify-center">
              <Button
                type="submit"
                className="px-8 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold rounded-lg shadow-lg shadow-purple-500/25 transition-all duration-300 transform hover:scale-105"
              >
                Submit Track
              </Button>
            </div>
          </form>
        ) : (
          /* Upload Progress */
          <Card className="bg-slate-900/50 border-slate-800/50 backdrop-blur-sm">
            <CardContent className="p-8">
              <div className="text-center space-y-6">
                <div className="space-y-2">
                  <h3 className="text-xl font-semibold text-white">
                    Uploading Your Submission
                  </h3>
                  <p className="text-slate-400">
                    Please wait while we process your files...
                  </p>
                </div>

                <div className="space-y-4">
                  <Progress
                    value={uploadProgress}
                    className="w-full h-3 bg-slate-800"
                  />
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-400">
                      {Math.round(uploadProgress)}% complete
                    </span>
                    <span className="text-purple-400">{estimatedTime}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
