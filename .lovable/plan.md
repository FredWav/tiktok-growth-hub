

## Plan : Bouton export CSV sur la page admin Diagnostics

### Fichier modifié : `src/pages/admin/Diagnostics.tsx`

- Ajouter un bouton "Exporter CSV" à côté du titre `<h1>`
- Au clic, générer un fichier CSV côté client à partir des données `leads` déjà chargées via le hook
- Colonnes : Date, Prénom, Nom, Email, TikTok, Niveau, Objectif, Blocage, Budget, Offre recommandée, Étape, Statut
- Utiliser `Blob` + `URL.createObjectURL` + lien `<a>` temporaire pour déclencher le téléchargement
- Nom du fichier : `diagnostics-leads-YYYY-MM-DD.csv`
- Bouton désactivé si aucun lead

Aucune nouvelle dépendance, aucun changement backend.

