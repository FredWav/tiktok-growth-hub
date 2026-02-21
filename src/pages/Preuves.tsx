import { Link } from "react-router-dom";
import { useState } from "react";
import { ArrowRight, Quote, TrendingUp, Users, Eye, Play } from "lucide-react";
import { Layout } from "@/components/layout/Layout";
import { Section, SectionHeader } from "@/components/ui/section";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

const videoTestimonials = [
  "97xyXqwszrM",
  "cc1cRfCEJGE",
  "hwTyjA6BORY",
  "FrMFqiAqAkU",
  "s-VaJvfFqbM",
];

function VideoCard({ id }: { id: string }) {
  const [playing, setPlaying] = useState(false);

  if (playing) {
    return (
      <div className="aspect-video rounded-xl overflow-hidden shadow-lg">
        <iframe
          src={`https://www.youtube.com/embed/${id}?autoplay=1`}
          title="Témoignage client"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          className="w-full h-full"
        />
      </div>
    );
  }

  return (
    <button
      onClick={() => setPlaying(true)}
      className="group relative aspect-video rounded-xl overflow-hidden shadow-lg cursor-pointer w-full"
    >
      <img
        src={`https://img.youtube.com/vi/${id}/hqdefault.jpg`}
        alt="Témoignage client"
        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
        loading="lazy"
      />
      <div className="absolute inset-0 bg-black/30 group-hover:bg-black/40 transition-colors flex items-center justify-center">
        <div className="w-16 h-16 rounded-full bg-primary/90 flex items-center justify-center group-hover:scale-110 transition-transform shadow-xl">
          <Play className="h-7 w-7 text-primary-foreground ml-1" fill="currentColor" />
        </div>
      </div>
    </button>
  );
}

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
    title: "Structuration et premières performances",
    category: "Accompagnement 45 jours",
    description: "Créateur débutant qui avait du mal à publier régulièrement et à comprendre ses statistiques. Travail sur la régularité, la rétention et les premiers leads entrants.",
    metrics: [
      { label: "Progression des vues", value: "<1K → 20K" },
      { label: "Ligne éditoriale", value: "Structure claire" },
      { label: "Demandes entrantes", value: "1-3/semaine" },
    ],
    disclaimer: "Pas de promesse de viralité. Travail sur la méthode.",
  },
  {
    title: "Optimisation d'un compte actif",
    category: "Accompagnement Business",
    description: "Créateur déjà présent sur TikTok mais sans stratégie de conversion. Travail sur les hooks, scripts, positionnement offre et optimisation des CTA.",
    metrics: [
      { label: "Engagement", value: "En hausse" },
      { label: "Rétention", value: "Améliorée" },
      { label: "Leads", value: "Croissance" },
    ],
    disclaimer: "Focus : performance durable, pas coup d'éclat.",
  },
  {
    title: "Clarification et repositionnement",
    category: "One Shot stratégique",
    description: "Consultant ou coach avec contenu flou ou mal perçu. Audit du profil, refonte bio, clarification de la promesse et ajustement éditorial.",
    metrics: [
      { label: "Positionnement", value: "Plus clair" },
      { label: "Autorité", value: "Signaux forts" },
      { label: "Leads qualifiés", value: "Invitations & collabs" },
    ],
    disclaimer: "Résultats progressifs. Pas de raccourci.",
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

      {/* Video Testimonials */}
      <Section variant="cream" size="lg">
        <SectionHeader
          title="Ils témoignent en vidéo"
          subtitle="Des retours authentiques, face caméra."
        />

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {videoTestimonials.slice(0, 3).map((id) => (
            <VideoCard key={id} id={id} />
          ))}
        </div>
        <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto mt-6">
          {videoTestimonials.slice(3).map((id) => (
            <VideoCard key={id} id={id} />
          ))}
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
          subtitle="Des transformations mesurables et documentées."
        />

        <div className="space-y-6">
          {caseStudies.map((study, index) => (
            <div
              key={index}
              className="bg-background rounded-2xl p-8 md:p-10 border border-border/50 hover:border-primary/30 hover:shadow-xl transition-all duration-300"
            >
              <div className="grid lg:grid-cols-2 gap-8 items-center">
                <div>
                  <span className="text-xs font-semibold uppercase tracking-widest text-primary">{study.category}</span>
                  <h3 className="font-display text-2xl md:text-3xl font-bold mt-3 mb-4 tracking-tight">
                    {study.title}
                  </h3>
                  <p className="text-muted-foreground leading-relaxed">{study.description}</p>
                  <p className="text-xs text-muted-foreground/60 italic mt-4 border-l-2 border-primary/20 pl-3">{study.disclaimer}</p>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  {study.metrics.map((metric, i) => (
                    <div key={i} className="text-center bg-noir rounded-xl p-5 shadow-md">
                      <div className="text-lg md:text-xl font-bold text-primary mb-1">{metric.value}</div>
                      <div className="text-[11px] uppercase tracking-wider text-cream/60 font-medium">{metric.label}</div>
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
