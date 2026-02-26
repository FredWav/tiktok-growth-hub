

## Retirer les références "TikTok" et les remplacer par "formats courts" / "réseaux sociaux"

Le site fait actuellement reference a TikTok partout. On va remplacer toutes les mentions par des formulations generiques adaptees aux formats courts (TikTok, Instagram Reels, YouTube Shorts, etc.).

### Principe de remplacement

- "TikTok" (seul) --> "formats courts" ou "réseaux sociaux" selon le contexte
- "stratégie TikTok" --> "stratégie de contenu" ou "stratégie formats courts"
- "présence TikTok" --> "présence en ligne" ou "présence sur les réseaux"
- "compte TikTok" --> "compte" ou "comptes réseaux sociaux"
- "Expert TikTok" --> "Expert formats courts"
- Le lien TikTok dans le footer et la page contact reste (c'est un lien vers le profil social de Fred, pas une mention du service)

### Fichiers modifies

**Pages principales :**

1. **Home.tsx** -- Hero ("Clarifie ta stratégie TikTok" --> "Clarifie ta stratégie."), SEO meta, profils, FAQ
2. **Offres.tsx** -- SEO meta, descriptions, stats ("3 ans d'expertise TikTok" --> "3 ans d'expertise formats courts"), forWho items
3. **OneShot.tsx** -- Hero, SEO meta, FAQ ("un compte TikTok" --> "un compte sur les réseaux")
4. **QuarantecinqJours.tsx** -- Hero, SEO meta, forYou items, CTA final
5. **APropos.tsx** -- Description, SEO meta, parcours ("je n'ai pas commencé avec TikTok" --> "je n'ai pas commencé avec les formats courts")
6. **Preuves.tsx** -- SEO meta, video testimonials alt texts, schema
7. **VipCheckout.tsx** -- SEO meta
8. **Contact.tsx** -- SEO meta
9. **AnalyseExpress.tsx** -- SEO meta, toast, titre hero ("Analyse Express TikTok" --> "Analyse Express")
10. **AnalyseExpressResult.tsx** -- SEO meta, nom fichier PDF
11. **CGV.tsx** -- SEO meta, descriptions legales
12. **PolitiqueConfidentialite.tsx** -- "Nom d'utilisateur TikTok" --> "Identifiant de compte"

**Composants :**

13. **Footer.tsx** -- Description ("Expert stratégie TikTok" --> "Expert stratégie formats courts")
14. **WavSocialScanPopup.tsx** -- "ton compte TikTok" --> "ton compte"

**Donnees techniques (pas de changement visible) :**
- `pdf-data-mapper.ts`, `pdf-html-generator.ts` : les champs internes `tiktok_breakdown`, `platform: 'tiktok'` restent car ce sont des identifiants techniques de l'API d'analyse, pas du texte visible

### Detail du Hero (Home.tsx)

Avant : "Clarifie ta stratégie TikTok. Augmente ta visibilité."
Apres : "Clarifie ta stratégie. Augmente ta visibilité."

Le degrade doré reste sur "Augmente ta visibilité." comme dans l'image de reference.

### Nombre total de fichiers : ~14 fichiers a modifier
