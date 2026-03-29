import { Link } from "react-router-dom";
import { Instagram, Youtube, Facebook } from "lucide-react";
import { trackPostHogEvent } from "@/lib/posthog";

const navLinks = [
  { label: "Accueil", href: "/", section: "navigation" },
  { label: "Wav Premium", href: "/wav-premium/candidature", section: "navigation" },
  { label: "Analyse Express", href: "/analyse-express", section: "navigation" },
  { label: "Témoignages", href: "/preuves", section: "navigation" },
  { label: "À propos", href: "/a-propos", section: "navigation" },
  { label: "Newsletter", href: "/mail", section: "navigation" },
  { label: "Contact", href: "/contact", section: "navigation" },
];

const socialLinks = [
  {
    name: "TikTok",
    href: "https://www.tiktok.com/@fredwav",
    icon: (
      <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor"><path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.27 6.27 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V8.75a8.18 8.18 0 004.77 1.52V6.84a4.84 4.84 0 01-1-.15z"/></svg>
    ),
  },
  { name: "Instagram", href: "https://www.instagram.com/levraifredwav/", icon: <Instagram className="h-4 w-4" /> },
  { name: "YouTube", href: "https://www.youtube.com/@Fredwavconseils", icon: <Youtube className="h-4 w-4" /> },
  { name: "Facebook", href: "https://www.facebook.com/frederic.olalde", icon: <Facebook className="h-4 w-4" /> },
];

const legalLinks = [
  { label: "Mentions légales", href: "/mentions-legales" },
  { label: "Confidentialité", href: "/politique-de-confidentialite" },
  { label: "CGV", href: "/cgv" },
];

export function Footer() {
  return (
    <footer className="bg-noir text-muted-foreground">
      <div className="container mx-auto px-4 py-12 md:py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="md:col-span-1">
            <Link to="/" className="inline-block mb-4" onClick={() => trackPostHogEvent("click_footer_link", { item: "logo", section: "brand" })}>
              <span className="font-display text-2xl font-semibold tracking-tight text-cream">
                Fred<span className="text-primary">Wav</span>
              </span>
            </Link>
            <p className="text-sm text-muted-foreground max-w-md">
              Expert stratégie formats courts. 
              Des résultats, pas des promesses.
            </p>
          </div>

          {/* Navigation */}
          <nav aria-label="Navigation footer - Pages principales">
            <h4 className="font-semibold text-cream mb-4">Navigation</h4>
            <ul className="space-y-2 text-sm">
              {navLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    to={link.href}
                    className="hover:text-primary transition-colors"
                    onClick={() => trackPostHogEvent("click_footer_link", { item: link.label, section: "navigation" })}
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          {/* Réseaux sociaux */}
          <nav aria-label="Réseaux sociaux">
            <h4 className="font-semibold text-cream mb-4">Réseaux</h4>
            <ul className="space-y-2 text-sm">
              {socialLinks.map((s) => (
                <li key={s.name}>
                  <a
                    href={s.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-primary transition-colors flex items-center gap-2"
                    onClick={() => trackPostHogEvent("click_social", { platform: s.name, location: "footer" })}
                  >
                    {s.icon}
                    {s.name}
                  </a>
                </li>
              ))}
            </ul>
          </nav>

          {/* Contact */}
          <div>
            <h4 className="font-semibold text-cream mb-4">Contact</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/contact" className="hover:text-primary transition-colors" onClick={() => trackPostHogEvent("click_footer_link", { item: "Contact", section: "contact" })}>
                  Nous contacter
                </Link>
              </li>
              <li>
                <a href="mailto:contact@fredwav.com" className="hover:text-primary transition-colors" onClick={() => trackPostHogEvent("click_email_link", { location: "footer" })}>
                  contact@fredwav.com
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-border/20 mt-12 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} Fred Wav. Tous droits réservés.
          </p>
          <nav aria-label="Mentions légales" className="flex gap-6 text-xs">
            {legalLinks.map((link) => (
              <Link
                key={link.href}
                to={link.href}
                className="hover:text-primary transition-colors"
                onClick={() => trackPostHogEvent("click_footer_link", { item: link.label, section: "legal" })}
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>
      </div>
    </footer>
  );
}
