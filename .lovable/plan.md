

## Plan : Mapping strict par table + déduplication par email

### Constat
Le mapping actuel est déjà correct — chaque table source assigne explicitement son type d'offre. Le vrai problème est l'absence de **déduplication** : un prospect qui fait le diagnostic puis achète un One Shot apparaît deux fois.

### Modifications sur `src/pages/admin/Marketing.tsx`

**1. Ajouter `email` au fetch de chaque table** pour permettre la déduplication :
- `wav_premium_applications` : déjà a `email` implicitement via first/last name, ajouter `email` au select
- `diagnostic_leads` : ajouter `email` au select
- `oneshot_submissions` : a déjà `email` implicitement via `name`, ajouter `email` au select
- `express_analyses` : a déjà `email`

**2. Enrichir l'interface `Lead`** avec un champ `email` optionnel.

**3. Déduplication par email** après la fusion :
- Définir un ordre de priorité : `Wav Premium (1) > One Shot (2) > Analyse Express (3) > Diagnostic (4)`
- Grouper les leads par email (les leads sans email restent tels quels)
- Pour chaque groupe, garder uniquement l'entrée avec la priorité la plus forte
- Cela élimine les doublons diagnostic/oneshot pour un même prospect

**4. Aucun changement de badge/style** — le mapping par table est déjà strict et correct.

Un seul fichier modifié : `src/pages/admin/Marketing.tsx`.

