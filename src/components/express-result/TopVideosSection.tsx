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

function toNumber(value: unknown): number {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const parsed = Number(value.replace(/\s/g, "").replace(",", "."));
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
}

function pickVideoMetric(video: any, keys: string[]): number {
  const buckets = [video, video?.metrics, video?.stats, video?.statistics, video?.analytics];
  for (const bucket of buckets) {
    if (!bucket || typeof bucket !== "object") continue;
    for (const key of keys) {
      if (bucket[key] !== undefined && bucket[key] !== null) return toNumber(bucket[key]);
    }
  }
  return 0;
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
        {videos.slice(0, 5).map((v: any, i) => {
          const views = pickVideoMetric(v, ["views", "view_count", "viewCount", "playCount", "play_count", "plays"]);
          const likes = pickVideoMetric(v, ["likes", "like_count", "likeCount", "diggCount", "digg_count"]);
          const comments = pickVideoMetric(v, ["comments", "comment_count", "commentCount", "commentaryCount"]);
          const shares = pickVideoMetric(v, ["shares", "share_count", "shareCount"]);
          const saves = pickVideoMetric(v, ["saves", "save_count", "saveCount", "collectCount", "collect_count", "favorites", "favouriteCount"]);
          const engagementRate = v.engagement_rate ?? v.engagementRate ?? v.metrics?.engagement_rate ?? v.metrics?.engagementRate;
          const coverUrl = v.cover_url ?? v.coverUrl ?? v.thumbnail_url ?? v.thumbnailUrl ?? v.cover ?? v.thumbnail;
          return (
          <div key={v.id ?? v.videoId ?? i} className="flex gap-4 items-start bg-muted/30 rounded-lg p-3">
            {coverUrl ? (
              <img
                src={coverUrl}
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
                <span className="flex items-center gap-1"><Eye className="h-3 w-3" /> {formatNumber(views)}</span>
                <span className="flex items-center gap-1"><Heart className="h-3 w-3" /> {formatNumber(likes)}</span>
                <span className="flex items-center gap-1"><MessageCircle className="h-3 w-3" /> {formatNumber(comments)}</span>
                <span className="flex items-center gap-1"><Share2 className="h-3 w-3" /> {formatNumber(shares)}</span>
                <span className="flex items-center gap-1"><Bookmark className="h-3 w-3" /> {formatNumber(saves)}</span>
                {engagementRate != null && (
                  <span className="font-medium text-primary">{toNumber(engagementRate).toFixed(2)}% ER</span>
                )}
              </div>
            </div>
          </div>
        );
        })}
      </div>
    </div>
  );
}