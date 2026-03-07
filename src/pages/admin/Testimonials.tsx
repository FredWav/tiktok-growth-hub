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
import { Plus, Pencil, Trash2, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

const OFFER_OPTIONS = [
  { value: "one_shot", label: "One Shot" },
  { value: "premium", label: "Wav Premium" },
  { value: "diagnostic", label: "Diagnostic" },
  { value: "express", label: "Analyse Express" },
];

const emptyForm = {
  name: "",
  avatar_url: "",
  tiktok_url: "",
  offers: [] as string[],
  display_order: 0,
  is_active: true,
};

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
    try {
      if (editingId) {
        await updateMutation.mutateAsync({ id: editingId, ...form });
        toast.success("Client modifié");
      } else {
        await createMutation.mutateAsync(form);
        toast.success("Client ajouté");
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
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-display font-bold text-cream">Témoignages</h1>
            <p className="text-cream/60 text-sm">Gérez les clients affichés sur les pages publiques.</p>
          </div>
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
                  <div className="flex flex-wrap gap-1 mt-1">
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
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="bg-noir-light border-primary/20 text-cream">
          <DialogHeader>
            <DialogTitle>{editingId ? "Modifier" : "Ajouter"} un client</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label>Nom</Label>
              <Input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="Prénom Nom" className="mt-1" />
            </div>

            <div>
              <Label>Photo de profil</Label>
              <div className="flex items-center gap-3 mt-1">
                <Avatar className="h-14 w-14">
                  {form.avatar_url ? <AvatarImage src={form.avatar_url} /> : null}
                  <AvatarFallback className="bg-primary/10 text-primary">?</AvatarFallback>
                </Avatar>
                <Input type="file" accept="image/*" onChange={handleUpload} disabled={uploading} />
              </div>
            </div>

            <div>
              <Label>Lien TikTok</Label>
              <Input value={form.tiktok_url} onChange={(e) => setForm((f) => ({ ...f, tiktok_url: e.target.value }))} placeholder="https://tiktok.com/@..." className="mt-1" />
            </div>

            <div>
              <Label>Offres associées</Label>
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
              <Label>Ordre d'affichage</Label>
              <Input type="number" value={form.display_order} onChange={(e) => setForm((f) => ({ ...f, display_order: parseInt(e.target.value) || 0 }))} className="mt-1 w-24" />
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
