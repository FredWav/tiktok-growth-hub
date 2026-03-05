

## Parcours actuel `/start`

Le tunnel actuel fonctionne ainsi :

1. **Écran d'accueil** → "Démarrer le diagnostic"
2. **Identité** (prénom, nom, email, TikTok)
3. **Niveau** (débutant / intermédiaire / avancé)
4. **Objectif** (visibilité / stratégie / monétisation)
5. **Blocage** (texte libre)
6. **Budget** → 4 choix qui redirigent vers 4 destinations différentes :
   - Pas de budget → Discord
   - < 200€ → One Shot
   - 200–500€ → VIP
   - 500€+ → Wav Premium

**Le problème** : le tunnel "dispatche" vers toutes les offres à plat. Il ne filtre pas d'abord pour le Premium.

---

## Nouveau parcours : entonnoir descendant

L'idée est de présenter le **Wav Premium comme la recommandation principale**, puis de descendre en cascade pour ceux qui n'ont pas le budget.

### Changement 1 — Reformuler l'étape Budget (step 5)

Remplacer les 4 options actuelles par 3 options orientées "exclusion Premium" :

| Option | Label | Valeur interne |
|--------|-------|----------------|
| 🚀 | "Oui, je suis prêt à investir 500€+ pour un accompagnement sur-mesure" | `high` |
| ⚡ | "Pas encore, mais je peux investir moins de 200€ pour un déblocage immédiat" | `low` |
| 🔍 | "Je veux d'abord un état des lieux de mon compte avant de m'engager" | `express` |

On supprime l'option "mid" (VIP masqué) et "none" (Discord).

### Changement 2 — Réécrire les résultats (step 6)

3 résultats au lieu de 4, avec un ton descendant :

- **`high`** → Wav Premium. Redirige vers Calendly (`calendly.com/fredwavcm/wav-premium`). Badge urgence "3 places disponibles".
- **`low`** → One Shot. Ton : "T'as pas encore le budget pour un accompagnement complet, mais pour débloquer ta situation maintenant, le One Shot est fait pour ça." Redirige vers `/one-shot`.
- **`express`** → Analyse Express. Ton : "Avant de t'engager, fais analyser ton compte. En 2 minutes tu sauras exactement où tu en es." Redirige vers `/analyse-express`.

### Changement 3 — Mettre à jour le mapping `getRecommendedOffer`

```text
high   → wav_premium
low    → one_shot
express → analyse_express
```

### Fichier modifié

Un seul fichier : `src/pages/DiagnosticStart.tsx`
- Options du step 5 (icônes, labels, valeurs)
- `getRecommendedOffer()` (3 valeurs au lieu de 4)
- `renderResult()` configs (3 résultats au lieu de 4)

Aucune migration DB nécessaire — la colonne `budget` et `recommended_offer` dans `diagnostic_leads` acceptent déjà n'importe quelle string.

