import { Link } from "react-router-dom";
import { useState, useEffect, useCallback, useRef } from "react";
import useEmblaCarousel from "embla-carousel-react";
import { ArrowRight, Quote, TrendingUp, Users, Eye, Play, Check, X, Target, Zap, Crown } from "lucide-react";
import { Layout } from "@/components/layout/Layout";
import { Section, SectionHeader } from "@/components/ui/section";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { trackEvent } from "@/lib/tracking";
import { SEOHead } from "@/components/SEOHead";

const videoTestimonials = [
  { id: "97xyXqwszrM", alt: "Témoignage client - Retour d'expérience sur l'accompagnement" },
  { id: "cc1cRfCEJGE", alt: "Témoignage client - Résultats après coaching stratégie de contenu" },
  { id: "hwTyjA6BORY", alt: "Témoignage client - Transformation de présence en ligne" },
  { id: "FrMFqiAqAkU", alt: "Témoignage client - Impact du One Shot sur la stratégie de contenu" },
  { id: "s-VaJvfFqbM", alt: "Témoignage client - Croissance après accompagnement" },
  { id: "wu2CPcqp-yU", alt: "Témoignage client - Avis sur le Wav Premium de Fred Wav" },
];

function VideoCard({ id, alt }: { id: string; alt: string }) {
  const [playing, setPlaying] = useState(false);

  if (playing) {
    return (
      <div className="aspect-video rounded-xl overflow-hidden shadow-lg">
        <iframe
          src={`https://www.youtube.com/embed/${id}?autoplay=1`}
          title={alt}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          className="w-full h-full"
        />
      </div>
    );
  }

  return (
    <button
      onClick={() => { trackEvent("click_video_play", { video_id: id, location: "preuves" }); setPlaying(true); }}
      className="group relative aspect-video rounded-xl overflow-hidden shadow-lg cursor-pointer w-full"
    >
      <img
        src={`https://img.youtube.com/vi/${id}/hqdefault.jpg`}
        alt={alt}
        width={480}
        height={360}
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
    content: "Ce qui m'a le plus aidé, c'était l'analyse de compte. J'ai fait une autre formation social media, et ta valeur ajoutée est visible dès le début. La communauté qui se soutient, les feedbacks directs... Merci Fred pour tout ce boulot, c'est génial.",
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
    content: "En tant qu'entrepreneure, j'ai besoin de toucher ma cible. L'analyse de compte, les prises de conscience et les choix à faire... j'ai obtenu des contrats depuis ! Le gros plus ? Le suivi sur la durée et la communauté. Je valide et je recommande.",
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
    category: "Accompagnement Wav Premium",
    title: "Passer du chaos à une stratégie claire",
    before: ["Publications irrégulières", "Aucun système", "Aucune lecture des stats"],
    after: ["Calendrier éditorial structuré", "Hooks retravaillés", "CTA optimisés", "Premières demandes entrantes"],
    resultLabel: "Résultat type observé",
    results: [
      "Vidéos qui dépassent régulièrement les 5k-15k vues",
      "1 à 3 prospects qualifiés par semaine",
      "Compréhension réelle des métriques",
    ],
  },
  {
    category: "Accompagnement Business",
    title: "Transformer l'audience en chiffre d'affaires",
    before: ["Des vues", "Peu de conversion", "Positionnement flou"],
    after: ["Offre clarifiée", "CTA stratégique", "Contenu orienté acquisition"],
    resultLabel: "Effet constaté",
    results: [
      "Plus de leads qualifiés",
      "Moins de perte d'audience",
      "Meilleur ratio vues / ventes",
    ],
  },
];

const stats = [
  { icon: Users, value: "300+", label: "Clients accompagnés" },
  { icon: Eye, value: "10M+", label: "Vues générées" },
  { icon: TrendingUp, value: "95%", label: "Taux de satisfaction" },
];

const chooseOffers = [
  {
    icon: Zap,
    title: "One Shot",
    description: "Diagnostic + plan d'action en 1h30",
    cta: "Réserver mon One Shot (179€)",
    href: "/one-shot",
    trackEvent: "cta_one_shot_click",
  },
  {
    icon: Target,
    title: "Wav Premium",
    description: "Transformation encadrée sur 45 jours",
    cta: "Candidater au Wav Premium",
    href: "/45-jours",
    trackEvent: "cta_45j_click",
  },
  {
    icon: Crown,
    title: "VIP",
    description: "Suivi continu, lives, feedback Discord",
    cta: "Rejoindre le VIP",
    href: "/offres/vip",
    trackEvent: "cta_vip_click",
  },
];

type Testimonial = typeof testimonials[number];

function MobileTestimonialCarousel({ testimonials }: { testimonials: Testimonial[] }) {
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true, align: "center" });
  const directionRef = useRef<"forward" | "backward">("forward");
  const prevIndexRef = useRef(0);
  const isUserActionRef = useRef(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const startAutoScroll = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = setInterval(() => {
      if (!emblaApi) return;
      if (directionRef.current === "forward") emblaApi.scrollNext();
      else emblaApi.scrollPrev();
    }, 4000);
  }, [emblaApi]);

  const stopAutoScroll = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (!emblaApi) return;

    const onSelect = () => {
      const newIndex = emblaApi.selectedScrollSnap();
      if (isUserActionRef.current) {
        const total = emblaApi.scrollSnapList().length;
        const diff = (newIndex - prevIndexRef.current + total) % total;
        if (diff <= total / 2) directionRef.current = "forward";
        else directionRef.current = "backward";
        isUserActionRef.current = false;
      }
      prevIndexRef.current = newIndex;
    };

    const onPointerDown = () => {
      isUserActionRef.current = true;
      stopAutoScroll();
    };

    const onPointerUp = () => {
      startAutoScroll();
    };

    emblaApi.on("select", onSelect);
    emblaApi.on("pointerDown", onPointerDown);
    emblaApi.on("pointerUp", onPointerUp);
    startAutoScroll();

    return () => {
      stopAutoScroll();
      emblaApi.off("select", onSelect);
      emblaApi.off("pointerDown", onPointerDown);
      emblaApi.off("pointerUp", onPointerUp);
    };
  }, [emblaApi, startAutoScroll, stopAutoScroll]);

  return (
    <div className="md:hidden overflow-hidden" ref={emblaRef}>
      <div className="flex">
        {testimonials.map((testimonial, index) => (
          <div key={index} className="flex-[0_0_92%] min-w-0 pl-3 first:pl-0">
            <Card className="h-full">
              <CardContent className="p-6 flex flex-col h-full">
                <Quote className="h-8 w-8 text-primary/30 mb-4" />
                <p className="text-muted-foreground mb-4 flex-1">{testimonial.content}</p>
                <div className="flex items-center justify-between mt-auto">
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
          </div>
        ))}
      </div>
    </div>
  );
}

export default function Preuves() {
  return (
    <Layout>
      <SEOHead title="Témoignages et Résultats Clients | Fred Wav" description="Découvre les résultats concrets de nos clients : témoignages vidéo, études de cas et retours d'expérience." path="/preuves" keywords="témoignages formats courts, résultats clients, études de cas, retours expérience, preuves" schema={{
        "@context": "https://schema.org",
        "@type": "Service",
        "name": "Accompagnement Formats Courts - Fred Wav",
        "aggregateRating": { "@type": "AggregateRating", "ratingValue": "4.8", "reviewCount": "300", "bestRating": "5" },
      }} />
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
          {videoTestimonials.map((video) => (
            <VideoCard key={video.id} id={video.id} alt={video.alt} />
          ))}
        </div>
      </Section>

      {/* CTA after videos */}
      <Section variant="dark" size="md">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="font-display text-2xl md:text-3xl font-semibold text-cream mb-4">
            Prêt à obtenir les mêmes résultats ?
          </h2>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              variant="hero"
              size="lg"
              asChild
              onClick={() => trackEvent("cta_one_shot_click", { location: "preuves_mid" })}
            >
              <Link to="/one-shot">
                Réserver mon One Shot (179€)
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button
              variant="premium"
              size="lg"
              asChild
              onClick={() => trackEvent("cta_45j_click", { location: "preuves_mid" })}
            >
              <Link to="/45-jours">
                Candidater au Wav Premium
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </Section>

      {/* Stats */}
      <Section variant="default" size="sm">
        <div className="flex flex-wrap justify-center gap-12">
          {stats.map((stat, index) => (
            <div key={index} className="text-center">
              <stat.icon className="h-6 w-6 text-primary mx-auto mb-2" />
              <div className="text-2xl font-bold">{stat.value}</div>
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

        <MobileTestimonialCarousel testimonials={testimonials} />

        {/* Desktop: grille classique */}
        <div className="hidden md:grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {testimonials.map((testimonial, index) => (
            <Card key={index} className="hover:shadow-lg transition-shadow">
              <CardContent className="p-6 flex flex-col h-full">
                <Quote className="h-8 w-8 text-primary/30 mb-4" />
                <p className="text-muted-foreground mb-4 flex-1">{testimonial.content}</p>
                <div className="flex items-center justify-between mt-auto">
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

        <div className="space-y-8">
          {caseStudies.map((study, index) => (
            <div
              key={index}
              className="bg-background rounded-2xl p-8 md:p-10 border border-border/50 hover:border-primary/30 hover:shadow-xl transition-all duration-300"
            >
              <span className="text-xs font-semibold uppercase tracking-widest text-primary">{study.category}</span>
              <h3 className="font-display text-2xl md:text-3xl font-bold mt-3 mb-8 tracking-tight">
                {study.title}
              </h3>

              <div className="grid md:grid-cols-2 gap-6 mb-8">
                <div className="bg-destructive/5 rounded-xl p-6">
                  <div className="text-xs font-bold uppercase tracking-widest text-destructive/60 mb-4">Avant</div>
                  <ul className="space-y-3">
                    {study.before.map((item, i) => (
                      <li key={i} className="flex items-start gap-3 text-muted-foreground line-through decoration-muted-foreground/30">
                        <X className="h-4 w-4 mt-0.5 shrink-0 text-destructive/60" />
                        <span className="text-sm">{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="bg-primary/10 rounded-xl p-6 border border-primary/20">
                  <div className="text-xs font-bold uppercase tracking-widest text-primary mb-4">Après</div>
                  <ul className="space-y-3">
                    {study.after.map((item, i) => (
                      <li key={i} className="flex items-start gap-3 text-foreground">
                        <Check className="h-4 w-4 mt-0.5 shrink-0 text-primary" />
                        <span className="text-sm font-medium">{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="bg-muted/50 rounded-xl p-6">
                <div className="text-xs font-bold uppercase tracking-widest text-primary mb-4">{study.resultLabel}</div>
                <ul className="grid md:grid-cols-3 gap-3">
                  {study.results.map((result, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-foreground/80">
                      <Check className="h-4 w-4 mt-0.5 shrink-0 text-primary" />
                      {result}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}

          {/* One Shot manifeste */}
          <div className="bg-noir rounded-2xl p-10 md:p-14 text-center border border-primary/20 hover:border-primary/40 hover:shadow-xl transition-all duration-300">
            <span className="text-xs font-semibold uppercase tracking-widest text-primary">One Shot stratégique</span>
            <h3 className="font-display text-2xl md:text-3xl font-bold mt-3 mb-8 tracking-tight text-cream">
              Arrêter de poster pour rien
            </h3>
            <div className="space-y-2 text-cream/70 text-lg max-w-md mx-auto mb-8">
              <p>Diagnostic direct.</p>
              <p>Ajustement clair.</p>
              <p>Repositionnement immédiat.</p>
            </div>
            <div className="flex items-center justify-center gap-3 text-primary font-semibold">
              <Target className="h-5 w-5" />
              <span>Objectif : faire en sorte que chaque vidéo serve une stratégie.</span>
            </div>
          </div>
        </div>
      </Section>

      {/* Quel accompagnement choisir */}
      <Section variant="default" size="lg">
        <SectionHeader
          title="Quel accompagnement choisir ?"
          subtitle="Trois formules selon ton besoin."
        />

        <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto mb-8">
          {chooseOffers.map((offer) => (
            <div key={offer.title} className="bg-muted/50 rounded-xl p-6 text-center border border-border hover:border-primary/30 transition-all">
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <offer.icon className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-semibold text-lg mb-2">{offer.title}</h3>
              <p className="text-sm text-muted-foreground mb-4">{offer.description}</p>
              <div className="flex justify-center">
                <Button
                  variant="premium"
                  size="sm"
                  asChild
                  onClick={() => trackEvent(offer.trackEvent, { location: "preuves_bottom" })}
                >
                  <Link to={offer.href}>
                    {offer.cta}
                    <ArrowRight className="ml-2 h-3 w-3" />
                  </Link>
                </Button>
              </div>
            </div>
          ))}
        </div>
      </Section>
    </Layout>
  );
}
