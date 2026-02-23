

# Refonte site FredWav - Conversion optimisee

## Vue d'ensemble

Refonte complete du site pour transformer le trafic TikTok en conversions. Action principale : pousser le One Shot (179EUR). Structure claire du tunnel : One Shot > 45 jours > VIP.

---

## A) Homepage - Landing page de conversion

Refonte complete de `src/pages/Home.tsx` avec la structure suivante :

**Above the fold :**
- Headline orientee resultat : "Transforme ton TikTok en machine a clients"
- Sous-titre : "J'aide les createurs et entrepreneurs a passer de 'je poste au hasard' a 'chaque video a un objectif'. Diagnostic, strategie, plan d'action."
- CTA principal unique : "Reserver mon One Shot (179EUR)"
- CTA secondaire discret (lien texte) : "Voir si je suis eligible au 45 jours"
- Proof strip : 6 badges rapides (ex: "300+ clients accompagnes", "Temoignages video", "Methode data-driven", "10M+ vues generees", "95% de satisfaction", "Sans bullshit")

**Section "A qui ca s'adresse" :**
- 3 profils en cartes courtes :
  1. "Tu postes, ca ne decolle pas"
  2. "Tu as des vues mais pas de clients"
  3. "Tu veux structurer ton contenu pour vendre"

**Section "Ce que tu obtiens en One Shot" :**
- 4-6 bullet points (diagnostic, plan d'action PDF, strategie 30 jours, replay, analyse de niche, optimisation hooks)
- Encart "Ce que ce n'est PAS" : "Pas un coaching motivation. Pas quelqu'un qui poste a ta place."

**Section "Preuves" :**
- 3 blocs max : 1-3 thumbnails YouTube cliquables + extrait court temoignage ecrit
- Bouton "Voir toutes les preuves" vers /preuves

**Section "Comment choisir" :**
- 3 cartes : One Shot (recommande par defaut), 45 jours ("transformation guidee"), VIP ("progresser dans la duree")
- CTA respectifs : "Reserver mon One Shot (179EUR)", "Candidater au 45 jours", "Rejoindre le VIP"

**FAQ (6 questions max) :**
- Inclure la formulation : "Le One Shot peut suffire si tu executes seul. Si je pense que tu as le profil, je te dirai si le 45 jours est pertinent. Aucun forcing."

---

## B) Page dedicee /45-jours

**Nouveau fichier** `src/pages/QuarantecinqJours.tsx` + route `/45-jours` dans App.tsx.

Structure landing :
- Promesse de transformation
- Pour qui / pas pour qui
- Methode (sans modules detailles)
- Ce que tu auras a la fin (livrables)
- 2-3 preuves courtes
- Process candidature (3 etapes : appel, validation, demarrage)
- FAQ courte
- CTA : "Candidater au 45 jours"
- Mention Klarna/PayPal

Mise a jour route `/offres/45-jours` pour rediriger vers `/45-jours`.

---

## C) Page Offres amelioree

Modification de `src/pages/Offres.tsx` :

- Ajouter en haut un selecteur "Je veux :" avec 3 boutons :
  - "Un diagnostic clair" > scroll vers #one-shot
  - "Une transformation encadree" > scroll vers #45-jours
  - "Un cadre continu" > scroll vers #vip
- Hierarchiser : One Shot en premier, 45 jours en second, VIP en troisieme
- Uniformiser les CTA : "Reserver mon One Shot (179EUR)", "Candidater au 45 jours", "Rejoindre le VIP"

---

## D) VIP checkout sans friction login

Modification de `src/pages/VipCheckout.tsx` et `supabase/functions/create-vip-checkout/index.ts` :

- Retirer l'obligation de session auth avant paiement
- Ajouter un champ email sur la page VIP avant le bouton "Payer"
- Passer l'email au edge function
- Le edge function cree la session Stripe avec `customer_email` sans exiger un token auth
- Uniformiser CTA : "Rejoindre le VIP"

---

## E) Pages legales

**2 nouveaux fichiers :**
- `src/pages/MentionsLegales.tsx` : placeholder propre avec structure (editeur, hebergeur, propriete intellectuelle, donnees personnelles, cookies). Mention "Derniere mise a jour : fevrier 2026".
- `src/pages/CGV.tsx` : placeholder propre (objet, offres, tarifs, paiement, droit de retractation, responsabilite). Mention "Derniere mise a jour : fevrier 2026".

**Routes dans App.tsx** : `/mentions-legales` et `/cgv`.

Le footer pointe deja vers ces routes, elles cesseront d'etre des 404.

---

## F) Page Preuves orientee conversion

Modification de `src/pages/Preuves.tsx` :

- Ajouter intro 2 lignes orientee resultat en haut
- Ajouter CTA principal "Reserver mon One Shot (179EUR)" apres les videos
- Ajouter CTA secondaire "Candidater au 45 jours"
- Ajouter mini section "Quel accompagnement choisir" en bas (3 cartes courtes avec CTA)

---

## G) Harmonisation CTA + microcopy

Modifications sur toutes les pages :

- Remplacer tous les tirets longs par des tirets simples
- Uniformiser :
  - "Reserver mon One Shot (179EUR)" partout (pas "Reserver maintenant", pas "En savoir plus")
  - "Candidater au 45 jours" (pas "Reserver un appel")
  - "Rejoindre le VIP" (pas "Souscrire", pas "Decouvrir")
- Pages concernees : Home, Offres, OneShot, Preuves, APropos, Contact, Header, Footer, VipCheckout

---

## H) Tracking CTA (preparation)

**Nouveau fichier** `src/lib/tracking.ts` :

```typescript
export function trackEvent(event: string, data?: Record<string, string>) {
  // Placeholder - brancher analytics ici (GA, Plausible, etc.)
  if (typeof window !== "undefined") {
    console.debug("[track]", event, data);
  }
}
```

Appeler `trackEvent("cta_one_shot_click")`, `trackEvent("cta_45j_click")`, `trackEvent("cta_vip_click")` sur les clics CTA principaux.

---

## Recapitulatif des fichiers

| Action | Fichier |
|--------|---------|
| Refonte | `src/pages/Home.tsx` |
| Creation | `src/pages/QuarantecinqJours.tsx` |
| Modification | `src/pages/Offres.tsx` |
| Modification | `src/pages/VipCheckout.tsx` |
| Modification | `supabase/functions/create-vip-checkout/index.ts` |
| Creation | `src/pages/MentionsLegales.tsx` |
| Creation | `src/pages/CGV.tsx` |
| Modification | `src/pages/Preuves.tsx` |
| Modification | `src/pages/APropos.tsx` |
| Modification | `src/pages/Contact.tsx` |
| Modification | `src/pages/OneShot.tsx` |
| Modification | `src/components/layout/Header.tsx` |
| Modification | `src/App.tsx` |
| Creation | `src/lib/tracking.ts` |

---

## Ordre d'implementation

Etant donne l'ampleur, je recommande de decouper en 3-4 messages :

1. **Message 1** : Homepage + tracking utility + pages legales + routes App.tsx
2. **Message 2** : Page /45-jours + page Offres amelioree + harmonisation Header
3. **Message 3** : VIP checkout sans friction + edge function
4. **Message 4** : Preuves + APropos + Contact + OneShot (harmonisation CTA)

