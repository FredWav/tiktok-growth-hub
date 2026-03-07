import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { trackPostHogEvent } from "@/lib/posthog";

const navItems = [
  { label: "Accueil", href: "/" },
  { label: "Offres", href: "/offres" },
  { label: "Analyse Express", href: "/analyse-express" },
  { label: "Témoignages", href: "/preuves" },
  { label: "À propos", href: "/a-propos" },
  { label: "Contact", href: "/contact" },
];

export function Header() {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-sm border-b border-border">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16 md:h-20">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2">
            <span className="font-display text-xl md:text-2xl font-semibold tracking-tight">
              <span className="text-foreground">Fred</span>
              <span className="text-primary">Wav</span>
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-8" aria-label="Navigation principale">
            {navItems.map((item) => (
              <Link
                key={item.href}
                to={item.href}
                className={`text-sm font-medium transition-colors hover:text-primary ${
                  location.pathname === item.href
                    ? "text-primary"
                    : "text-muted-foreground"
                }`}
                onClick={() => {
                  trackPostHogEvent("click_nav", { item: item.label, location: "header" });
                }}
              >
                {item.label}
              </Link>
            ))}
          </nav>

          {/* CTA Button */}
          <div className="hidden lg:block">
            <Button asChild>
              <Link to="/one-shot" onClick={() => trackPostHogEvent("click_nav_cta", { location: "header" })}>Réserver mon One Shot (179€)</Link>
            </Button>
          </div>

          {/* Mobile Menu Button */}
          <button
            className="lg:hidden p-2"
            onClick={() => { const next = !isOpen; setIsOpen(next); trackPostHogEvent("toggle_mobile_menu", { open: next }); }}
            aria-label="Toggle menu"
          >
            {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

        {/* Mobile Navigation */}
        {isOpen && (
          <nav className="lg:hidden py-4 border-t border-border animate-fade-in">
            <div className="flex flex-col gap-4">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  to={item.href}
                  className={`text-base font-medium transition-colors hover:text-primary ${
                    location.pathname === item.href
                      ? "text-primary"
                      : "text-muted-foreground"
                  }`}
                  onClick={() => {
                    if (item.href === "/analyse-express") {
                      trackPostHogEvent("click_analyse_express_nav", { location: "header_mobile" });
                    }
                    setIsOpen(false);
                  }}
                >
                  {item.label}
                </Link>
              ))}
              <Button asChild className="mt-2">
                <Link to="/one-shot" onClick={() => setIsOpen(false)}>
                  Réserver mon One Shot (179€)
                </Link>
              </Button>
            </div>
          </nav>
        )}
      </div>
    </header>
  );
}
