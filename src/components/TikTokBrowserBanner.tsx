import { useState, useEffect } from "react";
import { Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";

function isTikTokBrowser() {
  const ua = navigator.userAgent || "";
  return /TikTok|BytedanceWebview|ByteLocale/i.test(ua);
}

export function TikTokBrowserBanner() {
  const [visible, setVisible] = useState(false);
  const [copied, setCopied] = useState(false);

  const url = typeof window !== "undefined" ? window.location.href : "";
  const isAndroid = /android/i.test(navigator.userAgent);

  useEffect(() => {
    if (!isTikTokBrowser()) return;

    if (isAndroid) {
      // Auto-redirect Android to Chrome via intent
      window.location.href = `intent://${url.replace(/^https?:\/\//, "")}#Intent;scheme=https;package=com.android.chrome;end`;
      // Show overlay as fallback if intent doesn't work after 1s
      const timer = setTimeout(() => setVisible(true), 1000);
      return () => clearTimeout(timer);
    }

    // iOS: try googlechrome:// scheme, then show blocking overlay
    try {
      const chromeUrl = url.replace(/^https/, "googlechrome");
      window.location.href = chromeUrl;
    } catch {
      // ignore
    }

    // Always show overlay on iOS as fallback
    setVisible(true);
  }, []);

  if (!visible) return null;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    } catch {
      // fallback: select input
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] bg-background flex flex-col items-center justify-center px-6 text-center">
      <div className="max-w-sm w-full flex flex-col items-center gap-6">
        {/* Icon */}
        <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
          <svg viewBox="0 0 24 24" className="w-8 h-8 text-primary" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
            <polyline points="15 3 21 3 21 9" />
            <line x1="10" y1="14" x2="21" y2="3" />
          </svg>
        </div>

        <div className="space-y-2">
          <h2 className="text-xl font-bold text-foreground">
            Ouvre dans {isAndroid ? "Chrome" : "Safari"}
          </h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            {isAndroid
              ? "Le navigateur TikTok ne supporte pas toutes les fonctionnalités. Appuie sur le bouton ci-dessous pour ouvrir dans Chrome."
              : "Le navigateur TikTok bloque certaines fonctionnalités. Suis les étapes ci-dessous pour continuer."}
          </p>
        </div>

        {isAndroid ? (
          <Button
            size="lg"
            className="w-full"
            onClick={() => {
              window.location.href = `intent://${url.replace(/^https?:\/\//, "")}#Intent;scheme=https;package=com.android.chrome;end`;
            }}
          >
            Ouvrir dans Chrome
          </Button>
        ) : (
          <>
            {/* Step-by-step iOS instructions */}
            <div className="w-full space-y-3 text-left">
              <div className="flex items-start gap-3">
                <span className="flex-shrink-0 w-7 h-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold">1</span>
                <p className="text-sm text-foreground pt-1">
                  Appuie sur les <span className="font-bold text-lg leading-none">⋯</span> en bas à droite de l'écran
                </p>
              </div>
              <div className="flex items-start gap-3">
                <span className="flex-shrink-0 w-7 h-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold">2</span>
                <p className="text-sm text-foreground pt-1">
                  Appuie sur <span className="font-semibold">« Ouvrir dans le navigateur »</span>
                </p>
              </div>
            </div>

            <div className="w-full border-t border-border pt-4 space-y-3">
              <p className="text-xs text-muted-foreground">
                Ou copie le lien et colle-le dans Safari :
              </p>
              <div className="flex gap-2">
                <input
                  type="text"
                  readOnly
                  value={url}
                  className="flex-1 text-xs px-3 py-2.5 rounded-md bg-muted text-foreground border border-border select-all truncate"
                  onFocus={(e) => e.target.select()}
                />
                <Button size="sm" variant="outline" onClick={handleCopy} className="shrink-0 gap-1.5">
                  {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  {copied ? "Copié" : "Copier"}
                </Button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
