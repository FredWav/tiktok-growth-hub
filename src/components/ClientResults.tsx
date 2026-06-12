import { useState } from "react";
import { useTrustedClients } from "@/hooks/useTrustedClients";
import { CLIENT_RESULTS, type ClientResult } from "@/data/clientResults";

function initialsOf(name: string) {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return parts
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export function ClientResultCard({
  result,
  avatarUrl,
}: {
  result: ClientResult;
  avatarUrl?: string | null;
}) {
  // Priorité : avatar trusted_clients, puis photo locale (result.avatarUrl), puis initiales.
  const src = avatarUrl ?? result.avatarUrl ?? null;
  const [imgFailed, setImgFailed] = useState(false);
  return (
    <div className="rounded-2xl bg-background border border-border shadow-sm p-6 flex flex-col h-full">
      <div className="flex items-center gap-3 mb-4">
        {src && !imgFailed ? (
          <img
            src={src}
            alt={result.name}
            onError={() => setImgFailed(true)}
            className="h-12 w-12 rounded-full object-cover ring-2 ring-primary/20 flex-shrink-0"
            loading="lazy"
          />
        ) : (
          <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center ring-2 ring-primary/20 flex-shrink-0">
            <span className="font-display text-base font-bold text-primary">{initialsOf(result.name)}</span>
          </div>
        )}
        <div className="min-w-0">
          <p className="font-semibold text-foreground leading-tight truncate">{result.name}</p>
          {result.niche && <p className="text-xs text-muted-foreground truncate">{result.niche}</p>}
        </div>
      </div>

      <div className="mt-auto flex items-center gap-3 rounded-xl bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/15 p-4">
        <span className="font-display text-xl font-bold text-primary whitespace-nowrap">{result.metric}</span>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-foreground leading-snug">{result.result}</p>
          {result.detail && <p className="text-xs text-muted-foreground mt-0.5">{result.detail}</p>}
        </div>
      </div>
    </div>
  );
}

export function ClientResults({ className = "", limit }: { className?: string; limit?: number }) {
  const { data: clients } = useTrustedClients();
  const avatarFor = (r: ClientResult) =>
    clients?.find(
      (c) => c.name.trim().toLowerCase() === (r.avatarName ?? r.name).trim().toLowerCase()
    )?.avatar_url ?? null;

  const items = limit ? CLIENT_RESULTS.slice(0, limit) : CLIENT_RESULTS;

  return (
    <div className={`grid sm:grid-cols-2 lg:grid-cols-3 gap-5 max-w-5xl mx-auto ${className}`}>
      {items.map((r) => (
        <ClientResultCard key={r.name} result={r} avatarUrl={avatarFor(r)} />
      ))}
    </div>
  );
}
