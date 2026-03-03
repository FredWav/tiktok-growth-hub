import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface DiagnosticLead {
  id: string;
  created_at: string;
  updated_at: string;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  tiktok: string | null;
  level: string | null;
  objective: string | null;
  blocker: string | null;
  budget: string | null;
  recommended_offer: string | null;
  current_step: number;
  completed: boolean;
}

export const useDiagnosticLeads = () => {
  return useQuery({
    queryKey: ["diagnostic-leads"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("diagnostic_leads" as any)
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as unknown as DiagnosticLead[];
    },
  });
};
