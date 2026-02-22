import { Link } from "react-router-dom";
import { Instagram, Youtube, Facebook } from "lucide-react";

export function Footer() {
  return (
    <footer className="bg-noir text-muted-foreground">
      <div className="container mx-auto px-4 py-12 md:py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="md:col-span-2">
            <Link to="/" className="inline-block mb-4">
              <span className="font-display text-2xl font-semibold tracking-tight text-cream">
                Fred<span className="text-primary">Wav</span>
              </span>
            </Link>
            <p className="text-sm text-muted-foreground max-w-md">
              Expert stratégie TikTok. 
              Des résultats, pas des promesses.
            </p>
          </div>

          {/* Navigation */}
          <div>
            <h4 className="font-semibold text-cream mb-4">Navigation</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/" className="hover:text-primary transition-colors">
                  Accueil
                </Link>
              </li>
              <li>
                <Link to="/offres" className="hover:text-primary transition-colors">
                  Offres
                </Link>
              </li>
              <li>
                <Link to="/one-shot" className="hover:text-primary transition-colors">
                  One Shot
                </Link>
              </li>
              <li>
                <Link to="/a-propos" className="hover:text-primary transition-colors">
                  À propos
                </Link>
              </li>
            </ul>
          </div>

          {/* Réseaux sociaux */}
          <div>
            <h4 className="font-semibold text-cream mb-4">Réseaux</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <a href="https://www.tiktok.com/@fredwav" target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors flex items-center gap-2">
                  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor"><path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.27 6.27 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V8.75a8.18 8.18 0 004.77 1.52V6.84a4.84 4.84 0 01-1-.15z"/></svg>
                  TikTok
                </a>
              </li>
              <li>
                <a href="https://www.instagram.com/levraifredwav/" target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors flex items-center gap-2">
                  <Instagram className="h-4 w-4" />
                  Instagram
                </a>
              </li>
              <li>
                <a href="https://www.youtube.com/@Fredwavconseils" target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors flex items-center gap-2">
                  <Youtube className="h-4 w-4" />
                  YouTube
                </a>
              </li>
              <li>
                <a href="https://www.facebook.com/frederic.olalde" target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors flex items-center gap-2">
                  <Facebook className="h-4 w-4" />
                  Facebook
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-border/20 mt-12 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} Fred Wav. Tous droits réservés.
          </p>
          <div className="flex gap-6 text-xs">
            <Link to="/mentions-legales" className="hover:text-primary transition-colors">
              Mentions légales
            </Link>
            <Link to="/cgv" className="hover:text-primary transition-colors">
              CGV
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
