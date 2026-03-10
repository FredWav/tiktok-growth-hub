import { useTrustedClients } from "@/hooks/useTrustedClients";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";

interface TrustedByProps {
  filter?: string;
  className?: string;
}

export const TrustedBy = ({ filter, className = "" }: TrustedByProps) => {
  const { data: clients, isLoading } = useTrustedClients(filter);

  if (isLoading || !clients || clients.length === 0) return null;

  return (
    <div className={`flex flex-col items-center gap-3 ${className}`}>
      <div className="flex items-center -space-x-4">
        {clients.map((client) => (
          <a
            key={client.id}
            href={client.tiktok_url || "#"}
            target="_blank"
            rel="noopener noreferrer"
            className="relative group"
            title={client.name}
          >
            <Avatar className="h-16 w-16 border-2 border-background ring-2 ring-primary/20 transition-transform group-hover:scale-125 group-hover:z-10">
              {client.avatar_url ? (
                <AvatarImage src={client.avatar_url} alt={client.name} />
              ) : null}
              <AvatarFallback className="bg-primary/10 text-primary text-xs font-medium">
                {client.name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
          </a>
        ))}
      </div>
      <p className="text-xs text-muted-foreground">
        Ils m'ont fait confiance
      </p>
    </div>
  );
};
