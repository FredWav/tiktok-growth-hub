import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Tables, TablesInsert, TablesUpdate } from "@/integrations/supabase/types";

export type Session = Tables<"sessions">;

export const useClientSessions = (clientId: string | undefined) => {
  return useQuery({
    queryKey: ["sessions", clientId],
    queryFn: async () => {
      if (!clientId) throw new Error("Client ID required");

      const { data, error } = await supabase
        .from("sessions")
        .select("*")
        .eq("client_id", clientId)
        .order("scheduled_at", { ascending: false });

      if (error) throw error;
      return data as Session[];
    },
    enabled: !!clientId,
  });
};

export const useUpcomingSessions = (days: number = 7) => {
  return useQuery({
    queryKey: ["upcoming-sessions", days],
    queryFn: async () => {
      const now = new Date();
      const future = new Date();
      future.setDate(future.getDate() + days);

      // Get sessions with client info
      const { data: sessions, error } = await supabase
        .from("sessions")
        .select(`
          *,
          client:clients(id, user_id, offer, status)
        `)
        .eq("status", "scheduled")
        .gte("scheduled_at", now.toISOString())
        .lte("scheduled_at", future.toISOString())
        .order("scheduled_at", { ascending: true });

      if (error) throw error;

      // Get unique user_ids to fetch profiles
      const userIds = [...new Set(sessions?.map(s => s.client?.user_id).filter(Boolean) || [])];
      
      if (userIds.length === 0) return sessions?.map(s => ({ ...s, clientName: 'Client inconnu' })) || [];

      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, full_name")
        .in("id", userIds);

      const profileMap = new Map(profiles?.map(p => [p.id, p.full_name]) || []);

      return sessions?.map(session => ({
        ...session,
        clientName: session.client?.user_id ? profileMap.get(session.client.user_id) || 'Client inconnu' : 'Client inconnu'
      })) || [];
    },
  });
};

export const useCreateSession = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (session: TablesInsert<"sessions">) => {
      const { data, error } = await supabase
        .from("sessions")
        .insert(session)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["sessions", variables.client_id] });
      queryClient.invalidateQueries({ queryKey: ["upcoming-sessions"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] });
    },
  });
};

export const useUpdateSession = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      client_id,
      ...updates
    }: TablesUpdate<"sessions"> & { id: string; client_id: string }) => {
      const { data, error } = await supabase
        .from("sessions")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return { data, client_id };
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ["sessions", result.client_id] });
      queryClient.invalidateQueries({ queryKey: ["upcoming-sessions"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] });
    },
  });
};

export const useDeleteSession = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, client_id }: { id: string; client_id: string }) => {
      const { error } = await supabase.from("sessions").delete().eq("id", id);

      if (error) throw error;
      return { client_id };
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ["sessions", result.client_id] });
      queryClient.invalidateQueries({ queryKey: ["upcoming-sessions"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] });
    },
  });
};
