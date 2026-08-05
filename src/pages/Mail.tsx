import { Layout } from "@/components/layout/Layout";
import { Section } from "@/components/ui/section";
import { SEOHead } from "@/components/SEOHead";
import { seoFor } from "@/config/seo";
import { NewsletterForm } from "@/components/NewsletterForm";
import { Gift, Zap, FileText, Lightbulb } from "lucide-react";

const benefits = [
  { icon: Zap, text: "Toutes les familles d'accroches, avec des exemples prêts à l'emploi" },
  { icon: FileText, text: "Les structures qui captent l'attention dans les deux premières secondes" },
  { icon: Lightbulb, text: "Les modèles à compléter avec ton propre sujet, et une grille pour noter un hook" },
];

export default function MailPage() {
  return (
    <Layout>
      <SEOHead {...seoFor("/newsletter")} />

      <Section className="bg-background py-20 md:py-32">
        <div className="max-w-lg mx-auto">
          <div className="bg-card border border-border rounded-xl overflow-hidden shadow-lg">
            <div className="bg-primary text-primary-foreground text-center py-2.5 px-4">
              <span className="text-sm font-semibold tracking-wide">GRATUIT — Guide offert à l'inscription</span>
            </div>

            <div className="p-8">
              <div className="text-center mb-8 space-y-4">
                <div className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-primary/10 mb-2">
                  <Gift className="h-8 w-8 text-primary" />
                </div>
                <h1 className="font-display text-2xl md:text-3xl font-bold text-foreground leading-tight">
                  La newsletter de Fred Wav, et le guide des hooks{" "}
                  <span className="text-gold-gradient">en cadeau</span>
                </h1>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  Mes conseils formats courts par email, et pour commencer, le guide complet des hooks : le même que
                  j'utilise avec mes clients pour construire des accroches qui retiennent l'attention dès la première
                  seconde.
                </p>
              </div>

              <div className="space-y-3 mb-8">
                {benefits.map((b, i) => (
                  <div key={i} className="flex items-start gap-3 text-sm">
                    <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center shrink-0 mt-0.5">
                      <b.icon className="h-4 w-4 text-primary" />
                    </div>
                    <span className="text-foreground">{b.text}</span>
                  </div>
                ))}
              </div>

              <NewsletterForm location="newsletter_page" />
            </div>
          </div>
        </div>
      </Section>
    </Layout>
  );
}
