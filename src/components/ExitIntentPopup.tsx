import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { trackPostHogEvent } from "@/lib/posthog";

const SESSION_KEY = "exit_intent_shown";

export function ExitIntentPopup() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (sessionStorage.getItem(SESSION_KEY)) return;

    let triggered = false;
    const trigger = () => {
      if (triggered || sessionStorage.getItem(SESSION_KEY)) return;
      triggered = true;
      sessionStorage.setItem(SESSION_KEY, "1");
      setOpen(true);
      trackPostHogEvent("exit_intent_popup_shown");
    };

    // Desktop: mouse leaves viewport from top
    const handleMouseLeave = (e: MouseEvent) => {
      if (e.clientY <= 0) trigger();
    };

    // Scroll > 70%
    const handleScroll = () => {
      const scrollPercent = (window.scrollY + window.innerHeight) / document.documentElement.scrollHeight;
      if (scrollPercent > 0.7) trigger();
    };

    document.addEventListener("mouseleave", handleMouseLeave);
    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      document.removeEventListener("mouseleave", handleMouseLeave);
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  const handleGo = () => {
    trackPostHogEvent("exit_intent_popup_click");
    setOpen(false);
    navigate("/analyse-express");
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display text-xl">
            Pas encore prêt pour un accompagnement complet ?
          </DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground pt-2">
            Ne laisse pas ton compte stagner. Lance un audit automatique de ton profil TikTok en 3 minutes : health score, métriques clés et recommandations personnalisées.
          </DialogDescription>
        </DialogHeader>
        <Button variant="hero" size="lg" onClick={handleGo} className="w-full mt-2">
          Lancer mon Analyse Express (11,90€)
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </DialogContent>
    </Dialog>
  );
}