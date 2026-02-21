import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Calendar, CheckCircle, Loader2, Mail } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
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
});

type FormValues = z.infer<typeof formSchema>;

export default function OneShotSuccess() {
  const [step, setStep] = useState<1 | 2>(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { name: "", email: "", whatsapp: "", tiktok: "", objectives: "" },
  });

  const onSubmit = async (values: FormValues) => {
    setIsSubmitting(true);
    try {
      const { data, error } = await supabase.functions.invoke("send-oneshot-form", {
        body: values,
      });

      if (error) throw error;

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
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nom / Prénom</FormLabel>
                          <FormControl>
                            <Input placeholder="Jean Dupont" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email</FormLabel>
                          <FormControl>
                            <Input type="email" placeholder="jean@exemple.com" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="whatsapp"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>WhatsApp</FormLabel>
                          <FormControl>
                            <Input placeholder="+33 6 12 34 56 78" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="tiktok"
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

                    <FormField
                      control={form.control}
                      name="objectives"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Objectifs / Situation actuelle</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Décris ta situation actuelle et ce que tu aimerais atteindre..."
                              className="min-h-[120px]"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <Button type="submit" variant="hero" size="lg" className="w-full" disabled={isSubmitting}>
                      {isSubmitting ? (
                        <>
                          <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                          Envoi en cours...
                        </>
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
                <a
                  href="https://calendly.com/fredwavcm/accompagnement-one-shot"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Calendar className="mr-2 h-5 w-5" />
                  Réserver mon créneau
                </a>
              </Button>

              <div className="mt-8 p-6 bg-muted/50 rounded-xl text-left">
                <div className="flex items-start gap-3">
                  <Mail className="h-5 w-5 text-muted-foreground mt-0.5 shrink-0" />
                  <p className="text-muted-foreground text-sm">
                    Si les horaires proposés ne sont pas possibles pour toi, contacte-moi à{" "}
                    <a
                      href="mailto:fredwavcm@gmail.com"
                      className="text-primary font-medium hover:underline"
                    >
                      fredwavcm@gmail.com
                    </a>
                  </p>
                </div>
              </div>

              <div className="mt-8">
                <Button variant="ghost" asChild>
                  <Link to="/">
                    Retour à l'accueil
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </>
          )}
        </div>
      </Section>
    </Layout>
  );
}
