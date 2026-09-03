import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Link } from "react-router-dom";
import { BarChart3, CalendarDays, CheckCircle2, ExternalLink } from "lucide-react";
import {
  ATTRIBUTION_UPDATED_EVENT,
  trackEvent,
  getStoredUtmSource,
} from "@/lib/tracking";
import { getPostHogId } from "@/lib/posthog";
import { Layout } from "@/components/layout/Layout";
import { Section } from "@/components/ui/section";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { SEOHead } from "@/components/SEOHead";
import { seoFor } from "@/config/seo";
import { EXPRESS_PRICE_LABEL, PREMIUM_BUDGET_TIERS } from "@/config/offers";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

const FORM_VERSION = "orientation_v2";
const WAVSTATS_URL = "https://wavstats.com";
const ANALYSE_EXPRESS_URL = "/analyse-express";
const CALL_BOOKING_URL = "https://calendar.app.google/UZC5UY38shFuSqmy6";

const situationOptions = [
  { value: "debut", label: "Je commence à publier" },
  { value: "irregulier", label: "Je publie, mais je manque de régularité" },
  { value: "stagnation", label: "Je publie régulièrement, mais mes résultats stagnent" },
  { value: "visibilite_sans_revenus", label: "J'ai de la visibilité, mais elle génère peu de revenus" },
  { value: "activite_a_accelerer", label: "Mon activité génère déjà des revenus et je veux accélérer" },
] as const;

const goalOptions = [
  { value: "comprendre_contenus", label: "Comprendre quels contenus fonctionnent et pourquoi" },
  { value: "gagner_visibilite", label: "Développer ma visibilité et mon audience" },
  { value: "attirer_clients", label: "Attirer davantage de prospects ou de clients" },
  { value: "mieux_vendre", label: "Mieux transformer mon audience en revenus" },
  { value: "structurer_strategie", label: "Structurer un lancement ou une stratégie plus ambitieuse" },
] as const;

const workModeOptions = [
  { value: "outils_autonomes", label: "Des outils et des données pour décider entièrement seul" },
  { value: "plan_ponctuel", label: "Construire un plan clair avec Fred, puis l'appliquer seul" },
  { value: "suivi_collectif", label: "Avancer avec des retours réguliers en collectif" },
  { value: "suivi_individuel", label: "Être accompagné personnellement pendant la mise en œuvre" },
  { value: "a_definir", label: "Je ne sais pas encore ce qui serait le plus utile" },
] as const;

const optionalText = (max: number) => z.string().trim().max(max).optional().or(z.literal(""));
const allowedValue = <T extends readonly { value: string }[]>(options: T, message: string) =>
  z.string().refine((value) => options.some((option) => option.value === value), message);

const contactSchema = z.object({
  first_name: z.string().trim().min(1, "Prénom requis").max(100),
  last_name: z.string().trim().min(1, "Nom requis").max(100),
  email: z.string().trim().email("Email invalide").max(255),
  account_url: z.string().trim().min(2, "Ajoute le lien ou l'identifiant de ton compte").max(500),
  situation: allowedValue(situationOptions, "Sélectionne ta situation"),
  primary_goal: allowedValue(goalOptions, "Sélectionne ton objectif prioritaire"),
  blocker_context: z.string().trim().min(20, "Décris le blocage avec un peu plus de précision").max(2000),
  work_mode: allowedValue(workModeOptions, "Sélectionne la manière dont tu souhaites avancer"),
  budget: z.string().refine(
    (value) => PREMIUM_BUDGET_TIERS.some((tier) => tier.value === value),
    "Sélectionne ton budget total",
  ),
  origin_source: optionalText(500),
});

type ContactForm = z.infer<typeof contactSchema>;
type QualificationRoute = "wavstats" | "express" | "call";
type RecommendedOffer = "wavstats" | "express" | "academy" | "sprint" | "premium";
type QualificationResult = { route: QualificationRoute; offer: RecommendedOffer; score: number };

function optionLabel(options: readonly { value: string; label: string }[], value: string) {
  return options.find((option) => option.value === value)?.label ?? value;
}

function qualify(data: ContactForm): QualificationResult {
  const situationScores: Record<string, number> = {
    debut: 0,
    irregulier: 0,
    stagnation: 1,
    visibilite_sans_revenus: 2,
    activite_a_accelerer: 2,
  };
  const goalScores: Record<string, number> = {
    comprendre_contenus: 0,
    gagner_visibilite: 0,
    attirer_clients: 2,
    mieux_vendre: 2,
    structurer_strategie: 2,
  };
  const workModeScores: Record<string, number> = {
    outils_autonomes: 0,
    suivi_collectif: 1,
    plan_ponctuel: 2,
    suivi_individuel: 3,
    a_definir: 1,
  };
  const budgetScores: Record<string, number> = {
    total_no_budget: 0,
    total_15_a_100: 0,
    total_100_a_300: 1,
    total_300_a_900: 2,
    total_900_plus: 2,
  };
  const score =
    (situationScores[data.situation] ?? 0) +
    (goalScores[data.primary_goal] ?? 0) +
    (workModeScores[data.work_mode] ?? 0) +
    (budgetScores[data.budget] ?? 0);
  const canInvestInHumanHelp = !["total_no_budget", "total_15_a_100"].includes(data.budget);
  const hasPremiumBudget = data.budget === "total_900_plus";
  const hasCommercialNeed =
    ["stagnation", "visibilite_sans_revenus", "activite_a_accelerer"].includes(data.situation) &&
    ["attirer_clients", "mieux_vendre", "structurer_strategie"].includes(data.primary_goal);

  if (!canInvestInHumanHelp) {
    return data.budget === "total_no_budget"
      ? { score, route: "wavstats", offer: "wavstats" }
      : { score, route: "express", offer: "express" };
  }

  if (data.work_mode === "outils_autonomes") {
    return { score, route: "wavstats", offer: "wavstats" };
  }
  if (data.work_mode === "plan_ponctuel") {
    return { score, route: "call", offer: "sprint" };
  }
  if (data.work_mode === "suivi_collectif") {
    return { score, route: "call", offer: "academy" };
  }
  if (data.work_mode === "suivi_individuel") {
    return hasPremiumBudget
      ? { score, route: "call", offer: "premium" }
      : { score, route: "call", offer: "academy" };
  }

  if (data.budget === "total_100_a_300") {
    return { score, route: "call", offer: "academy" };
  }
  if (hasCommercialNeed) {
    return { score, route: "call", offer: "sprint" };
  }
  return { score, route: "call", offer: "academy" };
}

export default function ReserverUnAppel() {
  const [result, setResult] = useState<QualificationResult | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formStarted, setFormStarted] = useState(false);

  useEffect(() => {
    trackEvent("reserverunappel_form_open", { page: FORM_VERSION });
  }, []);

  const form = useForm<ContactForm>({
    resolver: zodResolver(contactSchema),
    defaultValues: {
      first_name: "",
      last_name: "",
      email: "",
      account_url: "",
      situation: "",
      primary_goal: "",
      blocker_context: "",
      work_mode: "",
      budget: "",
      origin_source: "",
    },
  });

  useEffect(() => {
    const syncAttribution = () => {
      form.setValue("origin_source", getStoredUtmSource(), {
        shouldDirty: false,
        shouldTouch: false,
        shouldValidate: false,
      });
    };

    syncAttribution();
    window.addEventListener(ATTRIBUTION_UPDATED_EVENT, syncAttribution);
    return () => window.removeEventListener(ATTRIBUTION_UPDATED_EVENT, syncAttribution);
  }, [form]);

  const handleFormFocus = () => {
    if (!formStarted) {
      setFormStarted(true);
      trackEvent("reserverunappel_form_start", { page: FORM_VERSION });
    }
  };

  const onSubmit = async (data: ContactForm) => {
    if (isSubmitting) return;
    setIsSubmitting(true);

    const qualification = qualify(data);
    const situationLabel = optionLabel(situationOptions, data.situation);
    const goalLabel = optionLabel(goalOptions, data.primary_goal);
    const workModeLabel = optionLabel(workModeOptions, data.work_mode);

    const dbPayload = {
      first_name: data.first_name,
      last_name: data.last_name,
      email: data.email,
      tiktok_username: null,
      instagram_username: null,
      youtube_url: null,
      facebook_url: null,
      other_social_url: null,
      profil: situationLabel,
      objectives: null,
      goals: data.blocker_context,
      success_30_days: null,
      why_now: null,
      help_topics: null,
      availability: null,
      budget: data.budget,
      origin_source: data.origin_source || null,
      follower_since: null,
      conversion_trigger: null,
      posthog_id: getPostHogId(),
      form_version: FORM_VERSION,
      account_url: data.account_url,
      business_stage: data.situation,
      primary_goal: data.primary_goal,
      main_blocker: data.blocker_context,
      work_mode: data.work_mode,
      qualification_route: qualification.route,
      recommended_offer: qualification.offer,
      qualification_score: qualification.score,
    };

    try {
      const notifyPromise = supabase.functions.invoke("notify-application", {
        body: {
          ...dbPayload,
          business_stage_label: situationLabel,
          primary_goal_label: goalLabel,
          work_mode_label: workModeLabel,
        },
      });
      const { error: dbError } = await supabase.from("wav_premium_applications").insert(dbPayload);
      const notifyResult = await notifyPromise.catch((error) => ({ error }));

      if (dbError && notifyResult.error) {
        console.error("Qualification errors:", { dbError, notifyError: notifyResult.error });
        throw new Error("La qualification n'a pas pu être enregistrée");
      }
      if (dbError) console.error("DB insert error (notification sent):", dbError);
      if (notifyResult.error) console.error("Notification error (DB insert succeeded):", notifyResult.error);

      const trackingProperties = {
        form_version: FORM_VERSION,
        route: qualification.route,
        recommended_offer: qualification.offer,
        score: String(qualification.score),
        situation: data.situation,
        primary_goal: data.primary_goal,
        work_mode: data.work_mode,
        budget: data.budget,
      };
      trackEvent("reserverunappel_submit", trackingProperties);
      trackEvent("qualification_result", trackingProperties);
      setResult(qualification);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (error) {
      console.error("Submission error:", error);
      trackEvent("reserverunappel_submit_error", { stage: "network", form_version: FORM_VERSION });
      toast.error("Une erreur est survenue. Réessaie ou contacte-nous directement.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const trackDestinationClick = (destination: QualificationRoute) => {
    trackEvent("qualification_destination_click", {
      form_version: FORM_VERSION,
      route: result?.route,
      recommended_offer: result?.offer,
      destination,
      score: String(result?.score ?? 0),
    });
  };

  if (result) {
    const isCall = result.route === "call";
    const isExpress = result.route === "express";
    const resultTitle = isCall
      ? "Un appel stratégique est pertinent"
      : isExpress
        ? "Commence par l'Analyse Express"
        : "Commence par WavStats";
    const resultDescription = isCall
      ? "Ton objectif, ton niveau de maturité et ton besoin justifient un regard stratégique humain. Choisis directement le créneau qui te convient."
      : isExpress
        ? "Obtiens un audit TikTok automatique et ponctuel avec un rapport et des priorités d'action."
        : "Analyse tes contenus et suis ce qui fonctionne dans la durée, sans réserver un appel.";
    const resultNote = isCall
      ? "Pendant l'appel, on identifie le vrai blocage et la forme d'intervention cohérente : Sprint stratégique, Academy ou accompagnement individuel."
      : isExpress
        ? "L'Analyse Express est entièrement automatique. Elle ne comprend pas d'analyse humaine réalisée par Fred."
        : "WavStats est un outil autonome. Il ne comprend pas d'analyse humaine réalisée par Fred.";

    return (
      <Layout>
        <SEOHead
          {...seoFor("/reserverunappel")}
          title="Ta prochaine étape | Fred Wav"
          description="Ta qualification est terminée. Découvre la prochaine étape adaptée à ta situation."
          noindex
        />
        <Section variant="cream" size="lg">
          <div className="max-w-xl mx-auto text-center">
            <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              {isCall ? <CalendarDays className="h-8 w-8" /> : <BarChart3 className="h-8 w-8" />}
            </div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-primary mb-3">Ta prochaine étape</p>
            <h1 className="font-display text-3xl md:text-4xl font-semibold mb-5">{resultTitle}</h1>
            <p className="text-lg text-muted-foreground mb-8">{resultDescription}</p>
            <div className="rounded-2xl border border-primary/20 bg-background p-6 mb-8 text-left">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="h-5 w-5 text-primary mt-0.5 shrink-0" />
                <p className="text-sm leading-relaxed">{resultNote}</p>
              </div>
            </div>
            {isExpress ? (
              <Button variant="hero" size="xl" className="w-full sm:w-auto" asChild>
                <Link to={ANALYSE_EXPRESS_URL} onClick={() => trackDestinationClick("express")}>
                  Lancer l'analyse - {EXPRESS_PRICE_LABEL}
                </Link>
              </Button>
            ) : (
              <Button variant="hero" size="xl" className="w-full sm:w-auto" asChild>
                <a
                  href={isCall ? CALL_BOOKING_URL : WAVSTATS_URL}
                  target="_blank"
                  rel="noreferrer"
                  onClick={() => trackDestinationClick(result.route)}
                >
                  {isCall ? "Choisir mon créneau" : "Découvrir WavStats"}
                  <ExternalLink className="ml-2 h-5 w-5" />
                </a>
              </Button>
            )}
            <p className="text-sm text-muted-foreground mt-4">Cette recommandation vient aussi de t'être envoyée par email.</p>
            <Button variant="link" asChild className="mt-4">
              <Link to="/">Retour à l'accueil</Link>
            </Button>
          </div>
        </Section>
      </Layout>
    );
  }

  return (
    <Layout>
      <SEOHead {...seoFor("/reserverunappel")} />
      <Section variant="cream" size="lg">
        <div className="max-w-3xl mx-auto text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-primary mb-4">Appel stratégique</p>
          <h1 className="font-display text-3xl md:text-5xl font-semibold tracking-tight mb-5">
            Tes contenus avancent, mais pas <span className="text-gold-gradient">tes résultats ?</span>
          </h1>
          <p className="text-muted-foreground text-lg mb-4">
            Réponds à quelques questions pour identifier la prochaine étape qui peut réellement débloquer ta situation.
          </p>
          <p className="font-medium">
            Si un échange stratégique est pertinent, tu accèdes directement à mon calendrier. Sinon, tu repars avec une solution pour avancer sans attendre.
          </p>
        </div>
      </Section>

      <Section variant="default" size="lg">
        <div className="max-w-2xl mx-auto">
          <div className="mb-10">
            <h2 className="font-display text-3xl font-semibold mb-3">Vérifions la prochaine étape</h2>
            <p className="text-muted-foreground">Quelques réponses courtes. Le résultat s'affiche immédiatement.</p>
          </div>
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(onSubmit, (errors) => {
                const fields = Object.keys(errors);
                trackEvent("reserverunappel_form_error", { fields: fields.join(","), form_version: FORM_VERSION });
                toast.error("Vérifie les champs en rouge avant de continuer.");
                const first = fields[0] as keyof ContactForm | undefined;
                if (first) {
                  try { form.setFocus(first); } catch { /* Les listes ne sont pas toujours focusables. */ }
                  requestAnimationFrame(() => {
                    const element = document.querySelector(`[name="${first}"]`) as HTMLElement | null;
                    (element ?? document.getElementById(`${first}-section`))?.scrollIntoView({ behavior: "smooth", block: "center" });
                  });
                }
              })}
              onFocus={handleFormFocus}
              className="space-y-8 [&_label[for$='-form-item']]:text-base [&_label[for$='-form-item']]:font-semibold"
            >
              <fieldset className="space-y-5">
                <legend className="font-display text-xl font-semibold mb-4">Tes coordonnées</legend>
                <div className="grid sm:grid-cols-2 gap-4">
                  <FormField control={form.control} name="first_name" render={({ field }) => (
                    <FormItem><FormLabel>Prénom *</FormLabel><FormControl><Input autoComplete="given-name" placeholder="Ton prénom" {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={form.control} name="last_name" render={({ field }) => (
                    <FormItem><FormLabel>Nom *</FormLabel><FormControl><Input autoComplete="family-name" placeholder="Ton nom" {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                </div>
                <FormField control={form.control} name="email" render={({ field }) => (
                  <FormItem><FormLabel>Email *</FormLabel><FormControl><Input type="email" autoComplete="email" placeholder="ton@email.com" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
              </fieldset>

              <FormField control={form.control} name="account_url" render={({ field }) => (
                <FormItem id="account_url-section">
                  <FormLabel>Lien principal de ton compte, ton site ou ton projet *</FormLabel>
                  <FormControl><Input placeholder="@toncompte ou https://..." {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={form.control} name="situation" render={({ field }) => (
                <FormItem id="situation-section">
                  <FormLabel>Où en es-tu aujourd'hui ? *</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl><SelectTrigger><SelectValue placeholder="Sélectionne ta situation" /></SelectTrigger></FormControl>
                    <SelectContent>{situationOptions.map((option) => <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>)}</SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={form.control} name="primary_goal" render={({ field }) => (
                <FormItem id="primary_goal-section">
                  <FormLabel>Quel résultat est prioritaire dans les 90 prochains jours ? *</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl><SelectTrigger><SelectValue placeholder="Sélectionne ton objectif prioritaire" /></SelectTrigger></FormControl>
                    <SelectContent>{goalOptions.map((option) => <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>)}</SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={form.control} name="blocker_context" render={({ field }) => (
                <FormItem>
                  <FormLabel>Qu'est-ce qui t'empêche d'obtenir ce résultat aujourd'hui ? *</FormLabel>
                  <FormControl><Textarea placeholder="Le principal blocage, ce que tu as déjà tenté et pourquoi la situation doit changer maintenant." rows={5} {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={form.control} name="work_mode" render={({ field }) => (
                <FormItem id="work_mode-section">
                  <FormLabel>Après avoir clarifié ta stratégie, de quoi auras-tu surtout besoin ? *</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl><SelectTrigger><SelectValue placeholder="Sélectionne la manière d'avancer" /></SelectTrigger></FormControl>
                    <SelectContent className="w-[var(--radix-select-trigger-width)] max-w-[calc(100vw-2rem)]">
                      {workModeOptions.map((option) => (
                        <SelectItem
                          key={option.value}
                          value={option.value}
                          className="items-start py-2 pl-8 pr-3 [&>span:last-child]:whitespace-normal [&>span:last-child]:leading-snug"
                        >
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={form.control} name="budget" render={({ field }) => (
                <FormItem id="budget-section">
                  <FormLabel>Si une solution adaptée existe, quel budget total peux-tu investir maintenant ? *</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl><SelectTrigger><SelectValue placeholder="Sélectionne ton budget total" /></SelectTrigger></FormControl>
                    <SelectContent>{PREMIUM_BUDGET_TIERS.map((tier) => <SelectItem key={tier.value} value={tier.value}>{tier.label}</SelectItem>)}</SelectContent>
                  </Select>
                  <p className="text-sm text-muted-foreground">Cette réponse évite de te proposer une prochaine étape hors sujet.</p>
                  <FormMessage />
                </FormItem>
              )} />

              <div>
                <Button type="submit" variant="hero" size="xl" className="w-full" disabled={isSubmitting}>
                  {isSubmitting ? "Analyse en cours..." : "Obtenir ma prochaine étape"}
                </Button>
                <p className="text-sm text-muted-foreground text-center mt-3">Résultat immédiat après l'envoi.</p>
              </div>
            </form>
          </Form>
        </div>
      </Section>
    </Layout>
  );
}
