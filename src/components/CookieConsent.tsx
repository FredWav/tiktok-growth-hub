import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { initPostHog } from "@/lib/posthog";

const GA_ID = "G-E361JPZX7D";

function enableGA() {
  // Remove the disable flag
  (window as any)[`ga-disable-${GA_ID}`] = false;

  // If gtag is already loaded, just re-enable
  if (window.gtag) {
    window.gtag("consent", "update", {
      analytics_storage: "granted",
    });
    return;
  }

  // Load gtag script dynamically
  const script = document.createElement("script");
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_ID}`;
  document.head.appendChild(script);

  window.dataLayer = window.dataLayer || [];
  window.gtag = function (...args: unknown[]) {
    window.dataLayer!.push(args);
  };
  window.gtag("js", new Date());
  window.gtag("config", GA_ID);
}

export function CookieConsent() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem("cookie_consent");
    if (consent === "accepted") {
      enableGA();
      initPostHog();
    } else if (!consent) {
      setVisible(true);
    }
    // "refused" → do nothing
  }, []);

  const accept = () => {
    localStorage.setItem("cookie_consent", "accepted");
    enableGA();
    initPostHog();
    // Track after init so PostHog is ready
    setTimeout(() => trackPostHogEvent("cookie_consent_accepted"), 100);
    setVisible(false);
  };

  const refuse = () => {
    localStorage.setItem("cookie_consent", "refused");
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className="fixed bottom-0 inset-x-0 z-50 p-4 md:p-6">
      <div className="max-w-3xl mx-auto bg-card border border-border rounded-xl shadow-lg p-4 md:p-6 flex flex-col md:flex-row items-start md:items-center gap-4">
        <p className="text-sm text-muted-foreground flex-1">
          Ce site utilise des cookies de mesure d'audience (Google Analytics) pour améliorer votre expérience.
          Vous pouvez accepter ou refuser leur utilisation.{" "}
          <Link to="/politique-de-confidentialite" className="text-primary hover:underline">
            En savoir plus
          </Link>
        </p>
        <div className="flex gap-3 shrink-0">
          <Button variant="outline" size="sm" onClick={refuse}>
            Refuser
          </Button>
          <Button size="sm" onClick={accept}>
            Accepter
          </Button>
        </div>
      </div>
    </div>
  );
}
