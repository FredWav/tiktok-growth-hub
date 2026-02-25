import { Layout } from "@/components/layout/Layout";
import { Section } from "@/components/ui/section";
import { SEOHead } from "@/components/SEOHead";

export default function PolitiqueConfidentialite() {
  return (
    <Layout>
      <SEOHead title="Politique de Confidentialité | Fred Wav" description="Politique de confidentialité du site fredwav.com - Collecte, utilisation et protection de vos données personnelles." path="/politique-de-confidentialite" keywords="politique de confidentialité, RGPD, données personnelles" />
      <Section variant="default" size="lg">
        <div className="max-w-3xl mx-auto prose prose-neutral">
          <h1 className="font-display text-3xl md:text-4xl font-semibold mb-8">Politique de confidentialité</h1>

          <p className="text-muted-foreground mb-6">Dernière mise à jour : février 2026</p>

          <h2 className="font-display text-xl font-semibold mt-8 mb-3">1. Responsable du traitement</h2>
          <p className="text-muted-foreground mb-4">
            Fred Wav (Frédéric Olalde)<br />
            Entrepreneur individuel — SIRET : 92174972700019<br />
            2 route de Malagué, 86270 Coussay-les-Bois, France<br />
            Email : contact@fredwav.com
          </p>

          <h2 className="font-display text-xl font-semibold mt-8 mb-3">2. Données collectées</h2>
          <p className="text-muted-foreground mb-4">
            Dans le cadre de l'utilisation du site fredwav.com et de nos services, nous pouvons collecter les données suivantes :
          </p>
          <ul className="list-disc pl-6 text-muted-foreground mb-4 space-y-1">
            <li>Nom et prénom</li>
            <li>Adresse email</li>
            <li>Numéro de téléphone (si fourni)</li>
            <li>Informations de paiement (traitées par Stripe, non stockées sur nos serveurs)</li>
            <li>Nom d'utilisateur TikTok et données de profil public</li>
            <li>Données de navigation (cookies techniques)</li>
          </ul>

          <h2 className="font-display text-xl font-semibold mt-8 mb-3">3. Finalités du traitement</h2>
          <p className="text-muted-foreground mb-4">Vos données sont collectées pour :</p>
          <ul className="list-disc pl-6 text-muted-foreground mb-4 space-y-1">
            <li>La gestion de la relation commerciale et le suivi des prestations</li>
            <li>Le traitement des paiements</li>
            <li>L'envoi de communications liées à votre accompagnement</li>
            <li>L'amélioration de nos services</li>
          </ul>

          <h2 className="font-display text-xl font-semibold mt-8 mb-3">4. Base légale</h2>
          <p className="text-muted-foreground mb-4">
            Le traitement de vos données repose sur l'exécution du contrat (prestation de service) et votre consentement lorsque celui-ci est requis.
          </p>

          <h2 className="font-display text-xl font-semibold mt-8 mb-3">5. Destinataires des données</h2>
          <p className="text-muted-foreground mb-4">
            Vos données ne sont jamais revendues à des tiers. Elles peuvent être partagées avec nos sous-traitants techniques (hébergement, paiement) dans le strict cadre de la prestation.
          </p>

          <h2 className="font-display text-xl font-semibold mt-8 mb-3">6. Durée de conservation</h2>
          <p className="text-muted-foreground mb-4">
            Vos données sont conservées pendant la durée de la relation commerciale, puis archivées conformément aux obligations légales (notamment fiscales) pendant une durée maximale de 5 ans.
          </p>

          <h2 className="font-display text-xl font-semibold mt-8 mb-3">7. Vos droits</h2>
          <p className="text-muted-foreground mb-4">
            Conformément au RGPD, vous disposez des droits suivants :
          </p>
          <ul className="list-disc pl-6 text-muted-foreground mb-4 space-y-1">
            <li>Droit d'accès à vos données</li>
            <li>Droit de rectification</li>
            <li>Droit à l'effacement</li>
            <li>Droit à la limitation du traitement</li>
            <li>Droit à la portabilité</li>
            <li>Droit d'opposition</li>
          </ul>
          <p className="text-muted-foreground mb-4">
            Pour exercer ces droits, contactez-nous à : <a href="mailto:contact@fredwav.com" className="text-primary hover:underline">contact@fredwav.com</a>
          </p>

          <h2 className="font-display text-xl font-semibold mt-8 mb-3">8. Cookies</h2>
          <p className="text-muted-foreground mb-4">
            Ce site utilise uniquement des cookies techniques nécessaires à son fonctionnement. Aucun cookie publicitaire ou de traçage n'est utilisé.
          </p>

          <h2 className="font-display text-xl font-semibold mt-8 mb-3">9. Réclamation</h2>
          <p className="text-muted-foreground mb-4">
            En cas de différend, vous pouvez adresser une réclamation auprès de la CNIL : <a href="https://www.cnil.fr" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">www.cnil.fr</a>
          </p>
        </div>
      </Section>
    </Layout>
  );
}
