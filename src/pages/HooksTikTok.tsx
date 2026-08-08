import { Link } from "react-router-dom";
import { ArrowRight, Quote, AlertTriangle, Eye, Gauge } from "lucide-react";
import { Layout } from "@/components/layout/Layout";
import { Section, SectionHeader } from "@/components/ui/section";
import { Button } from "@/components/ui/button";
import { SEOHead } from "@/components/SEOHead";
import { seoFor } from "@/config/seo";
import { NewsletterForm } from "@/components/NewsletterForm";
import {
  HOOK_CATEGORIES,
  HOOKS_PUBLISHED_COUNT,
  HOOKS_TOTAL_COUNT,
} from "@/data/hooks";
import { HOOKS_FAQ } from "@/config/hooks-faq";
import { ACADEMY_FROM, ACADEMY_ENTRY, ACADEMY_LIVE_SLOT, ACADEMY_SUPPORT_DAYS } from "@/config/offers";
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/components/ui/accordion";

export default function HooksTikTok() {
  const scrollToFamilies = () =>
    document.getElementById("familles")?.scrollIntoView({ behavior: "smooth" });

  return (
    <Layout>
      <SEOHead {...seoFor("/hooks-tiktok")} />

      {/* ── HERO ─────────────────────────────────────────────────────────── */}
      <Section variant="cream" size="lg">
        <div className="max-w-3xl mx-auto text-center">
          <h1 className="font-display text-4xl md:text-5xl font-semibold tracking-tight leading-tight mb-6">
            Hooks TikTok :{" "}
            <span className="text-gold-gradient">{HOOKS_TOTAL_COUNT} accroches</span> classées par famille
          </h1>
          <p className="text-lg text-muted-foreground leading-relaxed mb-8">
            Un hook, c'est la première seconde de ta vidéo, celle qui décide si ton spectateur reste ou scrolle. En
            voici {HOOKS_PUBLISHED_COUNT} en clair, rangées par famille, avec pour chacune ce qu'elle coûte quand on
            en abuse. Le reste, avec les modèles à compléter, est dans le guide.
          </p>
          <Button variant="hero" size="xl" onClick={scrollToFamilies}>
            Voir les familles de hooks
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        </div>
      </Section>

      {/* ── DÉFINITION ───────────────────────────────────────────────────── */}
      <Section variant="default" size="md">
        <div className="max-w-3xl mx-auto">
          <SectionHeader title="Un hook TikTok, c'est quoi exactement ?" align="left" />
          <div className="space-y-4 text-foreground/80 leading-relaxed">
            <p>
              Le hook, ou accroche, ce sont les deux premières secondes de ta vidéo. C'est la fenêtre pendant
              laquelle le spectateur décide, sans même y penser, s'il continue ou s'il passe à la suivante. Tout le
              reste de ta vidéo dépend de cette poignée de secondes : si elles ratent, personne ne verra le reste.
            </p>
            <p>
              Un bon hook ne raconte pas encore ton sujet. Il donne une <strong>raison de rester</strong> — une
              question ouverte, une promesse de surprise, un chiffre qui intrigue. Le corps de la vidéo, lui, tient
              cette promesse. Hook et contenu forment un couple : l'un ouvre la porte, l'autre décide si on entre.
            </p>
          </div>
        </div>
      </Section>

      {/* ── LES FAMILLES ─────────────────────────────────────────────────── */}
      <Section variant="cream" size="lg" id="familles">
        <SectionHeader
          title={`Les ${HOOK_CATEGORIES.length} familles de hooks TikTok, avec des exemples`}
          subtitle="Chaque famille joue sur un ressort différent. Prends celles qui collent à ta façon de parler, laisse les autres."
        />
        <div className="max-w-3xl mx-auto space-y-6">
          {HOOK_CATEGORIES.map((c) => (
            <div
              key={c.slug}
              id={`hooks-${c.slug}`}
              className="bg-background border border-border rounded-2xl p-6 scroll-mt-24"
            >
              <h3 className="font-display text-xl font-semibold mb-2">{c.label}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed mb-4">{c.intro}</p>
              <ul className="space-y-2 mb-4">
                {c.samples.map((s) => (
                  <li key={s} className="flex items-start gap-2.5">
                    <Quote className="h-4 w-4 text-primary/60 flex-shrink-0 mt-1" />
                    <span className="text-foreground italic">{s}</span>
                  </li>
                ))}
              </ul>
              <div className="flex items-start gap-2.5 rounded-xl bg-amber-50 border border-amber-200/70 px-4 py-3">
                <AlertTriangle className="h-4 w-4 text-amber-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-amber-900/90 leading-relaxed">
                  <strong className="font-semibold">À surveiller —</strong> {c.watchOut}
                </p>
              </div>
            </div>
          ))}
        </div>
      </Section>

      {/* ── HOOK VISUEL ──────────────────────────────────────────────────── */}
      <Section variant="default" size="md">
        <div className="max-w-3xl mx-auto">
          <SectionHeader
            title="Un hook TikTok n'est pas qu'une phrase"
            align="left"
          />
          <div className="flex items-start gap-4">
            <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
              <Eye className="h-5 w-5 text-primary" />
            </div>
            <div className="space-y-4 text-foreground/80 leading-relaxed">
              <p>
                Une accroche, ce n'est pas seulement ce que tu dis. C'est aussi ce que le spectateur voit dans la
                première image, et le mouvement qui l'y retient. Un cadrage inhabituel, un objet qu'on ne s'attend pas
                à voir, un geste qui commence avant même la première parole : ce sont des hooks, au même titre qu'une
                phrase.
              </p>
              <p>
                La règle est la même que pour les mots : le visuel d'ouverture doit donner une raison de rester, sans
                trahir ce qui suit. Une miniature spectaculaire qui débouche sur une vidéo plate, c'est un hook qui se
                retourne contre toi.
              </p>
            </div>
          </div>
        </div>
      </Section>

      {/* ── COMMENT ÉCRIRE ───────────────────────────────────────────────── */}
      <Section variant="cream" size="md">
        <div className="max-w-3xl mx-auto">
          <SectionHeader
            title="Comment écrire un hook TikTok qui tient ce qu'il annonce"
            align="left"
          />
          <div className="space-y-4 text-foreground/80 leading-relaxed">
            <p>
              Ne pars pas de la formule, pars de ton spectateur. Qu'est-ce qui l'arrêterait, lui, dans son fil ? Une
              accroche efficace parle à quelqu'un de précis, pas à tout le monde. Choisis ensuite la famille qui sert
              ton sujet — la curiosité pour un tuto, l'émotion pour un récit, le chiffre pour une démonstration.
            </p>
            <p>
              Puis vérifie une seule chose : est-ce que le reste de la vidéo <strong>tient la promesse</strong> du
              hook ? Si l'accroche annonce une révélation, la révélation doit arriver, et valoir le détour. C'est là
              que la plupart des hooks échouent : pas parce qu'ils sont mauvais, mais parce que la suite ne suit pas.
            </p>
            <p>
              Enfin, teste. Reprends une vidéo qui a sous-performé, change seulement son hook, laisse tout le reste
              identique, et compare la rétention des trois premières secondes. C'est le seul juge fiable : tes propres
              chiffres, pas une règle générale.
            </p>
          </div>
        </div>
      </Section>

      {/* ── RECADRAGE ────────────────────────────────────────────────────── */}
      <Section variant="dark" size="md">
        <div className="max-w-3xl mx-auto">
          <div className="flex items-start gap-4">
            <div className="w-11 h-11 rounded-xl bg-cream/10 flex items-center justify-center flex-shrink-0">
              <Gauge className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h2 className="font-display text-2xl md:text-3xl font-semibold text-cream mb-4">
                Pourquoi je ne te promets pas de vues avec ces hooks
              </h2>
              <div className="space-y-4 text-cream/80 leading-relaxed">
                <p>
                  Un hook n'achète pas des vues. Il achète deux secondes d'attention. C'est déjà énorme, mais c'est
                  tout. Ce qu'il contrôle : que ta vidéo soit regardée au lieu d'être scrollée. Ce qu'il ne contrôle
                  pas : à qui TikTok la montrera, et combien de fois.
                </p>
                <p>
                  Personne ne contrôle un algorithme, et ceux qui te vendent des « astuces pour lui plaire » te
                  vendent du vent. Ce que tu peux mesurer, en revanche, c'est ta rétention sur les trois premières
                  secondes, avant et après avoir changé de hook. Ça, c'est à toi, c'est dans tes stats, et ça se
                  corrige. Le reste n'est pas entre tes mains, et te promettre le contraire serait te mentir.
                </p>
              </div>
            </div>
          </div>
        </div>
      </Section>

      {/* ── CONVERSION : GUIDE PDF ───────────────────────────────────────── */}
      <Section variant="default" size="lg">
        <div className="max-w-lg mx-auto">
          <SectionHeader
            title="Le guide complet des hooks TikTok en PDF"
            subtitle={`Les ${HOOKS_TOTAL_COUNT} accroches classées, les modèles à compléter avec ton sujet, et une grille pour noter un hook avant de tourner. Par email, gratuitement.`}
          />
          <div className="bg-card border border-border rounded-xl p-8 shadow-sm">
            <NewsletterForm location="hooks_page" submitLabel="Recevoir le guide complet" />
          </div>
        </div>
      </Section>

      {/* ── CONVERSION : ACADEMY ─────────────────────────────────────────── */}
      <Section variant="cream" size="md">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="font-display text-2xl md:text-3xl font-semibold mb-4">
            Écrire des hooks seul, c'est deviner
          </h2>
          <p className="text-muted-foreground leading-relaxed mb-8">
            Un hook ne s'évalue pas dans le vide : il s'évalue sur tes vidéos, tes chiffres, ton audience. Dans la Wav
            Academy, tu ne restes plus seul face à tes accroches : un regard régulier sur ton travail, un live{" "}
            {ACADEMY_LIVE_SLOT}, un suivi {ACADEMY_SUPPORT_DAYS} et du feedback sur tes contenus à la demande.
          </p>
          <Button variant="hero" size="lg" asChild>
            <Link to="/wavacademy">
              Découvrir la Wav Academy — dès {ACADEMY_FROM} €
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </Button>
          <p className="text-xs text-muted-foreground mt-3">
            Accès {ACADEMY_ENTRY.duration}, paiement unique, sans abonnement.
          </p>
        </div>
      </Section>

      {/* ── FAQ ──────────────────────────────────────────────────────────── */}
      <Section variant="default" size="lg">
        <div className="max-w-3xl mx-auto">
          <SectionHeader title="Questions fréquentes sur les hooks TikTok" />
          <Accordion type="single" collapsible className="w-full">
            {HOOKS_FAQ.map((item, i) => (
              <AccordionItem key={i} value={`faq-${i}`}>
                <AccordionTrigger className="text-left font-semibold">{item.question}</AccordionTrigger>
                <AccordionContent className="text-muted-foreground leading-relaxed">
                  {item.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </Section>
    </Layout>
  );
}
