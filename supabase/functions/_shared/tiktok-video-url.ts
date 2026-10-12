/**
 * Validation et forme canonique d'un lien de vidéo TikTok.
 * Module pur : partagé par l'Edge Function de checkout, la page /analyse-video et les tests Node.
 */

export type TikTokVideoUrl =
  | { kind: "video"; url: string; videoId: string; username: string }
  | { kind: "short"; url: string }
  | { kind: "invalid"; reason: string };

const SHORT_HOSTS = new Set(["vm.tiktok.com", "vt.tiktok.com"]);
const MAIN_HOSTS = new Set(["tiktok.com", "www.tiktok.com", "m.tiktok.com"]);

export const INVALID_VIDEO_URL_MESSAGE =
  "Colle le lien d'une vidéo TikTok (ex. https://www.tiktok.com/@toncompte/video/123…).";

export function parseTikTokVideoUrl(input: unknown): TikTokVideoUrl {
  if (typeof input !== "string") return { kind: "invalid", reason: INVALID_VIDEO_URL_MESSAGE };
  let raw = input.trim();
  // Le partage depuis l'app ajoute parfois du texte autour du lien.
  const found = raw.match(/https?:\/\/\S+/i);
  if (found) raw = found[0];
  if (!raw || raw.length > 2048) return { kind: "invalid", reason: INVALID_VIDEO_URL_MESSAGE };
  if (!/^https?:\/\//i.test(raw)) raw = `https://${raw}`;

  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    return { kind: "invalid", reason: INVALID_VIDEO_URL_MESSAGE };
  }
  const host = url.hostname.toLowerCase();
  const path = url.pathname;

  if (SHORT_HOSTS.has(host)) {
    const code = path.split("/").filter(Boolean)[0];
    if (!code || !/^[A-Za-z0-9_-]{3,32}$/.test(code)) return { kind: "invalid", reason: INVALID_VIDEO_URL_MESSAGE };
    return { kind: "short", url: `https://${host}/${code}/` };
  }
  if (!MAIN_HOSTS.has(host)) return { kind: "invalid", reason: INVALID_VIDEO_URL_MESSAGE };

  const short = path.match(/^\/t\/([A-Za-z0-9_-]{3,32})\/?$/);
  if (short) return { kind: "short", url: `https://www.tiktok.com/t/${short[1]}/` };

  if (/^\/@[^/]+\/photo\//.test(path)) {
    return { kind: "invalid", reason: "Ce lien pointe vers un carrousel photo : l'analyse porte uniquement sur les vidéos." };
  }
  const video = path.match(/^\/@([A-Za-z0-9_.]{1,40})\/video\/(\d{8,25})\/?$/);
  if (!video) return { kind: "invalid", reason: INVALID_VIDEO_URL_MESSAGE };
  const username = video[1].toLowerCase();
  return {
    kind: "video",
    username,
    videoId: video[2],
    url: `https://www.tiktok.com/@${username}/video/${video[2]}`,
  };
}
