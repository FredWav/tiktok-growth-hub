

## Corriger les balises SEO manquantes sur toutes les pages

### Probleme

Le composant `SEOHead` ne gere que 4 balises (`description`, `og:title`, `og:description`, `og:url`, `canonical`). Il manque plusieurs balises importantes pour le referencement et le partage sur les reseaux sociaux.

### Balises manquantes

- `og:type` (website)
- `og:image` (image de partage)
- `og:locale` (fr_FR)
- `og:site_name` (Fred Wav)
- `twitter:card` (summary_large_image) -- present dans index.html mais pas mis a jour par page
- `twitter:title`
- `twitter:description`
- `twitter:image`

### Modification

**Fichier** : `src/components/SEOHead.tsx`

Enrichir le composant pour ajouter toutes les balises manquantes automatiquement, sans changer l'interface des pages existantes :

```text
Balises ajoutees dans le useEffect :

setMeta("og:type", "website", "property");
setMeta("og:locale", "fr_FR", "property");
setMeta("og:site_name", "Fred Wav", "property");
setMeta("og:image", "https://lovable.dev/opengraph-image-p98pqg.png", "property");
setMeta("twitter:card", "summary_large_image");
setMeta("twitter:title", title);
setMeta("twitter:description", description);
setMeta("twitter:site", "@FredWav");
setMeta("twitter:image", "https://lovable.dev/opengraph-image-p98pqg.png");
```

### Aucun changement dans les pages

Toutes les pages utilisent deja `SEOHead` avec `title`, `description` et `path`. Les nouvelles balises seront ajoutees automatiquement par le composant enrichi. Aucune modification necessaire dans les fichiers de pages.

### Detail technique

Le composant utilise la meme fonction `setMeta` existante pour creer ou mettre a jour les balises. Les balises Twitter utilisent `attr="name"` (par defaut), les balises OpenGraph utilisent `attr="property"`. Les valeurs statiques (og:type, og:locale, og:site_name, images) sont codees en dur car identiques sur toutes les pages.

