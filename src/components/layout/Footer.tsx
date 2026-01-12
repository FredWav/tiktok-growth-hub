import { Link } from "react-router-dom";

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

          {/* Contact */}
          <div>
            <h4 className="font-semibold text-cream mb-4">Contact</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/contact" className="hover:text-primary transition-colors">
                  Me contacter
                </Link>
              </li>
              <li>
                <Link to="/preuves" className="hover:text-primary transition-colors">
                  Preuves & Résultats
                </Link>
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
