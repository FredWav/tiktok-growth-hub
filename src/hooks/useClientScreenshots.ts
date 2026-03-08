import { useQuery } from "@tanstack/react-query";
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
  const { useMutation, useQueryClient } = require("@tanstack/react-query");
  // We'll use inline mutations instead
};

// Export mutation helpers for admin
export const clientScreenshotMutations = {
  async create(data: Omit<ClientScreenshot, "id" | "created_at">) {
    const { error } = await supabase.from("client_screenshots").insert(data);
    if (error) throw error;
  },
  async update(id: string, data: Partial<ClientScreenshot>) {
    const { error } = await supabase.from("client_screenshots").update(data).eq("id", id);
    if (error) throw error;
  },
  async remove(id: string) {
    const { error } = await supabase.from("client_screenshots").delete().eq("id", id);
    if (error) throw error;
  },
};
