import { Link } from "react-router-dom";
import { ArrowRight, Target, Users, TrendingUp, Award } from "lucide-react";
import { Layout } from "@/components/layout/Layout";
import { Section, SectionHeader } from "@/components/ui/section";
import { Button } from "@/components/ui/button";

const values = [
  {
    icon: Target,
    title: "Focus résultats",
    description: "Je ne travaille pas pour les vanity metrics. Tout ce qu'on fait ensemble vise un objectif business concret.",
  },
  {
    icon: Users,
    title: "Approche personnalisée",
    description: "Pas de template copié-collé. Chaque stratégie est construite sur mesure pour ta situation.",
  },
  {
    icon: TrendingUp,
    title: "Méthode éprouvée",
    description: "3 ans d'expérience, +100 clients accompagnés. Mes méthodes ont été testées et affinées.",
  },
  {
    icon: Award,
    title: "Transparence totale",
    description: "Je te dis ce qui marche et ce qui ne marchera pas. Pas de promesses vides ou de surprises.",
  },
];

const stats = [
  { value: "100+", label: "Clients accompagnés" },
  { value: "10M+", label: "Vues générées" },
  { value: "3 ans", label: "D'expertise TikTok" },
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
              Coach en stratégie de contenu TikTok, j'aide les entrepreneurs et créateurs 
              à développer une présence qui génère des clients, pas juste des likes.
            </p>
            <p className="text-muted-foreground">
              Mon approche ? Du concret, de la stratégie, et des résultats mesurables. 
              Pas de bullshit marketing, pas de hacks miracles. Juste ce qui fonctionne.
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

      {/* Story */}
      <Section variant="default" size="lg">
        <div className="max-w-3xl mx-auto">
          <SectionHeader
            title="Mon parcours"
            align="left"
          />

          <div className="prose prose-lg max-w-none text-muted-foreground space-y-4">
            <p>
              J'ai commencé sur TikTok comme tout le monde : sans stratégie, à poster des vidéos 
              en espérant que l'algorithme fasse le travail.
            </p>
            <p>
              Après des mois de frustration, j'ai décidé de comprendre vraiment comment la plateforme 
              fonctionnait. J'ai analysé des milliers de vidéos, testé des centaines de formats, 
              et développé une méthode qui marche.
            </p>
            <p>
              Aujourd'hui, j'applique cette méthode pour mes clients. Des entrepreneurs, des créateurs, 
              des marques qui veulent des résultats concrets. Pas des promesses.
            </p>
            <p>
              Ma philosophie est simple : <strong>chaque contenu doit servir un objectif</strong>. 
              Si ça ne génère pas de résultats business, ça ne sert à rien.
            </p>
          </div>
        </div>
      </Section>

      {/* Values */}
      <Section variant="cream" size="lg">
        <SectionHeader
          title="Ma façon de travailler"
          subtitle="Des principes simples qui guident tous mes accompagnements."
        />

        <div className="grid md:grid-cols-2 gap-6">
          {values.map((value, index) => (
            <div
              key={index}
              className="bg-background rounded-xl p-8 hover:shadow-lg transition-shadow"
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
      <Section variant="default" size="lg">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="font-display text-3xl font-semibold mb-4">
            Envie de travailler ensemble ?
          </h2>
          <p className="text-muted-foreground mb-6">
            Commence par un One Shot pour voir si ma méthode te convient.
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
