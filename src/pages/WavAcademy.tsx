import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useSearchParams, Link } from "react-router-dom";
import {
  ArrowRight,
  CheckCircle2,
  Check,
  X,
  Eye,
  Zap,
  Radio,
  RefreshCw,
  MessageSquare,
  MessageCircle,
  Users,
  Loader2,
  CreditCard,
} from "lucide-react";
import { Layout } from "@/components/layout/Layout";
import { VideoCard } from "@/components/VideoCard";
import { Section, SectionHeader } from "@/components/ui/section";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SEOHead } from "@/components/SEOHead";
import { seoFor } from "@/config/seo";
import {
  ACADEMY_PLANS,
  ACADEMY_FEATURES,
  ACADEMY_FROM,
  ACADEMY_ENTRY,
  ACADEMY_GUIDES_COUNT,
  ACADEMY_MODULES_COUNT,
  CREATORS_COUNT,
} from "@/config/offers";
import { WAVACADEMY_FAQ } from "@/config/wavacademy-faq";

import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { trackPostHogEvent } from "@/lib/posthog";
import { trackEvent } from "@/lib/tracking";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/components/ui/accordion";

const checkoutSchema = z.object({
  email: z.string().trim().email("Email invalide"),
  consent_cgv: z.literal(true, {
    errorMap: () => ({ message: "Tu dois accepter les CGV pour continuer" }),
  }),
  consent_renonciation: z.literal(true, {
    errorMap: () => ({ message: "La renonciation au droit de rétractation est requise pour un accès immédiat" }),
  }),
});
type CheckoutForm = z.infer<typeof checkoutSchema>;

// ── Stats dynamiques ───────────────────────────────────────────────────────
const AUDIOVISUAL_START_YEAR = 2006;
const SHORT_FORMATS_START_YEAR = 2020;
const yearsSince = (startYear: number) => new Date().getFullYear() - startYear;

// ── Proof strip ────────────────────────────────────────────────────────────
const proofItems = [
  "Un regard régulier sur ton travail",
  "Suivi 5 jours sur 7",
  "Live chaque jeudi, de 14h à 16h",
  "Paiement unique, sans abonnement",
];

// ── Ce qui change (avant / après) ──────────────────────────────────────────
const beforeAfter = {
  before:
    "Tu crées seul. Tu publies dans le doute. Tu manques de recul. Tu accumules des informations et tu répètes les mêmes erreurs.",
  after:
    "Tu crées avec un cadre. Tu obtiens des retours. Tu comprends tes résultats. Tu sais ce qu'il faut améliorer, et tu décides plus vite.",
};

// ── Ce que tu obtiens vraiment ─────────────────────────────────────────────
// L'ordre compte : c'est l'accompagnement qui est vendu, pas l'outil.
// WavStats vit plus bas, avec les ressources.
const gains = [
  {
    icon: Eye,
    title: "Un regard régulier sur ton travail.",
    desc: "Tu montres une vidéo, un compte, une stratégie. Je te dis ce qui va, ce qui ne va pas, et pourquoi.",
  },
  {
    icon: MessageSquare,
    title: "Une réponse quand tu es bloqué.",
    desc: "Suivi cinq jours sur sept. Tes questions sont vérifiées tous les jours, tu n'attends pas la semaine suivante.",
  },
  {
    icon: Radio,
    title: "Un live chaque jeudi, de 14h à 16h.",
    desc: "Questions, réponses, cas concrets. En direct, pas en différé.",
  },
  {
    icon: MessageCircle,
    title: "Du feedback sur n'importe lequel de tes contenus.",
    desc: "Sur demande, autant de fois que tu veux.",
  },
  {
    icon: Users,
    title: "Une communauté qui bosse.",
    desc: "Le Discord premium, et un accès direct.",
  },
];

// ── Comment ça marche (3 étapes) ───────────────────────────────────────────
const steps = [
  { n: "1", text: "Tu montres ton contenu, ton compte ou ta stratégie." },
  { n: "2", text: "Je te dis ce qui va, ce qui ne va pas, et pourquoi." },
  { n: "3", text: "Tu corriges avec un cadre, pas au hasard." },
];

// ── Ce que je garantis, ce que je ne garantis pas ──────────────────────────
const guarantees = {
  yes: ["Ma présence", "Mes réponses", "Mes analyses", "Mes feedbacks", "Les ressources", "De l'aide pour décider"],
  no: ["Des vues", "De la croissance", "Un revenu", "De la viralité"],
};

// ── Les ressources incluses ────────────────────────────────────────────────
const resources = [
  {
    label: `${ACADEMY_MODULES_COUNT} modules de formation`,
    desc: "Des bases de TikTok à la monétisation, en passant par l'analyse, la technique et le mindset.",
  },
  {
    label: `${ACADEMY_GUIDES_COUNT} cours, fiches et guides téléchargeables`,
    desc: "120+ hooks prêts à l'emploi, la direction artistique, l'algorithme expliqué, l'A/B testing, le droit d'auteur, la fiscalité du créateur, l'IA dans ton workflow, et le reste.",
  },
  {
    label: "WavStats inclus, 3 000 crédits par mois",
    desc: "L'outil qui analyse tes vidéos et te dit quoi corriger.",
  },
];

// ── Formules (3 Pass prépayés) ─────────────────────────────────────────────
// Prix et libellés viennent de src/config/offers.ts — source unique partagée avec
// la home, le comparateur, le sitemap et llms.txt.
// Paiement unique : le « €/mois » affiché est un simple repère qui montre la réduction
// quand on s'engage plus longtemps (100 → ~83 → ~75). Aucun abonnement, aucun échelonnement.
const PLANS = ACADEMY_PLANS;
const PLAN_FEATURES = ACADEMY_FEATURES;

// ── Témoignages vidéo (6 sélectionnés par Fred) ─────────────────────────────
const VIDEO_TESTIMONIALS = [
  { id: "XMMmmLLKue4", alt: "Témoignage client Wav Academy — retour d'expérience" },
  { id: "Bzw7nwqB2rQ", alt: "Témoignage client Wav Academy — retour d'expérience" },
  { id: "hwTyjA6BORY", alt: "Témoignage client Wav Academy — transformation de présence en ligne" },
  { id: "FrMFqiAqAkU", alt: "Témoignage client Wav Academy — impact sur la stratégie de contenu" },
  { id: "s-VaJvfFqbM", alt: "Témoignage client Wav Academy — croissance après accompagnement" },
  { id: "cc1cRfCEJGE", alt: "Témoignage client Wav Academy — résultats après coaching" },
];

// ── FAQ ─────────────────────────────────────────────────────────────────────
// Source unique partagée avec src/config/seo.ts pour le JSON-LD FAQPage.
const FAQ = WAVACADEMY_FAQ.map((item) => ({ q: item.question, a: item.answer }));


// ── Main component ───────────────────────────────────────────────────────────
export default function WavAcademy() {
  const [searchParams] = useSearchParams();
  const isSuccess = searchParams.get("success") === "true";
  // Mode test : ?test=1 fait passer le checkout sur les liens Stripe sandbox (cartes 4242).
  const testMode = searchParams.get("test") === "1";

  const [dialogOpen, setDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedTerm, setSelectedTerm] = useState<string>("6m");

  const selectedPlan = PLANS.find((p) => p.term === selectedTerm) ?? PLANS.find((p) => p.term === "6m")!;

  useEffect(() => {
    if (!isSuccess) return;
    const eventKey = "fw_academy_checkout_success_tracked";
    if (sessionStorage.getItem(eventKey)) return;
    sessionStorage.setItem(eventKey, "1");
    trackEvent("academy_checkout_success", { source: "confirmed_return" });
  }, [isSuccess]);

  const form = useForm<CheckoutForm>({
    resolver: zodResolver(checkoutSchema),
    defaultValues: {
      email: "",
      consent_cgv: false as unknown as true,
      consent_renonciation: false as unknown as true,
    },
    mode: "onChange",
  });

  const scrollToPlans = () => {
    document.getElementById("plans")?.scrollIntoView({ behavior: "smooth" });
  };

  const selectPlan = (term: string) => {
    setSelectedTerm(term);
    form.reset();
    setDialogOpen(true);
    const plan = PLANS.find((item) => item.term === term);
    trackEvent("academy_checkout_open", {
      term,
      total: String(plan?.total ?? ""),
      location: "pricing",
    });
  };

  const onCheckout = async (data: CheckoutForm) => {
    setIsSubmitting(true);
    trackEvent("academy_checkout_submit", {
      term: selectedTerm,
      total: String(selectedPlan.total),
      location: "checkout_dialog",
    });
    try {
      const { data: result, error } = await supabase.functions.invoke("record-wavacademy-consent", {
        body: {
          term: selectedTerm,
          email: data.email,
          consent_cgv: data.consent_cgv,
          consent_renonciation: data.consent_renonciation,
          ...(testMode ? { mode: "test" } : {}),
        },
      });

      if (error) throw new Error(error.message);
      if (!result?.payment_url) throw new Error("URL de paiement manquante");

      window.location.href = result.payment_url;
    } catch (err: unknown) {
      console.error("Checkout error:", err);
      toast.error("Une erreur est survenue. Réessaie ou contacte-nous.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // ── Success state ────────────────────────────────────────────────────────
  if (isSuccess) {
    return (
      <Layout variant="landing">
        <SEOHead
          {...seoFor("/wavacademy")}
          title="Bienvenue dans la Wav Academy ! | Fred Wav"
          description="Ton accès Wav Academy est confirmé. Rejoins le Discord et présente ton compte."
          noindex
        />
        <Section variant="cream" size="xl">
          <div className="max-w-xl mx-auto text-center">
            <CheckCircle2 className="h-16 w-16 text-primary mx-auto mb-6" />
            <h2 className="font-display text-3xl md:text-4xl font-semibold mb-4">
              Paiement confirmé !
            </h2>
            <p className="text-lg text-muted-foreground mb-4">
              Vérifie ta boîte mail — un email avec ton lien d'activation Discord vient d'être envoyé.
            </p>
            <p className="text-muted-foreground mb-8">
              Tu auras juste à te connecter avec ton compte Discord, et ton rôle sera attribué automatiquement. Le lien est valable 7 jours.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button variant="outline" size="xl" asChild>
                <Link to="/">Retour à l'accueil</Link>
              </Button>
            </div>
          </div>
        </Section>
      </Layout>
    );
  }

  return (
    <Layout variant="landing">
      <SEOHead {...seoFor("/wavacademy")} />

      {testMode && (
        <div className="bg-amber-500 text-black text-center text-sm font-semibold py-2 px-4">
          🧪 MODE TEST — paiements en sandbox Stripe (carte 4242 4242 4242 4242). Aucun argent réel.
        </div>
      )}

      {/* ── HERO ──────────────────────────────────────────────────────────── */}
      <Section variant="cream" size="xl">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-primary/10 text-primary border border-primary/20 rounded-full px-4 py-1.5 text-sm font-medium mb-8">
            <Radio className="h-3.5 w-3.5" />
            Wav Academy — Accès ouvert maintenant
          </div>
          <h1 className="font-display text-4xl md:text-5xl lg:text-6xl font-semibold tracking-tight leading-tight mb-6">
            Ne poste <span className="text-gold-gradient">plus seul.</span>
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
            Comprends pourquoi ton contenu fonctionne ou bloque, identifie quoi améliorer, et avance avec un accompagnement régulier. Sans promesse miracle de vues ou de rentabilité.
          </p>
          <div className="max-w-3xl mx-auto mb-10">
            <VideoCard
              id="TbKmQOXUt8s"
              alt="Wav Academy — Présentation par Fred Wav"
              location="wavacademy_vsl"
            />
          </div>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button variant="hero" size="xl" onClick={scrollToPlans}>
              Rejoindre la Wav Academy
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </div>
          <p className="text-sm text-muted-foreground mt-4">
            Trois Pass prépayés, de {ACADEMY_FROM} € à {PLANS[PLANS.length - 1].total} €. Paiement unique, sans abonnement.
          </p>
        </div>
      </Section>

      {/* ── PROOF STRIP ──────────────────────────────────────────────────── */}
      <Section variant="dark" size="sm">
        <div className="overflow-hidden">
          <div className="flex gap-8 md:gap-16 flex-wrap justify-center">
            {proofItems.map((item) => (
              <div key={item} className="flex items-center gap-2 text-cream/80 text-sm font-medium whitespace-nowrap">
                <div className="h-1 w-1 rounded-full bg-primary flex-shrink-0" />
                {item}
              </div>
            ))}
          </div>
        </div>
      </Section>

      {/* ── LE PROBLÈME ──────────────────────────────────────────────────── */}
      <Section variant="default" size="md">
        <div className="max-w-3xl mx-auto">
          <p className="font-display text-2xl md:text-3xl font-semibold tracking-tight text-center mb-8">
            Tu publies. Parfois ça marche, souvent non, et tu ne sais pas pourquoi.
          </p>
          <p className="text-lg text-foreground/80 leading-relaxed mb-6">
            Tu as déjà lu des conseils. Beaucoup. Tu as peut-être même acheté une formation que tu n'as pas terminée. Le problème n'est pas le manque d'informations, il y en a partout. Le problème, c'est que personne ne regarde <strong className="text-foreground">ton</strong> compte, <strong className="text-foreground">tes</strong> vidéos, <strong className="text-foreground">tes</strong> chiffres, et ne te dit quoi faire ensuite.
          </p>
          <p className="text-lg text-foreground/80 leading-relaxed">
            Créer seul, c'est deviner. Et deviner, ça coûte des mois.
          </p>
        </div>
      </Section>

      {/* ── CE QUI CHANGE ────────────────────────────────────────────────── */}
      <Section variant="cream" size="lg">
        <SectionHeader title="Ce qui change." />
        <div className="max-w-4xl mx-auto grid md:grid-cols-2 gap-8">
          <div className="bg-background rounded-xl p-8 border border-border">
            <h3 className="font-display text-xl font-semibold mb-4 flex items-center gap-2 text-muted-foreground">
              <X className="h-5 w-5 text-muted-foreground/60" />
              Avant
            </h3>
            <p className="text-muted-foreground leading-relaxed">{beforeAfter.before}</p>
          </div>
          <div className="bg-background rounded-xl p-8 border-2 border-primary/30 shadow-sm">
            <h3 className="font-display text-xl font-semibold mb-4 flex items-center gap-2">
              <Check className="h-5 w-5 text-primary" />
              Après
            </h3>
            <p className="text-foreground/80 leading-relaxed">{beforeAfter.after}</p>
          </div>
        </div>
      </Section>

      {/* ── CE QUE TU OBTIENS VRAIMENT ───────────────────────────────────── */}
      <Section variant="default" size="lg">
        <SectionHeader
          title="Ce que tu obtiens vraiment."
          subtitle="Pas un stock de documents. Un regard, un suivi, et des réponses."
        />
        <div className="max-w-4xl mx-auto grid sm:grid-cols-2 gap-6">
          {gains.map((b) => (
            <div key={b.title} className="p-6 rounded-2xl bg-background border border-border sm:last:col-span-2">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <b.icon className="h-5 w-5 text-primary" />
                </div>
                <h3 className="font-display text-lg font-semibold">{b.title}</h3>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">{b.desc}</p>
            </div>
          ))}
        </div>
      </Section>

      {/* ── COMMENT ÇA MARCHE ────────────────────────────────────────────── */}
      <Section variant="cream" size="lg">
        <SectionHeader title="Comment ça marche." />
        <div className="max-w-3xl mx-auto grid sm:grid-cols-3 gap-6">
          {steps.map((s) => (
            <div key={s.n} className="text-center p-6 rounded-2xl bg-background border border-border">
              <div className="w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center mx-auto mb-4 font-semibold text-lg">
                {s.n}
              </div>
              <p className="text-foreground font-medium">{s.text}</p>
            </div>
          ))}
        </div>
        <p className="text-center text-foreground/80 mt-8 max-w-2xl mx-auto leading-relaxed">
          Vidéo après vidéo, tu trouves le format qui marche pour toi.
        </p>
        <p className="text-center text-muted-foreground mt-4 max-w-2xl mx-auto text-sm leading-relaxed">
          Tes statistiques ne servent à rien si elles ne changent aucune de tes décisions. C'est ce qu'on regarde ensemble.
        </p>
      </Section>

      {/* ── CRÉDIBILITÉ ──────────────────────────────────────────────────── */}
      <Section variant="default" size="md">
        <div className="max-w-3xl mx-auto">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 text-center">
            <div className="p-6 rounded-2xl bg-accent/40 border border-border">
              <p className="font-display text-4xl font-bold text-primary mb-2">{yearsSince(AUDIOVISUAL_START_YEAR)} ans</p>
              <p className="text-muted-foreground text-sm">d'expérience dans l'audiovisuel</p>
            </div>
            <div className="p-6 rounded-2xl bg-accent/40 border border-border">
              <p className="font-display text-4xl font-bold text-primary mb-2">{yearsSince(SHORT_FORMATS_START_YEAR)} ans</p>
              <p className="text-muted-foreground text-sm">sur les formats courts</p>
            </div>
            <div className="p-6 rounded-2xl bg-accent/40 border border-border">
              <p className="font-display text-4xl font-bold text-primary mb-2">{CREATORS_COUNT}</p>
              <p className="text-muted-foreground text-sm">créateurs accompagnés</p>
            </div>
            <div className="p-6 rounded-2xl bg-accent/40 border border-border">
              <p className="font-display text-4xl font-bold text-primary mb-2">2h/sem</p>
              <p className="text-muted-foreground text-sm">de live et de suivi en direct</p>
            </div>
          </div>
        </div>
      </Section>

      {/* ── PREUVES : vidéos + screenshots ───────────────────────────────── */}
      <Section variant="cream" size="lg">
        <SectionHeader
          title="Ils l'utilisent. Voilà leurs résultats."
          subtitle="Des créateurs réels, des chiffres réels — pas des promesses."
        />
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto mb-12">
          {VIDEO_TESTIMONIALS.map((video) => (
            <VideoCard
              key={video.id}
              id={video.id}
              alt={video.alt}
              location="wavacademy_testimonials"
            />
          ))}
        </div>
      </Section>

      {/* ── CE QUE JE GARANTIS, CE QUE JE NE GARANTIS PAS ────────────────── */}
      {/* SectionHeader met son sous-titre en text-muted-foreground, illisible sur
          fond noir : header manuel, comme le CTA final. */}
      <Section variant="dark" size="lg">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12 md:mb-16">
            <h2 className="font-display text-3xl md:text-4xl lg:text-5xl font-semibold tracking-tight text-cream mb-4">
              Ce que je garantis.{" "}
              <span className="text-gold-gradient">Ce que je ne garantis pas.</span>
            </h2>
          </div>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="rounded-2xl border-2 border-primary/40 bg-cream/5 p-8">
              <h3 className="font-display text-xl font-semibold text-cream mb-6">
                Ce que je garantis
              </h3>
              <ul className="space-y-4">
                {guarantees.yes.map((item) => (
                  <li key={item} className="flex items-start gap-3 text-sm text-cream/90">
                    <Check className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="rounded-2xl border border-cream/15 p-8">
              <h3 className="font-display text-xl font-semibold text-cream/70 mb-6">
                Ce que je ne garantis pas
              </h3>
              <ul className="space-y-4">
                {guarantees.no.map((item) => (
                  <li key={item} className="flex items-start gap-3 text-sm text-cream/60">
                    <X className="h-4 w-4 text-cream/30 mt-0.5 shrink-0" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
          <p className="text-center text-cream/70 mt-10 max-w-2xl mx-auto leading-relaxed">
            Personne ne contrôle un algorithme. Ceux qui te promettent des chiffres te mentent, et c'est illégal. Ce que je peux tenir, c'est que tu ne restes plus seul face à tes questions et à tes contenus.
          </p>
        </div>
      </Section>

      {/* ── LES RESSOURCES INCLUSES ──────────────────────────────────────── */}
      <Section variant="cream" size="md">
        <SectionHeader
          title="Les ressources incluses."
          subtitle="Pour que l'accompagnement ait de quoi s'appuyer."
        />
        <div className="max-w-3xl mx-auto space-y-4">
          {resources.map((r) => (
            <div key={r.label} className="p-6 rounded-2xl bg-background border border-border">
              <div className="flex items-start gap-3">
                <Check className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold mb-1">{r.label}</p>
                  <p className="text-sm text-muted-foreground leading-relaxed">{r.desc}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
        <p className="text-center text-foreground/80 mt-8 max-w-2xl mx-auto leading-relaxed">
          Ce ne sont pas les documents qui font la différence. C'est ce qu'on en fait ensemble.
        </p>
      </Section>

      {/* ── FORMULES ─────────────────────────────────────────────────────── */}
      <Section variant="default" size="xl" id="plans">
        <SectionHeader
          title="Choisis ta formule Wav Academy."
          subtitle="Le même accès complet, quelle que soit la formule. Plus la durée est longue, moins c'est cher au mois."
        />

        <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto items-stretch">
          {PLANS.map((plan) => (
            <div
              key={plan.term}
              className={`rounded-2xl bg-background p-6 flex flex-col relative ${
                plan.highlight
                  ? "border-2 border-primary shadow-lg shadow-primary/10 md:scale-105 order-first md:order-none"
                  : "border border-border shadow-sm"
              }`}
            >
              {plan.badge && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                  <span className="bg-primary text-primary-foreground text-xs font-bold px-4 py-1.5 rounded-full uppercase tracking-wide whitespace-nowrap">
                    {plan.badge}
                  </span>
                </div>
              )}
              <div className="mb-5">
                <div className="flex items-center justify-between mb-3 min-h-[1.5rem]">
                  <p className="text-xs font-bold tracking-widest text-primary uppercase">{plan.label}</p>
                  {plan.save ? (
                    <span className="text-xs font-bold text-emerald-600 bg-emerald-50 border border-emerald-200 rounded-full px-2.5 py-0.5">
                      {plan.save}
                    </span>
                  ) : (
                    <span className="text-xs font-semibold text-muted-foreground">{plan.duration}</span>
                  )}
                </div>
                <div className="flex items-baseline gap-1 mb-1">
                  <span className="font-display text-5xl font-bold">{plan.total}€</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  soit ~{plan.monthly}€/mois · accès {plan.duration}
                </p>
                <p className="text-xs text-muted-foreground mt-1">Paiement unique, sans abonnement</p>
              </div>
              <p className="text-xs text-muted-foreground mb-6 min-h-[2rem]">{plan.note}</p>
              <Button
                variant={plan.highlight ? "hero" : "outline"}
                size="lg"
                className="w-full mt-auto"
                onClick={() => selectPlan(plan.term)}
              >
                Choisir {plan.label}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>

        {/* Avantages communs */}
        <div className="max-w-2xl mx-auto mt-10 p-6 rounded-2xl bg-accent/30 border border-border">
          <p className="text-sm font-semibold text-center mb-5">🎙 Inclus dans toutes les formules</p>
          <ul className="grid sm:grid-cols-2 gap-x-6 gap-y-3">
            <li className="flex items-start gap-3 text-sm sm:col-span-2">
              <Check className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold">3 000 crédits WavStats/mois</span>
                <p className="text-xs text-muted-foreground mt-0.5">≈ 30 analyses de vidéo ou 10 analyses de compte</p>
              </div>
            </li>
            {PLAN_FEATURES.map((f) => (
              <li key={f} className="flex items-start gap-3 text-sm">
                <Check className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
                <span>{f}</span>
              </li>
            ))}
          </ul>
          {/* Option payante, volontairement distincte de ce qui est inclus. */}
          <p className="text-xs text-muted-foreground text-center mt-5 pt-4 border-t border-border/60">
            <strong className="text-foreground">En option :</strong> une fois membre, tu peux réserver des sessions individuelles avec moi à tarif réduit.
          </p>
        </div>

        <p className="text-center text-sm text-muted-foreground mt-8 max-w-2xl mx-auto">
          Le prix « au mois » est un simple repère : tu règles l'accès <strong>en une seule fois</strong>, sans abonnement, sans prélèvement récurrent ni reconduction.
        </p>

        {/* Réassurance */}
        <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-3 mt-8 text-sm text-muted-foreground">
          <span className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-primary flex-shrink-0" />
            Paiement sécurisé par Stripe
          </span>
          <span className="flex items-center gap-2">
            <RefreshCw className="h-4 w-4 text-primary flex-shrink-0" />
            Paiement unique, sans abonnement
          </span>
          <span className="flex items-center gap-2">
            <Zap className="h-4 w-4 text-primary flex-shrink-0" />
            Accès immédiat après paiement
          </span>
          <span className="flex items-center gap-2">
            <CreditCard className="h-4 w-4 text-primary flex-shrink-0" />
            Paiement en plusieurs fois sans frais
          </span>
        </div>

        <p className="text-center text-sm text-muted-foreground mt-3 max-w-2xl mx-auto">
          Au moment du paiement : jusqu'à <strong>4× sans frais avec PayPal</strong> et <strong>3× sans frais avec Klarna</strong>.
        </p>
      </Section>

      {/* ── FAQ ──────────────────────────────────────────────────────────── */}
      <Section variant="cream" size="lg">
        <div className="max-w-3xl mx-auto">
          <SectionHeader title="Les questions que tu te poses." />
          <Accordion type="single" collapsible className="w-full">
            {FAQ.map((item, i) => (
              <AccordionItem key={i} value={`faq-${i}`}>
                <AccordionTrigger className="text-left font-semibold">
                  {item.q}
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground leading-relaxed">
                  {item.a}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </Section>

      {/* ── CTA FINAL (unique) ───────────────────────────────────────────── */}
      <Section variant="dark" size="lg">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="font-display text-3xl md:text-4xl font-semibold text-cream mb-8">
            Rejoins la Wav Academy.
          </h2>
          <Button variant="hero" size="xl" onClick={scrollToPlans}>
            Rejoindre la Wav Academy
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
          <p className="text-cream/40 text-sm mt-4">
            Dès {ACADEMY_FROM} € pour {ACADEMY_ENTRY.duration} d'accès · paiement unique · démarrage immédiat.
          </p>
        </div>
      </Section>

      {/* ── CHECKOUT DIALOG ──────────────────────────────────────────────── */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display text-2xl">
              WAV ACADEMY — {selectedPlan.label} · {selectedPlan.total}€
            </DialogTitle>
            <DialogDescription>
              {`Accès ${selectedPlan.duration} · paiement unique, sans abonnement ni reconduction. Complète ces informations, tu seras redirigé vers le paiement sécurisé.`}
            </DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onCheckout)} className="space-y-5 mt-2">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Adresse email *</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="ton@email.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="space-y-3 rounded-md border border-border/60 bg-muted/30 p-4">
                <FormField
                  control={form.control}
                  name="consent_cgv"
                  render={({ field }) => (
                    <FormItem className="flex items-start gap-3 space-y-0">
                      <FormControl>
                        <Checkbox
                          checked={field.value === true}
                          onCheckedChange={(v) => field.onChange(v === true)}
                          className="mt-0.5"
                        />
                      </FormControl>
                      <div className="flex-1">
                        <FormLabel className="text-sm font-normal leading-snug cursor-pointer">
                          J'accepte les{" "}
                          <Link to="/cgv" target="_blank" rel="noopener noreferrer" className="text-primary underline underline-offset-2">
                            Conditions Générales de Vente
                          </Link>
                          .
                        </FormLabel>
                        <FormMessage className="mt-1" />
                      </div>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="consent_renonciation"
                  render={({ field }) => (
                    <FormItem className="flex items-start gap-3 space-y-0">
                      <FormControl>
                        <Checkbox
                          checked={field.value === true}
                          onCheckedChange={(v) => field.onChange(v === true)}
                          className="mt-0.5"
                        />
                      </FormControl>
                      <div className="flex-1">
                        <FormLabel className="text-sm font-normal leading-snug cursor-pointer">
                          Je demande l'exécution immédiate du service et l'accès immédiat au contenu numérique avant l'expiration du délai de rétractation de 14 jours. Je reconnais que pour le contenu numérique, je perds mon droit de rétractation dès l'accès ; pour la partie service, en cas de rétractation, je reste redevable du prix au prorata du service déjà fourni.
                        </FormLabel>
                        <FormMessage className="mt-1" />
                      </div>
                    </FormItem>
                  )}
                />
              </div>

              <div className="pt-2">
                <Button
                  type="submit"
                  variant="hero"
                  size="lg"
                  className="w-full"
                  disabled={isSubmitting || !form.formState.isValid}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Création du lien de paiement…
                    </>
                  ) : (
                    <>
                      Procéder au paiement
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </>
                  )}
                </Button>
                <p className="text-xs text-muted-foreground text-center mt-3">
                  Paiement sécurisé par Stripe · Paiement unique · Sans abonnement
                </p>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* ── CTA flottant mobile ──────────────────────────────────────────── */}
      <div className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-background/95 backdrop-blur border-t border-border px-4 py-3 flex items-center justify-between gap-3 shadow-[0_-4px_20px_rgba(0,0,0,0.08)]">
        <div className="leading-tight">
          <p className="text-xs text-muted-foreground">Wav Academy</p>
          <p className="text-sm font-semibold">dès {ACADEMY_FROM} € / {ACADEMY_ENTRY.duration}</p>
        </div>
        <Button variant="hero" size="lg" className="flex-shrink-0" onClick={scrollToPlans}>
          Rejoindre
          <ArrowRight className="ml-1.5 h-4 w-4" />
        </Button>
      </div>
    </Layout>
  );
}
