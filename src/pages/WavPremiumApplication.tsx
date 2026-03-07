import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Link } from "react-router-dom";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import { trackEvent, getStoredUtmSource } from "@/lib/tracking";
import { trackPostHogEvent, identifyUser, getPostHogId } from "@/lib/posthog";
import { Layout } from "@/components/layout/Layout";
import { Section } from "@/components/ui/section";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { SEOHead } from "@/components/SEOHead";
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

const levels = [
  { value: "debut", label: "Je débute / Je n'ai pas encore de compte" },
  { value: "sans_strategie", label: "Je poste mais sans vraie stratégie" },
  { value: "stagne", label: "J'ai une audience mais je stagne" },
  { value: "scale", label: "J'ai déjà des résultats mais je veux scaler" },
] as const;

const followerSinceOptions = [
  "Moins d'1 mois",
  "1-3 mois",
  "3-6 mois",
  "6+ mois",
  "Je ne te suivais pas",
] as const;

const applicationSchema = z.object({
  first_name: z.string().trim().min(1, "Prénom requis").max(100),
  last_name: z.string().trim().min(1, "Nom requis").max(100),
  email: z.string().trim().email("Email invalide").max(255),
  tiktok_username: z.string().trim().max(100).optional().or(z.literal("")),
  current_level: z.string().min(1, "Sélectionne ton niveau actuel"),
  blockers: z.string().trim().min(10, "Décris tes points de blocage (10 caractères min.)").max(2000),
  goals: z.string().trim().min(10, "Décris tes objectifs (10 caractères min.)").max(2000),
  current_revenue: z.string().trim().min(1, "Ce champ est obligatoire").max(200),
  revenue_goal: z.string().trim().min(1, "Ce champ est obligatoire").max(200),
  origin_source: z.string().trim().max(500).optional().or(z.literal("")),
  follower_since: z.string().optional().or(z.literal("")),
  conversion_trigger: z.string().trim().max(500).optional().or(z.literal("")),
});

type ApplicationForm = z.infer<typeof applicationSchema>;

export default function WavPremiumApplication() {
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formStarted, setFormStarted] = useState(false);

  const form = useForm<ApplicationForm>({
    resolver: zodResolver(applicationSchema),
    defaultValues: {
      first_name: "",
      last_name: "",
      email: "",
      tiktok_username: "",
      current_level: "",
      blockers: "",
      goals: "",
      current_revenue: "",
      revenue_goal: "",
      origin_source: getStoredUtmSource(),
      follower_since: "",
      conversion_trigger: "",
    },
  });

  const handleFormFocus = () => {
    if (!formStarted) {
      setFormStarted(true);
      trackPostHogEvent("wav_premium_form_start");
    }
  };

  const onSubmit = async (data: ApplicationForm) => {
    setIsSubmitting(true);
    trackEvent("wav_premium_apply", { level: data.current_level });
    identifyUser(data.email, { first_name: data.first_name, last_name: data.last_name });
    try {
      const payload = {
        first_name: data.first_name,
        last_name: data.last_name,
        email: data.email,
        tiktok_username: data.tiktok_username || null,
        current_level: levels.find((l) => l.value === data.current_level)?.label ?? data.current_level,
        blockers: data.blockers,
        goals: data.goals,
        current_revenue: data.current_revenue || null,
        revenue_goal: data.revenue_goal || null,
        origin_source: data.origin_source || null,
        follower_since: data.follower_since || null,
        conversion_trigger: data.conversion_trigger || null,
        posthog_id: getPostHogId(),
      };

      const { error } = await supabase
        .from("wav_premium_applications" as any)
        .insert(payload as any);

      if (error) throw error;

      supabase.functions.invoke("notify-application", {
        body: payload,
      }).catch((err) => console.error("Notification error:", err));

      setSubmitted(true);
    } catch {
      toast.error("Une erreur est survenue. Réessaie ou contacte-nous directement.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <Layout>
        <SEOHead
          title="Candidature envoyée - Wav Premium | Fred Wav"
          description="Ta candidature au Wav Premium a bien été envoyée. Réserve ton appel de qualification."
          path="/wav-premium/candidature"
        />
        <Section variant="cream" size="lg">
          <div className="max-w-xl mx-auto text-center">
            <CheckCircle2 className="h-16 w-16 text-primary mx-auto mb-6" />
            <h1 className="font-display text-3xl md:text-4xl font-semibold mb-4">
              Candidature envoyée !
            </h1>
            <p className="text-lg text-muted-foreground mb-8">
              Merci pour ta candidature. L'étape suivante : réserve ton appel de qualification pour qu'on échange sur ta situation.
            </p>
            <Button variant="hero" size="xl" asChild>
              <a
                href="https://calendly.com/fredwavcm/wav-premium"
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => trackPostHogEvent("click_calendly_post_apply")}
              >
                Réserver mon appel de qualification
                <ArrowRight className="ml-2 h-5 w-5" />
              </a>
            </Button>
            <p className="text-sm text-muted-foreground mt-6">
              <Link to="/45-jours" className="text-primary underline hover:no-underline">
                ← Retour à la page Wav Premium
              </Link>
            </p>
          </div>
        </Section>
      </Layout>
    );
  }

  return (
    <Layout>
      <SEOHead
        title="Candidature Wav Premium | Fred Wav"
        description="Remplis le formulaire pour candidater au Wav Premium : 45 jours d'accompagnement intensif TikTok."
        path="/wav-premium/candidature"
        keywords="candidature wav premium, accompagnement tiktok, coaching tiktok"
      />
      <Section variant="cream" size="lg">
        <div className="max-w-2xl mx-auto text-center mb-10">
          <h1 className="font-display text-3xl md:text-4xl font-semibold tracking-tight mb-4">
            Candidater au <span className="text-gold-gradient">Wav Premium</span>
          </h1>
          <p className="text-muted-foreground text-lg">
            Remplis ce formulaire pour qu'on puisse évaluer si l'accompagnement est adapté à ta situation.
          </p>
        </div>
      </Section>

      <Section variant="default" size="lg">
        <div className="max-w-2xl mx-auto">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit, (errors) => trackPostHogEvent("wav_premium_form_error", { fields: Object.keys(errors).join(",") }))} onFocus={handleFormFocus} className="space-y-8">
              {/* Identity */}
              <div className="grid sm:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="first_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Prénom *</FormLabel>
                      <FormControl>
                        <Input placeholder="Ton prénom" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="last_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nom *</FormLabel>
                      <FormControl>
                        <Input placeholder="Ton nom" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email *</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="ton@email.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="tiktok_username"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Compte TikTok</FormLabel>
                    <FormControl>
                      <Input placeholder="@toncompte" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Current Level */}
              <FormField
                control={form.control}
                name="current_level"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Où en es-tu aujourd'hui sur TikTok ? *</FormLabel>
                    <FormControl>
                      <RadioGroup
                        onValueChange={field.onChange}
                        value={field.value}
                        className="space-y-3 mt-2"
                      >
                        {levels.map((level) => (
                          <div key={level.value} className="flex items-center space-x-3">
                            <RadioGroupItem value={level.value} id={level.value} />
                            <Label htmlFor={level.value} className="font-normal cursor-pointer">
                              {level.label}
                            </Label>
                          </div>
                        ))}
                      </RadioGroup>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="blockers"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Quels sont tes principaux points de blocage ? *</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Ex : manque de régularité, pas de vues, pas de conversions, je ne sais pas quoi poster..."
                        rows={4}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="goals"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Quels sont tes objectifs avec cet accompagnement ? *</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Ex : gagner en visibilité, convertir mon audience en clients, construire une stratégie claire..."
                        rows={4}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Revenue fields */}
              <div className="grid sm:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="current_revenue"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Quel est ton CA mensuel actuel ? *</FormLabel>
                      <FormControl>
                        <Input placeholder="Ex : 2000€/mois, 0€, etc." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="revenue_goal"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Quel est ton objectif de CA mensuel d'ici 6 mois ? *</FormLabel>
                      <FormControl>
                        <Input placeholder="Ex : 5000€/mois" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Attribution fields */}
              <div className="bg-accent/50 border border-border rounded-xl p-6 space-y-5">
                <p className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">Pour mieux te connaître</p>
                <FormField
                  control={form.control}
                  name="origin_source"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Comment m'as-tu découvert ?</FormLabel>
                      <FormControl>
                        <Input placeholder="Ex : TikTok, bouche-à-oreille, Google..." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="follower_since"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Depuis combien de temps me suis-tu ?</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Sélectionne une durée" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {followerSinceOptions.map((opt) => (
                            <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="conversion_trigger"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Quel contenu t'a décidé aujourd'hui ?</FormLabel>
                      <FormControl>
                        <Input placeholder="Ex : une vidéo, un témoignage, l'analyse express..." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <Button
                type="submit"
                variant="hero"
                size="xl"
                className="w-full"
                disabled={isSubmitting}
              >
                {isSubmitting ? "Envoi en cours..." : "Envoyer ma candidature"}
                {!isSubmitting && <ArrowRight className="ml-2 h-5 w-5" />}
              </Button>
            </form>
          </Form>
        </div>
      </Section>
    </Layout>
  );
}
