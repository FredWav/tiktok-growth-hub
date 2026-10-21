import { AdminTabs, CONTENT_TABS } from "@/components/admin/AdminTabs";
import { useState } from "react";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { useAllTrustedClients, useCreateTrustedClient, useUpdateTrustedClient, useDeleteTrustedClient, TrustedClient } from "@/hooks/useTrustedClients";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Pencil, Trash2, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { AdminScreenshots } from "@/components/admin/AdminScreenshots";

const OFFER_OPTIONS = [
  { value: "one_shot", label: "One Shot" },
  { value: "academy", label: "Wav Academy" },
  { value: "premium", label: "Wav Premium" },
  { value: "express", label: "Analyse Express" },
  { value: "video", label: "Analyse vidéo" },
];

const emptyForm = {
  name: "",
  avatar_url: "",
  tiktok_url: "",
  offers: [] as string[],
  display_order: 0,
  is_active: true,
  niche: "",
  metric: "",
  result: "",
  result_detail: "",
  youtube: "",
  tiktok_video: "",
  video_caption: "",
  featured: false,
  anonymous: false,
};

/** Identifiant YouTube depuis un lien (watch, youtu.be, shorts) ou l'identifiant seul. */
function youtubeIdOf(value: string): string | null {
  const v = value.trim();
  if (!v) return null;
  if (/^[A-Za-z0-9_-]{11}$/.test(v)) return v;
  const m = v.match(/(?:youtu\.be\/|v=|shorts\/|embed\/)([A-Za-z0-9_-]{11})/);
  return m ? m[1] : null;
}
/** Identifiant d'une vidéo TikTok depuis son lien (…/video/<identifiant>) ou l'identifiant seul. */
function tiktokVideoIdOf(value: string): string | null {
  const v = value.trim();
  if (!v) return null;
  if (/^[0-9]{15,22}$/.test(v)) return v;
  const m = v.match(/\/video\/([0-9]{15,22})/);
  return m ? m[1] : null;
}
const blank = (v: string) => (v.trim() ? v.trim() : null);

const Testimonials = () => {
  const { data: clients, isLoading } = useAllTrustedClients();
  const createMutation = useCreateTrustedClient();
  const updateMutation = useUpdateTrustedClient();
  const deleteMutation = useDeleteTrustedClient();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [uploading, setUploading] = useState(false);

  const openCreate = () => {
    setEditingId(null);
    setForm(emptyForm);
    setDialogOpen(true);
  };

  const openEdit = (c: TrustedClient) => {
    setEditingId(c.id);
    setForm({
      name: c.name,
      avatar_url: c.avatar_url || "",
      tiktok_url: c.tiktok_url || "",
      offers: c.offers || [],
      display_order: c.display_order,
      is_active: c.is_active,
      niche: c.niche || "",
      metric: c.metric || "",
      result: c.result || "",
      result_detail: c.result_detail || "",
      youtube: c.youtube_id || "",
      tiktok_video: c.tiktok_video_id || "",
      video_caption: c.video_caption || "",
      featured: c.featured,
      anonymous: c.anonymous,
    });
    setDialogOpen(true);
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const ext = file.name.split(".").pop();
    const path = `${crypto.randomUUID()}.${ext}`;
    const { error } = await supabase.storage.from("trusted-avatars").upload(path, file);
    if (error) {
      toast.error("Erreur lors de l'upload");
      setUploading(false);
      return;
    }
    const { data: urlData } = supabase.storage.from("trusted-avatars").getPublicUrl(path);
    setForm((f) => ({ ...f, avatar_url: urlData.publicUrl }));
    setUploading(false);
    toast.success("Photo uploadée");
  };

  const toggleOffer = (value: string) => {
    setForm((f) => ({
      ...f,
      offers: f.offers.includes(value)
        ? f.offers.filter((o) => o !== value)
        : [...f.offers, value],
    }));
  };

  const handleSave = async () => {
    if (!form.name.trim()) {
      toast.error("Le nom est requis");
      return;
    }
    const youtube_id = youtubeIdOf(form.youtube);
    if (form.youtube.trim() && !youtube_id) {
      toast.error("Lien YouTube non reconnu");
      return;
    }
    const tiktok_video_id = tiktokVideoIdOf(form.tiktok_video);
    if (form.tiktok_video.trim() && !tiktok_video_id) {
      toast.error("Lien de vidéo TikTok non reconnu (https://www.tiktok.com/@compte/video/…)");
      return;
    }
    if (!!form.metric.trim() !== !!form.result.trim()) {
      toast.error("Un résultat a besoin des deux champs : le chiffre et sa description");
      return;
    }
    const { youtube: _youtube, tiktok_video: _tiktokVideo, ...rest } = form;
    const record = {
      ...rest,
      name: form.name.trim(),
      avatar_url: blank(form.avatar_url),
      tiktok_url: blank(form.tiktok_url),
      niche: blank(form.niche),
      metric: blank(form.metric),
      result: blank(form.result),
      result_detail: blank(form.result_detail),
      video_caption: blank(form.video_caption),
      youtube_id,
      tiktok_video_id,
    };
    try {
      if (editingId) {
        await updateMutation.mutateAsync({ id: editingId, ...record });
        toast.success("Témoignage modifié");
      } else {
        await createMutation.mutateAsync(record);
        toast.success("Témoignage ajouté");
      }
      setDialogOpen(false);
    } catch {
      toast.error("Erreur lors de la sauvegarde");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Supprimer ce client ?")) return;
    try {
      await deleteMutation.mutateAsync(id);
      toast.success("Client supprimé");
    } catch {
      toast.error("Erreur lors de la suppression");
    }
  };

  const handleToggleActive = async (id: string, current: boolean) => {
    await updateMutation.mutateAsync({ id, is_active: !current });
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <h1 className="text-2xl font-display font-bold text-cream">Site et contenus</h1>
        <AdminTabs items={CONTENT_TABS} />
        <p className="text-cream/60 text-sm">
          Une fiche par personne : photo, résultat chiffré et vidéo YouTube. Le site affiche les fiches actives
          (résultats chiffrés et vidéos) ; les changements apparaissent tout de suite pour les visiteurs.
        </p>

        <Tabs defaultValue="clients" className="w-full">
          <TabsList className="bg-noir border border-primary/10">
            <TabsTrigger value="clients">Témoignages</TabsTrigger>
            <TabsTrigger value="screenshots">Captures d'écran</TabsTrigger>
          </TabsList>

          <TabsContent value="clients" className="space-y-6 mt-6">
            <div className="flex items-center justify-end">
              <Button onClick={openCreate} className="gap-2">
                <Plus className="h-4 w-4" /> Ajouter
              </Button>
            </div>

        {isLoading ? (
          <p className="text-cream/60">Chargement...</p>
        ) : !clients?.length ? (
          <p className="text-cream/60">Aucun client ajouté pour l'instant.</p>
        ) : (
          <div className="grid gap-4">
            {clients.map((c) => (
              <div key={c.id} className="flex items-center gap-4 bg-noir-light border border-primary/10 rounded-xl p-4">
                <Avatar className="h-12 w-12">
                  {c.avatar_url ? <AvatarImage src={c.avatar_url} alt={c.name} /> : null}
                  <AvatarFallback className="bg-primary/10 text-primary text-sm">
                    {c.name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>

                <div className="flex-1 min-w-0">
                  <p className="font-medium text-cream truncate">{c.name}</p>
                  {(c.metric || c.niche) && (
                    <p className="text-sm text-cream/70 truncate">
                      {[c.niche, c.metric && c.result ? `${c.metric} ${c.result}` : null].filter(Boolean).join(" · ")}
                    </p>
                  )}
                  <div className="flex flex-wrap gap-1 mt-1">
                    {(c.youtube_id || c.tiktok_video_id) && (
                      <span className="text-[10px] bg-red-500/20 text-red-300 px-2 py-0.5 rounded-full">Vidéo</span>
                    )}
                    {c.metric && c.result && !c.anonymous && (
                      <span className="text-[10px] bg-green-500/20 text-green-300 px-2 py-0.5 rounded-full">Résultat</span>
                    )}
                    {c.featured && (
                      <span className="text-[10px] bg-primary/30 text-primary px-2 py-0.5 rounded-full">Accueil</span>
                    )}
                    {c.offers.map((o) => (
                      <span key={o} className="text-[10px] bg-primary/20 text-primary px-2 py-0.5 rounded-full">
                        {OFFER_OPTIONS.find((opt) => opt.value === o)?.label || o}
                      </span>
                    ))}
                  </div>
                </div>

                {c.tiktok_url && (
                  <a href={c.tiktok_url} target="_blank" rel="noopener noreferrer" className="text-cream/40 hover:text-primary">
                    <ExternalLink className="h-4 w-4" />
                  </a>
                )}

                <Switch checked={c.is_active} onCheckedChange={() => handleToggleActive(c.id, c.is_active)} />

                <Button variant="ghost" size="icon" onClick={() => openEdit(c)} className="text-cream/60 hover:text-cream">
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" onClick={() => handleDelete(c.id)} className="text-cream/60 hover:text-destructive">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        )}
          </TabsContent>

          <TabsContent value="screenshots" className="mt-6">
            <AdminScreenshots />
          </TabsContent>
        </Tabs>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="bg-noir-light border-primary/20 text-cream max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingId ? "Modifier" : "Ajouter"} un témoignage</DialogTitle>
            <DialogDescription className="text-cream/50">
              Seuls des chiffres réels, avec l'accord de la personne. Le résultat s'affiche si le chiffre et sa description sont remplis.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label className="text-cream">Nom</Label>
              <Input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="Prénom Nom" className="mt-1 text-cream bg-noir border-primary/20 placeholder:text-cream/30" />
            </div>

            <div>
              <Label className="text-cream">Photo de profil</Label>
              <div className="flex items-center gap-3 mt-1">
                <Avatar className="h-14 w-14">
                  {form.avatar_url ? <AvatarImage src={form.avatar_url} /> : null}
                  <AvatarFallback className="bg-primary/10 text-primary">?</AvatarFallback>
                </Avatar>
                <Input type="file" accept="image/*" onChange={handleUpload} disabled={uploading} className="text-cream bg-noir border-primary/20 file:text-cream/60" />
              </div>
            </div>

            <div>
              <Label className="text-cream">Lien TikTok</Label>
              <Input value={form.tiktok_url} onChange={(e) => setForm((f) => ({ ...f, tiktok_url: e.target.value }))} placeholder="https://tiktok.com/@..." className="mt-1 text-cream bg-noir border-primary/20 placeholder:text-cream/30" />
            </div>

            <div>
              <Label className="text-cream">Offres associées</Label>
              <div className="grid grid-cols-2 gap-2 mt-2">
                {OFFER_OPTIONS.map((opt) => (
                  <label key={opt.value} className="flex items-center gap-2 text-sm cursor-pointer">
                    <Checkbox checked={form.offers.includes(opt.value)} onCheckedChange={() => toggleOffer(opt.value)} />
                    {opt.label}
                  </label>
                ))}
              </div>
            </div>

            <div>
              <Label className="text-cream">Niche ou activité</Label>
              <Input value={form.niche} onChange={(e) => setForm((f) => ({ ...f, niche: e.target.value }))} placeholder="Films d'horreur" className="mt-1 text-cream bg-noir border-primary/20 placeholder:text-cream/30" />
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <Label className="text-cream">Chiffre</Label>
                <Input value={form.metric} onChange={(e) => setForm((f) => ({ ...f, metric: e.target.value }))} placeholder="×16" className="mt-1 text-cream bg-noir border-primary/20 placeholder:text-cream/30" />
              </div>
              <div className="col-span-2">
                <Label className="text-cream">Résultat</Label>
                <Input value={form.result} onChange={(e) => setForm((f) => ({ ...f, result: e.target.value }))} placeholder="de 180 à 3 000+ abonnés" className="mt-1 text-cream bg-noir border-primary/20 placeholder:text-cream/30" />
              </div>
            </div>

            <div>
              <Label className="text-cream">Précision (facultatif)</Label>
              <Input value={form.result_detail} onChange={(e) => setForm((f) => ({ ...f, result_detail: e.target.value }))} placeholder="en 2 mois, sur une niche pointue" className="mt-1 text-cream bg-noir border-primary/20 placeholder:text-cream/30" />
            </div>

            <div>
              <Label className="text-cream">Vidéo YouTube (lien ou identifiant)</Label>
              <Input value={form.youtube} onChange={(e) => setForm((f) => ({ ...f, youtube: e.target.value }))} placeholder="https://youtube.com/shorts/…" className="mt-1 text-cream bg-noir border-primary/20 placeholder:text-cream/30" />
            </div>

            <div>
              <Label className="text-cream">Vidéo TikTok (lien)</Label>
              <Input value={form.tiktok_video} onChange={(e) => setForm((f) => ({ ...f, tiktok_video: e.target.value }))} placeholder="https://www.tiktok.com/@compte/video/…" className="mt-1 text-cream bg-noir border-primary/20 placeholder:text-cream/30" />
            </div>

            <div>
              <Label className="text-cream">Légende de la vidéo (facultatif)</Label>
              <Input value={form.video_caption} onChange={(e) => setForm((f) => ({ ...f, video_caption: e.target.value }))} placeholder="De 180 à 3 000+ abonnés en 2 mois" className="mt-1 text-cream bg-noir border-primary/20 placeholder:text-cream/30" />
            </div>

            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <Checkbox checked={form.featured} onCheckedChange={(v) => setForm((f) => ({ ...f, featured: v === true }))} />
              Vidéo mise en avant sur l'accueil
            </label>
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <Checkbox checked={form.anonymous} onCheckedChange={(v) => setForm((f) => ({ ...f, anonymous: v === true }))} />
              Personne non nommée (vidéo sans légende, pas de carte résultat)
            </label>

            <div>
              <Label className="text-cream">Ordre d'affichage</Label>
              <Input type="number" value={form.display_order} onChange={(e) => setForm((f) => ({ ...f, display_order: parseInt(e.target.value) || 0 }))} className="mt-1 w-24 text-cream bg-noir border-primary/20" />
            </div>
          </div>

          <DialogFooter>
            <Button variant="ghost" onClick={() => setDialogOpen(false)}>Annuler</Button>
            <Button onClick={handleSave} disabled={createMutation.isPending || updateMutation.isPending}>
              {editingId ? "Enregistrer" : "Ajouter"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
};

export default Testimonials;
