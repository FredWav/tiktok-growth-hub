# Bascule WAVSTATS_API_KEY + redéploiement des 10 Edge Functions

## Ce qui va être fait

1. **Créer le secret `WAVSTATS_API_KEY`**
   Les valeurs des secrets existants ne sont jamais lisibles (même par moi) : `WAV_SOCIAL_SCAN_API_KEY` n'expose que son nom. Je vais donc ouvrir le formulaire sécurisé pour que tu collles la même valeur (format `wav_...`). `WAV_SOCIAL_SCAN_API_KEY` reste en place comme repli.

2. **Redéployer les 10 fonctions, sans changement de code**
   - check-express-job
   - express-analysis
   - express-analysis-status
   - manual-express-analysis
   - reconcile-express-analyses
   - record-wavacademy-consent
   - retry-express-analysis
   - send-claim-email
   - stripe-webhook
   - wavacademy-claim-status

3. **Vérification fonction par fonction**
   Après déploiement, je contrôle les logs de boot de chaque fonction et je te donne un tableau succès/échec, ligne par ligne.

4. **Aucun autre secret touché**
   Pas de `WAVSTATS_PARTNER_KEY`, `WAVSTATS_PARTNER_PLAN_ID`, ni `WAVSTATS_PROVISION_ENABLED`. Aucune suppression.

## Détails techniques

- Le code lit `Deno.env.get("WAVSTATS_API_KEY") ?? Deno.env.get("WAV_SOCIAL_SCAN_API_KEY")` : la bascule est donc sans coupure.
- Ordre imposé : secret d'abord, redéploiement ensuite (l'environnement d'une fonction est figé au déploiement).
- Aucune migration base de données, aucun changement frontend.
