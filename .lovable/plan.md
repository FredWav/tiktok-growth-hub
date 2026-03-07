

## Plan : Harmoniser les events PostHog du funnel diagnostic

Email mailto reste `fredwavcm@gmail.com`, durée d'appel reste 45 min. Seuls les events PostHog changent.

### 1. `DiagnosticStart.tsx`

- **Step 0 "Démarrer"** : ajouter `trackPostHogEvent("diagnostic_started")` dans le onClick (en plus du `trackEvent` existant)
- **`selectOption`** : ajouter `trackPostHogEvent("step_completed", { step_name, value_selected })` — mapper field vers step_name : audience→"Audience", objectif→"Objectif", budget→"Budget", temps→"Temps"
- **`handleIdentityNext`** (après validation) : ajouter `trackPostHogEvent("step_completed", { step_name: "Identity", value_selected: "completed" })`
- **`handleEmailNext`** (après validation) : ajouter `trackPostHogEvent("step_completed", { step_name: "Email", value_selected: "completed" })`
- **`handleBlockerNext`** validation échouée (150 chars) : ajouter `trackPostHogEvent("validation_error_triggered", { error_type: "min_length_150", audience_level: data.audience })`
- **`handleBlockerNext`** submit réussi : ajouter `trackPostHogEvent("diagnostic_form_submitted", { audience: data.audience, objectif: data.objectif, budget: data.budget, time_available: data.temps })`

### 2. `DiagnosticProcessing.tsx`

- Ajouter import `trackPostHogEvent`
- Dans le `useEffect` quand `isComplete` est true : `trackPostHogEvent("processing_screen_viewed")`

### 3. `DiagnosticResult.tsx`

- **Mount useEffect** : remplacer `diagnostic_result_viewed` par `result_page_viewed` avec `{ maturity_score: score, recommended_offer: offer }`
- **CTA Express** : ajouter `trackPostHogEvent("cta_clicked", { offer_type: "EXPRESS", destination: "/analyse-express" })`
- **CTA One Shot** : ajouter `trackPostHogEvent("cta_clicked", { offer_type: "ONE_SHOT", destination: "/one-shot" })`
- **CTA Premium** : ajouter `trackPostHogEvent("cta_clicked", { offer_type: "PREMIUM", destination: "calendly" })`
- **CTA combo One Shot** : ajouter `trackPostHogEvent("cta_clicked", { offer_type: "ONE_SHOT", destination: "/one-shot" })`
- **CTA combo Premium (secondaire)** : ajouter `trackPostHogEvent("secondary_cta_clicked", { offer_type: "PREMIUM_UPSELL" })`
- **MailFooter** : remplacer event par `trackPostHogEvent("contact_mail_clicked", { source_offer: offer })`

Aucun changement de contenu, email ou durée d'appel.

