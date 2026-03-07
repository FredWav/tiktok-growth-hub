import { useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useDiagnostic } from "@/contexts/DiagnosticContext";
import { SEOHead } from "@/components/SEOHead";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ExternalLink, Mail } from "lucide-react";
import { trackEvent } from "@/lib/tracking";
import { trackPostHogEvent } from "@/lib/posthog";

const CALENDLY_URL = "https://calendly.com/fredwavcm/wav-premium";

const ScoreCircle = ({ score }: { score: number }) => {
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;
  const color = score < 40 ? "hsl(0 84% 60%)" : score <= 70 ? "hsl(43 61% 58%)" : "hsl(142 71% 45%)";

  return (
    <div className="relative w-36 h-36 mx-auto">
      <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
        <circle cx="60" cy="60" r={radius} fill="none" stroke="hsl(var(--border))" strokeWidth="8" />
        <circle
          cx="60" cy="60" r={radius} fill="none"
          stroke={color} strokeWidth="8" strokeLinecap="round"
          strokeDasharray={circumference} strokeDashoffset={offset}
          className="transition-all duration-1000 ease-out"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-3xl font-bold text-foreground">{score}</span>
        <span className="text-xs text-muted-foreground">/100</span>
      </div>
    </div>
  );
};

const DiagnosticResult = () => {
  const { data, isComplete } = useDiagnostic();
  const navigate = useNavigate();

  useEffect(() => {
    console.log("[DiagnosticResult] isComplete:", isComplete, "data:", data);
    if (!isComplete) {
      console.log("[DiagnosticResult] Redirecting to /start (incomplete)");
      navigate("/start", { replace: true });
    }
    sessionStorage.setItem("from_diagnostic", "true");
  }, [isComplete, navigate]);

  // Track result viewed
  useEffect(() => {
    if (isComplete && data) {
      const audiencePoints: Record<string, number> = { "0-5k": 10, "5k-50k": 25, "50k+": 40 };
      const objectifPoints: Record<string, number> = { "Visibilité": 10, "Audience": 15, "Vendre": 25, "Monétiser": 30 };
      const budgetPoints: Record<string, number> = { "0": 0, "1-200": 10, "200-500": 20, "500+": 30 };
      const s = (audiencePoints[data.audience] || 0) + (objectifPoints[data.objectif] || 0) + (budgetPoints[data.budget] || 0);
      trackPostHogEvent("diagnostic_result_viewed", { score: s, audience: data.audience, budget: data.budget, objectif: data.objectif });
    }
  }, [isComplete, data]);

  if (!isComplete) return null;

  // ── Score calculation ──
  const audiencePoints: Record<string, number> = { "0-5k": 10, "5k-50k": 25, "50k+": 40 };
  const objectifPoints: Record<string, number> = { "Visibilité": 10, "Audience": 15, "Vendre": 25, "Monétiser": 30 };
  const budgetPoints: Record<string, number> = { "0": 0, "1-200": 10, "200-500": 20, "500+": 30 };

  const score = (audiencePoints[data.audience] || 0) + (objectifPoints[data.objectif] || 0) + (budgetPoints[data.budget] || 0);
  const scoreLabel = score < 40 ? "Compte instable" : score <= 70 ? "Potentiel non exploité" : "Compte structuré";

  // ── Strategic analysis ──
  const constat: Record<string, string> = {
    "0-5k": "Ton compte est encore en phase de construction. Le problème principal n'est généralement pas l'algorithme mais la structure du contenu. Sans format clair et identifiable, TikTok ne peut pas comprendre à qui montrer tes vidéos.",
    "5k-50k": "Ton compte montre déjà un potentiel de croissance. Mais ta progression dépend probablement encore de certaines vidéos qui fonctionnent ponctuellement. Le vrai levier maintenant est la reproductibilité des formats performants.",
    "50k+": "Ton audience est un actif. Mais sans stratégie globale tu risques de perdre : visibilité, opportunités de monétisation, cohérence de contenu. Ton enjeu n'est plus de percer mais d'optimiser ton compte.",
  };

  // ── Time analysis ──
  const getTempsText = () => {
    if (data.temps === "Moins de 2h") return "Avec moins de 2h par semaine, l'efficacité doit être radicale. Pas de place pour le hasard, la structure de tes contenus doit être parfaite dès la conception pour garantir un ROI.";
    if (data.temps === "2-5h") return "Tu as un temps limité. L'enjeu est d'arrêter de le gaspiller sur des tâches à faible valeur ajoutée et de tout concentrer sur ce qui apporte des résultats : l'angle et le script.";
    if (data.temps === "5-10h") return "C'est un investissement sérieux. Le but maintenant est de s'assurer que chaque heure passée génère un impact direct et mesurable sur la croissance de ton audience ou de tes revenus.";
    if (data.temps === "+10h") {
      if (data.audience === "50k+") return "Tu passes plus de 10h par semaine sur ton contenu. À ce stade de ton développement, ton enjeu n'est plus de travailler plus, mais de structurer un système et de déléguer pour scaler sans t'épuiser.";
      return "Tu passes plus de 10h par semaine sur TikTok. Si ta croissance ou tes revenus ne sont pas proportionnels à cet effort massif, c'est que ton énergie est placée sur les mauvaises actions. Il faut restructurer.";
    }
    return "";
  };

  // ── Offer routing ──
  const getOffer = () => {
    const { audience, budget } = data;
    if (budget === "0") return "EXPRESS";
    if (budget === "1-200" || audience === "0-5k") return "ONE_SHOT";
    if (audience === "5k-50k" && budget === "200-500") return "ONE_SHOT_PLUS_PREMIUM";
    if (audience === "50k+" && budget === "200-500") return "PREMIUM";
    if ((audience === "5k-50k" || audience === "50k+") && budget === "500+") return "PREMIUM";
    return "ONE_SHOT";
  };

  const offer = getOffer();
  console.log("[DiagnosticResult] score:", score, "scoreLabel:", scoreLabel, "offer:", offer, "audience:", data.audience, "budget:", data.budget);

  const MailFooter = () => (
    <p className="text-sm text-muted-foreground mt-4">
      Besoin d'en discuter par écrit ?{" "}
      <a href="mailto:fredwavcm@gmail.com" className="text-primary underline underline-offset-4 hover:text-primary/80">
        Contacte-moi par mail.
      </a>
    </p>
  );

  return (
    <div className="min-h-screen bg-cream">
      <SEOHead title="Ton Diagnostic TikTok | Fred Wav" description="Résultat de ton diagnostic stratégique TikTok personnalisé." path="/result" />

      <div className="max-w-3xl mx-auto px-4 py-12 md:py-20 space-y-10">
        {/* Header */}
        <div className="text-center space-y-3 animate-fade-in">
          <h1 className="font-display text-3xl md:text-4xl font-bold text-foreground">Diagnostic TikTok : ton plan d'action</h1>
          <p className="text-muted-foreground text-base md:text-lg">
            {data.firstName} | Compte : {data.audience} | Objectif : {data.objectif}
          </p>
        </div>

        {/* Bloc 1: Score */}
        <Card className="animate-fade-in" style={{ animationDelay: "0.1s" }}>
          <CardHeader className="text-center pb-2">
            <CardTitle className="font-display text-xl">Score de maturité</CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <ScoreCircle score={score} />
            <p className="text-lg font-semibold text-foreground">{scoreLabel}</p>
          </CardContent>
        </Card>

        {/* Bloc 2: Constat */}
        <Card className="animate-fade-in" style={{ animationDelay: "0.2s" }}>
          <CardHeader className="pb-2">
            <CardTitle className="font-display text-xl">Constat stratégique</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground leading-relaxed">{constat[data.audience]}</p>
          </CardContent>
        </Card>

        {/* Bloc 3: Temps */}
        <Card className="animate-fade-in" style={{ animationDelay: "0.3s" }}>
          <CardHeader className="pb-2">
            <CardTitle className="font-display text-xl">Ton investissement temps</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground leading-relaxed">{getTempsText()}</p>
          </CardContent>
        </Card>

        {/* Bloc 4: Offre */}
        <div className="animate-fade-in" style={{ animationDelay: "0.4s" }}>
          {offer === "EXPRESS" && (
            <Card>
              <CardHeader><CardTitle className="font-display text-xl">Analyse Express</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <p className="text-muted-foreground">Fais analyser ton compte par notre IA. En 2 minutes tu sauras exactement où tu en es et quels leviers activer en priorité.</p>
                <Button variant="hero" size="lg" asChild className="w-full" onClick={() => { trackEvent("diagnostic_cta_click", { offer }); trackPostHogEvent("click_analyse_express_diagnostic", { offer: "EXPRESS" }); }}>
                  <Link to="/analyse-express">Lancer le Scan de mon compte</Link>
                </Button>
              </CardContent>
            </Card>
          )}

          {offer === "ONE_SHOT" && (
            <Card>
              <CardHeader><CardTitle className="font-display text-xl">Audit stratégique TikTok (179 €)</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <ul className="space-y-2 text-muted-foreground">
                  <li className="flex items-start gap-2"><span className="text-primary mt-0.5">✓</span> Analyse complète du compte</li>
                  <li className="flex items-start gap-2"><span className="text-primary mt-0.5">✓</span> Identification des erreurs de structure</li>
                  <li className="flex items-start gap-2"><span className="text-primary mt-0.5">✓</span> Plan d'action personnalisé</li>
                </ul>
                <Button variant="hero" size="lg" asChild className="w-full" onClick={() => trackEvent("diagnostic_cta_click", { offer })}>
                  <Link to="/one-shot">Réserver mon Audit stratégique <ExternalLink className="w-4 h-4 ml-2" /></Link>
                </Button>
                <MailFooter />
              </CardContent>
            </Card>
          )}

          {offer === "PREMIUM" && (
            <Card>
              <CardHeader><CardTitle className="font-display text-xl">Wav Premium</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <ul className="space-y-2 text-muted-foreground">
                  <li className="flex items-start gap-2"><span className="text-primary mt-0.5">✓</span> Accompagnement sur mesure</li>
                  <li className="flex items-start gap-2"><span className="text-primary mt-0.5">✓</span> Structuration business</li>
                  <li className="flex items-start gap-2"><span className="text-primary mt-0.5">✓</span> Scale de l'audience</li>
                </ul>
                <Button variant="hero" size="lg" asChild className="w-full" onClick={() => trackEvent("diagnostic_cta_click", { offer })}>
                  <a href={CALENDLY_URL} target="_blank" rel="noopener noreferrer">
                    Réserver une discussion stratégique (45 min) <ExternalLink className="w-4 h-4 ml-2" />
                  </a>
                </Button>
                <MailFooter />
              </CardContent>
            </Card>
          )}

          {offer === "ONE_SHOT_PLUS_PREMIUM" && (
            <Card>
              <CardHeader><CardTitle className="font-display text-xl">Audit stratégique TikTok (179 €)</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <ul className="space-y-2 text-muted-foreground">
                  <li className="flex items-start gap-2"><span className="text-primary mt-0.5">✓</span> Analyse complète du compte</li>
                  <li className="flex items-start gap-2"><span className="text-primary mt-0.5">✓</span> Identification des erreurs de structure</li>
                  <li className="flex items-start gap-2"><span className="text-primary mt-0.5">✓</span> Plan d'action personnalisé</li>
                </ul>
                <Button variant="hero" size="lg" asChild className="w-full" onClick={() => trackEvent("diagnostic_cta_click", { offer: "ONE_SHOT" })}>
                  <Link to="/one-shot">Réserver mon Audit stratégique <ExternalLink className="w-4 h-4 ml-2" /></Link>
                </Button>
                <Button variant="outline" size="lg" asChild className="w-full" onClick={() => trackEvent("diagnostic_cta_click", { offer: "PREMIUM" })}>
                  <a href={CALENDLY_URL} target="_blank" rel="noopener noreferrer">
                    Découvrir Wav Premium (45 min) <ExternalLink className="w-4 h-4 ml-2" />
                  </a>
                </Button>
                <MailFooter />
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default DiagnosticResult;
