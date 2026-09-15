import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Link } from "react-router-dom";
import { ArrowRight, CheckCircle2, MailCheck, Sparkles } from "lucide-react";
import { Layout } from "@/components/layout/Layout";
import { Section } from "@/components/ui/section";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SEOHead } from "@/components/SEOHead";
import { seoFor } from "@/config/seo";
import { ORIENTATION_BUDGET_TIERS } from "@/config/offers";
import { commerceCall } from "@/lib/commerce";
import { getPostHogId } from "@/lib/posthog";
import { ATTRIBUTION_UPDATED_EVENT, getStoredUtmSource, trackEvent } from "@/lib/tracking";

const FORM_VERSION = "orientation_v3";

const situations = [
  ["debut", "Je lance mon activité ou mon compte"],
  ["irregulier", "Je publie, mais sans régularité ni méthode"],
  ["stagnation", "Je publie régulièrement, mais les résultats stagnent"],
  ["visibilite_sans_revenus", "J’ai de la visibilité, mais peu de clients"],
  ["activite_a_accelerer", "Mon activité fonctionne et je veux accélérer"],
] as const;

const goals = [
  ["comprendre_contenus", "Comprendre ce qui fonctionne dans mes contenus"],
  ["gagner_visibilite", "Développer ma visibilité et mon audience"],
  ["attirer_clients", "Attirer davantage de prospects ou de clients"],
  ["mieux_vendre", "Mieux transformer mon audience en revenus"],
  ["structurer_strategie", "Structurer un lancement ou une stratégie"],
] as const;

const workModes = [
  ["outils_autonomes", "Des données et des outils pour avancer seul"],
  ["plan_ponctuel", "Un plan construit avec Fred, puis je l’applique seul"],
  ["suivi_collectif", "Un cadre collectif avec des retours réguliers"],
  ["suivi_individuel", "Un accompagnement individuel pendant l’exécution"],
  ["a_definir", "Je veux que Fred m’aide à choisir"],
] as const;

const followerSinceOptions = [
  "Moins d’1 mois",
  "1-3 mois",
  "3-6 mois",
  "6+ mois",
  "Je ne te suivais pas",
] as const;

const allowed = (options: readonly (readonly [string, string])[], message: string) =>
  z.string().refine((value) => options.some(([key]) => key === value), message);

const schema = z.object({
  first_name: z.string().trim().min(1, "Prénom requis").max(100),
  last_name: z.string().trim().min(1, "Nom requis").max(100),
  email: z.string().trim().email("E-mail invalide").max(254),
  account_url: z.string().trim().min(2, "Ajoute ton compte principal").max(500),
  business_stage: allowed(situations, "Sélectionne ta situation"),
  primary_goal: allowed(goals, "Sélectionne ton objectif"),
  main_blocker: z.string().trim().min(20, "Donne un peu plus de contexte (20 caractères minimum)").max(2000),
  work_mode: allowed(workModes, "Sélectionne le type d’aide recherché"),
  budget: allowed(ORIENTATION_BUDGET_TIERS.map(({ value, label }) => [value, label] as const), "Sélectionne ton budget"),
  origin_source: z.string().trim().max(500).optional(),
  follower_since: z.string().trim().max(100).optional(),
  conversion_trigger: z.string().trim().max(500).optional(),
  website: z.string().max(0).optional(),
});

type OrientationForm = z.infer<typeof schema>;
type OrientationResult = {
  id: string;
  notification: "queued";
};

export default function ReserverUnAppel() {
  const [result, setResult] = useState<OrientationResult | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const requestId = useRef(crypto.randomUUID());
  const form = useForm<OrientationForm>({
    resolver: zodResolver(schema),
    defaultValues: {
      first_name: "", last_name: "", email: "", account_url: "",
      business_stage: "", primary_goal: "", main_blocker: "", work_mode: "",
      budget: "", origin_source: "", follower_since: "", conversion_trigger: "",
      website: "",
    },
  });

  useEffect(() => {
    trackEvent("orientation_form_open", { form_version: FORM_VERSION });
    const sync = () => {
      if (form.getValues("origin_source")) return;
      form.setValue("origin_source", getStoredUtmSource(), { shouldDirty: false });
    };
    sync();
    window.addEventListener(ATTRIBUTION_UPDATED_EVENT, sync);
    return () => window.removeEventListener(ATTRIBUTION_UPDATED_EVENT, sync);
  }, [form]);

  async function submit(values: OrientationForm) {
    if (busy) return;
    setBusy(true);
    setError("");
    try {
      const response = await commerceCall<OrientationResult>("submit-orientation", {
        ...values,
        request_id: requestId.current,
        form_version: FORM_VERSION,
        posthog_id: getPostHogId(),
      });
      setResult(response);
      trackEvent("orientation_form_submitted", {
        form_version: FORM_VERSION,
        budget: values.budget,
      });
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Enregistrement indisponible.");
    } finally {
      setBusy(false);
    }
  }

  if (result) {
    return (
      <Layout>
        <SEOHead {...seoFor("/reserverunappel")} />
        <Section variant="cream" size="lg">
          <div className="mx-auto max-w-2xl text-center">
            <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <MailCheck className="h-8 w-8" />
            </div>
            <p className="mb-3 text-sm font-semibold uppercase tracking-[0.2em] text-primary">Demande envoyée</p>
            <h1 className="mb-5 font-display text-3xl font-semibold md:text-5xl">
              Merci, j’ai bien reçu tes informations
            </h1>
            <p className="mx-auto mb-7 max-w-xl text-lg text-muted-foreground">
              Je vais lire ta demande et te répondre personnellement par e-mail si je peux t’aider.
            </p>
            <div className="mb-8 rounded-2xl border border-primary/20 bg-background p-6 text-left">
              <div className="flex gap-3"><CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-primary" /><p className="text-sm leading-relaxed">Tu n’as rien d’autre à faire pour le moment. Tes réponses m’ont été transmises.</p></div>
            </div>
            <Button asChild variant="outline" size="xl"><Link to="/">Retour à l’accueil</Link></Button>
          </div>
        </Section>
      </Layout>
    );
  }

  return (
    <Layout>
      <SEOHead {...seoFor("/reserverunappel")} />
      <Section variant="cream" size="lg">
        <div className="mx-auto grid max-w-6xl gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:items-start">
          <div className="lg:sticky lg:top-28">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-2 text-sm font-semibold text-primary"><Sparkles className="h-4 w-4" /> Demande de contact · 3 minutes</div>
            <h1 className="mb-5 font-display text-4xl font-semibold tracking-tight md:text-5xl">Parle-moi de ton compte et de ce que tu veux <span className="text-gold-gradient">débloquer</span></h1>
            <p className="mb-8 text-lg leading-relaxed text-muted-foreground">Donne-moi le contexte utile sur ton compte, tes objectifs et tes difficultés. Je pourrai comprendre ta situation avant de te répondre personnellement.</p>
            <div className="space-y-4 text-sm">
              {["Ta demande est lue personnellement", "Une réponse adaptée à ton besoin", "Aucun appel ni engagement imposé"].map((text) => <div key={text} className="flex gap-3"><CheckCircle2 className="h-5 w-5 shrink-0 text-primary" /><span>{text}</span></div>)}
            </div>
          </div>

          <div className="rounded-3xl border border-border bg-background p-6 shadow-sm md:p-9">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(submit)} className="space-y-8">
                <fieldset className="space-y-5">
                  <legend className="mb-5 font-display text-2xl font-semibold"><span className="mr-3 text-primary">01</span>Ton point de départ</legend>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <FormField control={form.control} name="first_name" render={({ field }) => <FormItem><FormLabel>Prénom *</FormLabel><FormControl><Input autoComplete="given-name" {...field} /></FormControl><FormMessage /></FormItem>} />
                    <FormField control={form.control} name="last_name" render={({ field }) => <FormItem><FormLabel>Nom *</FormLabel><FormControl><Input autoComplete="family-name" {...field} /></FormControl><FormMessage /></FormItem>} />
                  </div>
                  <FormField control={form.control} name="email" render={({ field }) => <FormItem><FormLabel>E-mail *</FormLabel><FormControl><Input type="email" autoComplete="email" {...field} /></FormControl><FormMessage /></FormItem>} />
                  <FormField control={form.control} name="account_url" render={({ field }) => <FormItem><FormLabel>Ton compte principal *</FormLabel><FormControl><Input placeholder="@toncompte" {...field} /></FormControl><FormMessage /></FormItem>} />
                  <FormField control={form.control} name="business_stage" render={({ field }) => <FormItem><FormLabel>Où en es-tu aujourd’hui ? *</FormLabel><Select value={field.value} onValueChange={field.onChange}><FormControl><SelectTrigger><SelectValue placeholder="Sélectionne ta situation" /></SelectTrigger></FormControl><SelectContent>{situations.map(([value, label]) => <SelectItem key={value} value={value}>{label}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem>} />
                </fieldset>

                <fieldset className="space-y-5 border-t border-border pt-8">
                  <legend className="mb-5 font-display text-2xl font-semibold"><span className="mr-3 text-primary">02</span>Ce qu’il faut débloquer</legend>
                  <FormField control={form.control} name="primary_goal" render={({ field }) => <FormItem><FormLabel>Ton objectif prioritaire dans les 90 prochains jours *</FormLabel><Select value={field.value} onValueChange={field.onChange}><FormControl><SelectTrigger><SelectValue placeholder="Sélectionne ton objectif" /></SelectTrigger></FormControl><SelectContent>{goals.map(([value, label]) => <SelectItem key={value} value={value}>{label}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem>} />
                  <FormField control={form.control} name="main_blocker" render={({ field }) => <FormItem><FormLabel>Qu’est-ce qui t’en empêche aujourd’hui ? *</FormLabel><FormControl><Textarea rows={5} placeholder="Ton blocage principal, ce que tu as déjà tenté et ce qui doit changer." {...field} /></FormControl><FormMessage /></FormItem>} />
                  <FormField control={form.control} name="work_mode" render={({ field }) => <FormItem><FormLabel>De quel type d’aide as-tu besoin ? *</FormLabel><Select value={field.value} onValueChange={field.onChange}><FormControl><SelectTrigger><SelectValue placeholder="Sélectionne la manière d’avancer" /></SelectTrigger></FormControl><SelectContent>{workModes.map(([value, label]) => <SelectItem key={value} value={value}>{label}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem>} />
                </fieldset>

                <fieldset className="space-y-5 border-t border-border pt-8">
                  <legend className="mb-5 font-display text-2xl font-semibold"><span className="mr-3 text-primary">03</span>Un budget réaliste</legend>
                  <FormField control={form.control} name="budget" render={({ field }) => <FormItem><FormLabel>Quel budget total peux-tu investir maintenant ? *</FormLabel><Select value={field.value} onValueChange={field.onChange}><FormControl><SelectTrigger><SelectValue placeholder="Sélectionne ton budget" /></SelectTrigger></FormControl><SelectContent>{ORIENTATION_BUDGET_TIERS.map((tier) => <SelectItem key={tier.value} value={tier.value}>{tier.label}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem>} />
                </fieldset>

                <fieldset className="space-y-5 border-t border-border pt-8">
                  <legend className="mb-5 font-display text-2xl font-semibold"><span className="mr-3 text-primary">04</span>Pour mieux te connaître</legend>
                  <FormField control={form.control} name="origin_source" render={({ field }) => <FormItem><FormLabel>Comment m’as-tu découvert ?</FormLabel><FormControl><Input placeholder="TikTok, Instagram, YouTube, recommandation, Google…" {...field} /></FormControl><FormMessage /></FormItem>} />
                  <FormField control={form.control} name="follower_since" render={({ field }) => <FormItem><FormLabel>Depuis combien de temps me suis-tu ?</FormLabel><Select value={field.value} onValueChange={field.onChange}><FormControl><SelectTrigger><SelectValue placeholder="Sélectionne une durée" /></SelectTrigger></FormControl><SelectContent>{followerSinceOptions.map((option) => <SelectItem key={option} value={option}>{option}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem>} />
                  <FormField control={form.control} name="conversion_trigger" render={({ field }) => <FormItem><FormLabel>Qu’est-ce qui t’a poussé à me contacter aujourd’hui ?</FormLabel><FormControl><Input placeholder="Une vidéo, un témoignage, l’Analyse Express…" {...field} /></FormControl><FormMessage /></FormItem>} />
                </fieldset>


                <div className="hidden" aria-hidden="true"><Input tabIndex={-1} autoComplete="off" {...form.register("website")} /></div>
                {error && <p role="alert" className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">{error}</p>}
                <p className="text-sm text-muted-foreground">Tes réponses servent uniquement à traiter ta demande. <Link to="/politique-de-confidentialite" className="underline">Confidentialité</Link></p>
                <Button type="submit" variant="hero" size="xl" className="h-auto min-h-14 w-full whitespace-normal" disabled={busy}>{busy ? "Envoi en cours…" : <>Envoyer ma demande <ArrowRight className="ml-2 h-5 w-5" /></>}</Button>
              </form>
            </Form>
          </div>
        </div>
      </Section>
    </Layout>
  );
}
