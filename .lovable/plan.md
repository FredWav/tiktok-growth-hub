

## Plan: Modal de confirmation du nom d'utilisateur avant paiement

### Contexte
Quand l'utilisateur clique sur "Lancer l'analyse", on affiche un modal de confirmation pour s'assurer qu'il a bien entré son **nom d'utilisateur** (le @) et non son **pseudo/nom d'affichage**.

### Ce qui sera fait

**Fichier modifié : `src/pages/AnalyseExpress.tsx`**

1. Ajouter un state `showConfirmModal` (boolean)
2. Au `handleSubmit`, au lieu de lancer directement le paiement Stripe, ouvrir le modal
3. Le modal contiendra :
   - Un titre explicatif : "Vérifie ton nom d'utilisateur"
   - L'image uploadée (screenshot TikTok) copiée dans `src/assets/` comme référence visuelle, avec une flèche/encadré montrant où se trouve le @username sur TikTok
   - Le username saisi affiché en gras avec le @
   - Un texte : "Attention, entre bien ton **nom d'utilisateur** (le @) et non ton pseudo affiché."
   - Deux boutons :
     - "Ha je me suis trompé !" (secondary/outline) → ferme le modal, remet le focus sur l'input
     - "Je valide" (primary/hero) → lance le paiement Stripe (logique actuelle du `handleSubmit`)
4. Utiliser le composant `Dialog` existant de shadcn/ui

**Fichier copié : `user-uploads://image-23.png` → `src/assets/tiktok-username-example.png`**

L'image sera affichée dans le modal comme illustration.

### Détails techniques

- Le `Dialog` sera contrôlé via `open={showConfirmModal}` / `onOpenChange={setShowConfirmModal}`
- La logique de paiement Stripe sera extraite dans une fonction `proceedToPayment()` appelée uniquement au clic sur "Je valide"
- Le formulaire `onSubmit` ne fera que valider l'input et ouvrir le modal
- L'image sera importée via ES6 module (`import tiktokExample from "@/assets/tiktok-username-example.png"`)

