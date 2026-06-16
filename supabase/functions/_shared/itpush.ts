const ITPUSH_API_KEY = Deno.env.get("ITPUSH_API_KEY") ?? "";
const ITPUSH_PROJECT_ID = Deno.env.get("ITPUSH_PROJECT_ID") ?? "";
const ITPUSH_URL = "https://itpush.dev/api/send";

async function send(title: string, message: string) {
  const enabled = Deno.env.get("ITPUSH_ENABLED");
  if (enabled !== "true") return;
  if (!ITPUSH_API_KEY || !ITPUSH_PROJECT_ID) return;

  try {
    await fetch(ITPUSH_URL, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${ITPUSH_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ title, message, projectId: ITPUSH_PROJECT_ID }),
    });
  } catch (err) {
    console.warn("itpush notification failed:", err);
  }
}

export const notifySuccess = (title: string, message: string) => send(`✅ ${title}`, message);
export const notifyError = (title: string, message: string) => send(`❌ ${title}`, message);
