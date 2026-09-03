import { useState } from "react";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { useWavPremiumApplications, usePurgeEmptyApplications, WavPremiumApplication } from "@/hooks/useWavPremiumApplications";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Loader2, Trash2 } from "lucide-react";
import { BUDGET_LABELS, PREMIUM_BUDGET_LABELS } from "@/config/offers";

const budgetLabels: Record<string, string> = {
  // Grille actuelle — dérivée de config/offers.ts pour qu'aucune tranche ne
  // s'affiche jamais en code brut dans l'admin.
  ...BUDGET_LABELS,
  ...PREMIUM_BUDGET_LABELS,
  // Anciennes valeurs (candidatures historiques)
  "10_a_100": "De 10€ à 100€",
  "1000_plus": "1000€ et +",
};

const routeLabels: Record<string, string> = {
  wavstats: "WavStats",
  express: "Analyse Express",
  call: "Appel stratégique",
};

const offerLabels: Record<string, string> = {
  wavstats: "WavStats",
  express: "Analyse Express",
  academy: "Wav Academy",
  sprint: "Sprint stratégique",
  one_shot: "Sprint stratégique",
  premium: "Wav Premium",
};

const goalLabels: Record<string, string> = {
  comprendre_contenus: "Comprendre quels contenus fonctionnent et pourquoi",
  gagner_visibilite: "Développer la visibilité et l'audience",
  attirer_clients: "Attirer davantage de prospects ou de clients",
  mieux_vendre: "Mieux transformer l'audience en revenus",
  structurer_strategie: "Structurer un lancement ou une stratégie plus ambitieuse",
};

const workModeLabels: Record<string, string> = {
  outils_autonomes: "Décider seul avec des outils et des données",
  plan_ponctuel: "Construire un plan avec Fred, puis avancer seul",
  suivi_collectif: "Recevoir des retours réguliers en collectif",
  suivi_individuel: "Être suivi personnellement pendant l'exécution",
  autonome: "Avancer seul à partir de données claires",
  regard_strategique: "Décider avec un regard stratégique humain",
  a_definir: "Besoin à définir",
};

function applicationNetworks(application: WavPremiumApplication) {
  return [
    application.account_url && ["Compte principal", application.account_url],
    application.tiktok_username && ["TikTok", application.tiktok_username],
    application.instagram_username && ["Instagram", application.instagram_username],
    application.youtube_url && ["YouTube", application.youtube_url],
    application.facebook_url && ["Facebook", application.facebook_url],
    application.other_social_url && ["Autre", application.other_social_url],
  ].filter((network): network is string[] => Boolean(network));
}

const Applications = () => {
  const { data: applications, isLoading } = useWavPremiumApplications();
  const [selected, setSelected] = useState<WavPremiumApplication | null>(null);
  const [confirmPurge, setConfirmPurge] = useState(false);
  const purge = usePurgeEmptyApplications();

  const handlePurge = async () => {
    await purge.mutateAsync();
    setConfirmPurge(false);
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="font-display text-3xl text-primary">Demandes d'accompagnement</h1>
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
              <p className="text-cream/60 text-sm">Vers un appel</p>
              <p className="text-2xl font-bold text-green-400">
                {applications.filter((a) => a.qualification_route === "call").length}
              </p>
            </div>
            <div className="bg-noir-light border border-yellow-500/20 rounded-lg p-4">
              <p className="text-cream/60 text-sm">Vers les offres automatiques</p>
              <p className="text-2xl font-bold text-yellow-400">
                {applications.filter((a) => ["wavstats", "express"].includes(a.qualification_route ?? "")).length}
              </p>
            </div>
          </div>
        )}

        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : !applications?.length ? (
          <p className="text-cream/60 text-center py-12">Aucune demande pour le moment.</p>
        ) : (
          <div className="bg-noir-light border border-primary/20 rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="border-primary/20">
                  <TableHead className="text-cream/70">Date</TableHead>
                  <TableHead className="text-cream/70">Nom</TableHead>
                  <TableHead className="text-cream/70">Email</TableHead>
                  <TableHead className="text-cream/70">Réseaux</TableHead>
                  <TableHead className="text-cream/70">Profil</TableHead>
                  <TableHead className="text-cream/70">Orientation</TableHead>
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
                      {applicationNetworks(app).length > 1
                        ? `${applicationNetworks(app).length} réseaux`
                        : applicationNetworks(app)[0]?.[0] || "-"}
                    </TableCell>
                    <TableCell className="text-cream/80 max-w-[200px] truncate">
                      {app.profil || "-"}
                    </TableCell>
                    <TableCell className="text-cream/80">
                      {app.qualification_route ? (
                        <div className="space-y-1">
                          <Badge variant="outline">{routeLabels[app.qualification_route] ?? app.qualification_route}</Badge>
                          {app.recommended_offer && (
                            <p className="text-xs text-primary">{offerLabels[app.recommended_offer] ?? app.recommended_offer}</p>
                          )}
                        </div>
                      ) : "-"}
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

      <Dialog open={!!selected} onOpenChange={() => setSelected(null)}>
        <DialogContent className="bg-noir-light border-primary/20 text-cream max-w-2xl max-h-[80vh] overflow-y-auto">
          {selected && (
            <>
              <DialogHeader>
                <DialogTitle className="text-primary text-xl">
                  {selected.first_name} {selected.last_name}
                </DialogTitle>
                <DialogDescription className="text-cream/60">
                  Demande du {format(new Date(selected.created_at), "dd MMMM yyyy à HH:mm", { locale: fr })}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 mt-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-cream/50 text-sm">Email</p>
                    <p>{selected.email}</p>
                  </div>
                  <div>
                    <p className="text-cream/50 text-sm">Budget total</p>
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
                    <p className="text-cream/50 text-sm">Quel contenu t'a décidé</p>
                    <p>{selected.conversion_trigger || "-"}</p>
                  </div>
                  <div>
                    <p className="text-cream/50 text-sm">Orientation</p>
                    <p>{selected.qualification_route ? (routeLabels[selected.qualification_route] ?? selected.qualification_route) : "-"}</p>
                  </div>
                  <div>
                    <p className="text-cream/50 text-sm">Offre pressentie</p>
                    <p>{selected.recommended_offer ? (offerLabels[selected.recommended_offer] ?? selected.recommended_offer) : "-"}</p>
                  </div>
                  <div>
                    <p className="text-cream/50 text-sm">Score de qualification</p>
                    <p>{selected.qualification_score ?? "-"}</p>
                  </div>
                </div>

                {selected.form_version === "orientation_v2" && (
                  <div className="space-y-3 border-t border-primary/10 pt-4">
                    <p className="text-cream/40 text-xs uppercase tracking-wide">Qualification automatique</p>
                    <div>
                      <p className="text-cream/50 text-sm">Objectif prioritaire</p>
                      <p>{selected.primary_goal ? (goalLabels[selected.primary_goal] ?? selected.primary_goal) : "-"}</p>
                    </div>
                    <div>
                      <p className="text-cream/50 text-sm">Manière d'avancer</p>
                      <p>{selected.work_mode ? (workModeLabels[selected.work_mode] ?? selected.work_mode) : "-"}</p>
                    </div>
                    <div>
                      <p className="text-cream/50 text-sm mb-1">Blocage principal</p>
                      <p className="bg-noir rounded-lg p-3 whitespace-pre-wrap text-sm">{selected.main_blocker || selected.goals}</p>
                    </div>
                  </div>
                )}

                <div className="space-y-3">
                  <div>
                    <p className="text-cream/50 text-sm mb-1">Réseaux</p>
                    {applicationNetworks(selected).length ? (
                      <ul className="bg-noir rounded-lg p-3 space-y-1 text-sm">
                        {applicationNetworks(selected).map(([name, value]) => (
                          <li key={`${name}-${value}`}><span className="text-cream/50">{name} :</span> {value}</li>
                        ))}
                      </ul>
                    ) : <p>-</p>}
                  </div>
                  <div>
                    <p className="text-cream/50 text-sm">Profil</p>
                    <p>{selected.profil || "-"}</p>
                  </div>
                  {selected.objectives?.length ? <div><p className="text-cream/50 text-sm">Objectifs</p><ul className="list-disc pl-5 text-sm space-y-1">{selected.objectives.map((item) => <li key={item}>{item}</li>)}</ul></div> : null}
                </div>

                <div>
                  <p className="text-cream/50 text-sm mb-1">Blocage principal</p>
                  <p className="bg-noir rounded-lg p-3 whitespace-pre-wrap text-sm">{selected.goals}</p>
                </div>

                {selected.success_30_days && <div><p className="text-cream/50 text-sm mb-1">Résultat attendu à 30 jours</p><p className="bg-noir rounded-lg p-3 whitespace-pre-wrap text-sm">{selected.success_30_days}</p></div>}
                {selected.why_now && <div><p className="text-cream/50 text-sm mb-1">Pourquoi maintenant</p><p className="bg-noir rounded-lg p-3 whitespace-pre-wrap text-sm">{selected.why_now}</p></div>}
                {selected.help_topics?.length ? <div><p className="text-cream/50 text-sm">Aides recherchées</p><ul className="list-disc pl-5 text-sm space-y-1">{selected.help_topics.map((item) => <li key={item}>{item}</li>)}</ul></div> : null}
                {selected.availability && <div><p className="text-cream/50 text-sm">Disponibilité réelle</p><p>{selected.availability}</p></div>}

                {(selected.current_level || selected.blockers || selected.motivation || selected.accompagnement_type || selected.accompagnement_critere) && (
                  <div className="space-y-3 border-t border-primary/10 pt-4">
                    <p className="text-cream/40 text-xs uppercase tracking-wide">Anciennes réponses</p>
                    {selected.motivation && <div><p className="text-cream/50 text-sm">Attente TikTok</p><p>{selected.motivation}</p></div>}
                    {selected.accompagnement_type && <div><p className="text-cream/50 text-sm">Type d'accompagnement</p><p>{selected.accompagnement_type}</p></div>}
                    {selected.accompagnement_critere && <div><p className="text-cream/50 text-sm">Critère principal</p><p>{selected.accompagnement_critere}</p></div>}
                    {selected.current_level && (
                      <div>
                        <p className="text-cream/50 text-sm">Niveau</p>
                        <p>{selected.current_level}</p>
                      </div>
                    )}
                    {selected.blockers && (
                      <div>
                        <p className="text-cream/50 text-sm mb-1">Points de blocage</p>
                        <p className="bg-noir rounded-lg p-3 whitespace-pre-wrap text-sm">{selected.blockers}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
};

export default Applications;
