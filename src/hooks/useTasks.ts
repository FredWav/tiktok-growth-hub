import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Tables, TablesInsert, TablesUpdate } from "@/integrations/supabase/types";

export type Task = Tables<"tasks">;

export const useClientTasks = (clientId: string | undefined) => {
  return useQuery({
    queryKey: ["tasks", clientId],
    queryFn: async () => {
      if (!clientId) throw new Error("Client ID required");

      const { data, error } = await supabase
        .from("tasks")
        .select("*")
        .eq("client_id", clientId)
        .order("position", { ascending: true })
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as Task[];
    },
    enabled: !!clientId,
  });
};

export const useCreateTask = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (task: TablesInsert<"tasks">) => {
      const { data, error } = await supabase
        .from("tasks")
        .insert(task)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["tasks", variables.client_id] });
      queryClient.invalidateQueries({ queryKey: ["clients"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] });
    },
  });
};

export const useUpdateTask = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      client_id,
      ...updates
    }: TablesUpdate<"tasks"> & { id: string; client_id: string }) => {
      const { data, error } = await supabase
        .from("tasks")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return { data, client_id };
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ["tasks", result.client_id] });
      queryClient.invalidateQueries({ queryKey: ["clients"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] });
    },
  });
};

export const useDeleteTask = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, client_id }: { id: string; client_id: string }) => {
      const { error } = await supabase.from("tasks").delete().eq("id", id);

      if (error) throw error;
      return { client_id };
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ["tasks", result.client_id] });
      queryClient.invalidateQueries({ queryKey: ["clients"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] });
    },
  });
};

export const useOverdueTasks = () => {
  return useQuery({
    queryKey: ["overdue-tasks"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tasks")
        .select(`
          *,
          client:clients(
            id,
            profile:profiles!clients_user_id_fkey(full_name)
          )
        `)
        .lt("due_date", new Date().toISOString().split("T")[0])
        .neq("status", "done")
        .order("due_date", { ascending: true });

      if (error) throw error;
      return data;
    },
  });
};
