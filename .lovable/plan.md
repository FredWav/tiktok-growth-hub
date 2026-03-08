

## Plan

### 1. DiagnosticResult.tsx

- Add `const CALENDLY_ONE_SHOT = "https://calendly.com/fredwavcm/appel-strategie-30min";` after `CALENDLY_URL` (line 13)
- **ONE_SHOT block**: Change CardTitle to "Ton plan d'action personnalisé", replace `<Link to="/one-shot">` with `<a href={CALENDLY_ONE_SHOT} target="_blank">`, update PostHog destination to `"calendly_one_shot"`
- **ONE_SHOT_PLUS_PREMIUM block**: Change CardTitle to "Ton plan d'action personnalisé", replace first `<Link to="/one-shot">` with same `<a href={CALENDLY_ONE_SHOT}>`, keep secondary Wav Premium button unchanged

### 2. Home.tsx

- Import `TrustedBy` from `@/components/TrustedBy`
- **Delete** `proofs` array (lines 53-66)
- **Replace testimonials section** (lines 253-279): Change title to "Ils etaient la ou tu es maintenant", subtitle to "Createurs et entrepreneurs qui ont clarifie leur strategie.", replace 3 generic cards with real quotes from Preuves.tsx:
  - Estelle / Membre de la formation / "Ce qui m'a le plus aide..." / Analyse de compte
  - Betty / Entrepreneure / "En tant qu'entrepreneure..." / Contrats obtenus
  - Alex / Coffre a Cartes / "J'ai pris la formation..." / Professionnalisation
- Keep "Voir toutes les preuves" button
- **Add `<TrustedBy />`** after the "A qui ca s'adresse" section (after line 218), before "Ce que tu obtiens en One Shot"

### Files modified
- `src/pages/DiagnosticResult.tsx`
- `src/pages/Home.tsx`

