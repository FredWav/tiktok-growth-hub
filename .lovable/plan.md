

## Supprimer les emojis de la section "A qui ca s'adresse"

Les trois profils de la landing page utilisent des emojis (😤, 👀, 🎯) comme element visuel principal. Il faut les remplacer par des icones Lucide coherentes avec le reste du design.

### Modification

**Fichier** : `src/pages/Home.tsx` (lignes 30-44)

Remplacer les emojis par des icones Lucide deja importees ou disponibles :

- 😤 "Tu postes, ca ne decolle pas" → icone `TrendingDown` (tendance descendante, represente la stagnation)
- 👀 "Tu as des vues mais pas de clients" → icone `Eye` (des vues sans conversion)
- 🎯 "Tu veux structurer ton contenu pour vendre" → icone `Target` (deja importee, objectif clair)

Dans le rendu des cards (lignes 161-175), remplacer le `<span>` emoji par un bloc icone stylise similaire aux cards d'offres (fond arrondi + icone coloree).

### Detail technique

1. Ajouter les imports `TrendingDown` et `Eye` depuis lucide-react
2. Changer la structure `profiles` : remplacer `emoji: string` par `icon: LucideIcon`
3. Dans le rendu, remplacer `<span className="text-4xl">{profile.emoji}</span>` par un conteneur avec l'icone stylisee

