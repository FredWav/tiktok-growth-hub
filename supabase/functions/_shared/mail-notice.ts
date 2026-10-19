/**
 * Mention ajoutée en bas des e-mails envoyés aux clients depuis noreply@fredwav.com.
 * Module sans import : il est aussi chargé par les tests Node.
 */
export const CONTACT_EMAIL = "contact@fredwav.com";
export const NO_REPLY_TEXT =
  `Cet e-mail est envoyé automatiquement : merci de ne pas y répondre. Pour toute question, écris à ${CONTACT_EMAIL}.`;

const NO_REPLY_HTML = `<p style="margin:24px 0 0;padding-top:12px;border-top:1px solid #e5e5e5;color:#777;font-size:12px;line-height:1.5;">`
  + `Cet e-mail est envoyé automatiquement : merci de ne pas y répondre. Pour toute question, écris à `
  + `<a href="mailto:${CONTACT_EMAIL}" style="color:#777;">${CONTACT_EMAIL}</a>.</p>`;

/** Ajoute la mention en fin de texte. */
export function withNoReplyText(text: string): string {
  return text.includes(NO_REPLY_TEXT) ? text : `${text.trimEnd()}\n\n—\n${NO_REPLY_TEXT}`;
}

/** Ajoute la mention en fin de HTML, avant </body> s'il y en a un. */
export function withNoReplyHtml(html: string): string {
  if (html.includes(NO_REPLY_TEXT.slice(0, 40))) return html;
  const end = html.search(/<\/body>/i);
  return end === -1 ? `${html}${NO_REPLY_HTML}` : `${html.slice(0, end)}${NO_REPLY_HTML}${html.slice(end)}`;
}
