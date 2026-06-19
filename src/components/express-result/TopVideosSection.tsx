import { Eye, Heart, MessageCircle, Bookmark, Share2, Film } from "lucide-react";

interface Video {
  id: string;
  description?: string;
  views?: number;
  likes?: number;
  comments?: number;
  shares?: number;
  saves?: number;
  engagement_rate?: number | null;
  cover_url?: string | null;
  date?: string | null;
}

function formatNumber(n: number): string {
  if (n == null) return "0";
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

export function TopVideosSection({ videos }: { videos: Video[] }) {
  if (!videos?.length) return null;
  return (
    <div className="bg-card border border-border rounded-xl p-6">
      <h3 className="font-semibold flex items-center gap-2 mb-4">
        <Film className="h-5 w-5 text-primary" />
        Top vidéos
      </h3>
      <div className="space-y-3">
        {videos.slice(0, 5).map((v, i) => (
          <div key={v.id ?? i} className="flex gap-4 items-start bg-muted/30 rounded-lg p-3">
            {v.cover_url ? (
              <img
                src={v.cover_url}
                alt={v.description?.slice(0, 80) ?? `Vidéo ${i + 1}`}
                loading="lazy"
                className="w-20 h-28 rounded object-cover shrink-0 bg-muted"
              />
            ) : (
              <div className="w-20 h-28 rounded bg-muted shrink-0 flex items-center justify-center">
                <Film className="h-6 w-6 text-muted-foreground" />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-sm line-clamp-2">{v.description || "(sans description)"}</p>
              {v.date && <p className="text-xs text-muted-foreground mt-1">{v.date}</p>}
              <div className="flex flex-wrap gap-3 mt-2 text-xs text-muted-foreground">
                <span className="flex items-center gap-1"><Eye className="h-3 w-3" /> {formatNumber(v.views ?? 0)}</span>
                <span className="flex items-center gap-1"><Heart className="h-3 w-3" /> {formatNumber(v.likes ?? 0)}</span>
                <span className="flex items-center gap-1"><MessageCircle className="h-3 w-3" /> {formatNumber(v.comments ?? 0)}</span>
                <span className="flex items-center gap-1"><Share2 className="h-3 w-3" /> {formatNumber(v.shares ?? 0)}</span>
                <span className="flex items-center gap-1"><Bookmark className="h-3 w-3" /> {formatNumber(v.saves ?? 0)}</span>
                {v.engagement_rate != null && (
                  <span className="font-medium text-primary">{v.engagement_rate}% ER</span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}