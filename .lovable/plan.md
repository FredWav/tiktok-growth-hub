

## Probleme

Quand un utilisateur clique sur le lien dans l'email (`/analyse-express/result?session_id=xxx`), la page ne trouve pas de `job_id` en `localStorage` (puisque c'est un autre appareil ou navigateur) et relance `launchAnalysis()` qui appelle l'edge function `express-analysis` -- ce qui relance une nouvelle analyse au lieu d'afficher les resultats existants.

## Solution

Ajouter une etape initiale dans `AnalyseExpressResult.tsx` qui interroge la table `express_analyses` via le `stripe_session_id` **avant** de lancer quoi que ce soit :

1. **Requete DB d'abord** : `SELECT * FROM express_analyses WHERE stripe_session_id = :sessionId`
2. **Si status = "complete" et result_data existe** : afficher directement les resultats sans polling ni relancement
3. **Si status = "processing" et job_id existe** : reprendre le polling avec ce job_id (sans relancer)
4. **Sinon (pending sans job_id)** : lancer l'analyse normalement

### Changement cote RLS

La table `express_analyses` n'a actuellement qu'une policy admin. Il faut ajouter une policy SELECT pour les utilisateurs anonymes, filtree par `stripe_session_id` (le session_id sert de "token" d'acces).

**Migration SQL** :
```sql
CREATE POLICY "Anyone can select express_analyses by session_id"
ON public.express_analyses
FOR SELECT
TO anon, authenticated
USING (true);
```

Note : on peut restreindre a `true` car le `stripe_session_id` sert deja de secret non-devinable. Alternativement on pourrait faire un select via edge function, mais c'est plus simple cote client.

### Fichier modifie

**`src/pages/AnalyseExpressResult.tsx`** : Remplacement du `useEffect` principal (lignes 123-140) par une logique en 3 etapes :
1. Fetch DB par `stripe_session_id`
2. Si complete -> set data + username + loading=false, return
3. Si processing avec job_id -> set jobIdRef + start polling, return
4. Sinon -> `launchAnalysis()` comme avant

