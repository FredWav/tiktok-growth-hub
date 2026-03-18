import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";

const GoRedirect = () => {
  const { slug } = useParams<{ slug: string }>();
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!slug) return;

    const redirect = async () => {
      const { data, error: fetchError } = await supabase
        .from("deep_links")
        .select("youtube_id, clicks_count")
        .eq("slug", slug)
        .single();

      if (fetchError || !data) {
        setError(true);
        return;
      }

      // Increment clicks (fire and forget)
      supabase
        .from("deep_links")
        .update({ clicks_count: data.clicks_count + 1 })
        .eq("slug", slug)
        .then();

      const youtubeId = data.youtube_id;

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
