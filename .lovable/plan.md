

## Plan : Générer le rapport HTML en interne

Au lieu d'appeler l'API externe pour le PDF, l'edge function `express-pdf` va construire elle-même un rapport HTML complet et qualitatif à partir des données d'analyse déjà disponibles.

### Approche

L'edge function recevra `session_id`, `username` et surtout `data` (l'objet complet de l'analyse) directement depuis le frontend. Elle n'appellera plus l'API externe - elle construira un document HTML autonome avec CSS inline, prêt à être imprimé en PDF depuis le navigateur.

### Design du rapport

- Palette : noir (#0F0F0F), or (#C4A34A), crème (#FAFAF5), blanc, gris (#737373)
- Typographies : Inter (body) + Playfair Display (titres) via Google Fonts
- Mise en page A4 avec `@media print` pour impression propre
- Sections avec bordures fines, coins arrondis, barres de progression colorées

### Structure du rapport HTML

1. **En-tête** : logo/titre "FredWav - Analyse TikTok", date, nom du compte
2. **Profil** : avatar, display_name, @username, bio, niche, badge vérifié
3. **Health Score** : score global + jauge visuelle + statut + 5 composants avec barres
4. **Métriques clés** : grille abonnés/likes/vidéos/engagement + moyennes + médianes
5. **Top Hashtags** : badges stylés
6. **Meilleurs créneaux** : top 5 horaires avec jours en français
7. **Régularité** : 5 sous-scores avec barres + détails
8. **Persona** : niche, forces, faiblesses
9. **Analyse IA** : rendu du markdown `ai_insights` en HTML (h1-h3, bold, listes, paragraphes)
10. **Pied de page** : mention "Généré par FredWav" + date

### Fichiers modifiés

| Fichier | Changement |
|---------|-----------|
| `supabase/functions/express-pdf/index.ts` | Remplacement complet : suppression de l'appel API externe, construction du HTML en interne à partir de `data` |
| `src/pages/AnalyseExpressResult.tsx` | Modifier `handleDownloadPdf` pour envoyer `data` en plus de `session_id` et `username` |

### Détails techniques

**Edge function** : reçoit `{ session_id, username, data }`, vérifie le paiement Stripe, puis génère un HTML autonome (pas de CSS externe sauf Google Fonts) avec :
- Fonction `renderMarkdownToHtml(md)` pour convertir les `ai_insights` en HTML
- Fonction `formatNumber(n)` pour les métriques
- Fonction `getScoreColor(score)` pour les couleurs des barres
- Traduction des jours (0=Dimanche..6=Samedi)
- CSS inline avec variables, `@media print` pour suppression header/footer navigateur

**Frontend** : le bouton "Télécharger le rapport" enverra désormais l'objet `data` complet à l'edge function, évitant tout rappel API.

