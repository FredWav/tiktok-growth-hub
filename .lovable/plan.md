

## Plan : Ajouter le tracking PostHog au diagnostic /start

### Fichier modifié : `src/pages/DiagnosticStart.tsx`

Importer `trackEvent` depuis `@/lib/tracking` et ajouter des événements à chaque interaction clé :

| Moment | Événement | Propriétés |
|--------|-----------|------------|
| Clic "Démarrer" (step 0→1) | `diagnostic_started` | — |
| Validation identité (step 1→2) | `diagnostic_step_identity` | `email`, `tiktok` |
| Sélection niveau (step 2→3) | `diagnostic_step_level` | `level` |
| Sélection objectif (step 3→4) | `diagnostic_step_objective` | `objective` |
| Validation blocker (step 4→5) | `diagnostic_step_blocker` | — |
| Sélection budget (step 5→résultat) | `diagnostic_completed` | `budget`, `recommended_offer`, `level`, `objective` |
| Clic CTA résultat | `diagnostic_cta_click` | `recommended_offer`, `url` |
| Clic "Retour" | `diagnostic_back` | `from_step` |

Aussi appeler `identifyUser(data.email)` à l'étape identité pour rattacher le lead à son email dans PostHog.

### Modifications concrètes

- Ajouter `import { trackEvent } from "@/lib/tracking"` et `import { identifyUser } from "@/lib/posthog"`
- Insérer `trackEvent(...)` dans : le bouton "Démarrer", `handleIdentityNext`, chaque `onClick` des OptionCard (steps 2 et 3), `handleBlockerNext`, `handleBudgetSelect`, le lien CTA du résultat, et le bouton retour

Aucune nouvelle dépendance, aucun changement de structure.

