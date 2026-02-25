

## Plan : Refaire le PDF dans le style FredWav (noir/or/crème)

### Objectif

Remplacer le design violet/bleu actuel du PDF par le style premium du site FredWav (fond crème, accents or/brun, typographie sobre) comme montré dans les captures d'écran. Ajouter les sections manquantes (meilleurs créneaux, régularité, persona) au PDF.

### Analyse des captures

Les screenshots montrent un PDF avec :
- **Header** : fond crème, branding "FredWav" en haut à gauche, date + @username en haut à droite
- **Profil** : avatar rond avec bordure dorée, nom, bio, badges liens sociaux
- **Métriques Clés** : grille de cartes avec bordures fines, valeurs en gras (abonnés, likes total, vidéos, engagement, moyennes, médianes)
- **Top Hashtags** : badges colorés dégradé or/brun
- **Meilleurs Créneaux** : barres horizontales dorées avec classement #1-#5, recommandations
- **Régularité Détaillée** : barres de progression colorées (vert/jaune/rouge) avec scores
- **Persona Identifié** : niche, points d'amélioration
- **Analyse Détaillée (IA)** : markdown complet rendu avec titres colorés or/brun, sections numérotées avec emojis
- **Footer** : "Généré par FredWav — date — fredwav.lovable.app"

### Couleurs du PDF (alignées sur le site)

| Token | Valeur | Usage |
|-------|--------|-------|
| Or principal | `#C49A3C` | Titres, accents, valeurs stats |
| Or foncé | `#A67C2E` | Sous-titres, bordures |
| Fond crème | `#FDF8F0` | Background page |
| Fond carte | `#FEFCF7` | Cards |
| Texte principal | `#1A1A1A` | Corps |
| Texte secondaire | `#6B7280` | Labels |
| Vert | `#22C55E` | Score bon |
| Jaune | `#EAB308` | Score moyen |
| Rouge | `#EF4444` | Score faible |

### Modifications

| Fichier | Action |
|---------|--------|
| `src/lib/pdf-html-generator.ts` | **Réécrire** — Nouveau design crème/or, ajouter sections best times, regularity, persona |
| `src/lib/pdf-data-mapper.ts` | **Modifier** — Ajouter champs `best_times`, `regularity_breakdown`, `persona`, `publication_frequency`, `consistency_score`, `recommendations` |
| `src/pages/AnalyseExpressResult.tsx` | **Modifier** — Passer les données supplémentaires (persona, pubPattern) au mapper/générateur |

### Détail technique

**1. `pdf-data-mapper.ts`** — Ajouter les champs manquants à `PDFDataFormat` :

```typescript
export interface PDFDataFormat {
  // ... champs existants ...
  best_times?: Array<{ day: number; hour: number; avg_views: number }>;
  regularity_breakdown?: Record<string, { score: number; details: string }>;
  consistency_score?: number;
  publication_frequency?: { daily_avg?: number; weekly_pattern?: string };
  recommendations?: string[];
  persona?: {
    niche_principale?: string;
    forces?: string[];
    faiblesses?: string[];
  };
}
```

Et dans `mapAccountDataForPDF`, extraire ces données depuis `accountData`.

**2. `pdf-html-generator.ts`** — Réécriture complète du HTML/CSS :

- **Header** : bande crème avec "FredWav" à gauche, "Analyse TikTok Express" + date + @username à droite
- **Profil** : avatar avec bordure dorée, display_name, bio, badges sociaux
- **Métriques Clés** : grille 4 colonnes, bordure fine `#E5E1D8`, valeur en `#C49A3C` bold
- **Moyennes / Médianes** : 2 sous-grilles 5 colonnes
- **Top Hashtags** : badges inline avec fond dégradé or
- **Meilleurs Créneaux** : barres horizontales dorées proportionnelles, #1-#5
- **Régularité Détaillée** : barres colorées (vert/jaune/rouge) avec label + score + details
- **Persona** : card avec niche, forces, faiblesses
- **Analyse Détaillée (IA)** : markdown rendu avec `h2` en or, `h3` en brun, listes propres
- **Footer** : "Généré par FredWav — date — fredwav.lovable.app"

**3. `AnalyseExpressResult.tsx`** — Passer persona et pubPattern au PDF :

```typescript
const handleDownloadPdf = async () => {
  if (!username || !data?.account) return;
  setPdfLoading(true);
  try {
    const pdfData = mapAccountDataForPDF(data.account, data.persona, pubPattern);
    const htmlContent = generateCompletePDFHTML(pdfData, data.account.ai_insights || "", data.account.recent_videos || []);
    // ... rest unchanged
  }
};
```

### Structure du PDF final (4 pages environ)

```text
Page 1:
┌─────────────────────────────────────┐
│ FredWav          25 février 2026    │
│ Analyse TikTok Express   @username │
├─────────────────────────────────────┤
│         [Avatar]                    │
│     Display Name                    │
│     @username                       │
│     Bio text here...                │
│     [badges sociaux]                │
├─────────────────────────────────────┤
│ 📊 Métriques Clés                  │
│ ┌────┐ ┌────┐ ┌────┐ ┌────┐       │
│ │Abon│ │Like│ │Vidé│ │Enga│       │
│ └────┘ └────┘ └────┘ └────┘       │
│ Moyennes par vidéo                  │
│ ┌───┐ ┌───┐ ┌───┐ ┌───┐ ┌───┐    │
│ │Vue│ │Lik│ │Com│ │Sav│ │Par│    │
│ └───┘ └───┘ └───┘ └───┘ └───┘    │
│ Médianes par vidéo                  │
│ ┌───┐ ┌───┐ ┌───┐ ┌───┐ ┌───┐    │
│ └───┘ └───┘ └───┘ └───┘ └───┘    │
├─────────────────────────────────────┤
│ # Top Hashtags                      │
│ [badge] [badge] [badge] ...         │
└─────────────────────────────────────┘

Page 2:
┌─────────────────────────────────────┐
│ 🕐 Meilleurs Créneaux              │
│ #1 Vendredi à 09h00    ████ 60.4K  │
│ #2 Dimanche à 10h00    ███  58.1K  │
│ #3 Dimanche à 15h00    ██   33.3K  │
│ Recommandations: ...                │
├─────────────────────────────────────┤
│ 📊 Régularité Détaillée            │
│ no_gaps_72h     ████████    30/100  │
│ weekly_volume   █████       30/100  │
│ day_consistency █          10/100   │
├─────────────────────────────────────┤
│ 🎯 Persona Identifié               │
│ Niche: Développement personnel      │
│ Points d'amélioration: ...          │
└─────────────────────────────────────┘

Pages 3-4:
┌─────────────────────────────────────┐
│ 📝 Analyse Détaillée (IA)          │
│ Rendered markdown content...        │
│ Sections numérotées, listes, etc.   │
├─────────────────────────────────────┤
│ Généré par FredWav — 25/02/2026    │
│ fredwav.lovable.app                 │
└─────────────────────────────────────┘
```

