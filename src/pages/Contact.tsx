import { Mail, Clock, ArrowRight, Instagram, Youtube, Facebook } from "lucide-react";
import { trackEvent } from "@/lib/tracking";
import { SEOHead } from "@/components/SEOHead";
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
    name: "Threads",
    href: "https://www.threads.com/@fredwavoff",
    icon: (
      <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12.186 24h-.007c-3.581-.024-6.334-1.205-8.184-3.509C2.35 18.44 1.5 15.586 1.472 12.01v-.017c.03-3.579.879-6.43 2.525-8.482C5.845 1.205 8.6.024 12.18 0h.014c2.746.02 5.043.725 6.826 2.098 1.677 1.29 2.858 3.13 3.509 5.467l-2.04.569c-1.104-3.96-3.898-5.984-8.304-6.015-2.91.022-5.11.936-6.54 2.717C4.307 6.504 3.616 8.914 3.589 12c.027 3.086.718 5.496 2.057 7.164 1.43 1.783 3.631 2.698 6.54 2.717 2.623-.02 4.358-.631 5.8-2.045 1.647-1.613 1.618-3.593 1.09-4.798-.31-.71-.873-1.3-1.634-1.75-.192 1.352-.622 2.446-1.284 3.272-.886 1.102-2.14 1.704-3.73 1.79-1.202.065-2.361-.218-3.259-.801-1.063-.689-1.685-1.74-1.752-2.96-.065-1.166.408-2.2 1.332-2.911.876-.673 2.089-1.055 3.612-1.14 1.226-.068 2.36.04 3.389.319-.07-1.486-.698-2.236-2.442-2.346-.79-.05-1.819.094-2.634.594L8.24 7.39c1.174-.72 2.636-1.076 3.927-1.003 2.084.118 3.576.942 4.432 2.448.754 1.326.897 3.074.414 5.04.652.39 1.217.862 1.682 1.414 1.14 1.353 1.603 3.07 1.374 5.107-.276 2.448-1.524 4.322-3.61 5.42-1.732.91-3.778 1.282-5.862 1.262l-.411-.078zM14.4 14.052c-1.03-.116-2.053-.137-2.985-.056-1.118.06-1.94.333-2.476.717-.368.264-.533.582-.516.924.014.31.166.645.485.862.508.347 1.235.513 2.05.466 1.035-.06 1.836-.444 2.387-1.142.35-.443.602-1.039.752-1.771l.303 0z" />
      </svg>
    ),
  },
  {
    name: "Discord",
    href: "https://discord.gg/YJx4qr6RaE",
    icon: (
      <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
        <path d="M20.317 4.37a19.791 19.791 0 00-4.885-1.515.074.074 0 00-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 00-5.487 0 12.64 12.64 0 00-.617-1.25.077.077 0 00-.079-.037A19.736 19.736 0 003.677 4.37a.07.07 0 00-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 00.031.057 19.9 19.9 0 005.993 3.03.078.078 0 00.084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 00-.041-.106 13.107 13.107 0 01-1.872-.892.077.077 0 01-.008-.128 10.2 10.2 0 00.372-.292.074.074 0 01.077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 01.078.01c.12.098.246.198.373.292a.077.077 0 01-.006.127 12.299 12.299 0 01-1.873.892.077.077 0 00-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 00.084.028 19.839 19.839 0 006.002-3.03.077.077 0 00.032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 00-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
      </svg>
    ),
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
      <SEOHead title="Contact - Fred Wav | Expert Formats Courts" description="Contacte Fred Wav par email ou réseaux sociaux. Réponse sous 24-48h en semaine." path="/contact" keywords="contact Fred Wav, question formats courts, réseaux sociaux, email" />
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
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {socials.map((s) => (
              <a
                key={s.name}
                href={s.href}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => trackEvent("contact_social_click", { platform: s.name })}
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
                <a href="mailto:contact@fredwav.com" className="text-muted-foreground text-sm hover:text-primary transition-colors" onClick={() => trackEvent("click_email_link", { location: "contact" })}>contact@fredwav.com</a>
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
              Pas besoin d'attendre. Envoie-moi un message via les réseaux ci-dessus ou par email et on en parle directement.
            </p>
            <p className="text-muted-foreground text-xs mt-4">
              Envie de mieux me connaître ? <Link to="/a-propos" className="text-primary underline hover:no-underline">Découvre mon parcours</Link> ou consulte les <Link to="/preuves" className="text-primary underline hover:no-underline">témoignages clients</Link>.
            </p>
          </div>
        </div>
      </Section>
    </Layout>
  );
}
