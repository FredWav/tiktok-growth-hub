import { useState } from "react";
import { Layout } from "@/components/layout/Layout";
import { Section } from "@/components/ui/section";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { SEOHead } from "@/components/SEOHead";
import { CheckCircle, Loader2, Gift, Zap, FileText, Lightbulb } from "lucide-react";

const benefits = [
  { icon: Zap, text: "120+ hooks prêts à l'emploi testés sur des millions de vues" },
  { icon: FileText, text: "Les structures exactes qui captent l'attention en moins de 2 secondes" },
  { icon: Lightbulb, text: "Les erreurs fatales qui tuent ta rétention (et comment les corriger)" },
];

export default function MailPage() {
  const [firstName, setFirstName] = useState("");
  const [email, setEmail] = useState("");
  const [accepted, setAccepted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accepted) {
      setError("Tu dois accepter de recevoir les conseils.");
      return;
    }
    setLoading(true);
    setError("");

    try {
      const { data, error: fnError } = await supabase.functions.invoke(
        "mailerlite-subscribe",
        { body: { email, firstName } }
      );

      if (fnError) throw fnError;
      if (data?.error) throw new Error(data.error);

      setSuccess(true);
    } catch {
      setError("Une erreur est survenue. Réessaie !");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <SEOHead
        title="Guide des Hooks Gratuit (valeur 27€) — Fred Wav"
        description="Télécharge gratuitement le guide des 120+ hooks TikTok qui captent l'attention en moins de 2 secondes. Testés sur des millions de vues."
        path="/mail"
        keywords="guide hooks tiktok, hooks gratuits, accroches tiktok, rétention tiktok, Fred Wav"
      />

      <Section className="bg-background py-20 md:py-32">
        <div className="max-w-lg mx-auto">
          <div className="bg-card border border-border rounded-xl overflow-hidden shadow-lg">

            {/* Badge valeur */}
            <div className="bg-primary text-primary-foreground text-center py-2.5 px-4">
              <span className="text-sm font-semibold tracking-wide">ACCÈS GRATUIT — Guide exclusif abonnés</span>
            </div>

            <div className="p-8">
              {success ? (
                <div className="text-center space-y-5 py-8">
                  <CheckCircle className="h-16 w-16 text-primary mx-auto" />
                  <h2 className="text-2xl font-bold text-foreground">
                    Ton guide arrive !
                  </h2>
                  <div className="text-left space-y-3 bg-muted/50 border border-border rounded-lg p-5 text-sm text-muted-foreground leading-relaxed">
                    <p className="font-semibold text-foreground">Une dernière chose avant qu'on commence.</p>
                    <p>Mon premier email avec ton guide est déjà en route. Pour être sûr de le recevoir :</p>
                    <ul className="list-disc list-inside space-y-1.5">
                      <li>Vérifie tes spams et ajoute <span className="font-medium text-foreground">hello@fredwav.com</span> à tes contacts.</li>
                      <li>Si tu es sur Gmail et que l'email atterrit dans l'onglet "Promotions", glisse-le dans ta boîte de réception principale. Ça prend 3 secondes et ça change tout pour la suite.</li>
                    </ul>
                    <p>Et <span className="font-medium text-foreground">réponds-moi dès le premier email</span>. Je t'offre une belle ressource si tu joues le jeu.</p>
                    <p className="font-semibold text-foreground">À tout de suite.</p>
                  </div>
                </div>
              ) : (
                <>
                  <div className="text-center mb-8 space-y-4">
                    <div className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-primary/10 mb-2">
                      <Gift className="h-8 w-8 text-primary" />
                    </div>
                    <h1 className="font-display text-2xl md:text-3xl font-bold text-foreground leading-tight">
                      Reçois le guide Ultime des hooks{" "}
                      <s className="text-muted-foreground font-normal">d'une valeur de 27€</s>{" "}
                      <span className="text-gold-gradient">gratuitement</span>
                    </h1>
                    <p className="text-sm font-semibold text-primary mt-1">
                      Réservé à mes abonnés les plus motivés
                    </p>
                    <p className="text-muted-foreground text-sm leading-relaxed">
                      Le même guide que j'utilise avec mes clients Wav Premium pour construire des accroches qui retiennent l'attention dès la première seconde.
                    </p>
                  </div>

                  {/* Benefits */}
                  <div className="space-y-3 mb-8">
                    {benefits.map((b, i) => (
                      <div key={i} className="flex items-start gap-3 text-sm">
                        <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center shrink-0 mt-0.5">
                          <b.icon className="h-4 w-4 text-primary" />
                        </div>
                        <span className="text-foreground">{b.text}</span>
                      </div>
                    ))}
                  </div>

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
                      <Checkbox
                        id="accept"
                        checked={accepted}
                        onCheckedChange={(v) => setAccepted(v === true)}
                      />
                      <label
                        htmlFor="accept"
                        className="text-xs text-muted-foreground leading-relaxed cursor-pointer"
                      >
                        J'accepte de recevoir le guide et les conseils de FredWav !
                      </label>
                    </div>

                    <p className="text-[11px] text-muted-foreground leading-relaxed">
                      Te désinscrire ? Un clic, c'est fait, pas de drama. Tes données ne bougent pas, ne se vendent pas, ne se partagent pas. Ici on est entre nous, pas sur une marketplace à la con.
                    </p>

                    {error && (
                      <p className="text-destructive text-sm">{error}</p>
                    )}

                    <Button
                      type="submit"
                      variant="hero"
                      className="w-full"
                      size="xl"
                      disabled={loading}
                    >
                      {loading ? (
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      ) : null}
                      {loading ? "Envoi..." : "Recevoir mon guide gratuit"}
                    </Button>

                    <p className="text-center text-xs text-muted-foreground">
                      Déjà <span className="font-semibold text-foreground">300+ créateurs</span> l'ont téléchargé
                    </p>
                  </form>
                </>
              )}
            </div>
          </div>
        </div>
      </Section>
    </Layout>
  );
}
