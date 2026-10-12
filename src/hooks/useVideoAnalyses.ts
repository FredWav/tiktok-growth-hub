import { useQuery } from "@tanstack/react-query";
import type { SupabaseClient } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

/**
 * Commande d'Analyse Vidéo telle qu'affichée dans la liste admin.
 * `result_raw` et `report_data` (jsonb volumineux) ne sont pas chargés ici.
 */
export interface VideoAnalysis {
  id: string;
  email: string;
  tiktok_url: string;
  status: string;
  checkout_mode: string;
  job_id: string | null;
  error_message: string | null;
  report_token: string;
  paid_at: string | null;
  completed_at: string | null;
  result_email_queued_at: string | null;
  report_viewed_at: string | null;
  pdf_downloaded_at: string | null;
  created_at: string;
}

const LIST_COLUMNS = [
  "id", "email", "tiktok_url", "status", "checkout_mode", "job_id", "error_message", "report_token",
  "paid_at", "completed_at", "result_email_queued_at", "report_viewed_at", "pdf_downloaded_at", "created_at",
].join(", ");

const LIST_LIMIT = 100;

export const isVideoComplete = (row: Pick<VideoAnalysis, "status">) => ["completed", "delivered"].includes(row.status);
export const isVideoActive = (row: Pick<VideoAnalysis, "status">) => ["paid", "starting", "processing"].includes(row.status);

/**
 * La table n'est pas encore dans les types générés : client non typé pour cette requête.
 * Si elle manque en base, la liste est vide et `tableMissing` le signale, sans faire
 * échouer l'écran des analyses de compte.
 */
export function useVideoAnalyses() {
  return useQuery({
    queryKey: ["video-analyses"],
    queryFn: async () => {
      const { data, error } = await (supabase as unknown as SupabaseClient)
        .from("video_analyses")
        .select(LIST_COLUMNS)
        .order("created_at", { ascending: false })
        .limit(LIST_LIMIT);
      if (error) {
        if (error.code === "PGRST205" || error.code === "42P01") return { rows: [] as VideoAnalysis[], tableMissing: true };
        throw error;
      }
      return { rows: (data ?? []) as unknown as VideoAnalysis[], tableMissing: false };
    },
    staleTime: 5_000,
    refetchInterval: 10_000,
    retry: false,
  });
}
