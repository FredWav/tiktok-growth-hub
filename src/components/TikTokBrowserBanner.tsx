import { useState, useEffect } from "react";
import { X, ExternalLink, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

function isTikTokBrowser() {
  const ua = navigator.userAgent || "";
  return /TikTok|BytedanceWebview|ByteLocale/i.test(ua);
}

export function TikTokBrowserBanner() {
  const [visible, setVisible] = useState(false);
  const [showUrl, setShowUrl] = useState(false);

  useEffect(() => {
    if (isTikTokBrowser()) setVisible(true);
  }, []);

  if (!visible) return null;

  const url = window.location.href;
  const isAndroid = /android/i.test(navigator.userAgent);

  const handleOpen = async () => {
    if (isAndroid) {
      window.location.href = `intent://${url.replace(/^https?:\/\//, "")}#Intent;scheme=https;package=com.android.chrome;end`;
      return;
    }

    // iOS: try clipboard, fallback to showing URL
    try {
      await navigator.clipboard.writeText(url);
      toast.success("Lien copié ! Colle-le dans Safari pour continuer.");
    } catch {
      setShowUrl(true);
    }
  };

  return (
    <div className="sticky top-0 z-[60] bg-primary text-primary-foreground px-4 py-3 text-center text-sm">
      <div className="flex flex-col items-center gap-2">
        <div className="flex items-center justify-center gap-3 flex-wrap pr-8">
          <span>
            Tu es sur le navigateur TikTok.{" "}
            {isAndroid
              ? "Pour une meilleure expérience, ouvre dans ton navigateur."
              : "Appuie sur les ⋯ en bas à droite → « Ouvrir dans Safari »"}
          </span>
          <Button size="sm" variant="secondary" onClick={handleOpen} className="gap-1.5 text-xs h-7">
            {isAndroid ? (
              <>
                <ExternalLink className="h-3.5 w-3.5" />
                Ouvrir dans Chrome
              </>
            ) : (
              <>
                <Copy className="h-3.5 w-3.5" />
                Copier le lien
              </>
            )}
          </Button>
        </div>

        {showUrl && !isAndroid && (
          <div className="w-full max-w-md">
            <p className="text-xs text-primary-foreground/80 mb-1">
              Appuie longuement sur le lien ci-dessous pour le copier :
            </p>
            <input
              type="text"
              readOnly
              value={url}
              className="w-full text-xs px-3 py-2 rounded bg-primary-foreground/10 text-primary-foreground border border-primary-foreground/20 select-all text-center"
              onFocus={(e) => e.target.select()}
            />
          </div>
        )}
      </div>

      <button
        onClick={() => setVisible(false)}
        className="absolute top-3 right-3 text-primary-foreground/70 hover:text-primary-foreground"
        aria-label="Fermer"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
