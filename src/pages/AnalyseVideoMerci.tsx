import { Link } from "react-router-dom";
import { MailCheck } from "lucide-react";
import { SEOHead } from "@/components/SEOHead";
import { seoFor } from "@/config/seo";
import { Layout } from "@/components/layout/Layout";
import { Section } from "@/components/ui/section";
import { Button } from "@/components/ui/button";

export default function AnalyseVideoMerci() {
  // Pas d'événement « paiement réussi » ici : arriver sur cette page ne prouve pas
  // le paiement. Les ventes sont comptées en base, après confirmation de Stripe.
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
