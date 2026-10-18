import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

/** Places réelles par mois de démarrage (mois en cours et deux suivants). */
export type MonthPlaces = { month: string; capacity: number; remaining: number };
export type OfferPlaces = { price_cents: number; months: MonthPlaces[] };
export type Places = Partial<Record<"one_shot" | "academy" | "premium", OfferPlaces>>;

// Une seule lecture par chargement de page, partagée par tous les compteurs.
let pending: Promise<Places | null> | null = null;

export function loadPlaces(force = false): Promise<Places | null> {
  if (!pending || force) {
    pending = Promise.resolve(supabase.rpc("commerce_places"))
      .then(({ data, error }) => (error || !data ? null : (data as Places)))
      .catch(() => null);
  }
  return pending;
}

/** null tant que la lecture n'a pas abouti (rendu statique, réseau indisponible). */
export function usePlaces(): Places | null {
  const [places, setPlaces] = useState<Places | null>(null);
  useEffect(() => {
    let alive = true;
    void loadPlaces().then((value) => alive && setPlaces(value));
    return () => {
      alive = false;
    };
  }, []);
  return places;
}

export const monthName = (month: string) =>
  new Date(`${month.slice(0, 7)}-15T12:00:00Z`).toLocaleDateString("fr-FR", {
    month: "long",
    timeZone: "Europe/Paris",
  });

/** « Plus que 3 places en octobre », « Complet en octobre, places en novembre ». */
export function placesSentence(offer: OfferPlaces | undefined): string | null {
  const [current, ...later] = offer?.months ?? [];
  if (!current || current.capacity === 0 && later.every((m) => m.capacity === 0)) return null;
  if (current.remaining > 0) {
    return current.remaining === 1
      ? `Plus qu'une place en ${monthName(current.month)}`
      : `${current.remaining} places sur ${current.capacity} en ${monthName(current.month)}`;
  }
  const next = later.find((m) => m.remaining > 0);
  return next
    ? `Complet en ${monthName(current.month)} · places disponibles en ${monthName(next.month)}`
    : "Complet pour les trois prochains mois · liste d'attente";
}
