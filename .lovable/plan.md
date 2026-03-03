

## Plan : Tunnel de Qualification "Diagnostic Strategique TikTok" sur /start

### Resume
Creer une page single-page type Typeform avec un tunnel multi-etapes (6 ecrans) qui qualifie les leads par budget et les redirige vers l'offre adaptee. Pas de backend, etat local React uniquement.

### Fichiers a creer/modifier

#### 1. Nouveau fichier : `src/pages/DiagnosticStart.tsx`
Page autonome contenant tout le tunnel. Composant unique avec `useState` pour gerer l'etape courante (0-6) et les donnees du formulaire.

**Structure des ecrans :**
- **Ecran 0 (Accueil)** : Titre "Diagnostic Strategique TikTok", sous-titre explicatif, bouton "Demarrer le diagnostic"
- **Etape 1 (Identite)** : 4 inputs (prenom, nom, email, TikTok). Validation Zod. Bouton "Suivant"
- **Etape 2 (Niveau)** : 3 cartes cliquables avec icones Lucide (Sprout, TrendingUp, DollarSign). Selection auto-avance
- **Etape 3 (Objectif)** : 3 cartes cliquables (Eye, LayoutList, Coins). Selection auto-avance
- **Etape 4 (Blocage)** : Textarea obligatoire (min 10 chars). Bouton "Derniere etape"
- **Etape 5 (Budget)** : 4 cartes cliquables (budget filter)
- **Ecran 6 (Resultat)** : Spinner 2s puis affichage du resultat selon le budget choisi

**Logique de routage (ecran resultat) :**
- Pas de budget → Discord (https://discord.gg/6ctGNjqUXr)
- Moins de 200€ → One-Shot (https://fredwav.com/one-shot)
- 200-500€ → VIP (https://fredwav.com/offres/vip) + badge urgence "7 places sur 10"
- 500-1000€+ → Wav Premium Calendly + badge urgence "3 places sur 5"

**Design :**
- Fond cream (bg-cream), texte noir (text-noir), accents gold (primary)
- Barre de progression en haut (Progress component existant)
- Cartes cliquables : bordure, hover avec bordure gold, etat selectionne avec bg-primary/10 et bordure primary
- Transitions avec opacity/transform (animate-fade-in existant)
- Mobile-first, max-w-2xl centre
- Sans Header/Footer (pas de Layout wrapper) pour experience full-screen tunnel

#### 2. Modifier : `src/App.tsx`
- Ajouter import `DiagnosticStart`
- Ajouter route `<Route path="/start" element={<DiagnosticStart />} />`

### Contraintes respectees
- Pas de base de donnees, etat local useState uniquement
- Icones Lucide uniquement (pas d'emojis)
- 100% responsive mobile-first
- Composants UI existants reutilises (Button, Input, Textarea, Progress)
- Charte graphique noir/or/cream du projet

