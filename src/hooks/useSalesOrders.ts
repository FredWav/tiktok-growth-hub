import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

// Local type — the Supabase generated types.ts will catch up after
// the migration runs. Until then, we cast through `any` at the
// supabase-js call site.
export interface SalesOrder {
  id: string;
  product_type: "one_shot" | "wav_premium";
  amount_cents: number | null;
  currency: string;
  invitation_id: string | null;
  application_id: string | null;
  first_name: string;
  last_name: string;
  email: string;
  whatsapp: string;
  billing_address_line1: string;
  billing_address_line2: string | null;
  billing_postal_code: string;
  billing_city: string;
  billing_country: string;
  consent_cgv: boolean;
  consent_cgv_at: string;
  consent_cgv_version: string;
  consent_renonciation: boolean;
  consent_renonciation_at: string;
  consent_rgpd: boolean;
  consent_rgpd_at: string;
  ip_address: string | null;
  user_agent: string | null;
  posthog_id: string | null;
  stripe_session_id: string | null;
  stripe_payment_intent_id: string | null;
  stripe_customer_id: string | null;
  payment_status: "awaiting_payment" | "paid" | "failed" | "refunded" | "cancelled";
  paid_at: string | null;
  admin_notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface WavPremiumInvitation {
  id: string;
  token: string;
  application_id: string | null;
  amount_cents: number;
  currency: string;
  prefill_email: string | null;
  prefill_first_name: string | null;
  prefill_last_name: string | null;
  created_by: string | null;
  expires_at: string;
  used_at: string | null;
  order_id: string | null;
  created_at: string;
}

export function useSalesOrders() {
  return useQuery({
    queryKey: ["sales_orders"],
    queryFn: async (): Promise<SalesOrder[]> => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase as any)
        .from("sales_orders")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as SalesOrder[];
    },
  });
}

export function useUpdateSalesOrderNotes() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, notes }: { id: string; notes: string }) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase as any)
        .from("sales_orders")
        .update({ admin_notes: notes })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["sales_orders"] });
      toast.success("Note enregistrée");
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useCreateWavPremiumInvitation() {
  return useMutation({
    mutationFn: async (input: {
      application_id?: string | null;
      amount_cents: number;
      expires_in_days?: number;
      prefill_email?: string;
      prefill_first_name?: string;
      prefill_last_name?: string;
    }): Promise<{ token: string; expires_at: string }> => {
      const { data, error } = await supabase.functions.invoke(
        "create-wav-premium-invitation",
        { body: input }
      );
      if (error) throw error;
      const r = data as { token?: string; expires_at?: string; error?: string };
      if (!r?.token) throw new Error(r?.error ?? "Échec création invitation");
      return { token: r.token, expires_at: r.expires_at ?? "" };
    },
    onError: (err: Error) => toast.error(err.message),
  });
}
