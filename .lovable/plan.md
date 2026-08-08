# Migration qualification multiréseaux - Wav Premium

## Vérifications déjà faites (avant application)

- La table `public.wav_premium_applications` existe et contient **108 candidatures** (58 avec les réponses historiques `motivation` / `accompagnement_type`).
- Aucune des 9 colonnes prévues n'existe encore : **aucun conflit**. Les colonnes actuelles (`tiktok_username`, `profil`, `goals`, `budget`, attribution marketing, `current_level`, `blockers`, `motivation`, `accompagnement_*`) sont toutes conservées.
- Policies d'insertion actuelles sur la table : **deux** policies pour anon/authenticated :
  1. `Anyone can insert valid applications` (contrôles sur nom/email/profil/goals/motivation/accompagnement_type)
  2. `Anyone can insert applications` avec contrôle **`true`** (tout accepter)
- Comme les policies INSERT se cumulent en OU, la seconde annule tout contrôle de la première. C'est le point à traiter (voir ci-dessous).
- La migration n'écrit dans aucune ligne : uniquement des `ADD COLUMN` nullable, des `CHECK` tolérants au NULL, et un remplacement de policy. **Zéro ligne historique modifiée.**

## Étape 1 - Migration base de données

Application du fichier `supabase/migrations/20260808160000_expand_wav_premium_qualification.sql` tel quel, comme source de vérité :

- Colonnes ajoutées (toutes nullable) : `instagram_username`, `youtube_url`, `facebook_url`, `other_social_url`, `objectives text[]`, `success_30_days`, `why_now`, `help_topics text[]`, `availability`.
- Contraintes CHECK ajoutées : valeur non vide et longueur max si renseignée (100 / 500 / 3000 / 300 selon le champ), et 1 à 9 entrées pour `objectives` et `help_topics`.
- Policy `Anyone can insert valid applications` remplacée : exige prénom, nom, email valide, profil, blocage principal (`goals`), résultat à 30 jours, raison du timing, disponibilité, budget parmi les 5 codes Premium (`total_no_budget`, `total_15_a_100`, `total_100_a_300`, `total_300_a_900`, `total_900_plus`), au moins un objectif, au moins une aide, et au moins un réseau parmi les cinq.
- Paliers budgétaires inchangés. Aucune autre table, fonction ou CGV touchée.

### Point à trancher : la policy permissive résiduelle

La policy `Anyone can insert applications` (`WITH CHECK true`) reste en place après cette migration et rend la nouvelle policy stricte inopérante côté base : n'importe quelle insertion incomplète passerait quand même. Proposition : ajouter au même migration un `DROP POLICY IF EXISTS "Anyone can insert applications"` pour que les contrôles s'appliquent réellement. Rien d'autre n'utilise cette policy ; les lectures et l'accès admin ne changent pas.

## Étape 2 - Vérifications après application (sans données personnelles)

- Présence et type des 9 nouvelles colonnes, et nullabilité confirmée.
- Comptage des anciennes lignes toujours lisibles (108) et confirmation que les nouvelles colonnes y sont NULL.
- Liste des policies pour confirmer que la nouvelle policy est active et connaître l'état de la policy permissive.
- Test d'insertion incomplète : doit être refusé.
- Test d'insertion valide avec un seul réseau : doit être accepté.
- Les deux tests sont exécutés dans une transaction annulée (`ROLLBACK`), donc **aucune candidature de test ne reste en base**.

Le compte rendu final listera : migration appliquée, colonnes ajoutées, contraintes créées, policy remplacée, tests réalisés, écarts constatés.

## Suite (bloquée jusqu'à ton accord explicite)

2. Déploiement de `supabase/functions/notify-application/index.ts`
3. Déploiement du frontend

Aucun de ces deux points ne sera lancé dans cette étape.
