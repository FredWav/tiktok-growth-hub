

## Plan : Refonte visuelle du ScreenshotWall

### Modifications — `src/components/ScreenshotWall.tsx`

1. **Supprimer** `distributeToColumns` (lignes 13-17) et le `useMemo` (lignes 33-36)
2. **Remplacer le grid** (lignes 40-70) par :
   - Conteneur : `columns-2 md:columns-3 gap-5 max-w-4xl mx-auto`
   - Chaque carte : `break-inside-avoid mb-5` + `rounded-xl shadow-md` + overlay plus opaque (`from-black/70`)
3. **Itérer directement** sur `screenshots` au lieu de `columns`

Un seul fichier modifié, aucun changement fonctionnel (lightbox, filtrage par location restent identiques).

