import { Layout } from "@/components/layout/Layout";
import { Section } from "@/components/ui/section";
import { SEOHead } from "@/components/SEOHead";
import { seoFor } from "@/config/seo";
import { ACADEMY_LIVE_SLOT, ACADEMY_SUPPORT_DAYS, LAUNCH_END_LABEL } from "@/config/offers";
import { Link } from "react-router-dom";
import { VERSION, VERSION_LABEL } from "../../supabase/functions/_shared/consent-texts.ts";

export default function CGV() {
  return (
    <Layout>
      <SEOHead {...seoFor("/cgv")} />
      <Section variant="default" size="lg">
        <div className="max-w-3xl mx-auto prose prose-neutral">
          <h1 className="font-display text-3xl md:text-4xl font-semibold mb-2">Conditions Générales de Vente (CGV) : Fred Wav</h1>
          <p className="text-sm text-muted-foreground mb-10">Dernière mise à jour : {VERSION_LABEL}, version {VERSION}</p>

          {/* ARTICLE 1 */}
          <h2 className="font-display text-xl font-semibold mt-10 mb-3">Article 1 : Identification du vendeur</h2>
          <ul className="text-muted-foreground mb-4 list-none pl-0 space-y-1">
            <li><strong>Éditeur et vendeur :</strong> Frédéric Olalde, Entrepreneur Individuel (EI), exploitant sous le nom commercial Fred Wav.</li>
            <li><strong>SIRET :</strong> 921 749 727 00019</li>
            <li><strong>Adresse :</strong> 2 route de Malagué, 86270 Coussay-les-Bois, France</li>
            <li><strong>Contact :</strong> <a href="mailto:contact@fredwav.com" className="text-primary underline">contact@fredwav.com</a></li>
            <li><strong>TVA :</strong> Non applicable, article 293 B du CGI (franchise en base)</li>
            <li><strong>Données personnelles :</strong> leur traitement est décrit dans la <Link to="/politique-de-confidentialite" className="text-primary underline">politique de confidentialité</Link>.</li>
          </ul>

          {/* ARTICLE 2 */}
          <h2 className="font-display text-xl font-semibold mt-10 mb-3">Article 2 : Objet</h2>
          <p className="text-muted-foreground mb-4">
            Les présentes CGV encadrent la vente à distance des prestations de conseil et d'accompagnement en stratégie de contenu (One Shot, Wav Academy, Wav Premium), la vente d'analyses automatisées de vidéos et de comptes TikTok (Analyse vidéo, Analyse Express) et la vente de produits numériques téléchargeables (Packs de hooks).
          </p>

          {/* ARTICLE 3 */}
          <h2 className="font-display text-xl font-semibold mt-10 mb-3">Article 3 : Champ d'application</h2>
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
          <h2 className="font-display text-xl font-semibold mt-10 mb-3">Article 4 : Définitions</h2>
          <ul className="text-muted-foreground mb-4 space-y-1">
            <li><strong>Prestations :</strong> One Shot (audit et rendez-vous individuel), Wav Premium (accompagnement individuel de six semaines ou plus), Wav Academy (accompagnement collectif à vie : communauté Discord, lives et contenus numériques), Analyse vidéo et Analyse Express (rapports d'analyse automatisés).</li>
            <li><strong>Produits numériques :</strong> Packs de hooks (fichiers PDF et tableur téléchargeables) vendus séparément, livrés par email automatique après paiement.</li>
            <li><strong>Contenus numériques :</strong> rapports PDF, ressources, checklists et templates éventuellement remis dans le cadre de la prestation.</li>
            <li><strong>Plateformes tierces :</strong> TikTok, Instagram, YouTube, Discord, WhatsApp, Stripe, PayPal, Klarna, Scalapay. Fred Wav n'est pas responsable de leurs pannes, interruptions, changements de conditions d'utilisation, ni des conséquences pouvant en découler.</li>
          </ul>

          {/* ARTICLE 5 */}
          <h2 className="font-display text-xl font-semibold mt-10 mb-3">Article 5 : Description des offres</h2>

          <h3 className="font-display text-lg font-medium mt-4 mb-2">5.1 One Shot</h3>
          <p className="text-muted-foreground mb-4">
            Prestation individuelle à 399 € TTC, sur demande étudiée par Fred Wav : audit complet du compte du Client (TikTok, Instagram ou YouTube) préparé avant le rendez-vous, puis un rendez-vous en visio de 1 h 30 pour fixer la ligne à suivre, traiter les problèmes identifiés et répondre aux questions. Un résumé écrit de l'appel est envoyé dans l'heure qui suit. Des ressources (cours, guides) peuvent être transmises selon les besoins identifiés. Dix démarrages par mois au maximum. Prestation sans garantie de résultat.
          </p>

          <h3 className="font-display text-lg font-medium mt-4 mb-2">5.2 Wav Premium</h3>
          <p className="text-muted-foreground mb-4">
            Accompagnement individuel sur demande validée par Fred Wav, d'une durée de six semaines minimum à partir du premier rendez-vous, à partir de 1 499 € TTC pour six semaines. Des durées de 12 ou 18 semaines peuvent être proposées sur devis ; la durée, le prix et la date de démarrage sont fixés dans la proposition acceptée par le Client. L'accompagnement comprend au moins trois rendez-vous : un premier rendez-vous de 1 h 30, puis un rendez-vous d'une heure tous les quinze jours. Suivi WhatsApp du lundi au vendredi, réponse sous un jour ouvré, et retours sur les contenus à la demande. TikTok, Instagram et YouTube. La Wav Academy et WavStats ne sont pas inclus. Deux démarrages par mois au maximum. Prestation sans garantie de résultat.
          </p>

          <h3 className="font-display text-lg font-medium mt-4 mb-2">5.3 Analyse Express</h3>
          <p className="text-muted-foreground mb-4">
            Analyse automatisée à 19,90 € TTC pour un compte TikTok public, sur les vidéos disponibles, jusqu’à 120. Toutes les sections portent sur le même échantillon, dont le nombre et la période sont indiqués ; les compteurs globaux du profil en sont distingués. Un historique limité est signalé. Un compte privé ou sans vidéo exploitable ne produit pas un rapport présenté comme complet. Le rapport est en général envoyé par email en moins de trois minutes après confirmation du paiement, et en cinq minutes au plus en fonctionnement normal. En cas de dépassement ou d’échec, Fred intervient sous deux jours ouvrés. Si la résolution échoue, il valide le remboursement intégral.
          </p>

          <h3 className="font-display text-lg font-medium mt-4 mb-2">5.4 Analyse vidéo</h3>
          <p className="text-muted-foreground mb-4">
            Analyse automatisée d'une vidéo TikTok publique, à partir de son lien : accroche, structure, message, appel à l'action et recommandations, avec un rapport en ligne et au format PDF envoyé par email. Prix de lancement de 2,90 € TTC jusqu'au {LAUNCH_END_LABEL}, puis 4,90 € TTC. Traitement normal en quelques minutes après confirmation du paiement. En cas d'échec, Fred intervient sous deux jours ouvrés ; si la résolution échoue, il valide le remboursement intégral.
          </p>

          <h3 className="font-display text-lg font-medium mt-4 mb-2">5.5 Wav Academy</h3>
          <p className="text-muted-foreground mb-4">
            Accompagnement collectif à vie sur TikTok, Instagram et YouTube, tant que la Wav Academy existe, en un paiement unique : communauté Discord, cours, guides et ressources, mises à jour comprises, et une stratégie personnalisée travaillée avec le collectif. Prix de lancement de 749 € TTC jusqu'au {LAUNCH_END_LABEL}, puis 990 € TTC. Pas d'accompagnement individuel ; aucun crédit WavStats n'est inclus. Les débutants avec un projet concret sont acceptés. Cinq nouveaux membres par mois au maximum.
          </p>
          <p className="text-muted-foreground mb-4">
            L’accompagnement comprend deux lives par semaine en accès libre, {ACADEMY_LIVE_SLOT} (heure de Paris), et des retours sur le Discord collectif {ACADEMY_SUPPORT_DAYS}. Le week-end est off.
          </p>
          <p className="text-muted-foreground mb-4">
            Les lives sont maintenus ou délégués pendant les congés. Un résumé de chaque live est fourni, ainsi qu'un replay des lives de cours. La Wav Academy est une prestation sans garantie de résultat, notamment en matière d’audience, de visibilité ou de revenus.
          </p>

          <h3 className="font-display text-lg font-medium mt-4 mb-2">5.6 Packs de hooks (fichiers à télécharger)</h3>
          <p className="text-muted-foreground mb-4">
            Contenus numériques vendus à l'unité : Pack 100 hooks (29 € TTC), Pack 250 hooks (49 € TTC), Pack 500 hooks (99 € TTC) et Bibliothèque complète de 850 hooks (149 € TTC). Chaque pack est fourni en deux fichiers, un PDF et un tableur, livrés par email automatique dès la confirmation du paiement, via des liens de téléchargement personnels valables un an. Le Client est invité à télécharger et conserver ses fichiers. Les hooks sont des structures de formulation à adapter : aucune garantie de résultat, de vues, de visibilité ou de revenus n'est donnée. L'achat confère un droit d'usage personnel et non transférable ; la revente, le partage et la rediffusion des fichiers sont interdits.
          </p>

          <h3 className="font-display text-lg font-medium mt-4 mb-2">5.7 Évolution du contenu, prix de lancement et capacité</h3>
          <p className="text-muted-foreground mb-4">
            Le contenu exact des offres (ressources, formats, modalités) est celui présenté au moment de l'achat. Le contenu de la Wav Academy peut évoluer pour s'adapter et s'améliorer (formats, ressources, organisation), sans diminution substantielle de la valeur globale. Les prix peuvent être modifiés pour l'avenir ; le tarif applicable est celui affiché au moment de la commande et reste acquis pour la prestation souscrite. Un prix de lancement s'applique jusqu'à la date indiquée sur le site ; le prix suivant, également indiqué, s'applique ensuite. Le nombre de démarrages par mois indiqué pour chaque accompagnement correspond à une capacité réelle : lorsqu'un mois est complet, une date ultérieure est proposée.
          </p>

          {/* ARTICLE 6 */}
          <h2 className="font-display text-xl font-semibold mt-10 mb-3">Article 6 : Commande et candidature</h2>
          <p className="text-muted-foreground mb-4">
            Le processus de commande suit la règle du "double clic" (sélection, validation des CGV, confirmation de paiement).
            Pour le One Shot et le Wav Premium, le Client adresse d'abord une demande via le formulaire du site. Fred Wav y répond personnellement ; la commande n'est formée qu'après acceptation par le Client de la proposition (offre, prix, date de démarrage) et règlement. En cas de refus de la demande, aucun débit n'est effectué. La Wav Academy s'achète directement en ligne, dans la limite des places du mois de démarrage choisi : la place est réservée pendant le paiement, et la commande est formée à la confirmation du règlement.
          </p>
          <p className="text-muted-foreground mb-4">
            Lorsque l'offre doit être exécutée avant la fin du délai de rétractation, l'acceptation des CGV et la demande d'exécution immédiate font l'objet de cases distinctes, non précochées. Leur texte exact, leur version et leur horodatage sont enregistrés avant la redirection vers le paiement puis rattachés à la commande et à la référence de paiement en ligne ou de virement. Une confirmation est ensuite envoyée par email sur un support durable.
          </p>

          {/* ARTICLE 7 */}
          <h2 className="font-display text-xl font-semibold mt-10 mb-3">Article 7 : Prix et paiement</h2>
          <p className="text-muted-foreground mb-4">
            <strong>Tarifs :</strong> exprimés en euros TTC. Fred Wav se réserve le droit de modifier ses prix à tout moment pour l'avenir. Le tarif applicable est celui affiché au moment de la commande.
          </p>
          <p className="text-muted-foreground mb-4">
            <strong>Paiement :</strong> en ligne via Stripe, selon les moyens proposés lors du paiement (dont, lorsqu'il est proposé, le paiement en plusieurs fois sans frais via Klarna, Scalapay ou PayPal, sous réserve d'acceptation par l'organisme et selon ses conditions), ou par virement pour le One Shot, la Wav Academy et le Wav Premium. Le règlement intégral doit être encaissé avant le démarrage ; en cas de paiement en plusieurs fois, le Vendeur est réglé en une fois par l'organisme, et l'échéancier lie le Client à cet organisme. Les références de facture et de paiement sont conservées. Une preuve d’émission de virement ne vaut pas encaissement.
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
          <h2 className="font-display text-xl font-semibold mt-10 mb-3">Article 8 : Exécution, retards, annulation, report</h2>
          <p className="text-muted-foreground mb-4">
            <strong>Planification :</strong> les sessions visio sont fixées d'un commun accord.
          </p>
          <p className="text-muted-foreground mb-4">
            <strong>Retards :</strong> tout retard du client est décompté du temps de session. La session se termine à l'heure prévue initialement.
          </p>
          <p className="text-muted-foreground mb-4">
            <strong>Annulation et report (rendez-vous One Shot et Wav Premium) :</strong> possible jusqu'à 48h avant le rendez-vous. Passé ce délai, la session est considérée comme due et consommée, sauf cas de force majeure justifié.
          </p>
          <p className="text-muted-foreground mb-4">
            <strong>No-show (absence non justifiée) :</strong> la session est considérée comme due et consommée.
          </p>
          <p className="text-muted-foreground mb-4">
            <strong>Wav Premium :</strong> la durée d'accompagnement est celle de la proposition acceptée (six semaines minimum). Les reports ne prolongent pas automatiquement la durée, sauf accord écrit.
          </p>

          <h3 className="font-display text-lg font-medium mt-4 mb-2">8.1 Caractère forfaitaire et non-remboursement</h3>
          <p className="text-muted-foreground mb-4">
            Toute prestation payée auprès du Vendeur, qu'il s'agisse du One Shot, du Wav Premium, de la Wav Academy, de l'Analyse vidéo ou de l'Analyse Express, constitue un forfait global et indivisible, correspondant à un dispositif construit, réservé et planifié dans son ensemble. Le prix n'est pas décomposable par session, par ressource, par fonctionnalité, par semaine ou par période entamée.
          </p>
          <p className="text-muted-foreground mb-4">
            Sous réserve des droits impératifs du Client, après l'expiration du délai de rétractation ou après sa perte valable dans les conditions de l'Article 9, toute interruption, suspension ou arrêt de la prestation à la seule initiative du Client, pour convenance personnelle, ne donne lieu à aucun remboursement, total ou partiel.
          </p>
          <p className="text-muted-foreground mb-4">
            <strong>Accompagnements individuels (Wav Premium) :</strong> les sessions et ressources déjà délivrées sont définitivement dues. Les sessions non encore consommées restent acquises au Client et disponibles dans la limite de la durée de validité prévue à l'article 8.2 ci-dessous, sans pouvoir donner lieu à un remboursement en numéraire.
          </p>
          <p className="text-muted-foreground mb-4">
            <strong>Wav Academy : paiement unique, accès à vie :</strong> le prix est réglé intégralement avant démarrage, sans abonnement ni reconduction. Hors droits impératifs du client, une interruption pour convenance personnelle n’entraîne pas de remboursement au prorata du niveau d’utilisation. Cette clause ne limite ni la rétractation prévue à l’article 9.3 ni les recours en cas de manquement du vendeur.
          </p>
          <p className="text-muted-foreground mb-4">
            <strong>Prestations à livraison numérique immédiate (Analyse vidéo, Analyse Express) :</strong> le rapport et les contenus délivrés sont définitivement dus dès leur mise à disposition lorsque le Client a expressément demandé l'exécution immédiate et préalablement reconnu la perte de son droit de rétractation dans les conditions de l'article 9.2.
          </p>
          <p className="text-muted-foreground mb-4">
            <strong>Packs de hooks :</strong> les fichiers sont définitivement dus dès l'envoi de l'email automatique de livraison, dans les conditions de l'article 9.4. Aucun remboursement, total ou partiel, n'est accordé après cet envoi, sauf manquement du Vendeur ou fichiers non conformes.
          </p>
          <p className="text-muted-foreground mb-4">
            La présente clause ne s'applique pas lorsque l'interruption résulte d'un manquement du Vendeur à ses obligations. Dans ce cas, les dispositions de l'Article 10 s'appliquent.
          </p>

          <h3 className="font-display text-lg font-medium mt-4 mb-2">8.2 Durée de validité (accompagnements individuels à durée déterminée)</h3>
          <p className="text-muted-foreground mb-4">
            L'accompagnement individuel à durée déterminée (Wav Premium), hors suspension prévue à l'article 8.3, doit être pleinement réalisé dans la durée prévue par la proposition acceptée, à compter de la date du premier rendez-vous. Le rendez-vous du One Shot doit être réalisé dans les trois mois suivant le paiement. Passé ces délais, les sessions non consommées du fait du Client sont caduques et ne peuvent donner lieu ni à exécution ni à remboursement. Un report imputable au Vendeur prolonge ces délais d'autant.
          </p>

          <h3 className="font-display text-lg font-medium mt-4 mb-2">8.3 Suspension à la demande du Client (accompagnements individuels)</h3>
          <p className="text-muted-foreground mb-4">
            À titre exceptionnel, le Client peut demander la suspension temporaire de son accompagnement individuel à durée déterminée. Cette suspension est soumise à l'accord écrit préalable du Vendeur.
          </p>
          <p className="text-muted-foreground mb-4">
            La demande s'effectue par écrit. Le Client peut bénéficier d'une seule suspension, d'une durée maximale de 30 jours. Pendant la suspension, le décompte de la durée prévue à l'article 8.2 est gelé et reprend à la date de reprise convenue.
          </p>
          <p className="text-muted-foreground mb-4">
            La suspension est formalisée par email valant support durable, précisant la date de début de suspension et la nouvelle date de fin d'accompagnement. La suspension ne donne lieu à aucun remboursement et ne modifie pas la durée de validité maximale prévue à l'article 8.2.
          </p>
          <p className="text-muted-foreground mb-4">
            Pour la suspension d'une formule Wav Academy, se reporter à l'Article 12.
          </p>

          {/* ARTICLE 9 */}
          <h2 className="font-display text-xl font-semibold mt-10 mb-3">Article 9 : Droit de rétractation (B2C uniquement)</h2>
          <p className="text-muted-foreground mb-4">
            Conformément à l'article L221-18 du Code de la consommation, le client consommateur dispose de 14 jours pour se rétracter, sauf exceptions.
          </p>

          <h3 className="font-display text-lg font-medium mt-4 mb-2">9.1 Démarrage avant la fin des 14 jours (One Shot, Wav Premium)</h3>
          <p className="text-muted-foreground mb-4">
            Si le Client demande expressément le démarrage du One Shot ou de l'accompagnement Wav Premium avant la fin du délai de 14 jours, l'exécution peut commencer sans attendre l'expiration de ce délai.
          </p>
          <p className="text-muted-foreground mb-4">
            Si le Client se rétracte alors que l'exécution a commencé à sa demande, il reste redevable uniquement d'un montant proportionné au service effectivement fourni jusqu'à la notification de sa décision, rapporté au prix total convenu, conformément à l'article L221-25 du Code de la consommation. Si la prestation est pleinement exécutée avant la fin du délai de 14 jours, le droit de rétractation n'est perdu qu'après demande expresse d'exécution et reconnaissance préalable de cette perte.
          </p>

          <h3 className="font-display text-lg font-medium mt-4 mb-2">9.2 Exécution et livraison immédiates (Analyse vidéo, Analyse Express)</h3>
          <p className="text-muted-foreground mb-2">
            L'Analyse vidéo et l'Analyse Express sont des prestations automatisées aboutissant à la mise à disposition rapide d'un rapport numérique. Avant le paiement, le Client :
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
            La Wav Academy combine un <strong>contenu numérique</strong> (cours, guides et ressources accessibles à la date convenue) et une <strong>prestation de service</strong> exécutée dans la durée (lives, accompagnement, animation de la communauté Discord). Le démarrage intervient à la date convenue avec Fred, après règlement intégral et acceptation des modalités. Si cette date précède la fin du délai de 14 jours, le Client demande expressément le commencement anticipé du service et l’accès au contenu numérique à cette date. À défaut, le démarrage est fixé après le délai légal. En conséquence, conformément aux articles L221-28, 1° et 13° du Code de la consommation :
          </p>
          <ul className="text-muted-foreground mb-4 space-y-1">
            <li>pour la part de <strong>contenu numérique</strong>, le Client perd son droit de rétractation dès le début de l'accès, après l'avoir expressément demandé et avoir expressément reconnu la perte de ce droit ;</li>
            <li>pour la part de <strong>service</strong>, en cas de rétractation dans le délai de 14 jours, le Client reste redevable du prix au prorata du service déjà fourni à la date de sa demande.</li>
          </ul>
          <p className="text-muted-foreground mb-4">
            La Wav Academy est un paiement unique, sans reconduction, donnant accès aux services et contenus dans les conditions de l’article 12. Cette règle reste sans préjudice du droit de rétractation et du prorata légal décrits ci-dessus.
          </p>

          <h3 className="font-display text-lg font-medium mt-4 mb-2">9.4 Contenu numérique livré immédiatement (Packs de hooks)</h3>
          <p className="text-muted-foreground mb-2">
            Les Packs de hooks sont des contenus numériques non fournis sur support matériel, livrés automatiquement par email dès la confirmation du paiement. Avant le paiement, le Client coche une case distincte, non précochée, par laquelle il :
          </p>
          <ul className="text-muted-foreground mb-4 space-y-1">
            <li>accepte les présentes CGV ;</li>
            <li>demande expressément l'envoi immédiat des fichiers avant la fin du délai de 14 jours ;</li>
            <li>renonce expressément à son droit de rétractation dès cet envoi.</li>
          </ul>
          <p className="text-muted-foreground mb-4">
            Conformément à l'article L221-28, 13° du Code de la consommation, <strong>aucune rétractation n'est possible dès l'envoi de l'email automatique de livraison</strong> contenant les liens de téléchargement : la commande est alors définitivement due, qu'elle soit ou non téléchargée. Le texte exact accepté, sa version, l'horodatage et la référence de paiement sont récapitulés dans cet email, qui vaut support durable. Si, pour une raison technique, aucun email de livraison n'a été envoyé, le droit de rétractation reste entier et le Client est remboursé ou livré à son choix.
          </p>

          <h3 className="font-display text-lg font-medium mt-4 mb-2">9.5 Confirmation sur support durable</h3>
          <p className="text-muted-foreground mb-4">
            Après la commande, le vendeur adresse au Client une confirmation par email (support durable) récapitulant la commande, la version des CGV acceptées et le texte exact des consentements donnés au démarrage ou à la livraison immédiate.
          </p>

          <h3 className="font-display text-lg font-medium mt-4 mb-2">9.6 Modalités d'exercice</h3>
          <p className="text-muted-foreground mb-4">
            Le Client peut notifier sa décision sans justification au moyen de la{" "}
            <Link to="/retractation" className="text-primary underline">fonctionnalité de rétractation en ligne</Link>,
            du formulaire modèle en Annexe 1 ou d'un email dénué d'ambiguïté adressé à{" "}
            <a href="mailto:contact@fredwav.com" className="text-primary underline">contact@fredwav.com</a>.
            La fonctionnalité en ligne délivre immédiatement une référence horodatée. Un accusé de réception est adressé par email ; en cas d'incident de messagerie, son état est conservé pour permettre une relance sans recréer la demande. La date d'envoi de la notification est prise en compte pour apprécier le respect du délai.
          </p>

          {/* ARTICLE 10 */}
          <h2 className="font-display text-xl font-semibold mt-10 mb-3">Article 10 : Responsabilité et limitation</h2>
          <p className="text-muted-foreground mb-4">
            Fred Wav est tenu à une obligation de moyens, pas de résultat.
            Il ne peut être tenu responsable des changements d'algorithme, des bannissements de compte, des décisions de modération, des pannes de plateformes tierces, ni du manque de mise en application des conseils par le client.
          </p>
          <p className="text-muted-foreground mb-4">
            À l'égard des clients professionnels, la responsabilité totale de Fred Wav, lorsqu'elle est retenue, est limitée au montant effectivement payé pour la prestation litigieuse, sauf faute lourde ou dolosive. À l'égard des clients consommateurs, aucune limitation n'est opposée au droit à réparation du préjudice résultant d'un manquement du Vendeur.
          </p>

          <h3 className="font-display text-lg font-medium mt-4 mb-2">Garanties légales (B2C)</h3>
          <p className="text-muted-foreground mb-4">
            Le client consommateur bénéficie de la garantie légale de conformité des contenus et services numériques (articles L224-25-12 et suivants du Code de la consommation) pour les rapports d'analyse, les Packs de hooks et les contenus de la Wav Academy, et, le cas échéant, de la garantie des vices cachés (articles 1641 et suivants du Code civil). En cas de défaut de conformité, il peut obtenir la mise en conformité ou, à défaut, une réduction du prix ou la résolution du contrat. Ces garanties s'exercent auprès de <a href="mailto:contact@fredwav.com" className="text-primary underline">contact@fredwav.com</a>.
          </p>

          {/* ARTICLE 11 */}
          <h2 className="font-display text-xl font-semibold mt-10 mb-3">Article 11 : Propriété intellectuelle</h2>
          <p className="text-muted-foreground mb-4">
            L'ensemble des ressources (méthodes, rapports, PDF, templates) est la propriété exclusive de Fred Wav. Le client dispose d'un droit d'usage personnel et non cessible.
            La revente ou la diffusion des méthodes et contenus entraîne une résiliation immédiate sans remboursement. Le vendeur se réserve le droit d'engager toute action utile (civile et, le cas échéant, pénale) en fonction des faits constatés.
          </p>

          {/* ARTICLE 12 */}
          <h2 className="font-display text-xl font-semibold mt-10 mb-3">Article 12 : Wav Academy (accès à vie, inscriptions antérieures, suspension)</h2>

          <h3 className="font-display text-lg font-medium mt-4 mb-2">12.1 Offre</h3>
          <p className="text-muted-foreground mb-4">
            La Wav Academy est proposée en un règlement unique, sans abonnement ni reconduction : <strong>749 € TTC jusqu'au {LAUNCH_END_LABEL}</strong> (prix de lancement), puis 990 € TTC. La date de début est convenue avec le Client. Aucun accès n’est ouvert avant la confirmation du règlement.
          </p>
          <p className="text-muted-foreground mb-4">
            Les inscriptions antérieures au 17 octobre 2026 conservent leurs conditions, durées, échéances et avantages d’origine, sauf accord écrit et explicite du Client pour passer à l’offre décrite au présent article.
          </p>

          <h3 className="font-display text-lg font-medium mt-4 mb-2">12.2 Accès à vie</h3>
          <p className="text-muted-foreground mb-4">
            « À vie » signifie que l’accès à la communauté, aux lives, aux cours, aux ressources et à leurs mises à jour n’a pas de date de fin et ne nécessite aucun paiement supplémentaire, aussi longtemps que la Wav Academy est exploitée. Le droit d’accès est personnel, nominatif et non transférable.
          </p>
          <p className="text-muted-foreground mb-4">
            L’accès aux contenus numériques compris dans l’offre au jour de la commande est en tout état de cause garanti pendant cinq ans à compter de la commande.
          </p>
          <p className="text-muted-foreground mb-4">
            En cas d’arrêt définitif de la Wav Academy, les membres sont informés au moins trois mois à l’avance. Une copie téléchargeable des contenus concernés est proposée lorsque cela est techniquement et juridiquement possible ; à défaut, et si l’arrêt intervient pendant la période garantie de cinq ans, une solution compensatoire adaptée est proposée.
          </p>

          <h3 className="font-display text-lg font-medium mt-4 mb-2">12.3 Périmètre</h3>
          <p className="text-muted-foreground mb-4">
            L’offre n’inclut ni accompagnement individuel, ni crédits WavStats, ni les futurs programmes ou services commercialisés séparément (One Shot, Wav Premium, Packs de hooks, analyses).
          </p>

          <h3 className="font-display text-lg font-medium mt-4 mb-2">12.4 Suspension</h3>
          <p className="text-muted-foreground mb-4">
            L’accès peut être suspendu en cas de partage de compte, de reproduction ou diffusion non autorisée des contenus, de fraude ou de manquement grave aux présentes conditions, après information du Client lorsque les circonstances le permettent. Les mesures prises restent proportionnées au manquement et sans préjudice des droits impératifs du Client.
          </p>

          {/* ARTICLE 13 */}
          <h2 className="font-display text-xl font-semibold mt-10 mb-3">Article 13 : Médiation (B2C)</h2>
          <p className="text-muted-foreground mb-2">
            En cas de litige non résolu par le service client (<a href="mailto:contact@fredwav.com" className="text-primary underline">contact@fredwav.com</a>), et après réclamation écrite préalable, le client consommateur peut saisir le médiateur :
          </p>
          <ul className="text-muted-foreground mb-4 list-none pl-0 space-y-1">
            <li><strong>SAS Médiation Solution Conso</strong></li>
            <li>Adresse : 222 chemin de la Bergerie, 01800 Saint Jean de Niost, France</li>
            <li>Email : <a href="mailto:contact@sasmediationsolution-conso.fr" className="text-primary underline">contact@sasmediationsolution-conso.fr</a></li>
            <li>Téléphone : +33 (0)4 82 53 93 06</li>
            <li>Site : <a href="https://www.sasmediationsolution-conso.fr" className="text-primary underline" target="_blank" rel="noopener noreferrer">www.sasmediationsolution-conso.fr</a></li>
          </ul>
          <p className="text-muted-foreground mb-4">
            Modalités : saisie via le formulaire disponible sur le site du médiateur.
          </p>

          {/* ARTICLE 14 */}
          <h2 className="font-display text-xl font-semibold mt-10 mb-3">Article 14 : Droit applicable et juridiction</h2>
          <p className="text-muted-foreground mb-4">
            Les CGV sont soumises au droit français.
            En cas de litige avec un professionnel, le Tribunal de Commerce de Poitiers (86) sera seul compétent.
            En cas de litige avec un consommateur, les juridictions compétentes seront déterminées conformément aux règles applicables du Code de la consommation et du Code de procédure civile.
          </p>

          {/* ARTICLE 15 */}
          <h2 className="font-display text-xl font-semibold mt-10 mb-3">Article 15 : Plateforme européenne de règlement en ligne des litiges (ODR/RLL)</h2>
          <p className="text-muted-foreground mb-4">
            La plateforme européenne de règlement en ligne des litiges (ODR/RLL) est fermée depuis le 20 juillet 2025.
          </p>

          {/* ANNEXE 1 */}
          <h2 className="font-display text-xl font-semibold mt-14 mb-3 border-t pt-8">Annexe 1 : Formulaire de rétractation (modèle)</h2>
          <p className="text-muted-foreground mb-4 text-sm italic">
            (À utiliser si vous souhaitez vous rétracter dans le délai légal, sous réserve des exceptions applicables. Vous pouvez l'envoyer à <a href="mailto:contact@fredwav.com" className="text-primary underline">contact@fredwav.com</a> ou utiliser la <Link to="/retractation" className="text-primary underline">fonctionnalité en ligne</Link>.)
          </p>
          <div className="bg-muted/50 rounded-lg p-4 mb-4 space-y-2 text-sm text-muted-foreground">
            <p>À l'attention de Frédéric Olalde (Fred Wav), 2 route de Malagué, 86270 Coussay-les-Bois.</p>
            <p>Je vous notifie par la présente ma rétractation du contrat portant sur la prestation : ___</p>
            <p>Commandée le : ___</p>
            <p>Nom du client : ___</p>
            <p>Adresse du client : ___</p>
            <p>Signature (si format papier) : ___</p>
            <p>Date : ___</p>
          </div>

          {/* ANNEXE 2 */}
          <h2 className="font-display text-xl font-semibold mt-14 mb-3 border-t pt-8">Annexe 2 : Consentements express (cases à cocher au checkout)</h2>
          <div className="bg-muted/50 rounded-lg p-4 mb-4 space-y-3 text-sm text-muted-foreground">
            <p>☐ J'ai lu et j'accepte les Conditions Générales de Vente.</p>
            <p>☐ (One Shot, Wav Premium) Je demande expressément l'exécution de la prestation avant la fin du délai légal de rétractation de 14 jours. En cas de rétractation après le début de l'exécution, je resterai redevable du montant proportionné au service effectivement fourni ; si la prestation est pleinement exécutée, je reconnais perdre mon droit de rétractation.</p>
            <p>☐ (Analyse vidéo, Analyse Express) Je demande expressément l'exécution immédiate de l'analyse avant la fin du délai de 14 jours et je reconnais perdre mon droit de rétractation lorsque la prestation est pleinement exécutée et le rapport mis à disposition.</p>
            <p>☐ (Wav Academy) Je demande l’exécution du service et l’accès au contenu numérique à la date convenue avant l'expiration du délai de rétractation de 14 jours. Je reconnais que pour le contenu numérique, je perds mon droit de rétractation dès l'accès ; pour la partie service, en cas de rétractation, je reste redevable du prix au prorata du service déjà fourni.</p>
            <p>☐ (Packs de hooks) J'accepte les CGV. Je demande l'envoi immédiat des fichiers par email, avant la fin du délai de rétractation de 14 jours, et je renonce expressément à mon droit de rétractation dès cet envoi.</p>
          </div>
        </div>
      </Section>
    </Layout>
  );
}
