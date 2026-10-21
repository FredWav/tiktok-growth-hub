import { useState } from "react";
import { Play } from "lucide-react";
import { trackEvent } from "@/lib/tracking";
import { type Temoignage, useTemoignages, videoLegend, videosForOffer, withVideo } from "@/lib/temoignages";

interface VideoCardProps {
  id: string;
  alt: string;
  /** YouTube (vignette fournie par YouTube) ou TikTok (vidéo verticale, photo du client en vignette). */
  platform?: "youtube" | "tiktok";
  cover?: string | null;
  location?: string;
  /** Légende (nom, niche, résultat) ; absente pour une personne non nommée. */
  legend?: { name: string; sub: string } | null;
}

export function VideoCard({ id, alt, platform = "youtube", cover, location = "home", legend }: VideoCardProps) {
  const [playing, setPlaying] = useState(false);

  if (playing && platform === "tiktok") {
    return (
      <div className="mx-auto aspect-[9/16] w-full max-w-[340px] rounded-xl overflow-hidden shadow-lg bg-black">
        <iframe
          src={`https://www.tiktok.com/player/v1/${id}?autoplay=1&description=0&music_info=0&rel=0`}
          title={alt}
          allow="autoplay; encrypted-media; fullscreen; picture-in-picture"
          allowFullScreen
          className="w-full h-full"
        />
      </div>
    );
  }

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
      {platform === "tiktok" ? (
        <div className="w-full h-full bg-gradient-to-br from-noir via-noir to-primary/40 flex items-center justify-center">
          {cover && <img src={cover} alt={alt} className="h-20 w-20 rounded-full object-cover ring-2 ring-primary/60 opacity-90" loading="lazy" />}
          <span className="absolute top-3 right-3 rounded-full bg-black/60 px-2 py-0.5 text-[11px] font-semibold text-white">TikTok</span>
        </div>
      ) : (
        <img
          src={`https://img.youtube.com/vi/${id}/hqdefault.jpg`}
          alt={alt}
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          loading="lazy"
        />
      )}
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
  /** Page d'offre : PlotBreaker et Lune de Lu, puis un client de cette offre. */
  offer?: string;
  limit?: number;
  location: string;
  className?: string;
}) {
  const all = useTemoignages().filter((t) => withVideo(t) && (!featured || t.featured));
  const count = limit ?? all.length;
  const videos = offer ? videosForOffer(all, offer, count) : all.slice(0, count);
  if (!videos.length) return null;
  return (
    <div className={className}>
      {videos.map((t) => (
        <VideoCard
          key={t.id}
          id={(t.youtube_id ?? t.tiktok_video_id)!}
          platform={t.youtube_id ? "youtube" : "tiktok"}
          cover={t.avatar_url}
          alt={altOf(t)}
          legend={videoLegend(t)}
          location={location}
        />
      ))}
    </div>
  );
}
