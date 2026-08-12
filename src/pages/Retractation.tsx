import { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { CheckCircle2, Mail, ShieldCheck } from "lucide-react";
import { Layout } from "@/components/layout/Layout";
import { Section } from "@/components/ui/section";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const WITHDRAWAL_DECLARATION_VERSION = "2026-08-11.v1";
const WITHDRAWAL_DECLARATION_TEXT =
  "Je notifie expressément ma décision de me rétracter du contrat identifié ci-dessus.";

type Receipt = {
  reference: string;
  receivedAt: string;
  emailSent: boolean;
  declarationVersion: string;
  declarationText: string;
};

export default function Retractation() {
  const [customerName, setCustomerName] = useState("");
  const [email, setEmail] = useState("");
  const [orderReference, setOrderReference] = useState("");
  const [offer, setOffer] = useState("analyse_express");
  const [orderDate, setOrderDate] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [receipt, setReceipt] = useState<Receipt | null>(null);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke("withdrawal-request", {
        body: {
          intent: "withdraw",
          declaration_version: WITHDRAWAL_DECLARATION_VERSION,
          declaration_text: WITHDRAWAL_DECLARATION_TEXT,
          customer_name: customerName,
          email,
          order_reference: orderReference,
          offer,
          order_date: orderDate || null,
          message: message || null,
        },
      });

      if (error || !data?.success || !data?.reference || !data?.received_at) {
        throw new Error(data?.error || error?.message || "Impossible d'enregistrer la demande");
      }

      setReceipt({
        reference: data.reference,
        receivedAt: data.received_at,
        emailSent: data.email_sent === true,
        declarationVersion: WITHDRAWAL_DECLARATION_VERSION,
        declarationText: WITHDRAWAL_DECLARATION_TEXT,
      });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Une erreur est survenue");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <Section variant="default" size="lg">
        <div className="mx-auto max-w-3xl pt-12 md:pt-16">
          <div className="mb-10 text-center">
            <div className="mb-5 inline-flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
              <ShieldCheck className="h-6 w-6" aria-hidden="true" />
            </div>
            <h1 className="font-display text-3xl font-semibold md:text-4xl">
              Exercer votre droit de rétractation
            </h1>
            <p className="mx-auto mt-4 max-w-2xl text-muted-foreground">
              Utilisez ce formulaire pour notifier sans ambiguïté votre décision de vous rétracter. Aucun motif n'est exigé. Après l'enregistrement, une référence horodatée s'affiche immédiatement et un accusé est transmis par email lorsque la messagerie est disponible.
            </p>
          </div>

          {receipt ? (
            <div className="rounded-2xl border border-primary/30 bg-primary/5 p-6 md:p-8" aria-live="polite">
              <CheckCircle2 className="mb-4 h-10 w-10 text-primary" aria-hidden="true" />
              <h2 className="font-display text-2xl font-semibold">Demande enregistrée</h2>
              <p className="mt-3 text-muted-foreground">
                Votre demande a été reçue le{" "}
                <strong className="text-foreground">
                  {new Intl.DateTimeFormat("fr-FR", {
                    dateStyle: "long",
                    timeStyle: "short",
                    timeZone: "Europe/Paris",
                  }).format(new Date(receipt.receivedAt))}
                </strong>.
              </p>
              <p className="mt-2 text-muted-foreground">
                Référence à conserver : <strong className="text-foreground">{receipt.reference}</strong>
              </p>
              <div className="mt-5 rounded-lg border border-border bg-background/70 p-4 text-sm">
                <p className="font-medium text-foreground">Déclaration enregistrée</p>
                <p className="mt-1 text-xs text-muted-foreground">Version {receipt.declarationVersion}</p>
                <p className="mt-3 text-muted-foreground">{receipt.declarationText}</p>
              </div>
              {receipt.emailSent ? (
                <p className="mt-4 flex items-start gap-2 text-sm text-muted-foreground">
                  <Mail className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                  L'accusé de réception a été accepté par le serveur de messagerie pour l'adresse indiquée. Pensez à vérifier les courriers indésirables.
                </p>
              ) : (
                <p className="mt-4 rounded-lg border border-amber-500/40 bg-amber-500/10 p-3 text-sm">
                  La demande est bien enregistrée, mais l'accusé de réception n'a pas pu être envoyé. Conservez cette référence et écrivez à{" "}
                  <a className="font-medium text-primary underline" href="mailto:contact@fredwav.com">
                    contact@fredwav.com
                  </a>.
                </p>
              )}
              <p className="mt-5 text-sm text-muted-foreground">
                L'éligibilité sera examinée selon la date de commande, l'état d'exécution de la prestation et les exceptions légales applicables. Cet enregistrement ne confirme pas automatiquement un remboursement.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6 rounded-2xl border border-border bg-card p-6 shadow-sm md:p-8">
              <div className="grid gap-5 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="withdrawal-name">Nom et prénom</Label>
                  <Input
                    id="withdrawal-name"
                    value={customerName}
                    onChange={(event) => setCustomerName(event.target.value)}
                    autoComplete="name"
                    maxLength={120}
                    required
                    disabled={loading}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="withdrawal-email">Email utilisé pour la commande</Label>
                  <Input
                    id="withdrawal-email"
                    type="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    autoComplete="email"
                    maxLength={254}
                    required
                    disabled={loading}
                  />
                </div>
              </div>

              <div className="grid gap-5 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="withdrawal-offer">Prestation concernée</Label>
                  <select
                    id="withdrawal-offer"
                    value={offer}
                    onChange={(event) => setOffer(event.target.value)}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    disabled={loading}
                  >
                    <option value="analyse_express">Analyse Express</option>
                    <option value="wav_academy">Wav Academy</option>
                    <option value="wav_premium">Wav Premium</option>
                    <option value="other">Autre prestation</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="withdrawal-order-date">Date de commande (facultatif)</Label>
                  <Input
                    id="withdrawal-order-date"
                    type="date"
                    value={orderDate}
                    onChange={(event) => setOrderDate(event.target.value)}
                    max={new Date().toISOString().slice(0, 10)}
                    disabled={loading}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="withdrawal-order-reference">Référence de commande</Label>
                <Input
                  id="withdrawal-order-reference"
                  value={orderReference}
                  onChange={(event) => setOrderReference(event.target.value)}
                  placeholder="Numéro indiqué dans l'email Stripe ou de confirmation"
                  maxLength={160}
                  required
                  disabled={loading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="withdrawal-message">Message complémentaire (facultatif)</Label>
                <Textarea
                  id="withdrawal-message"
                  value={message}
                  onChange={(event) => setMessage(event.target.value)}
                  placeholder="Vous n'avez pas à justifier votre décision. Ce champ sert uniquement à ajouter une précision utile."
                  maxLength={2_000}
                  rows={5}
                  disabled={loading}
                />
              </div>

              <div className="rounded-lg bg-muted/50 p-4 text-sm text-muted-foreground">
                <p className="font-medium text-foreground">{WITHDRAWAL_DECLARATION_TEXT}</p>
                <p className="mt-2 text-xs">Déclaration version {WITHDRAWAL_DECLARATION_VERSION}</p>
                <p className="mt-3">Consultez les modalités et exceptions à l'article 9 des{" "}
                <Link to="/cgv" className="font-medium text-primary underline underline-offset-2">
                  CGV
                </Link>.</p>
              </div>

              <Button type="submit" variant="hero" size="lg" className="w-full" disabled={loading}>
                {loading ? "Enregistrement…" : "Confirmer ma rétractation"}
              </Button>
            </form>
          )}

          <p className="mt-8 text-center text-sm text-muted-foreground">
            Vous pouvez aussi utiliser le formulaire modèle des CGV ou écrire à{" "}
            <a href="mailto:contact@fredwav.com" className="text-primary underline underline-offset-2">
              contact@fredwav.com
            </a>.
          </p>
        </div>
      </Section>
    </Layout>
  );
}
