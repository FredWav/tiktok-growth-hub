

## Probleme

L'erreur `Failed to construct 'Request': 'headers' is not a valid ByteString` se produit a la ligne du `fetch` vers l'API Resend. Le header `Authorization: Bearer ${RESEND_API_KEY}` contient un caractere non-ASCII ou invisible (espace, retour a la ligne) provenant de la variable d'environnement `RESEND_API_KEY`.

## Solution

Ajouter un `.trim()` sur la valeur de `RESEND_API_KEY` pour supprimer tout caractere invisible, et valider que la cle ne contient que des caracteres ASCII valides.

## Modification

**Fichier** : `supabase/functions/send-oneshot-form/index.ts`

- Ligne 38 : ajouter `.trim()` sur la recuperation de la cle :
  ```
  const RESEND_API_KEY = (Deno.env.get("RESEND_API_KEY") || "").trim();
  ```
- Adapter la verification (ligne 39) pour verifier que la cle n'est pas vide apres le trim :
  ```
  if (!RESEND_API_KEY) { ... }
  ```

Cela corrige le probleme sans avoir besoin de re-saisir la cle API.

## Etapes techniques

1. Modifier la ligne 38 de `supabase/functions/send-oneshot-form/index.ts` pour ajouter `.trim()`
2. Redeployer la fonction

