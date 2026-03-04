import { Link, useLocation } from "react-router-dom";
import { useEffect } from "react";
import { Layout } from "@/components/layout/Layout";
import { SEOHead } from "@/components/SEOHead";
import { Button } from "@/components/ui/button";
import { ArrowRight, Home, FileText, Zap } from "lucide-react";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <Layout>
      <SEOHead
        title="Page introuvable | Fred Wav"
        description="Cette page n'existe pas ou a été déplacée. Retrouve les offres et ressources de Fred Wav."
        path={location.pathname}
        noindex
      />
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="text-center max-w-lg mx-auto px-4">
          <h1 className="mb-4 text-6xl font-display font-bold text-primary">404</h1>
          <p className="mb-2 text-2xl font-semibold text-foreground">Page introuvable</p>
          <p className="mb-8 text-muted-foreground">
            Cette page n'existe pas ou a été déplacée. Voici quelques liens utiles pour te rediriger.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center mb-8">
            <Button asChild>
              <Link to="/">
                <Home className="h-4 w-4 mr-2" />
                Retour à l'accueil
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link to="/one-shot">
                <Zap className="h-4 w-4 mr-2" />
                One Shot (179€)
              </Link>
            </Button>
          </div>
          <nav aria-label="Liens utiles" className="text-sm text-muted-foreground space-y-2">
            <p className="font-medium text-foreground mb-3">Pages populaires :</p>
            <div className="flex flex-wrap justify-center gap-x-6 gap-y-2">
              <Link to="/offres" className="hover:text-primary transition-colors">Offres</Link>
              <Link to="/45-jours" className="hover:text-primary transition-colors">Wav Premium</Link>
              <Link to="/analyse-express" className="hover:text-primary transition-colors">Analyse Express</Link>
              <Link to="/preuves" className="hover:text-primary transition-colors">Témoignages</Link>
              <Link to="/a-propos" className="hover:text-primary transition-colors">À propos</Link>
              <Link to="/contact" className="hover:text-primary transition-colors">Contact</Link>
            </div>
          </nav>
        </div>
      </div>
    </Layout>
  );
};

export default NotFound;
