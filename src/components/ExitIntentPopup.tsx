import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ArrowRight, BarChart3, Target, FileText, Lightbulb } from "lucide-react";
import { trackPostHogEvent } from "@/lib/posthog";

const SESSION_KEY = "exit_intent_shown";

const highlights = [
  { icon: BarChart3, text: "Audit complet de ton profil, ta bio et ta photo" },
  { icon: Target, text: "Analyse de tes 30 dernières vidéos avec métriques" },
  { icon: Lightbulb, text: "Hooks, hashtags et plan d'action sur 14 jours" },
  { icon: FileText, text: "Rapport PDF détaillé livré en 3 minutes" },
];

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
            Obtiens un diagnostic complet de ton compte TikTok
          </DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground pt-2">
            Le même niveau d'analyse que mes clients Wav Premium, automatisé et livré en 3 minutes.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-2.5 py-3">
          {highlights.map((h, i) => (
            <div key={i} className="flex items-center gap-3 text-sm">
              <div className="w-7 h-7 bg-primary/10 rounded-md flex items-center justify-center shrink-0">
                <h.icon className="h-3.5 w-3.5 text-primary" />
              </div>
              <span>{h.text}</span>
            </div>
          ))}
        </div>
        <Button variant="hero" size="lg" onClick={handleGo} className="w-full">
          Lancer mon Analyse Express (11,90€)
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
        <p className="text-[11px] text-center text-muted-foreground">Profil, bio, vidéos, hashtags, stratégie — tout est couvert.</p>
      </DialogContent>
    </Dialog>
  );
}
