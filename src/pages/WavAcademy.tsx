import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useSearchParams, Link } from "react-router-dom";
import {
  ArrowRight,
  CheckCircle2,
  X,
  Check,
  AlertTriangle,
  TrendingUp,
  Zap,
  Radio,
  BarChart3,
  RefreshCw,
  Clock,
  Loader2,
  ChevronDown,
} from "lucide-react";
import { Layout } from "@/components/layout/Layout";
import { Section, SectionHeader } from "@/components/ui/section";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SEOHead } from "@/components/SEOHead";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { trackPostHogEvent } from "@/lib/posthog";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

// ── Types ──────────────────────────────────────────────────────────────────
type Plan = "acces" | "live";

const checkoutSchema = z.object({
  email: z.string().trim().email("Email invalide"),
  discord_user_id: z
    .string()
    .trim()
    .min(17, "L'ID Discord doit contenir au moins 17 chiffres")
    .max(21, "ID Discord invalide")
    .regex(/^\d+$/, "L'ID Discord ne contient que des chiffres"),
});
type CheckoutForm = z.infer<typeof checkoutSchema>;

const plans = {
  acces: {
    name: "WAV ACADEMY · ACCÈS",
    price: "39€",
    period: "/mois",
    credits: "1 000 crédits",
    color: "border-primary/40",
    badge: null,
    accentClass: "text-primary",
  },
  live: {
    name: "WAV ACADEMY · LIVE",
    price: "97€",
    period: "/mois",
    credits: "3 000 crédits",
    color: "border-gold-400",
    badge: "Populaire",
    accentClass: "text-gold-gradient",
  },
};

// ── Proof strip ────────────────────────────────────────────────────────────
const proofItems = [
  "Diagnostic IA instantané",
  "Contenu stratégique quotidien",
  "Méthode data-driven",
  "Format Signature en 15 vidéos",
  "Résultats mesurables",
  "Tapis Roulant anti-procrastination",
];

// ── Problems ───────────────────────────────────────────────────────────────
const problems = [
  "Tu publies 4, 5, 7 vidéos par semaine. Zéro DM. Zéro client.",
  "Des comptes plus petits que le tien explosent du jour au lendemain.",
  "Tu connais les hooks, les CTA, les guides. Mais le lundi matin : \u00abJe fais quoi, concrètement ?\u00bb",
  "Tes vidéos échouent et tu ne sais pas si c'est le montage, le sujet, l'heure ou l'algo.",
];

// ── False solutions ────────────────────────────────────────────────────────
const falseSolutions = [
  {
    title: "Formations YouTube gratuites",
    desc: "Conseils génériques, contradictoires et périmés depuis deux mises à jour d'algorithme.",
  },
  {
    title: "Ebooks à 27€",
    desc: "80 pages de théorie. Aucun diagnostic. Tu refermes le PDF et tu ne sais toujours pas pourquoi ta vidéo a fait 150 vues.",
  },
  {
    title: "Formations en ligne à 497€",
    desc: "Un module par semaine. Pas de feedback. Pas de correction. Tu appliques à la lettre et rien ne bouge.",
  },
  {
    title: "Agences social media",
    desc: "Elles font le travail à ta place. Le jour où tu arrêtes de payer, tu es exactement au même point.",
  },
  {
    title: "Groupes Discord gratuits",
    desc: "Tout le monde donne son avis, personne n'a de résultats. Vous êtes tous les deux à 200 vues.",
  },
];

// ── Results timeline ───────────────────────────────────────────────────────
const timeline = [
  {
    label: "Semaine 1",
    icon: Zap,
    title: "Diagnostic immédiat",
    desc: "Tu passes ta dernière vidéo au WavSocialScan. Tu identifies les 2-3 erreurs qui brident tes résultats. Fini l'aveuglement.",
  },
  {
    label: "30 jours",
    icon: TrendingUp,
    title: "Le pattern émerge",
    desc: "12 à 15 vidéos diagnostiquées. Tu commences à voir quel format retient, quel CTA génère des DM, quelle structure convertit.",
  },
  {
    label: "6 semaines",
    icon: Radio,
    title: "Ton Format Signature",
    desc: "Tu sais quoi poster, comment le structurer, quel hook utiliser. Tu ne postes plus en espérant. Tu postes en sachant.",
  },
  {
    label: "3 mois",
    icon: BarChart3,
    title: "Canal d'acquisition prévisible",
    desc: "Tu sais combien de vidéos il faut pour générer un prospect. Les formats courts ne sont plus une corvée. C'est ton meilleur commercial.",
  },
];

// ── 7 frameworks ──────────────────────────────────────────────────────────
const frameworks = [
  { num: "01", title: "Le Protocole de Diagnostic Rapide", desc: "Lire les analytics de n'importe quelle vidéo en 5 minutes et savoir exactement quoi changer dans la suivante." },
  { num: "02", title: "La Méthode des 3 Secondes", desc: "Construire des hooks qui retiennent 80% de ton audience au-delà de l'ouverture." },
  { num: "03", title: "Les 4 Architectures de Conversion", desc: "Les structures de storytelling qui transforment un viewer en prospect, quelle que soit ta niche." },
  { num: "04", title: "Le Format Signature Accéléré", desc: "Identifier en 15 vidéos diagnostiquées le format qui fonctionne pour toi, au lieu d'en tester 300 à l'aveugle." },
  { num: "05", title: "Le CTA Invisible", desc: "Générer des DM et des prospects sans donner l'impression de vendre." },
  { num: "06", title: "Le Système 3x", desc: "Poster 3 fois par semaine avec plus de résultats qu'en postant tous les jours à l'aveugle." },
  { num: "07", title: "Le Pipeline Formats Courts \u2192 Clients", desc: "Passer de \u00abj'ai des vues\u00bb \u00e0 \u00abj'ai des clients\u00bb en 4 \u00e9tapes claires." },
];

// ── Comparison table ───────────────────────────────────────────────────────
type FeatureValue = boolean | string;
const comparisonFeatures: { label: string; acces: FeatureValue; live: FeatureValue; elite: FeatureValue }[] = [
  { label: "Contenu stratégique quotidien (Tapis Roulant)", acces: true, live: true, elite: true },
  { label: "15 contenus en rotation permanente", acces: true, live: true, elite: true },
  { label: "Discord communautaire", acces: true, live: true, elite: true },
  { label: "Crédits WavSocialScan gratuits", acces: "1 000 /mois", live: "3 000 /mois", elite: "5 000 /mois" },
  { label: "-50% abonnements WavSocialScan", acces: true, live: true, elite: true },
  { label: "Packs thématiques archivés", acces: "À l'achat", live: "À l'achat", elite: "À l'achat" },
  { label: "Live hebdomadaire", acces: false, live: true, elite: true },
  { label: "Discord premium (canaux avancés)", acces: false, live: true, elite: true },
  { label: "Coaching individuel", acces: false, live: "30 min/mois", elite: "1h/semaine" },
  { label: "Accès WhatsApp direct", acces: false, live: false, elite: true },
  { label: "Accompagnement push (relances)", acces: false, live: false, elite: true },
  { label: "Audit algorithmique mensuel", acces: false, live: false, elite: true },
  { label: "Stratégie de monétisation", acces: false, live: false, elite: true },
  { label: "Places disponibles", acces: "Illimitées", live: "20/mois", elite: "5/mois" },
];

// ── Render feature cell ────────────────────────────────────────────────────
function FeatureCell({ value }: { value: FeatureValue }) {
  if (value === true) return <Check className="h-5 w-5 text-primary mx-auto" />;
  if (value === false) return <X className="h-4 w-4 text-muted-foreground/40 mx-auto" />;
  return <span className="text-sm font-medium text-foreground">{value}</span>;
}

// ── Main component ─────────────────────────────────────────────────────────
export default function WavAcademy() {
  const [searchParams] = useSearchParams();
  const isSuccess = searchParams.get("success") === "true";

  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<Plan>("acces");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<CheckoutForm>({
    resolver: zodResolver(checkoutSchema),
    defaultValues: { email: "", discord_user_id: "" },
  });

  const openPlanDialog = (plan: Plan) => {
    setSelectedPlan(plan);
    form.reset();
    setDialogOpen(true);
    trackPostHogEvent("wavclub_checkout_open", { plan });
  };

  const scrollToPlans = () => {
    document.getElementById("plans")?.scrollIntoView({ behavior: "smooth" });
  };

  const onCheckout = async (data: CheckoutForm) => {
    setIsSubmitting(true);
    trackPostHogEvent("wavclub_checkout_submit", { plan: selectedPlan });
    try {
      const { data: result, error } = await supabase.functions.invoke("create-wavacademy-checkout", {
        body: {
          plan: selectedPlan,
          email: data.email,
          discord_user_id: data.discord_user_id,
        },
      });

      if (error) throw new Error(error.message);
      if (!result?.url) throw new Error("URL de paiement manquante");

      window.location.href = result.url;
    } catch (err: unknown) {
      console.error("Checkout error:", err);
      toast.error("Une erreur est survenue. Réessaie ou contacte-nous.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // ── Success state ────────────────────────────────────────────────────────
  if (isSuccess) {
    return (
      <Layout>
        <SEOHead
          title="Bienvenue dans le Wav Academy ! | Fred Wav"
          description="Ton abonnement Wav Academy est confirmé. Rejoins le Discord et commence ton premier diagnostic."
          path="/wavacademy"
        />
        <Section variant="cream" size="xl">
          <div className="max-w-xl mx-auto text-center">
            <CheckCircle2 className="h-16 w-16 text-primary mx-auto mb-6" />
            <h2 className="font-display text-3xl md:text-4xl font-semibold mb-4">
              Bienvenue dans le Wav Academy !
            </h2>
            <p className="text-lg text-muted-foreground mb-4">
              Ton abonnement est confirmé. Ton accès Discord sera activé dans les prochaines minutes — vérifie tes notifications Discord.
            </p>
            <p className="text-muted-foreground mb-8">
              En attendant, prépare le lien de ta dernière vidéo TikTok. Ton premier diagnostic t'attend.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button variant="hero" size="xl" asChild>
                <a href="https://discord.gg/YJx4qr6RaE" target="_blank" rel="noopener noreferrer">
                  Rejoindre le Discord
                  <ArrowRight className="ml-2 h-5 w-5" />
                </a>
              </Button>
              <Button variant="outline" size="xl" asChild>
                <Link to="/">Retour à l'accueil</Link>
              </Button>
            </div>
          </div>
        </Section>
      </Layout>
    );
  }

  return (
    <Layout>
      <SEOHead
        title="Wav Academy — Le système de diagnostic continu pour créateurs | Fred Wav"
        description="Diagnostique chaque vidéo, corrige en temps réel, signe des clients depuis ton téléphone. Le Wav Academy : contenu stratégique quotidien + WavSocialScan."
        path="/wavacademy"
        keywords="wav club, diagnostic tiktok, wavsocialscan, contenu stratégique, formats courts"
      />

      {/* ── HERO ─────────────────────────────────────────────────────────── */}
      <Section variant="cream" size="xl">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-primary/10 text-primary border border-primary/20 rounded-full px-4 py-1.5 text-sm font-medium mb-8">
            <Radio className="h-3.5 w-3.5" />
            Wav Academy — Accès ouvert maintenant
          </div>
          <h1 className="font-display text-4xl md:text-5xl lg:text-6xl font-semibold tracking-tight leading-tight mb-6">
            J'ai arrêté de poster tous les jours.{" "}
            <span className="text-gold-gradient">Mon premier client est arrivé en DM</span>{" "}
            trois semaines plus tard.
          </h1>
          <p className="text-xl md:text-2xl text-muted-foreground mb-4 max-w-3xl mx-auto leading-relaxed">
            Pas grâce à une vidéo virale. Grâce à une vidéo à <strong>843 vues</strong>.
          </p>
          <p className="text-lg text-muted-foreground mb-10 max-w-2xl mx-auto">
            La différence entre un créateur qui cumule les vues et un créateur qui signe des clients&nbsp;?
            Le second sait exactement <strong>quoi mesurer</strong> après chaque vidéo.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button variant="hero" size="xl" onClick={scrollToPlans}>
              Rejoindre le Wav Academy
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            <Button variant="outline" size="xl" asChild>
              <a href="#produit">
                Voir comment ça marche
                <ChevronDown className="ml-2 h-4 w-4" />
              </a>
            </Button>
          </div>
        </div>
      </Section>

      {/* ── PROOF STRIP ──────────────────────────────────────────────────── */}
      <Section variant="dark" size="sm">
        <div className="overflow-hidden">
          <div className="flex gap-8 md:gap-16 flex-wrap justify-center">
            {proofItems.map((item) => (
              <div key={item} className="flex items-center gap-2 text-cream/80 text-sm font-medium whitespace-nowrap">
                <div className="h-1 w-1 rounded-full bg-primary flex-shrink-0" />
                {item}
              </div>
            ))}
          </div>
        </div>
      </Section>

      {/* ── PROBLEMS ─────────────────────────────────────────────────────── */}
      <Section variant="default" size="lg">
        <div className="max-w-3xl mx-auto">
          <SectionHeader
            title="Tu te reconnais peut-être là-dedans."
            subtitle="Ce n'est pas toi. Et je vais te montrer pourquoi."
          />
          <div className="space-y-4">
            {problems.map((p, i) => (
              <div key={i} className="flex items-start gap-4 p-5 rounded-xl border border-border bg-accent/30">
                <AlertTriangle className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5" />
                <p className="text-foreground leading-relaxed">{p}</p>
              </div>
            ))}
          </div>
          <div className="mt-8 p-6 rounded-2xl bg-accent/60 border border-border">
            <p className="text-foreground leading-relaxed">
              <strong>Le pire, ce n'est pas les vues.</strong> Le pire, c'est la sensation. Ce doute qui s'installe, semaine après semaine. "Je suis peut-être pas fait pour ça." "C'est peut-être ma niche." "C'est peut-être moi."
            </p>
            <p className="mt-3 text-lg font-semibold text-primary">Ce n'est pas toi.</p>
          </div>
        </div>
      </Section>

      {/* ── APOCALYPSE ───────────────────────────────────────────────────── */}
      <Section variant="cream" size="lg">
        <div className="max-w-3xl mx-auto">
          <SectionHeader
            title="Voilà ce qui se passe si rien ne change."
            align="left"
          />
          <div className="space-y-6 text-foreground/80 leading-relaxed">
            <p>
              Dans trois mois, tu postes encore. Toujours la même fréquence. Toujours le même plateau de vues. Tu commences à espacer les publications. "Cette semaine, j'ai pas le temps." Puis "ce mois-ci, c'est compliqué." Puis plus rien.
            </p>
            <p>
              Pendant ce temps, tes concurrents, ceux qui postaient aussi mal que toi il y a six mois, ont trouvé leur formule. Ils signent des clients chaque semaine depuis leur téléphone.
            </p>
            <div className="grid sm:grid-cols-3 gap-4 my-8">
              {[
                { panier: "500€", annuel: "6 000€/an" },
                { panier: "1 000€", annuel: "12 000€/an" },
                { panier: "2 000€", annuel: "24 000€/an" },
              ].map(({ panier, annuel }) => (
                <div key={panier} className="text-center p-5 rounded-xl bg-background border border-border">
                  <p className="text-sm text-muted-foreground mb-1">Panier moyen {panier}</p>
                  <p className="font-display text-2xl font-bold text-primary">{annuel}</p>
                  <p className="text-xs text-muted-foreground mt-1">1 client/mois</p>
                </div>
              ))}
            </div>
            <p className="font-semibold text-foreground">
              Le coût de l'inaction, ce n'est pas juste des vues perdues. C'est un canal d'acquisition entier que tu abandonnes. Des milliers d'euros qui atterrissent chez d'autres — pas parce qu'ils sont meilleurs, mais parce qu'ils sont visibles.
            </p>
          </div>
        </div>
      </Section>

      {/* ── FALSE SOLUTIONS ──────────────────────────────────────────────── */}
      <Section variant="default" size="lg">
        <div className="max-w-3xl mx-auto">
          <SectionHeader
            title="Tu as déjà essayé. Soyons honnêtes."
            subtitle="Ces solutions ont un défaut commun : elles te donnent de l'information sans diagnostic."
          />
          <div className="space-y-4">
            {falseSolutions.map((s) => (
              <div key={s.title} className="flex gap-4 p-5 rounded-xl border border-border">
                <X className="h-5 w-5 text-destructive/60 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-foreground mb-1">{s.title}</p>
                  <p className="text-muted-foreground text-sm leading-relaxed">{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-8 p-6 bg-primary/5 border border-primary/20 rounded-2xl">
            <p className="text-foreground leading-relaxed">
              C'est comme avaler des médicaments sans avoir fait de prise de sang. Tu traites des symptômes au hasard. Parfois ça marche. La plupart du temps, non.
            </p>
          </div>
        </div>
      </Section>

      {/* ── BIG IDEA ─────────────────────────────────────────────────────── */}
      <Section variant="cream" size="lg">
        <div className="max-w-3xl mx-auto text-center">
          <p className="text-primary font-semibold uppercase tracking-widest text-sm mb-4">La Grande Idée</p>
          <h2 className="font-display text-3xl md:text-4xl lg:text-5xl font-semibold tracking-tight mb-6">
            Et si le problème n'était pas{" "}
            <span className="text-gold-gradient">ce que tu postes</span>,
            <br />mais ce que tu ne mesures pas&nbsp;?
          </h2>
          <div className="text-left space-y-5 text-foreground/80 leading-relaxed max-w-2xl mx-auto">
            <p>
              Le contenu, c'est <strong>30% du résultat</strong>. Les 70% restants, c'est de la donnée. Savoir lire les signaux que l'algorithme t'envoie après chaque publication.
            </p>
            <p>
              Les créateurs qui signent des clients depuis leurs formats courts savent lire un diagnostic. C'est tout. Ils ne sont pas plus talentueux. Ils ont juste appris à mesurer ce que les autres ignorent.
            </p>
            <div className="grid sm:grid-cols-2 gap-4 my-6">
              <div className="p-4 bg-background rounded-xl border border-border">
                <p className="text-sm font-semibold mb-2">La rétention chute à la seconde 4 ?</p>
                <p className="text-sm text-muted-foreground">→ Tu ne changes pas tout ton contenu. <strong>Tu changes ton hook.</strong></p>
              </div>
              <div className="p-4 bg-background rounded-xl border border-border">
                <p className="text-sm font-semibold mb-2">Le public regarde jusqu'au bout mais ne s'abonne pas ?</p>
                <p className="text-sm text-muted-foreground">→ Tu ne changes pas ton montage. <strong>Tu changes ton CTA.</strong></p>
              </div>
            </div>
            <p className="font-semibold text-foreground text-lg">
              Le format court n'est pas un art. C'est un système de mesure. Et quand tu as le bon outil pour mesurer, tu ne postes plus "en espérant". Tu postes en sachant.
            </p>
          </div>
        </div>
      </Section>

      {/* ── CREDIBILITY ──────────────────────────────────────────────────── */}
      <Section variant="default" size="md">
        <div className="max-w-3xl mx-auto">
          <div className="grid sm:grid-cols-3 gap-6 text-center mb-10">
            <div className="p-6 rounded-2xl bg-accent/40 border border-border">
              <p className="font-display text-4xl font-bold text-primary mb-2">20 ans</p>
              <p className="text-muted-foreground text-sm">d'expérience formats courts</p>
            </div>
            <div className="p-6 rounded-2xl bg-accent/40 border border-border">
              <p className="font-display text-4xl font-bold text-primary mb-2">250+</p>
              <p className="text-muted-foreground text-sm">créateurs accompagnés</p>
            </div>
            <div className="p-6 rounded-2xl bg-accent/40 border border-border">
              <p className="font-display text-4xl font-bold text-primary mb-2">3-6 sem.</p>
              <p className="text-muted-foreground text-sm">pour trouver son Format Signature</p>
            </div>
          </div>
          <div className="p-6 rounded-2xl bg-accent/30 border border-border text-center">
            <p className="text-muted-foreground leading-relaxed">
              Un créateur qui poste sans diagnostic met en moyenne <strong>6 à 12 mois</strong> pour trouver son format.
              Un créateur qui analyse ses résultats après chaque vidéo y arrive en <strong>3 à 6 semaines</strong>.
              <br /><br />
              <span className="font-semibold text-foreground">300 vidéos à l'aveugle, ou 20 vidéos diagnostiquées. Le résultat est le même. Le chemin, non.</span>
            </p>
          </div>
        </div>
      </Section>

      {/* ── PRODUCT ──────────────────────────────────────────────────────── */}
      <Section variant="cream" size="lg" id="produit">
        <div className="max-w-3xl mx-auto">
          <p className="text-primary font-semibold uppercase tracking-widest text-sm mb-4 text-center">Le Système</p>
          <SectionHeader title="C'est la raison pour laquelle j'ai créé le Wav Academy." />

          {/* WavSocialScan */}
          <div className="mb-10 p-8 rounded-2xl bg-background border-2 border-primary/30">
            <div className="flex items-start gap-4 mb-4">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                <Zap className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="font-display text-2xl font-semibold mb-1">Le WavSocialScan</h3>
                <p className="text-muted-foreground text-sm">Ton radiologue avant chaque publication</p>
              </div>
            </div>
            <p className="text-foreground/80 leading-relaxed mb-4">
              Tu colles le lien de ta vidéo TikTok, et en quelques secondes tu reçois un diagnostic complet&nbsp;: score global, qualité du hook, force du CTA, cohérence du message, taux de rétention estimé, transcription audio, recommandations concrètes.
            </p>
            <p className="text-foreground/80 leading-relaxed mb-4">
              Vidéo après vidéo, tu affines ta formule. <strong>En 15 à 20 vidéos diagnostiquées, tu as ton Format Signature.</strong> Celui qui convertit pour toi.
            </p>
            <div className="p-4 bg-primary/5 rounded-xl border border-primary/20">
              <p className="text-sm text-foreground">
                Normalement à partir de <strong>14,90€/mois</strong> en Standard et <strong>39,90€/mois</strong> en Premium.
                En tant que membre du Wav Academy, tu bénéficies de <strong>crédits gratuits chaque mois</strong> selon ta formule, et de{" "}
                <strong>-50% sur tous les abonnements WavSocialScan</strong> si tu veux aller plus loin.
              </p>
            </div>
          </div>

          {/* Tapis Roulant */}
          <div className="p-8 rounded-2xl bg-background border-2 border-border">
            <div className="flex items-start gap-4 mb-4">
              <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center flex-shrink-0">
                <RefreshCw className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <h3 className="font-display text-2xl font-semibold mb-1">Le Tapis Roulant</h3>
                <p className="text-muted-foreground text-sm">Du contenu frais. Chaque jour. Qui disparaît.</p>
              </div>
            </div>
            <p className="text-foreground/80 leading-relaxed mb-4">
              Chaque jour, un nouveau contenu stratégique est publié sur le Discord du Wav Academy. Un framework, un template, une analyse de tendance, une technique applicable le jour même.
            </p>
            <p className="text-foreground/80 leading-relaxed mb-4">
              <strong>Mais voilà le truc.</strong> Quand un nouveau contenu arrive, le plus ancien disparaît. Il y a toujours 15 contenus disponibles simultanément. Après, c'est parti. Pas d'archive illimitée. Pas de "je regarderai plus tard".
            </p>
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl">
                <p className="text-sm font-semibold text-amber-800 mb-1">Anti-procrastination</p>
                <p className="text-sm text-amber-700">L'inaction devient coûteuse. Tu ne peux plus te dire "je le ferai demain".</p>
              </div>
              <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl">
                <p className="text-sm font-semibold text-amber-800 mb-1">Toujours à jour</p>
                <p className="text-sm text-amber-700">Ce qui fonctionne aujourd'hui. Pas il y a 6 mois. <strong>Aujourd'hui.</strong></p>
              </div>
            </div>
          </div>
        </div>
      </Section>

      {/* ── PLANS ────────────────────────────────────────────────────────── */}
      <Section variant="default" size="xl" id="plans">
        <SectionHeader
          title="Choisis ta formule."
          subtitle="Tout le monde n'est pas au même stade. Le Wav Academy s'adapte à ton niveau."
        />

        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {/* Plan ACCÈS */}
          <div className="rounded-2xl border-2 border-primary/30 bg-background p-8 flex flex-col">
            <div className="mb-6">
              <p className="text-xs font-bold tracking-widest text-primary uppercase mb-3">🎧 WAV ACADEMY · ACCÈS</p>
              <div className="flex items-baseline gap-1 mb-1">
                <span className="font-display text-5xl font-bold">39€</span>
                <span className="text-muted-foreground">/mois</span>
              </div>
              <p className="text-sm text-muted-foreground">Le diagnostic hebdomadaire et le contenu stratégique quotidien.</p>
            </div>
            <ul className="space-y-3 mb-8 flex-1">
              {[
                "1 000 crédits WavSocialScan par mois",
                "-50% sur tous les abonnements WavSocialScan",
                "Contenu stratégique quotidien (Tapis Roulant)",
                "15 contenus en rotation permanente",
                "Accès Discord communautaire",
                "Packs thématiques (à l'achat)",
              ].map((f) => (
                <li key={f} className="flex items-start gap-3 text-sm">
                  <Check className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
                  <span>{f}</span>
                </li>
              ))}
              {[
                "Live hebdomadaire",
                "Discord premium",
                "Coaching individuel",
              ].map((f) => (
                <li key={f} className="flex items-start gap-3 text-sm text-muted-foreground/50">
                  <X className="h-4 w-4 flex-shrink-0 mt-0.5" />
                  <span>{f}</span>
                </li>
              ))}
            </ul>
            <p className="text-xs text-muted-foreground mb-4">Pour débuter ou structurer ta stratégie de contenu à ton rythme.</p>
            <Button
              variant="outline"
              size="lg"
              className="w-full"
              onClick={() => openPlanDialog("acces")}
            >
              Rejoindre — 39€/mois
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>

          {/* Plan LIVE */}
          <div className="rounded-2xl border-2 border-primary bg-background p-8 flex flex-col relative shadow-lg shadow-primary/10">
            <div className="absolute -top-4 left-1/2 -translate-x-1/2">
              <span className="bg-primary text-primary-foreground text-xs font-bold px-4 py-1.5 rounded-full uppercase tracking-wide">
                Populaire
              </span>
            </div>
            <div className="mb-6">
              <p className="text-xs font-bold tracking-widest text-primary uppercase mb-3">🎙 WAV ACADEMY · LIVE</p>
              <div className="flex items-baseline gap-1 mb-1">
                <span className="font-display text-5xl font-bold">97€</span>
                <span className="text-muted-foreground">/mois</span>
              </div>
              <p className="text-sm text-muted-foreground">Le diagnostic quasi quotidien et le feedback humain en direct.</p>
            </div>
            <ul className="space-y-3 mb-8 flex-1">
              {[
                "3 000 crédits WavSocialScan par mois",
                "-50% sur tous les abonnements WavSocialScan",
                "Contenu stratégique quotidien (Tapis Roulant)",
                "15 contenus en rotation permanente",
                "Live hebdomadaire avec Fred",
                "Discord premium (canaux avancés)",
                "30 min de coaching individuel/mois",
                "Packs thématiques (à l'achat)",
              ].map((f) => (
                <li key={f} className="flex items-start gap-3 text-sm">
                  <Check className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
                  <span>{f}</span>
                </li>
              ))}
              {[
                "Accès WhatsApp direct",
                "Accompagnement push",
              ].map((f) => (
                <li key={f} className="flex items-start gap-3 text-sm text-muted-foreground/50">
                  <X className="h-4 w-4 flex-shrink-0 mt-0.5" />
                  <span>{f}</span>
                </li>
              ))}
            </ul>
            <p className="text-xs text-muted-foreground mb-4">Places limitées à 20 par mois. Tu as une base d'audience et tu veux accélérer.</p>
            <Button
              variant="hero"
              size="lg"
              className="w-full"
              onClick={() => openPlanDialog("live")}
            >
              Rejoindre — 97€/mois
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>

          {/* Plan ÉLITE */}
          <div className="rounded-2xl border-2 border-border bg-noir text-cream p-8 flex flex-col">
            <div className="mb-6">
              <p className="text-xs font-bold tracking-widest text-primary uppercase mb-3">🚀 WAV ACADEMY · ÉLITE</p>
              <div className="flex items-baseline gap-1 mb-1">
                <span className="font-display text-5xl font-bold">1 500€</span>
                <span className="text-cream/60">/mois</span>
              </div>
              <p className="text-sm text-cream/60">L'accompagnement total. Le diagnostic quasi illimité et moi dans ta poche.</p>
            </div>
            <ul className="space-y-3 mb-8 flex-1">
              {[
                "5 000 crédits WavSocialScan par mois",
                "1h de coaching individuel par semaine",
                "Accès WhatsApp direct",
                "Accompagnement push (relances)",
                "Audit algorithmique mensuel complet",
                "Stratégie de monétisation personnalisée",
                "Live hebdomadaire",
                "Discord premium",
                "-50% abonnements WavSocialScan",
              ].map((f) => (
                <li key={f} className="flex items-start gap-3 text-sm text-cream/80">
                  <Check className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
                  <span>{f}</span>
                </li>
              ))}
            </ul>
            <p className="text-xs text-cream/40 mb-4">Sur candidature. Limité à 5 nouvelles places par mois.</p>
            <Button
              variant="outline"
              size="lg"
              className="w-full border-cream/20 text-cream hover:bg-cream/10 hover:text-cream"
              asChild
            >
              <Link to="/wav-premium/candidature">
                Candidater à l'Élite
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>

        <p className="text-center text-sm text-muted-foreground mt-8">
          Aucun engagement longue durée. Tu restes tant que tu progresses. Tu pars quand tu veux.
        </p>
      </Section>

      {/* ── TIMELINE ─────────────────────────────────────────────────────── */}
      <Section variant="cream" size="lg">
        <SectionHeader
          title="Ce qui se passe dès que tu rejoins."
          subtitle="Des résultats concrets, semaine après semaine."
        />
        <div className="max-w-3xl mx-auto grid sm:grid-cols-2 gap-6">
          {timeline.map(({ label, icon: Icon, title, desc }) => (
            <div key={label} className="p-6 rounded-2xl bg-background border border-border">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Icon className="h-4 w-4 text-primary" />
                </div>
                <span className="text-xs font-bold text-primary uppercase tracking-wide">{label}</span>
              </div>
              <h3 className="font-display text-lg font-semibold mb-2">{title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </Section>

      {/* ── 7 FRAMEWORKS ─────────────────────────────────────────────────── */}
      <Section variant="default" size="lg">
        <SectionHeader
          title="Ce que tu vas maîtriser."
          subtitle="7 systèmes. Des résultats mesurables à chaque étape."
        />
        <div className="max-w-3xl mx-auto space-y-4">
          {frameworks.map(({ num, title, desc }) => (
            <div key={num} className="flex gap-5 p-5 rounded-xl border border-border hover:border-primary/30 transition-colors">
              <span className="font-display text-2xl font-bold text-primary/30 flex-shrink-0 w-8">{num}</span>
              <div>
                <h3 className="font-semibold text-foreground mb-1">{title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </Section>

      {/* ── FUTURE VISUALIZATION ─────────────────────────────────────────── */}
      <Section variant="cream" size="lg">
        <div className="max-w-3xl mx-auto">
          <p className="text-primary font-semibold uppercase tracking-widest text-sm mb-4 text-center">Imagine.</p>
          <SectionHeader title="C'est un vendredi après-midi. Ton téléphone vibre." />
          <div className="p-8 rounded-2xl bg-background border-2 border-primary/20 mb-8">
            <p className="text-xl font-semibold text-foreground text-center italic">
              "J'ai vu ta vidéo sur [ton sujet]. C'est exactement ce que je cherche. Comment on travaille ensemble ?"
            </p>
          </div>
          <div className="space-y-5 text-foreground/80 leading-relaxed">
            <p>Tu n'as pas prospecté. Tu n'as pas envoyé de cold DM. Tu n'as pas payé de pub. <strong>Ta vidéo a fait le travail.</strong></p>
            <p>Et tu sais pourquoi elle a marché. Parce que le WavSocialScan t'a montré, il y a trois semaines, que ton ancien format de hook perdait 40% de l'audience en 3 secondes. Tu as changé. Tes vues ont stagné, mais ton taux de DM a triplé.</p>
            <p className="font-semibold text-foreground text-lg">Tu préfères 500 vues avec un client que 5 000 vues avec zéro.</p>
            <p>Les réseaux ne sont plus une corvée. C'est ton meilleur commercial. Il bosse 24h/24, il ne demande pas de salaire, et il ramène des prospects qualifiés pendant que tu dors.</p>
          </div>
        </div>
      </Section>

      {/* ── COMPARISON TABLE ─────────────────────────────────────────────── */}
      <Section variant="default" size="lg">
        <SectionHeader title="Toutes les formules, en un coup d'œil." />
        <div className="max-w-5xl mx-auto overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr>
                <th className="text-left p-4 text-sm font-semibold text-muted-foreground w-1/2"></th>
                <th className="text-center p-4 text-sm">
                  <div className="font-bold text-foreground">ACCÈS</div>
                  <div className="text-primary font-semibold">39€/mois</div>
                </th>
                <th className="text-center p-4 text-sm bg-primary/5 rounded-t-xl">
                  <div className="font-bold text-foreground">LIVE</div>
                  <div className="text-primary font-semibold">97€/mois</div>
                  <div className="text-xs text-primary font-medium mt-0.5">⭐ Populaire</div>
                </th>
                <th className="text-center p-4 text-sm">
                  <div className="font-bold text-foreground">ÉLITE</div>
                  <div className="text-primary font-semibold">1 500€/mois</div>
                </th>
              </tr>
            </thead>
            <tbody>
              {comparisonFeatures.map(({ label, acces, live, elite }) => (
                <tr key={label} className="border-t border-border/50">
                  <td className="p-4 text-sm text-foreground/80">{label}</td>
                  <td className="p-4 text-center"><FeatureCell value={acces} /></td>
                  <td className="p-4 text-center bg-primary/5"><FeatureCell value={live} /></td>
                  <td className="p-4 text-center"><FeatureCell value={elite} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>

      {/* ── URGENCY CTA ──────────────────────────────────────────────────── */}
      <Section variant="dark" size="xl">
        <div className="max-w-3xl mx-auto text-center">
          <div className="flex items-center justify-center gap-2 text-primary mb-6">
            <Clock className="h-5 w-5" />
            <span className="text-sm font-semibold uppercase tracking-wide">L'algorithme ne t'attend pas</span>
          </div>
          <h2 className="font-display text-3xl md:text-4xl lg:text-5xl font-semibold text-cream mb-6">
            Chaque semaine sans diagnostic, c'est{" "}
            <span className="text-gold-gradient">3 à 5 vidéos postées à l'aveugle</span>.
          </h2>
          <p className="text-cream/70 text-lg mb-4">
            Sur un mois, c'est 15 à 20 vidéos non diagnostiquées. Sur trois mois, 60.
          </p>
          <p className="text-cream/70 mb-10">
            Pendant ce temps, ceux qui sont dans le Wav Academy diagnostiquent chaque vidéo, corrigent chaque semaine, et captent l'audience qui aurait dû être la tienne.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-6">
            <Button
              variant="hero"
              size="xl"
              onClick={() => openPlanDialog("live")}
            >
              Rejoindre le Wav Academy · Live — 97€/mois
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            <Button
              variant="outline"
              size="xl"
              className="border-cream/20 text-cream hover:bg-cream/10 hover:text-cream"
              onClick={() => openPlanDialog("acces")}
            >
              Commencer avec l'Accès — 39€/mois
            </Button>
          </div>
          <p className="text-cream/40 text-sm">
            Aucun engagement. Résiliation en 1 clic. Le Tapis Roulant, lui, continue de tourner.
          </p>
        </div>
      </Section>

      {/* ── CHECKOUT DIALOG ──────────────────────────────────────────────── */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display text-2xl">
              {selectedPlan === "acces" ? "WAV ACADEMY · ACCÈS — 39€/mois" : "WAV ACADEMY · LIVE — 97€/mois"}
            </DialogTitle>
            <DialogDescription>
              Complète ces informations pour finaliser ton inscription. Tu seras redirigé vers le paiement sécurisé.
            </DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onCheckout)} className="space-y-5 mt-2">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Adresse email *</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="ton@email.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="discord_user_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Ton ID Discord *</FormLabel>
                    <FormControl>
                      <Input type="text" placeholder="123456789012345678" {...field} />
                    </FormControl>
                    <p className="text-xs text-muted-foreground mt-1.5 leading-snug">
                      Nécessaire pour activer ton rôle Discord automatiquement après le paiement.{" "}
                      <strong>Comment le trouver&nbsp;:</strong> ouvre Discord → Paramètres utilisateur → Avancé → active "Mode développeur" → reviens sur ton profil → clic droit → "Copier l'identifiant".
                    </p>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="pt-2">
                <Button
                  type="submit"
                  variant="hero"
                  size="lg"
                  className="w-full"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Création du lien de paiement…
                    </>
                  ) : (
                    <>
                      Procéder au paiement
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </>
                  )}
                </Button>
                <p className="text-xs text-muted-foreground text-center mt-3">
                  Paiement sécurisé par Stripe · Sans engagement · Résiliation en 1 clic
                </p>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </Layout>
  );
}
