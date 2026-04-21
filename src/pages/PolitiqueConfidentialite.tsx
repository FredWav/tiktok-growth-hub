import { Layout } from "@/components/layout/Layout";
import { Section } from "@/components/ui/section";
import { SEOHead } from "@/components/SEOHead";

export default function PolitiqueConfidentialite() {
  return (
    <Layout>
      <SEOHead title="Politique de Confidentialité | Fred Wav" description="Politique de confidentialité du site fredwav.com - Collecte, utilisation et protection de vos données personnelles conformément au RGPD." path="/politique-de-confidentialite" keywords="politique de confidentialité, RGPD, données personnelles" />
      <Section variant="default" size="lg">
        <div className="max-w-3xl mx-auto prose prose-neutral">
          <h1 className="font-display text-3xl md:text-4xl font-semibold mb-4">Politique de confidentialité</h1>

          <p className="text-muted-foreground mb-6">Dernière mise à jour : 21 avril 2026</p>

          <p className="text-muted-foreground mb-6">
            La présente Politique de confidentialité détaille la manière dont Fred Wav (Frédéric Olalde) collecte, utilise et protège les données personnelles des utilisateurs, conformément au Règlement Général sur la Protection des Données (RGPD) et à la loi Informatique et Libertés.
          </p>

          <h2 className="font-display text-xl font-semibold mt-8 mb-3">1. Responsable du traitement</h2>
          <p className="text-muted-foreground mb-4">
            Le responsable du traitement des données est :<br /><br />
            Frédéric Olalde (Fred Wav), Entrepreneur Individuel.<br />
            SIRET : 921 749 727 00019<br />
            Adresse : 2 route de Malagué, 86270 Coussay-les-Bois, France.<br />
            Email : <a href="mailto:contact@fredwav.com" className="text-primary hover:underline">contact@fredwav.com</a>
          </p>

          <h2 className="font-display text-xl font-semibold mt-8 mb-3">2. Données collectées</h2>
          <p className="text-muted-foreground mb-4">
            Nous collectons uniquement les données strictement nécessaires à la fourniture de nos services :
          </p>
          <ul className="list-disc pl-6 text-muted-foreground mb-4 space-y-1">
            <li><strong>Identité :</strong> Nom, prénom.</li>
            <li><strong>Contact :</strong> Adresse email, numéro de téléphone (obligatoire pour le suivi WhatsApp Wav Premium).</li>
            <li><strong>Données professionnelles :</strong> Identifiant de compte TikTok, statistiques publiques et données de profil nécessaires au diagnostic stratégique.</li>
            <li><strong>Données de formulaire :</strong> Niveau actuel, points de blocage, objectifs, budget envisagé, source de découverte, durée de suivi et élément déclencheur — collectés via le formulaire de contact pour qualifier la demande.</li>
            <li><strong>Paiement :</strong> Les transactions sont gérées par Stripe. Fred Wav n'a jamais accès à vos coordonnées bancaires complètes.</li>
            <li><strong>Données techniques :</strong> Adresse IP, type de navigateur (via les logs du serveur pour la sécurité).</li>
          </ul>

          <h2 className="font-display text-xl font-semibold mt-8 mb-3">3. Finalités du traitement</h2>
          <p className="text-muted-foreground mb-4">Le traitement de vos données répond aux objectifs suivants :</p>
          <ul className="list-disc pl-6 text-muted-foreground mb-4 space-y-1">
            <li><strong>Exécution du contrat :</strong> Gestion des commandes, accès aux espaces Discord Wav Academy, planification des sessions de conseil et suivi stratégique.</li>
            <li><strong>Support Client :</strong> Réponse aux demandes de contact et assistance technique pour le SaaS Wav Social Scan.</li>
            <li><strong>Communication :</strong> Envoi d'emails transactionnels (confirmation de commande, factures) et, sous réserve de votre consentement, de newsletters stratégiques.</li>
            <li><strong>Sécurité :</strong> Prévention de la fraude et protection contre les accès non autorisés.</li>
          </ul>

          <h2 className="font-display text-xl font-semibold mt-8 mb-3">4. Base légale</h2>
          <p className="text-muted-foreground mb-4">Le traitement repose sur :</p>
          <ul className="list-disc pl-6 text-muted-foreground mb-4 space-y-1">
            <li><strong>L'exécution du contrat</strong> (Art. 6.1.b du RGPD) pour tout ce qui concerne vos achats et accompagnements.</li>
            <li><strong>Votre consentement</strong> (Art. 6.1.a du RGPD) pour l'abonnement à la newsletter ou l'usage de cookies non techniques.</li>
            <li><strong>L'intérêt légitime</strong> pour la sécurisation de nos outils et l'amélioration de l'expérience utilisateur.</li>
          </ul>

          <h2 className="font-display text-xl font-semibold mt-8 mb-3">5. Destinataires et Transfert des données</h2>
          <p className="text-muted-foreground mb-4">
            Vos données sont strictement confidentielles. Elles ne sont jamais revendues. Elles sont transmises uniquement à nos prestataires de confiance pour l'exécution du service :
          </p>
          <ul className="list-disc pl-6 text-muted-foreground mb-4 space-y-1">
            <li><strong>Paiement :</strong> Stripe Inc. (San Francisco, USA).</li>
            <li><strong>Communication :</strong> WhatsApp (Meta Platforms Inc., USA), Discord Inc. (USA).</li>
            <li><strong>Newsletter :</strong> MailerLite (UAB MailerLite, Lituanie / USA).</li>
            <li><strong>Hébergement et base de données :</strong> Lovable Labs Inc (Dover, DE, USA) et Supabase Inc. (San Francisco, USA).</li>
            <li><strong>Analyse comportementale :</strong> PostHog Inc. (San Francisco, USA) — utilisé pour comprendre l'usage du site et améliorer l'expérience, activé uniquement avec votre consentement.</li>
          </ul>
          <p className="text-muted-foreground mb-4">
            Certains prestataires sont situés hors UE (États-Unis). Les transferts sont encadrés par des clauses contractuelles types (SCC) ou le Data Privacy Framework UE-US, conformément aux exigences du RGPD.
          </p>

          <h2 className="font-display text-xl font-semibold mt-8 mb-3">6. Durée de conservation</h2>
          <ul className="list-disc pl-6 text-muted-foreground mb-4 space-y-1">
            <li><strong>Données clients :</strong> Conservées pendant toute la durée de la relation commerciale, puis 3 ans après la fin de la dernière prestation (sauf obligation légale de conservation plus longue).</li>
            <li><strong>Données comptables/facturation :</strong> Conservées 10 ans (obligation légale française, art. L123-22 du Code de commerce).</li>
            <li><strong>Données de prospection (newsletter, formulaires de contact) :</strong> Conservées pendant 3 ans à compter du dernier contact, sauf désinscription.</li>
            <li><strong>Données analytiques (PostHog) :</strong> Anonymisées ou supprimées après 24 mois.</li>
          </ul>

          <h2 className="font-display text-xl font-semibold mt-8 mb-3">7. Vos Droits</h2>
          <p className="text-muted-foreground mb-4">Vous disposez des droits suivants sur vos données :</p>
          <ul className="list-disc pl-6 text-muted-foreground mb-4 space-y-1">
            <li><strong>Accès et Rectification :</strong> Consulter ou modifier vos informations.</li>
            <li><strong>Effacement (Droit à l'oubli) :</strong> Demander la suppression de vos données (hors obligations légales de conservation).</li>
            <li><strong>Opposition et Limitation :</strong> Vous opposer à certains traitements (ex : marketing).</li>
            <li><strong>Portabilité :</strong> Recevoir vos données dans un format structuré.</li>
          </ul>
          <p className="text-muted-foreground mb-4">
            Pour exercer ces droits, contactez-nous à : <a href="mailto:contact@fredwav.com" className="text-primary hover:underline">contact@fredwav.com</a>. Une réponse vous sera adressée sous 30 jours maximum.
          </p>

          <h2 className="font-display text-xl font-semibold mt-8 mb-3">8. Cookies et Traceurs</h2>
          <p className="text-muted-foreground mb-4">Le site fredwav.com utilise :</p>
          <ul className="list-disc pl-6 text-muted-foreground mb-4 space-y-1">
            <li><strong>Cookies techniques :</strong> Essentiels à la navigation et à la mémorisation de votre session.</li>
            <li><strong>Mesure d'audience :</strong> Google Analytics (identifiant G-E361JPZX7D), activé uniquement avec votre consentement explicite via le bandeau cookies. Aucune donnée n'est collectée à des fins publicitaires.</li>
            <li><strong>Analyse comportementale :</strong> PostHog, utilisé pour comprendre les parcours utilisateur et améliorer l'expérience du site. Activé uniquement avec votre consentement via le bandeau cookies. Les données collectées incluent les pages visitées, les clics et les interactions, sans finalité publicitaire.</li>
          </ul>
          <p className="text-muted-foreground mb-4">
            Vous pouvez modifier votre choix à tout moment en supprimant vos cookies ou via les paramètres de votre navigateur.
          </p>

          <h2 className="font-display text-xl font-semibold mt-8 mb-3">9. Sécurité</h2>
          <p className="text-muted-foreground mb-4">
            Fred Wav met en œuvre les mesures techniques et organisationnelles nécessaires pour protéger vos données contre tout accès non autorisé, perte ou destruction, notamment par le recours au protocole HTTPS et à l'authentification sécurisée sur les plateformes de gestion.
          </p>

          <h2 className="font-display text-xl font-semibold mt-8 mb-3">10. Réclamation</h2>
          <p className="text-muted-foreground mb-4">
            Si vous estimez que vos droits ne sont pas respectés, vous pouvez introduire une réclamation auprès de la CNIL (Commission Nationale de l'Informatique et des Libertés) sur le site <a href="https://www.cnil.fr" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">www.cnil.fr</a>.
          </p>
        </div>
      </Section>
    </Layout>
  );
}
