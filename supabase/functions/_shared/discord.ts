// Notification Discord via webhook de salon. Ne doit jamais faire échouer
// l'appelant : toute erreur est journalisée et ignorée.
// Mention (ping) du compte Discord de Fred à chaque notification.
const DISCORD_PING_USER_ID = Deno.env.get("DISCORD_PING_USER_ID") ??
  "967099537439227965";

export type DiscordField = {
  name: string;
  value: string;
  inline?: boolean;
};

async function post(payload: unknown) {
  const url = Deno.env.get("DISCORD_WEBHOOK_URL");
  if (!url) {
    console.warn("discord désactivé : DISCORD_WEBHOOK_URL absent");
    return;
  }
  try {
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
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

export async function notifyDiscord(title: string, lines: string[]) {
  await post({
    content: [`<@${DISCORD_PING_USER_ID}>`, `**${title}**`, ...lines]
      .join("\n").slice(0, 1900),
    allowed_mentions: { parse: [], users: [DISCORD_PING_USER_ID] },
  });
}

// Notification enrichie (embed) : un champ par information, comme l'ancien
// format du formulaire de contact.
export async function notifyDiscordEmbed(
  content: string,
  embedTitle: string,
  fields: DiscordField[],
) {
  await post({
    content: `<@${DISCORD_PING_USER_ID}> ${content}`.slice(0, 1900),
    allowed_mentions: { parse: [], users: [DISCORD_PING_USER_ID] },
    embeds: [{
      title: embedTitle.slice(0, 256) || "-",
      color: 0xc8a97e,
      fields: fields
        .filter((field) => field.value.trim().length > 0)
        .slice(0, 25)
        .map((field) => ({
          name: field.name.slice(0, 256),
          value: field.value.slice(0, 1024),
          inline: field.inline ?? false,
        })),
      timestamp: new Date().toISOString(),
    }],
  });
}
