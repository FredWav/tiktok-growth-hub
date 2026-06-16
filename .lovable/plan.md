## Diagnostic

Ton compte Gabizoc a bien `role = 'admin'` en base et tu te connectes correctement (les logs auth le confirment). Le symptôme "redirigé vers `/app`" vient donc d'une **race condition côté front** dans `AuthContext` + `ProtectedRoute` :

- `AuthContext` initialise `isLoading = true` et ne le repasse à `false` que dans la branche `getSession().then(...)`.
- Mais le `role` peut être réinitialisé/non encore résolu à plusieurs moments (event `SIGNED_IN` après login, `TOKEN_REFRESHED` après reload, navigation directe vers `/admin/marketing`) — pendant ces fenêtres, `user` est défini, `isLoading` est `false`, mais `role` est encore `null`.
- `ProtectedRoute` ne distingue pas "role en cours de chargement" de "role différent" → il déclenche `Navigate to="/app"`. Une fois sur `/app`, plus aucun lien ne ramène vers `/admin`, d'où le sentiment de "plus du tout accès".

## Correctif (2 fichiers, pas de migration)

### 1. `src/contexts/AuthContext.tsx`

- Ajouter un état `isRoleLoading` (true tant qu'on a un `user` mais pas encore résolu son `role`).
- Le mettre à `true` à chaque event `onAuthStateChange` où une session existe, et à `false` une fois `fetchUserRole` résolu.
- Exposer `isRoleLoading` dans le contexte.
- Garder `isLoading` pour le boot initial uniquement.

### 2. `src/components/auth/ProtectedRoute.tsx`

- Lire `isRoleLoading` en plus de `isLoading`.
- Tant que `user` existe et que `isRoleLoading` est `true` → afficher le loader (ne pas rediriger).
- Ne vérifier `role !== requiredRole` qu'après que `role` soit résolu.

Cette double garde supprime la fenêtre pendant laquelle un admin authentifié est rejeté vers `/app`.

## Vérification

- Reload direct sur `/admin/marketing` en étant connecté → la page admin s'affiche.
- Login depuis `/auth` avec le compte admin → redirection vers `/admin/marketing`.
- Login avec un compte client → toujours redirigé vers `/app` (comportement conservé).

Aucun changement sur les policies RLS, la table `user_roles`, ni les autres routes.