import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { EXPRESS_USERS_BASE_COUNT, VIDEO_USERS_BASE_COUNT } from "@/config/offers";

/**
 * Compteurs de preuve sociale des analyses : base vérifiée + paiements valides
 * depuis cette base (rpc express_paid_since / video_paid_since). Si la lecture
 * échoue, ou au rendu statique, on affiche la base.
 */
const SOURCES = {
  analyse_express: { base: EXPRESS_USERS_BASE_COUNT, rpc: "express_paid_since" },
  analyse_video: { base: VIDEO_USERS_BASE_COUNT, rpc: "video_paid_since" },
} as const;
export type CountedAnalysis = keyof typeof SOURCES;

// Une seule lecture par analyse et par chargement de page.
const pending: Partial<Record<CountedAnalysis, Promise<number>>> = {};

function loadPaidSince(id: CountedAnalysis): Promise<number> {
  pending[id] ??= Promise.resolve(supabase.rpc(SOURCES[id].rpc))
    .then(({ data, error }) => (!error && typeof data === "number" ? data : 0))
    .catch(() => 0);
  return pending[id]!;
}

export function isCountedAnalysis(id: string): id is CountedAnalysis {
  return id in SOURCES;
}

export function useAnalysisCount(id: CountedAnalysis): number {
  const [paidSince, setPaidSince] = useState(0);
  useEffect(() => {
    let alive = true;
    void loadPaidSince(id).then((value) => alive && setPaidSince(value));
    return () => {
      alive = false;
    };
  }, [id]);
  return SOURCES[id].base + paidSince;
}
