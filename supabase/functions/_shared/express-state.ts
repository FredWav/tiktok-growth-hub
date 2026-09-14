export const EXPRESS_LAUNCH_TIMEOUT_MS = 5 * 60_000;

export type ExpressState = {
  status: string;
  job_id: string | null;
  health_score?: number | null;
  error_message?: string | null;
};

export const isExpressActive = (row: ExpressState) =>
  ["starting", "processing"].includes(row.status) ||
  (row.status === "pending" && !!row.job_id);

export const isExpressComplete = (row: ExpressState) =>
  ["complete", "completed"].includes(row.status);

export const canRetryExpress = (row: ExpressState) =>
  row.status === "failed" ||
  (isExpressComplete(row) && (row.health_score == null || !!row.error_message));
