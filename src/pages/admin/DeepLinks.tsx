import { useState, useEffect } from "react";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "@/hooks/use-toast";
import { Copy, Trash2, Plus, ExternalLink } from "lucide-react";

interface DeepLink {
  id: string;
  slug: string;
  youtube_id: string;
  title: string;
  clicks_count: number;
  created_at: string;
}

const DOMAIN = "fredwav.lovable.app";

const DeepLinks = () => {
  const [links, setLinks] = useState<DeepLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [youtubeId, setYoutubeId] = useState("");
  const [creating, setCreating] = useState(false);

  const fetchLinks = async () => {
    const { data, error } = await supabase
      .from("deep_links")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      toast({ title: "Erreur", description: error.message, variant: "destructive" });
    } else {
      setLinks(data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchLinks();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !slug || !youtubeId) return;

    setCreating(true);
    const { error } = await supabase.from("deep_links").insert({
      title,
      slug: slug.toLowerCase().replace(/[^a-z0-9-]/g, ""),
      youtube_id: youtubeId,
    });

    if (error) {
      toast({ title: "Erreur", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Lien créé ✅" });
      setTitle("");
      setSlug("");
      setYoutubeId("");
      fetchLinks();
    }
    setCreating(false);
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("deep_links").delete().eq("id", id);
    if (error) {
      toast({ title: "Erreur", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Lien supprimé" });
      fetchLinks();
    }
  };

  const copyLink = (linkSlug: string) => {
    navigator.clipboard.writeText(`https://${DOMAIN}/go/${linkSlug}`);
    toast({ title: "Lien copié ! 📋" });
  };

  return (
    <AdminLayout>
      <div className="space-y-8">
        <h1 className="font-display text-3xl text-primary">Deep Links YouTube</h1>

        {/* Create form */}
        <form onSubmit={handleCreate} className="bg-noir-light border border-primary/20 rounded-xl p-6 space-y-4">
          <h2 className="text-lg font-semibold text-cream">Nouveau lien</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="title" className="text-cream/70">Titre</Label>
              <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Ma vidéo" className="bg-noir border-primary/30" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="slug" className="text-cream/70">Slug</Label>
              <Input id="slug" value={slug} onChange={(e) => setSlug(e.target.value)} placeholder="ma-video" className="bg-noir border-primary/30" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ytid" className="text-cream/70">YouTube ID</Label>
              <Input id="ytid" value={youtubeId} onChange={(e) => setYoutubeId(e.target.value)} placeholder="dQw4w9WgXcQ" className="bg-noir border-primary/30" />
            </div>
          </div>
          <Button type="submit" disabled={creating || !title || !slug || !youtubeId}>
            <Plus className="h-4 w-4 mr-2" /> Créer le lien
          </Button>
        </form>

        {/* Links table */}
        <div className="bg-noir-light border border-primary/20 rounded-xl overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="border-primary/20">
                <TableHead className="text-cream/70">Titre</TableHead>
                <TableHead className="text-cream/70">Slug</TableHead>
                <TableHead className="text-cream/70">YouTube ID</TableHead>
                <TableHead className="text-cream/70 text-center">Clics</TableHead>
                <TableHead className="text-cream/70 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-cream/50 py-8">Chargement...</TableCell>
                </TableRow>
              ) : links.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-cream/50 py-8">Aucun lien créé</TableCell>
                </TableRow>
              ) : (
                links.map((link) => (
                  <TableRow key={link.id} className="border-primary/10">
                    <TableCell className="text-cream font-medium">{link.title}</TableCell>
                    <TableCell className="text-cream/70 font-mono text-sm">/go/{link.slug}</TableCell>
                    <TableCell className="text-cream/70 font-mono text-sm">{link.youtube_id}</TableCell>
                    <TableCell className="text-center text-primary font-bold">{link.clicks_count}</TableCell>
                    <TableCell className="text-right space-x-2">
                      <Button variant="ghost" size="sm" onClick={() => copyLink(link.slug)}>
                        <Copy className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" asChild>
                        <a href={`https://www.youtube.com/watch?v=${link.youtube_id}`} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="h-4 w-4" />
                        </a>
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => handleDelete(link.id)} className="text-destructive hover:text-destructive">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </AdminLayout>
  );
};

export default DeepLinks;
