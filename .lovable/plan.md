

## Plan : Vérification mobile-first + Mise à jour SEO globale

### Constats

**Mobile-first** : Le code est déjà mobile-first (Tailwind par défaut). Les patterns `px-4 md:px-0`, `rounded-2xl md:rounded-none`, `whitespace-normal` sont bien appliqués. Aucun problème structurel détecté.

**SEO obsolète** : Plusieurs références au VIP et à l'ancien wording subsistent dans le SEO statique et dynamique.

---

### 1. `index.html` — Nettoyage SEO statique

- **Meta description (l.8)** : Retirer ", VIP" → garder "One Shot, Wav Premium."
- **JSON-LD ProfessionalService (l.70-110)** : Renommer `"Offres d'accompagnement"` → `"Accompagnements formats courts"`. Supprimer le bloc Offer VIP (l.94-109). Supprimer le prix du Wav Premium (`"price": "987"`).
- **JSON-LD FAQPage (l.148)** : Changer "Je débute sur TikTok" → "Je débute sur les réseaux" pour cohérence avec le nouveau wording.
- **Noscript (l.173-178)** : Remplacer "Nos offres" → "Nos accompagnements". Supprimer la ligne VIP. Retirer le prix du Wav Premium. Mettre à jour "Toutes les offres" → "Accompagnements".

### 2. `public/sitemap.xml`

- Supprimer la ligne VIP (`/offres/vip`).
- Mettre à jour les dates `lastmod` au `2026-03-10`.

### 3. `src/pages/Preuves.tsx`

- **`chooseOffers` array (l.92-117)** : Supprimer la carte VIP. Changer `md:grid-cols-3` → `md:grid-cols-2` (l.291). Mettre à jour le sous-titre "Trois formules" → "Deux formules selon ton besoin."

### 4. `src/pages/QuarantecinqJours.tsx`

- **SEO schema (l.157)** : Supprimer `"price": "987"` du Wav Premium (le prix n'est plus affiché).

### 5. `src/pages/Home.tsx` — SEO déjà à jour

Aucun changement nécessaire, le SEO reflète déjà le nouveau wording.

### 6. `src/pages/Offres.tsx` — SEO déjà à jour

Aucun changement nécessaire.

---

### Fichiers modifiés
- `index.html`
- `public/sitemap.xml`
- `src/pages/Preuves.tsx`
- `src/pages/QuarantecinqJours.tsx`

