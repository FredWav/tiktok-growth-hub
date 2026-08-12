import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { CREATORS_COUNT } from "@/config/offers";
import { trackPostHogEvent } from "@/lib/posthog";
import { trackEvent } from "@/lib/tracking";
import { CheckCircle, Loader2, ShieldAlert } from "lucide-react";

const NEWSLETTER_CONSENT_TEXT =
  "J'accepte de recevoir le guide et les conseils de Fred Wav par email. Je peux me désinscrire à tout moment.";

/**
 * Formulaire d'inscription MailerLite, partagé entre /newsletter et /hooks-tiktok.
 *
 * Ne rend que le formulaire et l'écran de succès : chaque page l'habille de son
 * propre titre et de ses arguments. `location` ne sert qu'à l'attribution
 * PostHog — le contrat de l'edge function (`{ email, firstName }`) ne change pas.
 */
export function NewsletterForm({
  location,
  submitLabel = "Recevoir mon guide gratuit",
}: {
  location: string;
  submitLabel?: string;
}) {
  const [firstName, setFirstName] = useState("");
  const [email, setEmail] = useState("");
  const [accepted, setAccepted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const [subscriberCount, setSubscriberCount] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    void import("@/integrations/supabase/client")
      .then(({ supabase }) => supabase.functions.invoke("mailerlite-count"))
      .then(({ data }) => {
        if (!cancelled && data?.count != null) setSubscriberCount(data.count);
      })
      .catch(() => {
        /* échoue en silence — le texte de repli s'affiche */
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // Traduit le message brut de MailerLite en message lisible.
  const friendlyMessage = (raw: string): string => {
    if (/valid email|email.*invalid|email.*format/i.test(raw)) {
      return "Cet email ne semble pas valide. Vérifie-le et réessaie !";
    }
    // MailerLite renvoie un 413 quand le compte a atteint sa limite d'abonnés.
    if (/subscriber limit|exceed/i.test(raw)) {
      return "Les inscriptions sont momentanément saturées. Réessaie un peu plus tard, ou écris-moi à contact@fredwav.com et je t'envoie le guide directement.";
    }
    if (/too many|trop de/i.test(raw)) {
      return "Trop de tentatives récentes. Réessaie un peu plus tard.";
    }
    return "Une erreur est survenue. Réessaie !";
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accepted) {
      setError("Si tu ne coches pas la case, je n'ai pas le droit de t'envoyer de mail !");
      return;
    }
    setLoading(true);
    setError("");

    try {
      const { supabase } = await import("@/integrations/supabase/client");
      const { data, error: fnError } = await supabase.functions.invoke("mailerlite-subscribe", {
        body: { email, firstName, sourcePage: location, consentAccepted: true },
      });

      // Sur une réponse non-2xx, supabase-js remplit `fnError` et laisse `data`
      // à null : le vrai message est dans le corps, relu via `fnError.context`.
      let apiError: string | null = data?.error ?? null;
      if (fnError) {
        const ctx = (fnError as { context?: Response }).context;
        if (ctx && typeof ctx.json === "function") {
          try {
            const body = await ctx.json();
            apiError = body?.error || body?.message || fnError.message;
          } catch {
            apiError = fnError.message;
          }
        } else {
          apiError = fnError.message;
        }
      }

      if (apiError) {
        setError(friendlyMessage(apiError));
        return;
      }

      trackPostHogEvent("newsletter_subscribe", { location });
      trackEvent("newsletter_opt_in", { source_page: location });
      setSuccess(true);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "";
      setError(friendlyMessage(message));
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="text-center space-y-5 py-8">
        <CheckCircle className="h-16 w-16 text-primary mx-auto" />
        <h2 className="text-2xl font-bold text-foreground">Confirme ton inscription</h2>
        <div className="text-left space-y-3 bg-muted/50 border border-border rounded-lg p-5 text-sm text-muted-foreground leading-relaxed">
          <p className="font-semibold text-foreground">Une dernière étape avant de recevoir le guide.</p>
          <p>
            Je viens de t'envoyer un email de confirmation. Clique sur le lien qu'il contient : le guide et mes
            conseils ne seront envoyés qu'après cette confirmation.
          </p>
          <ul className="list-disc list-inside space-y-1.5">
            <li>
              Vérifie tes spams et ajoute <span className="font-medium text-foreground">hello@fredwav.com</span> à
              tes contacts.
            </li>
            <li>
              Si tu es sur Gmail et que l'email atterrit dans l'onglet « Promotions », glisse-le dans ta boîte de
              réception principale.
            </li>
          </ul>
          <p className="font-semibold text-foreground">À tout de suite.</p>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="firstName">Prénom</Label>
        <Input
          id="firstName"
          type="text"
          placeholder="Ton prénom"
          value={firstName}
          onChange={(e) => setFirstName(e.target.value)}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          placeholder="ton@email.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
      </div>

      <div className="flex items-start space-x-3 pt-2">
        <Checkbox id="accept" checked={accepted} onCheckedChange={(v) => setAccepted(v === true)} />
        <label htmlFor="accept" className="text-xs text-muted-foreground leading-relaxed cursor-pointer">
          {NEWSLETTER_CONSENT_TEXT}
        </label>
      </div>

      <p className="text-[11px] text-muted-foreground leading-relaxed">
        Te désinscrire ? Un clic, c'est fait. Tes données ne se vendent pas et ne se partagent pas.
      </p>

      {error && (
        <div className="flex items-start gap-3 bg-amber-50 border border-amber-300 rounded-xl px-4 py-3">
          <ShieldAlert className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
          <p className="text-amber-800 text-sm font-medium leading-snug">{error}</p>
        </div>
      )}

      <Button type="submit" variant="hero" className="w-full" size="xl" disabled={loading}>
        {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
        {loading ? "Envoi…" : submitLabel}
      </Button>

      <p className="text-center text-xs text-muted-foreground">
        Déjà{" "}
        <span className="font-semibold text-foreground">
          {subscriberCount != null ? `${subscriberCount}` : CREATORS_COUNT} créateur
          {subscriberCount !== 1 ? "s" : ""}
        </span>{" "}
        {subscriberCount != null ? "inscrit" + (subscriberCount !== 1 ? "s" : "") : "l'ont téléchargé"}
      </p>
    </form>
  );
}
