import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Link } from "react-router-dom";
import { Loader2, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { trackPostHogEvent } from "@/lib/posthog";

const schema = z.object({
  first_name: z.string().trim().min(1, "Prénom requis"),
  last_name: z.string().trim().min(1, "Nom requis"),
  email: z.string().trim().email("Email invalide"),
  whatsapp: z
    .string()
    .trim()
    .min(6, "Numéro WhatsApp requis (avec indicatif pays)")
    .regex(/^[+0-9\s().-]+$/, "Numéro invalide"),
  billing_address_line1: z.string().trim().min(1, "Adresse requise"),
  billing_address_line2: z.string().trim().optional().or(z.literal("")),
  billing_postal_code: z.string().trim().min(1, "Code postal requis"),
  billing_city: z.string().trim().min(1, "Ville requise"),
  billing_country: z.string().trim().min(1, "Pays requis"),
  consent_cgv: z.literal(true, {
    errorMap: () => ({ message: "Vous devez accepter les CGV" }),
  }),
  consent_renonciation: z.literal(true, {
    errorMap: () => ({
      message:
        "Vous devez renoncer expressément au droit de rétractation pour accéder à la prestation",
    }),
  }),
  consent_rgpd: z.literal(true, {
    errorMap: () => ({
      message: "Vous devez consentir au traitement de vos données personnelles",
    }),
  }),
});

export type CheckoutFormValues = z.infer<typeof schema>;

interface CheckoutFormProps {
  productType: "one_shot" | "wav_premium";
  invitationToken?: string;
  prefill?: {
    email?: string | null;
    first_name?: string | null;
    last_name?: string | null;
  };
  amountCents?: number | null;
  currency?: string;
  productLabel: string;
}

function getPosthogId(): string | null {
  try {
    const ph = (window as unknown as { posthog?: { get_distinct_id?: () => string } }).posthog;
    return ph?.get_distinct_id?.() ?? null;
  } catch {
    return null;
  }
}

export function CheckoutForm({
  productType,
  invitationToken,
  prefill,
  amountCents,
  currency = "EUR",
  productLabel,
}: CheckoutFormProps) {
  const [loading, setLoading] = useState(false);

  const form = useForm<CheckoutFormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      first_name: prefill?.first_name ?? "",
      last_name: prefill?.last_name ?? "",
      email: prefill?.email ?? "",
      whatsapp: "",
      billing_address_line1: "",
      billing_address_line2: "",
      billing_postal_code: "",
      billing_city: "",
      billing_country: "France",
      consent_cgv: false as unknown as true,
      consent_renonciation: false as unknown as true,
      consent_rgpd: false as unknown as true,
    },
  });

  const onSubmit = async (values: CheckoutFormValues) => {
    setLoading(true);
    try {
      trackPostHogEvent("checkout_submit", { product_type: productType });

      const { data, error } = await supabase.functions.invoke("create-sales-order", {
        body: {
          product_type: productType,
          invitation_token: invitationToken,
          first_name: values.first_name,
          last_name: values.last_name,
          email: values.email,
          whatsapp: values.whatsapp,
          billing_address_line1: values.billing_address_line1,
          billing_address_line2: values.billing_address_line2 || null,
          billing_postal_code: values.billing_postal_code,
          billing_city: values.billing_city,
          billing_country: values.billing_country,
          consent_cgv: true,
          consent_renonciation: true,
          consent_rgpd: true,
          posthog_id: getPosthogId(),
        },
      });

      if (error) throw new Error(error.message);
      const url = (data as { url?: string } | null)?.url;
      if (!url) throw new Error("Lien de paiement indisponible");

      window.location.href = url;
    } catch (err) {
      console.error("[checkout] error:", err);
      const msg = err instanceof Error ? err.message : "Erreur inconnue";
      toast.error(msg);
      setLoading(false);
    }
  };

  const priceLabel =
    typeof amountCents === "number" && amountCents > 0
      ? new Intl.NumberFormat("fr-FR", { style: "currency", currency }).format(amountCents / 100)
      : null;

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Identity */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="first_name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Prénom *</FormLabel>
                <FormControl>
                  <Input placeholder="Fred" autoComplete="given-name" {...field} />
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
                  <Input placeholder="Wav" autoComplete="family-name" {...field} />
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
                <Input
                  type="email"
                  placeholder="vous@exemple.com"
                  autoComplete="email"
                  {...field}
                />
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
              <FormLabel>Numéro WhatsApp (avec indicatif pays) *</FormLabel>
              <FormControl>
                <Input
                  type="tel"
                  inputMode="tel"
                  placeholder="+33 6 12 34 56 78"
                  autoComplete="tel"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Billing address */}
        <div className="space-y-4 pt-4 border-t border-border/60">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
            Adresse de facturation
          </h3>

          <FormField
            control={form.control}
            name="billing_address_line1"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Adresse *</FormLabel>
                <FormControl>
                  <Input
                    placeholder="12 rue de la République"
                    autoComplete="address-line1"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="billing_address_line2"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Complément (optionnel)</FormLabel>
                <FormControl>
                  <Input
                    placeholder="Bât. A, appartement 4"
                    autoComplete="address-line2"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <FormField
              control={form.control}
              name="billing_postal_code"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Code postal *</FormLabel>
                  <FormControl>
                    <Input placeholder="75000" autoComplete="postal-code" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="billing_city"
              render={({ field }) => (
                <FormItem className="md:col-span-2">
                  <FormLabel>Ville *</FormLabel>
                  <FormControl>
                    <Input placeholder="Paris" autoComplete="address-level2" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="billing_country"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Pays *</FormLabel>
                <FormControl>
                  <Input placeholder="France" autoComplete="country-name" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Consents */}
        <div className="space-y-3 pt-4 border-t border-border/60">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
            Consentements
          </h3>

          <FormField
            control={form.control}
            name="consent_cgv"
            render={({ field }) => (
              <FormItem className="flex items-start gap-3 space-y-0">
                <FormControl>
                  <Checkbox
                    checked={field.value as unknown as boolean}
                    onCheckedChange={(c) => field.onChange(c === true)}
                  />
                </FormControl>
                <div className="space-y-1">
                  <FormLabel className="text-sm font-normal leading-snug cursor-pointer">
                    J'ai lu et j'accepte les{" "}
                    <Link to="/cgv" target="_blank" className="text-primary underline">
                      Conditions Générales de Vente
                    </Link>
                    . *
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
                    checked={field.value as unknown as boolean}
                    onCheckedChange={(c) => field.onChange(c === true)}
                  />
                </FormControl>
                <div className="space-y-1">
                  <FormLabel className="text-sm font-normal leading-snug cursor-pointer">
                    Conformément à l'article L221-28 du Code de la consommation, je demande
                    expressément l'exécution immédiate de la prestation avant la fin du délai
                    légal de rétractation de 14 jours et je reconnais perdre mon droit de
                    rétractation dès le démarrage de l'accompagnement. *
                  </FormLabel>
                  <FormMessage className="mt-1" />
                </div>
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="consent_rgpd"
            render={({ field }) => (
              <FormItem className="flex items-start gap-3 space-y-0">
                <FormControl>
                  <Checkbox
                    checked={field.value as unknown as boolean}
                    onCheckedChange={(c) => field.onChange(c === true)}
                  />
                </FormControl>
                <div className="space-y-1">
                  <FormLabel className="text-sm font-normal leading-snug cursor-pointer">
                    J'accepte que mes données personnelles (identité, contact, adresse de
                    facturation) soient traitées par Fred Wav (Frédéric Olalde, EI) aux fins de
                    facturation, suivi commercial et obligations légales, dans les conditions
                    prévues par la{" "}
                    <Link
                      to="/politique-de-confidentialite"
                      target="_blank"
                      className="text-primary underline"
                    >
                      Politique de confidentialité
                    </Link>
                    . *
                  </FormLabel>
                  <FormMessage className="mt-1" />
                </div>
              </FormItem>
            )}
          />
        </div>

        {/* Summary + submit */}
        <div className="pt-4 border-t border-border/60 space-y-4">
          {priceLabel && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">{productLabel}</span>
              <span className="font-semibold text-foreground">{priceLabel}</span>
            </div>
          )}
          <Button type="submit" disabled={loading} className="w-full" size="lg">
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Redirection vers Stripe…
              </>
            ) : (
              <>
                <ShieldCheck className="mr-2 h-4 w-4" />
                Procéder au paiement sécurisé
              </>
            )}
          </Button>
          <p className="text-xs text-muted-foreground text-center">
            Paiement traité par Stripe. Vos coordonnées bancaires ne transitent jamais par nos
            serveurs.
          </p>
        </div>
      </form>
    </Form>
  );
}
