

## Probleme

La page `/one-shot/success` est accessible directement sans aucune verification de paiement. N'importe qui peut acceder a l'URL, remplir le formulaire et reserver un creneau sans avoir paye.

## Solution

Utiliser le parametre `session_id` de Stripe Checkout pour verifier cote serveur que le paiement a bien ete effectue avant d'autoriser l'acces au formulaire.

## Etapes

### 1. Modifier l'URL de succes dans la fonction de checkout

Dans `supabase/functions/create-oneshot-checkout/index.ts`, ajouter `{CHECKOUT_SESSION_ID}` a l'URL de succes pour que Stripe transmette l'identifiant de session :

```
success_url: `${origin}/one-shot/success?session_id={CHECKOUT_SESSION_ID}`
```

### 2. Creer une fonction backend de verification

Nouvelle fonction `supabase/functions/verify-oneshot-payment/index.ts` qui :
- Recoit le `session_id` en parametre
- Interroge l'API Stripe pour recuperer la session de checkout
- Verifie que `payment_status === "paid"`
- Retourne `{ verified: true }` ou une erreur

### 3. Modifier la page de succes

Dans `src/pages/OneShotSuccess.tsx` :
- Au chargement, lire le parametre `session_id` depuis l'URL
- Si absent, afficher un message d'erreur et rediriger vers `/one-shot`
- Si present, appeler la fonction `verify-oneshot-payment` pour verifier le paiement
- Afficher un loader pendant la verification
- Si le paiement n'est pas valide, afficher une erreur et rediriger
- Si valide, afficher le formulaire normalement

### 4. Securiser l'envoi du formulaire

Dans `supabase/functions/send-oneshot-form/index.ts` :
- Ajouter le `session_id` comme champ obligatoire dans le body
- Verifier le paiement Stripe avant d'envoyer l'email
- Cela empeche aussi l'appel direct a la fonction sans paiement

---

### Details techniques

**Fonction `verify-oneshot-payment/index.ts`** :
```typescript
// Recoit { session_id }
// Appelle stripe.checkout.sessions.retrieve(session_id)
// Verifie session.payment_status === "paid"
// Retourne { verified: true, customer_email }
```

**Page `OneShotSuccess.tsx`** :
- Utilise `useSearchParams()` pour lire `session_id`
- `useEffect` au montage pour appeler la verification
- 3 etats : `loading`, `verified`, `error`

