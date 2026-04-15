import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Tables, TablesInsert, TablesUpdate } from "@/integrations/supabase/types";

export type ClientWithProfile = Tables<"clients"> & {
  profile: { full_name: string | null } | null;
  total_tasks: number;
  done_tasks: number;
  next_session: string | null;
};

export const useClients = () => {
  return useQuery({
    queryKey: ["clients"],
    queryFn: async () => {
      // First get all clients
      const { data: clients, error: clientsError } = await supabase
        .from("clients")
        .select("*")
        .order("created_at", { ascending: false });

      if (clientsError) throw clientsError;

      // Get all profiles for mapping
      const userIds = clients?.map((c) => c.user_id).filter(Boolean) || [];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, full_name")
        .in("id", userIds);

      const profilesMap = new Map(
        profiles?.map((p) => [p.id, p.full_name]) || []
      );

      // Then get task counts and next sessions for each client
      const clientsWithStats = await Promise.all(
        (clients || []).map(async (client) => {
          // Get task counts
          const { count: totalTasks } = await supabase
            .from("tasks")
            .select("*", { count: "exact", head: true })
            .eq("client_id", client.id);

          const { count: doneTasks } = await supabase
            .from("tasks")
            .select("*", { count: "exact", head: true })
            .eq("client_id", client.id)
            .eq("status", "done");

          // Get next scheduled session
          const { data: nextSession } = await supabase
            .from("sessions")
            .select("scheduled_at")
            .eq("client_id", client.id)
            .eq("status", "scheduled")
            .gt("scheduled_at", new Date().toISOString())
            .order("scheduled_at", { ascending: true })
            .limit(1)
            .maybeSingle();

          // Name priority: auth profile (linked account) → direct full_name column
          // (set for prospects created via upsertProspect) → email → tiktok handle
          const profileName = profilesMap.get(client.user_id) || null;
          const directName = (client as Record<string, unknown>).full_name as string | null || null;
          const emailFallback = (client as Record<string, unknown>).email as string | null || null;
          const tiktokFallback = (client as Record<string, unknown>).tiktok as string | null;
          const displayName =
            profileName ||
            directName ||
            emailFallback ||
            (tiktokFallback ? `@${tiktokFallback}` : null);

          return {
            ...client,
            profile: { full_name: displayName },
            total_tasks: totalTasks || 0,
            done_tasks: doneTasks || 0,
            next_session: nextSession?.scheduled_at || null,
          } as ClientWithProfile;
        })
      );

      return clientsWithStats;
    },
  });
};

export const useClient = (clientId: string | undefined) => {
  return useQuery({
    queryKey: ["client", clientId],
    queryFn: async () => {
      if (!clientId) throw new Error("Client ID required");

      const { data: client, error } = await supabase
        .from("clients")
        .select("*")
        .eq("id", clientId)
        .single();

      if (error) throw error;

      // Get profile separately
      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name, avatar_url")
        .eq("id", client.user_id)
        .maybeSingle();

      return { ...client, profile };
    },
    enabled: !!clientId,
  });
};

export const useCreateClient = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (client: TablesInsert<"clients">) => {
      const { data, error } = await supabase
        .from("clients")
        .insert(client)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clients"] });
    },
  });
};

export const useUpdateClient = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      ...updates
    }: TablesUpdate<"clients"> & { id: string }) => {
      const { data, error } = await supabase
        .from("clients")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["clients"] });
      queryClient.invalidateQueries({ queryKey: ["client", variables.id] });
    },
  });
};
