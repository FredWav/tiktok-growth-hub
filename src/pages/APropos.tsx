import { Link } from "react-router-dom";
import { ArrowRight, Target, Users, TrendingUp, Award } from "lucide-react";
import { Layout } from "@/components/layout/Layout";
import { Section, SectionHeader } from "@/components/ui/section";
import { Button } from "@/components/ui/button";

const values = [
  {
    icon: Target,
    title: "Focus résultats",
    description: "On vise des objectifs business clairs. Pas des vanity metrics.",
  },
  {
    icon: Users,
    title: "Approche personnalisée",
    description: "Pas de template universel. Chaque stratégie est construite sur ton positionnement, ton marché, ton niveau.",
  },
  {
    icon: TrendingUp,
    title: "Méthode éprouvée",
    description: "18 ans de création vidéo. 300+ créateurs accompagnés. Une méthode testée sur le terrain.",
  },
  {
    icon: Award,
    title: "Transparence totale",
    description: "Je te dis ce qui fonctionne. Je te dis aussi ce qui ne fonctionnera pas. Même si ce n'est pas agréable à entendre.",
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
              Mes premières vidéos remontent à mes 18 ans. J'en ai 19 cette année.
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
      <Section variant="default" size="lg">
        <SectionHeader
          title="Ma façon de travailler"
          subtitle="Des principes simples qui guident tous mes accompagnements."
        />

        <div className="grid md:grid-cols-2 gap-6">
          {values.map((value, index) => (
            <div
              key={index}
              className="bg-background rounded-xl p-8 hover:shadow-lg transition-shadow border border-border"
            >
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                <value.icon className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-semibold text-xl mb-2">{value.title}</h3>
              <p className="text-muted-foreground">{value.description}</p>
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
