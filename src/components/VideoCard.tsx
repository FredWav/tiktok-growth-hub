import { useState } from "react";
import { Play } from "lucide-react";
import { trackEvent } from "@/lib/tracking";

interface VideoCardProps {
  id: string;
  alt: string;
  location?: string;
}

export function VideoCard({ id, alt, location = "home" }: VideoCardProps) {
  const [playing, setPlaying] = useState(false);

  if (playing) {
    return (
      <div className="aspect-video rounded-xl overflow-hidden shadow-lg">
        <iframe
          src={`https://www.youtube.com/embed/${id}?autoplay=1`}
          title={alt}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          className="w-full h-full"
        />
      </div>
    );
  }

  return (
    <button
      onClick={() => { trackEvent("click_video_play", { video_id: id, location }); setPlaying(true); }}
      className="group relative aspect-video rounded-xl overflow-hidden shadow-lg cursor-pointer w-full"
    >
      <img
        src={`https://img.youtube.com/vi/${id}/hqdefault.jpg`}
        alt={alt}
        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
        loading="lazy"
      />
      <div className="absolute inset-0 bg-black/30 group-hover:bg-black/40 transition-colors flex items-center justify-center">
        <div className="w-14 h-14 rounded-full bg-primary/90 flex items-center justify-center group-hover:scale-110 transition-transform shadow-xl">
          <Play className="h-6 w-6 text-primary-foreground ml-0.5" fill="currentColor" />
        </div>
      </div>
    </button>
  );
}
