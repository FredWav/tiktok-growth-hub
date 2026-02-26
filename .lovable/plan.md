

## Formulaire de candidature Wav Premium

### Objectif
Remplacer le lien vers `/contact` par un formulaire de candidature dédié sur la page `/45-jours` (et depuis `/offres`). Le formulaire qualifie le créateur avant de l'orienter vers la prise de rendez-vous Calendly.

### Flux utilisateur
1. Le créateur clique sur "Candidater au Wav Premium"
2. Il arrive sur une nouvelle page `/wav-premium/candidature` avec un formulaire
3. Il remplit les champs requis
4. Apres soumission, il est redirigé vers le lien Calendly pour réserver un appel

### Champs du formulaire
- **Prenom et nom** (texte, requis)
- **Email** (email, requis)
- **Compte TikTok** (texte, optionnel -- @ username)
- **Ou en es-tu aujourd'hui sur TikTok ?** (choix unique parmi : "Je debute / Je n'ai pas encore de compte", "Je poste mais sans vraie strategie", "J'ai une audience mais je stagne", "J'ai deja des resultats mais je veux scaler")
- **Quels sont tes principaux points de blocage ?** (textarea, requis -- ex: manque de regularite, pas de vues, pas de conversions...)
- **Quels sont tes objectifs avec cet accompagnement ?** (textarea, requis)
- **Budget** : un encart informatif clair indiquant que cet accompagnement demande un investissement minimum de 800EUR et qu'il est preferable de commencer par un One Shot si le budget est inferieur. Checkbox de confirmation ("Je confirme que mon budget est d'au moins 800EUR pour cet accompagnement")

### Apres soumission
- Message de confirmation avec bouton "Reserver mon appel de qualification" pointant vers `https://calendly.com/fredwavcm/wav-premium`
- Les donnees du formulaire sont stockees dans une table `wav_premium_applications` pour que l'admin puisse les consulter

### Modifications techniques

**1. Nouvelle table `wav_premium_applications`**
- `id` (uuid, PK)
- `created_at` (timestamptz)
- `first_name` (text)
- `last_name` (text)
- `email` (text)
- `tiktok_username` (text, nullable)
- `current_level` (text) -- valeur du choix unique
- `blockers` (text) -- points de blocage
- `goals` (text) -- objectifs
- `budget_confirmed` (boolean)
- RLS: INSERT pour anon/public, SELECT uniquement pour admin

**2. Nouvelle page `src/pages/WavPremiumApplication.tsx`**
- Formulaire avec validation via `zod` + `react-hook-form`
- Apres soumission reussie : ecran de confirmation avec lien Calendly
- Design coherent avec le reste du site (Layout, Section, etc.)

**3. Mise a jour du routage (`src/App.tsx`)**
- Ajouter la route `/wav-premium/candidature`

**4. Mise a jour des liens CTA**
- `src/pages/QuarantecinqJours.tsx` : remplacer les `Link to="/contact"` par `Link to="/wav-premium/candidature"`
- `src/pages/Offres.tsx` : le CTA "Candidater au Wav Premium" pointe deja vers `/45-jours`, pas de changement necessaire (le formulaire est accessible depuis cette page)

