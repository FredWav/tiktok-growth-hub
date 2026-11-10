/**
 * Livraison des packs de hooks vendus par Payment Links Stripe.
 *
 * Les liens portent metadata.produit (hooks_100, hooks_250, hooks_500, hooks_850),
 * recopiée par Stripe sur la Checkout Session. Les fichiers sont dans le bucket
 * privé HOOKS_BUCKET. L'email donne accès à une page de commande, qui remet les
 * fichiers sur action du client et conserve la date du premier téléchargement.
 *
 * Module sans import Deno/npm : testable depuis Node (tests/hooks-delivery.test.mjs).
 */

export const HOOKS_BUCKET = "hooks-packs";
export const HOOKS_CONSENT_VERSION = "2026-11-10";
export const HOOKS_CONSENT_TEXT =
  "J’accepte les CGV. Je demande expressément à pouvoir télécharger mon pack avant la fin du délai légal de 14 jours. Je reconnais que je perdrai mon droit de rétractation dès que je lancerai le premier téléchargement.";
export const HOOKS_CHECKOUT_CONSENT = HOOKS_CONSENT_TEXT.replace(
  "les CGV",
  "les [CGV](https://fredwav.com/cgv)",
);

/** La session conserve le texte présenté à l'acheteur, même si le lien a changé depuis. */
export function hasHooksConsent(session: {
  consent?: { terms_of_service?: string | null } | null;
  consent_collection?: { terms_of_service?: string | null } | null;
  custom_text?: { terms_of_service_acceptance?: { message: string } | null } | null;
}): boolean {
  return session.consent?.terms_of_service === "accepted" &&
    session.consent_collection?.terms_of_service === "required" &&
    session.custom_text?.terms_of_service_acceptance?.message === HOOKS_CHECKOUT_CONSENT;
}

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
  return code && Object.prototype.hasOwnProperty.call(HOOKS_PACKS, code)
    ? HOOKS_PACKS[code as HooksPackCode]
    : null;
}

const esc = (value: string) =>
  value.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

export function buildHooksEmail(input: {
  pack: HooksPack;
  accessUrl: string;
  customerName?: string | null;
  amountCents: number | null;
  currency: string | null;
  sessionId: string;
  paidAt: Date;
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
  const row = (k: string, v: string) =>
    `<tr><td style="padding:6px 12px 6px 0;color:#6B6B6B;vertical-align:top;white-space:nowrap">${k}</td><td style="padding:6px 0">${v}</td></tr>`;

  const html = `<div style="font-family:Arial,sans-serif;color:#0F0F0F;max-width:600px;margin:0 auto;padding:24px">
${p(firstName ? `Salut ${esc(firstName)},` : "Salut,")}
${p(`Merci pour ton achat. Tes fichiers sont prêts : <strong>${esc(input.pack.name)}</strong>.`)}
${p(`<a href="${esc(input.accessUrl)}" style="display:inline-block;background:#D9B53F;color:#0F0F0F;font-weight:bold;padding:14px 18px;border-radius:6px">Accéder à mes fichiers</a>`)}
${p("Garde ce lien personnel. Il te permet de récupérer tes fichiers pendant un an. Ouvrir la page d’accès te permet de consulter la liste des fichiers. Ton accord s’applique à partir du premier téléchargement.")}
${p("Fred")}
<hr style="border:none;border-top:1px solid #E6E6E6;margin:24px 0">
<p style="margin:0 0 10px;font-weight:bold">Récapitulatif de ta commande</p>
<table role="presentation" style="border-collapse:collapse;font-size:14px">
${row("Produit", esc(input.pack.name))}
${row("Montant payé", esc(amount))}
${row("Date", esc(paidAt))}
${row("Référence", esc(input.sessionId))}
</table>
${p(`Ton accord au paiement (version ${HOOKS_CONSENT_VERSION}) : « ${esc(HOOKS_CONSENT_TEXT)} »`)}
<h2 style="font-size:16px">Conditions de ton achat</h2>
${p("Vendeur et assistance : Frédéric Olalde, entrepreneur individuel (Fred Wav), SIRET 921 749 727 00019, 2 route de Malagué, 86270 Coussay-les-Bois, France. Contact : contact@fredwav.com.")}
${p("Paiement unique. Le prix total payé figure ci-dessus. Le pack contient des fichiers PDF et XLSX, accessibles par internet via le lien personnel. Un lecteur PDF et un tableur compatible XLSX permettent de les ouvrir. Tu peux conserver les fichiers téléchargés. Leur utilisation est personnelle. Le partage, la revente et la rediffusion sont interdits. Les structures sont à adapter à tes contenus. Aucun résultat d’audience ou de revenus n’est garanti.")}
${p(`Tu disposes de 14 jours à compter de la commande pour te rétracter. Si tu lances le premier téléchargement pendant ce délai après ton accord confirmé dans cet email, tu perds ce droit. Tant qu’il s’applique, tu peux utiliser le <a href="${esc(input.siteUrl)}/retractation">formulaire de rétractation</a> ou écrire à contact@fredwav.com. En cas de rétractation valable, le remboursement intervient dans les 14 jours suivant la notification, par le moyen de paiement utilisé, sauf accord contraire.`)}
${p("Modèle à compléter et à adresser au vendeur : « Je vous notifie ma rétractation du contrat portant sur le pack ___, commandé le ___, référence ___. Nom et adresse : ___. Date : ___. Signature si le formulaire est envoyé sur papier. »")}
${p("La garantie légale de conformité des contenus numériques et, le cas échéant, celle des vices cachés restent applicables. Contacte le vendeur si un fichier est manquant ou non conforme. Si une réclamation écrite reste sans solution, tu peux saisir SAS Médiation Solution Conso, 222 chemin de la Bergerie, 01800 Saint Jean de Niost, contact@sasmediationsolution-conso.fr.")}
${p(`<a href="${esc(input.siteUrl)}/cgv">Conditions générales de vente</a>`)}
</div>`;

  return { subject: `Tes hooks sont prêts : ${input.pack.name}`, html };
}
