

## Ajouter les meta keywords sur toutes les pages

### Modification

**Fichier** : `src/components/SEOHead.tsx`

1. Ajouter une prop optionnelle `keywords` a l'interface `SEOHeadProps`
2. Ajouter `setMeta("keywords", keywords)` dans le `useEffect` quand la prop est fournie

**Fichiers pages** : Ajouter la prop `keywords` a chaque appel de `SEOHead` avec des mots-cles pertinents :

| Page | Keywords |
|------|----------|
| `Home.tsx` | strategie tiktok, coaching tiktok, expert tiktok, plan action tiktok, Fred Wav, audience tiktok, monetiser tiktok |
| `OneShot.tsx` | one shot tiktok, session strategie, diagnostic tiktok, coaching individuel, plan action, 179 euros |
| `QuarantecinqJours.tsx` | accompagnement 45 jours, transformation tiktok, suivi personnalise, coaching tiktok intensif |
| `VipCheckout.tsx` | vip tiktok, accompagnement continu, discord tiktok, lives hebdo, feedback createur |
| `Offres.tsx` | tarifs coaching tiktok, offres tiktok, one shot, 45 jours, vip, accompagnement createur |
| `APropos.tsx` | Fred Wav, expert tiktok, parcours, methode data-driven, accompagnement createur |
| `Preuves.tsx` | temoignages tiktok, resultats clients, etudes de cas, retours experience, preuves |
| `Contact.tsx` | contact Fred Wav, question tiktok, reseaux sociaux, email |
| `CGV.tsx` | conditions generales, cgv, mentions legales |
| `MentionsLegales.tsx` | mentions legales, editeur, hebergeur |
| `OneShotSuccess.tsx` | confirmation, paiement, one shot |

### Detail technique

- La prop `keywords` est de type `string` optionnelle
- Si elle n'est pas fournie, aucune balise `keywords` n'est ajoutee
- Chaque page passe ses mots-cles separes par des virgules
- On utilise la meme fonction `setMeta` existante : `setMeta("keywords", keywords)`

