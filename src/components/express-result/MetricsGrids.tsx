import { Eye, Heart, MessageCircle, Bookmark, Share2, BarChart3, TrendingUp, Users } from "lucide-react";

function formatNumber(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

function MetricCard({ icon: Icon, label, value }: { icon: any; label: string; value: string }) {
  return (
    <div className="bg-card border border-border rounded-xl p-4 text-center">
      <Icon className="h-5 w-5 text-primary mx-auto mb-2" />
      <div className="text-2xl font-bold">{value}</div>
      <div className="text-xs text-muted-foreground">{label}</div>
    </div>
  );
}

interface MetricsGridsProps {
  account: any;
}

export function MetricsGrids({ account }: MetricsGridsProps) {
  return (
    <div className="space-y-6">
      {/* Main stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {account.follower_count != null && <MetricCard icon={Users} label="Abonnés" value={formatNumber(account.follower_count)} />}
        {account.like_count != null && <MetricCard icon={Heart} label="Likes totaux" value={formatNumber(account.like_count)} />}
        {account.video_count != null && <MetricCard icon={BarChart3} label="Vidéos" value={formatNumber(account.video_count)} />}
        {account.engagement_rate != null && <MetricCard icon={TrendingUp} label="Engagement" value={`${account.engagement_rate}%`} />}
      </div>

      {/* Averages */}
      <div>
        <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider mb-3">Moyennes par vidéo</h3>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {account.avg_views != null && <MetricCard icon={Eye} label="Vues" value={formatNumber(account.avg_views)} />}
          {account.avg_likes != null && <MetricCard icon={Heart} label="Likes" value={formatNumber(account.avg_likes)} />}
          {account.avg_comments != null && <MetricCard icon={MessageCircle} label="Commentaires" value={formatNumber(account.avg_comments)} />}
          {account.avg_saves != null && <MetricCard icon={Bookmark} label="Saves" value={formatNumber(account.avg_saves)} />}
          {account.avg_shares != null && <MetricCard icon={Share2} label="Partages" value={formatNumber(account.avg_shares)} />}
        </div>
      </div>

      {/* Medians */}
      <div>
        <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider mb-3">Médianes par vidéo</h3>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {account.median_views != null && <MetricCard icon={Eye} label="Vues" value={formatNumber(account.median_views)} />}
          {account.median_likes != null && <MetricCard icon={Heart} label="Likes" value={formatNumber(account.median_likes)} />}
          {account.median_comments != null && <MetricCard icon={MessageCircle} label="Commentaires" value={formatNumber(account.median_comments)} />}
          {account.median_saves != null && <MetricCard icon={Bookmark} label="Saves" value={formatNumber(account.median_saves)} />}
          {account.median_shares != null && <MetricCard icon={Share2} label="Partages" value={formatNumber(account.median_shares)} />}
        </div>
      </div>
    </div>
  );
}
