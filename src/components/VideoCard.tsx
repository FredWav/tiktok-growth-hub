import { useState } from "react";
import { Play } from "lucide-react";
import { trackEvent } from "@/lib/tracking";
import { forOffer, type Temoignage, useTemoignages, videoLegend, withVideo } from "@/lib/temoignages";

interface VideoCardProps {
  id: string;
  alt: string;
  location?: string;
  /** Légende (nom, niche, résultat) ; absente pour une personne non nommée. */
  legend?: { name: string; sub: string } | null;
}

export function VideoCard({ id, alt, location = "home", legend }: VideoCardProps) {
  const [playing, setPlaying] = useState(false);

  if (playing) {
    return (
      <div className="aspect-video rounded-xl overflow-hidden shadow-lg">
        <iframe
          src={`https://www.youtube-nocookie.com/embed/${id}?autoplay=1`}
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
      {legend && (
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/85 to-transparent p-3 text-left pointer-events-none">
          <p className="text-white text-sm font-semibold leading-tight">{legend.name}</p>
          {legend.sub && <p className="text-white/85 text-xs mt-0.5">{legend.sub}</p>}
        </div>
      )}
    </button>
  );
}

const altOf = (t: Temoignage) => (t.anonymous ? "Témoignage vidéo d'un client de Fred Wav" : `Témoignage vidéo de ${t.name}`);

/** Témoignages vidéo des fiches de l'admin ; `featured` : seulement ceux mis en avant sur l'accueil. */
export function VideoTestimonials({ featured = false, offer, limit, location, className = "" }: {
  featured?: boolean;
  /** Page d'offre : les vidéos des clients de cette offre d'abord. */
  offer?: string;
  limit?: number;
  location: string;
  className?: string;
}) {
  const all = useTemoignages().filter((t) => withVideo(t) && (!featured || t.featured));
  const videos = forOffer(all, offer, limit ?? all.length);
  if (!videos.length) return null;
  return (
    <div className={className}>
      {videos.map((t) => (
        <VideoCard key={t.id} id={t.youtube_id!} alt={altOf(t)} legend={videoLegend(t)} location={location} />
      ))}
    </div>
  );
}
