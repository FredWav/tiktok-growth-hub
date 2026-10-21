import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { Layout } from "@/components/layout/Layout";
import { Section, SectionHeader } from "@/components/ui/section";
import { Button } from "@/components/ui/button";
import { trackCtaClick } from "@/lib/funnel-events";
import { SEOHead } from "@/components/SEOHead";
import { seoFor } from "@/config/seo";
import { ScreenshotWall } from "@/components/ScreenshotWall";
import { ClientResults } from "@/components/ClientResults";
import { VideoTestimonials } from "@/components/VideoCard";

export default function Temoignages() {
  return (
    <Layout>
      <SEOHead {...seoFor("/temoignages")} />
      <Section variant="cream" size="lg">
        <div className="max-w-3xl mx-auto text-center">
          <h1 className="font-display text-4xl md:text-5xl font-semibold tracking-tight mb-6">
            Témoignages : <span className="text-gold-gradient">ils l’ont fait, ils en parlent</span>
          </h1>
          <p className="text-lg text-muted-foreground">
            Abonnés gagnés, vidéos à des centaines de milliers de vues, premiers revenus : ce que des créateurs,
            entrepreneurs et experts accompagnés par Fred ont obtenu, avec leurs propres mots.
          </p>
        </div>
      </Section>

      {/* Résultats clients documentés */}
      <Section variant="cream" size="md" className="pt-0">
        <SectionHeader
          title="Des résultats documentés."
          subtitle="Des créateurs réels, des chiffres réels."
        />
        <ClientResults />
      </Section>

      {/* Video Testimonials */}
      <Section variant="cream" size="lg">
        <SectionHeader
          title="Ils témoignent en vidéo"
          subtitle="Des retours authentiques, face caméra."
        />

        <VideoTestimonials location="temoignages" className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto" />
      </Section>

      {/* Screenshot Wall */}
      <Section variant="cream" size="lg">
        <ScreenshotWall location="preuves" title="Ce qu'ils en disent" subtitle="Retours directs de clients après leur accompagnement." cols={2} />
      </Section>

      {/* Suite : les deux familles d'offres */}
      <Section variant="dark" size="lg">
        <div className="mx-auto max-w-4xl text-center">
          <h2 className="font-display text-3xl md:text-4xl font-semibold text-cream mb-4">
            Et toi, par où commencer ?
          </h2>
          <p className="text-cream/70 mb-10">
            Un diagnostic automatisé pour comprendre ce qui bloque, ou un accompagnement avec Fred pour avancer.
          </p>
          <div className="grid gap-6 md:grid-cols-2 text-left">
            {[
              {
                title: "Les analyses",
                body: "Une vidéo dès 2,90 €, tout ton compte à 19,90 €. Rapport en quelques minutes, sans abonnement.",
                href: "/analyses",
                cta: "Voir les analyses",
              },
              {
                title: "Les accompagnements",
                body: "One Shot, Wav Academy à vie ou Wav Premium individuel : travailler directement avec Fred.",
                href: "/accompagnements",
                cta: "Voir les accompagnements",
              },
            ].map((item) => (
              <div key={item.href} className="rounded-2xl border border-primary/30 p-6">
                <h3 className="font-display text-2xl text-cream mb-2">{item.title}</h3>
                <p className="text-cream/70 mb-6">{item.body}</p>
                <Button
                  variant="hero"
                  asChild
                  onClick={() => trackCtaClick(item.href, "temoignages")}
                >
                  <Link to={item.href}>
                    {item.cta}
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </div>
            ))}
          </div>
        </div>
      </Section>
    </Layout>
  );
}
