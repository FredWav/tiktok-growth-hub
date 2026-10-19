import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useHydrated } from "@/hooks/useHydrated";
import snapshot from "@/data/temoignages.json";

/**
 * Témoignages publiés : une fiche par personne, gérée dans l'admin (Site et contenus).
 * Au rendu statique, la copie prise au build (scripts/export-temoignages.mjs) ;
 * dans le navigateur, la base en direct.
 */
export type Temoignage = {
  id: string;
  name: string;
  avatar_url: string | null;
  tiktok_url: string | null;
  offers: string[];
  display_order: number;
  niche: string | null;
  metric: string | null;
  result: string | null;
  result_detail: string | null;
  youtube_id: string | null;
  video_caption: string | null;
  featured: boolean;
  anonymous: boolean;
};

const COLUMNS =
  "id,name,avatar_url,tiktok_url,offers,display_order,niche,metric,result,result_detail,youtube_id,video_caption,featured,anonymous";

export function useTemoignages(): Temoignage[] {
  const hydrated = useHydrated();
  const { data } = useQuery({
    queryKey: ["temoignages"],
    queryFn: async () => {
      const { data, error } = await supabase.from("trusted_clients").select(COLUMNS)
        .eq("is_active", true).order("display_order").order("name");
      if (error) throw error;
      return data as Temoignage[];
    },
    enabled: hydrated,
    staleTime: 5 * 60 * 1000,
  });
  return data ?? (snapshot as Temoignage[]);
}

/** Cartes « résultat » : accroche chiffrée et description remplies. */
export const withResult = (t: Temoignage) => !t.anonymous && !!t.metric && !!t.result;

/** Étiquette d'offre des fiches (admin) pour une offre du catalogue. */
const OFFER_TAGS: Record<string, string> = { analyse_express: "express", analyse_video: "video" };

/**
 * Fiches d'une offre, en premier ; complétées par les autres si l'offre en a moins
 * que `count` (une page d'offre ne reste jamais sans preuve).
 */
export function forOffer(list: Temoignage[], offerId: string | undefined, count: number): Temoignage[] {
  if (!offerId) return list.slice(0, count);
  const tag = OFFER_TAGS[offerId] ?? offerId;
  const own = list.filter((t) => t.offers.includes(tag));
  return [...own, ...list.filter((t) => !own.includes(t))].slice(0, count);
}

/**
 * Vidéos d'une page d'offre : les deux premières vidéos mises en avant (PlotBreaker,
 * Lune de Lu), puis le premier client de l'offre, puis les autres dans l'ordre.
 */
export function videosForOffer(list: Temoignage[], offerId: string, count: number): Temoignage[] {
  const tag = OFFER_TAGS[offerId] ?? offerId;
  const picked = list.filter((t) => t.featured).slice(0, 2);
  const own = list.find((t) => t.offers.includes(tag) && !picked.includes(t));
  if (own) picked.push(own);
  return [...picked, ...list.filter((t) => !picked.includes(t))].slice(0, count);
}

/** Témoignages vidéo. */
export const withVideo = (t: Temoignage) => !!t.youtube_id;

/** Légende d'une vidéo : nom et précision (rien pour une personne non nommée). */
export function videoLegend(t: Temoignage): { name: string; sub: string } | null {
  if (t.anonymous) return null;
  const detail = t.video_caption ?? (t.metric && t.result ? `${t.metric} ${t.result}` : null);
  return { name: t.name, sub: [t.niche, detail].filter(Boolean).join(" · ") };
}
