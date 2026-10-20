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
  support_requested_at: string | null;
  processing_started_at: string | null;
  /** État réel de l'e-mail « rapport prêt » (file commerce_mail), null s'il n'a pas été mis en file. */
  mail_state: "pending" | "sending" | "sent" | "failed" | null;
  mail_error: string | null;
}

const LIST_COLUMNS = [
  "id", "email", "tiktok_url", "status", "checkout_mode", "job_id", "error_message", "report_token",
  "paid_at", "completed_at", "result_email_queued_at", "report_viewed_at", "pdf_downloaded_at", "created_at",
  "support_requested_at", "processing_started_at",
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
      const rows = (data ?? []) as unknown as Omit<VideoAnalysis, "mail_state" | "mail_error">[];
      // « Rapport mis en file » ne veut pas dire « e-mail reçu » : on lit l'état réel de l'envoi.
      const keys = rows.map((r) => `video-report:${r.id}`);
      const mails = keys.length
        ? await (supabase as unknown as SupabaseClient).from("commerce_mail").select("dedupe_key, state, error").in("dedupe_key", keys)
        : { data: [] as { dedupe_key: string; state: string; error: string | null }[] };
      const byKey = new Map((mails.data ?? []).map((m) => [m.dedupe_key as string, m]));
      return {
        rows: rows.map((r) => {
          const mail = byKey.get(`video-report:${r.id}`);
          return { ...r, mail_state: (mail?.state ?? null) as VideoAnalysis["mail_state"], mail_error: mail?.error ?? null };
        }),
        tableMissing: false,
      };
    },
    staleTime: 5_000,
    refetchInterval: 10_000,
    retry: false,
  });
}
