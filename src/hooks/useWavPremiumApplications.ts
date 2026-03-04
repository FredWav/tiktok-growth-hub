import { useQuery } from "@tanstack/react-query";
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
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as WavPremiumApplication[];
    },
  });
}
