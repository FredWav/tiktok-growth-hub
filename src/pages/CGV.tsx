import { Layout } from "@/components/layout/Layout";
import { Section } from "@/components/ui/section";

export default function CGV() {
  return (
    <Layout>
      <Section variant="default" size="lg">
        <div className="max-w-3xl mx-auto prose prose-neutral">
          <h1 className="font-display text-3xl md:text-4xl font-semibold mb-2">Conditions Générales de Vente (CGV) — Fred Wav</h1>
          <p className="text-sm text-muted-foreground mb-10">Dernière mise à jour : février 2026</p>

          {/* IDENTIFICATION */}
          <h2 className="font-display text-xl font-semibold mt-10 mb-3">Identification du vendeur</h2>
          <ul className="text-muted-foreground mb-4 list-none pl-0 space-y-1">
            <li><strong>Éditeur et vendeur :</strong> Fred Wav</li>
            <li><strong>Statut :</strong> Entrepreneur individuel (EI)</li>
            <li><strong>SIRET :</strong> 92174972700019</li>
            <li><strong>Adresse :</strong> 2 route de Malagué, 86270 Coussay-les-Bois, France</li>
            <li><strong>Email :</strong> contact@fredwav.com</li>
            <li><strong>TVA :</strong> non applicable (franchise en base)</li>
          </ul>

          {/* ARTICLE 2 */}
          <h2 className="font-display text-xl font-semibold mt-10 mb-3">Article 2 — Objet</h2>
          <p className="text-muted-foreground mb-4">
            Les présentes CGV encadrent la vente, à distance (internet), de prestations de conseil et d'accompagnement en stratégie TikTok proposées par Fred Wav, ainsi que l'accès à un abonnement VIP.
          </p>

          {/* ARTICLE 3 */}
          <h2 className="font-display text-xl font-semibold mt-10 mb-3">Article 3 — Champ d'application</h2>
          <h3 className="font-display text-lg font-medium mt-4 mb-2">3.1 Clients consommateurs (B2C)</h3>
          <p className="text-muted-foreground mb-4">
            Ces CGV s'appliquent aux clients consommateurs, sauf conditions particulières indiquées au moment de la commande.
          </p>
          <h3 className="font-display text-lg font-medium mt-4 mb-2">3.2 Clients professionnels (B2B)</h3>
          <p className="text-muted-foreground mb-4">
            Pour les clients professionnels, les dispositions du Code de la consommation relatives notamment au droit de rétractation et à la médiation de la consommation ne s'appliquent pas. Les autres clauses restent applicables.
          </p>

          {/* ARTICLE 4 */}
          <h2 className="font-display text-xl font-semibold mt-10 mb-3">Article 4 — Définitions</h2>
          <ul className="text-muted-foreground mb-4 space-y-1">
            <li><strong>Client :</strong> personne qui achète une prestation ou un abonnement.</li>
            <li><strong>Prestataire :</strong> Fred Wav.</li>
            <li><strong>Prestations :</strong> One Shot, Wav Premium (45 jours), VIP.</li>
            <li><strong>Contenus / Ressources :</strong> cours, replays, checklists, documents, méthodes, templates, guides, retours écrits, analyses et livrables.</li>
            <li><strong>Abonnement :</strong> VIP mensuel à reconduction automatique.</li>
            <li><strong>Plateformes tierces :</strong> TikTok, Discord, WhatsApp, Stripe, PayPal, Klarna, outils vidéo, etc.</li>
          </ul>

          {/* ARTICLE 5 */}
          <h2 className="font-display text-xl font-semibold mt-10 mb-3">Article 5 — Description des offres</h2>

          <h3 className="font-display text-lg font-medium mt-4 mb-2">5.1 One Shot — 179 € TTC</h3>
          <p className="text-muted-foreground mb-4">
            Prestation de diagnostic et session de conseils en visioconférence. Finalité : clarifier la stratégie, identifier les blocages, proposer des recommandations et un plan d'action applicable. La prestation est fournie avec diligence et professionnalisme. Le One Shot est une prestation de service, sans garantie de résultat (voir article 14).
          </p>

          <h3 className="font-display text-lg font-medium mt-4 mb-2">5.2 Wav Premium — 45 jours (sur candidature)</h3>
          <p className="text-muted-foreground mb-2">
            Accompagnement sur 45 jours calendaires, réservé aux clients acceptés après candidature. Cadre minimum inclus :
          </p>
          <ul className="text-muted-foreground mb-4 space-y-1">
            <li>4 rendez-vous minimum en visioconférence</li>
            <li>Suivi WhatsApp 5j/7</li>
            <li>Délai de réponse sous 24h du lundi au vendredi (hors jours fériés et circonstances exceptionnelles)</li>
            <li>Retours sur statistiques, conseils précis et ultra personnalisés</li>
            <li>Fourniture de ressources personnalisées au cas par cas (cours, checklists, outils, documents)</li>
          </ul>
          <p className="text-muted-foreground mb-4">
            Le détail exact du cadre (calendrier, livrables, canaux, organisation) est celui affiché sur la page de vente au moment de la commande et/ou confirmé par email.
          </p>

          <h3 className="font-display text-lg font-medium mt-4 mb-2">5.3 VIP — abonnement à partir de 99 € TTC / mois</h3>
          <p className="text-muted-foreground mb-2">Pendant la durée de l'abonnement, le VIP inclut :</p>
          <ul className="text-muted-foreground mb-4 space-y-1">
            <li>Accès à la catégorie VIP sur Discord</li>
            <li>Accès à toutes les ressources de l'accompagnement (cours, replays, checklists)</li>
            <li>Live 1 fois par semaine (sauf circonstance particulière)</li>
            <li>Retours 5j/7 sur Discord pour questions et retours de statistiques</li>
          </ul>
          <p className="text-muted-foreground mb-4">Il n'y a pas de rendez-vous individuel inclus dans le VIP.</p>

          {/* ARTICLE 6 */}
          <h2 className="font-display text-xl font-semibold mt-10 mb-3">Article 6 — Conditions d'accès et prérequis</h2>
          <p className="text-muted-foreground mb-2">Le Client doit disposer :</p>
          <ul className="text-muted-foreground mb-4 space-y-1">
            <li>D'un accès internet stable</li>
            <li>D'un matériel permettant l'usage de la visioconférence</li>
            <li>D'un compte Discord (VIP) et d'un compte WhatsApp (Wav Premium)</li>
          </ul>
          <p className="text-muted-foreground mb-4">Le Prestataire n'est pas responsable des dysfonctionnements imputables au Client ou aux plateformes tierces.</p>

          {/* ARTICLE 7 */}
          <h2 className="font-display text-xl font-semibold mt-10 mb-3">Article 7 — Commande</h2>
          <h3 className="font-display text-lg font-medium mt-4 mb-2">7.1 Process</h3>
          <p className="text-muted-foreground mb-4">La commande est effectuée en ligne. Le Client sélectionne l'offre, prend connaissance du prix et des CGV, puis valide et procède au paiement.</p>
          <h3 className="font-display text-lg font-medium mt-4 mb-2">7.2 Confirmation</h3>
          <p className="text-muted-foreground mb-4">Une confirmation de commande est envoyée par email (support durable). Le Client doit fournir une adresse email valide.</p>
          <h3 className="font-display text-lg font-medium mt-4 mb-2">7.3 Candidature Wav Premium</h3>
          <p className="text-muted-foreground mb-4">Le Prestataire se réserve le droit d'accepter ou refuser une candidature. En cas de refus, aucun paiement n'est collecté (ou, si un paiement a été effectué par erreur, il est remboursé sous un délai raisonnable, hors prestation démarrée).</p>

          {/* ARTICLE 8 */}
          <h2 className="font-display text-xl font-semibold mt-10 mb-3">Article 8 — Prix</h2>
          <p className="text-muted-foreground mb-2">Les prix sont en euros, TTC.</p>
          <ul className="text-muted-foreground mb-4 space-y-1">
            <li><strong>One Shot :</strong> 179 € TTC</li>
            <li><strong>VIP :</strong> à partir de 99 € TTC / mois</li>
            <li><strong>Wav Premium :</strong> prix communiqué et accepté avant paiement</li>
          </ul>
          <p className="text-muted-foreground mb-4">Le prix applicable est celui affiché au moment de la commande. Les prix peuvent évoluer sans effet rétroactif sur une commande déjà payée.</p>

          {/* ARTICLE 9 */}
          <h2 className="font-display text-xl font-semibold mt-10 mb-3">Article 9 — Paiement</h2>
          <h3 className="font-display text-lg font-medium mt-4 mb-2">9.1 Modalités</h3>
          <p className="text-muted-foreground mb-4">Paiement en ligne via Stripe. Moyens possibles selon disponibilité et éligibilité : carte bancaire, Klarna (3x), PayPal (4x).</p>
          <h3 className="font-display text-lg font-medium mt-4 mb-2">9.2 Exigibilité</h3>
          <p className="text-muted-foreground mb-4">Le paiement est exigible à la commande. En paiement fractionné, le Client reste responsable de son engagement envers Klarna ou PayPal.</p>
          <h3 className="font-display text-lg font-medium mt-4 mb-2">9.3 Incident de paiement et rétrofacturation (chargeback)</h3>
          <p className="text-muted-foreground mb-2">En cas d'impayé, rejet de paiement, fraude suspectée ou rétrofacturation :</p>
          <ul className="text-muted-foreground mb-4 space-y-1">
            <li>L'accès au VIP peut être suspendu immédiatement</li>
            <li>L'exécution des prestations peut être suspendue jusqu'à régularisation</li>
          </ul>
          <p className="text-muted-foreground mb-4">Le Prestataire se réserve le droit de produire tout élément de preuve nécessaire (emails, horodatage, consentements, historiques de livraison de service, présence en session, accès aux ressources, etc.).</p>

          {/* ARTICLE 10 */}
          <h2 className="font-display text-xl font-semibold mt-10 mb-3">Article 10 — Exécution des prestations</h2>
          <h3 className="font-display text-lg font-medium mt-4 mb-2">10.1 Visioconférence (One Shot et Wav Premium)</h3>
          <p className="text-muted-foreground mb-4">Les sessions ont lieu en visioconférence. Les informations pratiques sont communiquées au Client.</p>
          <h3 className="font-display text-lg font-medium mt-4 mb-2">10.2 Planification</h3>
          <ul className="text-muted-foreground mb-4 space-y-1">
            <li><strong>One Shot :</strong> date convenue après paiement</li>
            <li><strong>Wav Premium :</strong> planification des rendez-vous au lancement, selon disponibilités et organisation définies</li>
            <li><strong>VIP :</strong> accès activé pendant la durée de l'abonnement</li>
          </ul>
          <h3 className="font-display text-lg font-medium mt-4 mb-2">10.3 Délai de réponse (Wav Premium)</h3>
          <p className="text-muted-foreground mb-4">Le délai « sous 24h du lundi au vendredi » s'entend comme un délai de traitement pendant ces jours, hors circonstances exceptionnelles (maladie, incident technique majeur, déplacement, force majeure). Le VIP implique des retours 5j/7 sur Discord, sans engagement d'instantanéité.</p>

          {/* ARTICLE 11 */}
          <h2 className="font-display text-xl font-semibold mt-10 mb-3">Article 11 — Annulation, report, retard, absence (no-show)</h2>
          <h3 className="font-display text-lg font-medium mt-4 mb-2">11.1 One Shot</h3>
          <ul className="text-muted-foreground mb-4 space-y-1">
            <li><strong>Report par le Client :</strong> possible jusqu'à 48h avant la session.</li>
            <li><strong>Report tardif (moins de 48h) :</strong> la session est due.</li>
            <li><strong>No-show :</strong> la session est considérée comme réalisée et non remboursable.</li>
            <li><strong>Retard :</strong> la session n'est pas prolongée et se termine à l'heure initialement prévue.</li>
            <li><strong>Report par le Prestataire :</strong> une nouvelle date est proposée dans les meilleurs délais.</li>
          </ul>
          <h3 className="font-display text-lg font-medium mt-4 mb-2">11.2 Wav Premium (45 jours)</h3>
          <ul className="text-muted-foreground mb-4 space-y-1">
            <li>Tout rendez-vous reporté par le Client moins de 48h avant peut être considéré comme réalisé, sauf accord exceptionnel écrit du Prestataire.</li>
            <li>Les retards ne prolongent pas les sessions.</li>
            <li>La durée est de 45 jours calendaires. Les reports ne prolongent pas automatiquement l'accompagnement, sauf accord écrit.</li>
          </ul>
          <h3 className="font-display text-lg font-medium mt-4 mb-2">11.3 VIP</h3>
          <ul className="text-muted-foreground mb-4 space-y-1">
            <li>L'absence de participation du Client ne donne droit à aucun remboursement.</li>
            <li>Les lives peuvent être décalés ou annulés en cas de circonstance particulière. Lorsque possible, un report ou un replay est proposé.</li>
          </ul>

          {/* ARTICLE 12 */}
          <h2 className="font-display text-xl font-semibold mt-10 mb-3">Article 12 — Droit de rétractation (clients consommateurs)</h2>
          <h3 className="font-display text-lg font-medium mt-4 mb-2">12.1 Principe</h3>
          <p className="text-muted-foreground mb-4">Le Client consommateur dispose en principe d'un délai légal de rétractation de 14 jours pour les contrats conclus à distance, sauf exceptions.</p>
          <h3 className="font-display text-lg font-medium mt-4 mb-2">12.2 Démarrage avant la fin des 14 jours (demande expresse obligatoire)</h3>
          <p className="text-muted-foreground mb-4">Si le Client souhaite que la prestation commence avant la fin du délai de 14 jours, il doit en faire la demande expresse. Cette demande est matérialisée par une case à cocher obligatoire avant paiement (voir Annexe 1). Sans demande expresse, le Prestataire peut refuser de démarrer l'exécution avant la fin du délai.</p>
          <h3 className="font-display text-lg font-medium mt-4 mb-2">12.3 Perte du droit de rétractation si prestation pleinement exécutée</h3>
          <p className="text-muted-foreground mb-2">Lorsque la prestation de service est pleinement exécutée avant la fin du délai de rétractation, le Client ne peut plus exercer son droit de rétractation si :</p>
          <ul className="text-muted-foreground mb-4 space-y-1">
            <li>L'exécution a commencé avec l'accord préalable et exprès du Client</li>
            <li>Et le Client a reconnu perdre son droit de rétractation une fois la prestation pleinement exécutée</li>
          </ul>
          <p className="text-muted-foreground mb-4">Cette reconnaissance est matérialisée par une case à cocher obligatoire avant paiement (voir Annexe 1).</p>

          <h3 className="font-display text-lg font-medium mt-4 mb-2">12.4 Application pratique selon les offres</h3>
          <p className="text-muted-foreground mb-2"><strong>a) One Shot</strong></p>
          <p className="text-muted-foreground mb-4">Si le rendez-vous One Shot a lieu avant la fin des 14 jours et qu'il est réalisé, le service est pleinement exécuté. Si les consentements de l'Annexe 1 ont été validés, le Client reconnaît qu'il ne pourra plus exercer son droit de rétractation pour cette prestation.</p>
          <p className="text-muted-foreground mb-2"><strong>b) Wav Premium (45 jours)</strong></p>
          <p className="text-muted-foreground mb-4">Si l'accompagnement démarre avant la fin des 14 jours, le Client confirme le démarrage anticipé via les cases de l'Annexe 1. Si le Client se rétracte alors que l'exécution a commencé à sa demande, le Prestataire peut facturer un montant proportionnel au service déjà fourni, dans les limites autorisées par la loi.</p>
          <p className="text-muted-foreground mb-2"><strong>c) VIP</strong></p>
          <p className="text-muted-foreground mb-4">Si l'accès au VIP (Discord + ressources) est fourni immédiatement à la demande du Client, celui-ci valide le démarrage anticipé (Annexe 1). En cas de rétractation, le traitement dépendra de ce qui a été fourni et du degré d'exécution, dans les limites autorisées par la loi.</p>

          <h3 className="font-display text-lg font-medium mt-4 mb-2">12.5 Exercice de la rétractation</h3>
          <p className="text-muted-foreground mb-4">Pour exercer la rétractation (si applicable), le Client adresse une demande explicite à <a href="mailto:contact@fredwav.com" className="text-primary underline">contact@fredwav.com</a> en indiquant : nom, prénom, offre, date de commande et volonté claire de se rétracter.</p>

          {/* ARTICLE 13 */}
          <h2 className="font-display text-xl font-semibold mt-10 mb-3">Article 13 — Obligation de moyens — Absence de garantie de résultats</h2>
          <p className="text-muted-foreground mb-2">Le Prestataire est tenu à une obligation de moyens : il s'engage à fournir analyse, recommandations, méthodes, retours et accompagnement avec diligence et professionnalisme. Le Client reconnaît que les résultats dépendent notamment :</p>
          <ul className="text-muted-foreground mb-4 space-y-1">
            <li>De son exécution, régularité et discipline</li>
            <li>De son contenu, niche, positionnement</li>
            <li>De facteurs externes : évolutions de TikTok (règles, algorithme, modération), concurrence, tendances</li>
          </ul>
          <p className="text-muted-foreground mb-4">Aucune garantie de résultats spécifiques (vues, abonnés, revenus, ventes) n'est donnée.</p>

          {/* ARTICLE 14 */}
          <h2 className="font-display text-xl font-semibold mt-10 mb-3">Article 14 — Responsabilité — Limitation</h2>
          <p className="text-muted-foreground mb-2">Le Prestataire ne saurait être tenu responsable :</p>
          <ul className="text-muted-foreground mb-4 space-y-1">
            <li>Des décisions du Client prises sur la base des conseils</li>
            <li>Des pertes indirectes (perte de chance, perte de chiffre d'affaires, etc.)</li>
            <li>Des actions ou sanctions de TikTok ou de toute plateforme tierce</li>
          </ul>
          <p className="text-muted-foreground mb-4">En tout état de cause, si la responsabilité du Prestataire devait être retenue, elle est limitée au montant effectivement payé par le Client au titre de la prestation concernée.</p>

          {/* ARTICLE 15 */}
          <h2 className="font-display text-xl font-semibold mt-10 mb-3">Article 15 — Propriété intellectuelle</h2>
          <p className="text-muted-foreground mb-4">Tous les contenus, méthodes, supports, replays, cours, checklists, documents et ressources restent la propriété du Prestataire (ou de leurs auteurs) et sont protégés. Toute reproduction, diffusion, revente, partage ou mise à disposition à des tiers, même partielle, est interdite sans autorisation écrite préalable. L'accès au VIP est personnel. Le partage d'accès ou de contenus réservés peut entraîner suspension ou résiliation sans remboursement.</p>

          {/* ARTICLE 16 */}
          <h2 className="font-display text-xl font-semibold mt-10 mb-3">Article 16 — Confidentialité</h2>
          <p className="text-muted-foreground mb-4">Le Prestataire s'engage à garder confidentielles les informations communiquées par le Client dans le cadre des prestations, sauf obligation légale. Le Client s'engage à ne pas diffuser les contenus internes (ressources, replays, supports, méthodes, organisation) sans autorisation.</p>

          {/* ARTICLE 17 */}
          <h2 className="font-display text-xl font-semibold mt-10 mb-3">Article 17 — Règles de communauté (VIP)</h2>
          <p className="text-muted-foreground mb-4">Le Client s'engage à respecter les règles de bonne conduite sur Discord. Sont interdits : harcèlement, menaces, propos discriminatoires, spam, publicité non autorisée, divulgation d'informations personnelles d'autrui, partage de contenus réservés. Le Prestataire peut suspendre ou exclure un Client en cas de manquement grave, sans remboursement.</p>

          {/* ARTICLE 18 */}
          <h2 className="font-display text-xl font-semibold mt-10 mb-3">Article 18 — Données personnelles</h2>
          <p className="text-muted-foreground mb-2">Les données collectées (email, nom, éléments de commande, éléments de paiement gérés par les prestataires de paiement) sont utilisées pour :</p>
          <ul className="text-muted-foreground mb-4 space-y-1">
            <li>Gestion des commandes et paiements</li>
            <li>Exécution des prestations</li>
            <li>Relation client</li>
          </ul>
          <p className="text-muted-foreground mb-4">Les informations détaillées figurent dans la Politique de confidentialité. Le Client peut exercer ses droits en écrivant à <a href="mailto:contact@fredwav.com" className="text-primary underline">contact@fredwav.com</a>.</p>

          {/* ARTICLE 19 */}
          <h2 className="font-display text-xl font-semibold mt-10 mb-3">Article 19 — Réclamations — Service client</h2>
          <p className="text-muted-foreground mb-4">Toute réclamation doit être adressée à <a href="mailto:contact@fredwav.com" className="text-primary underline">contact@fredwav.com</a> avec référence de commande et description précise du problème. Une solution amiable sera recherchée en priorité.</p>

          {/* ARTICLE 20 */}
          <h2 className="font-display text-xl font-semibold mt-10 mb-3">Article 20 — Médiation de la consommation (B2C)</h2>
          <p className="text-muted-foreground mb-2">Après démarche écrite préalable auprès du Prestataire, le Client consommateur peut saisir gratuitement le médiateur de la consommation suivant :</p>
          <ul className="text-muted-foreground mb-4 list-none pl-0 space-y-1">
            <li><strong>SAS Médiation Solution Conso</strong></li>
            <li>Adresse postale : 222 chemin de la Bergerie, 01800 Saint Jean de Niost, France</li>
            <li>Email : contact@sasmediationsolution-conso.fr</li>
            <li>Téléphone : +33 (0)4 82 53 93 06</li>
          </ul>
          <p className="text-muted-foreground mb-4">Modalités de saisine : via le formulaire « Saisir le médiateur » disponible sur le site du médiateur.</p>

          {/* ARTICLE 21 */}
          <h2 className="font-display text-xl font-semibold mt-10 mb-3">Article 21 — Règlement en ligne des litiges au niveau européen (ODR/RLL)</h2>
          <p className="text-muted-foreground mb-4">La plateforme européenne de règlement en ligne des litiges (ODR/RLL) est fermée depuis le 20 juillet 2025. Le Client peut consulter les voies de recours disponibles via le portail officiel « Consumer Redress in the EU ».</p>

          {/* ARTICLE 22 */}
          <h2 className="font-display text-xl font-semibold mt-10 mb-3">Article 22 — Droit applicable — Litiges — Juridictions</h2>
          <p className="text-muted-foreground mb-4">Les présentes CGV sont soumises au droit français. En cas de litige, une solution amiable est recherchée (réclamation puis médiation pour les consommateurs). À défaut d'accord, les juridictions compétentes seront saisies selon les règles applicables.</p>

          {/* ARTICLE 23 */}
          <h2 className="font-display text-xl font-semibold mt-10 mb-3">Article 23 — Force majeure</h2>
          <p className="text-muted-foreground mb-4">Le Prestataire ne pourra être tenu responsable si l'inexécution ou le retard résulte d'un cas de force majeure. Les obligations sont suspendues pendant la durée de l'événement.</p>

          {/* ARTICLE 24 */}
          <h2 className="font-display text-xl font-semibold mt-10 mb-3">Article 24 — Nullité partielle</h2>
          <p className="text-muted-foreground mb-4">Si une clause est déclarée nulle ou inapplicable, les autres clauses demeurent applicables.</p>

          {/* ARTICLE 25 */}
          <h2 className="font-display text-xl font-semibold mt-10 mb-3">Article 25 — Modification des CGV</h2>
          <p className="text-muted-foreground mb-4">Le Prestataire peut modifier les présentes CGV à tout moment. Les CGV applicables sont celles en vigueur au jour de la commande.</p>

          {/* ANNEXE 1 */}
          <h2 className="font-display text-xl font-semibold mt-14 mb-3 border-t pt-8">Annexe 1 — Consentements obligatoires avant paiement (cases à cocher)</h2>
          <p className="text-muted-foreground mb-4">Ces cases doivent être cochées avant l'accès au paiement lorsque le Client souhaite un démarrage avant la fin du délai de rétractation.</p>

          <div className="bg-muted/50 rounded-lg p-4 mb-4 space-y-3">
            <p className="text-muted-foreground text-sm"><strong>Case 1 (démarrage anticipé) :</strong><br />
            « Je demande expressément à ce que la prestation commence avant la fin du délai légal de rétractation de 14 jours. »</p>
            <p className="text-muted-foreground text-sm"><strong>Case 2 (perte du droit si pleinement exécuté) :</strong><br />
            « Je reconnais que si la prestation est pleinement exécutée avant la fin du délai de rétractation, je perdrai mon droit de rétractation. »</p>
          </div>

          <p className="text-muted-foreground mb-2 text-sm"><strong>Mention spécifique à afficher sous les cases pour One Shot (recommandée) :</strong></p>
          <p className="text-muted-foreground mb-4 text-sm italic">« Si mon rendez-vous One Shot a lieu avant la fin des 14 jours et qu'il est réalisé, je comprends que je ne pourrai plus exercer mon droit de rétractation pour cette prestation. »</p>

          <p className="text-muted-foreground mb-4 text-sm"><strong>Preuve à conserver (recommandation opérationnelle) :</strong> Le Prestataire conserve la preuve du consentement : date et heure, identifiant de commande, offre, version des CGV, email du Client, et tout élément utile en cas de contestation.</p>

          {/* ANNEXE 2 */}
          <h2 className="font-display text-xl font-semibold mt-14 mb-3 border-t pt-8">Annexe 2 — Rappel des éléments inclus (résumé)</h2>
          <ul className="text-muted-foreground mb-4 space-y-2">
            <li><strong>One Shot :</strong> diagnostic + session de conseils en visio.</li>
            <li><strong>Wav Premium 45 jours :</strong> 4 rendez-vous minimum, suivi WhatsApp 5j/7, réponse sous 24h lun-ven, retours stats, conseils ultra personnalisés, ressources personnalisées.</li>
            <li><strong>VIP :</strong> accès Discord VIP pendant l'abonnement, ressources (cours, replays, checklists), live hebdo (sauf circonstance particulière), retours 5j/7 sur Discord, pas de rdv individuel.</li>
          </ul>
        </div>
      </Section>
    </Layout>
  );
}
