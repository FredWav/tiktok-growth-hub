import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { trackEvent } from "@/lib/tracking";
import { FUNNEL_EVENTS, trackFunnelEvent } from "@/lib/funnel-events";

const navItems = [
  { label: "Wav Academy", href: "/wavacademy" },
  { label: "Analyse Express", href: "/analyse-express" },
  { label: "Wav Premium", href: "/reserverunappel" },
  { label: "Résultats", href: "/preuves" },
  { label: "Ressources", href: "/ressources" },
  { label: "À propos", href: "/a-propos" },
];

export function Header({ minimal = false }: { minimal?: boolean }) {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();

  // Landing page : logo seul, aucun lien sortant (on évite que le visiteur quitte la page).
  if (minimal) {
    return (
      <header className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-sm border-b border-border">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-center h-16 md:h-20">
            <span className="font-display text-xl md:text-2xl font-semibold tracking-tight">
              <span className="text-foreground">Fred</span>
              <span className="text-primary">Wav</span>
            </span>
          </div>
        </div>
      </header>
    );
  }

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-sm border-b border-border">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16 md:h-20">
          {/* Logo */}
          <Link to="/" className="flex min-h-11 items-center gap-2 rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2" aria-label="FredWav — Accueil">
            <span className="font-display text-xl md:text-2xl font-semibold tracking-tight">
              <span className="text-foreground">Fred</span>
              <span className="text-primary">Wav</span>
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-4 xl:gap-6" aria-label="Navigation principale">
            {navItems.map((item) => (
              <Link
                key={item.href}
                to={item.href}
                className={`inline-flex min-h-11 items-center text-sm font-medium transition-colors hover:text-primary ${
                  location.pathname === item.href || location.pathname.startsWith(`${item.href}/`)
                    ? "text-primary"
                    : "text-muted-foreground"
                }`}
                onClick={() => {
                  trackEvent("navigation_click", { item: item.label, position: "header_desktop" });
                }}
              >
                {item.label}
              </Link>
            ))}
          </nav>

          {/* CTA Button */}
          <div className="hidden lg:block">
            <Button asChild className="min-h-11">
              <Link
                to="/wavacademy"
                onClick={() =>
                  trackFunnelEvent(FUNNEL_EVENTS.academyCtaClick, {
                    source_page: location.pathname,
                    position: "header_desktop",
                  })
                }
              >
                Rejoindre la Wav Academy
              </Link>
            </Button>
          </div>

          {/* Mobile Menu Button */}
          <button
            type="button"
            className="lg:hidden flex h-11 w-11 items-center justify-center rounded-md transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
            onClick={() => {
              const next = !isOpen;
              setIsOpen(next);
              trackEvent("mobile_menu_toggle", { open: String(next), position: "header_mobile" });
            }}
            aria-label={isOpen ? "Fermer le menu" : "Ouvrir le menu"}
            aria-expanded={isOpen}
            aria-controls="mobile-navigation"
          >
            {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

        {/* Mobile Navigation */}
        {isOpen && (
          <nav id="mobile-navigation" className="lg:hidden py-4 border-t border-border animate-fade-in" aria-label="Navigation mobile">
            <div className="flex flex-col gap-4">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  to={item.href}
                  className={`flex min-h-11 items-center rounded-md px-2 text-base font-medium transition-colors hover:bg-muted hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
                    location.pathname === item.href || location.pathname.startsWith(`${item.href}/`)
                      ? "text-primary"
                      : "text-muted-foreground"
                  }`}
                  onClick={() => {
                    trackEvent("navigation_click", { item: item.label, position: "header_mobile" });
                    setIsOpen(false);
                  }}
                >
                  {item.label}
                </Link>
              ))}
              <Button asChild className="mt-2 min-h-11">
                <Link
                  to="/wavacademy"
                  onClick={() => {
                    trackFunnelEvent(FUNNEL_EVENTS.academyCtaClick, {
                      source_page: location.pathname,
                      position: "header_mobile",
                    });
                    setIsOpen(false);
                  }}
                >
                  Rejoindre la Wav Academy
                </Link>
              </Button>
            </div>
          </nav>
        )}
      </div>
    </header>
  );
}
