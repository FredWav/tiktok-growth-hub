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
  Loader2,
} from "lucide-react";
import { Layout } from "@/components/layout/Layout";
import { VideoCard } from "@/components/VideoCard";
import { Section, SectionHeader } from "@/components/ui/section";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { Checkbox } from "@/components/ui/checkbox";
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/components/ui/accordion";

const checkoutSchema = z.object({
  email: z.string().trim().email("Email invalide"),
  consent_cgv: z.literal(true, {
    errorMap: () => ({ message: "Tu dois accepter les CGV pour continuer" }),
  }),
  consent_renonciation: z.literal(true, {
    errorMap: () => ({ message: "La renonciation au droit de rétractation est requise pour un accès immédiat" }),
  }),
});
type CheckoutForm = z.infer<typeof checkoutSchema>;

// ── Stats dynamiques ───────────────────────────────────────────────────────
const AUDIOVISUAL_START_YEAR = 2006;
const SHORT_FORMATS_START_YEAR = 2020;
const yearsSince = (startYear: number) =>
  new Date().getFullYear() - startYear;

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
  "Tu connais les hooks, les CTA, les guides. Mais le lundi matin : «Je fais quoi, concrètement ?»",
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
  { num: "07", title: "Le Pipeline Formats Courts → Clients", desc: "Passer de «j'ai des vues» à «j'ai des clients» en 4 étapes claires." },
];

// ── Formules (grille d'ancrage cash-flow) ──────────────────────────────────
// Accès identique partout — seuls le prix, la durée et le mode de facturation changent.
// 1 mois = abonnement récurrent (leurre d'ancrage) ; 3 & 6 mois = paiement unique prépayé.
type Plan = {
  term: string;
  months: number;
  monthly: number;
  total: number;
  save: string | null;
  label: string;
  recurring: boolean;
  note: string;
  highlight?: boolean;
  badge?: string;
};

const PLANS: Plan[] = [
  {
    term: "1m", months: 1, monthly: 159, total: 159, save: null, label: "1 mois",
    recurring: true, note: "Sans engagement · résiliable en 1 clic",
  },
  {
    term: "3m", months: 3, monthly: 129, total: 387, save: "-19 %", label: "3 mois",
    recurring: false, note: "Paiement unique · accès 3 mois",
  },
  {
    term: "6m", months: 6, monthly: 99, total: 594, save: "-38 %", label: "6 mois",
    recurring: false, note: "Paiement unique · accès 6 mois",
    highlight: true, badge: "Meilleure offre",
  },
];

// Avantages communs à toutes les formules.
const PLAN_FEATURES = [
  "Contenu stratégique quotidien (Tapis Roulant)",
  "15 contenus en rotation permanente",
  "Live hebdomadaire avec Fred",
  "Discord premium (canaux avancés)",
];

// ── Témoignages vidéo ───────────────────────────────────────────────────────
// 6 témoignages sélectionnés par Fred, ordre validé.
const VIDEO_TESTIMONIALS = [
  { id: "XMMmmLLKue4", alt: "Témoignage client Wav Academy — retour d'expérience" },
  { id: "Bzw7nwqB2rQ", alt: "Témoignage client Wav Academy — retour d'expérience" },
  { id: "hwTyjA6BORY", alt: "Témoignage client Wav Academy — transformation de présence en ligne" },
  { id: "FrMFqiAqAkU", alt: "Témoignage client Wav Academy — impact sur la stratégie de contenu" },
  { id: "s-VaJvfFqbM", alt: "Témoignage client Wav Academy — croissance après accompagnement" },
  { id: "cc1cRfCEJGE", alt: "Témoignage client Wav Academy — résultats après coaching" },
];

// ── FAQ ─────────────────────────────────────────────────────────────────────
const FAQ = [
  {
    q: "Je débute totalement, c'est pour moi ?",
    a: "Oui. Le principe du Wav Academy, c'est justement de ne plus poster à l'aveugle. Tu diagnostiques chaque vidéo avec le WavSocialScan et tu corriges au fur et à mesure — que tu en sois à ta 3e ou à ta 300e vidéo. Tu avances avec une méthode, pas en devinant.",
  },
  {
    q: "Concrètement, qu'est-ce que je reçois une fois inscrit ?",
    a: "Un accès au Discord premium du Wav Academy (canaux avancés), 3 000 crédits WavSocialScan chaque mois (≈ 30 analyses de vidéo ou 10 analyses de compte), le Tapis Roulant (un contenu stratégique frais chaque jour, 15 en rotation permanente) et le live hebdomadaire avec Fred.",
  },
  {
    q: "Combien de temps ça me prend par semaine ?",
    a: "Le système est fait pour les créateurs déjà occupés. Une analyse de vidéo prend quelques minutes, et le Tapis Roulant te donne une action concrète applicable le jour même. Tu peux en faire autant ou aussi peu que tu veux — mais plus tu diagnostiques, plus vite tu trouves ton Format Signature.",
  },
  {
    q: "Le WavSocialScan est-il vraiment inclus ?",
    a: "Oui. Il coûte normalement de 14,90€/mois (Standard) à 39,90€/mois (Premium). En tant que membre, tu reçois 3 000 crédits gratuits chaque mois, inclus dans ta formule.",
  },
  {
    q: "Je peux annuler ?",
    a: "La formule 1 mois est sans engagement et résiliable en 1 clic, à tout moment. Les formules 3 et 6 mois sont des paiements uniques, sans reconduction : tu bloques un tarif mensuel plus bas et l'accès s'arrête simplement à la fin de la période, sans rien à résilier.",
  },
  {
    q: "Comment je reçois mes accès après le paiement ?",
    a: "Juste après le paiement, tu reçois un email avec ton lien d'activation Discord (valable 7 jours). Tu te connectes avec ton compte Discord et ton rôle est attribué automatiquement. Pense à vérifier tes spams.",
  },
];

// ── Main component ───────────────────────────────────────────────────────────
export default function WavAcademy() {
  const [searchParams] = useSearchParams();
  const isSuccess = searchParams.get("success") === "true";
  // Mode test : ?test=1 fait passer le checkout sur les liens Stripe sandbox (cartes 4242).
  // Invisible pour les visiteurs normaux ; aucun impact sur le tunnel live.
  const testMode = searchParams.get("test") === "1";

  const [dialogOpen, setDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedTerm, setSelectedTerm] = useState<string>("6m");

  const selectedPlan = PLANS.find((p) => p.term === selectedTerm) ?? PLANS[2];

  const form = useForm<CheckoutForm>({
    resolver: zodResolver(checkoutSchema),
    defaultValues: {
      email: "",
      consent_cgv: false as unknown as true,
      consent_renonciation: false as unknown as true,
    },
    mode: "onChange",
  });

  const scrollToPlans = () => {
    document.getElementById("plans")?.scrollIntoView({ behavior: "smooth" });
  };

  const selectPlan = (term: string) => {
    setSelectedTerm(term);
    form.reset();
    setDialogOpen(true);
    trackPostHogEvent("wavclub_checkout_open", { term });
  };

  const onCheckout = async (data: CheckoutForm) => {
    setIsSubmitting(true);
    trackPostHogEvent("wavclub_checkout_submit", { term: selectedTerm });
    try {
      const { data: result, error } = await supabase.functions.invoke("record-wavacademy-consent", {
        body: {
          term: selectedTerm,
          email: data.email,
          consent_cgv: data.consent_cgv,
          consent_renonciation: data.consent_renonciation,
          ...(testMode ? { mode: "test" } : {}),
        },
      });

      if (error) throw new Error(error.message);
      if (!result?.payment_url) throw new Error("URL de paiement manquante");

      window.location.href = result.payment_url;
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
              Paiement confirmé !
            </h2>
            <p className="text-lg text-muted-foreground mb-4">
              Vérifie ta boîte mail — un email avec ton lien d'activation Discord vient d'être envoyé.
            </p>
            <p className="text-muted-foreground mb-8">
              Tu auras juste à te connecter avec ton compte Discord, et ton rôle sera attribué automatiquement. Le lien est valable 7 jours.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
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
        keywords="wav academy, diagnostic tiktok, wavsocialscan, contenu stratégique, formats courts"
      />

      {testMode && (
        <div className="bg-amber-500 text-black text-center text-sm font-semibold py-2 px-4">
          🧪 MODE TEST — paiements en sandbox Stripe (carte 4242 4242 4242 4242). Aucun argent réel.
        </div>
      )}

      {/* ── HERO (VSL) ───────────────────────────────────────────────────── */}
      <Section variant="cream" size="xl">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-primary/10 text-primary border border-primary/20 rounded-full px-4 py-1.5 text-sm font-medium mb-8">
            <Radio className="h-3.5 w-3.5" />
            Wav Academy — Accès ouvert maintenant
          </div>
          <h1 className="font-display text-4xl md:text-5xl lg:text-6xl font-semibold tracking-tight leading-tight mb-6">
            Diagnostique chaque vidéo, corrige en temps réel,{" "}
            <span className="text-gold-gradient">signe des clients depuis ton téléphone.</span>
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
            Le Wav Academy : contenu stratégique quotidien + WavSocialScan pour transformer tes formats courts en canal d'acquisition prévisible.
          </p>
          <div className="max-w-3xl mx-auto mb-10">
            <VideoCard
              id="TbKmQOXUt8s"
              alt="Wav Academy — Présentation par Fred Wav"
              location="wavacademy_vsl"
            />
          </div>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button variant="hero" size="xl" onClick={scrollToPlans}>
              Rejoindre Wav Academy
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </div>
          <p className="text-sm text-muted-foreground mt-4">
            À partir de 159€/mois sans engagement · ou 99€/mois en formule 6 mois
          </p>
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
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 text-center mb-10">
            <div className="p-6 rounded-2xl bg-accent/40 border border-border">
              <p className="font-display text-4xl font-bold text-primary mb-2">{yearsSince(AUDIOVISUAL_START_YEAR)} ans</p>
              <p className="text-muted-foreground text-sm">d'expérience dans l'audiovisuel</p>
            </div>
            <div className="p-6 rounded-2xl bg-accent/40 border border-border">
              <p className="font-display text-4xl font-bold text-primary mb-2">{yearsSince(SHORT_FORMATS_START_YEAR)} ans</p>
              <p className="text-muted-foreground text-sm">sur les formats courts</p>
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
            <div className="p-4 bg-primary/5 rounded-xl border border-primary/20 space-y-2">
              <p className="text-sm text-foreground">
                Normalement à partir de <strong>14,90€/mois</strong> en Standard et <strong>39,90€/mois</strong> en Premium.
                En tant que membre du Wav Academy, tu bénéficies de <strong>3 000 crédits gratuits chaque mois</strong>.
              </p>
              <p className="text-xs text-muted-foreground">
                💡 <strong>100 crédits = 1 analyse de vidéo</strong> · <strong>300 crédits = 1 analyse de compte complet</strong>
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

      {/* ── TÉMOIGNAGES VIDÉO ────────────────────────────────────────────── */}
      <Section variant="default" size="lg">
        <SectionHeader
          title="Ils sont passés de l'aveuglement aux résultats."
          subtitle="Des retours authentiques, face caméra. Pas des promesses — des créateurs qui ont appliqué la méthode."
        />
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {VIDEO_TESTIMONIALS.map((video) => (
            <VideoCard
              key={video.id}
              id={video.id}
              alt={video.alt}
              location="wavacademy_testimonials"
            />
          ))}
        </div>
      </Section>

      {/* ── PLANS (grille d'ancrage) ─────────────────────────────────────── */}
      <Section variant="cream" size="xl" id="plans">
        <SectionHeader
          title="Choisis ta formule Wav Academy."
          subtitle="Le même accès complet. Plus tu t'engages longtemps, moins c'est cher au mois."
        />

        <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto items-stretch">
          {PLANS.map((plan) => (
            <div
              key={plan.term}
              className={`rounded-2xl bg-background p-6 flex flex-col relative ${
                plan.highlight
                  ? "border-2 border-primary shadow-lg shadow-primary/10 md:scale-105 order-first md:order-none"
                  : "border border-border shadow-sm"
              }`}
            >
              {plan.badge && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                  <span className="bg-primary text-primary-foreground text-xs font-bold px-4 py-1.5 rounded-full uppercase tracking-wide whitespace-nowrap">
                    {plan.badge}
                  </span>
                </div>
              )}
              <div className="mb-5">
                <div className="flex items-center justify-between mb-3 min-h-[1.5rem]">
                  <p className="text-xs font-bold tracking-widest text-primary uppercase">{plan.label}</p>
                  {plan.save && (
                    <span className="text-xs font-bold text-emerald-600 bg-emerald-50 border border-emerald-200 rounded-full px-2.5 py-0.5">
                      {plan.save}
                    </span>
                  )}
                </div>
                <div className="flex items-baseline gap-1 mb-1">
                  <span className="font-display text-5xl font-bold">{plan.monthly}€</span>
                  <span className="text-muted-foreground">/mois</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  {plan.recurring ? "Facturé chaque mois" : `soit ${plan.total}€ une seule fois`}
                </p>
              </div>
              <p className="text-xs text-muted-foreground mb-6 min-h-[2rem]">{plan.note}</p>
              <Button
                variant={plan.highlight ? "hero" : "outline"}
                size="lg"
                className="w-full mt-auto"
                onClick={() => selectPlan(plan.term)}
              >
                Choisir {plan.label}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>

        {/* Avantages communs à toutes les formules */}
        <div className="max-w-2xl mx-auto mt-10 p-6 rounded-2xl bg-accent/30 border border-border">
          <p className="text-sm font-semibold text-center mb-5">🎙 Inclus dans toutes les formules</p>
          <ul className="grid sm:grid-cols-2 gap-x-6 gap-y-3">
            <li className="flex items-start gap-3 text-sm sm:col-span-2">
              <Check className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold">3 000 crédits WavSocialScan/mois</span>
                <p className="text-xs text-muted-foreground mt-0.5">≈ 30 analyses de vidéo ou 10 analyses de compte</p>
              </div>
            </li>
            {PLAN_FEATURES.map((f) => (
              <li key={f} className="flex items-start gap-3 text-sm">
                <Check className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
                <span>{f}</span>
              </li>
            ))}
          </ul>
        </div>

        <p className="text-center text-sm text-muted-foreground mt-8 max-w-2xl mx-auto">
          Le <strong>1 mois</strong> est sans engagement, résiliable en 1 clic. Les formules{" "}
          <strong>3 et 6 mois</strong> sont des paiements uniques&nbsp;: tu bloques un tarif mensuel plus bas, sans reconduction.
        </p>

        {/* Réassurance */}
        <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-3 mt-8 text-sm text-muted-foreground">
          <span className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-primary flex-shrink-0" />
            Paiement sécurisé par Stripe
          </span>
          <span className="flex items-center gap-2">
            <RefreshCw className="h-4 w-4 text-primary flex-shrink-0" />
            Formule 1 mois résiliable en 1 clic
          </span>
          <span className="flex items-center gap-2">
            <Zap className="h-4 w-4 text-primary flex-shrink-0" />
            Accès immédiat après paiement
          </span>
        </div>
      </Section>

      {/* ── TIMELINE ─────────────────────────────────────────────────────── */}
      <Section variant="default" size="lg">
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
      <Section variant="cream" size="lg">
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
      <Section variant="default" size="lg">
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

      {/* ── FAQ ──────────────────────────────────────────────────────────── */}
      <Section variant="cream" size="lg">
        <div className="max-w-3xl mx-auto">
          <SectionHeader title="Les questions que tu te poses." />
          <Accordion type="single" collapsible className="w-full">
            {FAQ.map((item, i) => (
              <AccordionItem key={i} value={`faq-${i}`}>
                <AccordionTrigger className="text-left font-semibold">
                  {item.q}
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground leading-relaxed">
                  {item.a}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </Section>

      {/* ── URGENCY CTA ──────────────────────────────────────────────────── */}
      <Section variant="dark" size="xl">
        <div className="max-w-3xl mx-auto text-center">
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
              onClick={scrollToPlans}
            >
              Rejoindre Wav Academy
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </div>
          <p className="text-cream/40 text-sm">
            À partir de 159€/mois sans engagement, ou 99€/mois en formule 6 mois. Le Tapis Roulant, lui, continue de tourner.
          </p>
        </div>
      </Section>

      {/* ── CHECKOUT DIALOG ──────────────────────────────────────────────── */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display text-2xl">
              WAV ACADEMY — {selectedPlan.label} ·{" "}
              {selectedPlan.recurring ? `${selectedPlan.monthly}€/mois` : `${selectedPlan.total}€`}
            </DialogTitle>
            <DialogDescription>
              {selectedPlan.recurring
                ? "Abonnement mensuel, sans engagement — résiliable à tout moment. Complète ces informations, tu seras redirigé vers le paiement sécurisé."
                : `Accès ${selectedPlan.months} mois · soit ${selectedPlan.monthly}€/mois · paiement unique, sans reconduction. Complète ces informations, tu seras redirigé vers le paiement sécurisé.`}
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

              <div className="space-y-3 rounded-md border border-border/60 bg-muted/30 p-4">
                <FormField
                  control={form.control}
                  name="consent_cgv"
                  render={({ field }) => (
                    <FormItem className="flex items-start gap-3 space-y-0">
                      <FormControl>
                        <Checkbox
                          checked={field.value === true}
                          onCheckedChange={(v) => field.onChange(v === true)}
                          className="mt-0.5"
                        />
                      </FormControl>
                      <div className="flex-1">
                        <FormLabel className="text-sm font-normal leading-snug cursor-pointer">
                          J'accepte les{" "}
                          <Link to="/cgv" target="_blank" rel="noopener noreferrer" className="text-primary underline underline-offset-2">
                            Conditions Générales de Vente
                          </Link>
                          .
                        </FormLabel>
                        <FormMessage className="mt-1" />
                      </div>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="consent_renonciation"
                  render={({ field }) => (
                    <FormItem className="flex items-start gap-3 space-y-0">
                      <FormControl>
                        <Checkbox
                          checked={field.value === true}
                          onCheckedChange={(v) => field.onChange(v === true)}
                          className="mt-0.5"
                        />
                      </FormControl>
                      <div className="flex-1">
                        <FormLabel className="text-sm font-normal leading-snug cursor-pointer">
                          Je souhaite démarrer immédiatement et renonce expressément à mon droit de rétractation de 14 jours, conformément à l'article L221-28 du Code de la consommation.
                        </FormLabel>
                        <FormMessage className="mt-1" />
                      </div>
                    </FormItem>
                  )}
                />
              </div>

              <div className="pt-2">
                <Button
                  type="submit"
                  variant="hero"
                  size="lg"
                  className="w-full"
                  disabled={isSubmitting || !form.formState.isValid}
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
                  Paiement sécurisé par Stripe ·{" "}
                  {selectedPlan.recurring
                    ? "Sans engagement · Résiliation en 1 clic"
                    : "Paiement unique · Sans reconduction"}
                </p>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* ── CTA flottant mobile ──────────────────────────────────────────── */}
      <div className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-background/95 backdrop-blur border-t border-border px-4 py-3 flex items-center justify-between gap-3 shadow-[0_-4px_20px_rgba(0,0,0,0.08)]">
        <div className="leading-tight">
          <p className="text-xs text-muted-foreground">Wav Academy</p>
          <p className="text-sm font-semibold">dès 99€/mois</p>
        </div>
        <Button variant="hero" size="lg" className="flex-shrink-0" onClick={scrollToPlans}>
          Rejoindre
          <ArrowRight className="ml-1.5 h-4 w-4" />
        </Button>
      </div>
    </Layout>
  );
}
