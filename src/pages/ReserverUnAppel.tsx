import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Link } from "react-router-dom";
import { ArrowRight, CheckCircle2, Mail, Clock } from "lucide-react";
import { trackEvent, getStoredUtmSource } from "@/lib/tracking";
import { trackPostHogEvent, identifyUser, getPostHogId } from "@/lib/posthog";
import { Layout } from "@/components/layout/Layout";
import { Section } from "@/components/ui/section";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
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

const blockerOptions = [
  { value: "no_results", label: "Je ne sais pas pourquoi je n'ai pas de résultats" },
  { value: "no_codes", label: "Je ne maîtrise pas les codes des formats courts" },
] as const;

const followerSinceOptions = [
  "Moins d'1 mois",
  "1-3 mois",
  "3-6 mois",
  "6+ mois",
  "Je ne te suivais pas",
] as const;

const contactSchema = z.object({
  first_name: z.string().trim().min(1, "Prénom requis").max(100),
  last_name: z.string().trim().min(1, "Nom requis").max(100),
  email: z.string().trim().email("Email invalide").max(255),
  tiktok_username: z.string().trim().max(100).optional().or(z.literal("")),
  current_level: z.string().min(1, "Sélectionne ton niveau actuel"),
  blockers: z.array(z.string()).min(1, "Sélectionne au moins un blocage"),
  goals: z.string().trim().min(10, "Décris tes objectifs (10 caractères min.)").max(2000),
  budget: z.string().min(1, "Sélectionne ton budget"),
  origin_source: z.string().trim().max(500).optional().or(z.literal("")),
  follower_since: z.string().optional().or(z.literal("")),
  conversion_trigger: z.string().trim().max(500).optional().or(z.literal("")),
});

type ContactForm = z.infer<typeof contactSchema>;

export default function ReserverUnAppel() {
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formStarted, setFormStarted] = useState(false);

  const form = useForm<ContactForm>({
    resolver: zodResolver(contactSchema),
    defaultValues: {
      first_name: "",
      last_name: "",
      email: "",
      tiktok_username: "",
      current_level: "",
      blockers: [],
      goals: "",
      budget: "",
      origin_source: getStoredUtmSource(),
      follower_since: "",
      conversion_trigger: "",
    },
  });

  const handleFormFocus = () => {
    if (!formStarted) {
      setFormStarted(true);
      trackPostHogEvent("reserverunappel_form_start");
    }
  };

  const onSubmit = async (data: ContactForm) => {
    setIsSubmitting(true);
    trackEvent("reserverunappel_submit", { level: data.current_level });
    identifyUser(data.email, { first_name: data.first_name, last_name: data.last_name });
    try {
      const blockersText = data.blockers
        .map((v) => blockerOptions.find((o) => o.value === v)?.label ?? v)
        .join(" • ");

      // Full payload sent to the notification (email + Discord) — always includes budget
      const notifyPayload = {
        first_name: data.first_name,
        last_name: data.last_name,
        email: data.email,
        tiktok_username: data.tiktok_username || null,
        current_level: levels.find((l) => l.value === data.current_level)?.label ?? data.current_level,
        blockers: blockersText,
        goals: data.goals,
        budget: data.budget || null,
        origin_source: data.origin_source || null,
        follower_since: data.follower_since || null,
        conversion_trigger: data.conversion_trigger || null,
        posthog_id: getPostHogId(),
      };

      // Fire notification FIRST so the lead is always captured (email to admin + Discord),
      // even if the DB insert fails for any reason.
      const notifyPromise = supabase.functions.invoke("notify-application", {
        body: notifyPayload,
      });

      // DB payload: excludes `budget` until the add-budget-column migration is applied
      // in production. Once applied, `budget` can be re-added here.
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { budget: _budget, ...dbPayload } = notifyPayload;

      const { error: dbError } = await supabase
        .from("wav_premium_applications")
        .insert(dbPayload);

      await notifyPromise.catch((err) => console.error("Notification error:", err));

      if (dbError) {
        // The admin was still notified (email + Discord), so the lead isn't lost.
        // Log for diagnostics but treat the submission as a success from the user's POV.
        console.error("DB insert error (non-blocking):", dbError);
      }

      setSubmitted(true);
    } catch (err) {
      console.error("Submission error:", err);
      toast.error("Une erreur est survenue. Réessaie ou contacte-nous directement.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <Layout>
        <SEOHead
          title="Demande envoyée - Réserver un appel | Fred Wav"
          description="Ta demande a bien été envoyée. Fred te recontacte par email sous 48h jours ouvrés."
          path="/reserverunappel"
        />
        <Section variant="cream" size="lg">
          <div className="max-w-xl mx-auto text-center">
            <CheckCircle2 className="h-16 w-16 text-primary mx-auto mb-6" />
            <h2 className="font-display text-3xl md:text-4xl font-semibold mb-4">
              Demande envoyée !
            </h2>
            <p className="text-lg text-muted-foreground mb-8">
              Merci pour ta demande. Je l'ai bien reçue et je prends le temps de la lire en détail.
            </p>

            <div className="bg-background border border-primary/20 rounded-2xl p-6 mb-8 text-left">
              <div className="flex items-start gap-4 mb-4">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Mail className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="font-semibold text-foreground mb-1">Je te recontacte par email</p>
                  <p className="text-sm text-muted-foreground">
                    Sous <strong>48h (jours ouvrés)</strong> à l'adresse que tu viens de me communiquer.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Clock className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="font-semibold text-foreground mb-1">En attendant</p>
                  <p className="text-sm text-muted-foreground">
                    Vérifie tes spams au cas où, et prépare tes questions. On fera le point ensemble par écrit avant d'éventuellement caler un échange.
                  </p>
                </div>
              </div>
            </div>

            <Button variant="outline" size="lg" asChild>
              <Link to="/" onClick={() => trackPostHogEvent("click_home_post_contact")}>
                ← Retour à l'accueil
              </Link>
            </Button>
          </div>
        </Section>
      </Layout>
    );
  }

  return (
    <Layout>
      <SEOHead
        title="Réserver un appel | Fred Wav"
        description="Premier contact avec Fred Wav : remplis le formulaire pour qu'on puisse échanger par écrit avant un éventuel appel."
        path="/reserverunappel"
        keywords="réserver un appel, contact fred wav, premier contact tiktok, coaching formats courts"
      />
      <Section variant="cream" size="lg">
        <div className="max-w-2xl mx-auto text-center mb-10">
          <h1 className="font-display text-3xl md:text-4xl font-semibold tracking-tight mb-4">
            Réserver un <span className="text-gold-gradient">appel</span>
          </h1>
          <p className="text-muted-foreground text-lg">
            C'est notre premier contact. Plus j'ai d'infos sur ta situation, plus je peux répondre efficacement à ta demande.
          </p>
        </div>
      </Section>

      <Section variant="default" size="lg">
        <div className="max-w-2xl mx-auto">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit, (errors) => trackPostHogEvent("reserverunappel_form_error", { fields: Object.keys(errors).join(",") }))} onFocus={handleFormFocus} className="space-y-8">
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

              {/* Blockers — multi-select */}
              <FormField
                control={form.control}
                name="blockers"
                render={() => (
                  <FormItem>
                    <FormLabel>Quels sont tes principaux points de blocage ? *</FormLabel>
                    <div className="space-y-3 mt-2">
                      {blockerOptions.map((opt) => (
                        <FormField
                          key={opt.value}
                          control={form.control}
                          name="blockers"
                          render={({ field }) => (
                            <FormItem className="flex items-center space-x-3 space-y-0">
                              <FormControl>
                                <Checkbox
                                  checked={field.value?.includes(opt.value)}
                                  onCheckedChange={(checked) => {
                                    const current = field.value || [];
                                    if (checked) {
                                      field.onChange([...current, opt.value]);
                                    } else {
                                      field.onChange(current.filter((v: string) => v !== opt.value));
                                    }
                                  }}
                                  id={`blocker-${opt.value}`}
                                />
                              </FormControl>
                              <Label
                                htmlFor={`blocker-${opt.value}`}
                                className="font-normal cursor-pointer"
                              >
                                {opt.label}
                              </Label>
                            </FormItem>
                          )}
                        />
                      ))}
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="goals"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Quels sont tes objectifs ? *</FormLabel>
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

              {/* Budget field */}
              <FormField
                control={form.control}
                name="budget"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Quel est ton budget pour un accompagnement ? *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Sélectionne ton budget" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="moins_de_299">- de 299€</SelectItem>
                        <SelectItem value="300_a_800">De 300 à 800€</SelectItem>
                        <SelectItem value="plus_de_1000">+ de 1000€</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

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
                {isSubmitting ? "Envoi en cours..." : "Envoyer ma demande"}
                {!isSubmitting && <ArrowRight className="ml-2 h-5 w-5" />}
              </Button>
            </form>
          </Form>
        </div>
      </Section>
    </Layout>
  );
}
