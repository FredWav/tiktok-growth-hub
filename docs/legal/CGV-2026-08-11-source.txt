import { Layout } from "@/components/layout/Layout";
import { Section } from "@/components/ui/section";
import { SEOHead } from "@/components/SEOHead";
import { seoFor } from "@/config/seo";
import { ACADEMY_LIVE_SLOT, ACADEMY_SUPPORT_DAYS } from "@/config/offers";
import { Link } from "react-router-dom";

export default function CGV() {
  return (
    <Layout>
      <SEOHead {...seoFor("/cgv")} />
      <Section variant="default" size="lg">
        <div className="max-w-3xl mx-auto prose prose-neutral">
          <h1 className="font-display text-3xl md:text-4xl font-semibold mb-2">Conditions Générales de Vente (CGV) — Fred Wav</h1>
          <p className="text-sm text-muted-foreground mb-10">Dernière mise à jour : 11 août 2026 — version 2026-08-11</p>

          {/* ARTICLE 1 */}
          <h2 className="font-display text-xl font-semibold mt-10 mb-3">Article 1 — Identification du vendeur</h2>
          <ul className="text-muted-foreground mb-4 list-none pl-0 space-y-1">
            <li><strong>Éditeur et vendeur :</strong> Frédéric Olalde, Entrepreneur Individuel (EI), exploitant sous le nom commercial Fred Wav.</li>
            <li><strong>SIRET :</strong> 921 749 727 00019</li>
            <li><strong>Adresse :</strong> 2 route de Malagué, 86270 Coussay-les-Bois, France</li>
            <li><strong>Contact :</strong> <a href="mailto:contact@fredwav.com" className="text-primary underline">contact@fredwav.com</a></li>
            <li><strong>TVA :</strong> Non applicable, article 293 B du CGI (franchise en base)</li>
          </ul>

          {/* ARTICLE 2 */}
          <h2 className="font-display text-xl font-semibold mt-10 mb-3">Article 2 — Objet</h2>
          <p className="text-muted-foreground mb-4">
            Les présentes CGV encadrent la vente à distance des prestations de conseil et d'accompagnement stratégique en formats courts, ainsi que la vente d'analyses automatisées de comptes TikTok (Analyse Express).
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
            <li><strong>Prestations :</strong> Wav Premium (accompagnement 30 jours), Wav Academy (accès communauté Discord + contenus numériques) et Analyse Express (rapport d'analyse automatisé).</li>
            <li><strong>Contenus numériques :</strong> rapports PDF, ressources, checklists et templates éventuellement remis dans le cadre de la prestation.</li>
            <li><strong>Plateformes tierces :</strong> TikTok, Instagram, YouTube, Discord, WhatsApp, Stripe, PayPal, Klarna. Fred Wav n'est pas responsable de leurs pannes, interruptions, changements de conditions d'utilisation, ni des conséquences pouvant en découler.</li>
          </ul>

          {/* ARTICLE 5 */}
          <h2 className="font-display text-xl font-semibold mt-10 mb-3">Article 5 — Description des offres</h2>

          <h3 className="font-display text-lg font-medium mt-4 mb-2">5.1 Wav Premium (30 jours)</h3>
          <p className="text-muted-foreground mb-4">
            Accompagnement intensif sur candidature validée par Fred Wav. Inclut 4 RDV visio minimum, suivi WhatsApp 5j/7 (réponse sous 24h ouvrées du lundi au vendredi), et ressources personnalisées. Prestation de service sans garantie de résultat.
          </p>

          <h3 className="font-display text-lg font-medium mt-4 mb-2">5.2 Analyse Express</h3>
          <p className="text-muted-foreground mb-4">
            Analyse automatisée d'un compte TikTok via outil d'analyse. Le client reçoit un rapport détaillé (PDF + dashboard). Prestation de contenu numérique délivrée immédiatement après paiement.
          </p>

          <h3 className="font-display text-lg font-medium mt-4 mb-2">5.3 Wav Academy</h3>
          <p className="text-muted-foreground mb-4">
            Accès à la communauté Discord Wav Academy, aux ressources documentaires (cours, replays, checklists, méthodes, templates), aux canaux Discord premium, et aux crédits mensuels de l'outil d'analyse partenaire inclus dans la formule. La Wav Academy est proposée en trois formules prépayées (3, 6 ou 12 mois), dont les modalités de durée et de prix sont précisées à l'Article 12.
          </p>
          <p className="text-muted-foreground mb-4">
            L'accompagnement comprend un live hebdomadaire animé par Fred Wav, programmé {ACADEMY_LIVE_SLOT} (heure de Paris), un suivi des questions posées sur le Discord {ACADEMY_SUPPORT_DAYS} (réponse sous 24h ouvrées du lundi au vendredi), et des retours individualisés sur les contenus soumis par le membre, à sa demande.
          </p>
          <p className="text-muted-foreground mb-4">
            Le jour et l'horaire du live peuvent être modifiés, et un live peut être exceptionnellement décalé, annulé ou remplacé par un enregistrement, moyennant information préalable des membres sur le Discord. Ces modalités constituent une obligation de moyens : la Wav Academy est une prestation de service sans garantie de résultat, notamment en matière d'audience, de visibilité ou de revenus.
          </p>

          <h3 className="font-display text-lg font-medium mt-4 mb-2">5.4 Évolution du contenu</h3>
          <p className="text-muted-foreground mb-4">
            Le contenu exact des offres (ressources, formats, modalités) est celui présenté au moment de l'achat. Le contenu de la Wav Academy peut évoluer pour s'adapter et s'améliorer (formats, ressources, organisation), sans diminution substantielle de la valeur globale. Les prix peuvent être modifiés pour l'avenir ; le tarif applicable est celui affiché au moment de la commande et reste acquis pour toute la durée de la formule prépayée souscrite.
          </p>

          {/* ARTICLE 6 */}
          <h2 className="font-display text-xl font-semibold mt-10 mb-3">Article 6 — Commande et candidature</h2>
          <p className="text-muted-foreground mb-4">
            Le processus de commande suit la règle du "double clic" (sélection, validation des CGV, confirmation de paiement).
            Pour Wav Premium, la validation finale est soumise à l'acceptation de la candidature par Fred Wav. En cas de refus, aucun débit n'est effectué.
          </p>
          <p className="text-muted-foreground mb-4">
            Lorsque l'offre doit être exécutée avant la fin du délai de rétractation, l'acceptation des CGV et la demande d'exécution immédiate font l'objet de cases distinctes, non précochées. Leur texte exact, leur version et leur horodatage sont enregistrés avant la redirection vers le paiement puis rattachés à la référence Stripe. Une confirmation est ensuite envoyée par email sur un support durable.
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
          <p className="text-muted-foreground mb-4">
            <strong>Remboursements :</strong> aucune retenue de frais de transaction n'est appliquée lorsqu'un remboursement est dû au titre du droit légal de rétractation, d'une garantie légale ou d'un manquement du Vendeur. Pour un geste commercial demandé en dehors de ces droits, les conditions sont convenues au cas par cas avant remboursement.
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
            <strong>Annulation et report (RDV Wav Premium) :</strong> possible jusqu'à 48h avant le rendez-vous. Passé ce délai, la session est considérée comme due et consommée, sauf cas de force majeure justifié.
          </p>
          <p className="text-muted-foreground mb-4">
            <strong>No-show (absence non justifiée) :</strong> la session est considérée comme due et consommée.
          </p>
          <p className="text-muted-foreground mb-4">
            <strong>Wav Premium :</strong> la durée d'accompagnement est de 30 jours calendaires. Les reports ne prolongent pas automatiquement la durée, sauf accord écrit.
          </p>

          <h3 className="font-display text-lg font-medium mt-4 mb-2">8.1 Caractère forfaitaire et non-remboursement</h3>
          <p className="text-muted-foreground mb-4">
            Toute prestation payée auprès du Vendeur — qu'il s'agisse de Wav Premium, de la Wav Academy ou de l'Analyse Express — constitue un forfait global et indivisible, correspondant à un dispositif construit, réservé et planifié dans son ensemble. Le prix n'est pas décomposable par session, par ressource, par fonctionnalité, par semaine ou par période entamée.
          </p>
          <p className="text-muted-foreground mb-4">
            Sous réserve des droits impératifs du Client, après l'expiration du délai de rétractation ou après sa perte valable dans les conditions de l'Article 9, toute interruption, suspension ou arrêt de la prestation à la seule initiative du Client, pour convenance personnelle, ne donne lieu à aucun remboursement, total ou partiel.
          </p>
          <p className="text-muted-foreground mb-4">
            <strong>Accompagnements individuels (Wav Premium) :</strong> les sessions et ressources déjà délivrées sont définitivement dues. Les sessions non encore consommées restent acquises au Client et disponibles dans la limite de la durée de validité prévue à l'article 8.2 ci-dessous, sans pouvoir donner lieu à un remboursement en numéraire.
          </p>
          <p className="text-muted-foreground mb-4">
            <strong>Wav Academy — formules prépayées (3, 6 et 12 mois) :</strong> formules payées intégralement et d'avance pour la totalité de la durée choisie. Le prix est définitivement dû dès la commande, sans remboursement, même partiel ou au prorata, quel que soit le niveau d'utilisation effective. Ces formules ne sont pas des abonnements et ne sont pas reconduites automatiquement : l'accès cesse de plein droit au terme de la durée souscrite, sauf souscription d'une nouvelle formule.
          </p>
          <p className="text-muted-foreground mb-4">
            <strong>Prestations à livraison numérique immédiate (Analyse Express) :</strong> le rapport et les contenus délivrés sont définitivement dus dès leur mise à disposition lorsque le Client a expressément demandé l'exécution immédiate et préalablement reconnu la perte de son droit de rétractation dans les conditions de l'article 9.2.
          </p>
          <p className="text-muted-foreground mb-4">
            La présente clause ne s'applique pas lorsque l'interruption résulte d'un manquement du Vendeur à ses obligations. Dans ce cas, les dispositions de l'Article 10 s'appliquent.
          </p>

          <h3 className="font-display text-lg font-medium mt-4 mb-2">8.2 Durée de validité (accompagnements individuels à durée déterminée)</h3>
          <p className="text-muted-foreground mb-4">
            L'accompagnement individuel à durée déterminée (notamment Wav Premium), y compris en cas de suspension prévue à l'article 8.3, doit être pleinement réalisé dans un délai maximum de 30 jours calendaires à compter de la date du premier rendez-vous. Passé ce délai, les sessions non consommées sont caduques et ne peuvent donner lieu ni à exécution ni à remboursement.
          </p>

          <h3 className="font-display text-lg font-medium mt-4 mb-2">8.3 Suspension à la demande du Client (accompagnements individuels)</h3>
          <p className="text-muted-foreground mb-4">
            À titre exceptionnel, le Client peut demander la suspension temporaire de son accompagnement individuel à durée déterminée. Cette suspension est soumise à l'accord écrit préalable du Vendeur.
          </p>
          <p className="text-muted-foreground mb-4">
            La demande s'effectue par écrit. Le Client peut bénéficier d'une seule suspension, d'une durée maximale de 30 jours. Pendant la suspension, le décompte des 30 jours calendaires prévu à l'article 8.2 est gelé et reprend à la date de reprise convenue.
          </p>
          <p className="text-muted-foreground mb-4">
            La suspension est formalisée par email valant support durable, précisant la date de début de suspension et la nouvelle date de fin d'accompagnement. La suspension ne donne lieu à aucun remboursement et ne modifie pas la durée de validité maximale prévue à l'article 8.2.
          </p>
          <p className="text-muted-foreground mb-4">
            Pour la suspension d'une formule Wav Academy, se reporter à l'Article 12.
          </p>

          {/* ARTICLE 9 */}
          <h2 className="font-display text-xl font-semibold mt-10 mb-3">Article 9 — Droit de rétractation (B2C uniquement)</h2>
          <p className="text-muted-foreground mb-4">
            Conformément à l'article L221-18 du Code de la consommation, le client consommateur dispose de 14 jours pour se rétracter, sauf exceptions.
          </p>

          <h3 className="font-display text-lg font-medium mt-4 mb-2">9.1 Démarrage avant la fin des 14 jours (Wav Premium)</h3>
          <p className="text-muted-foreground mb-4">
            Si le Client demande expressément le démarrage de l'accompagnement Wav Premium avant la fin du délai de 14 jours, l'exécution peut commencer sans attendre l'expiration de ce délai.
          </p>
          <p className="text-muted-foreground mb-4">
            Si le Client se rétracte alors que l'exécution a commencé à sa demande, il reste redevable uniquement d'un montant proportionné au service effectivement fourni jusqu'à la notification de sa décision, rapporté au prix total convenu, conformément à l'article L221-25 du Code de la consommation. Si la prestation est pleinement exécutée avant la fin du délai de 14 jours, le droit de rétractation n'est perdu qu'après demande expresse d'exécution et reconnaissance préalable de cette perte.
          </p>

          <h3 className="font-display text-lg font-medium mt-4 mb-2">9.2 Exécution et livraison immédiates (Analyse Express)</h3>
          <p className="text-muted-foreground mb-2">
            L'Analyse Express est une prestation automatisée aboutissant à la mise à disposition rapide d'un rapport numérique. Avant le paiement, le Client :
          </p>
          <ul className="text-muted-foreground mb-4 space-y-1">
            <li>accepte séparément les présentes CGV ;</li>
            <li>demande expressément l'exécution avant la fin du délai de 14 jours ;</li>
            <li>reconnaît perdre son droit de rétractation lorsque la prestation est pleinement exécutée et le rapport mis à disposition.</li>
          </ul>
          <p className="text-muted-foreground mb-4">
            Le texte accepté, la version des CGV, l'horodatage et la référence de paiement sont récapitulés par email après confirmation du paiement. Si la prestation n'a pas été pleinement exécutée, les droits impératifs du consommateur demeurent applicables selon l'état réel d'exécution.
          </p>

          <h3 className="font-display text-lg font-medium mt-4 mb-2">9.3 Contenu numérique et service (Wav Academy)</h3>
          <p className="text-muted-foreground mb-2">
            La Wav Academy combine un <strong>contenu numérique</strong> (accès dès la commande à un espace Discord, ressources, replays) et une <strong>prestation de service</strong> exécutée pendant la durée souscrite (lives, accompagnement, animation de la communauté). Au moment de l'achat, le Client demande l'exécution immédiate du service et l'accès immédiat au contenu numérique avant l'expiration du délai de 14 jours. En conséquence, conformément aux articles L221-28, 1° et 13° du Code de la consommation :
          </p>
          <ul className="text-muted-foreground mb-4 space-y-1">
            <li>pour la part de <strong>contenu numérique</strong>, le Client perd son droit de rétractation dès le début de l'accès, après l'avoir expressément demandé et avoir expressément reconnu la perte de ce droit ;</li>
            <li>pour la part de <strong>service</strong>, en cas de rétractation dans le délai de 14 jours, le Client reste redevable du prix au prorata du service déjà fourni à la date de sa demande.</li>
          </ul>
          <p className="text-muted-foreground mb-4">
            Les formules Wav Academy étant des paiements uniques prépayés (3, 6 ou 12 mois), elles ne sont pas reconduites : l'accès court jusqu'au terme souscrit puis cesse automatiquement. Cette règle reste sans préjudice du droit de rétractation et du prorata légal décrits ci-dessus.
          </p>

          <h3 className="font-display text-lg font-medium mt-4 mb-2">9.4 Confirmation sur support durable</h3>
          <p className="text-muted-foreground mb-4">
            Après la commande, le vendeur adresse au Client une confirmation par email (support durable) récapitulant la commande, la version des CGV acceptées et le texte exact des consentements donnés au démarrage ou à la livraison immédiate.
          </p>

          <h3 className="font-display text-lg font-medium mt-4 mb-2">9.5 Modalités d'exercice</h3>
          <p className="text-muted-foreground mb-4">
            Le Client peut notifier sa décision sans justification au moyen de la{" "}
            <Link to="/retractation" className="text-primary underline">fonctionnalité de rétractation en ligne</Link>,
            du formulaire modèle en Annexe 1 ou d'un email dénué d'ambiguïté adressé à{" "}
            <a href="mailto:contact@fredwav.com" className="text-primary underline">contact@fredwav.com</a>.
            La fonctionnalité en ligne délivre immédiatement une référence horodatée. Un accusé de réception est adressé par email ; en cas d'incident de messagerie, son état est conservé pour permettre une relance sans recréer la demande. La date d'envoi de la notification est prise en compte pour apprécier le respect du délai.
          </p>

          {/* ARTICLE 10 */}
          <h2 className="font-display text-xl font-semibold mt-10 mb-3">Article 10 — Responsabilité et limitation</h2>
          <p className="text-muted-foreground mb-4">
            Fred Wav est tenu à une obligation de moyens, pas de résultat.
            Il ne peut être tenu responsable des changements d'algorithme, des bannissements de compte, des décisions de modération, des pannes de plateformes tierces, ni du manque de mise en application des conseils par le client.
          </p>
          <p className="text-muted-foreground mb-4">
            La responsabilité totale de Fred Wav, lorsque sa responsabilité serait retenue, est limitée au montant effectivement payé par le client pour la prestation litigieuse.
            Cette limitation ne s'applique pas en cas de faute lourde ou dolosive, ni aux dispositions d'ordre public.
          </p>

          {/* ARTICLE 11 */}
          <h2 className="font-display text-xl font-semibold mt-10 mb-3">Article 11 — Propriété intellectuelle</h2>
          <p className="text-muted-foreground mb-4">
            L'ensemble des ressources (méthodes, rapports, PDF, templates) est la propriété exclusive de Fred Wav. Le client dispose d'un droit d'usage personnel et non cessible.
            La revente ou la diffusion des méthodes et contenus entraîne une résiliation immédiate sans remboursement. Le vendeur se réserve le droit d'engager toute action utile (civile et, le cas échéant, pénale) en fonction des faits constatés.
          </p>

          {/* ARTICLE 12 */}
          <h2 className="font-display text-xl font-semibold mt-10 mb-3">Article 12 — Wav Academy (formules, reconduction, résiliation, suspension)</h2>

          <h3 className="font-display text-lg font-medium mt-4 mb-2">12.1 Formules disponibles</h3>
          <p className="text-muted-foreground mb-2">
            La Wav Academy est proposée en trois formules prépayées donnant accès à des contenus et services identiques, seules la durée et le prix variant. Chaque formule est un <strong>paiement unique</strong>, sans abonnement ni reconduction :
          </p>
          <ul className="text-muted-foreground mb-4 space-y-1">
            <li><strong>Fondation — 3 mois</strong> : formule prépayée à durée déterminée (299 €), sans reconduction ;</li>
            <li><strong>Accélération — 6 mois</strong> : formule prépayée à durée déterminée (499 €), sans reconduction ;</li>
            <li><strong>Maîtrise — 12 mois</strong> : formule prépayée à durée déterminée (899 €), sans reconduction.</li>
          </ul>

          <h3 className="font-display text-lg font-medium mt-4 mb-2">12.2 Absence de reconduction</h3>
          <p className="text-muted-foreground mb-4">
            Aucune formule Wav Academy n'est un abonnement : les trois formules (3, 6 et 12 mois) sont des paiements uniques prépayés et ne sont pas reconduites automatiquement. L'accès cesse de plein droit au terme de la durée souscrite, sauf souscription volontaire d'une nouvelle formule.
          </p>

          <h3 className="font-display text-lg font-medium mt-4 mb-2">12.3 Fin de l'accès</h3>
          <p className="text-muted-foreground mb-4">
            Les trois formules (3, 6 et 12 mois) sont payées intégralement d'avance. Hors exercice d'un droit impératif, notamment le droit de rétractation dans les conditions de l'article 9.3, elles ne donnent lieu à aucune résiliation anticipée ni remboursement. L'accès reste ouvert jusqu'au terme souscrit, puis prend fin automatiquement — il n'y a aucune démarche de résiliation à effectuer.
          </p>

          <h3 className="font-display text-lg font-medium mt-4 mb-2">12.4 Suspension</h3>
          <p className="text-muted-foreground mb-4">
            En cas d'impayé, de rejet de paiement, de rétrofacturation, ou de violation des règles de communauté (harcèlement, spam, diffusion de contenus réservés, comportements abusifs), l'accès peut être suspendu ou résilié sans remboursement.
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
            (À utiliser si vous souhaitez vous rétracter dans le délai légal, sous réserve des exceptions applicables. Vous pouvez l'envoyer à <a href="mailto:contact@fredwav.com" className="text-primary underline">contact@fredwav.com</a> ou utiliser la <Link to="/retractation" className="text-primary underline">fonctionnalité en ligne</Link>.)
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
            <p>☐ J'ai lu et j'accepte les Conditions Générales de Vente.</p>
            <p>☐ (Wav Premium) Je demande expressément l'exécution de la prestation avant la fin du délai légal de rétractation de 14 jours. En cas de rétractation après le début de l'exécution, je resterai redevable du montant proportionné au service effectivement fourni ; si la prestation est pleinement exécutée, je reconnais perdre mon droit de rétractation.</p>
            <p>☐ (Analyse Express) Je demande expressément l'exécution immédiate de l'Analyse Express avant la fin du délai de 14 jours et je reconnais perdre mon droit de rétractation lorsque la prestation est pleinement exécutée et le rapport mis à disposition.</p>
            <p>☐ (Wav Academy) Je demande l'exécution immédiate du service et l'accès immédiat au contenu numérique avant l'expiration du délai de rétractation de 14 jours. Je reconnais que pour le contenu numérique, je perds mon droit de rétractation dès l'accès ; pour la partie service, en cas de rétractation, je reste redevable du prix au prorata du service déjà fourni.</p>
          </div>
        </div>
      </Section>
    </Layout>
  );
}
