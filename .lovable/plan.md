

# Mise a jour de la page A Propos -- ajout des stats reseaux sociaux

## Contexte

La page A Propos est en cours de refonte complete (plan precedemment approuve). Les nouvelles stats d'audience fournies (280K TikTok, 35K Instagram, 30K YouTube) viennent s'ajouter aux chiffres deja prevus.

## Section Stats mise a jour

Le bandeau de stats passera de 4 a 8 elements, organises en 2 lignes de 4 :

| Stat | Label |
|---|---|
| 300+ | Createurs accompagnes |
| 10M+ | Vues generees via strategies deployees |
| 18 ans | D'experience en creation video |
| 20 ans | Dans la musique et la creation artistique |
| 280K | Abonnes TikTok cumules |
| 35K | Abonnes Instagram |
| 30K | Abonnes YouTube |
| 95% | Taux de satisfaction |

Grille : `grid-cols-2 md:grid-cols-4` pour garder une lecture propre sur toutes les tailles d'ecran.

## Rappel des autres changements (plan precedent, toujours valide)

- **Hero** : texte mis a jour avec "Strategiste en contenu TikTok et formats courts", ton authentique
- **Parcours** : remplacement par le vrai parcours (18 ans de video, musique, technique son, analyse de milliers de videos)
- **Philosophie** : nouveau bloc "On ne poste pas pour exister. On poste pour convertir."
- **Valeurs** : descriptions mises a jour (300+ createurs, 18 ans, transparence sans filtre)
- **CTA** : inchange

## Details techniques

- **Fichier modifie** : `src/pages/APropos.tsx`
- Le tableau `stats` passe de 4 a 8 elements
- La grille stats garde `grid-cols-2 md:grid-cols-4` (2 lignes de 4 sur desktop)
- On retire le stat "13 ans en technique son" pour eviter la surcharge -- 8 stats c'est le maximum lisible. L'info reste dans le texte du parcours.
- Aucun fichier cree ou supprime, aucun changement backend

