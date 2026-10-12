import { useEffect } from "react";
import { Link } from "react-router-dom";
import { MailCheck } from "lucide-react";
import { SEOHead } from "@/components/SEOHead";
import { seoFor } from "@/config/seo";
import { Layout } from "@/components/layout/Layout";
import { Section } from "@/components/ui/section";
import { Button } from "@/components/ui/button";
import { FUNNEL_EVENTS, trackFunnelEvent } from "@/lib/funnel-events";

export default function AnalyseVideoMerci() {
  useEffect(() => {
    // Retour navigateur depuis Stripe : repère du funnel. Le paiement fait foi en base.
    const key = "fw_video_payment_tracked";
    try {
      if (sessionStorage.getItem(key)) return;
      sessionStorage.setItem(key, "1");
    } catch {
      // Stockage indisponible : on compte quand même la visite.
    }
    trackFunnelEvent(FUNNEL_EVENTS.videoPaymentSuccess, { source_page: "analyse_video_merci" });
  }, []);

  return (
    <Layout>
      <SEOHead {...seoFor("/analyse-video/merci")} />
      <Section className="pt-32 pb-24 md:pt-40">
        <div className="mx-auto max-w-lg text-center">
          <MailCheck className="mx-auto mb-6 h-12 w-12 text-primary" />
          <h1 className="mb-4 font-display text-3xl font-semibold tracking-tight md:text-4xl">
            Paiement reçu, on analyse ta vidéo
          </h1>
          <p className="mb-3 text-muted-foreground">
            Ton analyse arrive par e-mail d'ici quelques minutes, avec le lien vers ton rapport et son PDF.
            Tu peux fermer cette page.
          </p>
          <p className="mb-10 text-sm text-muted-foreground">
            Rien reçu au bout de 15 minutes ? Vérifie tes spams, puis écris à{" "}
            <a href="mailto:contact@fredwav.com" className="font-medium text-primary underline underline-offset-2">contact@fredwav.com</a>.
            Tu n'as rien à repayer.
          </p>
          <Button variant="outline" asChild>
            <Link to="/">Retour à l'accueil</Link>
          </Button>
        </div>
      </Section>
    </Layout>
  );
}
