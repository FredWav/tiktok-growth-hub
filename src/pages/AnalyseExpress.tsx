import { useEffect, useState, useRef } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Zap, BarChart3, FileText, TrendingUp, Search } from "lucide-react";
import { trackEvent } from "@/lib/tracking";
import { trackPostHogEvent } from "@/lib/posthog";
import { SEOHead } from "@/components/SEOHead";
import { seoFor } from "@/config/seo";
import { Layout } from "@/components/layout/Layout";
import { Section, SectionHeader } from "@/components/ui/section";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { supabase } from "@/integrations/supabase/client";
import { normalizeTikTokUsername } from "@/lib/tiktok-username";
import { toast } from "sonner";
import tiktokExample from "@/assets/tiktok-username-example.png";

const features = [
  { icon: BarChart3, title: "Audit profil complet", description: "Photo, bio, positionnement : analyse technique et recommandations concrètes de réécriture" },
  { icon: TrendingUp, title: "Analyse de tes 30 vidéos", description: "Vues, rétention, engagement, hooks — chaque vidéo passée au crible avec métriques" },
  { icon: Search, title: "Stratégie & hashtags", description: "Hashtags à tester, plan d'action 30 jours et stratégie 3-6 mois personnalisés" },
  { icon: FileText, title: "Rapport PDF complet", description: "Résumé exécutif, points forts, axes d'amélioration et actions immédiates en PDF" },
];

const steps = [
  {
    title: "Tu indiques ton compte",
    description: "Entre ton nom d'utilisateur TikTok public et l'email auquel rattacher la commande.",
  },
  {
    title: "L'outil analyse les données publiques",
    description: "Le profil et jusqu'à 30 vidéos récentes sont examinés à partir des métriques publiquement disponibles.",
  },
  {
    title: "Tu récupères ton rapport",
    description: "Le diagnostic, les priorités et le plan d'action sont réunis dans un rapport PDF et un tableau de bord.",
  },
];

const faqs = [
  {
    question: "Quelles données sont analysées ?",
    answer: "Les informations publiques du profil TikTok et jusqu'à 30 vidéos récentes : présentation du compte, vues et interactions visibles, thèmes, hooks et régularité de publication. L'outil n'accède ni à ton mot de passe ni à tes statistiques privées.",
  },
  {
    question: "Est-ce que cela fonctionne avec un compte privé ?",
    answer: "Non. Le compte et les vidéos doivent être publics au moment de l'analyse pour que les données nécessaires soient accessibles.",
  },
  {
    question: "En combien de temps le rapport est-il disponible ?",
    answer: "Le rapport est généralement généré en moins de deux minutes après le paiement. Un ralentissement de TikTok ou du service d'analyse peut exceptionnellement prolonger ce délai.",
  },
  {
    question: "L'analyse est-elle réalisée par Fred ?",
    answer: "L'Analyse Express est automatisée à partir de la méthode de Fred. Elle ne comprend pas de relecture humaine ni de rendez-vous individuel ; ces besoins relèvent du Wav Premium.",
  },
  {
    question: "Les recommandations garantissent-elles plus de vues ?",
    answer: "Non. Le rapport fournit un diagnostic et des pistes d'amélioration à partir d'un instantané des données publiques. Les résultats dépendent ensuite du contenu, de l'exécution et des évolutions de la plateforme.",
  },
  {
    question: "Que faire si mon rapport ne se génère pas ?",
    answer: "Conserve l'email de confirmation et la référence Stripe, puis écris à contact@fredwav.com. La commande pourra être retrouvée et le rapport relancé si nécessaire.",
  },
];

const CGV_ACCEPTED_TEXT = "J'ai lu et j'accepte les Conditions Générales de Vente.";
const IMMEDIATE_DELIVERY_ACCEPTED_TEXT = "Je demande expressément l'exécution immédiate de l'Analyse Express avant la fin du délai de 14 jours et je reconnais perdre mon droit de rétractation lorsque la prestation est pleinement exécutée et le rapport mis à disposition.";

export default function AnalyseExpress() {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  // Consentement marketing = acte positif (RGPD/CNIL) : décoché par défaut.
  const [subscribeToNewsletter, setSubscribeToNewsletter] = useState(false);
  // Consentements contractuels distincts, explicites et décochés par défaut.
  const [consentCgv, setConsentCgv] = useState(false);
  const [consentImmediateDelivery, setConsentImmediateDelivery] = useState(false);
  const [existingSessionId, setExistingSessionId] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const testMode = import.meta.env.VITE_STRIPE_TEST_MODE === "true" || searchParams.get("test") === "1";

  useEffect(() => {
    setExistingSessionId(window.localStorage.getItem("express_session_id"));
  }, []);

  // Forme canonique TikTok (minuscules) : c'est celle qui part au checkout puis
  // vers WavStats, donc c'est aussi celle qu'on affiche en confirmation.
  const cleanUsername = normalizeTikTokUsername(username);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (cleanUsername.length < 2) {
      toast.error("Entre un nom d'utilisateur valide");
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      toast.error("Entre une adresse email valide");
      return;
    }
    trackPostHogEvent("click_analyse_express_submit", { input_provided: "true" });
    setShowConfirmModal(true);
  };

  const proceedToPayment = async () => {
    if (!consentCgv || !consentImmediateDelivery) {
      toast.error("Les deux consentements sont nécessaires avant le paiement");
      return;
    }

    setShowConfirmModal(false);
    setLoading(true);
    trackEvent("express_checkout_start", { product: "analyse_express_tiktok" });
    try {
      const { data, error } = await supabase.functions.invoke("create-express-checkout", {
        body: {
          username: cleanUsername,
          email: email.trim(),
          subscribeToNewsletter,
          consent_cgv: consentCgv,
          consent_immediate_delivery: consentImmediateDelivery,
          ...(testMode ? { mode: "test" } : {}),
        },
      });

      if (error || !data?.url) {
        throw new Error(error?.message || "Erreur lors de la création du paiement");
      }

      window.location.href = data.url;
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Une erreur est survenue");
      setLoading(false);
    }
  };

  const handleGoBack = () => {
    setShowConfirmModal(false);
    setTimeout(() => inputRef.current?.focus(), 100);
  };

  return (
    <Layout>
      <SEOHead {...seoFor("/analyse-express")} />

      {testMode && (
        <div className="bg-amber-500 px-4 py-2 text-center text-sm font-semibold text-black">
          Mode test Stripe — aucun paiement réel.
        </div>
      )}

      {/* Hero */}
      <Section className="pt-32 pb-16 md:pt-40 md:pb-20">
        <div className="max-w-3xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-medium mb-6">
            <Zap className="h-4 w-4" />
            Résultats généralement en moins de 2 minutes
          </div>

          <h1 className="font-display text-4xl md:text-5xl font-semibold tracking-tight mb-6">
            <span className="text-gold-gradient">Analyse Express</span> — l'audit TikTok automatisé de ton compte
          </h1>

          <p className="text-lg text-muted-foreground max-w-xl mx-auto mb-4">
            Audit de ton profil, analyse de tes 30 dernières vidéos, stratégie hashtags et plan d'action personnalisé. Rapport PDF complet pour 11,90€.
          </p>
          <p className="text-sm text-muted-foreground/70 mb-10">
            Disponible uniquement pour TikTok pour le moment, d'autres plateformes arrivent bientôt.
          </p>

          {/* Form */}
          <form onSubmit={handleSubmit} className="max-w-md mx-auto space-y-4">
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-medium">@</span>
              <Input
                ref={inputRef}
                type="text"
                placeholder="ton_username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="pl-8 h-12 text-base"
                disabled={loading}
              />
            </div>
            <Input
              type="email"
              placeholder="ton@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="h-12 text-base"
              disabled={loading}
              required
            />
            <div className="flex items-start gap-3">
              <Checkbox
                id="subscribe"
                checked={subscribeToNewsletter}
                onCheckedChange={(v) => setSubscribeToNewsletter(v === true)}
                disabled={loading}
              />
              <label
                htmlFor="subscribe"
                className="text-xs text-muted-foreground leading-relaxed cursor-pointer"
              >
                Je veux aussi recevoir le guide <span className="font-semibold text-foreground">ULTIME des hooks</span> et tous les conseils de Fred
              </label>
            </div>
            <Button type="submit" variant="hero" size="lg" className="w-full" disabled={loading}>
              {loading ? "Redirection..." : "Lancer l'analyse (11,90€)"}
            </Button>
          </form>

          {existingSessionId && (
            <button
              onClick={() => {
                trackPostHogEvent("click_analyse_express_previous");
                navigate(`/analyse-express/result?session_id=${existingSessionId}`);
              }}
              className="mt-4 text-sm text-primary underline underline-offset-4 hover:text-primary/80"
            >
              Retrouver mon analyse précédente
            </button>
          )}
        </div>
      </Section>

      {/* Méthode */}
      <Section className="pb-20">
        <SectionHeader
          title="Comment fonctionne l'Analyse Express"
          subtitle="Un parcours court, transparent et sans accès à tes données privées"
        />
        <ol className="mx-auto grid max-w-4xl gap-5 md:grid-cols-3">
          {steps.map((step, index) => (
            <li key={step.title} className="rounded-xl border border-border bg-card p-6">
              <span className="mb-4 inline-flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 font-semibold text-primary">
                {index + 1}
              </span>
              <h2 className="mb-2 font-display text-xl font-semibold">{step.title}</h2>
              <p className="text-sm leading-relaxed text-muted-foreground">{step.description}</p>
            </li>
          ))}
        </ol>
      </Section>

      {/* Données et limites */}
      <Section className="pb-20">
        <div className="mx-auto grid max-w-4xl gap-6 md:grid-cols-2">
          <div className="rounded-xl border border-border bg-card p-6 md:p-8">
            <h2 className="font-display text-2xl font-semibold">Ce que l'outil utilise</h2>
            <ul className="mt-4 space-y-3 text-sm leading-relaxed text-muted-foreground">
              <li>• Les informations visibles sur ton profil TikTok public.</li>
              <li>• Jusqu'à 30 vidéos récentes et leurs métriques publiques disponibles.</li>
              <li>• Les signaux de contenu utiles au diagnostic : hooks, sujets, formats et régularité.</li>
              <li>• Aucun mot de passe, aucune connexion à ton compte et aucune statistique privée.</li>
            </ul>
          </div>
          <div className="rounded-xl border border-border bg-muted/40 p-6 md:p-8">
            <h2 className="font-display text-2xl font-semibold">Les limites à connaître</h2>
            <ul className="mt-4 space-y-3 text-sm leading-relaxed text-muted-foreground">
              <li>• Le rapport est automatisé : il ne remplace pas un audit humain avec entretien.</li>
              <li>• Il décrit un instantané du compte au moment de la commande.</li>
              <li>• La disponibilité et la précision dépendent des données rendues publiques par TikTok.</li>
              <li>• Les recommandations constituent des pistes de travail, pas une garantie de vues ou de revenus.</li>
            </ul>
          </div>
        </div>
      </Section>

      {/* Features */}
      <Section className="pb-20">
        <SectionHeader
          title="Ce que tu obtiens"
          subtitle="Un diagnostic stratégique complet de ton compte TikTok, au même niveau que les audits réalisés pour les clients Wav Premium"
        />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-4xl mx-auto">
          {features.map((f) => (
            <div key={f.title} className="bg-card border border-border rounded-xl p-6 text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 text-primary mb-4">
                <f.icon className="h-6 w-6" />
              </div>
              <h3 className="font-semibold mb-2">{f.title}</h3>
              <p className="text-sm text-muted-foreground">{f.description}</p>
            </div>
          ))}
        </div>

        {/* Mention WavStats */}
        <div className="max-w-2xl mx-auto mt-12 bg-card border border-border rounded-xl p-6 text-center">
          <p className="text-muted-foreground">
            Tu veux des analyses encore plus poussées et pouvoir analyser tes propres vidéos ?
            Rendez-vous sur{" "}
            <a
              href="https://wavstats.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary font-semibold underline underline-offset-2 hover:text-primary/80"
              onClick={() => trackPostHogEvent("click_wavstats_link")}
            >
              WavStats
            </a>{" "}
            pour accéder à l'outil complet.
          </p>
        </div>
      </Section>

      {/* FAQ visible, sans balisage FAQPage réservé aux cas éligibles Google */}
      <Section className="pb-24">
        <SectionHeader
          title="Questions fréquentes"
          subtitle="Tout ce qu'il faut savoir avant de lancer ton analyse TikTok"
        />
        <div className="mx-auto max-w-3xl space-y-3">
          {faqs.map((faq) => (
            <details key={faq.question} className="group rounded-xl border border-border bg-card p-5">
              <summary className="cursor-pointer list-none pr-8 font-semibold marker:content-none">
                {faq.question}
              </summary>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{faq.answer}</p>
            </details>
          ))}
        </div>
      </Section>

      {/* Exemple de rapport réel — le compte de Fred lui-même */}
      <Section className="pb-20">
        <SectionHeader
          title="À quoi ressemble ton rapport"
          subtitle="Voici le rapport de mon propre compte, tel que l'Analyse Express le génère. Le tien aura la même profondeur, sur tes chiffres."
        />
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 max-w-4xl mx-auto">
          {[
            { src: "/exemple-rapport-couverture.webp", alt: "Couverture du rapport Analyse Express : score de santé du compte sur 100" },
            { src: "/exemple-rapport-synthese.webp", alt: "Page de synthèse : ce qui fonctionne et ce qui bloque sur le compte" },
            { src: "/exemple-rapport-videos.webp", alt: "Tableau des meilleures vidéos avec vues, interactions et enregistrements" },
          ].map((p) => (
            <a
              key={p.src}
              href="/exemple-rapport-analyse-express.pdf"
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => trackPostHogEvent("click_example_report", { from: "preview" })}
              className="block rounded-xl overflow-hidden border border-border shadow-sm hover:shadow-md hover:border-primary/40 transition"
            >
              <img src={p.src} alt={p.alt} loading="lazy" width={620} height={876} className="w-full h-auto" />
            </a>
          ))}
        </div>
        <div className="text-center mt-8">
          <Button variant="outline" size="lg" asChild onClick={() => trackPostHogEvent("click_example_report", { from: "button" })}>
            <a href="/exemple-rapport-analyse-express.pdf" target="_blank" rel="noopener noreferrer">
              Voir le rapport complet (exemple)
            </a>
          </Button>
          <p className="text-xs text-muted-foreground mt-3">11 pages, texte sélectionnable · c'est exactement ce que tu reçois.</p>
        </div>
      </Section>

      {/* Confirmation Modal */}
      <Dialog open={showConfirmModal} onOpenChange={setShowConfirmModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl">Vérifie ton nom d'utilisateur</DialogTitle>
            <DialogDescription>
              Attention, entre bien ton <strong>nom d'utilisateur</strong> (le @) et non ton pseudo affiché.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <img
              src={tiktokExample}
              alt="Où trouver le nom d'utilisateur TikTok"
              className="w-full rounded-lg border border-border"
            />

            <p className="text-center text-base">
              Tu as saisi : <span className="font-bold text-primary text-lg">@{cleanUsername}</span>
            </p>
            <p className="text-center text-sm text-muted-foreground">
              Email : <span className="font-medium text-foreground">{email.trim()}</span>
            </p>

            <div className="space-y-3 rounded-lg border border-border bg-muted/30 p-4 text-left">
              <div className="flex items-start gap-3">
                <Checkbox
                  id="express-cgv"
                  checked={consentCgv}
                  onCheckedChange={(value) => setConsentCgv(value === true)}
                  disabled={loading}
                />
                <label htmlFor="express-cgv" className="cursor-pointer text-sm leading-relaxed text-muted-foreground">
                  {CGV_ACCEPTED_TEXT.replace("Conditions Générales de Vente.", "")}{" "}
                  <Link
                    to="/cgv"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-medium text-primary underline underline-offset-2"
                  >
                    Conditions Générales de Vente
                  </Link>.
                </label>
              </div>

              <div className="flex items-start gap-3">
                <Checkbox
                  id="express-immediate-delivery"
                  checked={consentImmediateDelivery}
                  onCheckedChange={(value) => setConsentImmediateDelivery(value === true)}
                  disabled={loading}
                />
                <label
                  htmlFor="express-immediate-delivery"
                  className="cursor-pointer text-sm leading-relaxed text-muted-foreground"
                >
                  {IMMEDIATE_DELIVERY_ACCEPTED_TEXT}
                </label>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-2">
              <Button variant="outline" className="flex-1" onClick={handleGoBack}>
                Ha je me suis trompé !
              </Button>
              <Button
                variant="hero"
                className="flex-1"
                disabled={loading || !consentCgv || !consentImmediateDelivery}
                onClick={() => { trackPostHogEvent("click_analyse_express_confirm", { product: "analyse_express_tiktok" }); proceedToPayment(); }}
              >
                Confirmer et payer
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </Layout>
  );
}
