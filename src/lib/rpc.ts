import { supabase } from "@/integrations/supabase/client";

/**
 * Appel d'une fonction Postgres (RPC) de sécurité.
 *
 * Ces fonctions ne figurent pas dans `integrations/supabase/types.ts` (généré
 * depuis la base), d'où le cast — volontairement isolé ici pour qu'aucun `any`
 * ne se disperse dans les pages.
 */
type RpcResult<T> = Promise<{
  data: T | null;
  error: { code?: string; message?: string } | null;
}>;

export function callRpc<T>(fn: string, args: Record<string, unknown>): RpcResult<T> {
  const rpc = supabase.rpc as unknown as (f: string, a: Record<string, unknown>) => RpcResult<T>;
  return rpc(fn, args);
}

/**
 * Vrai si l'erreur signifie « cette fonction n'existe pas encore en base »
 * (migration pas encore appliquée). Dans ce cas seulement, l'appelant retombe
 * sur l'accès direct à la table : on préfère un site qui fonctionne encore
 * exposé plutôt qu'un tunnel de leads cassé en silence.
 */
export function isMissingFunction(error: { code?: string; message?: string } | null): boolean {
  if (!error) return false;
  if (error.code === "PGRST202" || error.code === "42883") return true;
  return /schema cache|does not exist|not find the function/i.test(error.message ?? "");
}
