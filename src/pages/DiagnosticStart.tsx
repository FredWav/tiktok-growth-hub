import { useState, useEffect } from "react";
import { z } from "zod";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Sprout,
  TrendingUp,
  DollarSign,
  Eye,
  LayoutList,
  Coins,
  ArrowRight,
  Loader2,
  Zap,
  Users,
  Crown,
  Rocket,
  AlertTriangle,
  ExternalLink,
} from "lucide-react";

const identitySchema = z.object({
  firstName: z.string().min(1, "Prénom requis"),
  lastName: z.string().min(1, "Nom requis"),
  email: z.string().email("Email invalide"),
  tiktok: z.string().min(1, "Compte TikTok requis"),
});

type FormData = {
  firstName: string;
  lastName: string;
  email: string;
  tiktok: string;
  level: string;
  objective: string;
  blocker: string;
  budget: string;
};

const TOTAL_STEPS = 5;

const DiagnosticStart = () => {
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [data, setData] = useState<FormData>({
    firstName: "",
    lastName: "",
    email: "",
    tiktok: "",
    level: "",
    objective: "",
    blocker: "",
    budget: "",
  });

  const progress = step === 0 ? 0 : Math.round((Math.min(step, TOTAL_STEPS) / TOTAL_STEPS) * 100);

  const handleIdentityNext = () => {
    const result = identitySchema.safeParse({
      firstName: data.firstName,
      lastName: data.lastName,
      email: data.email,
      tiktok: data.tiktok,
    });
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.errors.forEach((e) => {
        if (e.path[0]) fieldErrors[e.path[0] as string] = e.message;
      });
      setErrors(fieldErrors);
      return;
    }
    setErrors({});
    setStep(2);
  };

  const handleBlockerNext = () => {
    if (data.blocker.trim().length < 10) {
      setErrors({ blocker: "Sois plus précis (10 caractères minimum)" });
      return;
    }
    setErrors({});
    setStep(5);
  };

  const handleBudgetSelect = (budget: string) => {
    setData((prev) => ({ ...prev, budget }));
    setStep(6);
    setLoading(true);
  };

  useEffect(() => {
    if (loading) {
      const timer = setTimeout(() => {
        setLoading(false);
        setShowResult(true);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [loading]);

  const renderResult = () => {
    const configs: Record<string, { title: string; text: string; url: string; cta: string; urgency?: string }> = {
      none: {
        title: "L'accompagnement individuel demande un investissement.",
        text: "En attendant d'avoir les fonds, rejoins la communauté pour commencer à te former gratuitement avec les autres créateurs.",
        url: "https://discord.gg/6ctGNjqUXr",
        cta: "Rejoindre le Discord",
      },
      low: {
        title: "Intervention chirurgicale.",
        text: "Pour ton budget, la meilleure option pour un déblocage immédiat est l'audit stratégique d'1h30. On identifie le problème, on corrige le tir.",
        url: "https://fredwav.com/one-shot",
        cta: "Voir les détails du One-Shot",
      },
      mid: {
        title: "L'écosystème VIP.",
        text: "Ton profil correspond à l'offre VIP. Accès aux ressources froides (cours PDF, replays) et analyse en direct chaque semaine pour structurer ta stratégie.",
        url: "https://fredwav.com/offres/vip",
        cta: "Découvrir le programme VIP",
        urgency: "Seulement 7 places sur 10 disponibles",
      },
      high: {
        title: "Accompagnement Sur-Mesure.",
        text: "Ton profil nécessite un travail en profondeur. Le Wav Premium est conçu pour ça : 6 semaines de suivi 5/7, 1 appel hebdo et toutes les ressources pour exploser tes blocages. On prend un premier contact pour valider qu'on peut bosser ensemble.",
        url: "https://calendly.com/fredwavcm/wav-premium",
        cta: "Réserver mon premier contact",
        urgency: "Limité : 3 places sur 5 disponibles ce mois-ci",
      },
    };

    const config = configs[data.budget] || configs.none;

    return (
      <div className="animate-fade-in text-center space-y-8 max-w-lg mx-auto">
        <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
          <Zap className="w-8 h-8 text-primary" />
        </div>
        <h2 className="font-display text-2xl md:text-3xl font-bold text-foreground">{config.title}</h2>
        <p className="text-muted-foreground text-base md:text-lg leading-relaxed">{config.text}</p>
        {config.urgency && (
          <div className="flex justify-center">
            <Badge variant="destructive" className="text-sm px-4 py-1.5 gap-1.5">
              <AlertTriangle className="w-4 h-4" />
              {config.urgency}
            </Badge>
          </div>
        )}
        <Button variant="hero" size="xl" asChild className="w-full sm:w-auto">
          <a href={config.url} target="_blank" rel="noopener noreferrer">
            {config.cta}
            <ExternalLink className="w-4 h-4 ml-2" />
          </a>
        </Button>
      </div>
    );
  };

  const OptionCard = ({
    icon: Icon,
    label,
    selected,
    onClick,
  }: {
    icon: React.ElementType;
    label: string;
    selected: boolean;
    onClick: () => void;
  }) => (
    <button
      onClick={onClick}
      className={`w-full text-left p-5 rounded-xl border-2 transition-all duration-200 flex items-start gap-4 group ${
        selected
          ? "border-primary bg-primary/10"
          : "border-border hover:border-primary/50 bg-card"
      }`}
    >
      <div
        className={`shrink-0 w-10 h-10 rounded-lg flex items-center justify-center transition-colors ${
          selected ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground group-hover:text-primary"
        }`}
      >
        <Icon className="w-5 h-5" />
      </div>
      <span className="text-sm md:text-base font-medium text-foreground leading-snug pt-2">{label}</span>
    </button>
  );

  return (
    <div className="min-h-screen bg-[hsl(var(--cream))] flex flex-col">
      {/* Progress bar */}
      {step > 0 && step <= TOTAL_STEPS && (
        <div className="fixed top-0 left-0 right-0 z-50">
          <Progress value={progress} className="h-1.5 rounded-none" />
        </div>
      )}

      <div className="flex-1 flex items-center justify-center px-4 py-12 md:py-20">
        <div className="w-full max-w-2xl">
          {/* Screen 0: Welcome */}
          {step === 0 && (
            <div className="animate-fade-in text-center space-y-8">
              <div className="space-y-4">
                <h1 className="font-display text-3xl md:text-5xl font-bold text-foreground tracking-tight">
                  Diagnostic Stratégique TikTok
                </h1>
                <p className="text-muted-foreground text-base md:text-lg max-w-xl mx-auto leading-relaxed">
                  L'objectif de ce diagnostic est d'identifier ton point de blocage exact pour t'orienter vers l'écosystème le plus rentable pour toi. Sois 100% transparent.
                </p>
              </div>
              <Button variant="hero" size="xl" onClick={() => setStep(1)} className="w-full sm:w-auto">
                Démarrer le diagnostic
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </div>
          )}

          {/* Step 1: Identity */}
          {step === 1 && (
            <div className="animate-fade-in space-y-6">
              <div className="text-center space-y-2 mb-8">
                <p className="text-xs uppercase tracking-widest text-muted-foreground font-medium">Étape 1 sur 5</p>
                <h2 className="font-display text-2xl md:text-3xl font-bold text-foreground">Qui es-tu ?</h2>
              </div>
              <div className="space-y-4 max-w-md mx-auto">
                <div>
                  <Label htmlFor="firstName">Prénom</Label>
                  <Input
                    id="firstName"
                    value={data.firstName}
                    onChange={(e) => setData((prev) => ({ ...prev, firstName: e.target.value }))}
                    placeholder="Ton prénom"
                    className="mt-1.5"
                  />
                  {errors.firstName && <p className="text-destructive text-xs mt-1">{errors.firstName}</p>}
                </div>
                <div>
                  <Label htmlFor="lastName">Nom</Label>
                  <Input
                    id="lastName"
                    value={data.lastName}
                    onChange={(e) => setData((prev) => ({ ...prev, lastName: e.target.value }))}
                    placeholder="Ton nom"
                    className="mt-1.5"
                  />
                  {errors.lastName && <p className="text-destructive text-xs mt-1">{errors.lastName}</p>}
                </div>
                <div>
                  <Label htmlFor="email">Email pro</Label>
                  <Input
                    id="email"
                    type="email"
                    value={data.email}
                    onChange={(e) => setData((prev) => ({ ...prev, email: e.target.value }))}
                    placeholder="ton@email.com"
                    className="mt-1.5"
                  />
                  {errors.email && <p className="text-destructive text-xs mt-1">{errors.email}</p>}
                </div>
                <div>
                  <Label htmlFor="tiktok">Ton compte TikTok (Lien ou @)</Label>
                  <Input
                    id="tiktok"
                    value={data.tiktok}
                    onChange={(e) => setData((prev) => ({ ...prev, tiktok: e.target.value }))}
                    placeholder="@toncompte"
                    className="mt-1.5"
                  />
                  {errors.tiktok && <p className="text-destructive text-xs mt-1">{errors.tiktok}</p>}
                </div>
                <Button variant="hero" size="lg" onClick={handleIdentityNext} className="w-full mt-4">
                  Suivant
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </div>
          )}

          {/* Step 2: Level */}
          {step === 2 && (
            <div className="animate-fade-in space-y-6">
              <div className="text-center space-y-2 mb-8">
                <p className="text-xs uppercase tracking-widest text-muted-foreground font-medium">Étape 2 sur 5</p>
                <h2 className="font-display text-2xl md:text-3xl font-bold text-foreground">
                  Comment estimes-tu ton niveau actuel sur TikTok ?
                </h2>
              </div>
              <div className="space-y-3 max-w-lg mx-auto">
                <OptionCard
                  icon={Sprout}
                  label="Je démarre de zéro, je teste encore mon positionnement."
                  selected={data.level === "beginner"}
                  onClick={() => {
                    setData((prev) => ({ ...prev, level: "beginner" }));
                    setTimeout(() => setStep(3), 300);
                  }}
                />
                <OptionCard
                  icon={TrendingUp}
                  label="Je publie régulièrement, mais mes vues stagnent ou sont aléatoires."
                  selected={data.level === "intermediate"}
                  onClick={() => {
                    setData((prev) => ({ ...prev, level: "intermediate" }));
                    setTimeout(() => setStep(3), 300);
                  }}
                />
                <OptionCard
                  icon={DollarSign}
                  label="Je fais des vues, mais je n'arrive pas à convertir et monétiser."
                  selected={data.level === "advanced"}
                  onClick={() => {
                    setData((prev) => ({ ...prev, level: "advanced" }));
                    setTimeout(() => setStep(3), 300);
                  }}
                />
              </div>
            </div>
          )}

          {/* Step 3: Objective */}
          {step === 3 && (
            <div className="animate-fade-in space-y-6">
              <div className="text-center space-y-2 mb-8">
                <p className="text-xs uppercase tracking-widest text-muted-foreground font-medium">Étape 3 sur 5</p>
                <h2 className="font-display text-2xl md:text-3xl font-bold text-foreground">
                  Quel est ton objectif n°1 aujourd'hui ?
                </h2>
              </div>
              <div className="space-y-3 max-w-lg mx-auto">
                <OptionCard
                  icon={Eye}
                  label="Débloquer ma visibilité et toucher la bonne cible."
                  selected={data.objective === "visibility"}
                  onClick={() => {
                    setData((prev) => ({ ...prev, objective: "visibility" }));
                    setTimeout(() => setStep(4), 300);
                  }}
                />
                <OptionCard
                  icon={LayoutList}
                  label="Structurer une vraie stratégie de contenu."
                  selected={data.objective === "strategy"}
                  onClick={() => {
                    setData((prev) => ({ ...prev, objective: "strategy" }));
                    setTimeout(() => setStep(4), 300);
                  }}
                />
                <OptionCard
                  icon={Coins}
                  label="Transformer mon audience TikTok en levier de revenus concrets."
                  selected={data.objective === "monetize"}
                  onClick={() => {
                    setData((prev) => ({ ...prev, objective: "monetize" }));
                    setTimeout(() => setStep(4), 300);
                  }}
                />
              </div>
            </div>
          )}

          {/* Step 4: Blocker */}
          {step === 4 && (
            <div className="animate-fade-in space-y-6">
              <div className="text-center space-y-2 mb-8">
                <p className="text-xs uppercase tracking-widest text-muted-foreground font-medium">Étape 4 sur 5</p>
                <h2 className="font-display text-2xl md:text-3xl font-bold text-foreground">
                  Quel est ton plus gros goulot d'étranglement actuel ?
                </h2>
                <p className="text-muted-foreground text-sm">Sois précis sur ce qui te bloque au quotidien.</p>
              </div>
              <div className="max-w-lg mx-auto space-y-4">
                <Textarea
                  value={data.blocker}
                  onChange={(e) => setData((prev) => ({ ...prev, blocker: e.target.value }))}
                  placeholder="Décris ce qui te bloque concrètement..."
                  className="min-h-[140px] resize-none"
                />
                {errors.blocker && <p className="text-destructive text-xs">{errors.blocker}</p>}
                <Button variant="hero" size="lg" onClick={handleBlockerNext} className="w-full">
                  Dernière étape
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </div>
          )}

          {/* Step 5: Budget */}
          {step === 5 && (
            <div className="animate-fade-in space-y-6">
              <div className="text-center space-y-2 mb-8">
                <p className="text-xs uppercase tracking-widest text-muted-foreground font-medium">Étape 5 sur 5</p>
                <h2 className="font-display text-2xl md:text-3xl font-bold text-foreground">
                  Quel budget es-tu prêt à investir pour une stratégie ROIste ?
                </h2>
              </div>
              <div className="space-y-3 max-w-lg mx-auto">
                <OptionCard
                  icon={Users}
                  label="Je n'ai pas de budget pour le moment."
                  selected={data.budget === "none"}
                  onClick={() => handleBudgetSelect("none")}
                />
                <OptionCard
                  icon={Zap}
                  label="Moins de 200 €"
                  selected={data.budget === "low"}
                  onClick={() => handleBudgetSelect("low")}
                />
                <OptionCard
                  icon={Crown}
                  label="Entre 200 € et 500 €"
                  selected={data.budget === "mid"}
                  onClick={() => handleBudgetSelect("mid")}
                />
                <OptionCard
                  icon={Rocket}
                  label="Entre 500 € et 1000 € ou plus"
                  selected={data.budget === "high"}
                  onClick={() => handleBudgetSelect("high")}
                />
              </div>
            </div>
          )}

          {/* Step 6: Loading + Result */}
          {step === 6 && (
            <div className="flex items-center justify-center min-h-[300px]">
              {loading ? (
                <div className="animate-fade-in text-center space-y-4">
                  <Loader2 className="w-12 h-12 text-primary animate-spin mx-auto" />
                  <p className="text-muted-foreground font-medium text-lg">Analyse de ton profil...</p>
                </div>
              ) : (
                showResult && renderResult()
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DiagnosticStart;
