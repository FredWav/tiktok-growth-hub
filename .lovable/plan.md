

## Plan : Afficher les soumissions One Shot dans le panel admin

### Changements

1. **Nouveau fichier `src/pages/admin/Bookings.tsx`** — Réécrire la page placeholder pour qu'elle query `oneshot_submissions` via Supabase et affiche un tableau avec colonnes : Date, Nom, Email, WhatsApp, TikTok, Objectifs. Click sur une ligne ouvre un Dialog avec le détail (même pattern que `Applications.tsx`). Compteurs en haut (total, cette semaine).

2. **Aucun changement DB** — La table `oneshot_submissions` existe déjà avec la bonne RLS policy admin.

3. **Aucun nouveau hook nécessaire** — Query directe avec `useQuery` + `supabase.from('oneshot_submissions')` dans le composant (ou un petit hook dédié si préféré).

### Pattern suivi
Même structure que `Applications.tsx` : AdminLayout > stats cards > Table > Dialog détail.

