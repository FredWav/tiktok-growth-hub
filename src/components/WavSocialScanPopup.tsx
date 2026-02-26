import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Zap } from "lucide-react";

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

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) handleClose(); }}>
      <DialogContent className="sm:max-w-md bg-background border-primary/30">
        <DialogHeader>
          <DialogTitle className="text-xl">⚡ Analyse ton compte TikTok en 2 min</DialogTitle>
          <DialogDescription className="text-base mt-2">
            Obtiens un diagnostic complet de ton profil TikTok : health score, métriques clés et recommandations personnalisées. Rapport PDF inclus pour seulement 11,90€.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col sm:flex-row gap-3 mt-2">
          <Button onClick={handleGo} className="flex-1 gap-2">
            <Zap className="h-4 w-4" />
            Lancer mon analyse
          </Button>
          <Button variant="outline" onClick={handleClose} className="flex-1">
            Continuer ma visite
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
