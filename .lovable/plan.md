

# Refonte de la section "Ma facon de travailler"

## Probleme

La section actuelle comporte 4 blocs generiques avec des descriptions courtes. Le contenu fourni est bien plus precis, structure et percutant, avec 5 piliers au lieu de 4.

## Nouveau contenu -- 5 blocs

### 1. Strategie avant creation
- Icone : `Lightbulb` (ou `LayoutList`)
- Description : On definit l'objectif business, le positionnement, l'angle differenciant, puis seulement le contenu. Chaque video a une fonction claire : autorite, acquisition, conversion ou preparation d'offre. Pas de contenu "au hasard".

### 2. Analyse avant opinion
- Icone : `BarChart3`
- Description : Je ne donne pas d'avis. Je regarde les donnees. Retention, chute d'audience, structure, coherence editoriale, positionnement percu. On corrige sur des faits, pas sur des impressions.

### 3. Performance mesurable
- Icone : `TrendingUp` (garde l'existant)
- Description : On ne vise pas des vues. On vise des leads, des ventes, une audience qualifiee, une montee en autorite. Si ca ne genere pas de levier business, on ajuste.

### 4. Exigence mutuelle
- Icone : `Shield` (ou `Handshake`)
- Description : Je suis exigeant. Tu dois l'etre aussi. Je ne travaille pas avec ceux qui veulent une validation, une excuse ou une solution magique. Je travaille avec ceux qui veulent comprendre et appliquer.

### 5. Optimisation continue
- Icone : `RefreshCw`
- Description : TikTok evolue. Les formats courts evoluent. Le marche evolue. On teste, on ajuste, on mesure, on itere. La strategie n'est jamais figee.

## Changements de layout

- La grille passe de `md:grid-cols-2` (4 cartes, 2x2) a une disposition en 5 cartes : 3 en haut + 2 en bas centrees, via `md:grid-cols-3` avec les 2 derniers elements centres
- Alternative plus simple : garder `md:grid-cols-2` avec la 5e carte en pleine largeur en bas
- Le sous-titre de la section sera retire ("Des principes simples...") pour laisser les blocs parler d'eux-memes

## Details techniques

- **Fichier modifie** : `src/pages/APropos.tsx`
- Le tableau `values` passe de 4 a 5 elements avec de nouvelles icones importees depuis lucide-react (`Lightbulb`, `BarChart3`, `Shield`, `RefreshCw`)
- Les icones `Target`, `Users`, `Award` seront retirees des imports (plus utilisees)
- Aucun fichier cree ou supprime, aucun changement backend

