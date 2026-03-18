

## Deep Link Generator pour YouTube

### 1. Migration SQL — Table `deep_links`

```sql
CREATE TABLE public.deep_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text UNIQUE NOT NULL,
  youtube_id text NOT NULL,
  title text NOT NULL,
  clicks_count integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.deep_links ENABLE ROW LEVEL SECURITY;

-- Admin full access
CREATE POLICY "Admins can manage deep_links"
ON public.deep_links FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Public read by slug (for redirect page)
CREATE POLICY "Anyone can select deep_links by slug"
ON public.deep_links FOR SELECT TO anon, authenticated
USING (true);

-- Public update for click increment
CREATE POLICY "Anyone can increment clicks"
ON public.deep_links FOR UPDATE TO anon, authenticated
USING (true) WITH CHECK (true);
```

### 2. Fichiers a creer/modifier

**`src/pages/admin/DeepLinks.tsx`** — Page admin avec :
- Formulaire (Titre, Slug, YouTube ID) utilisant Input/Button/Label Shadcn
- Tableau listant les liens existants (titre, slug, clics, lien copiable `fredwav.lovable.app/go/[slug]`)
- CRUD via `supabase` client, toast pour feedback
- Wrapped dans `AdminLayout`

**`src/pages/GoRedirect.tsx`** — Page publique `/go/:slug` :
- Pas de Header/Footer, page minimale
- Fetch du `deep_link` par slug
- Increment `clicks_count` via update
- Tente `window.location.href = "youtube://www.youtube.com/watch?v=[ID]"`
- Fallback apres 2.5s vers `https://www.youtube.com/watch?v=[ID]`
- Affiche loader + message "Redirection vers YouTube en cours..."

**`src/components/layout/AdminLayout.tsx`** — Ajout dans `navItems` :
```ts
{ label: "Deep Links", href: "/admin/deep-links", icon: Link }
```

**`src/App.tsx`** — Ajout de 2 routes :
- `/go/:slug` → `<GoRedirect />` (publique, sans layout)
- `/admin/deep-links` → `<AdminDeepLinks />` (protegee admin)

### 3. Comportement de la redirection mobile

La page `/go/:slug` execute immediatement `window.location.href = "youtube://..."` pour forcer l'ouverture de l'app YouTube. Un `setTimeout` de 2500ms redirige vers l'URL web YouTube classique en fallback (si l'app n'est pas installee ou si le deep link echoue).

