

## Plan : Correction colonne "Offre" + ajout Analyse Express

### Problème identifié
Le mapping par table source est déjà correct dans le code actuel (Wav Premium, Diagnostic, One Shot). Le bug probable est que `express_analyses` n'est pas inclus dans la requête, et le badge n'utilise pas de style différencié par type d'offre.

### Modifications sur `src/pages/admin/Marketing.tsx`

1. **Ajouter `express_analyses` au fetch** : Quatrième requête Supabase pour récupérer les analyses express (table `express_analyses`), mappées avec `offer: "Analyse Express"`.

2. **Fusionner dans le tableau final** : Ajouter les résultats express au spread `[...apps, ...diags, ...oneshots, ...express]`.

3. **Améliorer le badge Offre** : Utiliser des couleurs distinctes par type d'offre au lieu d'un simple `default`/`secondary` :
   - "Wav Premium" → style doré (default)
   - "One Shot" → style distinct
   - "Analyse Express" → style distinct
   - "Diagnostic" → style distinct

Aucune migration DB nécessaire. Un seul fichier modifié.

