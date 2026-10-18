import { type FormEvent, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { Section } from "@/components/ui/section";
import { Button } from "@/components/ui/button";
import { SEOHead } from "@/components/SEOHead";
import { seoFor } from "@/config/seo";
import { commerceCall, commerceInput, money } from "@/lib/commerce";
import { loadPlaces, monthName, type Places } from "@/lib/places";
import { trackEvent } from "@/lib/tracking";
import { INSTALLMENTS_LABEL, INSTALLMENTS_NOTE, launchLabel, OFFERS } from "@/config/offers";
import { CGV_TEXT, earlyText } from "../../supabase/functions/_shared/consent-texts.ts";

const parisToday = () => new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Paris" }).format(new Date());
const longDate = (day: string) =>
  new Date(`${day}T12:00:00Z`).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric", timeZone: "Europe/Paris" });

/** Premier mois avec une place : aujourd'hui, sinon le 1er du mois suivant disponible. */
function nextStart(places: Places | null): string | null | undefined {
  const months = places?.academy?.months;
  if (!months) return undefined;
  const index = months.findIndex((m) => m.remaining > 0);
  if (index < 0) return null;
  return index === 0 ? parisToday() : months[index].month;
}

/**
 * Achat direct de la Wav Academy : place du mois réservée pendant le paiement,
 * consentements enregistrés avant la redirection vers Stripe.
 */
export default function AcademyInscription() {
  const offer = OFFERS.academy;
  const [places, setPlaces] = useState<Places | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const refresh = (force = false) =>
    loadPlaces(force).then((value) => {
      setPlaces(value);
      setLoaded(true);
    });
  useEffect(() => {
    void refresh();
  }, []);

  const start = nextStart(places);
  const price = places?.academy?.price_cents ?? Math.round(offer.price * 100);
  const launch = launchLabel(offer);
  const current = places?.academy?.months[0];

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!start) return;
    setError("");
    setBusy(true);
    const data = new FormData(event.currentTarget);
    try {
      const { url } = await commerceCall<{ url: string }>("academy-checkout", {
        first_name: data.get("first_name"),
        email: data.get("email"),
        website: data.get("website"),
        expected_start: start,
        consent_cgv: data.get("cgv") === "on",
        early_start: data.get("early") === "on",
      });
      trackEvent("checkout_open", { offer: "academy" });
      window.location.assign(url);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Paiement momentanément indisponible.");
      await refresh(true);
      setBusy(false);
    }
  }

  return (
    <Layout>
      <SEOHead {...seoFor("/wavacademy/inscription")} />
      <Section variant="cream" size="lg">
        <div className="max-w-2xl mx-auto space-y-6">
          <p className="text-primary font-semibold">Wav Academy · inscription</p>
          <h1 className="font-display text-3xl md:text-4xl">Rejoins la Wav Academy.</h1>

          <dl className="rounded-xl border border-border bg-background p-6 space-y-3">
            <div>
              <dt className="text-sm text-muted-foreground">Prix</dt>
              <dd className="font-semibold">{money(price)} TTC, paiement unique, accès à vie</dd>
              {launch && <dd className="text-sm">{launch}</dd>}
              <dd className="text-sm text-muted-foreground">Possible {INSTALLMENTS_LABEL} ({INSTALLMENTS_NOTE}).</dd>
            </div>
            <div>
              <dt className="text-sm text-muted-foreground">Démarrage</dt>
              <dd>
                {!loaded
                  ? "Vérification des places…"
                  : start === undefined
                  ? "Places momentanément indisponibles."
                  : start === null
                  ? "Complet pour les trois prochains mois."
                  : start === parisToday()
                  ? "Aujourd'hui : ton accès Discord arrive par e-mail dès le paiement confirmé."
                  : `Le ${longDate(start)} : ${current ? `${monthName(current.month)} est complet` : "ce mois-ci est complet"}, ta place est réservée sur ${monthName(start)}.`}
              </dd>
              {current && current.remaining > 0 && (
                <dd className="text-sm">{current.remaining} place{current.remaining > 1 ? "s" : ""} sur {current.capacity} en {monthName(current.month)}</dd>
              )}
            </div>
            <div>
              <dt className="text-sm text-muted-foreground">Ce qui est compris</dt>
              <dd>
                <ul className="list-disc pl-5 space-y-1">
                  {offer.includes.map((item) => <li key={item}>{item}</li>)}
                </ul>
              </dd>
            </div>
          </dl>

          {loaded && start === undefined && (
            <div role="alert" className="space-y-3">
              <p>Impossible de vérifier les places pour le moment.</p>
              <Button variant="outline" onClick={() => void refresh(true)}>Réessayer</Button>
            </div>
          )}

          {loaded && start === null && (
            <div className="space-y-3">
              <p>Laisse ta demande : Fred te prévient dès qu'une place se libère.</p>
              <Button asChild>
                <Link to="/candidature?offre=academy">Rejoindre la liste d'attente</Link>
              </Button>
            </div>
          )}

          {start && (
            <form onSubmit={submit} className="space-y-5">
              <label className="block">
                Prénom
                <input name="first_name" required maxLength={100} autoComplete="given-name" className={commerceInput} />
              </label>
              <label className="block">
                E-mail (pour ton accès Discord et ta facture)
                <input name="email" type="email" required maxLength={254} autoComplete="email" className={commerceInput} />
              </label>
              <input name="website" tabIndex={-1} autoComplete="off" aria-hidden="true" className="hidden" />
              <label className="flex gap-3">
                <input name="cgv" type="checkbox" required className="h-5 w-5 mt-1 shrink-0" />
                <span>
                  {CGV_TEXT}{" "}
                  <Link to="/cgv" target="_blank" className="underline">Lire les CGV</Link>
                </span>
              </label>
              <label className="flex gap-3">
                <input name="early" type="checkbox" required className="h-5 w-5 mt-1 shrink-0" />
                <span>{earlyText("academy")}</span>
              </label>
              {error && <p role="alert" className="text-destructive">{error}</p>}
              <Button type="submit" size="lg" disabled={busy}>
                {busy ? "Ouverture du paiement…" : `Payer ${money(price)}`}
              </Button>
              <p className="text-sm text-muted-foreground">
                Paiement sécurisé par Stripe : carte bancaire, Klarna, Scalapay ou PayPal. Ta place est réservée pendant
                30 minutes le temps du paiement.
              </p>
            </form>
          )}

          <p className="text-sm">
            Une question avant de t'inscrire ?{" "}
            <Link to="/candidature?offre=academy" className="underline">Écris à Fred</Link>
            {" "}ou <a href="mailto:contact@fredwav.com" className="underline">contact@fredwav.com</a>.
          </p>
        </div>
      </Section>
    </Layout>
  );
}
