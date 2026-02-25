import { Badge } from "@/components/ui/badge";
import { Hash } from "lucide-react";

interface HashtagsSectionProps {
  hashtags: string[];
}

export function HashtagsSection({ hashtags }: HashtagsSectionProps) {
  if (!hashtags?.length) return null;

  return (
    <div className="bg-card border border-border rounded-xl p-6">
      <h3 className="font-semibold mb-3 flex items-center gap-2">
        <Hash className="h-5 w-5 text-primary" />
        Top Hashtags
      </h3>
      <div className="flex flex-wrap gap-2">
        {hashtags.map((tag, i) => (
          <Badge key={i} variant="outline" className="text-sm">
            {tag.startsWith("#") ? tag : `#${tag}`}
          </Badge>
        ))}
      </div>
    </div>
  );
}
