const ITPUSH_API_KEY = "Api_Key_3ca607d438e7e669106a260e0d1bc654b9c2c52f215ae18a156e338e13306e1b";
const ITPUSH_PROJECT_ID = "098b808b-bc6d-43db-87d1-04191451bd41";
const ITPUSH_URL = "https://itpush.dev/api/send";

async function send(title: string, message: string) {
  const enabled = Deno.env.get("ITPUSH_ENABLED");
  if (enabled !== "true") return;

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
