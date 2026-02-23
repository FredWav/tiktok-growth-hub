import { Layout } from "@/components/layout/Layout";
import { Section } from "@/components/ui/section";
import { SEOHead } from "@/components/SEOHead";

export default function CGV() {
  return (
    <Layout>
      <SEOHead title="Conditions Générales de Vente | Fred Wav" description="CGV applicables aux prestations de conseil en stratégie TikTok proposées par Fred Wav." path="/cgv" />
      <Section variant="default" size="lg">
        <div className="max-w-3xl mx-auto prose prose-neutral">
          <h1 className="font-display text-3xl md:text-4xl font-semibold mb-2">Conditions Générales de Vente (CGV) — Fred Wav</h1>
          <p className="text-sm text-muted-foreground mb-10">Dernière mise à jour : 23 février 2026</p>

          {/* ARTICLE 1 */}
          <h2 className="font-display text-xl font-semibold mt-10 mb-3">Article 1 — Identification du vendeur</h2>
          <ul className="text-muted-foreground mb-4 list-none pl-0 space-y-1">
            <li><strong>Éditeur et vendeur :</strong> Frédéric Olalde, Entrepreneur Individuel (EI), exploitant sous le nom commercial Fred Wav.</li>
            <li><strong>SIRET :</strong> 921 749 727 00019</li>
            <li><strong>Adresse :</strong> 2 route de Malagué, 86270 Coussay-les-Bois, France</li>
            <li><strong>Contact :</strong> <a href="mailto:contact@fredwav.com" className="text-primary underline">contact@fredwav.com</a></li>
            <li><strong>TVA :</strong> Non applicable, article 293 B du CGI (franchise en base)</li>
            <li><strong>Assurance :</strong> Responsabilité Civile Professionnelle souscrite auprès de [Nom de ton assurance - ex: AXA/Hiscox]</li>
          </ul>

          {/* ARTICLE 2 */}
          <h2 className="font-display text-xl font-semibold mt-10 mb-3">Article 2 — Objet</h2>
          <p className="text-muted-foreground mb-4">
            Les présentes CGV encadrent la vente à distance de prestations de conseil, d'accompagnement stratégique TikTok, l'accès à des ressources numériques et des abonnements VIP.
          </p>

          {/* ARTICLE 3 */}
          <h2 className="font-display text-xl font-semibold mt-10 mb-3">Article 3 — Champ d'application</h2>
          <h3 className="font-display text-lg font-medium mt-4 mb-2">3.1 Clients consommateurs (B2C)</h3>
          <p className="text-muted-foreground mb-4">
            Les clients consommateurs bénéficient des dispositions du Code de la consommation, notamment concernant le droit de rétractation et la médiation de la consommation.
          </p>
          <h3 className="font-display text-lg font-medium mt-4 mb-2">3.2 Clients professionnels (B2B)</h3>
          <p className="text-muted-foreground mb-4">
            Les dispositions relatives au droit de rétractation et à la médiation de la consommation ne s'appliquent pas aux clients professionnels.
            Le paiement est exigible à la commande (sauf conditions particulières écrites).
            En cas de retard de paiement, des pénalités de retard sont exigibles de plein droit, sans qu'un rappel soit nécessaire, au taux prévu à l'article L441-10 du Code de commerce, ainsi que l'indemnité forfaitaire de 40 EUR pour frais de recouvrement (art. L441-10 Code de commerce).
          </p>

          {/* ARTICLE 4 */}
          <h2 className="font-display text-xl font-semibold mt-10 mb-3">Article 4 — Définitions</h2>
          <ul className="text-muted-foreground mb-4 space-y-1">
            <li><strong>Prestations :</strong> One Shot (session unique), Wav Premium (45 jours), VIP (abonnement).</li>
            <li><strong>Contenus numériques :</strong> Cours, replays, checklists, méthodes, templates accessibles via Discord ou plateforme dédiée.</li>
            <li><strong>Plateformes tierces :</strong> TikTok, Discord, WhatsApp, Stripe, PayPal, Klarna. Fred Wav n'est pas responsable de leurs pannes, interruptions, changements de conditions d'utilisation, ni des conséquences pouvant en découler.</li>
          </ul>

          {/* ARTICLE 5 */}
          <h2 className="font-display text-xl font-semibold mt-10 mb-3">Article 5 — Description des offres</h2>

          <h3 className="font-display text-lg font-medium mt-4 mb-2">5.1 One Shot (179 EUR TTC)</h3>
          <p className="text-muted-foreground mb-4">
            Diagnostic stratégique en visioconférence. Prestation de service ponctuelle sans garantie de résultat.
          </p>

          <h3 className="font-display text-lg font-medium mt-4 mb-2">5.2 Wav Premium (45 jours)</h3>
          <p className="text-muted-foreground mb-4">
            Accompagnement intensif sur candidature. Inclut 4 RDV visio minimum, suivi WhatsApp 5j/7 (réponse sous 24h ouvrées du lundi au vendredi), et ressources personnalisées.
          </p>

          <h3 className="font-display text-lg font-medium mt-4 mb-2">5.3 VIP (dès 99 EUR TTC/mois)</h3>
          <p className="text-muted-foreground mb-4">
            Abonnement mensuel incluant l'accès à la communauté Discord, aux ressources documentaires et à un live hebdomadaire. Pas de suivi individuel personnalisé hors Discord.
          </p>

          <h3 className="font-display text-lg font-medium mt-4 mb-2">5.4 Contenu exact, évolution du contenu, absence de RDV individuel VIP</h3>
          <p className="text-muted-foreground mb-4">
            Le contenu exact des offres (ressources, formats, modalités) est celui présenté au moment de l'achat.
            Pour le VIP, aucun rendez-vous individuel n'est prévu. Les retours sont assurés via Discord 5j/7, et un live est organisé 1 fois par semaine, sauf circonstance particulière (empêchement, contrainte technique, force majeure). Dans la mesure du possible, un replay ou un report est proposé.
          </p>

          {/* ARTICLE 6 */}
          <h2 className="font-display text-xl font-semibold mt-10 mb-3">Article 6 — Commande et candidature</h2>
          <p className="text-muted-foreground mb-4">
            Le processus de commande suit la règle du "double clic" (sélection, validation des CGV, confirmation de paiement).
            Pour Wav Premium, la validation finale est soumise à l'acceptation de la candidature par Fred Wav. En cas de refus, aucun débit n'est effectué.
          </p>

          {/* ARTICLE 7 */}
          <h2 className="font-display text-xl font-semibold mt-10 mb-3">Article 7 — Prix et paiement</h2>
          <p className="text-muted-foreground mb-4">
            <strong>Tarifs :</strong> exprimés en euros TTC. Fred Wav se réserve le droit de modifier ses prix à tout moment pour l'avenir. Le tarif applicable est celui affiché au moment de la commande.
          </p>
          <p className="text-muted-foreground mb-4">
            <strong>Paiement :</strong> sécurisé via Stripe (CB, Klarna 3x, PayPal 4x), sous réserve d'acceptation par les prestataires de paiement. Le paiement est exigible à la commande.
          </p>
          <p className="text-muted-foreground mb-4">
            <strong>Incident de paiement :</strong> tout rejet de paiement peut entraîner la suspension immédiate des accès et le report ou la suspension de l'exécution des prestations jusqu'à régularisation.
          </p>
          <p className="text-muted-foreground mb-4">
            <strong>Rétrofacturation (chargeback) :</strong> toute rétrofacturation entraîne la suspension immédiate des accès et l'exigibilité des sommes dues. Le vendeur pourra réclamer, sur justificatifs, les frais réellement supportés du fait de l'impayé ou de la rétrofacturation (frais de traitement du prestataire de paiement, frais de recouvrement, frais administratifs externes si applicable).
          </p>

          {/* ARTICLE 8 */}
          <h2 className="font-display text-xl font-semibold mt-10 mb-3">Article 8 — Exécution, retards, annulation, report</h2>
          <p className="text-muted-foreground mb-4">
            <strong>Planification :</strong> les sessions visio sont fixées d'un commun accord.
          </p>
          <p className="text-muted-foreground mb-4">
            <strong>Retards :</strong> tout retard du client est décompté du temps de session. La session se termine à l'heure prévue initialement.
          </p>
          <p className="text-muted-foreground mb-4">
            <strong>Annulation et report (One Shot et RDV Wav Premium) :</strong> possible jusqu'à 48h avant le rendez-vous. Passé ce délai, la session est considérée comme due et consommée, sauf cas de force majeure justifié.
          </p>
          <p className="text-muted-foreground mb-4">
            <strong>No-show (absence non justifiée) :</strong> la session est considérée comme due et consommée.
          </p>
          <p className="text-muted-foreground mb-4">
            <strong>Wav Premium :</strong> la durée d'accompagnement est de 45 jours calendaires. Les reports ne prolongent pas automatiquement la durée, sauf accord écrit.
          </p>

          {/* ARTICLE 9 */}
          <h2 className="font-display text-xl font-semibold mt-10 mb-3">Article 9 — Droit de rétractation (B2C uniquement)</h2>
          <p className="text-muted-foreground mb-4">
            Conformément à l'article L221-18 du Code de la consommation, le client consommateur dispose de 14 jours pour se rétracter, sauf exceptions.
          </p>

          <h3 className="font-display text-lg font-medium mt-4 mb-2">9.1 Services pleinement exécutés (One Shot)</h3>
          <p className="text-muted-foreground mb-2">
            Si le One Shot a lieu avant la fin des 14 jours, le droit de rétractation est perdu uniquement si :
          </p>
          <ul className="text-muted-foreground mb-4 space-y-1">
            <li>l'exécution a commencé avec l'accord préalable et exprès du client,</li>
            <li>et le client a reconnu perdre son droit de rétractation lorsque la prestation est pleinement exécutée.</li>
          </ul>

          <h3 className="font-display text-lg font-medium mt-4 mb-2">9.2 Démarrage avant la fin des 14 jours (Wav Premium et One Shot programmé rapidement)</h3>
          <p className="text-muted-foreground mb-4">
            Si le client demande expressément le démarrage avant la fin du délai de 14 jours, et exerce ensuite sa rétractation, le vendeur peut facturer un montant proportionnel à ce qui a été exécuté.
            <br /><strong>Important :</strong> aucune somme n'est due par le consommateur si sa demande expresse n'a pas été recueillie correctement ou si les obligations d'information n'ont pas été respectées.
          </p>

          <h3 className="font-display text-lg font-medium mt-4 mb-2">9.3 Contenus numériques (VIP)</h3>
          <p className="text-muted-foreground mb-2">
            Si le client demande l'accès immédiat aux contenus numériques et ressources (cours, replays, checklists) avant la fin des 14 jours, le droit de rétractation ne s'applique pas dès lors que :
          </p>
          <ul className="text-muted-foreground mb-4 space-y-1">
            <li>le client a donné son accord préalable et exprès pour le démarrage,</li>
            <li>et qu'il a reconnu perdre son droit de rétractation du fait de ce démarrage.</li>
          </ul>

          <h3 className="font-display text-lg font-medium mt-4 mb-2">9.4 Confirmation sur support durable</h3>
          <p className="text-muted-foreground mb-4">
            Après la commande, le vendeur adresse au client une confirmation par email (support durable) récapitulant la commande, les CGV acceptées, ainsi que, le cas échéant, les consentements au démarrage immédiat et à la perte du droit de rétractation.
          </p>

          {/* ARTICLE 10 */}
          <h2 className="font-display text-xl font-semibold mt-10 mb-3">Article 10 — Responsabilité et limitation</h2>
          <p className="text-muted-foreground mb-4">
            Fred Wav est tenu à une obligation de moyens, pas de résultat.
            Il ne peut être tenu responsable des changements d'algorithme, des bannissements TikTok, des décisions de modération, des pannes de plateformes tierces, ni du manque de mise en application des conseils par le client.
          </p>
          <p className="text-muted-foreground mb-4">
            La responsabilité totale de Fred Wav, lorsque sa responsabilité serait retenue, est limitée au montant effectivement payé par le client pour la prestation litigieuse.
            Cette limitation ne s'applique pas en cas de faute lourde ou dolosive, ni aux dispositions d'ordre public.
          </p>

          {/* ARTICLE 11 */}
          <h2 className="font-display text-xl font-semibold mt-10 mb-3">Article 11 — Propriété intellectuelle</h2>
          <p className="text-muted-foreground mb-4">
            L'ensemble des ressources (méthodes, vidéos, PDF, cours, replays, checklists, templates) est la propriété exclusive de Fred Wav. Le client dispose d'un droit d'usage personnel et non cessible.
            Le partage d'identifiants Discord, l'accès non autorisé à des ressources, la revente ou la diffusion des méthodes et contenus entraîne une résiliation immédiate sans remboursement. Le vendeur se réserve le droit d'engager toute action utile (civile et, le cas échéant, pénale) en fonction des faits constatés.
          </p>

          {/* ARTICLE 12 */}
          <h2 className="font-display text-xl font-semibold mt-10 mb-3">Article 12 — Abonnement VIP (renouvellement, résiliation, suspension)</h2>

          <h3 className="font-display text-lg font-medium mt-4 mb-2">12.1 Renouvellement</h3>
          <p className="text-muted-foreground mb-4">
            Le VIP est un abonnement mensuel à reconduction automatique jusqu'à résiliation.
          </p>

          <h3 className="font-display text-lg font-medium mt-4 mb-2">12.2 Résiliation</h3>
          <p className="text-muted-foreground mb-4">
            Le client peut résilier à tout moment via le moyen de gestion communiqué lors de l'achat (lien de gestion d'abonnement ou espace client, selon l'outil de paiement).
            Pour éviter le prélèvement suivant, la résiliation doit être effectuée au plus tard 24h avant l'échéance de renouvellement.
            Toute période mensuelle commencée est due. L'accès est maintenu jusqu'à la fin de la période payée.
          </p>

          <h3 className="font-display text-lg font-medium mt-4 mb-2">12.3 Suspension</h3>
          <p className="text-muted-foreground mb-4">
            En cas d'impayé, de rejet de paiement, de rétrofacturation, ou de violation des règles de communauté (harcèlement, spam, diffusion de contenus réservés, comportements abusifs), l'accès peut être suspendu ou résilié, sans remboursement.
          </p>

          <h3 className="font-display text-lg font-medium mt-4 mb-2">12.4 Modification du service et du prix</h3>
          <p className="text-muted-foreground mb-4">
            Le contenu du VIP peut évoluer pour s'adapter et s'améliorer (formats, ressources, organisation), sans diminution substantielle de la valeur globale.
            Les prix peuvent être modifiés pour l'avenir. En cas d'évolution tarifaire, le nouveau prix s'applique aux renouvellements futurs, et le client peut résilier avant l'échéance.
          </p>

          {/* ARTICLE 13 */}
          <h2 className="font-display text-xl font-semibold mt-10 mb-3">Article 13 — Médiation (B2C)</h2>
          <p className="text-muted-foreground mb-2">
            En cas de litige non résolu par le service client (<a href="mailto:contact@fredwav.com" className="text-primary underline">contact@fredwav.com</a>), et après réclamation écrite préalable, le client consommateur peut saisir le médiateur :
          </p>
          <ul className="text-muted-foreground mb-4 list-none pl-0 space-y-1">
            <li><strong>SAS Médiation Solution Conso</strong></li>
            <li>Adresse : 222 chemin de la Bergerie, 01800 Saint Jean de Niost, France</li>
            <li>Email : <a href="mailto:contact@sasmediationsolution-conso.fr" className="text-primary underline">contact@sasmediationsolution-conso.fr</a></li>
            <li>Téléphone : +33 (0)4 82 53 93 06</li>
          </ul>
          <p className="text-muted-foreground mb-4">
            Modalités : saisie via le formulaire disponible sur le site du médiateur.
          </p>

          {/* ARTICLE 14 */}
          <h2 className="font-display text-xl font-semibold mt-10 mb-3">Article 14 — Droit applicable et juridiction</h2>
          <p className="text-muted-foreground mb-4">
            Les CGV sont soumises au droit français.
            En cas de litige avec un professionnel, le Tribunal de Commerce de Poitiers (86) sera seul compétent.
            En cas de litige avec un consommateur, les juridictions compétentes seront déterminées conformément aux règles applicables du Code de la consommation et du Code de procédure civile.
          </p>

          {/* ARTICLE 15 */}
          <h2 className="font-display text-xl font-semibold mt-10 mb-3">Article 15 — Plateforme européenne de règlement en ligne des litiges (ODR/RLL)</h2>
          <p className="text-muted-foreground mb-4">
            La plateforme européenne de règlement en ligne des litiges (ODR/RLL) est fermée depuis le 20 juillet 2025.
          </p>

          {/* ANNEXE 1 */}
          <h2 className="font-display text-xl font-semibold mt-14 mb-3 border-t pt-8">Annexe 1 — Formulaire de rétractation (modèle)</h2>
          <p className="text-muted-foreground mb-4 text-sm italic">
            (À renvoyer par email à <a href="mailto:contact@fredwav.com" className="text-primary underline">contact@fredwav.com</a> uniquement si vous souhaitez vous rétracter du contrat dans les 14 jours, sous réserve du non-démarrage de la prestation ou des exceptions légales.)
          </p>
          <div className="bg-muted/50 rounded-lg p-4 mb-4 space-y-2 text-sm text-muted-foreground">
            <p>À l'attention de Frédéric Olalde (Fred Wav), 2 route de Malagué, 86270 Coussay-les-Bois.</p>
            <p>Je vous notifie par la présente ma rétractation du contrat portant sur la prestation :</p>
            <p>Commandée le : ___</p>
            <p>Nom du client : ___</p>
            <p>Adresse du client : ___</p>
            <p>Signature (si format papier) : ___</p>
            <p>Date : ___</p>
          </div>

          {/* ANNEXE 2 */}
          <h2 className="font-display text-xl font-semibold mt-14 mb-3 border-t pt-8">Annexe 2 — Consentements express (cases à cocher au checkout)</h2>
          <div className="bg-muted/50 rounded-lg p-4 mb-4 space-y-3 text-sm text-muted-foreground">
            <p>☐ Je reconnais avoir lu et accepté les CGV.</p>
            <p>☐ Je demande l'exécution immédiate de la prestation (One Shot / Wav Premium) avant la fin du délai légal de rétractation de 14 jours.</p>
            <p>☐ Je reconnais que si la prestation de service est pleinement exécutée avant la fin du délai de rétractation, je perdrai mon droit de rétractation (notamment si mon One Shot a lieu avant la fin des 14 jours).</p>
            <p>☐ (Pour le VIP) Je demande l'accès immédiat aux contenus numériques et je reconnais perdre mon droit de rétractation dès le démarrage de la fourniture du contenu numérique.</p>
          </div>
        </div>
      </Section>
    </Layout>
  );
}
