import { useState, useEffect } from "react";
import { Link, useSearchParams, useNavigate } from "react-router-dom";
import { ArrowRight, Calendar, CheckCircle, Loader2, Mail, XCircle } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { trackEvent, getStoredUtmSource } from "@/lib/tracking";
import { trackPostHogEvent, getPostHogId } from "@/lib/posthog";
import { Layout } from "@/components/layout/Layout";
import { Section } from "@/components/ui/section";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

const formSchema = z.object({
  name: z.string().trim().min(1, "Le nom est obligatoire").max(100),
  email: z.string().trim().email("Email invalide").max(255),
  whatsapp: z.string().trim().min(1, "Le numéro WhatsApp est obligatoire").max(30),
  tiktok: z.string().trim().min(1, "Le compte TikTok est obligatoire").max(100),
  objectives: z.string().trim().min(1, "Merci de décrire tes objectifs").max(2000),
  origin_source: z.string().trim().max(500).optional().or(z.literal("")),
  conversion_trigger: z.string().trim().max(500).optional().or(z.literal("")),
});

type FormValues = z.infer<typeof formSchema>;

type VerifyState = "loading" | "verified" | "error";

export default function OneShotSuccess() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const paramSessionId = searchParams.get("session_id");
  const storedSessionId = localStorage.getItem("oneshot_session_id");
  const sessionId = paramSessionId || storedSessionId;

  const [verifyState, setVerifyState] = useState<VerifyState>("loading");
  const [step, setStep] = useState<1 | 2>(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { name: "", email: "", whatsapp: "", tiktok: "", objectives: "", origin_source: getStoredUtmSource(), conversion_trigger: "" },
  });

  useEffect(() => {
    if (!sessionId) {
      setVerifyState("error");
      return;
    }

    const verify = async () => {
      try {
        const { data, error } = await supabase.functions.invoke("verify-oneshot-payment", {
          body: { session_id: sessionId },
        });

        if (error || !data?.verified) {
          setVerifyState("error");
          return;
        }

        // Persist session_id so user can return after closing the tab
        localStorage.setItem("oneshot_session_id", sessionId);

        trackPostHogEvent("oneshot_payment_verified", { session_id: sessionId });
        if (data.customer_email) {
          form.setValue("email", data.customer_email);
        }
        // If form was already submitted, skip to step 2
        if (localStorage.getItem("oneshot_form_submitted") === "true") {
          setStep(2);
        }
        setVerifyState("verified");
      } catch {
        trackPostHogEvent("oneshot_payment_error", { session_id: sessionId || "" });
        setVerifyState("error");
      }
    };

    verify();
  }, [sessionId]);

  const onSubmit = async (values: FormValues) => {
    setIsSubmitting(true);
    trackEvent("oneshot_form_submit");
    try {
      const { error } = await supabase.functions.invoke("send-oneshot-form", {
        body: { ...values, session_id: sessionId, posthog_id: getPostHogId() },
      });
      if (error) throw error;
      localStorage.setItem("oneshot_form_submitted", "true");
      setStep(2);
    } catch (err) {
      console.error("Error submitting form:", err);
      toast({
        title: "Erreur",
        description: "Une erreur est survenue. Réessaie ou contacte-nous par email.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (verifyState === "loading") {
    return (
      <Layout>
        <Section variant="cream" size="lg">
          <div className="max-w-2xl mx-auto text-center">
            <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
            <p className="text-lg text-muted-foreground">Vérification du paiement en cours...</p>
          </div>
        </Section>
      </Layout>
    );
  }

  if (verifyState === "error") {
    return (
      <Layout>
        <Section variant="cream" size="lg">
          <div className="max-w-2xl mx-auto text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <XCircle className="h-8 w-8 text-red-600" />
            </div>
            <h1 className="font-display text-3xl md:text-4xl font-semibold tracking-tight mb-4">
              Paiement non vérifié
            </h1>
            <p className="text-lg text-muted-foreground mb-8">
              Nous n'avons pas pu vérifier ton paiement. Si tu penses qu'il s'agit d'une erreur, contacte-nous.
            </p>
            <Button variant="hero" size="lg" asChild>
              <Link to="/one-shot">Retour à l'offre One Shot</Link>
            </Button>
          </div>
        </Section>
      </Layout>
    );
  }

  return (
    <Layout>
      <Section variant="cream" size="lg">
        <div className="max-w-2xl mx-auto text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="h-8 w-8 text-green-600" />
          </div>

          <h1 className="font-display text-3xl md:text-4xl font-semibold tracking-tight mb-4">
            Paiement confirmé !
          </h1>

          {step === 1 ? (
            <>
              <p className="text-lg text-muted-foreground mb-8">
                Avant de réserver ton créneau, j'ai besoin de quelques infos pour préparer notre session.
              </p>

              <div className="text-left bg-background rounded-xl p-6 md:p-8 shadow-sm border">
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
                    <FormField control={form.control} name="name" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nom / Prénom</FormLabel>
                        <FormControl><Input placeholder="Jean Dupont" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={form.control} name="email" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl><Input type="email" placeholder="jean@exemple.com" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={form.control} name="whatsapp" render={({ field }) => (
                      <FormItem>
                        <FormLabel>WhatsApp</FormLabel>
                        <FormControl><Input placeholder="+33 6 12 34 56 78" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={form.control} name="tiktok" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Compte TikTok</FormLabel>
                        <FormControl><Input placeholder="@toncompte" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={form.control} name="objectives" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Objectifs / Situation actuelle</FormLabel>
                        <FormControl>
                          <Textarea placeholder="Décris ta situation actuelle et ce que tu aimerais atteindre..." className="min-h-[120px]" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />

                    {/* Attribution mini-form */}
                    <div className="border-t border-border pt-5 mt-5 space-y-4">
                      <p className="text-sm font-medium text-muted-foreground">Pour mieux te servir</p>
                      <FormField control={form.control} name="origin_source" render={({ field }) => (
                        <FormItem>
                          <FormLabel>Comment m'as-tu découvert ?</FormLabel>
                          <FormControl><Input placeholder="Ex : TikTok, bouche-à-oreille, Google..." {...field} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )} />
                      <FormField control={form.control} name="conversion_trigger" render={({ field }) => (
                        <FormItem>
                          <FormLabel>Qu'est-ce qui t'a convaincu de passer à l'action ?</FormLabel>
                          <FormControl><Input placeholder="Ex : une vidéo, un témoignage, l'analyse express..." {...field} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )} />
                    </div>

                    <Button type="submit" variant="hero" size="lg" className="w-full" disabled={isSubmitting}>
                      {isSubmitting ? (
                        <><Loader2 className="mr-2 h-5 w-5 animate-spin" />Envoi en cours...</>
                      ) : (
                        "Valider et accéder à la réservation"
                      )}
                    </Button>
                  </form>
                </Form>
              </div>
            </>
          ) : (
            <>
              <p className="text-lg text-muted-foreground mb-8">
                Merci pour ces infos ! Il ne te reste plus qu'à réserver ton créneau pour notre session.
              </p>
              <Button variant="hero" size="xl" asChild>
                <a href="https://calendly.com/fredwavcm/accompagnement-one-shot" target="_blank" rel="noopener noreferrer">
                  <Calendar className="mr-2 h-5 w-5" />
                  Réserver mon créneau
                </a>
              </Button>
              <div className="mt-8 p-6 bg-muted/50 rounded-xl text-left">
                <div className="flex items-start gap-3">
                  <Mail className="h-5 w-5 text-muted-foreground mt-0.5 shrink-0" />
                  <p className="text-muted-foreground text-sm">
                    Si les horaires proposés ne sont pas possibles pour toi, contacte-moi à{" "}
                    <a href="mailto:fredwavcm@gmail.com" className="text-primary font-medium hover:underline">fredwavcm@gmail.com</a>
                  </p>
                </div>
              </div>
              <div className="mt-8">
                <Button variant="ghost" onClick={() => {
                  localStorage.removeItem("oneshot_session_id");
                  localStorage.removeItem("oneshot_form_submitted");
                  navigate("/");
                }}>
                  J'ai réservé mon créneau<ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </>
          )}
        </div>
      </Section>
    </Layout>
  );
}
