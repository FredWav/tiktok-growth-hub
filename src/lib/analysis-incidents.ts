/**
 * Analyses à vérifier : même règle que la vue d'ensemble (fonction SQL admin_overview,
 * migration 20261019090000_admin_v2.sql). Changer les deux ensemble.
 * Renvoie la raison, ou null si l'analyse suit son cours normal.
 */
const STUCK_MS = 30 * 60 * 1000;
const olderThan = (iso: string | null | undefined, now: number) => !!iso && now - new Date(iso).getTime() > STUCK_MS;

export type ExpressIncidentFields = {
  status: string;
  created_at: string;
  completed_at: string | null;
  refunded_at?: string | null;
  support_requested_at?: string | null;
  processing_started_at?: string | null;
  launch_started_at?: string | null;
  result_email_sent_at?: string | null;
};

export function expressIncident(a: ExpressIncidentFields, now = Date.now()): string | null {
  if (a.refunded_at) return null;
  if (a.status === "failed") return "échec de l'analyse";
  if (a.support_requested_at) return "intervention demandée";
  if (["starting", "processing"].includes(a.status) && olderThan(a.processing_started_at ?? a.launch_started_at ?? a.created_at, now)) {
    return "bloquée depuis plus de 30 minutes";
  }
  if (["complete", "completed"].includes(a.status) && !a.result_email_sent_at && olderThan(a.completed_at, now)) {
    return "rapport prêt mais e-mail non envoyé";
  }
  return null;
}

export type VideoIncidentFields = {
  status: string;
  created_at: string;
  paid_at: string | null;
  completed_at: string | null;
  support_requested_at?: string | null;
  processing_started_at?: string | null;
  mail_state?: string | null;
};

export function videoIncident(v: VideoIncidentFields, now = Date.now()): string | null {
  if (v.status === "refunded") return null;
  if (v.status === "failed") return "échec de l'analyse";
  if (v.support_requested_at) return "intervention demandée";
  if (["paid", "starting", "processing"].includes(v.status) && olderThan(v.processing_started_at ?? v.paid_at ?? v.created_at, now)) {
    return "bloquée depuis plus de 30 minutes";
  }
  if (v.status === "completed" && olderThan(v.completed_at, now)) return "rapport prêt mais e-mail non envoyé";
  if (v.status === "delivered" && v.mail_state === "failed") return "e-mail du rapport en échec";
  return null;
}
