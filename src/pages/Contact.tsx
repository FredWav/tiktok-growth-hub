import { Mail, Clock, ArrowRight, Instagram, Youtube, Facebook } from "lucide-react";
import { trackEvent } from "@/lib/tracking";
import { Layout } from "@/components/layout/Layout";
import { Section } from "@/components/ui/section";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const socials = [
  {
    name: "TikTok",
    href: "https://www.tiktok.com/@fredwav",
    icon: (
      <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
        <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.27 6.27 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V8.75a8.18 8.18 0 004.77 1.52V6.84a4.84 4.84 0 01-1-.15z" />
      </svg>
    ),
  },
  {
    name: "Instagram",
    href: "https://www.instagram.com/levraifredwav/",
    icon: <Instagram className="h-5 w-5" />,
  },
  {
    name: "YouTube",
    href: "https://www.youtube.com/@Fredwavconseils",
    icon: <Youtube className="h-5 w-5" />,
  },
  {
    name: "Facebook",
    href: "https://www.facebook.com/frederic.olalde",
    icon: <Facebook className="h-5 w-5" />,
  },
];

export default function Contact() {
  return (
    <Layout>
      <Section variant="cream" size="lg">
        <div className="max-w-3xl mx-auto text-center">
          <h1 className="font-display text-4xl md:text-5xl font-semibold tracking-tight mb-6">
            Une question ? <span className="text-gold-gradient">Parlons-en.</span>
          </h1>
          <p className="text-lg text-muted-foreground">
            Le plus simple, c'est de me contacter directement sur mes réseaux.
          </p>
        </div>
      </Section>

      <Section variant="default" size="lg">
        <div className="max-w-2xl mx-auto space-y-10">
          {/* Réseaux sociaux */}
          <div className="grid sm:grid-cols-2 gap-4">
            {socials.map((s) => (
              <a
                key={s.name}
                href={s.href}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-4 p-5 rounded-xl border border-border/50 hover:border-primary/30 hover:shadow-lg transition-all duration-300 group"
              >
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center shrink-0 group-hover:bg-primary/20 transition-colors">
                  <span className="text-primary">{s.icon}</span>
                </div>
                <span className="font-semibold">{s.name}</span>
              </a>
            ))}
          </div>

          {/* Infos */}
          <div className="flex flex-col sm:flex-row gap-6">
            <div className="flex items-start gap-4 flex-1">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center shrink-0">
                <Mail className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold mb-1">Email</h3>
                <p className="text-muted-foreground text-sm">contact@fredwav.com</p>
              </div>
            </div>
            <div className="flex items-start gap-4 flex-1">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center shrink-0">
                <Clock className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold mb-1">Délai de réponse</h3>
                <p className="text-muted-foreground text-sm">24-48h en semaine</p>
              </div>
            </div>
          </div>

          {/* CTA */}
          <div className="bg-muted/50 rounded-xl p-8 text-center">
            <h3 className="font-semibold text-lg mb-3">Tu veux passer à l'action ?</h3>
            <p className="text-muted-foreground text-sm mb-6">
              Pas besoin d'attendre. Réserve un One Shot et on en parle directement.
            </p>
            <Button variant="hero" size="lg" asChild onClick={() => trackEvent("cta_one_shot_click", { location: "contact" })}>
              <Link to="/one-shot">
                Réserver mon One Shot (179€)
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </Section>
    </Layout>
  );
}
