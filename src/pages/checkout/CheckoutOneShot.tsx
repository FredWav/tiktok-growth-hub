import { useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { Target, CheckCircle2, ShieldCheck } from "lucide-react";
import { Layout } from "@/components/layout/Layout";
import { Section, SectionHeader } from "@/components/ui/section";
import { SEOHead } from "@/components/SEOHead";
import { CheckoutForm } from "@/components/checkout/CheckoutForm";
import { trackPostHogEvent } from "@/lib/posthog";
import { toast } from "sonner";

const benefits = [
  "Diagnostic stratégique direct, sans détour",
  "Repositionnement immédiat de ton compte",
  "Plan d'action court terme",
  "Rapport écrit récapitulatif",
];

export default function CheckoutOneShot() {
  const [params] = useSearchParams();
  const cancelled = params.get("cancelled") === "1";

  useEffect(() => {
    trackPostHogEvent("checkout_view", { product_type: "one_shot" });
  }, []);

  useEffect(() => {
    if (cancelled) {
      toast.info("Paiement annulé. Tu peux relancer la commande quand tu veux.");
    }
  }, [cancelled]);

  return (
    <Layout>
      <SEOHead
        title="Commande One Shot stratégique | Fred Wav"
        description="Session One Shot : diagnostic, repositionnement immédiat, plan d'action court terme. Paiement sécurisé Stripe."
        path="/checkout/one-shot"
        noindex
      />
      <Section variant="default" size="lg">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-10">
            <span className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-primary mb-3">
              <Target className="h-4 w-4" />
              One Shot stratégique
            </span>
            <SectionHeader
              title="Finalise ta commande"
              subtitle="Quelques informations pour la facturation, puis paiement sécurisé via Stripe."
            />
          </div>

          <div className="grid md:grid-cols-[1fr_280px] gap-8 mt-10">
            {/* Form */}
            <div className="bg-card border border-border rounded-2xl p-6 md:p-8">
              <CheckoutForm productType="one_shot" productLabel="One Shot stratégique" />
            </div>

            {/* Sidebar : récap produit */}
            <aside className="space-y-6">
              <div className="bg-card border border-border rounded-2xl p-6">
                <h3 className="font-display text-lg font-semibold mb-3">
                  Ce que tu obtiens
                </h3>
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
        </div>
      </Section>
    </Layout>
  );
}
