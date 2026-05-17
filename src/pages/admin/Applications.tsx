import { useState } from "react";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { useWavPremiumApplications, usePurgeEmptyApplications, WavPremiumApplication } from "@/hooks/useWavPremiumApplications";
import { useCreateWavPremiumInvitation } from "@/hooks/useSalesOrders";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Loader2, Trash2, Link as LinkIcon, Copy, Check } from "lucide-react";
import { toast } from "sonner";

const budgetLabels: Record<string, string> = {
  "10_a_100": "De 10€ à 100€",
  "100_a_300": "De 100€ à 300€",
  "1000_plus": "1000€ et +",
};

const Applications = () => {
  const { data: applications, isLoading } = useWavPremiumApplications();
  const [selected, setSelected] = useState<WavPremiumApplication | null>(null);
  const [confirmPurge, setConfirmPurge] = useState(false);
  const purge = usePurgeEmptyApplications();
  const createInvitation = useCreateWavPremiumInvitation();
  const [inviteAmount, setInviteAmount] = useState("");
  const [inviteExpiry, setInviteExpiry] = useState("14");
  const [generatedUrl, setGeneratedUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const resetInviteForm = () => {
    setInviteAmount("");
    setInviteExpiry("14");
    setGeneratedUrl(null);
    setCopied(false);
  };

  const handleGenerateInvite = async () => {
    if (!selected) return;
    const eurs = parseFloat(inviteAmount.replace(",", "."));
    if (!Number.isFinite(eurs) || eurs <= 0) {
      toast.error("Montant invalide");
      return;
    }
    const days = parseInt(inviteExpiry, 10);
    if (!Number.isFinite(days) || days <= 0 || days > 60) {
      toast.error("Durée d'expiration invalide (1–60 jours)");
      return;
    }
    try {
      const res = await createInvitation.mutateAsync({
        application_id: selected.id,
        amount_cents: Math.round(eurs * 100),
        expires_in_days: days,
        prefill_email: selected.email,
        prefill_first_name: selected.first_name,
        prefill_last_name: selected.last_name,
      });
      const url = `${window.location.origin}/checkout/wav-premium?token=${encodeURIComponent(res.token)}`;
      setGeneratedUrl(url);
      toast.success("Lien d'invitation généré");
    } catch {
      // toast already shown by hook
    }
  };

  const handleCopy = async () => {
    if (!generatedUrl) return;
    try {
      await navigator.clipboard.writeText(generatedUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Impossible de copier dans le presse-papier");
    }
  };

  const handlePurge = async () => {
    await purge.mutateAsync();
    setConfirmPurge(false);
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="font-display text-3xl text-primary">Candidatures Wav Premium</h1>
          {!confirmPurge ? (
            <Button
              variant="outline"
              size="sm"
              className="border-red-500/40 text-red-400 hover:bg-red-500/10 hover:text-red-300"
              onClick={() => setConfirmPurge(true)}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Purger les vides
            </Button>
          ) : (
            <div className="flex items-center gap-2">
              <span className="text-cream/60 text-sm">Supprimer toutes les entrées sans email ?</span>
              <Button
                size="sm"
                variant="destructive"
                disabled={purge.isPending}
                onClick={handlePurge}
              >
                {purge.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Confirmer"}
              </Button>
              <Button size="sm" variant="outline" onClick={() => setConfirmPurge(false)}>
                Annuler
              </Button>
            </div>
          )}
        </div>

        {applications && (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div className="bg-noir-light border border-primary/20 rounded-lg p-4">
              <p className="text-cream/60 text-sm">Total</p>
              <p className="text-2xl font-bold text-cream">{applications.length}</p>
            </div>
            <div className="bg-noir-light border border-green-500/20 rounded-lg p-4">
              <p className="text-cream/60 text-sm">Avec source</p>
              <p className="text-2xl font-bold text-green-400">
                {applications.filter((a) => a.origin_source).length}
              </p>
            </div>
            <div className="bg-noir-light border border-yellow-500/20 rounded-lg p-4">
              <p className="text-cream/60 text-sm">Cette semaine</p>
              <p className="text-2xl font-bold text-yellow-400">
                {applications.filter((a) => {
                  const d = new Date(a.created_at);
                  const now = new Date();
                  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                  return d >= weekAgo;
                }).length}
              </p>
            </div>
          </div>
        )}

        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : !applications?.length ? (
          <p className="text-cream/60 text-center py-12">Aucune candidature pour le moment.</p>
        ) : (
          <div className="bg-noir-light border border-primary/20 rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="border-primary/20">
                  <TableHead className="text-cream/70">Date</TableHead>
                  <TableHead className="text-cream/70">Nom</TableHead>
                  <TableHead className="text-cream/70">Email</TableHead>
                  <TableHead className="text-cream/70">TikTok</TableHead>
                  <TableHead className="text-cream/70">Niveau</TableHead>
                  <TableHead className="text-cream/70">Source</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {applications.map((app) => (
                  <TableRow
                    key={app.id}
                    className="border-primary/10 cursor-pointer hover:bg-primary/5"
                    onClick={() => setSelected(app)}
                  >
                    <TableCell className="text-cream/80">
                      {format(new Date(app.created_at), "dd MMM yyyy HH:mm", { locale: fr })}
                    </TableCell>
                    <TableCell className="text-cream font-medium">
                      {app.first_name} {app.last_name}
                    </TableCell>
                    <TableCell className="text-cream/80">{app.email}</TableCell>
                    <TableCell className="text-cream/80">
                      {app.tiktok_username ? `@${app.tiktok_username}` : "-"}
                    </TableCell>
                    <TableCell className="text-cream/80 max-w-[200px] truncate">
                      {app.current_level}
                    </TableCell>
                    <TableCell className="text-cream/80">
                      {app.origin_source || "-"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      <Dialog
        open={!!selected}
        onOpenChange={(open) => {
          if (!open) {
            setSelected(null);
            resetInviteForm();
          }
        }}
      >
        <DialogContent className="bg-noir-light border-primary/20 text-cream max-w-2xl max-h-[80vh] overflow-y-auto">
          {selected && (
            <>
              <DialogHeader>
                <DialogTitle className="text-primary text-xl">
                  {selected.first_name} {selected.last_name}
                </DialogTitle>
                <DialogDescription className="text-cream/60">
                  Candidature du {format(new Date(selected.created_at), "dd MMMM yyyy à HH:mm", { locale: fr })}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 mt-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-cream/50 text-sm">Email</p>
                    <p>{selected.email}</p>
                  </div>
                  <div>
                    <p className="text-cream/50 text-sm">TikTok</p>
                    <p>{selected.tiktok_username ? `@${selected.tiktok_username}` : "-"}</p>
                  </div>
                  <div>
                    <p className="text-cream/50 text-sm">Niveau</p>
                    <p>{selected.current_level}</p>
                  </div>
                  <div>
                    <p className="text-cream/50 text-sm">Budget</p>
                    <p>{selected.budget ? (budgetLabels[selected.budget] ?? selected.budget) : "-"}</p>
                  </div>
                  <div>
                    <p className="text-cream/50 text-sm">Source</p>
                    <p>{selected.origin_source || "-"}</p>
                  </div>
                  <div>
                    <p className="text-cream/50 text-sm">Follower depuis</p>
                    <p>{selected.follower_since || "-"}</p>
                  </div>
                  <div>
                    <p className="text-cream/50 text-sm">Ce qui t'a décidé</p>
                    <p>{selected.conversion_trigger || "-"}</p>
                  </div>
                </div>
                <div>
                  <p className="text-cream/50 text-sm mb-1">Points de blocage</p>
                  <p className="bg-noir rounded-lg p-3 whitespace-pre-wrap text-sm">{selected.blockers}</p>
                </div>
                <div>
                  <p className="text-cream/50 text-sm mb-1">Objectifs</p>
                  <p className="bg-noir rounded-lg p-3 whitespace-pre-wrap text-sm">{selected.goals}</p>
                </div>

                {/* Generate Wav Premium checkout invitation */}
                <div className="border-t border-primary/20 pt-4 mt-4 space-y-3">
                  <div className="flex items-center gap-2 text-primary">
                    <LinkIcon className="h-4 w-4" />
                    <h3 className="text-sm font-semibold uppercase tracking-wider">
                      Lien checkout Wav Premium
                    </h3>
                  </div>
                  <p className="text-xs text-cream/60">
                    Génère un lien d'invitation à usage unique. À envoyer toi-même au client
                    (WhatsApp / email).
                  </p>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs text-cream/50 mb-1 block">Montant (€)</label>
                      <Input
                        type="number"
                        inputMode="decimal"
                        step="0.01"
                        min="1"
                        placeholder="1490"
                        value={inviteAmount}
                        onChange={(e) => setInviteAmount(e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="text-xs text-cream/50 mb-1 block">Expiration (jours)</label>
                      <Input
                        type="number"
                        inputMode="numeric"
                        min="1"
                        max="60"
                        value={inviteExpiry}
                        onChange={(e) => setInviteExpiry(e.target.value)}
                      />
                    </div>
                  </div>

                  <Button
                    size="sm"
                    disabled={createInvitation.isPending || !inviteAmount}
                    onClick={handleGenerateInvite}
                    className="w-full"
                  >
                    {createInvitation.isPending ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        Génération…
                      </>
                    ) : (
                      <>
                        <LinkIcon className="h-4 w-4 mr-2" />
                        Générer le lien d'invitation
                      </>
                    )}
                  </Button>

                  {generatedUrl && (
                    <div className="bg-noir rounded-lg p-3 space-y-2">
                      <p className="text-xs text-cream/50">Lien à envoyer au client :</p>
                      <div className="flex items-center gap-2">
                        <code className="flex-1 text-xs bg-noir-light rounded px-2 py-2 break-all">
                          {generatedUrl}
                        </code>
                        <Button size="sm" variant="outline" onClick={handleCopy}>
                          {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
};

export default Applications;
