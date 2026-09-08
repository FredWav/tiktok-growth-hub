import { supabase } from "@/integrations/supabase/client";

export async function commerceCall<T>(
  name: string,
  body: Record<string, unknown>,
): Promise<T> {
  const { data, error } = await supabase.functions.invoke(name, { body });
  if (error) {
    let message =
      "La demande n’a pas pu être confirmée. Réessaie ; tes informations restent affichées.";
    if (error.context instanceof Response) {
      const detail = await error.context.json().catch(() => null);
      if (typeof detail?.error === "string") message = detail.error;
    }
    throw new Error(message);
  }
  if (data?.error) throw new Error(String(data.error));
  return data as T;
}

export const commerceInput =
  "mt-2 w-full rounded-lg border border-border bg-background px-3 py-3 text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary";
export const money = (cents: number) =>
  new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" }).format(
    cents / 100,
  );
