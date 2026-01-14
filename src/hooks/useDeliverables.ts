import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Tables, TablesInsert, TablesUpdate } from "@/integrations/supabase/types";

export type Deliverable = Tables<"deliverables">;

export const useClientDeliverables = (clientId: string | undefined) => {
  return useQuery({
    queryKey: ["deliverables", clientId],
    queryFn: async () => {
      if (!clientId) throw new Error("Client ID required");

      const { data, error } = await supabase
        .from("deliverables")
        .select("*")
        .eq("client_id", clientId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as Deliverable[];
    },
    enabled: !!clientId,
  });
};

export const useCreateDeliverable = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (deliverable: TablesInsert<"deliverables">) => {
      const { data, error } = await supabase
        .from("deliverables")
        .insert(deliverable)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["deliverables", variables.client_id] });
    },
  });
};

export const useUpdateDeliverable = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      client_id,
      ...updates
    }: TablesUpdate<"deliverables"> & { id: string; client_id: string }) => {
      const { data, error } = await supabase
        .from("deliverables")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return { data, client_id };
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ["deliverables", result.client_id] });
    },
  });
};

export const useDeleteDeliverable = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, client_id }: { id: string; client_id: string }) => {
      const { error } = await supabase.from("deliverables").delete().eq("id", id);

      if (error) throw error;
      return { client_id };
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ["deliverables", result.client_id] });
    },
  });
};
