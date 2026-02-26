import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Zap, X } from "lucide-react";

export function WavSocialScanPopup() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const lastShown = localStorage.getItem("wavsocialscan_last_shown");
    if (lastShown) {
      const elapsed = Date.now() - parseInt(lastShown, 10);
      if (elapsed < 24 * 60 * 60 * 1000) return;
    }

    const timer = setTimeout(() => setOpen(true), 5000);
    return () => clearTimeout(timer);
  }, []);

  const handleClose = () => {
    setOpen(false);
    localStorage.setItem("wavsocialscan_last_shown", Date.now().toString());
  };

  const handleGo = () => {
    handleClose();
    navigate("/analyse-express");
  };

  if (!open) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 w-[340px] animate-fade-in rounded-xl border border-primary/30 bg-background shadow-lg p-4">
      <button
        onClick={handleClose}
        className="absolute top-2 right-2 text-muted-foreground hover:text-foreground transition-colors"
        aria-label="Fermer"
      >
        <X className="h-4 w-4" />
      </button>
      <p className="font-semibold text-sm mb-1">⚡ Analyse ton compte en 2 min</p>
      <p className="text-xs text-muted-foreground mb-3">
        Health score, métriques clés et recommandations. Rapport PDF inclus — 11,90€.
      </p>
      <div className="flex gap-2">
        <Button size="sm" onClick={handleGo} className="flex-1 gap-1.5 text-xs">
          <Zap className="h-3.5 w-3.5" />
          Lancer mon analyse
        </Button>
        <Button variant="ghost" size="sm" onClick={handleClose} className="text-xs px-2">
          Non merci
        </Button>
      </div>
    </div>
  );
}
