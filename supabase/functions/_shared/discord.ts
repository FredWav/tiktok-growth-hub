// Notification Discord via webhook de salon. Ne doit jamais faire échouer
// l'appelant : toute erreur est journalisée et ignorée.
export async function notifyDiscord(title: string, lines: string[]) {
  const url = Deno.env.get("DISCORD_WEBHOOK_URL");
  if (!url) {
    console.warn("discord désactivé : DISCORD_WEBHOOK_URL absent");
    return;
  }
  const content = [`**${title}**`, ...lines].join("\n").slice(0, 1900);
  try {
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content, allowed_mentions: { parse: [] } }),
      signal: AbortSignal.timeout(5_000),
    });
    if (!response.ok) {
      console.warn(
        "discord webhook refusé:",
        response.status,
        (await response.text()).slice(0, 300),
      );
    }
  } catch (err) {
    console.warn("discord webhook échoué:", String(err).slice(0, 300));
  }
}
