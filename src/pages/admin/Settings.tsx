import { useCallback, useEffect, useState } from "react";
import { CheckCircle2, XCircle } from "lucide-react";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { Button } from "@/components/ui/button";
import { commerceCall } from "@/lib/commerce";

type Status = { groups: { title: string; checks: { label: string; ok: boolean; detail: string | null }[] }[] };

/**
 * État réellement vérifié par le serveur : réglages présents (jamais leur valeur),
 * dernier paiement reçu, dernier e-mail envoyé, tâches planifiées.
 */
export default function Settings() {
  const [status, setStatus] = useState<Status | null>(null);
  const [error, setError] = useState("");
  const load = useCallback(async () => {
    setError("");
    try {
      setStatus(await commerceCall<Status>("commerce-admin", { action: "status" }));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Lecture impossible");
    }
  }, []);
  useEffect(() => {
    void load();
  }, [load]);
  const [mailTest, setMailTest] = useState<{ sending: boolean; message: string }>({ sending: false, message: "" });
  const sendTestMail = async () => {
    setMailTest({ sending: true, message: "" });
    try {
      const r = await commerceCall<{ ok: boolean; to?: string; from?: string; error?: string }>("commerce-admin", { action: "mail_test" });
      setMailTest({
        sending: false,
        message: r.ok ? `E-mail envoyé de ${r.from} à ${r.to} : vérifie ta boîte (et les spams).` : `Échec de l'envoi : ${r.error}`,
      });
    } catch (e) {
      setMailTest({ sending: false, message: e instanceof Error ? e.message : "Envoi impossible" });
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-8 text-cream max-w-4xl">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h1 className="font-display text-3xl">Paramètres</h1>
          <Button variant="outline" onClick={() => void load()}>Vérifier à nouveau</Button>
        </div>
        <p className="text-cream/70">
          Chaque ligne est vérifiée par le serveur à l'instant. Les clés secrètes se saisissent dans Supabase, jamais ici.
        </p>
        {error && <p role="alert" className="text-red-300">{error}</p>}
        {!status && !error && <p role="status">Vérification en cours…</p>}
        {status?.groups.map((group) => (
          <section key={group.title} className="rounded-xl border border-primary/20 p-5">
            <h2 className="font-display text-xl mb-3">{group.title}</h2>
            <ul className="space-y-2">
              {group.checks.map((c) => (
                <li key={c.label} className="flex items-start gap-3">
                  {c.ok
                    ? <CheckCircle2 className="h-5 w-5 shrink-0 text-green-400" aria-label="Vérifié" />
                    : <XCircle className="h-5 w-5 shrink-0 text-red-400" aria-label="À régler" />}
                  <span>
                    {c.label}
                    {c.detail && <span className="text-cream/60"> · {c.detail}</span>}
                  </span>
                </li>
              ))}
            </ul>
            {group.title === "E-mails" && (
              <div className="mt-4 space-y-2">
                <Button variant="outline" disabled={mailTest.sending} onClick={() => void sendTestMail()}>
                  {mailTest.sending ? "Envoi…" : "Envoyer un e-mail de test"}
                </Button>
                {mailTest.message && <p role="status" className="text-sm text-cream/80">{mailTest.message}</p>}
              </div>
            )}
          </section>
        ))}
      </div>
    </AdminLayout>
  );
}
