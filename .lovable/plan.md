

## Plan : Sécurité quand l'analyse IA est absente + notification Discord

### 1. Backend : Notification Discord dans `express-analysis-status`

Modifier `supabase/functions/express-analysis-status/index.ts` :
- Quand le job est `completed` et que `job.result.account.ai_insights` est null/vide, envoyer une notification Discord via le webhook existant (`https://discord.com/api/webhooks/1476936142149390498/...`)
- L'embed Discord contiendra : username TikTok, session_id, et le fait que l'analyse IA est manquante
- Ajouter un flag `missing_ai_insights: true` dans la réponse renvoyée au client
- Mettre à jour le record `express_analyses` avec un champ `error_message` indiquant l'absence d'insights IA

### 2. Frontend : Message d'excuse dans `AnalyseExpressResult.tsx`

Modifier `src/pages/AnalyseExpressResult.tsx` :
- Détecter quand `account?.ai_insights` est null/vide après le chargement des résultats
- Afficher à la place de la section IA un encart visible avec :
  - Icône d'alerte
  - Titre : "Analyse IA temporairement indisponible"
  - Message : "Nous sommes sincèrement désolés pour ce désagrément. Notre équipe a été automatiquement informée et travaille à corriger votre rapport. Nous vous recontacterons rapidement avec votre analyse complète et corrigée."
  - Les autres données (metrics, hashtags, persona, etc.) restent visibles normalement

### Fichiers modifiés
- `supabase/functions/express-analysis-status/index.ts` — ajout envoi webhook Discord si `ai_insights` absent
- `src/pages/AnalyseExpressResult.tsx` — affichage message fallback quand `ai_insights` est null

