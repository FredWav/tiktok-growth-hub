import { useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { CheckCircle2, Mail } from "lucide-react";
import { Layout } from "@/components/layout/Layout";
import { Section } from "@/components/ui/section";
import { SEOHead } from "@/components/SEOHead";
import { Button } from "@/components/ui/button";
import { trackPostHogEvent } from "@/lib/posthog";

export default function CheckoutSuccess() {
  const [params] = useSearchParams();
  const orderId = params.get("order_id");
  const sessionId = params.get("session_id");

  useEffect(() => {
    trackPostHogEvent("checkout_success", {
      order_id: orderId,
      session_id: sessionId,
    });
  }, [orderId, sessionId]);

  return (
    <Layout>
      <SEOHead
        title="Commande confirmée | Fred Wav"
        description="Merci pour ton achat. Tu vas recevoir une confirmation par email."
        path="/checkout/success"
        noindex
      />
      <Section variant="default" size="lg">
        <div className="max-w-xl mx-auto text-center">
          <CheckCircle2 className="h-16 w-16 text-primary mx-auto mb-6" />
          <h1 className="font-display text-3xl md:text-4xl font-semibold tracking-tight mb-4">
            Paiement confirmé
          </h1>
          <p className="text-muted-foreground text-lg mb-8">
            Merci pour ta confiance. Ta commande est enregistrée et une confirmation t'a été
            envoyée par email (support durable conformément aux CGV).
          </p>

          <div className="bg-card border border-border rounded-2xl p-6 mb-8 text-left space-y-3">
            <div className="flex items-start gap-3">
              <Mail className="h-5 w-5 text-primary shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold text-sm mb-1">Prochaines étapes</h3>
                <p className="text-sm text-muted-foreground">
                  Tu vas recevoir un email récapitulatif avec ta facture et, pour les
                  accompagnements, un lien pour planifier ton premier rendez-vous. Si tu n'as
                  rien reçu sous 30 minutes, vérifie tes spams puis contacte-nous.
                </p>
              </div>
            </div>
          </div>

          {orderId && (
            <p className="text-xs text-muted-foreground mb-6">
              Référence commande : <span className="font-mono">{orderId.slice(0, 8)}</span>
            </p>
          )}

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button asChild variant="default">
              <Link to="/">Retour à l'accueil</Link>
            </Button>
            <Button asChild variant="outline">
              <Link to="/contact">Nous contacter</Link>
            </Button>
          </div>
        </div>
      </Section>
    </Layout>
  );
}
