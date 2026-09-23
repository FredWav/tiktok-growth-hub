/**
 * Livraison des packs de hooks vendus par Payment Links Stripe.
 *
 * Les liens portent metadata.produit (hooks_100, hooks_250, hooks_500, hooks_850),
 * recopiée par Stripe sur la Checkout Session. Les fichiers sont dans le bucket
 * privé HOOKS_BUCKET ; le webhook génère des liens signés et met l'email en file.
 *
 * Module sans import Deno/npm : testable depuis Node (tests/hooks-delivery.test.mjs).
 */

export const HOOKS_BUCKET = "hooks-packs";
/** Durée des liens de téléchargement envoyés au client : 1 an. */
export const HOOKS_LINK_TTL_SECONDS = 365 * 24 * 60 * 60;

/**
 * Texte exact de la case à cocher des Payment Links (sans le lien markdown).
 * Doit rester identique au texte de livrables/stripe-liens-hooks.ps1 : changer l'un
 * impose de changer l'autre et d'incrémenter la version.
 */
export const HOOKS_CONSENT_VERSION = "2026-09-23";
export const HOOKS_CONSENT_TEXT =
  "J'accepte les CGV. Je demande l'envoi immédiat des fichiers par email, avant la fin du délai de rétractation de 14 jours, et je renonce expressément à mon droit de rétractation dès cet envoi.";

export type HooksFile = { label: string; path: string };
export type HooksPack = { code: HooksPackCode; name: string; files: HooksFile[] };
export type HooksPackCode = "hooks_100" | "hooks_250" | "hooks_500" | "hooks_850";

const files = (n: number): HooksFile[] => [
  { label: `Pack ${n} hooks (PDF)`, path: `pack-${n}.pdf` },
  { label: `Pack ${n} hooks (tableur)`, path: `pack-${n}.xlsx` },
];

export const HOOKS_PACKS: Record<HooksPackCode, HooksPack> = {
  hooks_100: { code: "hooks_100", name: "Pack 100 hooks", files: files(100) },
  hooks_250: { code: "hooks_250", name: "Pack 250 hooks", files: files(250) },
  hooks_500: { code: "hooks_500", name: "Pack 500 hooks", files: files(500) },
  // La bibliothèque complète = les 3 packs réunis, 0 doublon.
  hooks_850: {
    code: "hooks_850",
    name: "Bibliothèque complète (850 hooks)",
    files: [...files(100), ...files(250), ...files(500)],
  },
};

export function hooksPackFor(metadata: Record<string, string> | null | undefined): HooksPack | null {
  const code = metadata?.produit;
  return code && Object.hasOwn(HOOKS_PACKS, code) ? HOOKS_PACKS[code as HooksPackCode] : null;
}

const esc = (value: string) =>
  value.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

export function buildHooksEmail(input: {
  pack: HooksPack;
  links: { label: string; url: string }[];
  customerName?: string | null;
  amountCents: number | null;
  currency: string | null;
  sessionId: string;
  paidAt: Date;
  consentAccepted: boolean;
  siteUrl: string;
}): { subject: string; html: string } {
  const firstName = input.customerName?.trim().split(/\s+/)[0];
  const amount = typeof input.amountCents === "number"
    ? new Intl.NumberFormat("fr-FR", { style: "currency", currency: (input.currency || "eur").toUpperCase() })
      .format(input.amountCents / 100)
    : "montant indiqué sur ton reçu Stripe";
  const paidAt = new Intl.DateTimeFormat("fr-FR", { dateStyle: "long", timeStyle: "short", timeZone: "Europe/Paris" })
    .format(input.paidAt);
  const p = (html: string) => `<p style="margin:0 0 14px;line-height:1.6">${html}</p>`;
  const button = (l: { label: string; url: string }) =>
    `<tr><td style="padding:0 0 10px"><a href="${esc(l.url)}" style="display:block;background:#D9B53F;color:#0F0F0F;text-decoration:none;font-weight:bold;padding:14px 18px;border-radius:6px">Télécharger : ${esc(l.label)}</a></td></tr>`;
  const row = (k: string, v: string) =>
    `<tr><td style="padding:6px 12px 6px 0;color:#6B6B6B;vertical-align:top;white-space:nowrap">${k}</td><td style="padding:6px 0">${v}</td></tr>`;

  const html = `<div style="font-family:Arial,sans-serif;color:#0F0F0F;max-width:600px;margin:0 auto;padding:24px">
${p(firstName ? `Salut ${esc(firstName)},` : "Salut,")}
${p(`Merci pour ton achat. Voici tes fichiers : <strong>${esc(input.pack.name)}</strong>.`)}
<table role="presentation" style="width:100%;border-collapse:collapse;margin:8px 0 16px">${input.links.map(button).join("")}</table>
${p("Les liens restent valables 1 an. Télécharge tes fichiers maintenant et garde-les.")}
${p("Un conseil pour bien t'en servir : prends la structure, pas les mots. Remplace les [CASES] par ta niche.")}
${p("Fred")}
<hr style="border:none;border-top:1px solid #E6E6E6;margin:24px 0">
<p style="margin:0 0 10px;font-weight:bold">Récapitulatif de ta commande</p>
<table role="presentation" style="border-collapse:collapse;font-size:14px">
${row("Produit", esc(input.pack.name))}
${row("Montant payé", esc(amount))}
${row("Date", esc(paidAt))}
${row("Référence", esc(input.sessionId))}
</table>
${input.consentAccepted
    ? `<p style="margin:16px 0 6px;font-size:14px">Ton accord, donné au moment du paiement (version ${HOOKS_CONSENT_VERSION}) :</p>
<p style="margin:0 0 14px;font-size:14px;padding:10px 14px;background:#F9F8F5;border-left:3px solid #D9B53F">« ${esc(HOOKS_CONSENT_TEXT)} »</p>`
    : ""}
<p style="margin:0;font-size:13px;color:#6B6B6B">CGV : <a href="${esc(input.siteUrl)}/cgv" style="color:#92721C">${esc(input.siteUrl)}/cgv</a> · Rétractation : <a href="${esc(input.siteUrl)}/retractation" style="color:#92721C">${esc(input.siteUrl)}/retractation</a> · Une question : contact@fredwav.com</p>
</div>`;

  return { subject: `Tes hooks sont prêts : ${input.pack.name}`, html };
}
