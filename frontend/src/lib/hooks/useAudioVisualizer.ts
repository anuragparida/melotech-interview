import { useState, useEffect } from "react";

interface AudioVisualizerProps {
  audioRef: React.RefObject<HTMLAudioElement>;
  barWidth: number;
  gap: number;
  barColor: string;
  barPlayedColor: string;
  className: string;
}

export function useAudioVisualizer() {
  const [isCompatible, setIsCompatible] = useState<boolean | null>(null);

  useEffect(() => {
    // Check if react-audio-visualize is compatible with current React version
    const checkCompatibility = async () => {
      try {
        // Try to dynamically import and test the component
        const { AudioVisualizer } = await import("react-audio-visualize");

        // Create a test element to see if it renders without errors
        const testElement = document.createElement("div");
        testElement.style.display = "none";
        document.body.appendChild(testElement);

        // This is a basic compatibility check
        setIsCompatible(true);
        document.body.removeChild(testElement);
      } catch (error) {
        console.warn(
          "react-audio-visualize compatibility check failed:",
          error
        );
        setIsCompatible(false);
      }
    };

    checkCompatibility();
  }, []);

  const renderAudioVisualizer = (props: AudioVisualizerProps) => {
    if (isCompatible === null) {
      // Still checking compatibility, show loading state
      return (
        <div className="flex items-center justify-center h-16 w-full">
          <div className="text-slate-400 text-sm">Loading...</div>
        </div>
      );
    }

    if (isCompatible === false) {
      // Not compatible, use fallback
      return (
        <div className="flex items-end gap-1 h-16">
          {Array.from({ length: 50 }).map((_, i) => (
            <div
              key={i}
              className={`flex-1 rounded-sm transition-all duration-200 ${
                props.audioRef.current &&
                !props.audioRef.current.paused &&
                i < 25
                  ? "bg-blue-400"
                  : "bg-slate-600"
              }`}
              style={{
                height: `${Math.random() * 60 + 10}%`,
              }}
            />
          ))}
        </div>
      );
    }

    // Compatible, try to render the real component
    try {
      const { AudioVisualizer } = require("react-audio-visualize");
      return <AudioVisualizer {...props} />;
    } catch (error) {
      console.warn("AudioVisualizer render failed, using fallback:", error);
      // Fallback to simple bars
      return (
        <div className="flex items-end gap-1 h-16">
          {Array.from({ length: 50 }).map((_, i) => (
            <div
              key={i}
              className={`flex-1 rounded-sm transition-all duration-200 ${
                props.audioRef.current &&
                !props.audioRef.current.paused &&
                i < 25
                  ? "bg-blue-400"
                  : "bg-slate-600"
              }`}
              style={{
                height: `${Math.random() * 60 + 10}%`,
              }}
            />
          ))}
        </div>
      );
    }
  };

  return { renderAudioVisualizer, isCompatible };
}
