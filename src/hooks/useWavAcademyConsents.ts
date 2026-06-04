import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

// Dossier de consentement Wav Academy (preuve légale : CGV + renonciation rétractation).
export interface WavAcademyConsent {
  id: string;
  email: string;
  plan_type: string;
  // Ajouté par la migration 20260601000000 ; optionnel tant que types.ts n'est pas régénéré.
  access_months?: number | null;
  consent_cgv: boolean;
  consent_renonciation: boolean;
  cgv_version: string;
  ip_address: string | null;
  user_agent: string | null;
  stripe_session_id: string | null;
  created_at: string;
}

export function useWavAcademyConsents() {
  return useQuery({
    queryKey: ["wavacademy-consents"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("wavacademy_consents")
        .select("*")
        // Exclut les consentements de test (cgv_version='TEST') de la preuve légale.
        .neq("cgv_version", "TEST")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as WavAcademyConsent[];
    },
  });
}
