

## Refonte complète du funnel /start → /processing → /result

### Scope

Remplacement complet de `DiagnosticStart.tsx` (page unique multi-step) par un système à 3 pages avec state partagé, nouvelles questions, et page de résultat dynamique côté client.

### Architecture

```text
src/
  contexts/DiagnosticContext.tsx    ← NEW: Context API pour state du funnel
  pages/
    DiagnosticStart.tsx             ← REWRITE: 6-step form
    DiagnosticProcessing.tsx        ← NEW: transition animée
    DiagnosticResult.tsx            ← NEW: résultat dynamique
  App.tsx                           ← ADD 2 routes
```

### Fichiers à créer/modifier

**1. `src/contexts/DiagnosticContext.tsx`** (NEW)
- Context + Provider avec state : `firstName`, `tiktokUrl`, `audience`, `objectif`, `budget`, `temps`, `blocage`
- Setter function, reset function
- Wrap dans App.tsx autour des routes publiques

**2. `src/pages/DiagnosticStart.tsx`** (REWRITE)
- 6 steps avec Progress bar animée, bouton Retour
- Step 1: Prénom + Lien TikTok (URL validation via Zod)
- Step 2: Audience (RadioGroup: 0-5k, 5k-50k, 50k+)
- Step 3: Objectif (RadioGroup: Visibilité, Audience, Monétiser, Vendre)
- Step 4: Budget (RadioGroup: 0€, 1-200€, 200-500€, 500€+)
- Step 5: Temps disponible (RadioGroup: <2h, 2-5h, 5-10h, +10h)
- Step 6: Blocage (Textarea, 150 chars min si audience >= 5k)
- On submit → save to context + `saveLead` to DB + navigate `/processing`
- Conserve le save progressif vers `diagnostic_leads`

**3. `src/pages/DiagnosticProcessing.tsx`** (NEW)
- Centré verticalement, spinner/progress animé
- Textes dynamiques toutes les 800ms: "Analyse du profil...", "Détection des blocages...", "Construction du plan d'action..."
- Après 2.5s, bouton "Voir mon diagnostic" apparaît → navigate `/result`
- Si pas de data dans context → redirect `/start`

**4. `src/pages/DiagnosticResult.tsx`** (NEW)
- Header avec prénom, audience, objectif
- **Bloc 1 - Score de maturité**: Calcul (audience pts + objectif pts + budget pts) affiché dans un cercle. Interprétation conditionnelle (<40, 40-70, >70)
- **Bloc 2 - Constat stratégique**: Texte conditionnel basé sur audience
- **Bloc 3 - Temps**: Texte conditionnel basé sur temps + audience
- **Bloc 4 - Offre recommandée**: Routing logic exacte (EXPRESS / ONE_SHOT / ONE_SHOT_PLUS_PREMIUM / PREMIUM) avec Cards et CTAs
- Si pas de data → redirect `/start`
- Sets `sessionStorage.setItem("from_diagnostic", "true")`

**5. `src/App.tsx`** (EDIT)
- Import DiagnosticProcessing, DiagnosticResult
- Add routes `/processing` et `/result`
- Wrap with DiagnosticProvider (ou placer dans les routes individuelles)

### Design
- Même esthétique existante : fond crème `bg-[hsl(var(--cream))]`, font-display Playfair, boutons `variant="hero"`
- RadioGroup avec des cards stylisées (reprend le pattern OptionCard existant)
- Score circulaire avec SVG circle + stroke-dasharray
- Cards d'offres avec Shadcn Card component
- Mobile-first responsive

### Liens CTA des offres
- EXPRESS → `/analyse-express`
- ONE_SHOT → `/one-shot`
- PREMIUM → `https://calendly.com/fredwavcm/wav-premium`
- ONE_SHOT_PLUS_PREMIUM → CTA principal `/one-shot`, secondaire Calendly
- Footer mail: `mailto:fredwavcm@gmail.com`

### DB compatibility
- Continue d'utiliser la table `diagnostic_leads` existante
- Nouveaux champs `audience`, `temps` seront ajoutés au save (colonnes existantes ou dans un champ JSON)

