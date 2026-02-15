import { Link } from "react-router-dom";
import { ArrowRight, Calendar, CheckCircle, Mail } from "lucide-react";
import { Layout } from "@/components/layout/Layout";
import { Section } from "@/components/ui/section";
import { Button } from "@/components/ui/button";

export default function OneShotSuccess() {
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

          <p className="text-lg text-muted-foreground mb-8">
            Merci pour ta confiance. Il ne te reste plus qu'à réserver ton créneau pour notre session.
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
                Si les horaires proposés ne sont pas possibles pour vous, merci de me contacter à{" "}
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
        </div>
      </Section>
    </Layout>
  );
}
