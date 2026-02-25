

## Plan : Corriger le bug d'encodage `\n` dans pdf-lib

### Diagnostic

Le problème n'est **pas** pdf-lib en tant que bibliothèque — c'est la fonction `sanitize()` qui laisse passer les caractères de contrôle comme `\n` (newline, `0x0a`). pdf-lib refuse d'encoder `\n` dans `drawText()` car ce n'est pas un caractère imprimable WinAnsi, ce qui est le comportement correct.

Changer de bibliothèque ne résoudrait rien : **aucune** bibliothèque PDF ne peut dessiner un `\n` littéral dans du texte. Le vrai problème est que le texte contient des retours à la ligne qui ne sont pas découpés avant d'être passés à `drawText`.

### Solution (ciblée et définitive)

Corriger `sanitize()` pour gérer les caractères de contrôle, et renforcer `drawText` pour découper les newlines.

### Modifications

| Fichier | Changement |
|---------|-----------|
| `supabase/functions/express-pdf/index.ts` | Mettre à jour `sanitize()` + `drawText()` pour gérer `\n`, `\r`, `\t` |

### Détails

**1. `sanitize()` — ajouter le nettoyage des caractères de contrôle :**
```typescript
function sanitize(text: string): string {
  if (!text) return "";
  let s = text
    .replace(/\r\n/g, " ")
    .replace(/\n/g, " ")
    .replace(/\r/g, " ")
    .replace(/\t/g, " ")
    .replace(/—/g, "-")
    .replace(/–/g, "-")
    // ... reste identique
  // Strip control chars (0x00-0x1F sauf espace 0x20) + non-WinAnsi
  s = s.replace(/[\x00-\x09\x0B-\x1F]/g, "");
  s = s.replace(/[^\x20-\xFF]/g, "");
  return s;
}
```

**2. `drawText()` dans PdfBuilder — découper par `\n` avant wrapping :**

Le `drawText` actuel appelle `wrapText` directement. Si par sécurité un `\n` arrive malgré `sanitize`, il faut d'abord découper le texte en paragraphes :
```typescript
drawText(text: string, opts) {
  const sanitized = sanitize(text); // double sécurité
  const paragraphs = sanitized.split(/\n/);
  for (const para of paragraphs) {
    // wrapText + drawText existant pour chaque paragraphe
  }
}
```

Ces deux corrections rendent le PDF bulletproof contre tout caractère problématique, sans changer de bibliothèque.

