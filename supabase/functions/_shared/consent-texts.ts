/**
 * Textes de consentement des accompagnements, enregistrés mot pour mot avec chaque
 * commande. Fichier sans dépendance : importé par les Edge Functions et par le site
 * (src/pages/AcademyInscription.tsx), pour que le texte affiché soit celui conservé.
 * Repris de l'annexe des CGV (src/pages/CGV.tsx) : une case distincte, jamais précochée.
 */

// Version des CGV conservée avec chaque consentement.
export const VERSION = "2026-10-17";

export const CGV_TEXT =
  "J'ai lu et j'accepte les CGV et le récapitulatif de ma commande, avec sa date de démarrage.";

const EARLY_TEXTS: Record<string, string> = {
  academy:
    "Je demande l’exécution du service et l’accès au contenu numérique à la date convenue avant l'expiration du délai de rétractation de 14 jours. Je reconnais que pour le contenu numérique, je perds mon droit de rétractation dès l'accès ; pour la partie service, en cas de rétractation, je reste redevable du prix au prorata du service déjà fourni.",
  service:
    "Je demande expressément l'exécution de la prestation avant la fin du délai légal de rétractation de 14 jours. En cas de rétractation après le début de l'exécution, je resterai redevable du montant proportionné au service effectivement fourni ; si la prestation est pleinement exécutée, je reconnais perdre mon droit de rétractation.",
};

export const earlyText = (offer: string) =>
  offer === "academy" ? EARLY_TEXTS.academy : EARLY_TEXTS.service;

/** @deprecated Texte de la gamme 2026-09, conservé pour les anciens imports. */
export const EARLY_TEXT = EARLY_TEXTS.academy;
