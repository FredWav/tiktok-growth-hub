import { Link } from "react-router-dom";
import { ArrowRight, Check, Target, BarChart3, Repeat, Zap } from "lucide-react";
import { Layout } from "@/components/layout/Layout";
import { Section, SectionHeader } from "@/components/ui/section";
import { Button } from "@/components/ui/button";
import { SEOHead } from "@/components/SEOHead";
import { seoFor, SATELLITE_FAQ } from "@/config/seo";
import { EXPRESS_PRICE_LABEL } from "@/config/offers";
import { trackEvent } from "@/lib/tracking";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

// ─────────────────────────────────────────────────────────────────────────────
// DRAFT à faire relire par Fred. Texte tiré de sa matière réelle
// (wavacademy_content.txt) — aucune preuve ni chiffre inventé.
// Test décisif appliqué : enlève « TikTok » et le contenu ne tient plus →
// preuve que ce n'est PAS un gabarit interchangeable (pas de doorway page).
// ─────────────────────────────────────────────────────────────────────────────

const tiktokMethod = [
  {
    icon: Target,
    title: "Le hook",
    description: "Sur TikTok, les 2-3 premières secondes décident de tout : l'algorithme pousse ou coupe selon ce que fait ton audience à l'ouverture. On travaille tes accroches en premier.",
  },
  {
    icon: BarChart3,
    title: "La rétention et le watch time",
    description: "Le taux de complétion et le temps de visionnage sont ce que TikTok regarde le plus. On repère la seconde exacte où l'audience décroche, et on corrige ce point-là.",
  },
  {
    icon: Repeat,
    title: "L'appel à l'action",
    description: "Des vues qui ne déclenchent rien, c'est un problème d'appel à l'action : un DM, un abonnement, une visite de profil. On construit des CTA qui font réagir sans donner l'impression de vendre.",
  },
  {
    icon: Zap,
    title: "La régularité qui tient",
    description: "Poster 3 fois par semaine avec méthode bat poster tous les jours à l'aveugle. On installe un rythme que tu peux tenir sur la durée.",
  },
];

export default function AccompagnementTikTok() {
  return (
    <Layout>
      <SEOHead {...seoFor("/accompagnement-tiktok")} />

      {/* ===== Fil d'Ariane ===== */}
      <Section variant="cream" size="sm" className="pb-0">
        <nav aria-label="Fil d'Ariane" className="max-w-4xl mx-auto text-sm text-muted-foreground">
          <Link to="/accompagnement-reseaux-sociaux" className="hover:text-primary transition-colors">
            Accompagnement réseaux sociaux
          </Link>
          <span className="mx-2">/</span>
          <span className="text-foreground">Accompagnement TikTok</span>
        </nav>
      </Section>

      {/* ===== Hero ===== */}
      <Section variant="cream" size="lg" className="pt-8">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="font-display text-4xl md:text-5xl lg:text-6xl font-semibold tracking-tight mb-6">
            Accompagnement TikTok pour créateurs —{" "}
            <span className="text-gold-gradient">organique, en formats courts.</span>
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-4">
            Hooks, rétention, lecture de tes stats, régularité. On travaille sur ce que l'algorithme regarde vraiment — que ton objectif soit de signer des clients ou simplement d'être vu et d'intéresser des marques.
          </p>
          {/* Cadrage validé par Fred : organique au cœur, Shop exclu, pub possible selon le profil. */}
          <p className="text-sm text-muted-foreground/80 max-w-2xl mx-auto mb-8">
            Le cœur du travail, c'est l'organique : de la vidéo qui travaille pour toi, sans budget média. Hors TikTok Shop — la pub, on peut en parler selon ton profil.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Button variant="hero" size="xl" asChild onClick={() => trackEvent("cta_academy_click", { location: "satellite_hero" })}>
              <Link to="/wavacademy">
                Voir la méthode complète
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
            <Button variant="outline" size="xl" asChild onClick={() => trackEvent("cta_express_click", { location: "satellite_hero" })}>
              <Link to="/analyse-express">Lancer mon audit TikTok ({EXPRESS_PRICE_LABEL})</Link>
            </Button>
          </div>
        </div>
      </Section>

      {/* ===== Le problème spécifique TikTok ===== */}
      <Section variant="default" size="lg">
        <div className="max-w-3xl mx-auto">
          <SectionHeader
            title="Le problème n'est pas ton contenu. C'est ce que tu ne mesures pas."
            subtitle="Sur TikTok plus qu'ailleurs, une vidéo peut échouer pour dix raisons — et sans lire tes stats, tu ne sais pas laquelle."
          />
          <div className="space-y-4 text-muted-foreground leading-relaxed">
            <p>
              Quand ta rétention chute à la seconde 4, ce n'est pas tout ton contenu qu'il faut changer : c'est ton hook. Quand l'audience regarde jusqu'au bout mais ne s'abonne pas, ce n'est pas ton montage : c'est ton CTA. C'est chirurgical, c'est mesurable — un paramètre à la fois.
            </p>
            <p>
              Un créateur qui poste sans diagnostic fait 300 vidéos pour trouver « la bonne ». Un créateur qui analyse ses résultats après chaque vidéo en fait 15 à 20, mais chacune est un test calibré. Le résultat est le même. Le chemin, non.
            </p>
          </div>
        </div>
      </Section>

      {/* ===== La méthode TikTok ===== */}
      <Section variant="cream" size="lg">
        <SectionHeader
          title="Ce sur quoi on travaille"
          subtitle="Les leviers propres à TikTok, dans l'ordre où ils comptent."
        />
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-5xl mx-auto">
          {tiktokMethod.map((item) => (
            <div key={item.title} className="bg-background border border-border rounded-xl p-6 text-center hover:border-primary/40 transition-colors">
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <item.icon className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-semibold mb-2">{item.title}</h3>
              <p className="text-sm text-muted-foreground">{item.description}</p>
            </div>
          ))}
        </div>
      </Section>

      {/* ===== L'outil : Analyse Express ===== */}
      <Section variant="default" size="md">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="font-display text-2xl md:text-3xl font-semibold mb-4">
            Un diagnostic de ton compte pour commencer
          </h2>
          <p className="text-muted-foreground leading-relaxed mb-6">
            Avant même de travailler ensemble, l'Analyse Express te donne pour {EXPRESS_PRICE_LABEL} un état des lieux complet de ton compte TikTok : score de santé, analyse de tes 30 dernières vidéos, plan d'action. Tu sais exactement où tu en es.
          </p>
          <Button variant="hero" size="lg" asChild onClick={() => trackEvent("cta_express_click", { location: "satellite_tool" })}>
            <Link to="/analyse-express">
              Lancer mon audit TikTok
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </Section>

      {/* ===== Preuves + rattachement au pilier ===== */}
      <Section variant="cream" size="md">
        <div className="max-w-2xl mx-auto text-center">
          <p className="text-muted-foreground leading-relaxed mb-6">
            TikTok n'est qu'une porte d'entrée : une fois la méthode en main, elle se transpose à tes Reels et tes Shorts. C'est tout l'objet de{" "}
            <Link to="/accompagnement-reseaux-sociaux" className="text-primary underline hover:no-underline">
              l'accompagnement réseaux sociaux
            </Link>.
          </p>
          <Button variant="premium" size="lg" asChild onClick={() => trackEvent("click_proof_strip", { location: "satellite" })}>
            <Link to="/preuves">
              Voir les résultats clients
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </Section>

      {/* ===== FAQ ===== */}
      <Section variant="default" size="lg">
        <div className="max-w-2xl mx-auto">
          <SectionHeader title="Les questions que tu te poses." />
          <Accordion type="single" collapsible className="w-full">
            {SATELLITE_FAQ.map((item, i) => (
              <AccordionItem key={i} value={`faq-${i}`}>
                <AccordionTrigger className="text-left font-medium" onClick={() => trackEvent("faq_open", { question: item.question, location: "satellite" })}>
                  {item.question}
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground leading-relaxed">
                  {item.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </Section>

      {/* ===== CTA final ===== */}
      <Section variant="dark" size="lg">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="font-display text-3xl md:text-4xl font-semibold mb-4 text-cream">
            Arrête de poster à l'aveugle sur TikTok.
          </h2>
          <p className="text-cream/70 text-lg mb-8">
            La méthode, l'outil, la communauté et mes lives — pour diagnostiquer chaque vidéo et corriger ce qui bloque.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button variant="hero" size="xl" asChild onClick={() => trackEvent("cta_academy_click", { location: "satellite_bottom" })}>
              <Link to="/wavacademy">
                Rejoindre la Wav Academy
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
          </div>
        </div>
      </Section>
    </Layout>
  );
}
