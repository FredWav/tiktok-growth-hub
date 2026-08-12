import { Link } from "react-router-dom";
import { AlertTriangle, CheckCircle2 } from "lucide-react";
import {
  ArticleSection,
  DiagnosticGrid,
  ExampleDataChart,
  InlineExpressCta,
  NumberedSteps,
  ResourceArticle,
  type RelatedResource,
  type ResourceFaqItem,
} from "@/components/resources/ResourceArticle";

const faq: ResourceFaqItem[] = [
  {
    question: "Quelle est la statistique TikTok la plus importante ?",
    answer:
      "Il n’existe pas une métrique reine pour toutes les vidéos. Pour une vidéo de découverte, commence par la rétention au début et le temps moyen de visionnage. Pour un contenu qui doit provoquer une action, ajoute les visites de profil, commentaires, partages ou clics pertinents. La bonne statistique dépend de l’objectif du contenu.",
  },
  {
    question: "Quel est un bon taux de complétion sur TikTok ?",
    answer:
      "Un taux isolé ne permet pas de répondre correctement : une vidéo de 8 secondes et une vidéo de 70 secondes ne jouent pas dans la même catégorie. Compare d’abord des vidéos de durée et de format proches sur ton propre compte, puis observe si la complétion progresse lorsque tu modifies une variable.",
  },
  {
    question: "Pourquoi une vidéo avec beaucoup de likes peut-elle faire peu de vues ?",
    answer:
      "Les likes viennent des personnes qui sont restées assez longtemps pour réagir. Ils ne décrivent pas forcément ce qui s’est passé auprès de tous ceux qui ont vu les premières secondes. Une accroche faible ou une chute rapide peut limiter la diffusion même si le petit groupe resté jusqu’au bout apprécie la vidéo.",
  },
  {
    question: "Combien de vidéos faut-il comparer ?",
    answer:
      "Évite de conclure à partir d’une seule publication. Commence par un groupe de cinq à dix vidéos comparables, puis repère les écarts récurrents. Plus les sujets, durées et formats sont proches, plus la comparaison peut t’apprendre quelque chose.",
  },
  {
    question: "À quelle fréquence faut-il regarder ses statistiques ?",
    answer:
      "Regarde-les assez tard pour laisser les données se stabiliser, puis à intervalles fixes. Le plus utile est une revue hebdomadaire : tu compares les contenus de la période, notes une hypothèse et choisis un test pour la semaine suivante, au lieu de rafraîchir les vues toutes les dix minutes.",
  },
];

const related: RelatedResource[] = [
  {
    href: "/ressources/vues-tiktok",
    title: "Pourquoi mes TikTok font peu de vues ?",
    description: "Transforme tes métriques en diagnostic quand la diffusion semble bloquée.",
  },
  {
    href: "/ressources/retention-tiktok",
    title: "Comprendre la rétention TikTok",
    description: "Apprends à lire la courbe et à localiser la partie de la vidéo qui perd l’audience.",
  },
  {
    href: "/hooks-tiktok",
    title: "Hooks TikTok classés par famille",
    description: "Travaille les premières secondes avec des structures à adapter à ton sujet.",
    label: "Bibliothèque de hooks",
  },
  {
    href: "/preuves",
    title: "Voir des résultats documentés",
    description: "Découvre des cas contextualisés avant de choisir la prochaine étape de ton diagnostic.",
    label: "Résultats",
  },
];

export default function RessourceStatistiquesTikTok() {
  return (
    <ResourceArticle
      path="/ressources/statistiques-tiktok"
      slug="statistiques_tiktok"
      eyebrow="Statistiques TikTok"
      title="Statistiques TikTok : comprendre les métriques et savoir quoi corriger"
      introduction="Tes statistiques ne sont pas un bulletin de notes. Elles racontent où l’attention se gagne, où elle se perd et quelle décision tester ensuite. Voici comment les lire sans inventer de règle universelle."
      readingTime="9 min"
      experienceNote="Dans mes audits, l’erreur la plus fréquente n’est pas de manquer de chiffres : c’est de comparer des vidéos qui n’ont ni la même durée, ni le même objectif, puis d’en tirer une règle générale. Je commence toujours par former un groupe de contenus réellement comparables."
      faq={faq}
      related={related}
    >
      <ArticleSection
        title="La réponse courte : lis tes statistiques dans un ordre précis"
        intro="Commence par le comportement de visionnage, puis cherche les actions produites. Un nombre de vues seul ne dit ni pourquoi la vidéo a été regardée, ni si elle a rempli son objectif."
      >
        <p>
          Une bonne lecture commence par quatre questions : les personnes se sont-elles arrêtées ? Combien de temps sont-elles restées ? Jusqu’où sont-elles allées ? Qu’ont-elles fait ensuite ? Cet ordre évite de célébrer un taux de likes sans voir une chute immédiate, ou de condamner une vidéo utile simplement parce qu’elle n’a pas atteint un grand volume.
        </p>
        <DiagnosticGrid
          items={[
            {
              title: "Rétention au démarrage",
              description: "Elle indique si les premières secondes donnent une raison claire de rester.",
              signal: "une chute brutale avant que la promesse soit comprise.",
            },
            {
              title: "Temps moyen de visionnage",
              description: "Il remet la consommation réelle en regard de la durée totale de la vidéo.",
              signal: "un temps moyen très inférieur au moment où arrive l’information principale.",
            },
            {
              title: "Taux de complétion",
              description: "Il mesure la part des personnes arrivées au bout, mais doit toujours être comparé à durée équivalente.",
              signal: "un écart répété entre deux vidéos construites de la même manière.",
            },
            {
              title: "Actions après visionnage",
              description: "Partages, commentaires, visites de profil ou clics montrent ce que le contenu a déclenché.",
              signal: "une action cohérente avec l’objectif annoncé avant la publication.",
            },
          ]}
        />
        <ExampleDataChart
          title="Exemple de lecture d’un parcours de visionnage"
          description="Les pourcentages diminuent au fil d’une vidéo fictive. La perte la plus nette se situe avant trois secondes : c’est la première zone à examiner."
          points={[
            { label: "Départ", value: 100 },
            { label: "3 secondes", value: 62 },
            { label: "Milieu", value: 38 },
            { label: "Fin", value: 21 },
          ]}
        />
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5 text-amber-950">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 shrink-0 mt-0.5 text-amber-700" />
            <p className="text-sm leading-relaxed">
              <strong>À éviter :</strong> additionner toutes ces métriques pour fabriquer un score magique. Une vidéo peut être très bonne pour qualifier une petite audience et médiocre pour toucher largement. L’objectif décide de la lecture.
            </p>
          </div>
        </div>
        <InlineExpressCta sourcePage="/ressources/statistiques-tiktok" contentSlug="statistiques_tiktok" />
      </ArticleSection>

      <ArticleSection
        variant="cream"
        title="Les quatre métriques à relier au lieu de les isoler"
        intro="Chaque indicateur répond à une question différente. C’est leur enchaînement qui permet de formuler une hypothèse utile."
      >
        <h3 className="font-display text-2xl font-semibold">1. Le temps de visionnage mesure une durée, pas une qualité absolue</h3>
        <p>
          Un temps moyen de six secondes n’a pas le même sens sur une vidéo de huit secondes et sur une vidéo d’une minute. Commence toujours par le rapprocher de la durée totale, puis regarde où se situe l’information importante. Si la réponse arrive à la vingtième seconde mais que l’audience part à la sixième, le problème est probablement structurel avant d’être algorithmique.
        </p>
        <h3 className="font-display text-2xl font-semibold">2. La rétention montre le moment de la perte</h3>
        <p>
          La moyenne lisse les comportements. La courbe, elle, révèle les ruptures : départ dès l’ouverture, creux pendant une explication, regain sur une démonstration. Elle t’aide à désigner une séquence précise à raccourcir, déplacer ou clarifier. Pour approfondir, consulte le guide sur la <Link className="text-primary underline underline-offset-4 hover:no-underline" to="/ressources/retention-tiktok">rétention TikTok</Link>.
        </p>
        <h3 className="font-display text-2xl font-semibold">3. La complétion dépend fortement de la durée</h3>
        <p>
          Plus une vidéo est courte, plus terminer demande peu d’effort. Ne compare donc pas directement un format de dix secondes avec un tutoriel de quatre-vingt-dix secondes. Crée plutôt des familles : vidéos courtes de découverte, explications intermédiaires, contenus longs. Cherche ensuite ce qui distingue les meilleures vidéos à l’intérieur de chaque famille.
        </p>
        <h3 className="font-display text-2xl font-semibold">4. L’engagement doit correspondre à l’intention</h3>
        <p>
          Un partage signale souvent une utilité ou une identification. Un commentaire peut révéler une question, un désaccord ou une conversation. Une visite de profil suggère que la vidéo a créé assez de curiosité pour aller plus loin. Aucun de ces gestes n’est automatiquement supérieur aux autres : choisis celui qui correspond au rôle de la publication.
        </p>
      </ArticleSection>

      <ArticleSection
        title="Une routine hebdomadaire pour transformer les chiffres en décisions"
        intro="La valeur ne vient pas du tableau de bord. Elle vient de la prochaine action que tu es capable d’en tirer."
      >
        <NumberedSteps
          items={[
            {
              title: "Regroupe des vidéos comparables",
              description: "Même objectif, format proche et durée voisine. Tu réduis ainsi les explications concurrentes.",
            },
            {
              title: "Repère un écart récurrent",
              description: "Cherche un comportement qui revient sur plusieurs contenus : chute au démarrage, maintien au milieu ou actions fortes en fin de vidéo.",
            },
            {
              title: "Écris une hypothèse simple",
              description: "Exemple : « ma promesse arrive trop tard » est testable. « TikTok ne montre plus mon compte » ne l’est pas avec ces seules données.",
            },
            {
              title: "Change une seule variable",
              description: "Avance le résultat, raccourcis l’introduction ou change le hook, mais ne modifie pas tout en même temps.",
            },
            {
              title: "Répète avant de conclure",
              description: "Un seul contenu peut être atypique. Trois essais cohérents donnent déjà une base plus utile pour décider.",
            },
          ]}
        />
      </ArticleSection>

      <ArticleSection
        variant="cream"
        title="Exemple de lecture : une vidéo qui plaît aux personnes restées, mais en perd trop au début"
        intro="Cet exemple pédagogique reproduit un schéma fréquent ; il ne présente pas un résultat client ni une norme TikTok."
      >
        <p>
          Imaginons une vidéo dont les commentaires sont précis et positifs, avec plusieurs partages, mais dont la courbe chute fortement avant que le sujet soit formulé. La conclusion « le contenu est bon, TikTok le bloque » va trop loin. Les actions montrent que le contenu aide certaines personnes ; la chute suggère que beaucoup n’ont jamais compris assez vite pourquoi elles devaient rester.
        </p>
        <div className="grid sm:grid-cols-3 gap-4 my-8">
          {[
            ["Observation", "Une perte nette avant l’annonce du bénéfice."],
            ["Hypothèse", "L’ouverture installe le contexte trop longtemps."],
            ["Test", "Annoncer le résultat dès la première phrase, sans changer le corps."],
          ].map(([label, text]) => (
            <div key={label} className="rounded-2xl border border-border bg-background p-5">
              <p className="text-xs font-semibold uppercase tracking-wider text-primary mb-2">{label}</p>
              <p className="text-sm text-muted-foreground leading-relaxed">{text}</p>
            </div>
          ))}
        </div>
        <p>
          Si la rétention de départ progresse sur plusieurs essais comparables, l’hypothèse devient crédible. Si elle ne bouge pas, tu n’as pas échoué : tu as éliminé une explication et tu peux examiner l’image d’ouverture, la précision du sujet ou l’adéquation avec l’audience.
        </p>
      </ArticleSection>

      <ArticleSection title="Ce que tes statistiques ne peuvent pas prouver seules">
        <ul className="space-y-4">
          {[
            "Elles ne prouvent pas qu’un algorithme te pénalise personnellement.",
            "Elles ne prédisent pas combien de vues obtiendra la prochaine publication.",
            "Elles ne remplacent pas le contexte du sujet, de l’audience et de ton objectif.",
            "Elles ne transforment pas une corrélation en cause certaine.",
          ].map((item) => (
            <li key={item} className="flex items-start gap-3">
              <CheckCircle2 className="h-5 w-5 shrink-0 mt-0.5 text-primary" />
              <span>{item}</span>
            </li>
          ))}
        </ul>
        <p>
          Leur vraie force est plus modeste et plus utile : elles réduisent le flou. Elles t’aident à choisir une hypothèse, concevoir un test et apprendre de ce que tu publies au lieu de repartir de zéro.
        </p>
      </ArticleSection>
    </ResourceArticle>
  );
}
