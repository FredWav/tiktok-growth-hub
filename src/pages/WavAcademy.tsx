import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useSearchParams, Link } from "react-router-dom";
import {
  ArrowRight,
  CheckCircle2,
  Check,
  Zap,
  Radio,
  RefreshCw,
  MessageSquare,
  Loader2,
} from "lucide-react";
import { Layout } from "@/components/layout/Layout";
import { VideoCard } from "@/components/VideoCard";
import { ScreenshotWall } from "@/components/ScreenshotWall";
import { Section, SectionHeader } from "@/components/ui/section";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SEOHead } from "@/components/SEOHead";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { trackPostHogEvent } from "@/lib/posthog";
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
  "Diagnostic IA sur chaque vidéo",
  "Contenu stratégique quotidien",
  "Live hebdo avec Fred",
  "Paiement unique, sans abonnement",
];

// ── Ce que tu obtiens (concret, zéro hype) ─────────────────────────────────
const includes = [
  {
    icon: Zap,
    title: "WavSocialScan",
    desc: "Tu colles le lien d'une vidéo, tu reçois un diagnostic en quelques secondes : hook, CTA, rétention estimée, ce qui cloche, quoi changer. 3 000 crédits/mois inclus (≈ 30 vidéos analysées).",
  },
  {
    icon: RefreshCw,
    title: "Le Tapis Roulant",
    desc: "Un contenu stratégique applicable le jour même, posté chaque jour sur le Discord. 15 en rotation permanente ; ce que tu rates ne revient pas.",
  },
  {
    icon: Radio,
    title: "Le live hebdo",
    desc: "Une fois par semaine, en direct avec moi : tu poses tes questions, j'analyse des comptes, je décortique ce qui marche maintenant.",
  },
  {
    icon: MessageSquare,
    title: "Le Discord premium",
    desc: "La communauté et les canaux avancés, réservés aux membres de l'Academy.",
  },
];

// ── Comment ça marche (3 étapes) ───────────────────────────────────────────
const steps = [
  { n: "1", text: "Tu postes ta vidéo." },
  { n: "2", text: "Tu la passes au WavSocialScan." },
  { n: "3", text: "Tu corriges le paramètre qui cloche, tu reposte." },
];

// ── Formules (3 Pass prépayés) ─────────────────────────────────────────────
// Paiement unique : le « €/mois » affiché est un simple repère qui montre la réduction
// quand on s'engage plus longtemps (99 → ~83 → ~75). Aucun abonnement, aucun échelonnement.
type Plan = {
  term: string;
  months: number;
  total: number;
  monthly: number;
  label: string;
  duration: string;
  save: string | null;
  note: string;
  highlight?: boolean;
  badge?: string;
};

const PLANS: Plan[] = [
  {
    term: "3m", months: 3, total: 297, monthly: 99, label: "Fondation", duration: "3 mois",
    save: null, note: "Pour poser des bases solides et trouver ton Format Signature.",
  },
  {
    term: "6m", months: 6, total: 499, monthly: 83, label: "Accélération", duration: "6 mois",
    save: "≈ 1 mois offert", note: "Le temps d'ancrer la méthode et de tenir le rythme.",
    badge: "Populaire",
  },
  {
    term: "12m", months: 12, total: 899, monthly: 75, label: "Maîtrise", duration: "12 mois",
    save: "≈ 3 mois offerts", note: "Un an complet pour installer un système d'acquisition durable.",
    highlight: true, badge: "Meilleure offre",
  },
];

const PLAN_FEATURES = [
  "Contenu stratégique quotidien (Tapis Roulant)",
  "15 contenus en rotation permanente",
  "Live hebdomadaire avec Fred",
  "Discord premium (canaux avancés)",
];

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
const FAQ = [
  {
    q: "Je débute totalement, c'est pour moi ?",
    a: "Oui. Le principe du Wav Academy, c'est justement de ne plus poster à l'aveugle. Tu diagnostiques chaque vidéo avec le WavSocialScan et tu corriges au fur et à mesure — que tu en sois à ta 3e ou à ta 300e vidéo. Tu avances avec une méthode, pas en devinant.",
  },
  {
    q: "Concrètement, qu'est-ce que je reçois une fois inscrit ?",
    a: "Un accès au Discord premium du Wav Academy (canaux avancés), 3 000 crédits WavSocialScan chaque mois (≈ 30 analyses de vidéo ou 10 analyses de compte), le Tapis Roulant (un contenu stratégique frais chaque jour, 15 en rotation permanente) et le live hebdomadaire avec Fred.",
  },
  {
    q: "Combien de temps ça me prend par semaine ?",
    a: "Le système est fait pour les créateurs déjà occupés. Une analyse de vidéo prend quelques minutes, et le Tapis Roulant te donne une action concrète applicable le jour même. Tu peux en faire autant ou aussi peu que tu veux — mais plus tu diagnostiques, plus vite tu trouves ton Format Signature.",
  },
  {
    q: "Le WavSocialScan est-il vraiment inclus ?",
    a: "Oui. Il coûte normalement de 14,90€/mois (Standard) à 39,90€/mois (Premium). En tant que membre, tu reçois 3 000 crédits gratuits chaque mois, inclus dans ta formule.",
  },
  {
    q: "C'est un abonnement ? Je peux annuler ?",
    a: "Non, ce n'est pas un abonnement. Les trois formules (3, 6 et 12 mois) sont des paiements uniques, sans reconduction : il n'y a rien à résilier. Tu paies une fois, tu accèdes à tout pendant la durée choisie, et l'accès s'arrête simplement au terme.",
  },
  {
    q: "Comment je reçois mes accès après le paiement ?",
    a: "Juste après le paiement, tu reçois un email avec ton lien d'activation Discord (valable 7 jours). Tu te connectes avec ton compte Discord et ton rôle est attribué automatiquement. Pense à vérifier tes spams.",
  },
];

// ── Main component ───────────────────────────────────────────────────────────
export default function WavAcademy() {
  const [searchParams] = useSearchParams();
  const isSuccess = searchParams.get("success") === "true";
  // Mode test : ?test=1 fait passer le checkout sur les liens Stripe sandbox (cartes 4242).
  const testMode = searchParams.get("test") === "1";

  const [dialogOpen, setDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedTerm, setSelectedTerm] = useState<string>("12m");

  const selectedPlan = PLANS.find((p) => p.term === selectedTerm) ?? PLANS.find((p) => p.term === "12m")!;

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
    trackPostHogEvent("wavclub_checkout_open", { term });
  };

  const onCheckout = async (data: CheckoutForm) => {
    setIsSubmitting(true);
    trackPostHogEvent("wavclub_checkout_submit", { term: selectedTerm });
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
          title="Bienvenue dans le Wav Academy ! | Fred Wav"
          description="Ton accès Wav Academy est confirmé. Rejoins le Discord et commence ton premier diagnostic."
          path="/wavacademy"
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
      <SEOHead
        title="Wav Academy — Le système de diagnostic continu pour créateurs | Fred Wav"
        description="Diagnostique chaque vidéo, corrige en temps réel, casse ton plafond de vues. Le Wav Academy : diagnostic data (WavSocialScan) + contenu stratégique quotidien."
        path="/wavacademy"
        keywords="wav academy, diagnostic tiktok, wavsocialscan, contenu stratégique, formats courts"
      />

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
            Diagnostique chaque vidéo, corrige en temps réel,{" "}
            <span className="text-gold-gradient">casse ton plafond de vues.</span>
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
            Un outil qui analyse tes vidéos et te dit quoi corriger. Du contenu stratégique chaque jour. Mes lives chaque semaine. Tu arrêtes de deviner.
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
              Rejoindre Wav Academy
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </div>
          <p className="text-sm text-muted-foreground mt-4">
            Trois Pass prépayés, de 297 € à 899 €. Paiement unique, sans abonnement.
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

      {/* ── CE QUE TU OBTIENS ────────────────────────────────────────────── */}
      <Section variant="default" size="lg">
        <SectionHeader
          title="Ce que tu obtiens."
          subtitle="Concret, tout de suite. Pas de promesse — des outils."
        />
        <div className="max-w-4xl mx-auto grid sm:grid-cols-2 gap-6">
          {includes.map((b) => (
            <div key={b.title} className="p-6 rounded-2xl bg-background border border-border">
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
          Vidéo après vidéo, tu trouves le format qui marche pour toi. Pas en 6 mois — en 15 à 20 vidéos.
        </p>
        <p className="text-center text-muted-foreground mt-4 max-w-2xl mx-auto text-sm leading-relaxed">
          Le contenu, c'est 30 % du résultat. Le reste, c'est lire tes stats et corriger le bon paramètre. C'est ce que l'outil te montre.
        </p>
      </Section>

      {/* ── CRÉDIBILITÉ ──────────────────────────────────────────────────── */}
      <Section variant="default" size="md">
        <div className="max-w-3xl mx-auto">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 text-center mb-10">
            <div className="p-6 rounded-2xl bg-accent/40 border border-border">
              <p className="font-display text-4xl font-bold text-primary mb-2">{yearsSince(AUDIOVISUAL_START_YEAR)} ans</p>
              <p className="text-muted-foreground text-sm">d'expérience dans l'audiovisuel</p>
            </div>
            <div className="p-6 rounded-2xl bg-accent/40 border border-border">
              <p className="font-display text-4xl font-bold text-primary mb-2">{yearsSince(SHORT_FORMATS_START_YEAR)} ans</p>
              <p className="text-muted-foreground text-sm">sur les formats courts</p>
            </div>
            <div className="p-6 rounded-2xl bg-accent/40 border border-border">
              <p className="font-display text-4xl font-bold text-primary mb-2">250+</p>
              <p className="text-muted-foreground text-sm">créateurs accompagnés</p>
            </div>
            <div className="p-6 rounded-2xl bg-accent/40 border border-border">
              <p className="font-display text-4xl font-bold text-primary mb-2">3-6 sem.</p>
              <p className="text-muted-foreground text-sm">pour trouver son Format Signature</p>
            </div>
          </div>
          <div className="p-6 rounded-2xl bg-accent/30 border border-border text-center">
            <p className="text-muted-foreground leading-relaxed">
              Un créateur qui poste sans diagnostic met en moyenne <strong>6 à 12 mois</strong> pour trouver son format.
              Un créateur qui analyse ses résultats après chaque vidéo y arrive en <strong>3 à 6 semaines</strong>.
              <br /><br />
              <span className="font-semibold text-foreground">300 vidéos à l'aveugle, ou 20 vidéos diagnostiquées. Le résultat est le même. Le chemin, non.</span>
            </p>
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
        <ScreenshotWall
          location="preuves"
          title="Leurs messages"
          subtitle="Retours directs de clients, sans filtre."
          cols={2}
        />
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
                <span className="font-semibold">3 000 crédits WavSocialScan/mois</span>
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
        </div>
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
          <h2 className="font-display text-3xl md:text-4xl font-semibold text-cream mb-4">
            Rejoins le Wav Academy.
          </h2>
          <p className="text-cream/70 text-lg mb-8">
            Diagnostique ta prochaine vidéo dès cette semaine, et arrête de poster à l'aveugle.
          </p>
          <Button variant="hero" size="xl" onClick={scrollToPlans}>
            Voir les formules
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
          <p className="text-cream/40 text-sm mt-4">
            Dès 297 € · paiement unique · accès immédiat.
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
          <p className="text-sm font-semibold">dès 297 €</p>
        </div>
        <Button variant="hero" size="lg" className="flex-shrink-0" onClick={scrollToPlans}>
          Rejoindre
          <ArrowRight className="ml-1.5 h-4 w-4" />
        </Button>
      </div>
    </Layout>
  );
}
