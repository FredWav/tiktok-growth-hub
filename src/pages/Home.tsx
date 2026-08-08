import { Link } from "react-router-dom";
import {
  AlertTriangle,
  ArrowRight,
  BarChart3,
  Check,
  Eye,
  MessageSquare,
  Radio,
  RefreshCw,
  Target,
  X,
  Zap,
} from "lucide-react";
import { Layout } from "@/components/layout/Layout";
import { Section, SectionHeader } from "@/components/ui/section";
import { Button } from "@/components/ui/button";
import { trackEvent } from "@/lib/tracking";
import { SEOHead } from "@/components/SEOHead";
import { seoFor, HOME_FAQ } from "@/config/seo";
import {
  ACADEMY_PLANS,
  EXPRESS_PRICE_LABEL,
  PREMIUM_DURATION_DAYS,
} from "@/config/offers";
import { OfferComparison } from "@/components/OfferComparison";
import { WavStatsPopup } from "@/components/WavStatsPopup";
import { ExitIntentPopup } from "@/components/ExitIntentPopup";
import { ScreenshotWall } from "@/components/ScreenshotWall";
import { VideoCard } from "@/components/VideoCard";
import { ClientResults } from "@/components/ClientResults";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const problems = [
  "Tu postes sans savoir exactement ce que tu testes.",
  "Tu regardes tes statistiques après coup, mais elles ne changent pas réellement ta prochaine vidéo.",
  "Tu corriges plusieurs choses en même temps et tu ne sais plus ce qui a eu un impact.",
  "Tu accumules du contenu, mais pas forcément de la compréhension.",
];

const academyPillars = [
  {
    icon: Eye,
    title: "Tes contenus deviennent des données exploitables",
    description: "Tu analyses ce que tu publies et tu apprends à transformer tes statistiques en décisions.",
  },
  {
    icon: Zap,
    title: "Des actions concrètes",
    description: "Pas 40 heures de théorie avant de commencer. Les ressources t'aident à modifier ce que tu fais maintenant.",
  },
  {
    icon: Radio,
    title: "Des lives réguliers avec Fred",
    description: "Questions, analyse de comptes, décryptage de contenus et décisions à prendre.",
  },
  {
    icon: MessageSquare,
    title: "Tu n'es plus seul devant tes stats",
    description: "Tu confrontes tes décisions, poses tes questions et bénéficies du regard du groupe.",
  },
];

const premiumMethod = [
  {
    icon: BarChart3,
    title: "Analyse stratégique complète",
    description: "On regarde ton positionnement, tes comptes, tes contenus, tes statistiques, ton marché et le rôle réel de tes réseaux.",
  },
  {
    icon: RefreshCw,
    title: "Un point stratégique chaque semaine",
    description: "On regarde ce qui s'est passé, ce que les chiffres racontent et ce qu'on modifie pour la semaine suivante.",
  },
  {
    icon: MessageSquare,
    title: "Feedback entre les rendez-vous",
    description: "Tu peux me montrer tes idées, hooks, scripts ou contenus quand tu bloques, sans attendre le rendez-vous suivant.",
  },
  {
    icon: Target,
    title: "Des objectifs concrets",
    description: "On définit ce qu'on veut faire progresser et comment on saura si la stratégie avance dans la bonne direction.",
  },
  {
    icon: RefreshCw,
    title: "Une stratégie réutilisable",
    description: "Le but n'est pas que tu dépendes de moi. Tu repars avec une logique que tu comprends et peux continuer à appliquer après les 30 jours.",
  },
];

const premiumForYou = [
  "Tes réseaux ont un vrai rôle à jouer dans ton activité ou ton projet",
  "Tu veux travailler directement avec Fred",
  "Tu es prêt à publier, tester et modifier tes contenus pendant les 30 jours",
  "Tu acceptes de remettre en question ce que tu fais déjà",
  "Tu veux prendre des décisions à partir de faits plutôt que de suppositions",
];

const premiumNotForYou = [
  "Tu veux déléguer toute ta création de contenu",
  "Tu veux qu'on te garantisse un nombre de vues ou d'abonnés",
  "Tu cherches une technique secrète pour devenir viral",
  "Tu n'as pas le temps ou l'envie d'appliquer les recommandations",
  "Tu veux uniquement qu'on te confirme que ta stratégie actuelle est parfaite",
];

const featuredVideos = [
  { id: "XMMmmLLKue4", alt: "Témoignage de PlotBreaker sur la Wav Academy" },
  { id: "Hgkn3ifjSS0", alt: "Témoignage de Lucille après son accompagnement" },
  { id: "LOi7RTx12nE", alt: "Témoignage de David sur sa stratégie multiréseaux" },
];

export default function Home() {
  return (
    <Layout>
      <WavStatsPopup />
      <ExitIntentPopup />
      <SEOHead {...seoFor("/")} />

      <Section variant="default" size="xl" className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-cream via-background to-primary/5 -z-10" />
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="font-display text-4xl md:text-5xl lg:text-6xl font-semibold tracking-tight mb-6 animate-fade-in text-balance">
            Arrête de poster seul. <span className="text-gold-gradient">Tes stats disent déjà ce qui bloque.</span>
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto mb-8 animate-fade-in" style={{ animationDelay: "0.1s" }}>
            Tu postes, tu testes, tu changes de stratégie et tu recommences sans toujours savoir ce qui a vraiment fait la différence. Ici, pas de hack ni de promesse de viralité : on regarde ce que tes contenus racontent, on identifie ce qui bloque et on corrige.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-stretch sm:items-center animate-fade-in" style={{ animationDelay: "0.2s" }}>
            <Button variant="hero" size="xl" asChild onClick={() => trackEvent("cta_academy_click", { location: "hero" })}>
              <Link to="/wavacademy">Rejoindre la Wav Academy<ArrowRight className="ml-2 h-5 w-5" /></Link>
            </Button>
            <Button variant="outline" size="xl" asChild onClick={() => trackEvent("cta_express_click", { location: "hero" })}>
              <Link to="/analyse-express">Analyser mon compte d'abord</Link>
            </Button>
          </div>
          <p className="text-sm text-muted-foreground mt-4 animate-fade-in" style={{ animationDelay: "0.3s" }}>
            3, 6 ou 12 mois — paiement unique, sans abonnement.
          </p>
        </div>
      </Section>

      <Section variant="default" size="lg">
        <SectionHeader
          title="Tu ne manques pas forcément d'idées. Tu manques de certitudes sur ce qui mérite d'être répété."
          subtitle="Une vidéo marche, la suivante tombe à plat. Tu modifies le hook, le montage, le sujet et les hashtags en même temps. Résultat : même quand ça fonctionne, tu ne sais pas vraiment pourquoi."
        />
        <div className="grid md:grid-cols-2 gap-4 max-w-4xl mx-auto">
          {problems.map((problem) => (
            <div key={problem} className="flex items-start gap-3 p-5 rounded-xl bg-destructive/5 border border-destructive/10">
              <AlertTriangle className="h-5 w-5 text-destructive mt-0.5 shrink-0" />
              <span className="text-sm leading-relaxed">{problem}</span>
            </div>
          ))}
        </div>
        <p className="font-display text-xl md:text-2xl font-semibold text-center max-w-3xl mx-auto mt-10">
          Le problème n'est pas de poster plus. Le problème, c'est de continuer à créer dans le flou.
        </p>
      </Section>

      <Section variant="dark" size="md">
        <div className="max-w-4xl mx-auto">
          <h2 className="font-display text-3xl md:text-4xl font-semibold text-cream mb-5 text-balance">Continuer au hasard a un coût.</h2>
          <p className="text-cream/75 text-lg leading-relaxed mb-5">
            Du temps passé sur des contenus qui n'avaient parfois aucune chance de remplir leur objectif. De l'énergie gaspillée à changer de stratégie toutes les deux semaines. Des opportunités de visibilité, de crédibilité ou de business que tu ne peux pas exploiter parce que tu ne sais pas encore reproduire ce qui fonctionne.
          </p>
          <p className="rounded-xl border border-primary/30 bg-primary/10 p-5 text-cream font-medium text-lg">
            Le but n'est pas de réussir toutes tes vidéos. Personne ne peut te promettre ça. Le but, c'est que chaque vidéo t'apprenne quelque chose pour la suivante.
          </p>
        </div>
      </Section>

      <Section variant="default" size="lg">
        <SectionHeader
          title="Pas des promesses. Des cas réels."
          subtitle="Ce qui s'est réellement passé chez des créateurs accompagnés, avec le contexte qui va avec."
        />
        <ClientResults limit={3} />
        <div className="text-center mt-8">
          <Button variant="outline" asChild onClick={() => trackEvent("click_proof_strip", { location: "home_early" })}>
            <Link to="/preuves">Voir toutes les preuves<ArrowRight className="ml-2 h-4 w-4" /></Link>
          </Button>
        </div>
      </Section>

      <Section variant="cream" size="lg">
        <SectionHeader
          title="Wav Academy : arrête de créer seul dans ton coin."
          subtitle="Un cadre collectif pour comprendre tes contenus, corriger ce qui bloque et progresser sans repartir de zéro à chaque vidéo."
        />
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5 max-w-6xl mx-auto mb-14">
          {academyPillars.map((item) => (
            <div key={item.title} className="bg-background border border-border rounded-xl p-6 hover:border-primary/40 transition-colors">
              <div className="w-11 h-11 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                <item.icon className="h-5 w-5 text-primary" />
              </div>
              <h3 className="font-semibold mb-2">{item.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{item.description}</p>
            </div>
          ))}
        </div>

        <div className="max-w-5xl mx-auto">
          <h3 className="font-display text-2xl md:text-3xl font-semibold text-center mb-8">Choisis le temps dont tu as besoin pour appliquer.</h3>
          <div className="grid md:grid-cols-3 gap-5 mb-6">
            {ACADEMY_PLANS.map((plan) => (
              <div key={plan.term} className={`rounded-2xl bg-background p-6 text-center relative ${plan.highlight ? "border-2 border-primary shadow-lg shadow-primary/10" : "border border-border"}`}>
                {plan.badge && <span className="inline-block bg-primary text-primary-foreground text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wide mb-3">{plan.badge}</span>}
                <p className="text-xs font-bold tracking-widest text-primary uppercase mb-2">{plan.label}</p>
                <p className="font-display text-4xl font-bold mb-1">{plan.total} €</p>
                <p className="text-sm text-muted-foreground">{plan.duration} d'accès</p>
                {plan.save && <p className="text-xs font-semibold text-emerald-700 mt-2">{plan.save}</p>}
                <p className="text-sm text-muted-foreground mt-4">{plan.note}</p>
              </div>
            ))}
          </div>
          <p className="text-center text-sm text-muted-foreground mb-8">Paiement unique. Aucun abonnement, aucun prélèvement récurrent, aucune reconduction automatique.</p>
          <div className="text-center">
            <Button variant="hero" size="xl" asChild onClick={() => trackEvent("cta_academy_click", { location: "academy_section" })}>
              <Link to="/wavacademy">Rejoindre la Wav Academy<ArrowRight className="ml-2 h-5 w-5" /></Link>
            </Button>
          </div>
        </div>
      </Section>

      <Section variant="default" size="lg">
        <SectionHeader
          title="Trois besoins. Trois façons de travailler ensemble."
          subtitle="Pas trois niveaux de prix. Trois façons différentes d'avancer."
        />
        <OfferComparison location="home" />
      </Section>

      <Section variant="cream" size="lg">
        <SectionHeader
          title={`Wav Premium : ${PREMIUM_DURATION_DAYS} jours pour travailler directement sur ta stratégie réseaux avec moi.`}
          subtitle="On part de ta situation réelle : ton activité, ton positionnement, tes contenus, tes plateformes et tes objectifs. TikTok peut faire partie de la stratégie, mais on ne va pas ignorer Instagram, YouTube ou Facebook simplement parce que je suis surtout connu pour TikTok."
        />
        <p className="max-w-3xl mx-auto text-center text-muted-foreground text-lg leading-relaxed mb-12">
          Les fondamentaux d'un bon contenu se transfèrent d'une plateforme à l'autre. Positionnement, accroche, narration, rétention, lisibilité du message et compréhension de l'audience restent essentiels. Ensuite, on adapte l'exécution au réseau.
        </p>
        <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-5 max-w-7xl mx-auto mb-12">
          {premiumMethod.map((item) => (
            <div key={item.title} className="bg-background border border-border rounded-xl p-6 hover:border-primary/40 transition-colors">
              <div className="w-11 h-11 bg-primary/10 rounded-full flex items-center justify-center mb-4"><item.icon className="h-5 w-5 text-primary" /></div>
              <h3 className="font-semibold mb-2">{item.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{item.description}</p>
            </div>
          ))}
        </div>
        <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto mb-10">
          <div className="bg-background rounded-xl p-7 border border-border">
            <h3 className="font-display text-xl font-semibold mb-4 flex items-center gap-2"><Check className="h-5 w-5 text-primary" />C'est pour toi si...</h3>
            <ul className="space-y-3">{premiumForYou.map((item) => <li key={item} className="flex items-start gap-3 text-sm"><Check className="h-4 w-4 text-primary mt-0.5 shrink-0" /><span>{item}</span></li>)}</ul>
          </div>
          <div className="bg-destructive/5 rounded-xl p-7 border border-destructive/10">
            <h3 className="font-display text-xl font-semibold mb-4 flex items-center gap-2"><X className="h-5 w-5 text-destructive" />Ce n'est PAS pour toi si...</h3>
            <ul className="space-y-3">{premiumNotForYou.map((item) => <li key={item} className="flex items-start gap-3 text-sm"><X className="h-4 w-4 text-destructive mt-0.5 shrink-0" /><span>{item}</span></li>)}</ul>
          </div>
        </div>
        <div className="flex flex-col items-center gap-3">
          <Button variant="premium" size="xl" asChild onClick={() => trackEvent("cta_premium_click", { location: "premium_section" })}>
            <Link to="/reserverunappel">Réserve ton appel<ArrowRight className="ml-2 h-5 w-5" /></Link>
          </Button>
          <p className="text-sm text-muted-foreground text-center">Quelques questions d'abord. Si l'accompagnement correspond vraiment à ta situation, on échange ensuite directement.</p>
        </div>
      </Section>

      <Section variant="default" size="lg">
        <SectionHeader
          title="Ils expliquent ce que le travail a changé."
          subtitle="Des créateurs et des entrepreneurs, avec leurs mots et leur contexte. Aucun résultat n'est une garantie."
        />
        <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto mb-12">
          {featuredVideos.map((video) => <VideoCard key={video.id} id={video.id} alt={video.alt} location="home" />)}
        </div>
        <ScreenshotWall location="home" title="Des retours directs" subtitle="Ce qu'ils disent après avoir appliqué, testé et corrigé." />
        <div className="text-center mt-10">
          <Button variant="outline" size="lg" asChild onClick={() => trackEvent("click_proof_strip", { location: "home_full" })}>
            <Link to="/preuves">Voir toutes les preuves<ArrowRight className="ml-2 h-4 w-4" /></Link>
          </Button>
        </div>
      </Section>

      <Section variant="default" size="lg">
        <SectionHeader title="Questions fréquentes" />
        <div className="max-w-3xl mx-auto">
          <Accordion type="single" collapsible className="w-full">
            {HOME_FAQ.map((item, index) => (
              <AccordionItem key={item.question} value={`faq-${index}`}>
                <AccordionTrigger className="text-left font-medium" onClick={() => trackEvent("faq_open", { question: item.question })}>{item.question}</AccordionTrigger>
                <AccordionContent className="text-muted-foreground leading-relaxed">{item.answer}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </Section>

      <Section variant="cream" size="md">
        <div className="max-w-2xl mx-auto text-center">
          <span className="inline-block bg-primary/10 text-primary text-xs font-semibold px-3 py-1 rounded-full mb-4">GUIDE GRATUIT</span>
          <h2 className="font-display text-2xl md:text-3xl font-semibold mb-3">Reçois mon guide des hooks gratuitement</h2>
          <p className="text-muted-foreground mb-6">Les structures d'accroches classées par famille, les modèles à compléter avec ton sujet, et ce que chaque famille coûte quand on en abuse.</p>
          <Button variant="outline" size="lg" asChild onClick={() => trackEvent("cta_guide_click", { location: "home" })}>
            <Link to="/newsletter">Recevoir mon guide gratuit<ArrowRight className="ml-2 h-4 w-4" /></Link>
          </Button>
        </div>
      </Section>

      <Section variant="dark" size="lg">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="font-display text-3xl md:text-4xl font-semibold mb-4 text-cream text-balance">Tu peux continuer à poster au feeling. Ou commencer à comprendre ce que tes contenus te racontent.</h2>
          <p className="text-cream/70 text-lg mb-8">Si tu veux un cadre pour progresser régulièrement, rejoins la Wav Academy.</p>
          <Button variant="hero" size="xl" asChild onClick={() => trackEvent("cta_academy_click", { location: "bottom" })}>
            <Link to="/wavacademy">Rejoindre la Wav Academy<ArrowRight className="ml-2 h-5 w-5" /></Link>
          </Button>
          <p className="text-xs text-cream/50 mt-4">3, 6 ou 12 mois — paiement unique — aucune reconduction automatique.</p>
          <div className="mt-8 pt-8 border-t border-cream/10">
            <p className="text-sm text-cream/60 mb-3">Tu veux seulement commencer par un diagnostic de ton compte TikTok ?</p>
            <Button variant="hero-outline" size="lg" asChild onClick={() => trackEvent("cta_express_click", { location: "bottom" })}>
              <Link to="/analyse-express">Faire mon Analyse Express — {EXPRESS_PRICE_LABEL}</Link>
            </Button>
          </div>
        </div>
      </Section>
    </Layout>
  );
}
