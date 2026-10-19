import { type FormEvent, useCallback, useEffect, useState } from "react";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { AdminTabs, CONTENT_TABS } from "@/components/admin/AdminTabs";
import { Button } from "@/components/ui/button";
import { commerceCall, commerceInput } from "@/lib/commerce";
import { loadPlaces, monthName, type Places } from "@/lib/places";
import { ACCOMPAGNEMENTS, launchLabel, priceLabel } from "@/config/offers";

const OFFER_NAMES = { one_shot: "One Shot", academy: "Wav Academy", premium: "Wav Premium" } as const;

/**
 * Offres d'accompagnement et places par mois de démarrage. Les prix et la capacité
 * par défaut viennent du catalogue (src/config/offers.ts et table commerce_offers) ;
 * ici, Fred ajuste la capacité d'un mois précis.
 */
export default function OffersPlaces() {
  const [places, setPlaces] = useState<Places | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const reload = useCallback(async () => setPlaces(await loadPlaces(true)), []);
  useEffect(() => {
    void reload();
  }, [reload]);

  async function setCapacity(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const f = new FormData(event.currentTarget);
    setBusy(true);
    setError("");
    setMessage("");
    try {
      const result = await commerceCall<{ message: string }>("commerce-admin", {
        action: "capacity",
        offer: f.get("offer"),
        month: f.get("month"),
        capacity: Number(f.get("capacity")),
      });
      setMessage(result.message);
      await reload();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Modification impossible");
    } finally {
      setBusy(false);
    }
  }

  return (
    <AdminLayout>
      <div className="space-y-8 text-cream max-w-5xl">
        <h1 className="font-display text-3xl">Site et contenus</h1>
        <AdminTabs items={CONTENT_TABS} />

        <section>
          <h2 className="font-display text-xl mb-3">Offres d'accompagnement</h2>
          <div className="grid sm:grid-cols-3 gap-3">
            {ACCOMPAGNEMENTS.map((offer) => (
              <div key={offer.id} className="rounded-xl border border-primary/20 p-4 space-y-1">
                <p className="font-semibold">{offer.name}</p>
                <p>{priceLabel(offer)} TTC · {offer.priceNote}</p>
                {launchLabel(offer) && <p className="text-sm text-cream/70">{launchLabel(offer)}</p>}
                <p className="text-sm text-cream/70">
                  {offer.capacityPerMonth} démarrages par mois · {offer.purchase === "direct" ? "achat en ligne" : "sur demande"}
                </p>
              </div>
            ))}
          </div>
          <p className="text-sm text-cream/60 mt-2">
            Les prix et contenus des offres se modifient dans le code (src/config/offers.ts), avec une republication du site.
          </p>
        </section>

        <section>
          <h2 className="font-display text-xl mb-3">Places par mois</h2>
          <div className="grid sm:grid-cols-3 gap-3 mb-4">
            {(Object.keys(OFFER_NAMES) as (keyof typeof OFFER_NAMES)[]).map((id) => (
              <div key={id} className="rounded-xl border border-primary/20 p-4">
                <p className="font-semibold mb-1">{OFFER_NAMES[id]}</p>
                {places?.[id]?.months.map((m) => (
                  <p key={m.month} className="text-sm">
                    {monthName(m.month)} : {m.capacity - m.remaining} prise{m.capacity - m.remaining > 1 ? "s" : ""} / {m.capacity}
                  </p>
                )) ?? <p className="text-sm">Indisponible</p>}
              </div>
            ))}
          </div>
          <form onSubmit={setCapacity} className="grid sm:grid-cols-4 gap-4 items-end">
            <label>
              Offre<select name="offer" className={commerceInput}>
                <option value="one_shot">One Shot</option>
                <option value="academy">Wav Academy</option>
                <option value="premium">Wav Premium</option>
              </select>
            </label>
            <label>
              Mois<input name="month" type="month" required className={commerceInput} />
            </label>
            <label>
              Places ce mois-là<input name="capacity" type="number" min="0" max="100" required className={commerceInput} />
            </label>
            <Button disabled={busy} type="submit">Modifier la capacité</Button>
          </form>
          {message && <p role="status" className="mt-3">{message}</p>}
          {error && <p role="alert" className="mt-3 text-red-300">{error}</p>}
          <p className="text-sm text-cream/60 mt-2">
            Le compteur affiché sur le site est le nombre réel de places restantes : une demande ne prend pas de place,
            une proposition non payée la libère à son échéance.
          </p>
        </section>
      </div>
    </AdminLayout>
  );
}
