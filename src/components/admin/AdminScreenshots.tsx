import { useState } from "react";
import {
  useAllClientScreenshots,
  useCreateClientScreenshot,
  useUpdateClientScreenshot,
  useDeleteClientScreenshot,
  ClientScreenshot,
} from "@/hooks/useClientScreenshots";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

const OFFER_OPTIONS = [
  { value: "one_shot", label: "One Shot" },
  { value: "premium", label: "Wav Premium" },
  { value: "diagnostic", label: "Diagnostic" },
  { value: "express", label: "Analyse Express" },
];

const LOCATION_OPTIONS = [
  { value: "home", label: "Accueil" },
  { value: "preuves", label: "Preuves" },
  { value: "offres", label: "Offres" },
  { value: "diagnostic_result", label: "Résultat diagnostic" },
];

const emptyForm = {
  image_url: "",
  client_name: "",
  caption: "",
  offer: [] as string[],
  display_locations: [] as string[],
  display_order: 0,
  is_active: true,
};

export const AdminScreenshots = () => {
  const { data: screenshots, isLoading } = useAllClientScreenshots();
  const createMutation = useCreateClientScreenshot();
  const updateMutation = useUpdateClientScreenshot();
  const deleteMutation = useDeleteClientScreenshot();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [uploading, setUploading] = useState(false);

  const openCreate = () => {
    setEditingId(null);
    setForm(emptyForm);
    setDialogOpen(true);
  };

  const openEdit = (s: ClientScreenshot) => {
    setEditingId(s.id);
    setForm({
      image_url: s.image_url,
      client_name: s.client_name || "",
      caption: s.caption || "",
      offer: s.offer || [],
      display_locations: s.display_locations || [],
      display_order: s.display_order,
      is_active: s.is_active,
    });
    setDialogOpen(true);
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const ext = file.name.split(".").pop();
    const path = `${crypto.randomUUID()}.${ext}`;
    const { error } = await supabase.storage.from("client-screenshots").upload(path, file);
    if (error) {
      toast.error("Erreur lors de l'upload");
      setUploading(false);
      return;
    }
    const { data: urlData } = supabase.storage.from("client-screenshots").getPublicUrl(path);
    setForm((f) => ({ ...f, image_url: urlData.publicUrl }));
    setUploading(false);
    toast.success("Image uploadée");
  };

  const toggleArray = (key: "offer" | "display_locations", value: string) => {
    setForm((f) => ({
      ...f,
      [key]: f[key].includes(value) ? f[key].filter((v) => v !== value) : [...f[key], value],
    }));
  };

  const handleSave = async () => {
    if (!form.image_url) {
      toast.error("L'image est requise");
      return;
    }
    try {
      const payload = {
        ...form,
        client_name: form.client_name || null,
        caption: form.caption || null,
      };
      if (editingId) {
        await updateMutation.mutateAsync({ id: editingId, ...payload });
        toast.success("Capture modifiée");
      } else {
        await createMutation.mutateAsync(payload);
        toast.success("Capture ajoutée");
      }
      setDialogOpen(false);
    } catch {
      toast.error("Erreur lors de la sauvegarde");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Supprimer cette capture ?")) return;
    try {
      await deleteMutation.mutateAsync(id);
      toast.success("Capture supprimée");
    } catch {
      toast.error("Erreur lors de la suppression");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-display font-bold text-cream">Captures d'écran</h2>
          <p className="text-cream/60 text-sm">Messages de clients satisfaits à afficher sur le site.</p>
        </div>
        <Button onClick={openCreate} className="gap-2">
          <Plus className="h-4 w-4" /> Ajouter
        </Button>
      </div>

      {isLoading ? (
        <p className="text-cream/60">Chargement...</p>
      ) : !screenshots?.length ? (
        <p className="text-cream/60">Aucune capture ajoutée.</p>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {screenshots.map((s) => (
            <div key={s.id} className="relative group rounded-xl overflow-hidden border border-primary/10 bg-noir-light">
              <img src={s.image_url} alt={s.client_name || "Capture"} className="w-full h-auto" />
              {!s.is_active && (
                <div className="absolute top-2 left-2 bg-destructive/80 text-white text-[10px] px-2 py-0.5 rounded-full">
                  Inactif
                </div>
              )}
              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                <Button variant="ghost" size="icon" onClick={() => openEdit(s)} className="text-white hover:text-primary">
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" onClick={() => handleDelete(s.id)} className="text-white hover:text-destructive">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
              <div className="p-2">
                <div className="flex flex-wrap gap-1">
                  {s.display_locations.map((loc) => (
                    <span key={loc} className="text-[10px] bg-primary/20 text-primary px-1.5 py-0.5 rounded-full">
                      {LOCATION_OPTIONS.find((o) => o.value === loc)?.label || loc}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="bg-noir-light border-primary/20 text-cream max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingId ? "Modifier" : "Ajouter"} une capture</DialogTitle>
            <DialogDescription className="text-cream/50">
              Uploadez une capture d'écran de message client.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label className="text-cream">Image</Label>
              <div className="flex items-center gap-3 mt-1">
                {form.image_url && (
                  <img src={form.image_url} alt="Preview" className="h-20 w-auto rounded-lg border border-primary/20" />
                )}
                <Input type="file" accept="image/*" onChange={handleUpload} disabled={uploading} className="text-cream bg-noir border-primary/20 file:text-cream/60" />
              </div>
            </div>

            <div>
              <Label className="text-cream">Nom du client (optionnel)</Label>
              <Input value={form.client_name} onChange={(e) => setForm((f) => ({ ...f, client_name: e.target.value }))} placeholder="Prénom" className="mt-1 text-cream bg-noir border-primary/20 placeholder:text-cream/30" />
            </div>

            <div>
              <Label className="text-cream">Légende (optionnel)</Label>
              <Input value={form.caption} onChange={(e) => setForm((f) => ({ ...f, caption: e.target.value }))} placeholder="Merci Fred !" className="mt-1 text-cream bg-noir border-primary/20 placeholder:text-cream/30" />
            </div>

            <div>
              <Label className="text-cream">Offres associées</Label>
              <div className="grid grid-cols-2 gap-2 mt-2">
                {OFFER_OPTIONS.map((opt) => (
                  <label key={opt.value} className="flex items-center gap-2 text-sm cursor-pointer">
                    <Checkbox checked={form.offer.includes(opt.value)} onCheckedChange={() => toggleArray("offer", opt.value)} />
                    {opt.label}
                  </label>
                ))}
              </div>
            </div>

            <div>
              <Label className="text-cream">Pages d'affichage</Label>
              <div className="grid grid-cols-2 gap-2 mt-2">
                {LOCATION_OPTIONS.map((opt) => (
                  <label key={opt.value} className="flex items-center gap-2 text-sm cursor-pointer">
                    <Checkbox checked={form.display_locations.includes(opt.value)} onCheckedChange={() => toggleArray("display_locations", opt.value)} />
                    {opt.label}
                  </label>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div>
                <Label className="text-cream">Ordre</Label>
                <Input type="number" value={form.display_order} onChange={(e) => setForm((f) => ({ ...f, display_order: parseInt(e.target.value) || 0 }))} className="mt-1 w-24 text-cream bg-noir border-primary/20" />
              </div>
              <div className="flex items-center gap-2 mt-6">
                <Switch checked={form.is_active} onCheckedChange={(v) => setForm((f) => ({ ...f, is_active: v }))} />
                <Label className="text-cream text-sm">Actif</Label>
              </div>
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
    </div>
  );
};
