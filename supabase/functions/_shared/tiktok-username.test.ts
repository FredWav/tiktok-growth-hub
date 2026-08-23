import { assertEquals } from "https://deno.land/std@0.190.0/testing/asserts.ts";
import { normalizeTikTokUsername } from "./tiktok-username.ts";

// Régression : @Evangymfact échouait côté WavStats là où @evangymfact passait,
// le pseudo étant transmis verbatim à /accounts/{username}/analyze.
Deno.test("ramène la casse saisie sur l'identifiant canonique TikTok", () => {
  assertEquals(normalizeTikTokUsername("Evangymfact"), "evangymfact");
  assertEquals(normalizeTikTokUsername("@Evangymfact"), "evangymfact");
  assertEquals(normalizeTikTokUsername("  @EVANGYMFACT  "), "evangymfact");
});

Deno.test("laisse intacte une saisie déjà canonique", () => {
  assertEquals(normalizeTikTokUsername("evangymfact"), "evangymfact");
  assertEquals(normalizeTikTokUsername("fred.wav_01"), "fred.wav_01");
});

Deno.test("tolère les saisies dégradées", () => {
  assertEquals(normalizeTikTokUsername("@@Fred"), "fred");
  assertEquals(normalizeTikTokUsername("@ Fred "), "fred");
  assertEquals(normalizeTikTokUsername(""), "");
  assertEquals(normalizeTikTokUsername(null), "");
  assertEquals(normalizeTikTokUsername(undefined), "");
  assertEquals(normalizeTikTokUsername(42), "");
});
