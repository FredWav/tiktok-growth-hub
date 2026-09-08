import { type FormEvent, useCallback, useEffect, useState } from "react";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { Button } from "@/components/ui/button";
import { commerceCall, commerceInput, money } from "@/lib/commerce";

type Order = {
  id: string;
  token: string;
  offer: string;
  email: string;
  first_name: string;
  start_date: string;
  status: string;
  amount_cents: number;
  amount_received: number;
  consent_at: string | null;
  discord_status: string;
  wavstats_status: string;
  last_error: string | null;
};
type Application = {
  id: string;
  offer: string;
  first_name: string;
  email: string;
  account_or_project: string;
  objective: string;
  timing: string;
  stage: string;
};
type Snapshot = {
  orders: Order[];
  applications: Application[];
  unmatched: { session_id: string; reason: string; amount_cents: number }[];
  failed_mail: {
    id: string;
    recipient: string;
    subject: string;
    error: string;
  }[];
};
const stages: Record<string, string> = {
  received: "Reçue",
  booked: "Réservation confirmée",
  closed: "Closing effectué",
  declined: "Non retenue",
};
export default function Commerce() {
  const [snapshot, setSnapshot] = useState<Snapshot | null>(null);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [selected, setSelected] = useState<Order | null>(null);
  const [application, setApplication] = useState<Application | null>(null);
  const reload = useCallback(
    async () =>
      setSnapshot(
        await commerceCall<Snapshot>("commerce-admin", { action: "list" }),
      ),
    [],
  );
  useEffect(() => {
    void reload().catch((e) => setError(e.message));
  }, [reload]);
  async function act(body: Record<string, unknown>) {
    setBusy(true);
    setError("");
    setMessage("");
    try {
      const result = await commerceCall<{ url?: string; message?: string }>(
        "commerce-admin",
        body,
      );
      setMessage(result.url || result.message || "Modification enregistrée.");
      await reload();
      setSelected(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Opération impossible");
    } finally {
      setBusy(false);
    }
  }
  function create(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const f = new FormData(event.currentTarget);
    void act({
      action: "create",
      offer: f.get("offer"),
      first_name: f.get("first_name"),
      email: f.get("email"),
      start_date: f.get("start_date"),
      start_time: f.get("start_time"),
      invoice_reference: f.get("invoice_reference"),
      ...(application ? { application_id: application.id } : {}),
    });
  }
  function payment(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selected) return;
    const f = new FormData(event.currentTarget);
    const refund = f.get("action") === "refund";
    if (
      !window.confirm(
        refund
          ? "Confirmer que le remboursement a déjà été effectué dans l’outil de paiement ? Cela suspendra les droits de cette commande."
          : "Confirmer que ce virement est effectivement encaissé ? Une promesse ou une capture d’écran ne suffit pas.",
      )
    ) return;
    void act({
      action: f.get("action"),
      id: selected.id,
      amount_cents: Math.round(Number(f.get("amount")) * 100),
      reference: f.get("reference"),
      received_at: new Date(String(f.get("received_at"))).toISOString(),
    });
  }
  return (
    <AdminLayout>
      <div className="space-y-8 text-cream max-w-6xl">
        <h1 className="font-display text-3xl">Commandes et demandes</h1>
        <p>
          Nouvelle gamme uniquement. Les anciennes candidatures et inscriptions
          restent dans leurs espaces historiques. Les listes affichent les 200
          derniers dossiers.
        </p>
        {error && <p role="alert" className="text-red-300">{error}</p>}
        {message && (
          <p
            role="status"
            className="border border-primary p-4 rounded-lg break-all"
          >
            {message}
          </p>
        )}
        <Button
          onClick={() => void reload().catch((e) => setError(e.message))}
          disabled={busy}
        >
          Actualiser
        </Button>
        <section>
          <h2 className="text-2xl font-display mb-4">
            Après closing : créer l’inscription
          </h2>
          {application && (
            <p className="mb-3">
              Pour {application.first_name} · {application.email}{" "}
              <Button variant="outline" onClick={() => setApplication(null)}>
                Détacher la demande
              </Button>
            </p>
          )}
          <form
            key={application?.id || "manual"}
            onSubmit={create}
            className="grid sm:grid-cols-2 gap-4 border border-primary/20 rounded-xl p-5"
          >
            <label>
              Offre<select
                name="offer"
                defaultValue={application?.offer || "academy"}
                className={commerceInput}
              >
                <option value="academy">Academy · 749 € TTC</option>
                <option value="premium">Premium · 1 990 € TTC</option>
              </select>
            </label>
            <label>
              Date convenue (Paris)<input
                name="start_date"
                type="date"
                required
                className={commerceInput}
              />
            </label>
            <label>
              Heure du premier rendez-vous Premium (Paris)<input
                name="start_time"
                type="time"
                className={commerceInput}
              />
              <span className="text-sm">
                Obligatoire pour Premium ; ignorée pour Academy.
              </span>
            </label>
            <label>
              Prénom<input
                name="first_name"
                defaultValue={application?.first_name}
                required
                className={commerceInput}
              />
            </label>
            <label>
              Référence de facture (facultative)<input
                name="invoice_reference"
                maxLength={200}
                className={commerceInput}
              />
            </label>
            <label>
              E-mail<input
                name="email"
                type="email"
                defaultValue={application?.email}
                required
                className={commerceInput}
              />
            </label>
            <Button disabled={busy} type="submit">
              Créer le lien personnel
            </Button>
          </form>
        </section>
        <section>
          <h2 className="text-2xl font-display mb-4">Demandes</h2>
          <div className="space-y-4">
            {snapshot?.applications.map((a) => (
              <article
                key={a.id}
                className="p-5 border border-primary/20 rounded-xl space-y-3"
              >
                <h3 className="font-semibold">
                  {a.first_name} · {a.offer} · {a.email}
                </h3>
                <p className="break-words whitespace-pre-wrap">
                  {a.account_or_project}
                </p>
                <p className="whitespace-pre-wrap">{a.objective}</p>
                <p>Démarrage souhaité : {a.timing || "Non précisé"}</p>
                <label>
                  Avancement<select
                    aria-label={`Avancement de ${a.first_name}`}
                    disabled={busy}
                    value={a.stage}
                    onChange={(e) =>
                      void act({
                        action: "stage",
                        id: a.id,
                        stage: e.target.value,
                      })}
                    className={commerceInput}
                  >
                    {Object.entries(stages).map(([k, v]) => (
                      <option value={k} key={k}>{v}</option>
                    ))}
                  </select>
                </label>
                <Button
                  disabled={busy}
                  onClick={() => {
                    setApplication(a);
                    window.scrollTo({ top: 0, behavior: "smooth" });
                  }}
                >
                  Préparer son inscription
                </Button>
              </article>
            ))}
          </div>
        </section>
        <section>
          <h2 className="text-2xl font-display mb-4">Commandes</h2>
          <div className="space-y-4">
            {snapshot?.orders.map((o) => (
              <article
                key={o.id}
                className="p-5 border border-primary/20 rounded-xl space-y-3"
              >
                <h3 className="font-semibold">
                  {o.first_name} · {o.offer} · {o.email}
                </h3>
                <p>
                  {o.start_date} · {o.status} · {money(o.amount_received)}{" "}
                  encaissés / {money(o.amount_cents)}
                </p>
                <p>
                  Consentement : {o.consent_at ? "enregistré" : "à confirmer"}
                  {" "}
                  · Discord : {o.discord_status} · WavStats :{" "}
                  {o.wavstats_status}
                </p>
                {o.last_error && <p className="text-red-300">{o.last_error}</p>}
                <p className="break-all text-sm">
                  Lien confidentiel :{" "}
                  {window.location.origin}/inscription/{o.token}
                </p>
                <Button disabled={busy} onClick={() => setSelected(o)}>
                  Encaissement, remboursement ou date
                </Button>
              </article>
            ))}
          </div>
        </section>
        {selected && (
          <section className="border border-primary rounded-xl p-5 space-y-6">
            <h2 className="font-display text-2xl">
              Dossier de {selected.first_name}
            </h2>
            <form onSubmit={payment} className="grid sm:grid-cols-2 gap-4">
              <label>
                Opération<select name="action" className={commerceInput}>
                  <option value="payment">Virement encaissé</option>
                  <option value="refund">Remboursement déjà effectué</option>
                </select>
              </label>
              <label>
                Montant en euros<input
                  name="amount"
                  type="number"
                  min="0.01"
                  step="0.01"
                  required
                  className={commerceInput}
                />
              </label>
              <label>
                Référence bancaire ou remboursement<input
                  name="reference"
                  minLength={3}
                  required
                  className={commerceInput}
                />
              </label>
              <label>
                Date et heure réelles (fuseau de cet appareil)<input
                  name="received_at"
                  type="datetime-local"
                  required
                  className={commerceInput}
                />
              </label>
              <Button type="submit" disabled={busy}>
                Confirmer l’opération
              </Button>
            </form>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                void act({
                  action: "reschedule",
                  id: selected.id,
                  start_date: new FormData(e.currentTarget).get("start_date"),
                  start_time: new FormData(e.currentTarget).get("start_time"),
                });
              }}
              className="space-y-3"
            >
              <label>
                  Nouvelle date convenue<input
                  name="start_date"
                  type="date"
                  required
                  className={commerceInput}
                />
                </label>
                {selected.offer === "premium" && <label>Heure du premier rendez-vous (Paris)<input name="start_time" type="time" required className={commerceInput} /></label>}
              <p>
                Avant démarrage uniquement. Le client devra accepter à nouveau
                les modalités depuis son lien.
              </p>
              <Button disabled={busy} type="submit">Replanifier</Button>
            </form>
            <Button variant="outline" onClick={() => setSelected(null)}>
              Fermer le dossier
            </Button>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const session = new FormData(e.currentTarget).get("session_id");
                if (
                  window.confirm(
                    "Rattacher ce paiement Stripe à ce client après contrôle de son identité ?",
                  )
                ) {
                  void act({
                    action: "reconcile",
                    id: selected.id,
                    session_id: session,
                  });
                }
              }}
              className="space-y-3"
            >
              <label>
                Session Stripe à rapprocher<input
                  name="session_id"
                  required
                  placeholder="cs_…"
                  className={commerceInput}
                />
              </label>
              <Button disabled={busy} type="submit">
                Vérifier et rapprocher le paiement
              </Button>
            </form>
          </section>
        )}
        <section>
          <h2 className="text-2xl font-display mb-4">Paiements à rapprocher</h2>
          {snapshot?.unmatched.map((p) => (
            <p key={p.session_id} className="mb-3 break-all">
              {p.session_id} · {money(p.amount_cents)} ·{" "}
              {p.reason}. Aucun accès automatique : contrôler dans Stripe avant
              rapprochement.
            </p>
          ))}
        </section>
        <section>
          <h2 className="text-2xl font-display mb-4">Notifications en échec</h2>
          {snapshot?.failed_mail.map((m) => (
            <div key={m.id} className="mb-4">
              <p>{m.recipient} · {m.subject} · {m.error}</p>
              <Button
                disabled={busy}
                onClick={() => void act({ action: "retry_mail", id: m.id })}
              >
                Relancer sans recréer la demande
              </Button>
            </div>
          ))}
        </section>
        <section>
          <h2 className="text-2xl font-display mb-4">
            Tracer un remboursement Express
          </h2>
          <p>
            À utiliser seulement après remboursement intégral effectué avec les
            outils habituels. Aucun mouvement d’argent n’est déclenché ici.
          </p>
          <form
            className="space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              const f = new FormData(e.currentTarget);
              if (
                window.confirm(
                  "Le remboursement intégral de 11,90 € a-t-il été effectué ?",
                )
              ) {
                void act({
                  action: "express_refund",
                  id: f.get("id"),
                  reference: f.get("reference"),
                  received_at: new Date(String(f.get("received_at")))
                    .toISOString(),
                });
              }
            }}
          >
            <label>
              Identifiant de l’analyse<input
                name="id"
                required
                className={commerceInput}
              />
            </label>
            <label>
              Référence du remboursement<input
                name="reference"
                required
                className={commerceInput}
              />
            </label>
            <label>
              Date et heure effectives<input
                name="received_at"
                type="datetime-local"
                required
                className={commerceInput}
              />
            </label>
            <Button disabled={busy} type="submit">
              Enregistrer le remboursement effectué
            </Button>
          </form>
        </section>
      </div>
    </AdminLayout>
  );
}
