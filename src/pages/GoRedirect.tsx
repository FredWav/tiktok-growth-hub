import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { callRpc, isMissingFunction } from "@/lib/rpc";
import { Loader2 } from "lucide-react";

const GoRedirect = () => {
  const { slug } = useParams<{ slug: string }>();
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!slug) return;

    const redirect = async () => {
      // Résolution du slug ET incrément du compteur en un seul appel serveur.
      // L'ancien code faisait un UPDATE direct, refusé par RLS (aucune policy
      // UPDATE publique) : le compteur de clics ne montait jamais.
      let youtubeId: string | null = null;

      const { data: rows, error: rpcError } = await callRpc<{ youtube_id: string }[]>(
        "increment_deep_link_click",
        { p_slug: slug },
      );

      if (!rpcError && rows?.length) {
        youtubeId = rows[0].youtube_id;
      } else if (isMissingFunction(rpcError)) {
        // Migration pas encore appliquée : on redirige quand même (le compteur
        // reste bloqué, comme aujourd'hui) plutôt que de casser le lien.
        const { data } = await supabase
          .from("deep_links")
          .select("youtube_id")
          .eq("slug", slug)
          .single();
        youtubeId = data?.youtube_id ?? null;
      }

      if (!youtubeId) {
        setError(true);
        return;
      }

      // Try deep link to YouTube app
      window.location.href = `youtube://www.youtube.com/watch?v=${youtubeId}`;

      // Fallback after 2.5s
      setTimeout(() => {
        window.location.href = `https://www.youtube.com/watch?v=${youtubeId}`;
      }, 2500);
    };

    redirect();
  }, [slug]);

  if (error) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <p className="text-white text-lg">Lien introuvable.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center gap-4">
      <Loader2 className="h-8 w-8 text-red-500 animate-spin" />
      <p className="text-white text-lg">Redirection vers YouTube en cours...</p>
    </div>
  );
};

export default GoRedirect;
