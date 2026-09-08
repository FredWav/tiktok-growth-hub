import { type FormEvent, useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { Section } from "@/components/ui/section";
import { Button } from "@/components/ui/button";
import { commerceCall, money } from "@/lib/commerce";

type EnrollmentData = {
  offer: string;
  first_name: string;
  amount_cents: number;
  amount_received: number;
  start_date: string;
  start_time: string;
  starts_at: string;
  sales_enabled: boolean;
  status: string;
  accepted: boolean;
  cgv_text: string;
  early_text: string;
  payment_url: string | null;
  transfer_instructions: string | null;
  reference: string;
};
export default function Enrollment() {
  const { token } = useParams();
  const [data, setData] = useState<EnrollmentData | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const load = useCallback(async (body: Record<string, unknown> = {}) => {
    setBusy(true);
    setError("");
    try {
      setData(
        await commerceCall<EnrollmentData>("enrollment", { token, ...body }),
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : "Inscription indisponible.");
    } finally {
      setBusy(false);
    }
  }, [token]);
  useEffect(() => {
    void load();
  }, [load]);
  function accept(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const f = new FormData(event.currentTarget);
    void load({
      action: "accept",
      consent_cgv: f.get("cgv") === "on",
      early_start: f.get("early") === "on",
      expected_starts_at: data?.starts_at,
    });
  }
  return (
    <Layout variant="landing">
      <Section size="lg">
        <div className="max-w-2xl mx-auto space-y-6">
          <h1 className="font-display text-3xl">Ton inscription personnelle</h1>
          {busy && <p role="status">Vérification en cours…</p>}
          {error && <p role="alert" className="text-destructive">{error}</p>}
          {data && (
            <>
              <p>
                Bonjour{" "}
                {data.first_name}. Voici les modalités convenues avec Fred pour
                Wav {data.offer === "academy" ? "Academy" : "Premium"}.
              </p>
              <dl className="rounded-xl border border-border p-6 space-y-3">
                <div>
                  <dt>Prix total TTC</dt>
                  <dd className="font-semibold">{money(data.amount_cents)}</dd>
                </div>
                <div>
                  <dt>Début convenu (heure de Paris)</dt>
                  <dd>
                    {data.start_date.split("-").reverse().join("/")}
                    {data.offer === "premium"
                      ? ` à ${data.start_time.slice(0, 5)}`
                      : ""}
                  </dd>
                </div>
                <div>
                  <dt>Durée</dt>
                  <dd>
                    {data.offer === "academy"
                      ? "Six mois de date à date, sans reconduction"
                      : "Trente jours à partir du premier rendez-vous"}
                  </dd>
                </div>
                <div>
                  <dt>Montant encaissé et confirmé</dt>
                  <dd>{money(data.amount_received)}</dd>
                </div>
              </dl>
              {data.status === "needs_reschedule"
                ? (
                  <p role="status">
                    Le règlement est arrivé après la date prévue. Contacte Fred
                    pour convenir d’une nouvelle date. Aucun accès n’a été
                    antidaté.
                  </p>
                )
                : !data.accepted
                ? (
                  <form onSubmit={accept} className="space-y-5">
                    <p>
                      Consulte le{" "}
                      <Link
                        to={data.offer === "academy"
                          ? "/wavacademy"
                          : "/wav-premium"}
                        className="underline"
                      >
                        programme
                      </Link>{" "}
                      et les{" "}
                      <Link to="/cgv" target="_blank" className="underline">
                        CGV
                      </Link>{" "}
                      avant de confirmer.
                    </p>
                    <label className="flex gap-3">
                      <input
                        name="cgv"
                        type="checkbox"
                        required
                        className="h-5 w-5 mt-1 shrink-0"
                      />
                      <span>{data.cgv_text}</span>
                    </label>
                    <label className="flex gap-3">
                      <input
                        name="early"
                        type="checkbox"
                        className="h-5 w-5 mt-1 shrink-0"
                      />
                      <span>{data.early_text}</span>
                    </label>
                    <p className="text-sm text-muted-foreground">
                      Sans demande de démarrage anticipé, conviens avec Fred
                      d’une date après le délai légal de 14 jours.
                    </p>
                    <Button disabled={busy} type="submit">
                      Confirmer les modalités
                    </Button>
                  </form>
                )
                : (
                  <>
                    <p role="status">
                      Modalités acceptées. L’accès nécessite le paiement
                      intégral et n’est ouvert qu’à la date convenue.
                    </p>
                    {data.amount_received === 0 && !data.sales_enabled && <p role="status">Les nouveaux règlements sont temporairement suspendus. Contacte Fred ; ne règle pas depuis un ancien lien.</p>}
                    {data.amount_received === 0 && data.sales_enabled && (
                      <div className="space-y-5">
                        <h2 className="font-display text-2xl">
                          Choisis ton moyen de paiement
                        </h2>
                        {data.payment_url
                          ? (
                            <Button asChild>
                              <a href={data.payment_url} rel="noreferrer">
                                Payer en ligne
                              </a>
                            </Button>
                          )
                          : (
                            <p>
                              Pour le paiement en ligne, demande le lien à Fred.
                            </p>
                          )}
                        <div className="border border-border rounded-xl p-5">
                          <h3 className="font-semibold mb-3">
                            Payer par virement
                          </h3>
                          <p className="whitespace-pre-wrap">
                            {data.transfer_instructions}
                          </p>
                          <p className="break-all mt-3 text-sm">
                            Référence : {data.reference}
                          </p>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Choisis un seul moyen de paiement. Un retour depuis
                          Stripe ne constitue pas une confirmation
                          d’encaissement.
                        </p>
                      </div>
                    )}
                    {data.amount_received > 0 &&
                      data.amount_received < data.amount_cents && (
                      <p>
                        Règlement partiel enregistré. Contacte Fred pour régler
                        le solde de{" "}
                        {money(data.amount_cents - data.amount_received)}.
                      </p>
                    )}
                    <Button
                      variant="outline"
                      disabled={busy}
                      onClick={() => void load()}
                    >
                      Actualiser le règlement
                    </Button>
                  </>
                )}
            </>
          )}
          <a
            className="inline-flex py-3 underline"
            href="mailto:contact@fredwav.com"
          >
            Contacter Fred
          </a>
        </div>
      </Section>
    </Layout>
  );
}
