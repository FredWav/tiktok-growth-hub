import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Link } from "react-router-dom";
import { ArrowRight, CheckCircle2, Clock, Mail } from "lucide-react";
import { trackEvent, getStoredUtmSource } from "@/lib/tracking";
import { getPostHogId } from "@/lib/posthog";
import { cn } from "@/lib/utils";
import { Layout } from "@/components/layout/Layout";
import { Section } from "@/components/ui/section";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { SEOHead } from "@/components/SEOHead";
import { seoFor } from "@/config/seo";
import { PREMIUM_BUDGET_TIERS } from "@/config/offers";
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
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

const profilOptions = [
  {
    value: "createur",
    title: "Créateur / créatrice",
    description: "Je développe principalement une audience autour de mes contenus.",
  },
  {
    value: "entrepreneur",
    title: "Entrepreneur / indépendante / professionnel",
    description: "Mes réseaux servent principalement à développer mon activité, mes produits ou mes services.",
  },
  {
    value: "les_deux",
    title: "Les deux",
    description: "Je développe une audience et une activité commerciale autour de mon contenu.",
  },
] as const;

const objectiveOptions = [
  { value: "audience_qualifiee", label: "Construire une audience réellement qualifiée" },
  { value: "visibilite", label: "Gagner en visibilité" },
  { value: "clients_prospects", label: "Attirer des clients ou des prospects" },
  { value: "vendre", label: "Vendre mes produits ou mes services" },
  { value: "credibilite", label: "Renforcer ma crédibilité sur mon sujet" },
  { value: "revenus_contenu", label: "Générer des revenus grâce à mon contenu" },
  { value: "partenariats", label: "Développer des partenariats avec des marques" },
  { value: "reproduire", label: "Comprendre ce qui fonctionne dans mes contenus pour pouvoir le reproduire" },
  { value: "multireseaux", label: "Structurer une stratégie cohérente entre plusieurs plateformes" },
] as const;

const helpOptions = [
  { value: "strategie_globale", label: "Clarifier ma stratégie globale" },
  { value: "positionnement", label: "Revoir mon positionnement" },
  { value: "statistiques", label: "Comprendre mes statistiques" },
  { value: "formats", label: "Trouver ou améliorer mes formats" },
  { value: "hooks_scripts", label: "Travailler mes hooks et mes scripts" },
  { value: "audience_clients", label: "Mieux transformer mon audience en clients" },
  { value: "strategie_multireseaux", label: "Construire une stratégie multiréseaux" },
  { value: "regard_exterieur", label: "Avoir un regard extérieur régulier sur mes décisions" },
  { value: "identifier_blocage", label: "Identifier ce qui bloque sans réussir à le voir seul" },
] as const;

const availabilityOptions = [
  { value: "disponible", label: "Oui, je peux appliquer et tester régulièrement." },
  { value: "temps_limite", label: "Oui, mais mon temps est limité et j'ai besoin qu'on structure mes priorités." },
  { value: "delegation", label: "Non, je cherche surtout quelqu'un qui fasse le travail à ma place." },
] as const;

const followerSinceOptions = [
  "Moins d'1 mois",
  "1-3 mois",
  "3-6 mois",
  "6+ mois",
  "Je ne te suivais pas",
] as const;

const optionalText = (max: number) => z.string().trim().max(max).optional().or(z.literal(""));

const contactSchema = z.object({
  first_name: z.string().trim().min(1, "Prénom requis").max(100),
  last_name: z.string().trim().min(1, "Nom requis").max(100),
  email: z.string().trim().email("Email invalide").max(255),
  tiktok_username: optionalText(100),
  instagram_username: optionalText(100),
  youtube_url: optionalText(500),
  facebook_url: optionalText(500),
  other_social_url: optionalText(500),
  profil: z.string().min(1, "Sélectionne ton profil"),
  objectives: z.array(z.string()).min(1, "Sélectionne au moins un objectif").max(9),
  main_blocker: z.string().trim().min(10, "Décris ton blocage (10 caractères min.)").max(3000),
  success_30_days: z.string().trim().min(10, "Décris le résultat attendu (10 caractères min.)").max(3000),
  why_now: z.string().trim().min(10, "Explique pourquoi maintenant (10 caractères min.)").max(3000),
  help_topics: z.array(z.string()).min(1, "Sélectionne au moins un sujet").max(9),
  availability: z.string().min(1, "Sélectionne ta disponibilité"),
  budget: z.string().refine(
    (value) => PREMIUM_BUDGET_TIERS.some((tier) => tier.value === value),
    "Sélectionne ton budget total",
  ),
  origin_source: optionalText(500),
  follower_since: optionalText(100),
  conversion_trigger: optionalText(500),
}).superRefine((data, ctx) => {
  const networks = [
    data.tiktok_username,
    data.instagram_username,
    data.youtube_url,
    data.facebook_url,
    data.other_social_url,
  ];
  if (!networks.some((value) => value?.trim())) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["tiktok_username"],
      message: "Renseigne au moins un réseau, un lien ou un identifiant",
    });
  }
});

type ContactForm = z.infer<typeof contactSchema>;

function optionLabel<T extends readonly { value: string; label?: string; title?: string }[]>(
  options: T,
  value: string,
) {
  const option = options.find((item) => item.value === value);
  return option?.label ?? option?.title ?? value;
}

export default function ReserverUnAppel() {
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formStarted, setFormStarted] = useState(false);

  useEffect(() => {
    trackEvent("reserverunappel_form_open", { page: "wav_premium" });
  }, []);

  const form = useForm<ContactForm>({
    resolver: zodResolver(contactSchema),
    defaultValues: {
      first_name: "",
      last_name: "",
      email: "",
      tiktok_username: "",
      instagram_username: "",
      youtube_url: "",
      facebook_url: "",
      other_social_url: "",
      profil: "",
      objectives: [],
      main_blocker: "",
      success_30_days: "",
      why_now: "",
      help_topics: [],
      availability: "",
      budget: "",
      origin_source: getStoredUtmSource(),
      follower_since: "",
      conversion_trigger: "",
    },
  });

  const handleFormFocus = () => {
    if (!formStarted) {
      setFormStarted(true);
      trackEvent("reserverunappel_form_start", { page: "wav_premium" });
    }
  };

  const onSubmit = async (data: ContactForm) => {
    if (isSubmitting) return;
    setIsSubmitting(true);

    const objectives = data.objectives.map((value) => optionLabel(objectiveOptions, value));
    const helpTopics = data.help_topics.map((value) => optionLabel(helpOptions, value));
    const profileLabel = profilOptions.find((option) => option.value === data.profil);
    const networkCount = [
      data.tiktok_username,
      data.instagram_username,
      data.youtube_url,
      data.facebook_url,
      data.other_social_url,
    ].filter(Boolean).length;

    const dbPayload = {
      first_name: data.first_name,
      last_name: data.last_name,
      email: data.email,
      tiktok_username: data.tiktok_username || null,
      instagram_username: data.instagram_username || null,
      youtube_url: data.youtube_url || null,
      facebook_url: data.facebook_url || null,
      other_social_url: data.other_social_url || null,
      profil: profileLabel ? `${profileLabel.title} — ${profileLabel.description}` : data.profil,
      objectives,
      goals: data.main_blocker,
      success_30_days: data.success_30_days,
      why_now: data.why_now,
      help_topics: helpTopics,
      availability: optionLabel(availabilityOptions, data.availability),
      budget: data.budget,
      origin_source: data.origin_source || null,
      follower_since: data.follower_since || null,
      conversion_trigger: data.conversion_trigger || null,
      posthog_id: getPostHogId(),
    };

    try {
      const notifyPromise = supabase.functions.invoke("notify-application", { body: dbPayload });
      const { error: dbError } = await supabase.from("wav_premium_applications").insert(dbPayload);
      const notifyResult = await notifyPromise.catch((error) => ({ error }));

      if (dbError && notifyResult.error) {
        console.error("Premium application errors:", { dbError, notifyError: notifyResult.error });
        throw new Error("La demande n'a pas pu être enregistrée");
      }
      if (dbError) console.error("DB insert error (notification sent):", dbError);
      if (notifyResult.error) console.error("Notification error (DB insert succeeded):", notifyResult.error);

      trackEvent("reserverunappel_submit", {
        profil: data.profil,
        budget: data.budget,
        platform_count: String(networkCount),
      });
      setSubmitted(true);
    } catch (error) {
      console.error("Submission error:", error);
      trackEvent("reserverunappel_submit_error", { stage: "network" });
      toast.error("Une erreur est survenue. Réessaie ou contacte-nous directement.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <Layout>
        <SEOHead
          {...seoFor("/reserverunappel")}
          title="Demande Wav Premium envoyée | Fred Wav"
          description="Ta demande a bien été envoyée. Fred te recontacte par email sous 48 h ouvrées."
          noindex
        />
        <Section variant="cream" size="lg">
          <div className="max-w-xl mx-auto text-center">
            <CheckCircle2 className="h-16 w-16 text-primary mx-auto mb-6" />
            <h1 className="font-display text-3xl md:text-4xl font-semibold mb-4">Demande envoyée !</h1>
            <p className="text-lg text-muted-foreground mb-8">
              Merci pour ta demande. Je l'ai bien reçue et je prends le temps de la lire en détail.
            </p>
            <div className="bg-background border border-primary/20 rounded-2xl p-6 mb-8 text-left">
              <div className="flex items-start gap-4 mb-4">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                  <Mail className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="font-semibold mb-1">Je te recontacte par email</p>
                  <p className="text-sm text-muted-foreground">
                    Sous <strong>48 h ouvrées</strong> à l'adresse que tu viens de me communiquer.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                  <Clock className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="font-semibold mb-1">En attendant</p>
                  <p className="text-sm text-muted-foreground">
                    Vérifie tes spams et prépare tes questions. On fait d'abord le point par écrit avant d'éventuellement caler un échange.
                  </p>
                </div>
              </div>
            </div>
            <Button variant="outline" size="lg" asChild>
              <Link to="/">← Retour à l'accueil</Link>
            </Button>
          </div>
        </Section>
      </Layout>
    );
  }

  const renderCheckboxGroup = (
    name: "objectives" | "help_topics",
    options: readonly { value: string; label: string }[],
  ) => (
    <FormField
      control={form.control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <div className="space-y-3 mt-3">
            {options.map((option) => {
              const checked = field.value.includes(option.value);
              return (
                <Label
                  key={option.value}
                  htmlFor={`${name}-${option.value}`}
                  className={cn(
                    "flex items-start gap-3 rounded-xl border p-4 cursor-pointer font-normal leading-snug transition-colors",
                    checked ? "border-primary bg-primary/5" : "border-border hover:bg-accent/50",
                  )}
                >
                  <Checkbox
                    id={`${name}-${option.value}`}
                    checked={checked}
                    onCheckedChange={(next) => {
                      field.onChange(
                        next
                          ? [...field.value, option.value]
                          : field.value.filter((value) => value !== option.value),
                      );
                    }}
                    className="mt-0.5"
                  />
                  <span>{option.label}</span>
                </Label>
              );
            })}
          </div>
          <FormMessage />
        </FormItem>
      )}
    />
  );

  return (
    <Layout>
      <SEOHead {...seoFor("/reserverunappel")} />
      <Section variant="cream" size="lg">
        <div className="max-w-3xl mx-auto text-center">
          <h1 className="font-display text-3xl md:text-5xl font-semibold tracking-tight mb-5">
            Wav Premium — <span className="text-gold-gradient">30 jours d'accompagnement individuel</span>
          </h1>
          <p className="text-muted-foreground text-lg mb-4">
            Avant de réserver quoi que ce soit, j'ai besoin de comprendre où tu en es, ce que tu cherches à développer et ce qui bloque aujourd'hui. Plus tu es précis, plus je peux te dire rapidement si je suis la bonne personne pour t'aider.
          </p>
          <p className="font-medium">
            L'accompagnement peut concerner TikTok, Instagram, YouTube, Facebook ou une stratégie qui combine plusieurs plateformes.
          </p>
        </div>
      </Section>

      <Section variant="default" size="lg">
        <div className="max-w-2xl mx-auto">
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(onSubmit, (errors) => {
                const fields = Object.keys(errors);
                trackEvent("reserverunappel_form_error", { fields: fields.join(",") });
                toast.error("Vérifie les champs en rouge avant d'envoyer.");
                const first = fields[0] as keyof ContactForm | undefined;
                if (first) {
                  try { form.setFocus(first); } catch { /* Les groupes ne sont pas toujours focusables. */ }
                  requestAnimationFrame(() => {
                    const element = document.querySelector(`[name="${first}"]`) as HTMLElement | null;
                    (element ?? document.getElementById(`${first}-section`))?.scrollIntoView({ behavior: "smooth", block: "center" });
                  });
                }
              })}
              onFocus={handleFormFocus}
              className="space-y-12 [&_label[for$='-form-item']]:text-lg [&_label[for$='-form-item']]:font-semibold"
            >
              <fieldset className="space-y-5">
                <legend className="font-display text-2xl font-semibold mb-5">Informations</legend>
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

              <fieldset className="space-y-5" id="tiktok_username-section">
                <legend className="font-display text-2xl font-semibold">Où est-ce qu'on peut voir ton travail ?</legend>
                <p className="text-sm text-muted-foreground">Les champs sont facultatifs individuellement, mais renseigne au moins un lien ou identifiant.</p>
                <div className="grid sm:grid-cols-2 gap-4">
                  <FormField control={form.control} name="tiktok_username" render={({ field }) => (
                    <FormItem><FormLabel>TikTok</FormLabel><FormControl><Input placeholder="@toncompte ou lien" {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={form.control} name="instagram_username" render={({ field }) => (
                    <FormItem><FormLabel>Instagram</FormLabel><FormControl><Input placeholder="@toncompte ou lien" {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={form.control} name="youtube_url" render={({ field }) => (
                    <FormItem><FormLabel>YouTube</FormLabel><FormControl><Input placeholder="Lien de ta chaîne" {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={form.control} name="facebook_url" render={({ field }) => (
                    <FormItem><FormLabel>Facebook</FormLabel><FormControl><Input placeholder="Lien de ta page ou profil" {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                </div>
                <FormField control={form.control} name="other_social_url" render={({ field }) => (
                  <FormItem><FormLabel>Autre site / réseau</FormLabel><FormControl><Input placeholder="Site, LinkedIn, podcast…" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
              </fieldset>

              <FormField control={form.control} name="profil" render={({ field }) => (
                <FormItem id="profil-section">
                  <FormLabel>Tu te reconnais le plus dans quel profil ? *</FormLabel>
                  <FormControl>
                    <RadioGroup onValueChange={field.onChange} value={field.value} className="space-y-3 mt-3">
                      {profilOptions.map((option) => (
                        <Label key={option.value} htmlFor={`profil-${option.value}`} className={cn("flex items-start gap-3 rounded-xl border p-4 cursor-pointer font-normal transition-colors", field.value === option.value ? "border-primary bg-primary/5" : "border-border hover:bg-accent/50")}>
                          <RadioGroupItem value={option.value} id={`profil-${option.value}`} className="mt-0.5" />
                          <span><strong className="block mb-1">{option.title}</strong><span className="text-sm text-muted-foreground">{option.description}</span></span>
                        </Label>
                      ))}
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <div id="objectives-section">
                <FormLabel>Qu'est-ce que tes réseaux doivent t'apporter concrètement ? *</FormLabel>
                <FormDescription>Plusieurs réponses possibles.</FormDescription>
                {renderCheckboxGroup("objectives", objectiveOptions)}
              </div>

              <FormField control={form.control} name="main_blocker" render={({ field }) => (
                <FormItem><FormLabel>Aujourd'hui, qu'est-ce qui te bloque le plus ? *</FormLabel><FormControl><Textarea placeholder="Explique-moi ce que tu as déjà essayé, ce qui fonctionne, ce qui ne fonctionne pas et ce que tu n'arrives pas à comprendre." rows={6} {...field} /></FormControl><FormMessage /></FormItem>
              )} />

              <FormField control={form.control} name="success_30_days" render={({ field }) => (
                <FormItem><FormLabel>À la fin de ces 30 jours, qu'est-ce qui te ferait dire : « OK, cet accompagnement m'a vraiment servi » ? *</FormLabel><FormControl><Textarea placeholder="Le résultat concret que tu aimerais observer ou la décision que tu voudrais savoir prendre." rows={5} {...field} /></FormControl><FormMessage /></FormItem>
              )} />

              <FormField control={form.control} name="why_now" render={({ field }) => (
                <FormItem><FormLabel>Pourquoi tu cherches un accompagnement individuel maintenant ? *</FormLabel><FormControl><Textarea placeholder="Ce qui rend ce moment différent ou important pour toi." rows={4} {...field} /></FormControl><FormMessage /></FormItem>
              )} />

              <div id="help_topics-section">
                <FormLabel>Sur quoi attends-tu le plus mon aide ? *</FormLabel>
                <FormDescription>Plusieurs réponses possibles.</FormDescription>
                {renderCheckboxGroup("help_topics", helpOptions)}
              </div>

              <FormField control={form.control} name="availability" render={({ field }) => (
                <FormItem id="availability-section">
                  <FormLabel>Est-ce que tu peux réellement consacrer du temps à tes contenus pendant les 30 jours ? *</FormLabel>
                  <FormControl>
                    <RadioGroup onValueChange={field.onChange} value={field.value} className="space-y-3 mt-3">
                      {availabilityOptions.map((option) => (
                        <Label key={option.value} htmlFor={`availability-${option.value}`} className={cn("flex items-start gap-3 rounded-xl border p-4 cursor-pointer font-normal leading-snug transition-colors", field.value === option.value ? "border-primary bg-primary/5" : "border-border hover:bg-accent/50")}>
                          <RadioGroupItem value={option.value} id={`availability-${option.value}`} className="mt-0.5" />
                          <span>{option.label}</span>
                        </Label>
                      ))}
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={form.control} name="budget" render={({ field }) => (
                <FormItem id="budget-section">
                  <FormLabel>Quel budget total es-tu prêt à investir dans un accompagnement individuel ? *</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl><SelectTrigger><SelectValue placeholder="Sélectionne ton budget total" /></SelectTrigger></FormControl>
                    <SelectContent>{PREMIUM_BUDGET_TIERS.map((tier) => <SelectItem key={tier.value} value={tier.value}>{tier.label}</SelectItem>)}</SelectContent>
                  </Select>
                  <FormDescription>Cette réponse sert uniquement à qualifier ta demande.</FormDescription>
                  <FormMessage />
                </FormItem>
              )} />

              <fieldset className="bg-accent/50 border border-border rounded-xl p-6 space-y-5">
                <legend className="font-semibold text-sm text-muted-foreground uppercase tracking-wide px-2">Pour mieux te connaître</legend>
                <FormField control={form.control} name="origin_source" render={({ field }) => (
                  <FormItem><FormLabel>Comment m'as-tu découvert ?</FormLabel><FormControl><Input placeholder="TikTok, Instagram, YouTube, recommandation, Google…" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="follower_since" render={({ field }) => (
                  <FormItem><FormLabel>Depuis combien de temps me suis-tu ?</FormLabel><Select onValueChange={field.onChange} value={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Sélectionne une durée" /></SelectTrigger></FormControl><SelectContent>{followerSinceOptions.map((option) => <SelectItem key={option} value={option}>{option}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="conversion_trigger" render={({ field }) => (
                  <FormItem><FormLabel>Quel contenu ou quelle expérience t'a poussé à me contacter aujourd'hui ?</FormLabel><FormControl><Input placeholder="Une vidéo, un témoignage, l'Analyse Express…" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
              </fieldset>

              <div>
                <Button type="submit" variant="hero" size="xl" className="w-full" disabled={isSubmitting}>
                  {isSubmitting ? "Envoi en cours…" : "Envoyer ma demande à Fred"}
                  {!isSubmitting && <ArrowRight className="ml-2 h-5 w-5" />}
                </Button>
                <p className="text-sm text-muted-foreground text-center mt-3">Je lis personnellement chaque demande avant de proposer un appel.</p>
              </div>
            </form>
          </Form>
        </div>
      </Section>
    </Layout>
  );
}
