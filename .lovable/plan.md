
# Refonte complete de la section Etudes de cas -- format Avant/Apres

## Ce qui change

La structure actuelle (description + 3 metriques en grille) est remplacee par un format **Avant / Apres + Resultat type**, beaucoup plus percutant et lisible.

## Nouveau contenu et structure

### Etude 1 -- Accompagnement 45 jours
- **Titre** : "Passer du chaos a une strategie claire"
- **Avant** : Publications irregulieres / Aucun systeme / Aucune lecture des stats
- **Apres** : Calendrier editorial structure / Hooks retravailles / CTA optimises / Premieres demandes entrantes
- **Resultat type** : Videos qui depassent regulierement les 5k-15k vues / 1 a 3 prospects qualifies par semaine / Comprehension reelle des metriques

### Etude 2 -- Accompagnement Business
- **Titre** : "Transformer l'audience en chiffre d'affaires"
- **Avant** : Des vues / Peu de conversion / Positionnement flou
- **Apres** : Offre clarifiee / CTA strategique / Contenu oriente acquisition
- **Effet constate** : Plus de leads qualifies / Moins de perte d'audience / Meilleur ratio vues/ventes

### Etude 3 -- One Shot strategique
- **Titre** : "Arreter de poster pour rien"
- **Description** : Diagnostic direct. Ajustement clair. Repositionnement immediat.
- **Objectif** : Faire en sorte que chaque video serve une strategie.
- Format plus court et punch, pas de avant/apres classique

## Mise en page

- Chaque etude de cas est une carte avec :
  - Tag categorie en haut
  - Titre en gros
  - Deux colonnes **Avant** (fond sombre, texte barre ou grise) et **Apres** (fond accent, texte vif)
  - Bloc "Resultat type observe" en bas avec icones check
- Le 3e (One Shot) a un format special : texte centre, phrases courtes, style manifeste
- Les disclaimers actuels sont retires (le ton honnete est deja dans le contenu)

## Details techniques

- **Fichier modifie** : `src/pages/Preuves.tsx`
- Remplacement complet du tableau `caseStudies` et de son rendu JSX dans la section "Etudes de cas"
- Import de `Check` et `X` depuis lucide-react pour les listes avant/apres
- Aucun nouveau fichier, aucune dependance ajoutee
