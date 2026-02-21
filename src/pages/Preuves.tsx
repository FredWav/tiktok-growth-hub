import { Link } from "react-router-dom";
import { ArrowRight, Quote, TrendingUp, Users, Eye } from "lucide-react";
import { Layout } from "@/components/layout/Layout";
import { Section, SectionHeader } from "@/components/ui/section";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

const testimonials = [
  {
    name: "Estelle",
    role: "Membre de la formation",
    content: "Ce qui m'a le plus aidé, c'était l'analyse de compte. J'ai fait une autre formation social media, et ta valeur ajoutée est visible dès le début. La communauté qui se soutient, les feedbacks directs sur TikTok… Merci Fred pour tout ce boulot, c'est génial.",
    result: "Analyse de compte",
  },
  {
    name: "Delphine",
    role: "Membre de la formation",
    content: "Grâce à ta patience et à tes conseils bienveillants, je me suis sentie tout de suite à l'aise. Tout est clair, concis et précis. En résumé : l'écoute, le professionnalisme, la disponibilité et les supports adaptés à tous. Je conseille vivement, même à ceux qui ne sont pas doués en informatique !",
    result: "Mise en confiance",
  },
  {
    name: "Alex",
    role: "Coffre à Cartes",
    content: "J'ai pris la formation pour apprendre les dessous de l'application et me professionnaliser. L'accompagnement était total, l'interaction avec les autres juste parfait. Outils, tips, conseils et entraide, tout est réuni.",
    result: "Professionnalisation",
  },
  {
    name: "Betty",
    role: "Entrepreneure",
    content: "En tant qu'entrepreneure, j'ai besoin de toucher ma cible. L'analyse de compte, les prises de conscience et les choix à faire… j'ai obtenu des contrats depuis ! Le gros plus ? Le suivi sur la durée et la communauté. Je valide et je recommande.",
    result: "Contrats obtenus",
  },
  {
    name: "Reva",
    role: "Créatrice de contenu",
    content: "Ta formation, c'est bien plus qu'un programme : c'est une vraie mine de ressources, un espace de soutien et un accompagnement hyper précieux. Grâce à toi, j'ai appris énormément de choses. Je ne lâche pas !",
    result: "Mine de ressources",
  },
];

const caseStudies = [
  {
    title: "De 0 à 50K en 3 mois",
    category: "Accompagnement 45 jours",
    description: "Un coach business qui partait de zéro et qui a construit une audience engagée en appliquant la méthode.",
    metrics: [
      { label: "Followers", value: "0 → 52K" },
      { label: "Vues/mois", value: "1.2M" },
      { label: "Clients via TikTok", value: "+30" },
    ],
  },
  {
    title: "Multiplication x5 du CA",
    category: "VIP",
    description: "Une marque e-commerce qui a utilisé TikTok comme levier principal d'acquisition.",
    metrics: [
      { label: "CA mensuel", value: "x5" },
      { label: "Coût d'acquisition", value: "-60%" },
      { label: "ROI TikTok", value: "800%" },
    ],
  },
  {
    title: "Positionnement expert",
    category: "One Shot + 45 jours",
    description: "Un consultant qui a voulu se positionner comme référence dans sa niche grâce au contenu.",
    metrics: [
      { label: "Autorité perçue", value: "++++" },
      { label: "Invitations podcast", value: "12" },
      { label: "Nouveaux clients HG", value: "+8" },
    ],
  },
];

const stats = [
  { icon: Users, value: "100+", label: "Clients accompagnés" },
  { icon: Eye, value: "10M+", label: "Vues générées" },
  { icon: TrendingUp, value: "95%", label: "Taux de satisfaction" },
];

export default function Preuves() {
  return (
    <Layout>
      {/* Hero */}
      <Section variant="cream" size="lg">
        <div className="max-w-3xl mx-auto text-center">
          <h1 className="font-display text-4xl md:text-5xl font-semibold tracking-tight mb-6">
            Des résultats, <span className="text-gold-gradient">pas des promesses</span>
          </h1>
          <p className="text-lg text-muted-foreground">
            Ce que mes clients ont accompli en appliquant la méthode.
            Pas de chiffres gonflés. Juste la réalité.
          </p>
        </div>
      </Section>

      {/* Stats */}
      <Section variant="dark" size="sm">
        <div className="flex flex-wrap justify-center gap-12">
          {stats.map((stat, index) => (
            <div key={index} className="text-center">
              <stat.icon className="h-6 w-6 text-primary mx-auto mb-2" />
              <div className="text-2xl font-bold text-cream">{stat.value}</div>
              <div className="text-sm text-muted-foreground">{stat.label}</div>
            </div>
          ))}
        </div>
      </Section>

      {/* Testimonials */}
      <Section variant="default" size="lg">
        <SectionHeader
          title="Ce qu'ils en disent"
          subtitle="Retours directs de clients après leur accompagnement."
        />

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {testimonials.map((testimonial, index) => (
            <Card key={index} className="hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <Quote className="h-8 w-8 text-primary/30 mb-4" />
                <p className="text-muted-foreground mb-4">{testimonial.content}</p>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-semibold">{testimonial.name}</div>
                    <div className="text-sm text-muted-foreground">{testimonial.role}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-semibold text-primary">{testimonial.result}</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </Section>

      {/* Case Studies */}
      <Section variant="cream" size="lg">
        <SectionHeader
          title="Études de cas"
          subtitle="Des exemples concrets de transformations."
        />

        <div className="space-y-8">
          {caseStudies.map((study, index) => (
            <div
              key={index}
              className="bg-background rounded-xl p-8 hover:shadow-lg transition-shadow"
            >
              <div className="grid lg:grid-cols-2 gap-8 items-center">
                <div>
                  <span className="text-sm text-primary font-medium">{study.category}</span>
                  <h3 className="font-display text-2xl font-semibold mt-2 mb-4">
                    {study.title}
                  </h3>
                  <p className="text-muted-foreground">{study.description}</p>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  {study.metrics.map((metric, i) => (
                    <div key={i} className="text-center bg-muted/50 rounded-lg p-4">
                      <div className="text-xl font-bold text-primary">{metric.value}</div>
                      <div className="text-xs text-muted-foreground mt-1">{metric.label}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </Section>

      {/* CTA */}
      <Section variant="default" size="lg">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="font-display text-3xl font-semibold mb-4">
            À ton tour ?
          </h2>
          <p className="text-muted-foreground mb-6">
            Ces résultats sont accessibles. Il suffit de commencer.
          </p>
          <Button variant="hero" size="lg" asChild>
            <Link to="/one-shot">
              Réserver un One Shot — 179€
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </Section>
    </Layout>
  );
}
