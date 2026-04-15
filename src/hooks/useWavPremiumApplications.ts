import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface WavPremiumApplication {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  tiktok_username: string | null;
  current_level: string;
  blockers: string;
  goals: string;
  origin_source: string | null;
  follower_since: string | null;
  conversion_trigger: string | null;
  current_revenue: string | null;
  revenue_goal: string | null;
  created_at: string;
}

export function useWavPremiumApplications() {
  return useQuery({
    queryKey: ["wav-premium-applications"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("wav_premium_applications")
        .select("*")
        .not("email", "is", null)
        .neq("email", "")
        .not("first_name", "is", null)
        .neq("first_name", "")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as WavPremiumApplication[];
    },
  });
}

export function usePurgeEmptyApplications() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      // Delete rows where email or first_name is null or empty string
      const { error: e1 } = await supabase
        .from("wav_premium_applications")
        .delete()
        .or("email.is.null,email.eq.,first_name.is.null,first_name.eq.");
      if (e1) throw e1;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["wav-premium-applications"] });
    },
  });
}
