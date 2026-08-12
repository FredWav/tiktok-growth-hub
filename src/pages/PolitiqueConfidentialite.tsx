import { Layout } from "@/components/layout/Layout";
import { Section } from "@/components/ui/section";
import { SEOHead } from "@/components/SEOHead";
import { seoFor } from "@/config/seo";

export default function PolitiqueConfidentialite() {
  return (
    <Layout>
      <SEOHead {...seoFor("/politique-de-confidentialite")} />
      <Section variant="default" size="lg">
        <div className="max-w-3xl mx-auto prose prose-neutral">
          <h1 className="font-display text-3xl md:text-4xl font-semibold mb-4">Politique de confidentialité</h1>

          <p className="text-muted-foreground mb-6">Dernière mise à jour : 12 août 2026</p>

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
            <li><strong>Paiement :</strong> Les transactions sont gérées par Stripe. Fred Wav n'a jamais accès à vos coordonnées bancaires complètes, mais conserve les références de commande et de session nécessaires au suivi contractuel.</li>
            <li><strong>Preuves contractuelles :</strong> Version et texte exact des CGV et consentements acceptés, date et heure d'acceptation, empreinte technique pseudonymisée et référence Stripe associée.</li>
            <li><strong>Rétractation :</strong> Nom, email, prestation et référence de commande, date de commande déclarée, message facultatif, texte et version de la déclaration, horodatage, état des accusés email, nombre de tentatives de livraison et empreinte technique pseudonymisée nécessaires à la preuve de dépôt, au suivi de l'accusé de réception et à la prévention des abus.</li>
            <li><strong>Attribution des campagnes :</strong> Paramètres UTM et identifiants de clic éventuellement présents dans l'URL, enregistrés uniquement après votre consentement à la mesure d'audience afin de relier une visite à sa campagne d'origine.</li>
            <li><strong>Données techniques :</strong> Adresse IP, type de navigateur et journaux techniques nécessaires à la sécurité et à la prévention des abus.</li>
          </ul>
          <p className="text-muted-foreground mb-4">
            Pour les nouveaux registres d'achat Analyse Express et Wav Academy, ainsi que pour le registre de rétractation, l'adresse IP et le navigateur ne sont pas conservés en clair : ils servent à calculer une empreinte pseudonymisée protégée par une clé serveur (HMAC-SHA-256), puis les valeurs brutes ne sont pas inscrites dans ces registres. Cette mesure réduit les données conservées tout en permettant de détecter des dépôts répétés et d'étayer l'intégrité de la preuve. Les anciennes preuves contractuelles enregistrées avant cette évolution et les journaux techniques des hébergeurs peuvent contenir temporairement l'adresse IP et le type de navigateur selon les durées indiquées ou imposées par leurs finalités de sécurité et de défense des droits.
          </p>

          <h2 className="font-display text-xl font-semibold mt-8 mb-3">3. Finalités du traitement</h2>
          <p className="text-muted-foreground mb-4">Le traitement de vos données répond aux objectifs suivants :</p>
          <ul className="list-disc pl-6 text-muted-foreground mb-4 space-y-1">
            <li><strong>Exécution du contrat :</strong> Gestion des commandes, accès aux espaces Discord Wav Academy, planification des sessions de conseil et suivi stratégique.</li>
            <li><strong>Support Client :</strong> Réponse aux demandes de contact et assistance technique pour le SaaS WavStats.</li>
            <li><strong>Communication :</strong> Envoi d'emails transactionnels (confirmation de commande, factures) et, sous réserve de votre consentement, de newsletters stratégiques.</li>
            <li><strong>Gestion des droits contractuels :</strong> Enregistrement, accusé de réception et traitement des demandes de rétractation, ainsi que conservation de la preuve des consentements donnés au moment de la commande.</li>
            <li><strong>Sécurité :</strong> Prévention de la fraude et protection contre les accès non autorisés.</li>
          </ul>

          <h2 className="font-display text-xl font-semibold mt-8 mb-3">4. Base légale</h2>
          <p className="text-muted-foreground mb-4">Le traitement repose sur :</p>
          <ul className="list-disc pl-6 text-muted-foreground mb-4 space-y-1">
            <li><strong>L'exécution du contrat</strong> (Art. 6.1.b du RGPD) pour tout ce qui concerne vos achats et accompagnements.</li>
            <li><strong>Votre consentement</strong> (Art. 6.1.a du RGPD) pour l'abonnement à la newsletter ou l'usage de cookies non techniques.</li>
            <li><strong>Le respect d'obligations légales</strong> (Art. 6.1.c du RGPD) pour les documents comptables, les confirmations contractuelles et la gestion du droit de rétractation.</li>
            <li><strong>L'intérêt légitime</strong> pour la sécurisation des outils, la prévention des abus et la défense des droits en cas de litige.</li>
          </ul>

          <h2 className="font-display text-xl font-semibold mt-8 mb-3">5. Destinataires et Transfert des données</h2>
          <p className="text-muted-foreground mb-4">
            Vos données sont strictement confidentielles. Elles ne sont jamais revendues. Elles sont transmises uniquement à nos prestataires de confiance pour l'exécution du service :
          </p>
          <ul className="list-disc pl-6 text-muted-foreground mb-4 space-y-1">
            <li><strong>Paiement :</strong> Stripe Inc. (San Francisco, USA).</li>
            <li><strong>Communication :</strong> WhatsApp (Meta Platforms Inc., USA), Discord Inc. (USA).</li>
            <li><strong>Newsletter :</strong> MailerLite (UAB MailerLite, Lituanie / USA).</li>
            <li><strong>Site et base de données :</strong> Lovable Labs Incorporated (États-Unis) pour l'hébergement et la publication du site, et Supabase Inc. (États-Unis) pour la base de données et les fonctions serveur connectées à Lovable.</li>
            <li><strong>Emails transactionnels :</strong> OVHcloud, via la messagerie noreply@fredwav.com.</li>
            <li><strong>Mesure d'audience :</strong> Google Analytics (Google LLC, États-Unis), activé uniquement avec votre consentement.</li>
            <li><strong>Analyse comportementale :</strong> PostHog Inc. (San Francisco, USA) — utilisé pour comprendre l'usage du site et améliorer l'expérience, activé uniquement avec votre consentement.</li>
            <li><strong>Vidéos :</strong> YouTube (Google LLC, États-Unis). Les aperçus sont chargés depuis les serveurs YouTube et le lecteur en mode confidentialité renforcée n'est chargé qu'après votre clic.</li>
          </ul>
          <p className="text-muted-foreground mb-4">
            Certains prestataires sont situés hors de l'Espace économique européen. Selon le prestataire et le service concerné, les transferts reposent sur une décision d'adéquation, notamment le cadre UE–États-Unis lorsqu'il est applicable, ou sur les clauses contractuelles types de la Commission européenne complétées si nécessaire par des garanties additionnelles.
          </p>

          <h2 className="font-display text-xl font-semibold mt-8 mb-3">6. Durée de conservation</h2>
          <ul className="list-disc pl-6 text-muted-foreground mb-4 space-y-1">
            <li><strong>Données clients :</strong> Conservées pendant toute la durée de la relation commerciale, puis 3 ans après la fin de la dernière prestation (sauf obligation légale de conservation plus longue).</li>
            <li><strong>Données comptables/facturation :</strong> Conservées 10 ans (obligation légale française, art. L123-22 du Code de commerce).</li>
            <li><strong>Preuves de consentement et demandes de rétractation :</strong> Conservées pendant la durée nécessaire au traitement de la demande et à la défense des droits, en principe jusqu'à 5 ans après la fin de la relation contractuelle, sauf contentieux ou obligation imposant une durée différente.</li>
            <li><strong>Données de prospection (newsletter, formulaires de contact) :</strong> Conservées pendant 3 ans à compter du dernier contact, sauf désinscription.</li>
            <li><strong>Attribution des campagnes :</strong> Conservée au maximum 90 jours dans votre navigateur, uniquement lorsque la mesure d'audience a été acceptée.</li>
            <li><strong>Données analytiques (PostHog) :</strong> Anonymisées ou supprimées après 24 mois.</li>
          </ul>

          <h2 className="font-display text-xl font-semibold mt-8 mb-3">7. Vos Droits</h2>
          <p className="text-muted-foreground mb-4">Vous disposez des droits suivants sur vos données :</p>
          <ul className="list-disc pl-6 text-muted-foreground mb-4 space-y-1">
            <li><strong>Accès et Rectification :</strong> Consulter ou modifier vos informations.</li>
            <li><strong>Effacement (Droit à l'oubli) :</strong> Demander la suppression de vos données (hors obligations légales de conservation).</li>
            <li><strong>Opposition et Limitation :</strong> Vous opposer à certains traitements (ex : marketing).</li>
            <li><strong>Portabilité :</strong> Recevoir vos données dans un format structuré.</li>
            <li><strong>Retrait du consentement :</strong> Retirer à tout moment un consentement donné, sans remettre en cause les traitements antérieurs à ce retrait.</li>
          </ul>
          <p className="text-muted-foreground mb-4">
            Pour exercer ces droits, contactez-nous à : <a href="mailto:contact@fredwav.com" className="text-primary hover:underline">contact@fredwav.com</a>. Une réponse vous sera adressée dans un délai d'un mois, prolongeable dans les conditions prévues par le RGPD.
          </p>

          <h2 className="font-display text-xl font-semibold mt-8 mb-3">8. Cookies et Traceurs</h2>
          <p className="text-muted-foreground mb-4">Le site fredwav.com utilise :</p>
          <ul className="list-disc pl-6 text-muted-foreground mb-4 space-y-1">
            <li><strong>Cookies techniques :</strong> Essentiels à la navigation et à la mémorisation de votre session.</li>
            <li><strong>Mesure d'audience :</strong> Google Analytics (identifiant G-E361JPZX7D), activé uniquement avec votre consentement explicite via le bandeau cookies. Aucune donnée n'est collectée à des fins publicitaires.</li>
            <li><strong>Analyse comportementale :</strong> PostHog, utilisé pour comprendre les parcours utilisateur et améliorer l'expérience du site. Activé uniquement avec votre consentement via le bandeau cookies. Les données collectées incluent les pages visitées, les clics et les interactions, sans finalité publicitaire.</li>
          </ul>
          <p className="text-muted-foreground mb-4">
            Vous pouvez modifier ou retirer votre choix à tout moment grâce au lien « Gérer mes cookies » présent dans le pied de page. Le retrait est aussi simple que l'acceptation et n'affecte pas les cookies strictement nécessaires.
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
