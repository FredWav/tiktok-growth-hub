import { useState } from "react";
import { Layout } from "@/components/layout/Layout";
import { Section } from "@/components/ui/section";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { SEOHead } from "@/components/SEOHead";
import { CheckCircle, Mail, Loader2 } from "lucide-react";

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
        title="Newsletter — FredWav"
        description="Reçois les meilleurs conseils de Fred, ton conseiller anti-bullshit pour TikTok."
        path="/mail"
      />

      <Section className="bg-background py-20 md:py-32">
        <div className="max-w-md mx-auto">
          <div className="bg-card border border-border rounded-xl p-8 shadow-lg">
            {success ? (
              <div className="text-center space-y-5 py-8">
                <CheckCircle className="h-16 w-16 text-primary mx-auto" />
                <h2 className="text-2xl font-bold text-foreground">
                  Merci !
                </h2>
                <div className="text-left space-y-3 bg-muted/50 border border-border rounded-lg p-5 text-sm text-muted-foreground leading-relaxed">
                  <p className="font-semibold text-foreground">Une dernière chose avant qu'on commence.</p>
                  <p>Mon premier email est déjà en route. Pour être sûr de le recevoir :</p>
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
                <div className="text-center mb-8 space-y-3">
                  <div className="inline-flex items-center justify-center h-14 w-14 rounded-full bg-primary/10 mb-2">
                    <Mail className="h-7 w-7 text-primary" />
                  </div>
                  <h1 className="text-2xl md:text-3xl font-bold text-foreground leading-tight">
                    Les meilleurs conseils de Fred, ton conseiller anti-bullshit
                  </h1>
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    Ton prénom, ton mail, et c'est parti. Les prochains conseils que tu vas recevoir, 90% des créateurs les cherchent encore !
                  </p>
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
                      J'accepte de recevoir les meilleurs conseils de FredWav !
                    </label>
                  </div>

                  <p className="text-[11px] text-muted-foreground leading-relaxed">
                    Te désinscrire ? Un clic, c'est fait, pas de drama. Tes données ne bougent pas, ne se vendent pas, ne se partagent pas. Ici on est entre nous, pas sur une marketplace à la con. Le seul risque, c'est de louper le mail qui aurait tout changé !
                  </p>

                  {error && (
                    <p className="text-destructive text-sm">{error}</p>
                  )}

                  <Button
                    type="submit"
                    className="w-full"
                    size="lg"
                    disabled={loading}
                  >
                    {loading ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : null}
                    {loading ? "Envoi..." : "Je veux recevoir tes conseils"}
                  </Button>
                </form>
              </>
            )}
          </div>
        </div>
      </Section>
    </Layout>
  );
}
