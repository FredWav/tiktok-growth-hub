import { Link } from "react-router-dom";
import { AlertCircle, CheckCircle2, XCircle } from "lucide-react";
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
    question: "Pourquoi mes TikTok restent-ils autour de 200 vues ?",
    answer:
      "Un nombre récurrent n’est pas la preuve d’un plafond automatique. Il peut résulter d’un petit volume initial, d’un sujet peu clair, d’une perte rapide d’attention ou d’un contenu qui ne donne pas assez de signaux pour être montré plus largement. Vérifie d’abord l’état du compte, puis compare la rétention et la structure de plusieurs vidéos proches.",
  },
  {
    question: "Comment savoir si je suis shadowban sur TikTok ?",
    answer:
      "Une baisse de vues ne suffit pas à conclure à un shadowban. Consulte les notifications, l’état du compte et l’éligibilité des contenus dans TikTok. S’il n’y a pas d’alerte explicite, travaille avec les éléments observables : diffusion, rétention, sources de trafic, cohérence du sujet et réactions de l’audience.",
  },
  {
    question: "Faut-il supprimer une vidéo qui fait peu de vues ?",
    answer:
      "Pas par réflexe. Une vidéo faible contient des informations utiles et peut encore être découverte. Garde-la comme point de comparaison, sauf erreur factuelle, problème juridique, atteinte à ton image ou consigne explicite de la plateforme.",
  },
  {
    question: "Est-ce que poster davantage suffit pour relancer les vues ?",
    answer:
      "Poster plus augmente le nombre d’essais, pas automatiquement leur qualité. Si tu répètes la même ouverture floue ou la même structure trop lente, tu produis surtout plus de données identiques. Publie assez pour tester, mais associe chaque série à une hypothèse précise.",
  },
  {
    question: "Les hashtags peuvent-ils débloquer les vues ?",
    answer:
      "Les hashtags peuvent aider à préciser le sujet, mais ils ne compensent pas une promesse incompréhensible ou une faible rétention. Utilise des termes réellement liés au contenu et donne la priorité à l’image d’ouverture, aux premiers mots et à la progression de la vidéo.",
  },
];

const related: RelatedResource[] = [
  {
    href: "/ressources/statistiques-tiktok",
    title: "Comprendre ses statistiques TikTok",
    description: "Lis les métriques dans le bon ordre avant d’interpréter ton nombre de vues.",
  },
  {
    href: "/ressources/retention-tiktok",
    title: "Améliorer sa rétention TikTok",
    description: "Localise les chutes d’audience et choisis la partie précise à retravailler.",
  },
  {
    href: "/hooks-tiktok",
    title: "Trouver un hook adapté au sujet",
    description: "Explore les familles d’accroches sans confondre formule efficace et garantie de vues.",
    label: "Bibliothèque de hooks",
  },
  {
    href: "/preuves",
    title: "Voir des résultats documentés",
    description: "Découvre des cas contextualisés avant de choisir la prochaine étape de ton diagnostic.",
    label: "Résultats",
  },
];

export default function RessourceVuesTikTok() {
  return (
    <ResourceArticle
      path="/ressources/vues-tiktok"
      slug="vues_tiktok"
      eyebrow="Vues TikTok"
      title="Pourquoi mes TikTok font peu de vues ? Le diagnostic étape par étape"
      introduction="Peu de vues est un symptôme, pas une explication. Avant d’accuser l’algorithme, vérifie l’état du compte, les premières secondes, la promesse, la rétention et la cohérence de ce que tu publies."
      readingTime="10 min"
      experienceNote="Quand un créateur me dit que ses vues ont chuté, je ne commence pas par chercher une sanction de l’algorithme. Je vérifie d’abord si la promesse est compréhensible sans contexte, puis si les premières secondes conduisent réellement vers cette promesse."
      faq={faq}
      related={related}
    >
      <ArticleSection
        title="La réponse courte : le nombre de vues arrive à la fin du diagnostic"
        intro="Une vidéo est peu diffusée pour des raisons qui peuvent se cumuler. Ton travail consiste à éliminer les explications une par une, avec des éléments visibles et testables."
      >
        <p>
          Le piège le plus fréquent consiste à partir du résultat — « seulement quelques centaines de vues » — puis à inventer une cause invisible. Or ce nombre ne dit pas si l’ouverture était claire, si les personnes sont restées, si le sujet correspondait à ton audience ou si la vidéo était éligible à la recommandation. Il faut remonter la chaîne.
        </p>
        <DiagnosticGrid
          items={[
            {
              title: "État du compte et du contenu",
              description: "Commence par les faits : notification, restriction, son, droits, contenu inéligible ou problème de publication.",
              signal: "une alerte explicite dans TikTok, pas une simple baisse de vues.",
            },
            {
              title: "Compréhension immédiate",
              description: "Le spectateur doit identifier rapidement le sujet, le bénéfice ou la tension qui justifie son attention.",
              signal: "une ouverture générique qui pourrait introduire dix sujets différents.",
            },
            {
              title: "Rétention et progression",
              description: "Une bonne idée peut perdre l’audience si elle tarde à avancer ou répète la même information.",
              signal: "une chute nette avant la première preuve, démonstration ou réponse.",
            },
            {
              title: "Cohérence éditoriale",
              description: "Des sujets très dispersés rendent plus difficile la compréhension de la promesse de ton compte.",
              signal: "chaque vidéo s’adresse à une personne différente sans fil conducteur identifiable.",
            },
          ]}
        />
        <ExampleDataChart
          title="Exemple d’un diagnostic qui remonte du résultat"
          description="Sur cette vidéo fictive, le volume final n’explique rien à lui seul. La forte perte au démarrage oriente d’abord vers l’ouverture et la clarté de la promesse."
          points={[
            { label: "Exposition", value: 100 },
            { label: "3 secondes", value: 54 },
            { label: "Milieu", value: 31 },
            { label: "Fin", value: 17 },
          ]}
        />
        <InlineExpressCta sourcePage="/ressources/vues-tiktok" contentSlug="vues_tiktok" />
      </ArticleSection>

      <ArticleSection
        variant="cream"
        title="Étape 1 : écarte d’abord un problème réel de compte"
        intro="Une restriction existe parfois, mais elle doit être vérifiée dans la plateforme au lieu d’être déduite d’une courbe décevante."
      >
        <p>
          Consulte l’état de ton compte, les notifications liées à la vidéo, l’utilisation du son et les éventuelles informations d’éligibilité. Vérifie aussi que la publication est bien publique, correctement traitée et visible depuis un autre appareil. Cette vérification prend quelques minutes et évite de travailler l’écriture lorsqu’un problème concret doit d’abord être résolu.
        </p>
        <div className="grid sm:grid-cols-2 gap-5 my-8">
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-6">
            <CheckCircle2 className="h-5 w-5 text-emerald-700 mb-3" />
            <h3 className="font-display text-lg font-semibold mb-2 text-emerald-950">Fait vérifiable</h3>
            <p className="text-sm text-emerald-950/75 leading-relaxed">TikTok affiche une notification ou une restriction précise que tu peux consulter et, selon le cas, contester.</p>
          </div>
          <div className="rounded-2xl border border-red-200 bg-red-50 p-6">
            <XCircle className="h-5 w-5 text-red-700 mb-3" />
            <h3 className="font-display text-lg font-semibold mb-2 text-red-950">Conclusion trop rapide</h3>
            <p className="text-sm text-red-950/75 leading-relaxed">« Mes trois dernières vidéos ont peu de vues, donc la plateforme cache mon compte. » Le résultat ne prouve pas cette cause.</p>
          </div>
        </div>
        <p>
          Si aucune alerte n’apparaît, passe à ce que tu contrôles : la façon dont la vidéo attire, tient et récompense l’attention. Tu ne nies pas la distribution ; tu choisis simplement des variables sur lesquelles tu peux agir.
        </p>
      </ArticleSection>

      <ArticleSection
        title="Étape 2 : vérifie si les premières secondes rendent la promesse évidente"
        intro="Une introduction polie n’est pas toujours une introduction utile. Sur un fil rapide, le spectateur doit comprendre pourquoi cette vidéo mérite quelques secondes de plus."
      >
        <p>
          Regarde ta vidéo sans le son, puis écoute seulement la première phrase. L’image et les mots parlent-ils du même sujet ? Sait-on à qui tu t’adresses ? Le résultat, la question ou le problème est-il concret ? Une accroche peut être sobre ; elle doit surtout être spécifique et honnête.
        </p>
        <NumberedSteps
          items={[
            {
              title: "Supprime le préambule",
              description: "Les salutations, excuses et explications sur le fait que tu vas expliquer quelque chose retardent souvent la vraie promesse.",
            },
            {
              title: "Nomme le problème observable",
              description: "« Tes vues chutent après deux secondes » est plus concret que « tu fais mal TikTok ».",
            },
            {
              title: "Montre une preuve assez tôt",
              description: "Résultat à l’écran, démonstration, capture ou changement visible : le spectateur doit sentir que la vidéo avance.",
            },
            {
              title: "Tiens exactement la promesse",
              description: "Une curiosité artificielle peut gagner un instant puis provoquer une chute lorsque la réponse déçoit.",
            },
          ]}
        />
        <p>
          Si ton ouverture est le principal doute, utilise la bibliothèque de <Link className="text-primary underline underline-offset-4 hover:no-underline" to="/hooks-tiktok">hooks TikTok</Link> comme point de départ. Garde néanmoins la même idée de fond : tu veux tester l’accroche, pas changer simultanément le sujet, la durée et le montage.
        </p>
      </ArticleSection>

      <ArticleSection
        variant="cream"
        title="Étape 3 : regarde ce qui se passe après le hook"
        intro="Un bon démarrage ne sauve pas une vidéo qui ralentit immédiatement. La suite doit délivrer, progresser et donner une raison de continuer."
      >
        <p>
          Cherche les répétitions, les détours, les phrases qui annoncent encore une information au lieu de la donner. Sur une courbe de rétention, une chute au tout début pointe souvent vers l’ouverture ; une perte plus tardive peut révéler une démonstration trop longue, une transition confuse ou une promesse déjà satisfaite.
        </p>
        <p>
          Demande-toi aussi si la durée sert réellement le sujet. Raccourcir n’est pas une obligation : une explication longue peut fonctionner lorsqu’elle renouvelle l’intérêt et apporte des preuves. En revanche, étirer une idée simple augmente les occasions de perdre l’audience sans ajouter de valeur.
        </p>
        <div className="rounded-2xl border border-primary/25 bg-primary/10 p-6 my-8">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-primary shrink-0 mt-0.5" />
            <p className="text-sm leading-relaxed">
              <strong>Test utile :</strong> reprends une vidéo faible, garde son sujet et son corps, puis enregistre une ouverture qui annonce directement le résultat. Compare la rétention du départ avec des contenus de durée proche. Tu apprendras davantage qu’en republiant exactement la même vidéo avec de nouveaux hashtags.
            </p>
          </div>
        </div>
      </ArticleSection>

      <ArticleSection
        title="Étape 4 : donne au compte une promesse que l’on peut reconnaître"
        intro="La cohérence ne signifie pas répéter éternellement le même sujet. Elle signifie que la bonne personne comprend pourquoi elle devrait revenir."
      >
        <p>
          Observe tes dix à vingt dernières publications. Peuvent-elles être regroupées autour de quelques problèmes reliés ? S’adressent-elles à un public identifiable ? Si une vidéo parle aux musiciens débutants, la suivante aux restaurateurs et la troisième de ta journée sans lien avec ton expertise, chaque contenu doit reconstruire l’intérêt depuis zéro.
        </p>
        <p>
          Construis deux ou trois piliers liés par une même transformation. Par exemple : comprendre les statistiques, améliorer la rétention et structurer une vidéo appartiennent au même territoire. Tu peux varier les formats et les angles tout en rendant la promesse générale plus lisible.
        </p>
      </ArticleSection>

      <ArticleSection
        variant="cream"
        title="Exemple de diagnostic sans mythe d’algorithme"
        intro="Cet exemple est pédagogique : il montre le raisonnement, pas une recette ni une norme de performance."
      >
        <p>
          Une série de vidéos obtient peu de vues. Aucune restriction n’apparaît. Les sujets sont utiles mais les cinq ouvertures commencent par une longue mise en contexte. La courbe baisse avant que le problème soit nommé, tandis que les personnes restées laissent des commentaires pertinents.
        </p>
        <div className="grid sm:grid-cols-3 gap-4 my-8">
          {[
            ["Ce que l’on sait", "Le contenu aide une partie de l’audience et aucune alerte de compte n’est visible."],
            ["Ce que l’on suppose", "La promesse arrive trop tard pour une grande partie des personnes exposées."],
            ["Ce que l’on teste", "Trois nouvelles ouvertures qui nomment le problème dès la première phrase."],
          ].map(([label, text]) => (
            <div key={label} className="rounded-2xl border border-border bg-background p-5">
              <p className="text-xs font-semibold uppercase tracking-wider text-primary mb-2">{label}</p>
              <p className="text-sm text-muted-foreground leading-relaxed">{text}</p>
            </div>
          ))}
        </div>
        <p>
          Le nombre de vues final ne suffit toujours pas à valider le test. Regarde d’abord si davantage de personnes franchissent les premières secondes et si la progression se répète. Tu construis une compréhension de ton audience, pas une superstition autour d’un chiffre.
        </p>
      </ArticleSection>
    </ResourceArticle>
  );
}
