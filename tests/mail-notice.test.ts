import test from "node:test";
import assert from "node:assert/strict";
import { NO_REPLY_TEXT, withNoReplyHtml, withNoReplyText } from "../supabase/functions/_shared/mail-notice.ts";

test("e-mails clients : mention « ne pas répondre » et adresse de contact, une seule fois", () => {
  assert.match(NO_REPLY_TEXT, /ne pas y répondre.*contact@fredwav\.com/);
  const text = withNoReplyText("Bonjour,\n\nTon analyse est prête.\n");
  assert.ok(text.endsWith(NO_REPLY_TEXT));
  assert.equal(withNoReplyText(text), text);

  const page = withNoReplyHtml("<html><body><p>Bonjour</p></body></html>");
  assert.match(page, /<p>Bonjour<\/p><p [^>]*>Cet e-mail est envoyé automatiquement.*mailto:contact@fredwav\.com.*<\/p><\/body><\/html>$/);
  assert.equal(withNoReplyHtml(page), page);
  assert.match(withNoReplyHtml("<p>Fragment</p>"), /^<p>Fragment<\/p><p [^>]*>Cet e-mail/);
});
