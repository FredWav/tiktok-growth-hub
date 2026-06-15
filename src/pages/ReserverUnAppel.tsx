import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Link } from "react-router-dom";
import { ArrowRight, CheckCircle2, Mail, Clock, Sparkles } from "lucide-react";
import { trackEvent, getStoredUtmSource } from "@/lib/tracking";
import { trackPostHogEvent, identifyUser, getPostHogId } from "@/lib/posthog";
import { cn } from "@/lib/utils";
import { Layout } from "@/components/layout/Layout";
import { Section, SectionHeader } from "@/components/ui/section";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { SEOHead } from "@/components/SEOHead";
import { ClientResults } from "@/components/ClientResults";
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

const profilOptions = [
  { value: "createur", label: "Créateur / créatrice : TikTok est mon média, je veux développer mon audience et mon contenu" },
  { value: "entrepreneur", label: "Entrepreneur(e) / indépendant(e) : TikTok est un canal pour faire connaître mon activité, mes produits ou mes services" },
  { value: "les_deux", label: "Les deux à la fois : je crée du contenu ET j'ai une activité à développer derrière" },
] as const;

const motivationOptions = [
  { value: "comprendre_codes", label: "Comprendre enfin ce qui fait qu'une vidéo fonctionne, et le reproduire" },
  { value: "audience_qualifiee", label: "Construire une audience fidèle et vraiment qualifiée" },
  { value: "clients_prospects", label: "Attirer des clients ou des prospects pour mon activité" },
  { value: "credibilite_marque", label: "Asseoir ma crédibilité et ma marque sur mon sujet" },
  { value: "revenus_monetisation", label: "Générer des revenus directement grâce à mes vues et à la monétisation TikTok" },
] as const;

const accompagnementOptions = [
  { value: "suivi_proche", label: "J'ai besoin de quelqu'un qui suit mon compte de près, me corrige et reste dispo quand je bloque" },
  { value: "autonome_communaute", label: "J'avance bien seul si j'ai les bons repères, une méthode claire et une communauté pour poser mes questions" },
  { value: "a_discuter", label: "Je ne sais pas encore, j'aimerais qu'on en parle pendant l'appel" },
] as const;

const critereOptions = [
  { value: "suivi_perso", label: "Être suivi personnellement, pas un programme générique enregistré une fois pour toutes" },
  { value: "reactivite", label: "Pouvoir poser mes questions au moment où je bloque, pas attendre" },
  { value: "regard_sur_mon_compte", label: "Quelqu'un qui regarde vraiment MON compte, ma niche, mes vidéos" },
  { value: "methode_structuree", label: "Une méthode structurée que je peux appliquer à mon rythme" },
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
  profil: z.string().min(1, "Sélectionne ton profil"),
  motivation: z.string().min(1, "Sélectionne ce que tu attends de TikTok"),
  accompagnement_type: z.string().min(1, "Sélectionne comment tu veux être accompagné"),
  accompagnement_critere: z.string().optional().or(z.literal("")),
  declencheur: z.string().trim().min(10, "Décris ce qui t'amène (10 caractères min.)").max(2000),
  budget: z.string().min(1, "Sélectionne ton budget"),
  origin_source: z.string().trim().max(500).optional().or(z.literal("")),
  follower_since: z.string().optional().or(z.literal("")),
  conversion_trigger: z.string().trim().max(500).optional().or(z.literal("")),
});

type ContactForm = z.infer<typeof contactSchema>;

export default function ReserverUnAppel() {
  const [submitted, setSubmitted] = useState(false);
  const [redirectToAcademy, setRedirectToAcademy] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formStarted, setFormStarted] = useState(false);

  const form = useForm<ContactForm>({
    resolver: zodResolver(contactSchema),
    defaultValues: {
      first_name: "",
      last_name: "",
      email: "",
      tiktok_username: "",
      profil: "",
      motivation: "",
      accompagnement_type: "",
      accompagnement_critere: "",
      declencheur: "",
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
    // Budget trop bas pour un accompagnement personnalisé : on redirige vers Wav Academy.
    if (data.budget === "10_a_100") {
      trackPostHogEvent("reserverunappel_redirect_academy", { budget: data.budget });
      identifyUser(data.email, { first_name: data.first_name, last_name: data.last_name });
      setRedirectToAcademy(true);
      return;
    }

    setIsSubmitting(true);
    trackEvent("reserverunappel_submit", { profil: data.profil });
    identifyUser(data.email, { first_name: data.first_name, last_name: data.last_name });
    try {
      // Full payload sent to the notification (email + Discord) — always includes budget.
      // Single-choice answers are stored as readable labels so email/Discord/admin need no mapping.
      // Q5 (declencheur) reuses the existing `goals` column.
      const notifyPayload = {
        first_name: data.first_name,
        last_name: data.last_name,
        email: data.email,
        tiktok_username: data.tiktok_username || null,
        profil: profilOptions.find((o) => o.value === data.profil)?.label ?? data.profil,
        motivation: motivationOptions.find((o) => o.value === data.motivation)?.label ?? data.motivation,
        accompagnement_type: accompagnementOptions.find((o) => o.value === data.accompagnement_type)?.label ?? data.accompagnement_type,
        accompagnement_critere: data.accompagnement_critere
          ? (critereOptions.find((o) => o.value === data.accompagnement_critere)?.label ?? data.accompagnement_critere)
          : null,
        goals: data.declencheur,
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

      const { error: dbError } = await supabase
        .from("wav_premium_applications")
        .insert(notifyPayload);

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

  if (redirectToAcademy) {
    return (
      <Layout>
        <SEOHead
          title="La Wav Academy est faite pour toi | Fred Wav"
          description="Ton budget colle parfaitement avec la Wav Academy : la méthode complète et la communauté à partir de 299 € (paiement unique, accès 3 mois)."
          path="/reserverunappel"
        />
        <Section variant="cream" size="lg">
          <div className="max-w-xl mx-auto text-center">
            <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-6">
              <Sparkles className="h-8 w-8 text-primary" />
            </div>
            <h2 className="font-display text-3xl md:text-4xl font-semibold mb-4">
              La <span className="text-gold-gradient">Wav Academy</span> est faite pour toi.
            </h2>
            <p className="text-lg text-muted-foreground mb-4">
              Avec ton budget, un accompagnement personnalisé avec moi n'est pas la bonne option — ce serait te survendre quelque chose qui ne te correspond pas.
            </p>
            <p className="text-lg text-muted-foreground mb-8">
              Mais la <strong>Wav Academy</strong> te donne accès à toute ma méthode, au diagnostic continu et à la communauté à partir de <strong>299 €</strong> (paiement unique, accès 3 mois). C'est exactement ce qu'il te faut pour démarrer.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button variant="hero" size="xl" asChild>
                <Link
                  to="/wavacademy"
                  onClick={() => trackPostHogEvent("reserverunappel_click_academy_cta")}
                >
                  Découvrir Wav Academy
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button variant="outline" size="xl" asChild>
                <Link to="/" onClick={() => trackPostHogEvent("click_home_post_redirect_academy")}>
                  Retour à l'accueil
                </Link>
              </Button>
            </div>
          </div>
        </Section>
      </Layout>
    );
  }

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

      <Section variant="cream" size="md" className="pt-0">
        <SectionHeader
          title="Ils sont passés par là."
          subtitle="Des résultats documentés, pas des promesses."
        />
        <ClientResults limit={4} />
        <div className="text-center mt-8">
          <Button
            variant="premium"
            size="lg"
            asChild
            onClick={() => trackEvent("cta_more_testimonials", { location: "reserverunappel" })}
          >
            <Link to="/preuves">
              Plus de témoignages
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </Section>

      <Section variant="default" size="lg">
        <div className="max-w-2xl mx-auto">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit, (errors) => {
              const fields = Object.keys(errors);
              trackPostHogEvent("reserverunappel_form_error", { fields: fields.join(",") });
              toast.error("Vérifie les champs en rouge avant d'envoyer.");
              const first = fields[0] as keyof ContactForm | undefined;
              if (first) {
                try {
                  form.setFocus(first);
                } catch {
                  // RadioGroup/Select may not be focusable — fallback to scroll
                }
                requestAnimationFrame(() => {
                  const el = document.querySelector(`[name="${first}"]`) as HTMLElement | null;
                  (el ?? document.getElementById(`${first}-form-item`))?.scrollIntoView({ behavior: "smooth", block: "center" });
                });
              }
            })} onFocus={handleFormFocus} className="space-y-10 [&_label[for$='-form-item']]:text-lg [&_label[for$='-form-item']]:font-semibold [&_label[for$='-form-item']]:leading-snug">
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

              {/* Q1 — Profil */}
              <FormField
                control={form.control}
                name="profil"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tu te reconnais le plus dans quel profil ? *</FormLabel>
                    <FormControl>
                      <RadioGroup
                        onValueChange={field.onChange}
                        value={field.value}
                        className="space-y-3 mt-3"
                      >
                        {profilOptions.map((opt) => (
                          <Label
                            key={opt.value}
                            htmlFor={`profil-${opt.value}`}
                            className={cn(
                              "flex items-start gap-3 rounded-xl border p-4 cursor-pointer font-normal leading-snug transition-colors",
                              field.value === opt.value
                                ? "border-primary bg-primary/5"
                                : "border-border hover:bg-accent/50"
                            )}
                          >
                            <RadioGroupItem value={opt.value} id={`profil-${opt.value}`} className="mt-0.5" />
                            <span>{opt.label}</span>
                          </Label>
                        ))}
                      </RadioGroup>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Q2 — Motivation (détecteur) */}
              <FormField
                control={form.control}
                name="motivation"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Qu'est-ce que tu attends concrètement de ta présence sur TikTok ? *</FormLabel>
                    <FormControl>
                      <RadioGroup
                        onValueChange={field.onChange}
                        value={field.value}
                        className="space-y-3 mt-3"
                      >
                        {motivationOptions.map((opt) => (
                          <Label
                            key={opt.value}
                            htmlFor={`motivation-${opt.value}`}
                            className={cn(
                              "flex items-start gap-3 rounded-xl border p-4 cursor-pointer font-normal leading-snug transition-colors",
                              field.value === opt.value
                                ? "border-primary bg-primary/5"
                                : "border-border hover:bg-accent/50"
                            )}
                          >
                            <RadioGroupItem value={opt.value} id={`motivation-${opt.value}`} className="mt-0.5" />
                            <span>{opt.label}</span>
                          </Label>
                        ))}
                      </RadioGroup>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Q3 — Type d'accompagnement souhaité */}
              <FormField
                control={form.control}
                name="accompagnement_type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Comment tu aimerais être accompagné ? *</FormLabel>
                    <FormControl>
                      <RadioGroup
                        onValueChange={field.onChange}
                        value={field.value}
                        className="space-y-3 mt-3"
                      >
                        {accompagnementOptions.map((opt) => (
                          <Label
                            key={opt.value}
                            htmlFor={`accompagnement-${opt.value}`}
                            className={cn(
                              "flex items-start gap-3 rounded-xl border p-4 cursor-pointer font-normal leading-snug transition-colors",
                              field.value === opt.value
                                ? "border-primary bg-primary/5"
                                : "border-border hover:bg-accent/50"
                            )}
                          >
                            <RadioGroupItem value={opt.value} id={`accompagnement-${opt.value}`} className="mt-0.5" />
                            <span>{opt.label}</span>
                          </Label>
                        ))}
                      </RadioGroup>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Q4 — Ce qui compte dans un accompagnement (facultatif) */}
              <FormField
                control={form.control}
                name="accompagnement_critere"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Qu'est-ce qui compte le plus pour toi ?</FormLabel>
                    <FormControl>
                      <RadioGroup
                        onValueChange={field.onChange}
                        value={field.value}
                        className="space-y-3 mt-3"
                      >
                        {critereOptions.map((opt) => (
                          <Label
                            key={opt.value}
                            htmlFor={`critere-${opt.value}`}
                            className={cn(
                              "flex items-start gap-3 rounded-xl border p-4 cursor-pointer font-normal leading-snug transition-colors",
                              field.value === opt.value
                                ? "border-primary bg-primary/5"
                                : "border-border hover:bg-accent/50"
                            )}
                          >
                            <RadioGroupItem value={opt.value} id={`critere-${opt.value}`} className="mt-0.5" />
                            <span>{opt.label}</span>
                          </Label>
                        ))}
                      </RadioGroup>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Q5 — Le déclencheur (champ libre obligatoire, stocké dans la colonne `goals`) */}
              <FormField
                control={form.control}
                name="declencheur"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Qu'est-ce qui t'amène à réserver cet appel aujourd'hui ? *</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Ce qui te bloque, ce que tu as essayé, ce que tu vises… dis-le avec tes mots."
                        rows={5}
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
                        <SelectItem value="10_a_100">De 10€ à 100€</SelectItem>
                        <SelectItem value="100_a_300">De 100€ à 300€</SelectItem>
                        <SelectItem value="1000_plus">1000€ et +</SelectItem>
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
