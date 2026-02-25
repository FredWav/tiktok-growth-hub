import { Badge } from "@/components/ui/badge";
import { CheckCircle } from "lucide-react";

interface ProfileHeaderProps {
  avatar_url?: string;
  display_name?: string;
  username: string;
  bio?: string;
  detected_niche?: string;
  verified?: boolean;
}

export function ProfileHeader({ avatar_url, display_name, username, bio, detected_niche, verified }: ProfileHeaderProps) {
  return (
    <div className="flex flex-col items-center gap-4 text-center">
      {avatar_url && (
        <img
          src={avatar_url}
          alt={`Avatar de @${username}`}
          className="w-24 h-24 rounded-full border-2 border-primary object-cover"
        />
      )}
      <div>
        <h1 className="font-display text-3xl md:text-4xl font-semibold flex items-center justify-center gap-2">
          {display_name || `@${username}`}
          {verified && <CheckCircle className="h-5 w-5 text-blue-500 fill-blue-500" />}
        </h1>
        <p className="text-primary font-medium">@{username}</p>
      </div>
      {detected_niche && (
        <Badge variant="secondary" className="text-sm">{detected_niche}</Badge>
      )}
      {bio && (
        <p className="text-muted-foreground text-sm max-w-md whitespace-pre-line">{bio}</p>
      )}
    </div>
  );
}
