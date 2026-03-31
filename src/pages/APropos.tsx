import { Link } from "react-router-dom";
import { ArrowRight, Lightbulb, BarChart3, TrendingUp, Shield, RefreshCw } from "lucide-react";
import { trackEvent } from "@/lib/tracking";
import { SEOHead } from "@/components/SEOHead";
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
    description: "On ne vise pas des vues. On vise des leads, des ventes, une audience qualifiée, une montée en autorité. Si ça ne génère pas de levier business, on ajuste.",
  },
  {
    icon: Shield,
    title: "Exigence mutuelle",
    description: "Je suis exigeant. Tu dois l'être aussi. Je ne travaille pas avec ceux qui veulent une validation, une excuse ou une solution magique. Je travaille avec ceux qui veulent comprendre et appliquer.",
  },
  {
    icon: RefreshCw,
    title: "Optimisation continue",
    description: "TikTok évolue. Les formats courts évoluent. Le marché évolue. On teste, on ajuste, on mesure, on itère. La stratégie n'est jamais figée.",
  },
];

const stats = [
  { value: "300+", label: "Créateurs accompagnés" },
  { value: "10M+", label: "Vues générées via stratégies déployées" },
  { value: "18 ans", label: "D'expérience en création vidéo" },
  { value: "20 ans", label: "Dans la musique et la création artistique" },
  { value: "280K", label: "Abonnés cumulés" },
  { value: "35K", label: "Abonnés Instagram" },
  { value: "30K", label: "Abonnés YouTube" },
  { value: "95%", label: "Taux de satisfaction" },
];

export default function APropos() {
  return (
    <Layout>
      <SEOHead title="À propos de Fred Wav | Expert Stratégie Formats Courts" description="18 ans d'expérience vidéo, 300+ créateurs accompagnés, 10M+ vues générées. Découvre le parcours et la méthode." path="/a-propos" keywords="Fred Wav, expert formats courts, parcours, méthode data-driven, accompagnement créateur" schema={{
        "@context": "https://schema.org",
        "@type": "Person",
        "name": "Fred Wav",
        "jobTitle": "Expert Stratégie Formats Courts",
        "url": "https://fredwav.com/a-propos",
        "description": "Stratégiste en contenu et formats courts. 18 ans d'expérience vidéo, 300+ créateurs accompagnés, 10M+ vues générées.",
        "knowsAbout": ["Stratégie formats courts", "Marketing vidéo", "Hook engineering", "Réseaux sociaux", "Croissance organique"],
        "sameAs": ["https://www.tiktok.com/@fredwav", "https://www.instagram.com/levraifredwav/", "https://www.youtube.com/@Fredwavconseils"],
      }} />
      <Section variant="cream" size="lg">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <h1 className="font-display text-4xl md:text-5xl font-semibold tracking-tight mb-6">
              Je suis là pour <span className="text-gold-gradient">tes résultats</span>, pas pour te vendre du rêve.
            </h1>
            <p className="text-lg text-muted-foreground mb-6">
              Stratégiste en contenu et formats courts, j'accompagne entrepreneurs et créateurs
              à construire une présence qui génère des clients, pas juste des likes. Découvre les <Link to="/preuves" className="text-primary underline hover:no-underline">résultats concrets</Link> de mes accompagnements.
            </p>
            <p className="text-muted-foreground">
              Mon approche est simple : stratégie, analyse, performance mesurable.
              Pas de hacks miracles. Pas de bullshit marketing. Juste ce qui fonctionne.
            </p>
          </div>

          <div className="relative">
            <div className="aspect-square bg-muted rounded-2xl flex items-center justify-center">
              <span className="text-muted-foreground text-lg">Photo profil</span>
            </div>
          </div>
        </div>
      </Section>

      {/* Stats */}
      <Section variant="dark" size="md">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
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
              Mes premières vidéos remontent à mes 16 ans. J'en ai 35 cette année.
            </p>
            <p>
              Ça fait <span className="text-foreground font-semibold">18 ans</span> que je filme, monte, expérimente.<br />
              <span className="text-foreground font-semibold">20 ans</span> que je fais de la musique.<br />
              <span className="text-foreground font-semibold">13 ans</span> que je travaille le son, l'enregistrement et la technique.
            </p>
            <p>
              Les formats courts n'ont été qu'un terrain d'application supplémentaire.
            </p>

            <div className="w-16 h-px bg-primary/40" />

            <p>
              Comme tout le monde, j'ai posté sans stratégie au début.<br />
              Puis j'ai décidé de comprendre la plateforme en profondeur.
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
              Aujourd'hui, j'accompagne plus de 300 créateurs, entrepreneurs, experts, marques,
              qui veulent transformer leur contenu en levier business grâce au <Link to="/wav-premium/candidature" className="text-primary underline hover:no-underline">Wav Premium</Link>.
            </p>
          </blockquote>
        </div>
      </Section>

      {/* Philosophie */}
      <Section variant="cream" size="lg">
        <div className="max-w-2xl mx-auto text-center space-y-8">
          <SectionHeader title="Ma philosophie" align="center" />

          <p className="text-muted-foreground text-lg">
            Un contenu qui ne génère ni autorité, ni audience qualifiée, ni clients
            est un divertissement personnel. Pas une stratégie.
          </p>

          <div className="border-t border-border pt-8">
            <p className="font-display font-semibold text-3xl md:text-4xl text-foreground leading-snug">
              "On ne poste pas pour exister.<br />
              On poste pour convertir."
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
            Candidate au Wav Premium. Tu verras rapidement si ma méthode est faite pour toi.
          </p>
          <Button variant="hero" size="lg" asChild onClick={() => trackEvent("cta_wav_premium_click", { location: "apropos" })}>
            <Link to="/wav-premium/candidature">
              Candidater au Wav Premium
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </Section>
    </Layout>
  );
}
