import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

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
  result_data: any | null;
  created_at: string;
  completed_at: string | null;
}

export function useExpressAnalyses() {
  return useQuery({
    queryKey: ["express-analyses"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("express_analyses")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as ExpressAnalysis[];
    },
  });
}
