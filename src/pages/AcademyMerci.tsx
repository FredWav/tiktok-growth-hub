import { Link } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { Section } from "@/components/ui/section";
import { SEOHead } from "@/components/SEOHead";
import { seoFor } from "@/config/seo";

/** Retour de Stripe après le paiement de la Wav Academy. La confirmation vient du serveur, par e-mail. */
export default function AcademyMerci() {
  return (
    <Layout>
      <SEOHead {...seoFor("/wavacademy/merci")} />
      <Section variant="cream" size="lg">
        <div className="max-w-2xl mx-auto space-y-5">
          <p className="text-primary font-semibold">Wav Academy</p>
          <h1 className="font-display text-3xl md:text-4xl">Merci, ton paiement est en cours de confirmation.</h1>
          <p>Tu vas recevoir deux e-mails dans les minutes qui viennent :</p>
          <ol className="list-decimal pl-5 space-y-2">
            <li>la confirmation de ton paiement ;</li>
            <li>ton lien personnel pour rejoindre le Discord de la Wav Academy (le jour de ton démarrage).</li>
          </ol>
          <p className="text-muted-foreground">
            Rien reçu au bout d'une heure ? Vérifie tes spams, puis écris à{" "}
            <a href="mailto:contact@fredwav.com" className="underline">contact@fredwav.com</a>.
          </p>
          <Link to="/ressources" className="inline-flex min-h-11 items-center underline">
            En attendant, parcourir les ressources
          </Link>
        </div>
      </Section>
    </Layout>
  );
}
