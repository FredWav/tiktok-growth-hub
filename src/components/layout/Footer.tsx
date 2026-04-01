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
  {
    name: "Threads",
    href: "https://www.threads.com/@fredwavoff",
    icon: (
      <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor"><path d="M12.186 24h-.007c-3.581-.024-6.334-1.205-8.184-3.509C2.35 18.44 1.5 15.586 1.472 12.01v-.017c.03-3.579.879-6.43 2.525-8.482C5.845 1.205 8.6.024 12.18 0h.014c2.746.02 5.043.725 6.826 2.098 1.677 1.29 2.858 3.13 3.509 5.467l-2.04.569c-1.104-3.96-3.898-5.984-8.304-6.015-2.91.022-5.11.936-6.54 2.717C4.307 6.504 3.616 8.914 3.589 12c.027 3.086.718 5.496 2.057 7.164 1.43 1.783 3.631 2.698 6.54 2.717 2.623-.02 4.358-.631 5.8-2.045 1.647-1.613 1.618-3.593 1.09-4.798-.31-.71-.873-1.3-1.634-1.75-.192 1.352-.622 2.446-1.284 3.272-.886 1.102-2.14 1.704-3.73 1.79-1.202.065-2.361-.218-3.259-.801-1.063-.689-1.685-1.74-1.752-2.96-.065-1.166.408-2.2 1.332-2.911.876-.673 2.089-1.055 3.612-1.14 1.226-.068 2.36.04 3.389.319-.07-1.486-.698-2.236-2.442-2.346-.79-.05-1.819.094-2.634.594L8.24 7.39c1.174-.72 2.636-1.076 3.927-1.003 2.084.118 3.576.942 4.432 2.448.754 1.326.897 3.074.414 5.04.652.39 1.217.862 1.682 1.414 1.14 1.353 1.603 3.07 1.374 5.107-.276 2.448-1.524 4.322-3.61 5.42-1.732.91-3.778 1.282-5.862 1.262l-.411-.078zM14.4 14.052c-1.03-.116-2.053-.137-2.985-.056-1.118.06-1.94.333-2.476.717-.368.264-.533.582-.516.924.014.31.166.645.485.862.508.347 1.235.513 2.05.466 1.035-.06 1.836-.444 2.387-1.142.35-.443.602-1.039.752-1.771l.303 0z"/></svg>
    ),
  },
  {
    name: "Discord",
    href: "https://discord.gg/YJx4qr6RaE",
    icon: (
      <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor"><path d="M20.317 4.37a19.791 19.791 0 00-4.885-1.515.074.074 0 00-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 00-5.487 0 12.64 12.64 0 00-.617-1.25.077.077 0 00-.079-.037A19.736 19.736 0 003.677 4.37a.07.07 0 00-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 00.031.057 19.9 19.9 0 005.993 3.03.078.078 0 00.084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 00-.041-.106 13.107 13.107 0 01-1.872-.892.077.077 0 01-.008-.128 10.2 10.2 0 00.372-.292.074.074 0 01.077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 01.078.01c.12.098.246.198.373.292a.077.077 0 01-.006.127 12.299 12.299 0 01-1.873.892.077.077 0 00-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 00.084.028 19.839 19.839 0 006.002-3.03.077.077 0 00.032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 00-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/></svg>
    ),
  },
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
