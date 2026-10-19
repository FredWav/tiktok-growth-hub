import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useHydrated } from "@/hooks/useHydrated";

export interface TrustedClient {
  id: string;
  name: string;
  avatar_url: string | null;
  tiktok_url: string | null;
  offers: string[];
  display_order: number;
  is_active: boolean;
  created_at: string;
  niche: string | null;
  metric: string | null;
  result: string | null;
  result_detail: string | null;
  youtube_id: string | null;
  video_caption: string | null;
  featured: boolean;
  anonymous: boolean;
}

// Listes publiques, liste de l'admin et témoignages du site : toutes rafraîchies.
const refreshAll = (qc: ReturnType<typeof useQueryClient>) => {
  for (const key of ["trusted-clients", "trusted-clients-all", "temoignages"]) {
    void qc.invalidateQueries({ queryKey: [key] });
  }
};

export const useTrustedClients = (filter?: string) => {
  const hydrated = useHydrated();
  return useQuery({
    queryKey: ["trusted-clients", filter],
    queryFn: async () => {
      let query = supabase
        .from("trusted_clients")
        .select("*")
        .eq("is_active", true)
        .order("display_order", { ascending: true });

      if (filter) {
        query = query.contains("offers", [filter]);
      }

      const { data, error } = await query;
      if (error) throw error;
      return (data as unknown as TrustedClient[]) || [];
    },
    enabled: hydrated,
  });
};

export const useAllTrustedClients = () => {
  const hydrated = useHydrated();
  return useQuery({
    queryKey: ["trusted-clients-all"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("trusted_clients")
        .select("*")
        .order("display_order", { ascending: true });
      if (error) throw error;
      return (data as unknown as TrustedClient[]) || [];
    },
    enabled: hydrated,
  });
};

export const useCreateTrustedClient = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (client: Omit<TrustedClient, "id" | "created_at">) => {
      const { data, error } = await supabase
        .from("trusted_clients")
        .insert(client)
        .select()
        .single();
      if (error) throw error;
      return data as unknown as TrustedClient;
    },
    onSuccess: () => refreshAll(qc),
  });
};

export const useUpdateTrustedClient = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<TrustedClient> & { id: string }) => {
      const { error } = await supabase
        .from("trusted_clients")
        .update(updates)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => refreshAll(qc),
  });
};

export const useDeleteTrustedClient = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("trusted_clients")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => refreshAll(qc),
  });
};
