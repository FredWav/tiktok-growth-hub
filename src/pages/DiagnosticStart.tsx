import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { SEOHead } from "@/components/SEOHead";
import { z } from "zod";
import { Mail } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useDiagnostic } from "@/contexts/DiagnosticContext";
import { ArrowRight, ArrowLeft, Users, TrendingUp, Crown, Eye, LayoutList, Coins, ShoppingBag, Clock, Zap, Rocket, DollarSign, HelpCircle } from "lucide-react";
import { trackEvent } from "@/lib/tracking";
import { trackPostHogEvent } from "@/lib/posthog";
import { TrustedBy } from "@/components/TrustedBy";


const TOTAL_STEPS = 7;

const identitySchema = z.object({
  firstName: z.string().trim().min(1, "Prénom requis").max(50),
  tiktokHandle: z.string().trim().min(2, "Pseudo TikTok requis").max(50).regex(/^[a-zA-Z0-9_.]+$/, "Pseudo invalide – lettres, chiffres, _ et . uniquement"),
});

const emailSchema = z.object({
  email: z.string().trim().min(1, "Email requis").email("Adresse email invalide"),
});

const OptionCard = ({
  icon: Icon,
  label,
  description,
  selected,
  onClick,
}: {
  icon: React.ElementType;
  label: string;
  description?: string;
  selected: boolean;
  onClick: () => void;
}) => (
  <button
    onClick={onClick}
    className={`w-full text-left p-5 rounded-xl border-2 transition-all duration-200 flex items-start gap-4 group ${
      selected ? "border-primary bg-primary/10" : "border-border hover:border-primary/50 bg-card"
    }`}
  >
    <div className={`shrink-0 w-10 h-10 rounded-lg flex items-center justify-center transition-colors ${
      selected ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground group-hover:text-primary"
    }`}>
      <Icon className="w-5 h-5" />
    </div>
    <div className="pt-1.5">
      <span className="text-sm md:text-base font-medium text-foreground leading-snug">{label}</span>
      {description && <p className="text-xs text-muted-foreground mt-0.5">{description}</p>}
    </div>
  </button>
);

const DiagnosticStart = () => {
  const [step, setStep] = useState(0);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const leadIdRef = useRef<string | null>(null);
  const navigate = useNavigate();
  const { data, updateField } = useDiagnostic();

  const progress = step === 0 ? 0 : Math.round((Math.min(step, TOTAL_STEPS) / TOTAL_STEPS) * 100);

  const saveLead = async (fields: Record<string, any>, currentStep: number, completed = false) => {
    const mode = leadIdRef.current ? "UPDATE" : "INSERT";
    console.log(`[Diagnostic] saveLead — mode=${mode}, step=${currentStep}, completed=${completed}, fields=`, fields);
    try {
      if (!leadIdRef.current) {
        const { data: row, error } = await supabase
          .from("diagnostic_leads" as any)
          .insert({ ...fields, current_step: currentStep, completed } as any)
          .select("id")
          .single();
        if (error) {
          console.error("[Diagnostic] INSERT error:", error);
        } else if (row) {
          leadIdRef.current = (row as any).id;
          console.log("[Diagnostic] INSERT success, leadId=", leadIdRef.current);
        }
      } else {
        const { error } = await supabase
          .from("diagnostic_leads" as any)
          .update({ ...fields, current_step: currentStep, completed } as any)
          .eq("id", leadIdRef.current);
        if (error) {
          console.error("[Diagnostic] UPDATE error:", error);
        } else {
          console.log("[Diagnostic] UPDATE success, leadId=", leadIdRef.current);
        }
      }
    } catch (e) {
      console.error("[Diagnostic] saveLead exception:", e);
    }
  };

  const getRecommendedOffer = () => {
    const { audience, budget } = data;
    if (budget === "0") return "express";
    if (budget === "1-200" || audience === "0-5k") return "one_shot";
    if (audience === "5k-50k" && budget === "200-500") return "one_shot_plus_premium";
    if (audience === "50k+" && budget === "200-500") return "premium";
    if ((audience === "5k-50k" || audience === "50k+") && budget === "500+") return "premium";
    return "one_shot";
  };

  const handleIdentityNext = () => {
    // Strip leading @ if user types it
    const handle = data.tiktokUrl.replace(/^@/, "");
    console.log("[Diagnostic] handleIdentityNext — firstName:", data.firstName, "tiktokHandle:", handle);
    const result = identitySchema.safeParse({ firstName: data.firstName, tiktokHandle: handle });
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.errors.forEach((e) => {
        const key = e.path[0] as string;
        // Map schema field name to context field name for error display
        fieldErrors[key === "tiktokHandle" ? "tiktokUrl" : key] = e.message;
      });
      console.log("[Diagnostic] Identity validation failed:", fieldErrors);
      setErrors(fieldErrors);
      return;
    }
    // Store cleaned handle back
    updateField("tiktokUrl", handle);
    setErrors({});
    console.log("[Diagnostic] Identity validated → step 2");
    trackEvent("diagnostic_step_identity", { tiktok: handle });
    trackPostHogEvent("step_completed", { step_name: "Identity", value_selected: "completed" });
    saveLead({ first_name: data.firstName, tiktok: handle }, 1);
    setStep(2);
  };

  const handleEmailNext = () => {
    console.log("[Diagnostic] handleEmailNext — email:", data.email);
    const result = emailSchema.safeParse({ email: data.email });
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.errors.forEach((e) => { if (e.path[0]) fieldErrors[e.path[0] as string] = e.message; });
      console.log("[Diagnostic] Email validation failed:", fieldErrors);
      setErrors(fieldErrors);
      return;
    }
    setErrors({});
    console.log("[Diagnostic] Email validated → step 7");
    trackEvent("diagnostic_step_email", { email: data.email });
    trackPostHogEvent("step_completed", { step_name: "Email", value_selected: "completed" });
    saveLead({ email: data.email }, 6);
    setStep(7);
  };

  const handleBlockerNext = () => {
    console.log("[Diagnostic] handleBlockerNext — blocage:", data.blocage.trim());
    if (!data.blocage.trim()) {
      setErrors({ blocage: "Sélectionne une option" });
      return;
    }
    setErrors({});
    trackPostHogEvent("diagnostic_form_submitted", { audience: data.audience, objectif: data.objectif, budget: data.budget, time_available: data.temps });
    const recommendedOffer = getRecommendedOffer();
    console.log("[Diagnostic] handleBlockerNext — recommendedOffer:", recommendedOffer);
    console.log("[Diagnostic] Full context:", {
      firstName: data.firstName,
      tiktokUrl: data.tiktokUrl,
      audience: data.audience,
      objectif: data.objectif,
      budget: data.budget,
      temps: data.temps,
      email: data.email,
      blocage: data.blocage.substring(0, 50) + "...",
      recommendedOffer,
    });
    trackEvent("diagnostic_completed", {
      audience: data.audience,
      objectif: data.objectif,
      budget: data.budget,
      temps: data.temps,
      recommended_offer: recommendedOffer,
    });
    saveLead(
      { blocker: data.blocage, recommended_offer: recommendedOffer },
      7,
      true
    );
    // Notification with response logging
    const notifyPayload = {
      first_name: data.firstName,
      email: data.email,
      tiktok: data.tiktokUrl,
      level: data.audience,
      objective: data.objectif,
      blocker: data.blocage,
      budget: data.budget,
      temps: data.temps,
      recommended_offer: recommendedOffer,
    };
    console.log("[Diagnostic] notify-diagnostic payload:", notifyPayload);
    supabase.functions.invoke("notify-diagnostic", { body: notifyPayload }).then(
      (res) => console.log("[Diagnostic] notify-diagnostic response:", res),
      (err) => console.error("[Diagnostic] notify-diagnostic error:", err)
    );
    sessionStorage.setItem("from_diagnostic", "true");
    console.log("[Diagnostic] Navigating to /processing");
    navigate("/processing");
  };

  const selectOption = (field: keyof typeof data, value: string, dbField: string, stepNum: number) => {
    console.log(`[Diagnostic] selectOption — field=${field}, value=${value}, dbField=${dbField}, step=${stepNum} → ${stepNum + 1}`);
    const stepNameMap: Record<string, string> = { audience: "Audience", objectif: "Objectif", budget: "Budget", temps: "Temps" };
    updateField(field, value);
    trackEvent(`diagnostic_step_${field}`, { [field]: value });
    trackPostHogEvent("step_completed", { step_name: stepNameMap[field] || field, value_selected: value });
    saveLead({ [dbField]: value }, stepNum);
    setTimeout(() => setStep(stepNum + 1), 250);
  };

  return (
    <Layout>
      <SEOHead
        title="Diagnostic Stratégique TikTok Gratuit | Fred Wav"
        description="Identifie ton point de blocage exact sur TikTok en 2 minutes. Diagnostic gratuit pour t'orienter vers la bonne stratégie."
        path="/start"
        keywords="diagnostic TikTok gratuit, audit TikTok, stratégie TikTok, blocage TikTok, Fred Wav"
      />

      {step > 0 && step <= TOTAL_STEPS && (
        <div className="fixed top-16 md:top-20 left-0 right-0 z-40">
          <Progress value={progress} className="h-1.5 rounded-none" />
        </div>
      )}

      <div className="flex-1 flex items-center justify-center px-4 py-12 md:py-20">
        <div className="w-full max-w-2xl">
          {step >= 1 && step <= TOTAL_STEPS && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => { trackEvent("diagnostic_back", { from_step: String(step) }); setStep(step - 1); }}
              className="mb-4 -ml-2 text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="w-4 h-4 mr-1" /> Retour
            </Button>
          )}

          {/* Step 0: Welcome */}
          {step === 0 && (
            <div className="animate-fade-in text-center space-y-8">
              <div className="space-y-4">
                <h1 className="font-display text-3xl md:text-5xl font-bold text-foreground tracking-tight">
                  Diagnostic Stratégique TikTok
                </h1>
                <p className="text-muted-foreground text-base md:text-lg max-w-xl mx-auto leading-relaxed">
                  Identifie ton point de blocage exact et reçois un plan d'action personnalisé en 2 minutes.
                </p>
              </div>
              <Button variant="hero" size="xl" onClick={() => { trackEvent("diagnostic_started"); trackPostHogEvent("diagnostic_started"); setStep(1); }} className="w-full sm:w-auto">
                Démarrer le diagnostic <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
              <TrustedBy filter="diagnostic" className="mt-6" />
            </div>
          )}

          {/* Step 1: Identity */}
          {step === 1 && (
            <div className="animate-fade-in space-y-6">
              <div className="text-center space-y-2 mb-8">
                <p className="text-xs uppercase tracking-widest text-muted-foreground font-medium">Étape 1 sur {TOTAL_STEPS}</p>
                <h2 className="font-display text-2xl md:text-3xl font-bold text-foreground">Qui es-tu ?</h2>
              </div>
              <div className="space-y-4 max-w-md mx-auto">
                <div>
                  <Label htmlFor="firstName">Prénom</Label>
                  <Input id="firstName" value={data.firstName} onChange={(e) => updateField("firstName", e.target.value)} placeholder="Ton prénom" className="mt-1.5" />
                  {errors.firstName && <p className="text-destructive text-xs mt-1">{errors.firstName}</p>}
                </div>
                <div>
                  <Label htmlFor="tiktokUrl">Lien de ton compte TikTok</Label>
                  <Input id="tiktokUrl" value={data.tiktokUrl} onChange={(e) => updateField("tiktokUrl", e.target.value)} placeholder="https://tiktok.com/@toncompte" className="mt-1.5" />
                  {errors.tiktokUrl && <p className="text-destructive text-xs mt-1">{errors.tiktokUrl}</p>}
                </div>
                <Button variant="hero" size="lg" onClick={handleIdentityNext} className="w-full mt-4">
                  Suivant <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </div>
          )}

          {/* Step 2: Audience */}
          {step === 2 && (
            <div className="animate-fade-in space-y-6">
              <div className="text-center space-y-2 mb-8">
                <p className="text-xs uppercase tracking-widest text-muted-foreground font-medium">Étape 2 sur {TOTAL_STEPS}</p>
                <h2 className="font-display text-2xl md:text-3xl font-bold text-foreground">Quelle est la taille de ton audience ?</h2>
              </div>
              <div className="space-y-3 max-w-lg mx-auto">
                <OptionCard icon={Users} label="0 – 5k abonnés" description="Je construis mon audience" selected={data.audience === "0-5k"} onClick={() => selectOption("audience", "0-5k", "level", 2)} />
                <OptionCard icon={TrendingUp} label="5k – 50k abonnés" description="Je développe mon audience" selected={data.audience === "5k-50k"} onClick={() => selectOption("audience", "5k-50k", "level", 2)} />
                <OptionCard icon={Crown} label="50k+ abonnés" description="Je veux optimiser et monétiser" selected={data.audience === "50k+"} onClick={() => selectOption("audience", "50k+", "level", 2)} />
              </div>
            </div>
          )}

          {/* Step 3: Objectif */}
          {step === 3 && (
            <div className="animate-fade-in space-y-6">
              <div className="text-center space-y-2 mb-8">
                <p className="text-xs uppercase tracking-widest text-muted-foreground font-medium">Étape 3 sur {TOTAL_STEPS}</p>
                <h2 className="font-display text-2xl md:text-3xl font-bold text-foreground">Quel est ton objectif n°1 ?</h2>
              </div>
              <div className="space-y-3 max-w-lg mx-auto">
                <OptionCard icon={Eye} label="Gagner en visibilité" selected={data.objectif === "Visibilité"} onClick={() => selectOption("objectif", "Visibilité", "objective", 3)} />
                <OptionCard icon={LayoutList} label="Développer mon audience" selected={data.objectif === "Audience"} onClick={() => selectOption("objectif", "Audience", "objective", 3)} />
                <OptionCard icon={Coins} label="Monétiser mon compte" selected={data.objectif === "Monétiser"} onClick={() => selectOption("objectif", "Monétiser", "objective", 3)} />
                <OptionCard icon={ShoppingBag} label="Vendre un produit ou service" selected={data.objectif === "Vendre"} onClick={() => selectOption("objectif", "Vendre", "objective", 3)} />
              </div>
            </div>
          )}

          {/* Step 4: Budget */}
          {step === 4 && (
            <div className="animate-fade-in space-y-6">
              <div className="text-center space-y-2 mb-8">
                <p className="text-xs uppercase tracking-widest text-muted-foreground font-medium">Étape 4 sur {TOTAL_STEPS}</p>
                <h2 className="font-display text-2xl md:text-3xl font-bold text-foreground">Quel budget es-tu prêt à investir ?</h2>
              </div>
              <div className="space-y-3 max-w-lg mx-auto">
                <OptionCard icon={Eye} label="0 €" description="Je veux juste un état des lieux" selected={data.budget === "0"} onClick={() => selectOption("budget", "0", "budget", 4)} />
                <OptionCard icon={Zap} label="1 – 200 €" selected={data.budget === "1-200"} onClick={() => selectOption("budget", "1-200", "budget", 4)} />
                <OptionCard icon={Rocket} label="200 – 500 €" selected={data.budget === "200-500"} onClick={() => selectOption("budget", "200-500", "budget", 4)} />
                <OptionCard icon={DollarSign} label="500 € +" selected={data.budget === "500+"} onClick={() => selectOption("budget", "500+", "budget", 4)} />
              </div>
            </div>
          )}

          {/* Step 5: Temps */}
          {step === 5 && (
            <div className="animate-fade-in space-y-6">
              <div className="text-center space-y-2 mb-8">
                <p className="text-xs uppercase tracking-widest text-muted-foreground font-medium">Étape 5 sur {TOTAL_STEPS}</p>
                <h2 className="font-display text-2xl md:text-3xl font-bold text-foreground">Combien de temps consacres-tu à TikTok par semaine ?</h2>
              </div>
              <div className="space-y-3 max-w-lg mx-auto">
                <OptionCard icon={Clock} label="Moins de 2h" selected={data.temps === "Moins de 2h"} onClick={() => selectOption("temps", "Moins de 2h", "temps", 5)} />
                <OptionCard icon={Clock} label="2 – 5h" selected={data.temps === "2-5h"} onClick={() => selectOption("temps", "2-5h", "temps", 5)} />
                <OptionCard icon={Clock} label="5 – 10h" selected={data.temps === "5-10h"} onClick={() => selectOption("temps", "5-10h", "temps", 5)} />
                <OptionCard icon={Clock} label="+10h" selected={data.temps === "+10h"} onClick={() => selectOption("temps", "+10h", "temps", 5)} />
              </div>
            </div>
          )}

          {/* Step 6: Email */}
          {step === 6 && (
            <div className="animate-fade-in space-y-6">
              <div className="text-center space-y-2 mb-8">
                <p className="text-xs uppercase tracking-widest text-muted-foreground font-medium">Étape 6 sur {TOTAL_STEPS}</p>
                <h2 className="font-display text-2xl md:text-3xl font-bold text-foreground">Où veux-tu recevoir ton diagnostic ?</h2>
                <p className="text-muted-foreground text-sm">Ton email ne sera jamais partagé. Il sert uniquement à t'envoyer ton diagnostic.</p>
              </div>
              <div className="space-y-4 max-w-md mx-auto">
                <div>
                  <Label htmlFor="email">Adresse email</Label>
                  <Input id="email" type="email" value={data.email} onChange={(e) => updateField("email", e.target.value)} placeholder="ton@email.com" className="mt-1.5" />
                  {errors.email && <p className="text-destructive text-xs mt-1">{errors.email}</p>}
                </div>
                <Button variant="hero" size="lg" onClick={handleEmailNext} className="w-full mt-4">
                  Suivant <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </div>
          )}

          {/* Step 7: Blocage */}
          {step === 7 && (
            <div className="animate-fade-in space-y-6">
              <div className="text-center space-y-2 mb-8">
                <p className="text-xs uppercase tracking-widest text-muted-foreground font-medium">Étape 7 sur {TOTAL_STEPS}</p>
                <h2 className="font-display text-2xl md:text-3xl font-bold text-foreground">Quel est ton blocage principal ?</h2>
                {(data.audience === "5k-50k" || data.audience === "50k+") && (
                  <p className="text-muted-foreground text-sm">Détaille ta situation pour une analyse précise (min. 150 caractères).</p>
                )}
              </div>
              <div className="max-w-lg mx-auto space-y-3">
                <Textarea
                  value={data.blocage}
                  onChange={(e) => updateField("blocage", e.target.value)}
                  placeholder="Décris ce qui te bloque concrètement..."
                  className="min-h-[140px] resize-none"
                />
                {(data.audience === "5k-50k" || data.audience === "50k+") && (
                  <p className="text-xs text-muted-foreground text-right">{data.blocage.length} / 150 caractères</p>
                )}
                {errors.blocage && <p className="text-destructive text-xs">{errors.blocage}</p>}
                <Button variant="hero" size="lg" onClick={handleBlockerNext} className="w-full">
                  Voir mon diagnostic <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default DiagnosticStart;
