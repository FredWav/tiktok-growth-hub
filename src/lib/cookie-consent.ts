// Petit module partagé pour piloter le bandeau de consentement depuis n'importe où
// (ex. le lien « Gérer mes cookies » du footer) sans créer de dépendance circulaire
// ni casser le Fast Refresh (le composant CookieConsent n'exporte que lui-même).

export const COOKIE_SETTINGS_EVENT = "cookie:open-settings";

/** Ré-ouvre le bandeau de consentement pour modifier son choix à tout moment. */
export function openCookieSettings() {
  window.dispatchEvent(new CustomEvent(COOKIE_SETTINGS_EVENT));
}
