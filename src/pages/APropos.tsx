import { Link } from "react-router-dom";
import { ArrowRight, Lightbulb, BarChart3, TrendingUp, Shield, RefreshCw } from "lucide-react";
import { Layout } from "@/components/layout/Layout";
import { Section, SectionHeader } from "@/components/ui/section";
import { Button } from "@/components/ui/button";

const values = [
  {
    icon: Lightbulb,
    title: "Stratégie avant création",
    description: "On définit l'objectif business, le positionnement, l'angle différenciant, puis seulement le contenu. Chaque vidéo a une fonction claire : autorité, acquisition, conversion ou préparation d'offre. Pas de contenu \"au hasard\".",
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
  { value: "280K", label: "Abonnés TikTok cumulés" },
  { value: "35K", label: "Abonnés Instagram" },
  { value: "30K", label: "Abonnés YouTube" },
  { value: "95%", label: "Taux de satisfaction" },
];

export default function APropos() {
  return (
    <Layout>
      {/* Hero */}
      <Section variant="cream" size="lg">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <h1 className="font-display text-4xl md:text-5xl font-semibold tracking-tight mb-6">
              Je suis là pour <span className="text-gold-gradient">tes résultats</span>, pas pour te vendre du rêve.
            </h1>
            <p className="text-lg text-muted-foreground mb-6">
              Stratégiste en contenu TikTok et formats courts, j'accompagne entrepreneurs et créateurs 
              à construire une présence qui génère des clients — pas juste des likes.
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
            align="left"
          />

          <div className="prose prose-lg max-w-none text-muted-foreground space-y-4">
            <p>
              Je n'ai pas commencé avec TikTok.<br />
              Mes premières vidéos remontent à mes 16 ans. J'en ai 35 cette année.
            </p>
            <p>
              Ça fait 18 ans que je filme, monte, expérimente.<br />
              20 ans que je fais de la musique.<br />
              13 ans que je travaille le son, l'enregistrement et la technique.
            </p>
            <p>
              TikTok n'a été qu'un terrain d'application supplémentaire.
            </p>
            <p>
              Comme tout le monde, j'ai posté sans stratégie au début.
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
            <p>
              De là est née une méthode structurée.
            </p>
            <p>
              Aujourd'hui, j'accompagne plus de 300 créateurs — entrepreneurs, experts, marques — 
              qui veulent transformer leur contenu en levier business.
            </p>
          </div>
        </div>
      </Section>

      {/* Philosophie */}
      <Section variant="cream" size="lg">
        <div className="max-w-3xl mx-auto">
          <SectionHeader
            title="Ma philosophie"
            align="left"
          />

          <div className="prose prose-lg max-w-none text-muted-foreground space-y-4">
            <p>
              <strong>Chaque contenu doit servir un objectif.</strong>
            </p>
            <p>
              Un contenu qui ne génère ni autorité, ni audience qualifiée, ni clients 
              est un divertissement personnel. Pas une stratégie.
            </p>
            <p className="text-foreground font-semibold text-xl">
              On ne poste pas pour exister.<br />
              On poste pour convertir.
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
              <div className="w-14 h-14 bg-gradient-to-br from-primary/15 to-primary/5 rounded-xl flex items-center justify-center mb-5 group-hover:from-primary/25 group-hover:to-primary/10 transition-all duration-300">
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
              <div className="w-14 h-14 bg-gradient-to-br from-primary/15 to-primary/5 rounded-xl flex items-center justify-center mb-5 group-hover:from-primary/25 group-hover:to-primary/10 transition-all duration-300">
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
            Commence par un One Shot. Tu verras rapidement si ma méthode est faite pour toi.
          </p>
          <Button variant="hero" size="lg" asChild>
            <Link to="/one-shot">
              Découvrir le One Shot
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </Section>
    </Layout>
  );
}
