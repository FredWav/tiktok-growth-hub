import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useDiagnostic } from "@/contexts/DiagnosticContext";
import { Button } from "@/components/ui/button";
import { Loader2, ArrowRight } from "lucide-react";

const MESSAGES = [
  "Analyse du profil...",
  "Détection des blocages...",
  "Construction du plan d'action...",
];

const DiagnosticProcessing = () => {
  const { isComplete } = useDiagnostic();
  const navigate = useNavigate();
  const [msgIndex, setMsgIndex] = useState(0);
  const [showButton, setShowButton] = useState(false);

  useEffect(() => {
    console.log("[DiagnosticProcessing] isComplete:", isComplete);
    if (!isComplete) {
      console.log("[DiagnosticProcessing] Redirecting to /start (incomplete)");
      navigate("/start", { replace: true });
    }
  }, [isComplete, navigate]);

  useEffect(() => {
    const interval = setInterval(() => {
      setMsgIndex((prev) => (prev + 1) % MESSAGES.length);
    }, 800);
    const timer = setTimeout(() => {
      setShowButton(true);
      clearInterval(interval);
    }, 2500);
    return () => {
      clearInterval(interval);
      clearTimeout(timer);
    };
  }, []);

  if (!isComplete) return null;

  return (
    <div className="min-h-screen bg-cream flex items-center justify-center px-4">
      <div className="text-center space-y-8 max-w-md">
        <h1 className="font-display text-2xl md:text-3xl font-bold text-foreground">
          Analyse de ton compte TikTok en cours...
        </h1>

        {!showButton && (
          <div className="space-y-4">
            <Loader2 className="w-12 h-12 text-primary animate-spin mx-auto" />
            <p key={msgIndex} className="text-muted-foreground font-medium text-lg animate-fade-in">
              {MESSAGES[msgIndex]}
            </p>
          </div>
        )}

        {showButton && (
          <div className="animate-fade-in space-y-4">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
              <svg className="w-8 h-8 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <p className="text-muted-foreground">Ton diagnostic est prêt.</p>
            <Button variant="hero" size="xl" onClick={() => navigate("/result")} className="w-full sm:w-auto">
              Voir mon diagnostic <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default DiagnosticProcessing;
