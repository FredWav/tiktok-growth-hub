

## Probleme

L'erreur `UnexpectedEof: peer closed connection without sending TLS close_notify` se produit lors de la connexion SMTP au serveur OVH `ssl0.ovh.net` sur le port 465 (TLS implicite). C'est un probleme de compatibilite connu entre denomailer et le runtime Deno des Edge Functions pour les connexions TLS implicites.

## Solution

Passer du port 465 (TLS implicite) au port 587 (STARTTLS) qui est mieux supporte par denomailer dans l'environnement Edge Functions. Avec STARTTLS, la connexion demarre en clair puis est mise a niveau vers TLS, ce qui evite le probleme de negociation TLS initiale.

## Modification

**Fichier** : `supabase/functions/send-oneshot-form/index.ts`

Remplacer la configuration du SMTPClient (lignes 80-90) :

```text
// Avant (TLS implicite - port 465)
const client = new SMTPClient({
  connection: {
    hostname: "ssl0.ovh.net",
    port: 465,
    tls: true,
    auth: { ... },
  },
});

// Apres (STARTTLS - port 587)
const client = new SMTPClient({
  connection: {
    hostname: "ssl0.ovh.net",
    port: 587,
    tls: false,
    auth: { ... },
  },
});
```

Le parametre `tls: false` indique a denomailer de ne pas ouvrir une connexion TLS directe, mais d'utiliser la commande STARTTLS pour passer en mode securise apres la connexion initiale. C'est le comportement standard du port 587.

## Etapes

1. Modifier la configuration SMTP dans `send-oneshot-form/index.ts` (port 465 -> 587, tls: true -> false)
2. Redeployer la fonction
