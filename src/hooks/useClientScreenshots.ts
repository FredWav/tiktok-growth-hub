import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface ClientScreenshot {
  id: string;
  image_url: string;
  client_name: string | null;
  caption: string | null;
  offer: string[];
  display_locations: string[];
  display_order: number;
  is_active: boolean;
  created_at: string;
}

export const useClientScreenshots = (location: string) => {
  return useQuery({
    queryKey: ["client-screenshots", location],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("client_screenshots")
        .select("*")
        .contains("display_locations", [location])
        .eq("is_active", true)
        .order("display_order", { ascending: true });
      if (error) throw error;
      return data as ClientScreenshot[];
    },
  });
};

export const useAllClientScreenshots = () => {
  return useQuery({
    queryKey: ["client-screenshots", "all"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("client_screenshots")
        .select("*")
        .order("display_order", { ascending: true });
      if (error) throw error;
      return data as ClientScreenshot[];
    },
  });
};

export const useCreateClientScreenshot = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: Omit<ClientScreenshot, "id" | "created_at">) => {
      const { error } = await supabase.from("client_screenshots").insert(data);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["client-screenshots"] }),
  });
};

export const useUpdateClientScreenshot = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...data }: { id: string } & Partial<ClientScreenshot>) => {
      const { error } = await supabase.from("client_screenshots").update(data).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["client-screenshots"] }),
  });
};

export const useDeleteClientScreenshot = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("client_screenshots").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["client-screenshots"] }),
  });
};
