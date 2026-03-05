import { supabase } from "@/integrations/supabase/client";

let currentPageViewId: string | null = null;
let pageEnteredAt: number | null = null;

function getSessionId(): string {
  let sid = sessionStorage.getItem("pv_session_id");
  if (!sid) {
    sid = crypto.randomUUID();
    sessionStorage.setItem("pv_session_id", sid);
  }
  return sid;
}

function getVisitorId(): string {
  let vid = localStorage.getItem("pv_visitor_id");
  if (!vid) {
    vid = crypto.randomUUID();
    localStorage.setItem("pv_visitor_id", vid);
  }
  return vid;
}

function hasConsent(): boolean {
  return localStorage.getItem("cookie_consent") === "accepted";
}

export async function trackPageView(path: string) {
  if (!hasConsent()) return;

  // Update duration of previous page view
  await updateDuration();

  const sessionId = getSessionId();
  const visitorId = getVisitorId();
  const referrer = document.referrer || null;
  const utmSource = localStorage.getItem("utm_source") || null;
  const utmMedium = localStorage.getItem("utm_medium") || null;
  const utmCampaign = localStorage.getItem("utm_campaign") || null;

  pageEnteredAt = Date.now();

  const { data } = await supabase
    .from("page_views" as any)
    .insert({
      path,
      referrer,
      utm_source: utmSource,
      utm_medium: utmMedium,
      utm_campaign: utmCampaign,
      session_id: sessionId,
      visitor_id: visitorId,
    } as any)
    .select("id")
    .single();

  currentPageViewId = (data as any)?.id || null;
}

async function updateDuration() {
  if (!currentPageViewId || !pageEnteredAt) return;

  const duration = Math.round((Date.now() - pageEnteredAt) / 1000);
  if (duration < 1) return;

  await supabase
    .from("page_views" as any)
    .update({ duration_seconds: duration } as any)
    .eq("id", currentPageViewId);

  currentPageViewId = null;
  pageEnteredAt = null;
}

export function setupBeforeUnloadTracking() {
  if (!hasConsent()) return;

  window.addEventListener("beforeunload", () => {
    if (!currentPageViewId || !pageEnteredAt) return;
    const duration = Math.round((Date.now() - pageEnteredAt) / 1000);
    if (duration < 1) return;

    // Use sendBeacon for reliability on page unload
    const url = `${import.meta.env.VITE_SUPABASE_URL}/rest/v1/page_views?id=eq.${currentPageViewId}`;
    const headers = {
      "Content-Type": "application/json",
      "apikey": import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
      "Prefer": "return=minimal",
    };
    const body = JSON.stringify({ duration_seconds: duration });

    // sendBeacon with Blob doesn't support custom headers, so use fetch keepalive
    fetch(url, {
      method: "PATCH",
      headers,
      body,
      keepalive: true,
    }).catch(() => {});
  });
}
