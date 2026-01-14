import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface DashboardStats {
  activeClients: number;
  upcomingSessions: number;
  overdueTasks: number;
  monthlyRevenue: number;
}

export const useDashboardStats = () => {
  return useQuery({
    queryKey: ["dashboard-stats"],
    queryFn: async (): Promise<DashboardStats> => {
      // Get active clients count
      const { count: activeClients } = await supabase
        .from("clients")
        .select("*", { count: "exact", head: true })
        .eq("status", "active");

      // Get upcoming sessions (next 7 days)
      const now = new Date();
      const weekFromNow = new Date();
      weekFromNow.setDate(weekFromNow.getDate() + 7);

      const { count: upcomingSessions } = await supabase
        .from("sessions")
        .select("*", { count: "exact", head: true })
        .eq("status", "scheduled")
        .gte("scheduled_at", now.toISOString())
        .lte("scheduled_at", weekFromNow.toISOString());

      // Get overdue tasks
      const today = new Date().toISOString().split("T")[0];
      const { count: overdueTasks } = await supabase
        .from("tasks")
        .select("*", { count: "exact", head: true })
        .lt("due_date", today)
        .neq("status", "done");

      // Get monthly revenue
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);

      const { data: bookings } = await supabase
        .from("bookings")
        .select("amount_cents")
        .eq("payment_status", "paid")
        .gte("paid_at", startOfMonth.toISOString());

      const monthlyRevenue =
        bookings?.reduce((sum, b) => sum + (b.amount_cents || 0), 0) || 0;

      return {
        activeClients: activeClients || 0,
        upcomingSessions: upcomingSessions || 0,
        overdueTasks: overdueTasks || 0,
        monthlyRevenue: monthlyRevenue / 100, // Convert cents to euros
      };
    },
  });
};
