import { Check, Database, Eye, Filter, ListChecks, PlayCircle, Quote, Sparkles, Target, X } from "lucide-react";
import { Layout } from "@/components/layout/Layout";
import { Section, SectionHeader } from "@/components/ui/section";
import { Button } from "@/components/ui/button";
import { SEOHead } from "@/components/SEOHead";
import { seoFor } from "@/config/seo";
import { NewsletterForm } from "@/components/NewsletterForm";
import { HOOKS_FAQ } from "@/config/hooks-faq";
import {
  HOOKS_BUNDLE,
  HOOKS_EXAMPLES,
  HOOKS_LIBRARY,
  HOOKS_PACK_FEATURES,
  HOOKS_PACKS_OFFER,
  HOOKS_PACKS_TOTAL_PRICE,
  pricePerHook,
  type HooksPackOffer,
} from "@/config/hooks-offer";
import { trackEvent } from "@/lib/tracking";
import { Link } from "react-router-dom";
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/components/ui/accordion";

const scrollToPacks = () =>
  document.getElementById("packs")?.scrollIntoView({ behavior: "smooth" });

const trackBuy = (code: string, position: string) =>
  trackEvent("hooks_pack_click", { pack: code, position });

// Sur mobile, le pack mis en avant passe en premier : 250, 500, puis 100.
const MOBILE_ORDER: Record<HooksPackOffer["code"], string> = {
  hooks_250: "order-1",
  hooks_500: "order-2",
  hooks_100: "order-3",
};

/** Surligne les [CASES] d'une structure de hook. */
function Structure({ text }: { text: string }) {
  return (
    <>
      {text.split(/(\[[^\]]+\])/).map((part, i) =>
        part.startsWith("[") ? (
          <span key={i} className="whitespace-nowrap rounded bg-gold/30 px-1.5 py-0.5 text-[0.9em] font-semibold">
            {part}
          </span>
        ) : (
          part
        ),
      )}
    </>
  );
}

const method = [
  {
    icon: Database,
    title: `${HOOKS_LIBRARY.analyzedVideos} de vidéos analysées`,
    description: "Des vidéos TikTok passées au crible. C'est le point de départ, pas le résultat.",
  },
  {
    icon: Filter,
    title: `${HOOKS_LIBRARY.minViews} vues et ${HOOKS_LIBRARY.minMultiple} minimum`,
    description:
      "On garde seulement les vidéos qui ont fait au moins 100 000 vues et au moins 5 fois les vues habituelles du compte qui les a publiées.",
  },
  {
    icon: ListChecks,
    title: "Relus un par un",
    description: `On ne garde que les hooks transposables à toutes les niches. Résultat : ${HOOKS_LIBRARY.total} hooks, 0 inventé.`,
  },
];

export default function HooksTikTok() {
  return (
    <Layout>
      <SEOHead {...seoFor("/hooks-tiktok")} />

      {/* ── HERO ─────────────────────────────────────────────────────────── */}
      <Section variant="default" size="xl" className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-cream via-background to-primary/5 -z-10" />
        <div className="max-w-4xl mx-auto text-center">
          <span className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-primary mb-5">
            <Sparkles className="h-3.5 w-3.5" /> Bibliothèque de hooks TikTok
          </span>
          <h1 className="font-display text-4xl md:text-5xl lg:text-6xl font-semibold tracking-tight mb-6 text-balance">
            Des hooks TikTok qui ont vraiment performé.{" "}
            <span className="text-gold-gradient">Pas des hooks inventés.</span>
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto mb-8 leading-relaxed">
            Des accroches réelles, tirées de vidéos TikTok qui ont explosé les vues habituelles de leur compte.
            Chacune avec sa structure réutilisable pour ta niche.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-stretch sm:items-center">
            <Button variant="hero" size="xl" onClick={scrollToPacks}>
              Voir les packs
            </Button>
            <Button variant="outline" size="xl" asChild>
              <a href="#exemples">Voir un exemple de fiche</a>
            </Button>
          </div>
          <p className="text-sm text-muted-foreground mt-4">
            Paiement sécurisé. Fichiers envoyés par email dès le paiement validé.
          </p>
          <ul className="grid grid-cols-3 max-w-2xl mx-auto mt-12 rounded-2xl border border-border bg-background shadow-sm divide-x divide-border">
            {[
              { value: String(HOOKS_LIBRARY.total), label: "hooks réels" },
              { value: HOOKS_LIBRARY.minMultiple, label: "minimum les vues du compte" },
              { value: "0", label: "hook inventé" },
            ].map((s) => (
              <li key={s.label} className="px-2 py-5">
                <span className="block font-display text-3xl md:text-4xl font-bold">{s.value}</span>
                <span className="block text-xs md:text-sm text-muted-foreground mt-1 leading-snug">{s.label}</span>
              </li>
            ))}
          </ul>
        </div>
      </Section>

      {/* ── LE PROBLÈME ──────────────────────────────────────────────────── */}
      <Section variant="default" size="md">
        <div className="max-w-3xl mx-auto">
          <h2 className="font-display text-3xl md:text-4xl font-semibold tracking-tight mb-8">
            Des listes de hooks, il y en a partout.
          </h2>
          <ul className="space-y-4">
            {[
              "La plupart sont inventées, ou recopiées d'une autre liste.",
              "Personne ne te montre la vidéo d'où elles viennent.",
              "Aucune preuve qu'elles ont marché une seule fois.",
            ].map((line) => (
              <li key={line} className="flex items-start gap-3 text-lg">
                <span className="mt-0.5 flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg bg-secondary text-muted-foreground">
                  <X className="h-4 w-4" />
                </span>
                {line}
              </li>
            ))}
          </ul>
          <p className="font-display text-xl md:text-2xl font-semibold mt-8 pt-6 border-t border-border">
            Ici, chaque hook vient d'une vraie vidéo. Et tu as le lien.
          </p>
        </div>
      </Section>

      {/* ── LA MÉTHODE ───────────────────────────────────────────────────── */}
      <Section variant="cream" size="lg">
        <SectionHeader
          title={`Comment les ${HOOKS_LIBRARY.total} hooks ont été choisis`}
          subtitle="Pas d'avis, pas de feeling. Trois filtres, dans cet ordre."
        />
        <ol className="grid md:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {method.map((step, i) => (
            <li key={step.title} className="rounded-2xl border border-border bg-background p-6 shadow-sm">
              <div className="flex items-center justify-between mb-5">
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <step.icon className="h-5 w-5" />
                </span>
                <span className="font-display text-2xl font-bold text-border" aria-hidden="true">
                  0{i + 1}
                </span>
              </div>
              <h3 className="font-display text-xl font-semibold mb-2">{step.title}</h3>
              <p className="text-muted-foreground leading-relaxed">{step.description}</p>
            </li>
          ))}
        </ol>
      </Section>

      {/* ── EXEMPLES DE FICHES ───────────────────────────────────────────── */}
      <Section variant="default" size="lg" id="exemples" className="scroll-mt-20">
        <SectionHeader
          title="Ce que tu reçois, pour chaque hook"
          subtitle="Le hook, sa structure à trous, les vues, la performance par rapport au compte, le taux d'engagement et le lien vers la vidéo d'origine. Tu remplaces les cases par ta niche."
        />
        <div className="grid md:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {HOOKS_EXAMPLES.map((ex) => (
            <article key={ex.hook} className="flex flex-col rounded-2xl border border-border bg-background p-6 shadow-sm">
              <Quote className="h-5 w-5 text-gold" />
              <blockquote className="font-display italic text-xl leading-snug mt-3 mb-5">« {ex.hook} »</blockquote>
              <div className="rounded-xl border border-border bg-cream px-4 py-3">
                <span className="block text-[11px] font-semibold uppercase tracking-wider text-primary mb-1">
                  Structure
                </span>
                <p className="font-medium leading-relaxed">
                  <Structure text={ex.structure} />
                </p>
              </div>
              <div className="mt-auto pt-5 flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
                <span className="inline-flex items-center gap-1.5">
                  <Eye className="h-3.5 w-3.5 text-primary" />
                  <strong className="font-semibold text-foreground">{ex.views}</strong> vues
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <PlayCircle className="h-3.5 w-3.5 text-primary" /> Vidéo d'origine
                </span>
              </div>
            </article>
          ))}
        </div>
      </Section>

      {/* ── LES PACKS ────────────────────────────────────────────────────── */}
      <Section variant="cream" size="lg" id="packs" className="scroll-mt-20">
        <SectionHeader
          title="3 packs. 0 hook en commun."
          subtitle="Chaque pack contient des hooks différents. Prends-en un, deux ou les trois : tu ne paies jamais deux fois le même hook."
        />
        <div className="grid lg:grid-cols-3 gap-8 lg:gap-6 max-w-md lg:max-w-5xl mx-auto items-stretch">
          {HOOKS_PACKS_OFFER.map((pack) => (
            <article
              key={pack.code}
              className={`relative flex flex-col rounded-2xl bg-background p-6 pt-8 ${MOBILE_ORDER[pack.code]} lg:order-none ${
                pack.featured
                  ? "border-2 border-primary shadow-lg shadow-primary/10 lg:scale-105"
                  : "border border-border shadow-sm"
              }`}
            >
              {pack.badge && (
                <span
                  className={`absolute -top-4 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full px-4 py-1.5 text-xs font-bold uppercase tracking-wide ${
                    pack.featured ? "bg-gold text-noir" : "bg-noir text-cream"
                  }`}
                >
                  {pack.badge}
                </span>
              )}
              <h3 className="font-display text-2xl font-semibold">{pack.name}</h3>
              <p className="text-sm text-muted-foreground mt-1">{pack.pitch}</p>
              <p className="mt-5 flex items-baseline gap-2">
                <span className="font-display text-5xl font-bold leading-none">{pack.price} €</span>
                <span className="text-sm text-muted-foreground">soit {pricePerHook(pack.price, pack.hooks)} par hook</span>
              </p>
              <div className="grid grid-cols-2 gap-2 mt-5">
                <div className="rounded-lg bg-cream px-3 py-2.5">
                  <span className="block font-display text-xl font-bold">{pack.medianViews}</span>
                  <span className="block text-xs text-muted-foreground">vues médianes</span>
                </div>
                <div className="rounded-lg bg-cream px-3 py-2.5">
                  <span className="block font-display text-xl font-bold">{pack.medianMultiple}</span>
                  <span className="block text-xs text-muted-foreground leading-snug">
                    les vues habituelles du compte, en médiane
                  </span>
                </div>
              </div>
              <ul className="space-y-2.5 my-6 text-sm">
                {HOOKS_PACK_FEATURES.map((f) => (
                  <li key={f} className="flex items-start gap-2.5">
                    <Check className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
                    {f}
                  </li>
                ))}
              </ul>
              <Button variant={pack.featured ? "hero" : "outline"} size="lg" className="w-full mt-auto" asChild>
                <a href={pack.stripeUrl} onClick={() => trackBuy(pack.code, "pack_card")}>
                  Je prends le {pack.name.toLowerCase()}
                </a>
              </Button>
            </article>
          ))}
        </div>

        {/* Bibliothèque complète */}
        <div className="max-w-5xl mx-auto mt-12 rounded-2xl gradient-premium text-cream p-6 md:p-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div>
            <span className="inline-block rounded-full bg-gold-light/15 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-gold-light">
              Les 3 packs réunis
            </span>
            <h3 className="font-display text-2xl md:text-3xl font-semibold mt-3">
              La bibliothèque complète : {HOOKS_BUNDLE.hooks} hooks
            </h3>
            <p className="text-cream/80 mt-1">Tous les hooks, sans aucun doublon.</p>
          </div>
          <div className="md:min-w-[260px]">
            <p className="flex flex-wrap items-baseline gap-x-3">
              <span className="font-display text-5xl font-bold text-gold-light leading-none">{HOOKS_BUNDLE.price} €</span>
              <s className="text-cream/60">au lieu de {HOOKS_PACKS_TOTAL_PRICE} €</s>
            </p>
            <p className="text-sm text-cream/80 mt-1">
              soit {pricePerHook(HOOKS_BUNDLE.price, HOOKS_BUNDLE.hooks)} par hook
            </p>
            <Button variant="hero" size="lg" className="w-full mt-4 shadow-none" asChild>
              <a href={HOOKS_BUNDLE.stripeUrl} onClick={() => trackBuy(HOOKS_BUNDLE.code, "bundle")}>
                Je prends les {HOOKS_BUNDLE.hooks} hooks
              </a>
            </Button>
          </div>
        </div>

        <p className="max-w-3xl mx-auto mt-8 text-center text-sm text-muted-foreground">
          Paiement sécurisé par Stripe. Fichiers envoyés par email dès le paiement validé, liens valables 1 an.
          Produit numérique à livraison immédiate : en validant la case au paiement, tu demandes l'envoi immédiat et tu renonces à ton droit de rétractation dès l'envoi de l'email de livraison
          (<Link to="/cgv" className="underline">article 9.4 des CGV</Link>).
        </p>
      </Section>

      {/* ── SUR MESURE ───────────────────────────────────────────────────── */}
      <Section variant="default" size="md">
        <div className="max-w-3xl mx-auto rounded-2xl border border-border bg-background p-6 md:p-9 shadow-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-5">
          <div className="flex items-start gap-4">
            <span className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Target className="h-5 w-5" />
            </span>
            <div>
              <h2 className="font-display text-2xl md:text-3xl font-semibold">Tu veux des hooks de ta niche ?</h2>
              <p className="text-muted-foreground mt-1">Pack niche sur demande, livré en 72 h.</p>
            </div>
          </div>
          <Button variant="outline" size="lg" asChild>
            <a href="/contact" onClick={() => trackEvent("hooks_niche_click", { position: "custom" })}>
              Demander un pack niche
            </a>
          </Button>
        </div>
      </Section>

      {/* ── FAQ ──────────────────────────────────────────────────────────── */}
      <Section variant="default" size="md" className="pt-0 md:pt-0">
        <div className="max-w-3xl mx-auto">
          <SectionHeader title="Questions fréquentes" />
          <Accordion type="single" collapsible className="w-full">
            {HOOKS_FAQ.map((item, i) => (
              <AccordionItem key={i} value={`faq-${i}`}>
                <AccordionTrigger className="text-left font-semibold">{item.question}</AccordionTrigger>
                <AccordionContent className="text-muted-foreground leading-relaxed">{item.answer}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </Section>

      {/* ── DERNIER APPEL ────────────────────────────────────────────────── */}
      <Section variant="cream" size="lg">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="font-display text-3xl md:text-4xl font-semibold tracking-tight text-balance">
            Ces hooks ont déjà marché ailleurs. <span className="text-gold-gradient">À toi de les adapter.</span>
          </h2>
          <ul className="space-y-2.5 my-9 text-left">
            {HOOKS_PACKS_OFFER.map((pack) => (
              <li
                key={pack.code}
                className={`flex items-center justify-between gap-4 rounded-xl bg-background px-5 py-3.5 ${
                  pack.featured ? "border-2 border-primary" : "border border-border"
                }`}
              >
                <span>
                  <span className="block font-semibold">{pack.name}</span>
                  <span className="text-sm text-muted-foreground">
                    {pack.medianViews} vues médianes · {pack.medianMultiple}
                  </span>
                </span>
                <span className="font-display text-2xl font-bold whitespace-nowrap">{pack.price} €</span>
              </li>
            ))}
            <li className="flex items-center justify-between gap-4 rounded-xl border border-border bg-background px-5 py-3.5">
              <span>
                <span className="block font-semibold">Les {HOOKS_BUNDLE.hooks} hooks</span>
                <span className="text-sm text-muted-foreground">Les 3 packs réunis</span>
              </span>
              <span className="font-display text-2xl font-bold whitespace-nowrap">{HOOKS_BUNDLE.price} €</span>
            </li>
          </ul>
          <Button variant="hero" size="xl" onClick={scrollToPacks}>
            Choisir mon pack
          </Button>
        </div>
      </Section>

      {/* ── NEWSLETTER ───────────────────────────────────────────────────── */}
      <Section variant="default" size="md">
        <div className="max-w-lg mx-auto">
          <SectionHeader
            title="Pas encore prêt ?"
            subtitle="Reçois mes conseils formats courts par email, avec le guide gratuit des hooks en cadeau."
            className="mb-8 md:mb-10"
          />
          <div className="bg-card border border-border rounded-xl p-8 shadow-sm">
            <NewsletterForm location="hooks_page" submitLabel="Recevoir le guide gratuit" />
          </div>
        </div>
      </Section>
    </Layout>
  );
}
