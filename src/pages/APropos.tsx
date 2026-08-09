import { Link } from "react-router-dom";
import { ArrowRight, Lightbulb, BarChart3, TrendingUp, Shield, RefreshCw } from "lucide-react";
import { trackEvent } from "@/lib/tracking";
import { SEOHead } from "@/components/SEOHead";
import { seoFor } from "@/config/seo";
import { CREATORS_COUNT } from "@/config/offers";
import { Layout } from "@/components/layout/Layout";
import { Section, SectionHeader } from "@/components/ui/section";
import { Button } from "@/components/ui/button";

const values = [
  {
    icon: Lightbulb,
    title: "Stratégie avant création",
    description: "On définit l'objectif business, le positionnement, l'angle différenciant, puis seulement le contenu. Chaque vidéo a une fonction claire : autorité, visibilité, monétisation ou préparation d'offre. Pas de contenu \"au hasard\".",
  },
  {
    icon: BarChart3,
    title: "Analyse avant opinion",
    description: "Je ne donne pas d'avis. Je regarde les données. Rétention, chute d'audience, structure, cohérence éditoriale, positionnement perçu. On corrige sur des faits, pas sur des impressions.",
  },
  {
    icon: TrendingUp,
    title: "Performance mesurable",
    description: "On définit ce que tes réseaux doivent réellement produire : visibilité, audience qualifiée, crédibilité, partenariats, prospects ou ventes. Ensuite, on mesure ce qui avance.",
  },
  {
    icon: Shield,
    title: "Exigence mutuelle",
    description: "Je suis exigeant. Tu dois l'être aussi. Je ne travaille pas avec ceux qui veulent une validation, une excuse ou une solution magique. Je travaille avec ceux qui veulent comprendre et appliquer.",
  },
  {
    icon: RefreshCw,
    title: "Optimisation continue",
    description: "Les plateformes, les formats et ton marché évoluent. On teste, on ajuste et on mesure sans chercher la technique secrète d'un algorithme.",
  },
];

// Stats qui évoluent automatiquement avec le temps.
// Pour ajuster, changer uniquement les constantes ci-dessous.
const VIDEO_START_YEAR = 2007;    // 19 ans d'expérience en 2026
const MUSIC_START_YEAR = 2005;    // 21 ans en 2026
const SOUND_START_YEAR = 2010;    // 16 ans en 2026
const BIRTH_YEAR = 1991;          // 16 ans lors des premières vidéos (2007)

const yearsSince = (startYear: number) =>
  new Date().getFullYear() - startYear;

const currentAge = () => yearsSince(BIRTH_YEAR);

const stats = [
  { value: CREATORS_COUNT, label: "Créateurs accompagnés" },
  { value: `${yearsSince(VIDEO_START_YEAR)} ans`, label: "D'expérience en création vidéo" },
  { value: `${yearsSince(MUSIC_START_YEAR)} ans`, label: "Dans la musique et la création artistique" },
  { value: "330K+", label: "Abonnés cumulés — mai 2026" },
  { value: "35K", label: "Abonnés Instagram — mai 2026" },
  { value: "30K", label: "Abonnés YouTube — mai 2026" },
];

export default function APropos() {
  return (
    <Layout>
      <SEOHead {...seoFor("/a-propos")} />
      <Section variant="cream" size="lg">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <h1 className="font-display text-4xl md:text-5xl font-semibold tracking-tight mb-6">
              Je ne t'aide pas à poster plus. <span className="text-gold-gradient">Je t'aide à comprendre quoi faire ensuite.</span>
            </h1>
            <p className="text-lg text-muted-foreground mb-6">
              Je suis créateur de contenu, formateur et consultant en stratégie réseaux sociaux. J'accompagne les créateurs et les entrepreneurs à comprendre leurs contenus, lire leurs statistiques et construire une présence qui sert réellement leurs objectifs.
            </p>
            <p className="text-muted-foreground mb-4">
              TikTok est une grosse partie de mon parcours et de mon expertise. Mais une stratégie cohérente peut aussi faire travailler Instagram, YouTube et Facebook ensemble, selon ton activité et ton audience.
            </p>
            <p className="text-muted-foreground">
              Mon approche : du contexte, des données, du feedback et des décisions que tu comprends. Pas de hacks miracles ni de viralité garantie. Tu peux voir les <Link to="/preuves" className="text-primary underline hover:no-underline">résultats documentés</Link> avec leur contexte.
            </p>
          </div>

          <div className="relative">
            <img
              src="/fred-wav.jpg"
              alt="Fred Wav - Expert Stratégie Formats Courts"
              className="aspect-square object-cover rounded-2xl shadow-lg border border-border/50"
              loading="lazy"
            />
          </div>
        </div>
      </Section>

      {/* Stats */}
      <Section variant="dark" size="md">
        <div className="grid grid-cols-2 md:grid-cols-3 gap-8">
          {stats.map((stat, index) => (
            <div key={index} className="text-center">
              <div className="text-3xl md:text-4xl font-bold text-primary mb-1">
                {stat.value}
              </div>
              <div className="text-sm text-muted-foreground">{stat.label}</div>
            </div>
          ))}
        </div>
      </Section>

      {/* Parcours */}
      <Section variant="default" size="lg">
        <div className="max-w-3xl mx-auto">
          <SectionHeader
            title="Mon parcours"
            align="center"
          />

          <blockquote className="border-l-4 border-primary/30 pl-6 space-y-6 text-muted-foreground text-lg">
            <p>
              Je n'ai pas commencé avec les formats courts.<br />
              Mes premières vidéos remontent à mes 16 ans. J'en ai {currentAge()} cette année.
            </p>
            <p>
              Ça fait <span className="text-foreground font-semibold">{yearsSince(VIDEO_START_YEAR)} ans</span> que je filme, monte, expérimente.<br />
              <span className="text-foreground font-semibold">{yearsSince(MUSIC_START_YEAR)} ans</span> que je fais de la musique.<br />
              <span className="text-foreground font-semibold">{yearsSince(SOUND_START_YEAR)} ans</span> que je travaille le son, l'enregistrement et la technique.
            </p>
            <p>
              Les formats courts n'ont été qu'un terrain d'application supplémentaire.
            </p>

            <div className="w-16 h-px bg-primary/40" />

            <p>
              Comme tout le monde, j'ai posté sans stratégie au début.<br />
              Puis j'ai décidé de comprendre les plateformes, leurs formats et surtout les comportements des audiences en profondeur.
            </p>
            <p>
              J'ai analysé des milliers de vidéos.
              Testé des centaines de formats.
              Observé les métriques.
              Disséqué la rétention.
              Comparé médiane et moyenne.
              Compris les signaux faibles.
            </p>
            <p className="text-foreground font-semibold text-xl">
              De là est née une méthode structurée.
            </p>
            <p>
              Aujourd'hui, j'ai accompagné {CREATORS_COUNT} créateurs, entrepreneurs, experts et marques à mieux comprendre leurs contenus et à relier leurs décisions à un objectif concret, dans la <Link to="/wavacademy" className="text-primary underline hover:no-underline">Wav Academy</Link> ou en accompagnement individuel.
            </p>
          </blockquote>
        </div>
      </Section>

      {/* Philosophie */}
      <Section variant="cream" size="lg">
        <div className="max-w-2xl mx-auto text-center space-y-8">
          <SectionHeader title="Ma philosophie" align="center" />

          <p className="text-muted-foreground text-lg">
            Un réseau n'a pas besoin de tout faire. Mais il doit avoir un rôle clair : visibilité, crédibilité, audience, partenariats, prospects ou ventes. Sinon, tu risques de publier beaucoup sans savoir ce que tu construis.
          </p>

          <div className="border-t border-border pt-8">
            <p className="font-display font-semibold text-3xl md:text-4xl text-foreground leading-snug">
              « On ne poste pas pour nourrir un algorithme.<br />
              On poste pour servir un objectif qu'on comprend. »
            </p>
          </div>
        </div>
      </Section>

      {/* Valeurs */}
      <Section variant="cream" size="lg">
        <SectionHeader
          title="Ma façon de travailler"
        />

        <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {values.slice(0, 3).map((value, index) => (
            <div
              key={index}
              className="group bg-background rounded-2xl p-8 border border-border/50 hover:border-primary/30 transition-all duration-300 hover:shadow-[0_8px_30px_-12px_hsl(var(--primary)/0.15)]"
            >
              <div className="w-14 h-14 bg-primary/10 group-hover:bg-primary/20 rounded-xl flex items-center justify-center mb-5 transition-colors duration-300">
                <value.icon className="h-6 w-6 text-primary" strokeWidth={1.5} />
              </div>
              <h3 className="font-display font-semibold text-xl mb-3">{value.title}</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">{value.description}</p>
            </div>
          ))}
        </div>

        <div className="grid md:grid-cols-2 gap-6 max-w-3xl mx-auto mt-6">
          {values.slice(3).map((value, index) => (
            <div
              key={index + 3}
              className="group bg-background rounded-2xl p-8 border border-border/50 hover:border-primary/30 transition-all duration-300 hover:shadow-[0_8px_30px_-12px_hsl(var(--primary)/0.15)]"
            >
              <div className="w-14 h-14 bg-primary/10 group-hover:bg-primary/20 rounded-xl flex items-center justify-center mb-5 transition-colors duration-300">
                <value.icon className="h-6 w-6 text-primary" strokeWidth={1.5} />
              </div>
              <h3 className="font-display font-semibold text-xl mb-3">{value.title}</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">{value.description}</p>
            </div>
          ))}
        </div>
      </Section>

      {/* CTA */}
      <Section variant="cream" size="lg">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="font-display text-3xl font-semibold mb-4">
            Envie de travailler ensemble ?
          </h2>
          <p className="text-muted-foreground mb-6">
            Tu veux progresser dans un cadre régulier ? La Wav Academy reste le point de départ. Tu veux travailler directement sur une stratégie multiréseaux pendant 30 jours ? Commence par me donner le contexte.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button variant="hero" size="lg" asChild onClick={() => trackEvent("cta_academy_click", { location: "apropos" })}>
              <Link to="/wavacademy">
                Rejoindre la Wav Academy
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button variant="outline" size="lg" asChild onClick={() => trackEvent("cta_contact_click", { location: "apropos" })}>
              <Link to="/reserverunappel" onClick={() => trackEvent("cta_premium_click", { location: "apropos" })}>
                Réserve ton appel
              </Link>
            </Button>
          </div>
        </div>
      </Section>
    </Layout>
  );
}
