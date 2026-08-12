import { Link } from "react-router-dom";
import { ArrowDownRight, CheckCircle2, Gauge, Repeat2 } from "lucide-react";
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
    question: "Qu’est-ce que la rétention sur TikTok ?",
    answer:
      "La rétention décrit la part de l’audience encore présente au fil de la vidéo. Elle permet de voir où les personnes quittent le contenu. Le temps moyen de visionnage en donne un résumé ; la courbe montre les moments précis de perte ou de regain d’attention.",
  },
  {
    question: "Quel est un bon taux de rétention TikTok ?",
    answer:
      "Il n’existe pas un seuil valable pour toutes les vidéos. La durée, le format, le sujet et le public changent la lecture. Compare des contenus similaires de ton compte et cherche une progression répétée lorsque tu testes une modification précise.",
  },
  {
    question: "Comment améliorer la rétention dans les trois premières secondes ?",
    answer:
      "Rends le sujet immédiatement visible, retire le préambule, aligne l’image avec les premiers mots et annonce une promesse spécifique que la suite peut tenir. Modifie ensuite seulement cette ouverture sur plusieurs contenus comparables pour mesurer l’effet.",
  },
  {
    question: "Une vidéo courte a-t-elle toujours une meilleure rétention ?",
    answer:
      "Elle est plus facile à terminer, mais cela ne la rend pas automatiquement meilleure. Une vidéo longue peut retenir si elle progresse, apporte des preuves et renouvelle l’attention. Choisis la durée nécessaire à la promesse, puis retire ce qui ne la sert pas.",
  },
  {
    question: "Faut-il chercher une boucle parfaite à la fin de chaque TikTok ?",
    answer:
      "Une boucle peut provoquer un nouveau visionnage lorsqu’elle est naturelle, mais elle ne corrige pas une ouverture faible ni un corps confus. Utilise-la seulement si elle sert le contenu. La priorité reste de délivrer clairement ce qui a été promis.",
  },
];

const related: RelatedResource[] = [
  {
    href: "/ressources/statistiques-tiktok",
    title: "Comprendre toutes ses statistiques TikTok",
    description: "Replace la rétention parmi les autres métriques et relie-la à l’objectif de ta vidéo.",
  },
  {
    href: "/ressources/vues-tiktok",
    title: "Diagnostiquer un faible nombre de vues",
    description: "Utilise la rétention sans réduire toute la diffusion à un seul indicateur.",
  },
  {
    href: "/hooks-tiktok",
    title: "Travailler ses premières secondes",
    description: "Choisis une famille de hooks cohérente avec le sujet et la promesse de ta vidéo.",
    label: "Bibliothèque de hooks",
  },
  {
    href: "/preuves",
    title: "Voir des résultats documentés",
    description: "Découvre des cas contextualisés avant de choisir la prochaine étape de ton diagnostic.",
    label: "Résultats",
  },
];

export default function RessourceRetentionTikTok() {
  return (
    <ResourceArticle
      path="/ressources/retention-tiktok"
      slug="retention_tiktok"
      eyebrow="Rétention TikTok"
      title="Rétention TikTok : comprendre le taux de complétion et l’améliorer"
      introduction="La rétention ne te dit pas seulement combien de temps une vidéo a été regardée. Elle montre le moment où la promesse cesse de tenir l’attention — et t’aide à choisir la séquence précise à retravailler."
      readingTime="11 min"
      experienceNote="Pour relire une courbe de rétention, je replace le script et le montage à côté des données. Une chute devient utile seulement quand on peut la relier à une phrase, une transition ou une information arrivée trop tard, puis tester une version différente."
      faq={faq}
      related={related}
    >
      <ArticleSection
        title="La réponse courte : la rétention est une courbe, pas une note"
        intro="Elle décrit la part de personnes encore présentes à chaque moment de la vidéo. Une baisse est normale ; sa forme et son emplacement sont les éléments vraiment utiles."
      >
        <p>
          Toute vidéo perd des spectateurs. Le but n’est pas de créer une ligne parfaitement plate, mais de comprendre si l’audience part avant d’avoir identifié le sujet, pendant une séquence qui ralentit ou juste après avoir obtenu la réponse. Chaque scénario suggère un test différent.
        </p>
        <DiagnosticGrid
          items={[
            {
              title: "Chute immédiate",
              description: "Le sujet, l’image ou la première phrase ne donne pas assez vite une raison de rester.",
              signal: "la perte arrive avant que la promesse soit clairement formulée.",
            },
            {
              title: "Pente régulière",
              description: "Le contenu avance peut-être sans renouveler suffisamment l’intérêt ou la preuve.",
              signal: "aucun moment précis ne casse la courbe, mais chaque seconde coûte de l’audience.",
            },
            {
              title: "Décrochage au milieu",
              description: "Une transition, une répétition ou une explication trop longue peut interrompre la progression.",
              signal: "une rupture nette au moment d’un changement de séquence.",
            },
            {
              title: "Regain ou revisionnage",
              description: "Une démonstration, une phrase ou une boucle peut inciter à revoir une partie du contenu.",
              signal: "un passage mieux retenu que les secondes qui l’entourent.",
            },
          ]}
        />
        <ExampleDataChart
          title="Exemple de courbe avec une chute d’ouverture"
          description="Les données fictives montrent une chute nette au début, puis une pente plus stable. Le premier test doit porter sur la compréhension immédiate, pas sur toute la vidéo."
          points={[
            { label: "Départ", value: 100 },
            { label: "2 secondes", value: 59 },
            { label: "Preuve", value: 47 },
            { label: "Milieu", value: 39 },
            { label: "Fin", value: 24 },
          ]}
        />
        <InlineExpressCta sourcePage="/ressources/retention-tiktok" contentSlug="retention_tiktok" />
      </ArticleSection>

      <ArticleSection
        variant="cream"
        title="Rétention, temps moyen et complétion : trois lectures différentes"
        intro="Ces métriques parlent toutes du visionnage, mais elles ne répondent pas à la même question."
      >
        <div className="space-y-5">
          <div className="rounded-2xl border border-border bg-background p-6">
            <div className="flex items-start gap-4">
              <Gauge className="h-6 w-6 shrink-0 text-primary mt-1" />
              <div>
                <h3 className="font-display text-xl font-semibold mb-2">Le temps moyen résume la consommation</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">Il indique combien de temps la vidéo a été regardée en moyenne. Utile pour comparer, il masque cependant le moment exact où l’audience est partie.</p>
              </div>
            </div>
          </div>
          <div className="rounded-2xl border border-border bg-background p-6">
            <div className="flex items-start gap-4">
              <ArrowDownRight className="h-6 w-6 shrink-0 text-primary mt-1" />
              <div>
                <h3 className="font-display text-xl font-semibold mb-2">La courbe localise la perte</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">Elle relie chaque baisse à ce qui se passe à l’écran : première phrase, transition, exemple, appel à l’action ou fin de la réponse.</p>
              </div>
            </div>
          </div>
          <div className="rounded-2xl border border-border bg-background p-6">
            <div className="flex items-start gap-4">
              <Repeat2 className="h-6 w-6 shrink-0 text-primary mt-1" />
              <div>
                <h3 className="font-display text-xl font-semibold mb-2">La complétion mesure l’arrivée au bout</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">Elle aide à comparer des vidéos de durée proche. Sur un format très court, elle peut aussi être influencée par les revisionnages et les boucles.</p>
              </div>
            </div>
          </div>
        </div>
        <p>
          Pour replacer ces indicateurs dans une analyse plus large, consulte le guide des <Link className="text-primary underline underline-offset-4 hover:no-underline" to="/ressources/statistiques-tiktok">statistiques TikTok</Link>. Une bonne rétention peut servir la diffusion, mais elle ne remplace ni l’objectif du contenu ni les actions qu’il doit produire.
        </p>
      </ArticleSection>

      <ArticleSection
        title="Comment lire ta courbe sans surinterpréter chaque mouvement"
        intro="Synchronise la courbe avec la vidéo et cherche d’abord les ruptures évidentes. Les petites variations ne méritent pas toutes une explication."
      >
        <NumberedSteps
          items={[
            {
              title: "Regarde la vidéo une première fois sans la courbe",
              description: "Note les moments qui te semblent longs, confus ou répétitifs avant d’être influencé par les données.",
            },
            {
              title: "Replace les chutes sur la timeline",
              description: "Identifie les mots, images et transitions présents au moment exact où l’audience diminue nettement.",
            },
            {
              title: "Distingue ouverture, corps et conclusion",
              description: "Une chute à deux secondes ne se corrige pas comme un décrochage après la démonstration principale.",
            },
            {
              title: "Compare une famille de vidéos",
              description: "Cherche si le même type de séquence provoque la même perte sur plusieurs contenus proches.",
            },
            {
              title: "Choisis un seul montage à tester",
              description: "Déplace la preuve, raccourcis une transition ou reformule le hook. Garde le reste aussi stable que possible.",
            },
          ]}
        />
      </ArticleSection>

      <ArticleSection
        variant="cream"
        title="Améliorer les trois premières secondes sans fabriquer du suspense vide"
        intro="Le hook doit gagner l’attention et préparer exactement ce qui suit. Une promesse spectaculaire mais trompeuse crée souvent sa propre chute."
      >
        <p>
          Commence par rendre le sujet visible. L’image d’ouverture, le texte à l’écran et la première phrase doivent converger. Si tu annonces une erreur, montre l’objet de l’erreur. Si tu promets une méthode, précise le résultat qu’elle aide à obtenir. Le spectateur ne devrait pas devoir deviner pendant cinq secondes à quoi sert la vidéo.
        </p>
        <div className="grid sm:grid-cols-2 gap-5 my-8">
          <div className="rounded-2xl border border-border bg-background p-6">
            <p className="text-xs font-semibold uppercase tracking-wider text-primary mb-3">Avant</p>
            <p className="font-display text-lg font-semibold mb-2">« Aujourd’hui, je voulais vous parler d’un sujet qu’on me demande souvent… »</p>
            <p className="text-sm text-muted-foreground">Le thème et le bénéfice restent inconnus.</p>
          </div>
          <div className="rounded-2xl border border-primary/30 bg-primary/10 p-6">
            <p className="text-xs font-semibold uppercase tracking-wider text-primary mb-3">Test plus précis</p>
            <p className="font-display text-lg font-semibold mb-2">« Ta courbe chute ici ? Regarde ce qui arrive deux secondes avant. »</p>
            <p className="text-sm text-muted-foreground">Le problème, le geste et la suite attendue sont immédiatement compréhensibles.</p>
          </div>
        </div>
        <p>
          Une formule ne garantit rien. Elle rend simplement l’hypothèse testable. Pour varier les ouvertures sans trahir le sujet, explore les <Link className="text-primary underline underline-offset-4 hover:no-underline" to="/hooks-tiktok">familles de hooks TikTok</Link> et compare leur effet sur tes propres premières secondes.
        </p>
      </ArticleSection>

      <ArticleSection
        title="Améliorer le milieu : chaque séquence doit mériter la suivante"
        intro="Après le hook, la vidéo doit continuer à avancer. La rétention baisse souvent lorsque le spectateur a compris l’idée mais attend encore la preuve."
      >
        <DiagnosticGrid
          items={[
            {
              title: "Donne avant d’expliquer",
              description: "Montre le résultat ou l’exemple, puis apporte le contexte nécessaire à sa compréhension.",
            },
            {
              title: "Retire les doubles formulations",
              description: "Dire la même idée avec trois phrases différentes ralentit la progression sans ajouter de preuve.",
            },
            {
              title: "Crée des étapes visibles",
              description: "Une liste, un changement de cadrage utile ou une démonstration aide le spectateur à sentir l’avancement.",
            },
            {
              title: "Conclue quand la promesse est tenue",
              description: "Une longue sortie après la réponse peut provoquer une chute normale. Place l’action attendue avant que l’attention soit épuisée.",
            },
          ]}
        />
      </ArticleSection>

      <ArticleSection
        variant="cream"
        title="Exemple de diagnostic : la meilleure partie arrive après la majorité des départs"
        intro="Cet exemple pédagogique décrit une méthode de lecture, pas un seuil universel ni un cas client."
      >
        <p>
          Une vidéo annonce une démonstration mais consacre d’abord plusieurs phrases à l’origine du problème. La courbe descend régulièrement pendant ce contexte, puis se stabilise lorsque la démonstration commence. Le passage le plus utile retient donc mieux, mais une partie importante de l’audience ne l’atteint jamais.
        </p>
        <div className="grid sm:grid-cols-3 gap-4 my-8">
          {[
            ["Lecture", "Le contenu central semble tenir l’attention mieux que l’introduction."],
            ["Montage testé", "Ouvrir sur le résultat, montrer la démonstration, puis ajouter seulement le contexte indispensable."],
            ["Mesure", "Comparer la rétention avant l’arrivée de la preuve sur plusieurs vidéos du même format."],
          ].map(([label, text]) => (
            <div key={label} className="rounded-2xl border border-border bg-background p-5">
              <p className="text-xs font-semibold uppercase tracking-wider text-primary mb-2">{label}</p>
              <p className="text-sm text-muted-foreground leading-relaxed">{text}</p>
            </div>
          ))}
        </div>
        <p>
          Si la courbe se maintient mieux sans dégrader les commentaires, partages ou visites de profil recherchés, le nouveau montage sert probablement mieux la promesse. Sinon, examine l’alignement entre le sujet annoncé et l’audience touchée au lieu de raccourcir encore mécaniquement.
        </p>
      </ArticleSection>

      <ArticleSection title="La règle de travail : une hypothèse, plusieurs essais, une décision">
        <ul className="space-y-4">
          {[
            "Formule ce que tu penses perdre : compréhension, curiosité, rythme ou preuve.",
            "Choisis la séquence exacte qui porte cette hypothèse.",
            "Teste la modification sur plusieurs contenus réellement comparables.",
            "Regarde la courbe, mais aussi l’action que la vidéo devait provoquer.",
          ].map((item) => (
            <li key={item} className="flex items-start gap-3">
              <CheckCircle2 className="h-5 w-5 shrink-0 mt-0.5 text-primary" />
              <span>{item}</span>
            </li>
          ))}
        </ul>
        <p>
          Tu ne cherches pas une rétention parfaite. Tu cherches à faire arriver davantage de bonnes personnes jusqu’à l’information ou l’action que tu avais décidé de servir.
        </p>
      </ArticleSection>
    </ResourceArticle>
  );
}
