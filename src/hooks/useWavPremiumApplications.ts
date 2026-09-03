import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface WavPremiumApplication {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  account_url: string | null;
  tiktok_username: string | null;
  instagram_username: string | null;
  youtube_url: string | null;
  facebook_url: string | null;
  other_social_url: string | null;
  profil: string | null;
  form_version: string | null;
  business_stage: string | null;
  primary_goal: string | null;
  main_blocker: string | null;
  work_mode: string | null;
  qualification_route: "wavstats" | "express" | "call" | null;
  recommended_offer: "wavstats" | "express" | "academy" | "sprint" | "one_shot" | "premium" | null;
  qualification_score: number | null;
  objectives: string[] | null;
  success_30_days: string | null;
  why_now: string | null;
  help_topics: string[] | null;
  availability: string | null;
  motivation: string | null;
  accompagnement_type: string | null;
  accompagnement_critere: string | null;
  goals: string;
  budget: string | null;
  origin_source: string | null;
  follower_since: string | null;
  conversion_trigger: string | null;
  // Champs historiques (anciennes candidatures) — conservés pour relecture
  current_level: string | null;
  blockers: string | null;
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
      return data as unknown as WavPremiumApplication[];
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
