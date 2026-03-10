

## Plan : Corriger le pop-up exit intent → Analyse Express (11,90€)

Le pop-up doit promouvoir l'**Analyse Express** (audit automatique à 11,90€, `/analyse-express`), pas le One Shot.

### Modifications — `src/components/ExitIntentPopup.tsx`

1. **Ligne 49** : `navigate("/one-shot")` → `navigate("/analyse-express")`
2. **Ligne 60** : Description → `"Ne laisse pas ton compte stagner. Lance un audit automatique de ton profil TikTok en 3 minutes : health score, métriques clés et recommandations personnalisées."`
3. **Ligne 64** : Bouton → `"Lancer mon Analyse Express (11,90€)"`

Aucun autre fichier à modifier.

