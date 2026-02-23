

## Vérifier le paiement existant avant de rediriger vers Stripe

### Objectif

Quand l'utilisateur clique sur "Réserver mon One Shot (179€)", vérifier d'abord si un `oneshot_session_id` existe dans le `localStorage`. Si oui, cela signifie qu'il a déjà payé mais n'a pas terminé le questionnaire : on le redirige directement vers `/one-shot/success` au lieu de lui faire repayer.

### Modification

**Fichier** : `src/pages/OneShot.tsx`

Modifier la fonction `handleCheckout` (lignes 89-103) :

```text
const handleCheckout = async () => {
  // Vérifier si un paiement existe déjà
  const existingSessionId = localStorage.getItem("oneshot_session_id");
  if (existingSessionId) {
    // Rediriger vers la page success pour terminer le formulaire
    window.location.href = `/one-shot/success`;
    return;
  }

  // Sinon, créer une nouvelle session Stripe
  setLoading(true);
  try {
    const { data, error } = await supabase.functions.invoke("create-oneshot-checkout");
    if (error) throw error;
    if (data?.url) {
      window.location.href = data.url;
    }
  } catch (err: any) {
    toast.error("Erreur lors de la création du paiement. Réessayez.");
    console.error(err);
  } finally {
    setLoading(false);
  }
};
```

Ajouter aussi l'import de `useNavigate` depuis `react-router-dom` pour utiliser la navigation interne au lieu de `window.location.href` pour la redirection locale.

### Résultat

- Utilisateur qui a déjà payé mais fermé l'onglet : clic sur le bouton -> redirigé vers `/one-shot/success` pour remplir le formulaire
- Utilisateur qui n'a jamais payé : clic sur le bouton -> redirection Stripe normale
- Une fois le formulaire soumis, le `localStorage` est nettoyé et le bouton redirige à nouveau vers Stripe

