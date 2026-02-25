import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ExternalLink } from "lucide-react";

export function WavSocialScanPopup() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const dismissed = sessionStorage.getItem("wavsocialscan_dismissed");
    if (dismissed) return;

    const timer = setTimeout(() => setOpen(true), 5000);
    return () => clearTimeout(timer);
  }, []);

  const handleClose = () => {
    setOpen(false);
    sessionStorage.setItem("wavsocialscan_dismissed", "1");
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) handleClose(); }}>
      <DialogContent className="sm:max-w-md bg-background border-primary/30">
        <DialogHeader>
          <DialogTitle className="text-xl">🔍 Tu cherches l'analyse automatique ?</DialogTitle>
          <DialogDescription className="text-base mt-2">
            Mon outil d'analyse automatique de profil TikTok se trouve sur un site dédié. Rendez-vous sur{" "}
            <a
              href="https://www.wavsocialscan.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary font-semibold underline underline-offset-2 hover:text-primary/80"
            >
              wavsocialscan.com
            </a>{" "}
            pour scanner ton profil.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col sm:flex-row gap-3 mt-2">
          <Button asChild className="flex-1 gap-2">
            <a href="https://www.wavsocialscan.com" target="_blank" rel="noopener noreferrer">
              <ExternalLink className="h-4 w-4" />
              Aller sur WavSocialScan
            </a>
          </Button>
          <Button variant="outline" onClick={handleClose} className="flex-1">
            Continuer ma visite
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
