import { type FormEvent, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { Section } from "@/components/ui/section";
import { Button } from "@/components/ui/button";
import { SEOHead } from "@/components/SEOHead";
import { seoFor } from "@/config/seo";
import { commerceCall, commerceInput } from "@/lib/commerce";
import { trackApplicationSubmit } from "@/lib/funnel-events";
import { OFFERS, priceLabel } from "@/config/offers";

type ApplicationOffer = "one_shot" | "academy" | "premium" | "conseil";

const CHOICES: { value: ApplicationOffer; label: string; detail: string }[] = [
  { value: "one_shot", label: "One Shot", detail: `Audit et 1 h 30 avec Fred · ${priceLabel(OFFERS.one_shot)}` },
  { value: "academy", label: "Wav Academy", detail: `Collectif à vie · ${priceLabel(OFFERS.academy)}` },
  { value: "premium", label: "Wav Premium", detail: `Individuel, 6 semaines minimum · ${priceLabel(OFFERS.premium)}` },
  { value: "conseil", label: "Je souhaite être conseillé", detail: "Fred t'oriente vers la formule adaptée" },
];

function initialOffer(value: string | null): ApplicationOffer {
  return CHOICES.some((c) => c.value === value) ? (value as ApplicationOffer) : "conseil";
}

/**
 * Formulaire de demande unique pour les accompagnements.
 * Fred lit chaque demande et répond personnellement : aucun paiement ni agenda à cette étape.
 */
export default function Candidature() {
  const [params] = useSearchParams();
  const [offer, setOffer] = useState<ApplicationOffer>(initialOffer(params.get("offre")));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [refused, setRefused] = useState(false);
  const [saved, setSaved] = useState(false);
  const requestId = useRef(crypto.randomUUID());

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setRefused(false);
    const data = new FormData(event.currentTarget);
    const commitments = { price: data.get("price") === "on", practice: data.get("practice") === "on" };
    if (!commitments.price || !commitments.practice) {
      setRefused(true);
      return;
    }
    setBusy(true);
    try {
      await commerceCall<{ id: string }>("submit-application", {
        request_id: requestId.current,
        offer,
        first_name: data.get("first_name"),
        email: data.get("email"),
        account_or_project: data.get("account_or_project"),
        objective: data.get("objective"),
        timing: data.get("timing"),
        website: data.get("website"),
        ...commitments,
      });
      setSaved(true);
      trackApplicationSubmit(offer);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Enregistrement indisponible.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Layout>
      <SEOHead {...seoFor("/candidature")} />
      <Section variant="cream" size="lg">
        <div className="max-w-2xl mx-auto">
          <p className="text-primary font-semibold mb-4">Demande d'accompagnement</p>
          <h1 className="font-display text-3xl md:text-4xl mb-5">Présente ton projet à Fred.</h1>
          <p className="text-muted-foreground mb-6">
            Fred lit chaque demande lui-même et te répond personnellement sous deux jours ouvrés. Aucun paiement à
            cette étape.
          </p>
          <Link to="/accompagnements" className="underline text-primary">
            Comparer les accompagnements
          </Link>

          {saved ? (
            <div role="status" className="mt-8 rounded-2xl border border-primary p-6">
              <h2 className="font-display text-2xl mb-4">Ta demande est enregistrée.</h2>
              <p>
                Fred te répond personnellement sous deux jours ouvrés, à l'adresse indiquée. Un e-mail de confirmation
                vient de partir ; pense à vérifier tes spams.
              </p>
            </div>
          ) : (
            <form onSubmit={submit} className="mt-8 space-y-6">
              <fieldset>
                <legend className="font-semibold mb-4">Ce qui t'intéresse</legend>
                <div className="grid gap-3 sm:grid-cols-2">
                  {CHOICES.map((choice) => (
                    <label
                      key={choice.value}
                      className={`flex cursor-pointer gap-3 rounded-xl border p-4 ${
                        offer === choice.value ? "border-primary bg-background" : "border-border"
                      }`}
                    >
                      <input
                        type="radio"
                        name="offer"
                        value={choice.value}
                        checked={offer === choice.value}
                        onChange={() => setOffer(choice.value)}
                        className="mt-1 h-5 w-5 shrink-0 accent-primary"
                      />
                      <span>
                        <span className="block font-semibold">{choice.label}</span>
                        <span className="block text-sm text-muted-foreground">{choice.detail}</span>
                      </span>
                    </label>
                  ))}
                </div>
              </fieldset>
              <label className="block">
                Prénom *
                <input name="first_name" autoComplete="given-name" required maxLength={100} className={commerceInput} />
              </label>
              <label className="block">
                E-mail *
                <input name="email" type="email" autoComplete="email" required maxLength={254} className={commerceInput} />
              </label>
              <label className="block">
                Ton compte ou ton projet *
                <textarea
                  name="account_or_project"
                  required
                  minLength={5}
                  maxLength={2000}
                  rows={3}
                  className={commerceInput}
                  aria-describedby="project-help"
                />
              </label>
              <p id="project-help" className="text-sm text-muted-foreground">
                Un lien vers ton compte ou quelques mots sur ton projet suffisent. Aucun minimum d'abonnés.
              </p>
              <label className="block">
                Ton objectif et ce qui te bloque aujourd'hui *
                <textarea name="objective" required minLength={20} maxLength={2000} rows={4} className={commerceInput} />
              </label>
              <label className="block">
                Quand aimerais-tu commencer ? (facultatif)
                <input name="timing" maxLength={200} className={commerceInput} />
                <span className="text-sm text-muted-foreground">La date est fixée ensuite directement avec Fred.</span>
              </label>
              <div hidden aria-hidden="true">
                <label>
                  Site
                  <input name="website" tabIndex={-1} autoComplete="off" />
                </label>
              </div>
              <fieldset className="space-y-4">
                <legend className="font-semibold mb-4">Avant d'envoyer</legend>
                {[
                  ["price", "J'ai noté que les accompagnements sont payants, aux prix indiqués sur le site, réglés avant le démarrage."],
                  ["practice", "Je suis prêt à mettre en pratique et à travailler sur mes contenus."],
                ].map(([name, label]) => (
                  <label key={name} className="flex gap-3 items-start cursor-pointer">
                    <input name={name} type="checkbox" className="mt-1 h-5 w-5 shrink-0 accent-primary" />
                    <span>{label}</span>
                  </label>
                ))}
              </fieldset>
              {refused && (
                <div role="alert" className="rounded-lg border border-border p-4">
                  Ces deux engagements sont nécessaires pour envoyer une demande d'accompagnement. Pour commencer seul,
                  les <Link to="/analyses" className="underline">analyses automatisées</Link> et les{" "}
                  <Link to="/ressources" className="underline">ressources</Link> sont en accès direct.
                </div>
              )}
              {error && <p role="alert" className="text-destructive">{error}</p>}
              <p className="text-sm text-muted-foreground">
                Tes données servent uniquement à traiter cette demande.{" "}
                <Link to="/politique-de-confidentialite" className="underline">Confidentialité</Link>.
              </p>
              <Button type="submit" variant="hero" size="xl" disabled={busy} className="w-full h-auto min-h-12 whitespace-normal">
                {busy ? "Envoi…" : "Envoyer ma demande à Fred"}
              </Button>
            </form>
          )}
        </div>
      </Section>
    </Layout>
  );
}
