import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";

type PackFiles = { name: string; files: { label: string; path: string }[] };

export default function HooksDownload() {
  const token = useLocation().hash.slice(1);
  const [pack, setPack] = useState<PackFiles | null>(null);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState<string | null>(null);
  const [downloadError, setDownloadError] = useState(false);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setPack(null);
    void supabase.functions.invoke<PackFiles>("hooks-download", { body: { token } })
      .then(({ data, error }) => {
        if (active && !error) setPack(data);
      })
      .catch(() => {
        if (active) setPack(null);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => { active = false; };
  }, [token]);

  async function download(file: string) {
    setDownloading(file);
    setDownloadError(false);
    try {
      const { data, error } = await supabase.functions.invoke<Blob>("hooks-download", { body: { token, file } });
      if (error || !(data instanceof Blob)) throw new Error("Fichier indisponible");

      const url = URL.createObjectURL(data);
      const link = document.createElement("a");
      link.href = url;
      link.download = file;
      document.body.append(link);
      link.click();
      link.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 30_000);
    } catch {
      setDownloadError(true);
    } finally {
      setDownloading(null);
    }
  }

  return (
    <main className="mx-auto max-w-xl px-6 py-16" data-ph-mask>
      <h1 className="mb-4 font-display text-3xl font-semibold">{pack?.name ?? "Télécharger mon pack de hooks"}</h1>
      {loading && <p role="status">Chargement de tes fichiers…</p>}
      {!loading && !pack && <p role="status">Ce lien est invalide, expiré ou temporairement indisponible.</p>}
      {pack && (
        <>
          <p className="mb-6 text-muted-foreground">
            Si tu es encore dans le délai de 14 jours, tu perds ton droit de rétractation lorsque tu lances le
            premier téléchargement, conformément à l’accord confirmé dans ton email.
          </p>
          <ul className="space-y-3">
            {pack.files.map((file) => (
              <li key={file.path}>
                <Button type="button" disabled={downloading !== null} onClick={() => void download(file.path)}>
                  {downloading === file.path ? "Téléchargement…" : `Télécharger ${file.label}`}
                </Button>
              </li>
            ))}
          </ul>
        </>
      )}
      {downloadError && <p role="alert" className="mt-4">Le téléchargement a échoué. Réessaie ou contacte-nous.</p>}
      <p className="mt-6 text-sm">
        Besoin d’aide ? <a className="underline" href="mailto:contact@fredwav.com">contact@fredwav.com</a>
      </p>
    </main>
  );
}
