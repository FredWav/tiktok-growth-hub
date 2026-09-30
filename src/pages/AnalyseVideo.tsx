import { useEffect, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Clapperboard, Gauge, Lightbulb, ListChecks, Mail } from "lucide-react";
import { toast } from "sonner";
import { SEOHead } from "@/components/SEOHead";
import { seoFor } from "@/config/seo";
import { Layout } from "@/components/layout/Layout";
import { Section, SectionHeader } from "@/components/ui/section";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { supabase } from "@/integrations/supabase/client";
import { FUNNEL_EVENTS, trackFunnelEvent } from "@/lib/funnel-events";
import { VIDEO_ANALYSIS_PRICE_LABEL } from "@/config/offers";
import { parseTikTokVideoUrl } from "../../supabase/functions/_shared/tiktok-video-url";

// Doivent rester identiques aux textes enregistrés par create-video-checkout.
const CGV_ACCEPTED_TEXT = "J'ai lu et j'accepte les Conditions Générales de Vente.";
const IMMEDIATE_DELIVERY_ACCEPTED_TEXT = "Je demande expressément l'exécution immédiate de l'Analyse Vidéo avant la fin du délai de 14 jours et je reconnais perdre mon droit de rétractation lorsque la prestation est pleinement exécutée et le rapport mis à disposition.";

const deliverables = [
  { icon: Gauge, title: "Ce qui fonctionne", description: "Les points forts de ta vidéo, à garder sur les prochaines." },
  { icon: Clapperboard, title: "Ce qui bloque", description: "Accroche, rythme, message : ce qui freine la performance." },
  { icon: ListChecks, title: "Quoi changer", description: "Un plan d'action concret : si tu devais refaire cette vidéo demain." },
  { icon: Mail, title: "Rapport par e-mail", description: "Tu reçois un lien vers ton analyse, avec le rapport PDF." },
];

const faqs = [
  {
    question: "Quelle vidéo puis-je envoyer ?",
    answer: "N'importe quelle vidéo TikTok publique, la tienne ou une autre. Les carrousels photo et les vidéos privées ou supprimées ne peuvent pas être analysés.",
  },
  {
    question: "Où trouver le lien de ma vidéo ?",
    answer: "Dans TikTok : bouton Partager, puis « Copier le lien ». Un lien complet (tiktok.com/@compte/video/…) ou un lien court (vm.tiktok.com/…) fonctionnent tous les deux.",
  },
  {
    question: "Faut-il un compte ou un abonnement ?",
    answer: "Non. Tu paies l'analyse à l'unité. Aucun compte à créer, aucune connexion à TikTok, aucun abonnement.",
  },
  {
    question: "En combien de temps je reçois mon analyse ?",
    answer: "Quelques minutes en fonctionnement normal après le paiement. Pense à vérifier tes spams. En cas de souci, Fred est prévenu et revient vers toi sous deux jours ouvrés, sans nouveau paiement.",
  },
  {
    question: "L'analyse garantit-elle plus de vues ?",
    answer: "Non. Elle est automatisée à partir des données publiques de la vidéo et donne des pistes concrètes à tester. Les résultats dépendent ensuite de ton contenu et de la plateforme.",
  },
];

export default function AnalyseVideo() {
  const [tiktokUrl, setTiktokUrl] = useState("");
  const [email, setEmail] = useState("");
  const [consentCgv, setConsentCgv] = useState(false);
  const [consentImmediateDelivery, setConsentImmediateDelivery] = useState(false);
  const [loading, setLoading] = useState(false);
  const [urlError, setUrlError] = useState<string | null>(null);
  const formStartedRef = useRef(false);
  const [searchParams] = useSearchParams();
  const testMode = import.meta.env.VITE_STRIPE_TEST_MODE === "true" || searchParams.get("test") === "1";

  useEffect(() => {
    trackFunnelEvent(FUNNEL_EVENTS.videoPageView, { source_page: "analyse_video" });
  }, []);

  const markFormStarted = () => {
    if (formStartedRef.current) return;
    formStartedRef.current = true;
    trackFunnelEvent(FUNNEL_EVENTS.videoFormStarted, { source_page: "analyse_video" });
  };

  const validateUrl = (value: string) => {
    const parsed = parseTikTokVideoUrl(value);
    return parsed.kind === "invalid" ? parsed.reason : null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const error = validateUrl(tiktokUrl);
    setUrlError(error);
    if (error) return;
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      toast.error("Entre une adresse e-mail valide");
      return;
    }
    if (!consentCgv || !consentImmediateDelivery) {
      toast.error("Coche les deux cases pour continuer vers le paiement");
      return;
    }

    setLoading(true);
    trackFunnelEvent(FUNNEL_EVENTS.videoCheckoutStart, { source_page: "analyse_video" });
    try {
      const { data, error: fnError } = await supabase.functions.invoke("create-video-checkout", {
        body: {
          tiktokUrl: tiktokUrl.trim(),
          email: email.trim(),
          consent_cgv: consentCgv,
          consent_immediate_delivery: consentImmediateDelivery,
          ...(testMode ? { mode: "test" } : {}),
        },
      });
      if (fnError || !data?.url) {
        let message = typeof data?.error === "string" ? data.error : "";
        const errorContext = (fnError as { context?: unknown } | null)?.context;
        if (!message && errorContext instanceof Response) {
          const payload = await errorContext.clone().json().catch(() => null) as { error?: unknown; code?: unknown } | null;
          if (typeof payload?.error === "string") message = payload.error;
          if (payload?.code === "invalid_tiktok_video_url" || payload?.code === "short_link_unresolved") setUrlError(message);
        }
        throw new Error(message || "Le paiement n'a pas pu être préparé. Réessaie dans un instant.");
      }
      window.location.href = data.url;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Une erreur est survenue";
      trackFunnelEvent(FUNNEL_EVENTS.videoError, { source_page: "analyse_video", step: "checkout" });
      toast.error(message);
      setLoading(false);
    }
  };

  return (
    <Layout>
      <SEOHead {...seoFor("/analyse-video")} />

      {testMode && (
        <div className="bg-amber-500 px-4 py-2 text-center text-sm font-semibold text-black">
          Mode test Stripe. Aucun paiement réel.
        </div>
      )}

      <Section className="pt-28 pb-14 md:pt-40 md:pb-20">
        <div className="mx-auto max-w-2xl text-center">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary">
            <Lightbulb className="h-4 w-4" />
            Analyse Vidéo TikTok · {VIDEO_ANALYSIS_PRICE_LABEL}
          </div>

          <h1 className="mb-5 font-display text-3xl font-semibold tracking-tight sm:text-4xl md:text-5xl">
            Envoie ta vidéo. On te dit ce qui fonctionne, ce qui bloque et quoi changer.
          </h1>
          <p className="mx-auto mb-10 max-w-xl text-base text-muted-foreground sm:text-lg">
            Colle le lien d'une vidéo TikTok : tu reçois par e-mail une analyse claire de son accroche,
            de sa structure et de son message, avec un plan d'action concret. Sans compte, sans abonnement.
          </p>

          <form onSubmit={handleSubmit} className="mx-auto max-w-md space-y-4 text-left" noValidate>
            <div className="space-y-1.5">
              <label htmlFor="video-url" className="text-sm font-medium">Lien de ta vidéo TikTok</label>
              <Input
                id="video-url"
                type="url"
                inputMode="url"
                autoComplete="off"
                autoCapitalize="none"
                spellCheck={false}
                placeholder="https://www.tiktok.com/@toncompte/video/..."
                value={tiktokUrl}
                onFocus={markFormStarted}
                onChange={(e) => { setTiktokUrl(e.target.value); if (urlError) setUrlError(null); }}
                onBlur={() => tiktokUrl.trim() && setUrlError(validateUrl(tiktokUrl))}
                aria-invalid={!!urlError}
                aria-describedby={urlError ? "video-url-error" : undefined}
                className="h-12 text-base"
                disabled={loading}
                required
              />
              {urlError && <p id="video-url-error" className="text-sm text-destructive">{urlError}</p>}
            </div>

            <div className="space-y-1.5">
              <label htmlFor="video-email" className="text-sm font-medium">Ton adresse e-mail</label>
              <Input
                id="video-email"
                type="email"
                inputMode="email"
                autoComplete="email"
                placeholder="ton@email.com"
                value={email}
                onFocus={markFormStarted}
                onChange={(e) => setEmail(e.target.value)}
                className="h-12 text-base"
                disabled={loading}
                required
              />
              <p className="text-xs text-muted-foreground">Ton analyse est envoyée à cette adresse.</p>
            </div>

            <div className="space-y-3 rounded-lg border border-border bg-muted/30 p-4">
              <div className="flex items-start gap-3">
                <Checkbox id="video-cgv" checked={consentCgv} onCheckedChange={(v) => setConsentCgv(v === true)} disabled={loading} className="mt-0.5" />
                <label htmlFor="video-cgv" className="cursor-pointer text-sm leading-relaxed text-muted-foreground">
                  {CGV_ACCEPTED_TEXT.replace("Conditions Générales de Vente.", "")}{" "}
                  <Link to="/cgv" target="_blank" rel="noopener noreferrer" className="font-medium text-primary underline underline-offset-2">
                    Conditions Générales de Vente
                  </Link>.
                </label>
              </div>
              <div className="flex items-start gap-3">
                <Checkbox id="video-immediate" checked={consentImmediateDelivery} onCheckedChange={(v) => setConsentImmediateDelivery(v === true)} disabled={loading} className="mt-0.5" />
                <label htmlFor="video-immediate" className="cursor-pointer text-sm leading-relaxed text-muted-foreground">
                  {IMMEDIATE_DELIVERY_ACCEPTED_TEXT}
                </label>
              </div>
            </div>

            <Button type="submit" variant="hero" size="lg" className="w-full" disabled={loading}>
              {loading ? "Redirection vers le paiement…" : `Analyser ma vidéo (${VIDEO_ANALYSIS_PRICE_LABEL})`}
            </Button>
            <p className="text-center text-xs text-muted-foreground">Paiement sécurisé par Stripe · Rapport par e-mail en quelques minutes</p>
          </form>
        </div>
      </Section>

      <Section className="pb-16">
        <SectionHeader title="Ce que tu reçois" subtitle="Une lecture concrète de ta vidéo, pas un tableau de chiffres." />
        <ul className="mx-auto grid max-w-4xl gap-4 sm:grid-cols-2">
          {deliverables.map((item) => (
            <li key={item.title} className="flex gap-4 rounded-xl border border-border bg-card p-5">
              <item.icon className="h-6 w-6 shrink-0 text-primary" />
              <div>
                <h2 className="mb-1 font-display text-lg font-semibold">{item.title}</h2>
                <p className="text-sm leading-relaxed text-muted-foreground">{item.description}</p>
              </div>
            </li>
          ))}
        </ul>
      </Section>

      <Section className="pb-20">
        <SectionHeader title="Questions fréquentes" />
        <div className="mx-auto max-w-2xl space-y-3">
          {faqs.map((faq) => (
            <details key={faq.question} className="rounded-lg border border-border bg-card p-4">
              <summary className="cursor-pointer font-medium">{faq.question}</summary>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{faq.answer}</p>
            </details>
          ))}
        </div>
        <p className="mx-auto mt-10 max-w-2xl text-center text-sm text-muted-foreground">
          Tu veux l'analyse de tout ton compte ?{" "}
          <Link to="/analyse-express" className="font-medium text-primary underline underline-offset-2">Découvre l'Analyse Express</Link>.
        </p>
      </Section>
    </Layout>
  );
}
