import { useClientScreenshots } from "@/hooks/useClientScreenshots";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { useState } from "react";
import { SectionHeader } from "@/components/ui/section";

interface ScreenshotWallProps {
  location: string;
  title?: string;
  subtitle?: string;
  className?: string;
}

export const ScreenshotWall = ({
  location,
  title = "Leurs messages",
  subtitle = "Des retours authentiques, sans filtre.",
  className = "",
}: ScreenshotWallProps) => {
  const { data: screenshots, isLoading } = useClientScreenshots(location);
  const [selected, setSelected] = useState<string | null>(null);

  if (isLoading || !screenshots?.length) return null;

  return (
    <div className={className}>
      <SectionHeader title={title} subtitle={subtitle} />

      <div className="columns-2 md:columns-3 gap-5 max-w-4xl mx-auto">
        {screenshots.map((s) => (
          <div
            key={s.id}
            className="break-inside-avoid mb-5 cursor-pointer group"
            onClick={() => setSelected(s.image_url)}
          >
            <div className="relative rounded-xl overflow-hidden shadow-md border border-border transition-transform group-hover:scale-[1.02]">
              <img
                src={s.image_url}
                alt={s.client_name ? `Message de ${s.client_name}` : "Message client"}
                className="w-full h-auto"
                loading="lazy"
              />
              {(s.client_name || s.caption) && (
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-3">
                  {s.client_name && (
                    <p className="text-white text-sm font-medium">{s.client_name}</p>
                  )}
                  {s.caption && (
                    <p className="text-white/80 text-xs">{s.caption}</p>
                  )}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      <Dialog open={!!selected} onOpenChange={() => setSelected(null)}>
        <DialogContent className="max-w-3xl p-2 bg-transparent border-none shadow-none">
          {selected && (
            <img
              src={selected}
              alt="Capture client"
              className="w-full h-auto rounded-xl"
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};
