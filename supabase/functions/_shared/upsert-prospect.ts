import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

interface ProspectData {
  email: string;
  full_name?: string;
  tiktok?: string;
  origin_source?: string;
  offer: "one_shot" | "45_jours" | "vip";
}

export async function upsertProspect(data: ProspectData) {
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL") || "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || ""
  );

  if (!data.email) return;

  // Check if a client with this email already exists
  const { data: existing } = await supabase
    .from("clients")
    .select("id, status")
    .eq("email", data.email)
    .maybeSingle();

  if (existing) {
    // Update tracking info but don't overwrite status if already 'active'
    const updates: Record<string, string | undefined> = {};
    if (data.full_name) updates.full_name = data.full_name;
    if (data.tiktok) updates.tiktok = data.tiktok;
    if (data.origin_source) updates.origin_source = data.origin_source;

    if (Object.keys(updates).length > 0) {
      await supabase.from("clients").update(updates).eq("id", existing.id);
    }
  } else {
    // Insert new prospect (no user_id since they don't have an account)
    await supabase.from("clients").insert({
      email: data.email,
      full_name: data.full_name || null,
      tiktok: data.tiktok || null,
      origin_source: data.origin_source || null,
      offer: data.offer,
      status: "prospect",
    });
  }
}
