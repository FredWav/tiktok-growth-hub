import { useState, useEffect } from "react";
import { X } from "lucide-react";

function isTikTokBrowser(userAgent: string) {
  return /TikTok|BytedanceWebview|ByteLocale/i.test(userAgent);
}

/**
 * Bande discrète et fermable pour les visiteurs du navigateur TikTok.
 * Ne bloque jamais la page et ne redirige jamais : un écran plein + redirection
 * forcée faisait partir 95 % des visiteurs venus des pubs TikTok en 6 secondes.
 */
export function TikTokBrowserBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined" || typeof navigator === "undefined") return;
    if (!isTikTokBrowser(navigator.userAgent || "")) return;
    if (sessionStorage.getItem("tt_banner_closed") === "1") return;
    setVisible(true);
  }, []);

  if (!visible) return null;

  const close = () => {
    sessionStorage.setItem("tt_banner_closed", "1");
    setVisible(false);
  };

  return (
    <div className="fixed bottom-0 inset-x-0 z-50 bg-muted text-muted-foreground border-t border-border px-4 py-2 flex items-center gap-3 text-xs">
      <p className="flex-1">
        Un souci de paiement ? Appuie sur ... puis « Ouvrir dans le navigateur ».
      </p>
      <button onClick={close} aria-label="Fermer" className="shrink-0 p-1">
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
