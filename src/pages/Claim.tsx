import { useEffect, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { Loader2, CheckCircle2, AlertTriangle, Clock } from "lucide-react";
import { Layout } from "@/components/layout/Layout";
import { Section } from "@/components/ui/section";
import { Button } from "@/components/ui/button";
import { SEOHead } from "@/components/SEOHead";
import { supabase } from "@/integrations/supabase/client";

type Status = "loading" | "valid" | "claimed" | "expired" | "invalid" | "error";

const DISCORD_CLIENT_ID = import.meta.env.VITE_DISCORD_CLIENT_ID as string | undefined;
const DISCORD_OAUTH_REDIRECT_URI = import.meta.env.VITE_DISCORD_OAUTH_REDIRECT_URI as string | undefined;

export default function Claim() {
  const { token } = useParams<{ token: string }>();
  const [searchParams] = useSearchParams();
  const errorReason = searchParams.get("reason");
  const isErrorRoute = !token; // /claim/error

  const [status, setStatus] = useState<Status>("loading");
  const [planLabel, setPlanLabel] = useState<string>("Wav Academy");

  useEffect(() => {
    if (isErrorRoute) {
      setStatus("error");
      return;
    }
    if (!token) {
      setStatus("invalid");
      return;
    }

    const fetchStatus = async () => {
      try {
        const { data, error } = await supabase.functions.invoke("wavacademy-claim-status", {
          method: "GET" as never,
          // @ts-expect-error supabase-js doesn't type query for GET
          query: { token },
        });
        if (error) throw error;
        if (data?.plan_label) setPlanLabel(data.plan_label);
        const s = data?.status as Status | undefined;
        setStatus(s === "valid" || s === "claimed" || s === "expired" || s === "invalid" ? s : "error");
      } catch (e) {
        console.error("Failed to fetch claim status:", e);
        // Fallback: try a direct fetch
        try {
          const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/wavacademy-claim-status?token=${encodeURIComponent(token)}`;
          const r = await fetch(url, {
            headers: { apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string },
          });
          const j = await r.json();
          if (j?.plan_label) setPlanLabel(j.plan_label);
          setStatus(j?.status ?? "error");
        } catch {
          setStatus("error");
        }
      }
    };
    fetchStatus();
  }, [token, isErrorRoute]);

  const handleConnectDiscord = () => {
    if (!token || !DISCORD_CLIENT_ID || !DISCORD_OAUTH_REDIRECT_URI) {
      console.error("Missing Discord OAuth config");
      return;
    }
    const url = new URL("https://discord.com/oauth2/authorize");
    url.searchParams.set("client_id", DISCORD_CLIENT_ID);
    url.searchParams.set("redirect_uri", DISCORD_OAUTH_REDIRECT_URI);
    url.searchParams.set("response_type", "code");
    url.searchParams.set("scope", "identify guilds.join");
    url.searchParams.set("state", token);
    url.searchParams.set("prompt", "consent");
    window.location.href = url.toString();
  };

  return (
    <Layout>
      <SEOHead
        title="Activer mon accès Wav Academy | Fred Wav"
        description="Connecte ton compte Discord pour activer ton rôle Wav Academy."
        path="/claim"
      />
      <Section variant="cream" size="xl">
        <div className="max-w-xl mx-auto text-center">
          {status === "loading" && (
            <>
              <Loader2 className="h-12 w-12 text-primary mx-auto mb-6 animate-spin" />
              <p className="text-muted-foreground">Vérification de ton lien…</p>
            </>
          )}

          {status === "valid" && (
            <>
              <CheckCircle2 className="h-16 w-16 text-primary mx-auto mb-6" />
              <h1 className="font-display text-3xl md:text-4xl font-semibold mb-4">
                Bienvenue dans le {planLabel}
              </h1>
              <p className="text-lg text-muted-foreground mb-8">
                Connecte-toi avec ton compte Discord pour activer automatiquement ton rôle sur le serveur. Ça prend 5 secondes.
              </p>
              <Button variant="hero" size="xl" onClick={handleConnectDiscord}>
                Se connecter avec Discord
              </Button>
              <p className="text-xs text-muted-foreground mt-6">
                Tu autorises uniquement notre bot à t'ajouter au serveur et te donner ton rôle. Aucun accès à tes messages.
              </p>
            </>
          )}

          {status === "claimed" && (
            <>
              <CheckCircle2 className="h-16 w-16 text-primary mx-auto mb-6" />
              <h1 className="font-display text-3xl md:text-4xl font-semibold mb-4">Ton accès est déjà actif</h1>
              <p className="text-muted-foreground mb-8">
                Le rôle {planLabel} a déjà été attribué à ton compte Discord. Direction le serveur !
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Button variant="hero" size="xl" asChild>
                  <a href="https://discord.gg/YJx4qr6RaE" target="_blank" rel="noopener noreferrer">
                    Ouvrir Discord
                  </a>
                </Button>
                <Button variant="outline" size="xl" asChild>
                  <Link to="/">Retour à l'accueil</Link>
                </Button>
              </div>
            </>
          )}

          {status === "expired" && (
            <>
              <Clock className="h-16 w-16 text-amber-500 mx-auto mb-6" />
              <h1 className="font-display text-3xl md:text-4xl font-semibold mb-4">Lien expiré</h1>
              <p className="text-muted-foreground mb-8">
                Ce lien d'activation a expiré (durée de validité : 7 jours). Contacte-nous pour qu'on t'en renvoie un nouveau.
              </p>
              <Button variant="hero" size="xl" asChild>
                <Link to="/contact">Nous contacter</Link>
              </Button>
            </>
          )}

          {status === "invalid" && (
            <>
              <AlertTriangle className="h-16 w-16 text-destructive mx-auto mb-6" />
              <h1 className="font-display text-3xl md:text-4xl font-semibold mb-4">Lien invalide</h1>
              <p className="text-muted-foreground mb-8">
                Ce lien d'activation n'existe pas ou a déjà été utilisé. Si tu viens de payer, vérifie le dernier email reçu.
              </p>
              <Button variant="outline" size="xl" asChild>
                <Link to="/contact">Nous contacter</Link>
              </Button>
            </>
          )}

          {status === "error" && (
            <>
              <AlertTriangle className="h-16 w-16 text-destructive mx-auto mb-6" />
              <h1 className="font-display text-3xl md:text-4xl font-semibold mb-4">
                {errorReason ? "Activation interrompue" : "Une erreur est survenue"}
              </h1>
              <p className="text-muted-foreground mb-2">
                {errorReason
                  ? "L'autorisation Discord n'a pas abouti. Tu peux réessayer depuis le lien reçu par email."
                  : "Réessaie dans quelques instants. Si le problème persiste, contacte-nous."}
              </p>
              {errorReason && (
                <p className="text-xs text-muted-foreground mb-8">Code : {errorReason}</p>
              )}
              <Button variant="outline" size="xl" asChild>
                <Link to="/contact">Nous contacter</Link>
              </Button>
            </>
          )}
        </div>
      </Section>
    </Layout>
  );
}
