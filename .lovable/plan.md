

## Fix MailerLite — Retirer le group ID invalide

L'erreur dans les logs est claire : `"The selected groups.0 is invalid."`. Le group ID `148122258747498498` n'existe pas dans ton compte MailerLite. Le screenshot montre que l'abonne est bien ajoute a la liste generale, donc on n'a pas besoin de forcer un groupe.

### Modification

**`supabase/functions/mailerlite-subscribe/index.ts`** (ligne 40) : Retirer la propriete `groups` du body envoye a l'API MailerLite. Le body devient :

```json
{
  "email": "...",
  "fields": { "name": "..." }
}
```

Les abonnes seront ajoutes a la liste generale (comme c'est deja le cas vu le screenshot). Tu pourras les organiser en groupes depuis l'interface MailerLite apres.

Un seul fichier modifie, un seul changement de ligne.

