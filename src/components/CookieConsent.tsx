import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { initPostHog, trackPostHogEvent, optOutPostHog, optInPostHog, capturePageview } from "@/lib/posthog";
import { trackPageView } from "@/lib/page-tracker";
import { syncAttributionToPostHog } from "@/lib/tracking";
import { COOKIE_SETTINGS_EVENT } from "@/lib/cookie-consent";

const GA_ID = "G-E361JPZX7D";

function enableGA() {
  (window as any)[`ga-disable-${GA_ID}`] = false;

  if (window.gtag) {
    window.gtag("consent", "update", { analytics_storage: "granted" });
    return;
  }

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

/** Coupe la collecte GA après un retrait de consentement (déjà chargé ou non). */
function disableGA() {
  (window as unknown as Record<string, boolean>)[`ga-disable-${GA_ID}`] = true;
  if (window.gtag) {
    window.gtag("consent", "update", { analytics_storage: "denied" });
  }
}

export function CookieConsent() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem("cookie_consent");
    if (consent === "accepted") {
      enableGA();
      initPostHog();
      syncAttributionToPostHog();
    } else if (!consent) {
      setVisible(true);
    }
    // "refused" → ne rien charger

    const onOpen = () => setVisible(true);
    window.addEventListener(COOKIE_SETTINGS_EVENT, onOpen);
    return () => window.removeEventListener(COOKIE_SETTINGS_EVENT, onOpen);
  }, []);

  const accept = () => {
    localStorage.setItem("cookie_consent", "accepted");
    enableGA();
    initPostHog();
    optInPostHog();
    syncAttributionToPostHog();
    // Le pageview d'atterrissage a été sauté en attendant le consentement : on le
    // déclenche maintenant, sinon un visiteur qui accepte sans naviguer n'est jamais compté.
    capturePageview();
    trackPageView(window.location.pathname);
    // Track après init pour que PostHog soit prêt
    setTimeout(() => trackPostHogEvent("cookie_consent_accepted"), 100);
    setVisible(false);
  };

  const refuse = () => {
    localStorage.setItem("cookie_consent", "refused");
    // Si l'utilisateur avait accepté puis change d'avis, on coupe réellement la collecte.
    disableGA();
    optOutPostHog();
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className="fixed bottom-0 inset-x-0 z-50 p-4 md:p-6">
      <div className="max-w-3xl mx-auto bg-card border border-border rounded-xl shadow-lg p-4 md:p-6 flex flex-col md:flex-row items-start md:items-center gap-4">
        <p className="text-sm text-muted-foreground flex-1">
          Ce site utilise des cookies de mesure d'audience (Google Analytics et PostHog) pour améliorer votre expérience.
          Le refus est aussi simple que l'acceptation, et vous pouvez modifier votre choix à tout moment.{" "}
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
