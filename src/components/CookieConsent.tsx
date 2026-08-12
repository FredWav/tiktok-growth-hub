import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { initPostHog, trackPostHogEvent, optOutPostHog, optInPostHog, capturePageview } from "@/lib/posthog";
import { captureUtmParams, clearAttribution, syncAttributionToPostHog } from "@/lib/tracking";
import { COOKIE_SETTINGS_EVENT } from "@/lib/cookie-consent";

const GA_ID = "G-E361JPZX7D";

function enableGA() {
  (window as unknown as Record<string, boolean>)[`ga-disable-${GA_ID}`] = false;

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
      captureUtmParams();
      syncAttributionToPostHog();
    } else if (!consent) {
      setVisible(true);
    }
    // "refused" → ne rien charger

    const onOpen = () => setVisible(true);
    window.addEventListener(COOKIE_SETTINGS_EVENT, onOpen);
    return () => window.removeEventListener(COOKIE_SETTINGS_EVENT, onOpen);
  }, []);

  const accept = async () => {
    localStorage.setItem("cookie_consent", "accepted");
    enableGA();
    initPostHog();
    optInPostHog();
    captureUtmParams();
    syncAttributionToPostHog();
    // Le pageview d'atterrissage a été sauté en attendant le consentement : on le
    // déclenche maintenant, sinon un visiteur qui accepte sans naviguer n'est jamais compté.
    capturePageview();
    const { trackPageView } = await import("@/lib/page-tracker");
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
    clearAttribution();
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className="fixed bottom-0 inset-x-0 z-50 p-3 md:p-6">
      <div className="max-w-3xl mx-auto bg-card border border-border rounded-xl shadow-lg p-3.5 md:p-5 flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4">
        <p className="text-xs sm:text-sm text-muted-foreground flex-1 leading-relaxed">
          Ce site utilise des cookies de mesure d'audience (Google Analytics et PostHog) pour améliorer votre expérience.
          Le refus est aussi simple que l'acceptation, et vous pouvez modifier votre choix à tout moment.{" "}
          <Link to="/politique-de-confidentialite" className="text-primary hover:underline">
            En savoir plus
          </Link>
        </p>
        <div className="grid grid-cols-2 sm:flex gap-2 sm:gap-3 shrink-0 w-full sm:w-auto">
          <Button variant="outline" size="sm" className="min-h-11" onClick={refuse}>
            Refuser
          </Button>
          <Button size="sm" className="min-h-11" onClick={accept}>
            Accepter
          </Button>
        </div>
      </div>
    </div>
  );
}
