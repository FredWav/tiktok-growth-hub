import { useState, useEffect } from "react";
import { X, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

function isTikTokBrowser() {
  const ua = navigator.userAgent || "";
  return /TikTok|BytedanceWebview|ByteLocale/i.test(ua);
}

export function TikTokBrowserBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (isTikTokBrowser()) setVisible(true);
  }, []);

  if (!visible) return null;

  const handleOpen = () => {
    const url = window.location.href;
    const isAndroid = /android/i.test(navigator.userAgent);

    if (isAndroid) {
      window.location.href = `intent://${url.replace(/^https?:\/\//, "")}#Intent;scheme=https;package=com.android.chrome;end`;
    } else {
      navigator.clipboard.writeText(url).then(() => {
        toast.success("Lien copié ! Colle-le dans Safari pour continuer.");
      }).catch(() => {
        toast.info(`Copie ce lien dans Safari : ${url}`);
      });
    }
  };

  return (
    <div className="sticky top-0 z-[60] bg-primary text-primary-foreground px-4 py-3 text-center text-sm">
      <div className="flex items-center justify-center gap-3 flex-wrap">
        <span>Tu es sur le navigateur TikTok. Pour une meilleure expérience, ouvre dans ton navigateur.</span>
        <Button size="sm" variant="secondary" onClick={handleOpen} className="gap-1.5 text-xs h-7">
          <ExternalLink className="h-3.5 w-3.5" />
          Ouvrir dans mon navigateur
        </Button>
      </div>
      <button
        onClick={() => setVisible(false)}
        className="absolute top-1/2 right-3 -translate-y-1/2 text-primary-foreground/70 hover:text-primary-foreground"
        aria-label="Fermer"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
