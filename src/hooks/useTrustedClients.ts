import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface TrustedClient {
  id: string;
  name: string;
  avatar_url: string | null;
  tiktok_url: string | null;
  offers: string[];
  display_order: number;
  is_active: boolean;
  created_at: string;
}

export const useTrustedClients = (filter?: string) => {
  return useQuery({
    queryKey: ["trusted-clients", filter],
    queryFn: async () => {
      let query = supabase
        .from("trusted_clients" as any)
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
  });
};

export const useAllTrustedClients = () => {
  return useQuery({
    queryKey: ["trusted-clients-all"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("trusted_clients" as any)
        .select("*")
        .order("display_order", { ascending: true });
      if (error) throw error;
      return (data as unknown as TrustedClient[]) || [];
    },
  });
};

export const useCreateTrustedClient = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (client: Omit<TrustedClient, "id" | "created_at">) => {
      const { data, error } = await supabase
        .from("trusted_clients" as any)
        .insert(client as any)
        .select()
        .single();
      if (error) throw error;
      return data as unknown as TrustedClient;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["trusted-clients"] }),
  });
};

export const useUpdateTrustedClient = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<TrustedClient> & { id: string }) => {
      const { error } = await supabase
        .from("trusted_clients" as any)
        .update(updates as any)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["trusted-clients"] });
    },
  });
};

export const useDeleteTrustedClient = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("trusted_clients" as any)
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["trusted-clients"] }),
  });
};
