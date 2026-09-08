import { type FormEvent, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { Section } from "@/components/ui/section";
import { Button } from "@/components/ui/button";
import { commerceCall, commerceInput } from "@/lib/commerce";
import { trackEvent } from "@/lib/tracking";

export function CommerceApplication(
  { offer }: { offer: "academy" | "premium" },
) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [refused, setRefused] = useState(false);
  const [result, setResult] = useState<
    { id: string; calendar_url?: string } | null
  >(null);
  const requestId = useRef(crypto.randomUUID());
  const academy = offer === "academy";
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setRefused(false);
    const data = new FormData(event.currentTarget);
    const commitments = {
      price: data.get("price") === "on",
      practice: data.get("practice") === "on",
      commercial_call: data.get("commercial_call") === "on",
    };
    if (!Object.values(commitments).every(Boolean)) {
      setRefused(true);
      return;
    }
    setBusy(true);
    try {
      const response = await commerceCall<
        { id: string; calendar_url?: string }
      >(`submit-${offer}-application`, {
        request_id: requestId.current,
        first_name: data.get("first_name"),
        email: data.get("email"),
        account_or_project: data.get("account_or_project"),
        objective: data.get("objective"),
        timing: data.get("timing"),
        website: data.get("website"),
        ...commitments,
      });
      setResult(response);
      trackEvent(`${offer}_application_saved`, {
        source: "server_confirmation",
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Enregistrement indisponible.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <Layout>
      <Section variant="cream" size="lg">
        <div className="max-w-2xl mx-auto">
          <p className="text-primary font-semibold mb-4">
            Wav {academy ? "Academy" : "Premium"}
          </p>
          <h1 className="font-display text-3xl md:text-4xl mb-5">
            {academy
              ? "Parlons de ton inscription."
              : "Présente ton projet à Fred."}
          </h1>
          <p className="text-muted-foreground mb-6">
            {academy
              ? "Six mois d’accompagnement collectif à 749 € TTC. Cet appel commercial sert à vérifier si le programme te correspond, pas à obtenir un audit gratuit."
              : "Accompagnement individuel de trente jours à 1 990 € TTC. Chaque candidature est étudiée par Fred, avec une réponse sous deux jours ouvrés."}
          </p>
          <Link
            to={academy ? "/wavacademy" : "/wav-premium"}
            className="underline text-primary"
          >
            Relire le contenu et les modalités
          </Link>
          {result
            ? (
              <div
                role="status"
                className="mt-8 rounded-2xl border border-primary p-6"
              >
                <h2 className="font-display text-2xl mb-4">
                  Ta demande est enregistrée.
                </h2>
                {academy && result.calendar_url
                  ? (
                    <>
                      <p className="mb-5">
                        Tu peux maintenant choisir un créneau. La réservation
                        sera confirmée par Google Agenda, pas par ce bouton.
                      </p>
                      <Button
                        asChild
                        className="h-auto min-h-12 whitespace-normal"
                      >
                        <a
                          href={result.calendar_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={() =>
                            trackEvent("academy_calendar_click", {
                              source: "saved_application",
                            })}
                        >
                          Ouvrir le calendrier de l’appel
                        </a>
                      </Button>
                    </>
                  )
                  : (
                    <p>
                      Fred te répondra personnellement sous deux jours ouvrés.
                      Aucun diagnostic ni orientation automatique ne remplace sa
                      décision.
                    </p>
                  )}
                <p className="text-sm text-muted-foreground mt-5">
                  La confirmation à l’écran fait foi de l’enregistrement, même
                  si l’e-mail arrive plus tard.
                </p>
              </div>
            )
            : (
              <form onSubmit={submit} className="mt-8 space-y-6">
                <label className="block">
                  Prénom *<input
                    name="first_name"
                    autoComplete="given-name"
                    required
                    maxLength={100}
                    className={commerceInput}
                  />
                </label>
                <label className="block">
                  E-mail *<input
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    maxLength={254}
                    className={commerceInput}
                  />
                </label>
                <label className="block">
                  Ton compte ou ton projet de lancement *<textarea
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
                  Un lien ou quelques mots sur ton projet suffisent. Aucun
                  minimum d’abonnés ou de vidéos.
                </p>
                <label className="block">
                  Ton objectif et ce qui te bloque aujourd’hui *<textarea
                    name="objective"
                    required
                    minLength={20}
                    maxLength={2000}
                    rows={4}
                    className={commerceInput}
                  />
                </label>
                <label className="block">
                  Quand aimerais-tu commencer ? (facultatif)<input
                    name="timing"
                    maxLength={200}
                    className={commerceInput}
                  />
                  <span className="text-sm text-muted-foreground">
                    Indication seulement. La date sera fixée directement avec
                    Fred.
                  </span>
                </label>
                <div hidden aria-hidden="true">
                  <label>
                    Site<input
                      name="website"
                      tabIndex={-1}
                      autoComplete="off"
                    />
                  </label>
                </div>
                <fieldset className="space-y-4">
                  <legend className="font-semibold mb-4">
                    Avant de continuer
                  </legend>
                  {[[
                    "price",
                    `J’ai compris le prix : ${
                      academy
                        ? "749 € TTC pour six mois"
                        : "1 990 € TTC pour trente jours"
                    }, réglé intégralement avant le démarrage, en ligne ou par virement.`,
                  ], [
                    "practice",
                    "Je suis prêt à mettre en pratique et à travailler sur mes contenus.",
                  ], [
                    "commercial_call",
                    "Je comprends que l’échange porte sur l’inscription à un accompagnement payant et ne comprend pas de conseils personnalisés gratuits.",
                  ]].map(([name, label]) => (
                    <label
                      key={name}
                      className="flex gap-3 items-start cursor-pointer"
                    >
                      <input
                        name={name}
                        type="checkbox"
                        className="mt-1 h-5 w-5 shrink-0 accent-primary"
                      />
                      <span>{label}</span>
                    </label>
                  ))}
                </fieldset>
                {refused && (
                  <div
                    role="alert"
                    className="rounded-lg border border-border p-4"
                  >
                    Ces trois engagements sont nécessaires pour poursuivre ce
                    parcours. Si ce n’est pas ton besoin, tu peux consulter
                    librement les{" "}
                    <Link to="/ressources" className="underline">
                      ressources
                    </Link>{" "}
                    ou revenir plus tard. Aucun calendrier ne sera ouvert.
                  </div>
                )}
                {error && (
                  <p role="alert" className="text-destructive">{error}</p>
                )}
                <p className="text-sm text-muted-foreground">
                  Tes données servent à traiter cette demande, pas à t’inscrire
                  à une newsletter.{" "}
                  <Link
                    to="/politique-de-confidentialite"
                    className="underline"
                  >
                    Confidentialité
                  </Link>.
                </p>
                <Button
                  type="submit"
                  variant="hero"
                  size="xl"
                  disabled={busy}
                  className="w-full h-auto min-h-12 whitespace-normal"
                >
                  {busy
                    ? "Enregistrement…"
                    : academy
                    ? "Valider et accéder au calendrier"
                    : "Envoyer ma candidature à Fred"}
                </Button>
              </form>
            )}
        </div>
      </Section>
    </Layout>
  );
}
