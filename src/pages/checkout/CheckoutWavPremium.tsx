import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import {
  CheckCircle2,
  ShieldCheck,
  Crown,
  AlertTriangle,
  Loader2,
} from "lucide-react";
import { Layout } from "@/components/layout/Layout";
import { Section, SectionHeader } from "@/components/ui/section";
import { SEOHead } from "@/components/SEOHead";
import { CheckoutForm } from "@/components/checkout/CheckoutForm";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { trackPostHogEvent } from "@/lib/posthog";

const benefits = [
  "Accompagnement individuel intensif sur 45 jours",
  "4 sessions visio minimum + suivi WhatsApp 5j/7",
  "Audit Stratégique Initial inclus",
  "Ressources personnalisées",
];

type TokenState =
  | { status: "loading" }
  | {
      status: "valid";
      amount_cents: number | null;
      currency: string;
      expires_at: string;
      prefill: { email?: string | null; first_name?: string | null; last_name?: string | null };
    }
  | { status: "invalid"; reason: "not_found" | "expired" | "used" | "missing" };

export default function CheckoutWavPremium() {
  const [params] = useSearchParams();
  const token = params.get("token")?.trim() || "";
  const cancelled = params.get("cancelled") === "1";
  const [state, setState] = useState<TokenState>({ status: "loading" });

  useEffect(() => {
    trackPostHogEvent("checkout_view", { product_type: "wav_premium" });
  }, []);

  useEffect(() => {
    if (cancelled) toast.info("Paiement annulé. Tu peux relancer la commande quand tu veux.");
  }, [cancelled]);

  useEffect(() => {
    let cancel = false;
    async function run() {
      if (!token) {
        setState({ status: "invalid", reason: "missing" });
        return;
      }
      try {
        const { data, error } = await supabase.functions.invoke("validate-invitation-token", {
          body: { token },
        });
        if (cancel) return;
        if (error) throw error;
        const body = data as {
          valid?: boolean;
          reason?: string;
          amount_cents?: number | null;
          currency?: string;
          expires_at?: string;
          prefill?: { email?: string | null; first_name?: string | null; last_name?: string | null };
        } | null;

        if (body?.valid === true) {
          setState({
            status: "valid",
            amount_cents: body.amount_cents ?? null,
            currency: body.currency ?? "EUR",
            expires_at: body.expires_at ?? "",
            prefill: body.prefill ?? {},
          });
        } else {
          const reason: "not_found" | "expired" | "used" =
            body?.reason === "expired" || body?.reason === "used" ? body.reason : "not_found";
          setState({ status: "invalid", reason });
        }
      } catch (err) {
        console.error("[checkout/wav-premium] token validation error:", err);
        if (!cancel) setState({ status: "invalid", reason: "not_found" });
      }
    }
    run();
    return () => {
      cancel = true;
    };
  }, [token]);

  return (
    <Layout>
      <SEOHead
        title="Commande Wav Premium | Fred Wav"
        description="Finalisation de l'accompagnement Wav Premium 45 jours. Accès par invitation uniquement."
        path="/checkout/wav-premium"
        noindex
      />
      <Section variant="default" size="lg">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-10">
            <span className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-primary mb-3">
              <Crown className="h-4 w-4" />
              Wav Premium · 45 jours
            </span>
            <SectionHeader
              title="Finalise ton accompagnement"
              subtitle="Accès par invitation. Quelques informations pour la facturation, puis paiement sécurisé via Stripe."
            />
          </div>

          {state.status === "loading" && (
            <div className="flex items-center justify-center py-16 text-muted-foreground">
              <Loader2 className="h-6 w-6 animate-spin mr-3" />
              Vérification de ton lien d'invitation…
            </div>
          )}

          {state.status === "invalid" && (
            <div className="bg-card border border-destructive/30 rounded-2xl p-8 text-center">
              <AlertTriangle className="h-10 w-10 text-destructive mx-auto mb-4" />
              <h3 className="font-display text-xl font-semibold mb-2">
                {state.reason === "expired" && "Lien expiré"}
                {state.reason === "used" && "Lien déjà utilisé"}
                {state.reason === "not_found" && "Lien invalide"}
                {state.reason === "missing" && "Lien d'invitation requis"}
              </h3>
              <p className="text-muted-foreground text-sm max-w-md mx-auto">
                {state.reason === "missing"
                  ? "L'accès à cette page se fait uniquement via un lien d'invitation envoyé par Fred Wav après validation de ta candidature."
                  : state.reason === "expired"
                  ? "Ce lien a expiré. Contacte Fred Wav pour qu'il t'en renvoie un nouveau."
                  : state.reason === "used"
                  ? "Ce lien a déjà servi à finaliser une commande."
                  : "Ce lien n'est pas reconnu. Vérifie l'URL ou contacte Fred Wav."}
              </p>
            </div>
          )}

          {state.status === "valid" && (
            <div className="grid md:grid-cols-[1fr_280px] gap-8">
              <div className="bg-card border border-border rounded-2xl p-6 md:p-8">
                <CheckoutForm
                  productType="wav_premium"
                  invitationToken={token}
                  prefill={state.prefill}
                  amountCents={state.amount_cents}
                  currency={state.currency}
                  productLabel="Wav Premium · 45 jours"
                />
              </div>

              <aside className="space-y-6">
                <div className="bg-card border border-border rounded-2xl p-6">
                  <h3 className="font-display text-lg font-semibold mb-3">L'accompagnement</h3>
                  <ul className="space-y-2">
                    {benefits.map((b) => (
                      <li
                        key={b}
                        className="flex items-start gap-2 text-sm text-muted-foreground"
                      >
                        <CheckCircle2 className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                        <span>{b}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="bg-card border border-border rounded-2xl p-6">
                  <div className="flex items-center gap-2 mb-2">
                    <ShieldCheck className="h-4 w-4 text-primary" />
                    <h3 className="font-display text-sm font-semibold">Paiement sécurisé</h3>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Traitement par Stripe. Aucune donnée bancaire stockée chez nous. Une facture
                    conforme te sera envoyée par email après paiement.
                  </p>
                </div>
              </aside>
            </div>
          )}
        </div>
      </Section>
    </Layout>
  );
}
