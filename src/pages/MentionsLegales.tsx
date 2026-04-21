import { Layout } from "@/components/layout/Layout";
import { Section } from "@/components/ui/section";
import { SEOHead } from "@/components/SEOHead";

export default function MentionsLegales() {
  return (
    <Layout>
      <SEOHead title="Mentions Légales | Fred Wav" description="Mentions légales du site fredwav.com - Éditeur, hébergeur, propriété intellectuelle et données personnelles." path="/mentions-legales" keywords="mentions légales, éditeur, hébergeur" />
      <Section variant="default" size="lg">
        <div className="max-w-3xl mx-auto prose prose-neutral">
          <h1 className="font-display text-3xl md:text-4xl font-semibold mb-8">Mentions légales</h1>

          <h2 className="font-display text-xl font-semibold mt-8 mb-3">Éditeur du site</h2>
          <p className="text-muted-foreground mb-4">
            Fred Wav<br />
            Statut : Entrepreneur individuel (EI)<br />
            SIRET : 92174972700019<br />
            Adresse : 2 route de Malagué, 86270 Coussay-les-Bois, France<br />
            Email : contact@fredwav.com<br /><br />
            TVA : non applicable (franchise en base de TVA)<br />
            Directeur de la publication : Fred Wav
          </p>

          <h2 className="font-display text-xl font-semibold mt-8 mb-3">Hébergement</h2>
          <p className="text-muted-foreground mb-4">
            Ce site est hébergé par Lovable.<br />
            Entité : Lovable Labs Inc<br />
            Adresse : 1111B South Governors Avenue, Dover, DE 19904, USA<br />
            Téléphone : +1 469 317 3436<br />
            Contact : feedback@lovable.dev<br /><br />
            Adresse UE (information complémentaire) : Lovable Labs Sweden AB, Tunnelgatan 5, 11137 Stockholm, Suède
          </p>

          <h2 className="font-display text-xl font-semibold mt-8 mb-3">Propriété intellectuelle</h2>
          <p className="text-muted-foreground mb-4">
            L'ensemble du contenu de ce site (textes, images, vidéos, logos) est protégé par le droit d'auteur. Toute reproduction, même partielle, est interdite sans autorisation préalable.
          </p>

          <h2 className="font-display text-xl font-semibold mt-8 mb-3">Données personnelles</h2>
          <p className="text-muted-foreground mb-4">
            Les données collectées via ce site (email, nom, informations de paiement) sont utilisées exclusivement dans le cadre de la relation commerciale. Elles ne sont jamais revendues à des tiers. Conformément au RGPD, vous disposez d'un droit d'accès, de rectification et de suppression de vos données. Pour exercer ce droit, contactez : <a href="mailto:contact@fredwav.com" className="text-primary hover:underline">contact@fredwav.com</a>.
          </p>
          <p className="text-muted-foreground mb-4">
            Pour plus de détails, consultez notre <a href="/politique-de-confidentialite" className="text-primary hover:underline">Politique de confidentialité</a>.
          </p>

          <h2 className="font-display text-xl font-semibold mt-8 mb-3">Cookies</h2>
          <p className="text-muted-foreground mb-4">
            Ce site utilise des cookies techniques nécessaires à son fonctionnement, ainsi que des cookies d'analyse (Google Analytics, PostHog) activés uniquement avec votre consentement via le bandeau cookies. Aucun cookie publicitaire n'est utilisé. Pour en savoir plus, consultez notre <a href="/politique-de-confidentialite" className="text-primary hover:underline">Politique de confidentialité</a>.
          </p>

          <p className="text-sm text-muted-foreground mt-12">Dernière mise à jour : avril 2026</p>
        </div>
      </Section>
    </Layout>
  );
}
