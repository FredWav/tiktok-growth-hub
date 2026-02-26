import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Link } from "react-router-dom";
import { ArrowRight, CheckCircle2, AlertTriangle } from "lucide-react";
import { Layout } from "@/components/layout/Layout";
import { Section } from "@/components/ui/section";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { SEOHead } from "@/components/SEOHead";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
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

const applicationSchema = z.object({
  first_name: z.string().trim().min(1, "Prénom requis").max(100),
  last_name: z.string().trim().min(1, "Nom requis").max(100),
  email: z.string().trim().email("Email invalide").max(255),
  tiktok_username: z.string().trim().max(100).optional().or(z.literal("")),
  current_level: z.string().min(1, "Sélectionne ton niveau actuel"),
  blockers: z.string().trim().min(10, "Décris tes points de blocage (10 caractères min.)").max(2000),
  goals: z.string().trim().min(10, "Décris tes objectifs (10 caractères min.)").max(2000),
  budget_confirmed: z.boolean().refine((v) => v === true, {
    message: "Tu dois confirmer que ton budget est d'au moins 987€",
  }),
});

type ApplicationForm = z.infer<typeof applicationSchema>;

export default function WavPremiumApplication() {
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

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
      budget_confirmed: false,
    },
  });

  const onSubmit = async (data: ApplicationForm) => {
    setIsSubmitting(true);
    try {
      const { error } = await supabase
        .from("wav_premium_applications" as any)
        .insert({
          first_name: data.first_name,
          last_name: data.last_name,
          email: data.email,
          tiktok_username: data.tiktok_username || null,
          current_level: levels.find((l) => l.value === data.current_level)?.label ?? data.current_level,
          blockers: data.blockers,
          goals: data.goals,
          budget_confirmed: data.budget_confirmed,
        } as any);

      if (error) throw error;
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
          title="Candidature envoyée — Wav Premium | Fred Wav"
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
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
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

              {/* Budget notice */}
              <div className="bg-accent/50 border border-border rounded-xl p-6">
                <div className="flex items-start gap-3 mb-4">
                  <AlertTriangle className="h-5 w-5 text-primary mt-0.5 shrink-0" />
                  <div>
                    <p className="font-semibold mb-1">Information budget</p>
                    <p className="text-sm text-muted-foreground">
                      Le Wav Premium est un accompagnement intensif qui demande un investissement minimum de 987€.
                      Si ton budget est inférieur, je te recommande de commencer par un{" "}
                      <Link to="/one-shot" className="text-primary underline hover:no-underline">
                        One Shot (179€)
                      </Link>{" "}
                      pour poser les bases.
                    </p>
                  </div>
                </div>

                <FormField
                  control={form.control}
                  name="budget_confirmed"
                  render={({ field }) => (
                    <FormItem className="flex items-start space-x-3 space-y-0">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel className="font-normal cursor-pointer">
                          Je confirme que mon budget est d'au moins 987€ pour cet accompagnement *
                        </FormLabel>
                        <FormMessage />
                      </div>
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
