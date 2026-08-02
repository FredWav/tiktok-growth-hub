import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

/**
 * Ligne telle qu'affichée dans la liste admin.
 *
 * `result_data` en est volontairement absent : ce jsonb pèse ~50 ko par analyse
 * (payload complet, vidéos dupliquées, markdown de l'IA). Le ramener pour toute
 * la table figeait l'onglet au `JSON.parse`, avant même le rendu React. Il est
 * chargé à la demande par `fetchAnalysisResultData`, pour une seule ligne.
 */
export interface ExpressAnalysis {
  id: string;
  stripe_session_id: string;
  tiktok_username: string;
  email: string | null;
  newsletter_requested: boolean;
  newsletter_subscribed: boolean;
  job_id: string | null;
  status: string;
  error_message: string | null;
  health_score: number | null;
  created_at: string;
  completed_at: string | null;
}

const LIST_COLUMNS = [
  "id",
  "stripe_session_id",
  "tiktok_username",
  "email",
  "newsletter_requested",
  "newsletter_subscribed",
  "job_id",
  "status",
  "error_message",
  "health_score",
  "created_at",
  "completed_at",
].join(", ");

/** Au-delà, la liste n'est plus lisible et la requête coûte cher pour rien. */
const LIST_LIMIT = 100;

export function useExpressAnalyses() {
  return useQuery({
    queryKey: ["express-analyses"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("express_analyses")
        .select(LIST_COLUMNS)
        .order("created_at", { ascending: false })
        .limit(LIST_LIMIT);
      if (error) throw error;
      return data as unknown as ExpressAnalysis[];
    },
    // Le polling de relance invalide cette requête : sans palier, chaque tick
    // relançait un aller-retour complet.
    staleTime: 30_000,
  });
}

/**
 * Charge le `result_data` d'une seule analyse, au moment où on en a besoin
 * (génération du PDF). Séparé de la liste pour que celle-ci reste légère.
 */
export async function fetchAnalysisResultData(id: string): Promise<unknown> {
  const { data, error } = await supabase
    .from("express_analyses")
    .select("result_data")
    .eq("id", id)
    .single();
  if (error) throw error;
  return (data as { result_data: unknown } | null)?.result_data ?? null;
}
