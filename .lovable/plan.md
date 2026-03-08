

## Constat

**DiagnosticResult.tsx** : toutes les modifications demandees sont deja en place (CALENDLY_ONE_SHOT, titres, liens `<a>`, tracking PostHog). Aucun changement necessaire.

**Home.tsx** : TrustedBy, homeTestimonials, titre "Ils etaient la ou tu es maintenant" sont deja implementes. La seule difference avec la demande est l'ajout de l'icone `Quote` dans chaque carte de temoignage (comme sur Preuves.tsx).

## Modifications

### Home.tsx

1. **Import** : Ajouter `Quote` dans la ligne d'import Lucide (ligne 2)

2. **Cartes temoignages** (lignes 274-285) : Ajouter `<Quote className="h-8 w-8 text-primary/30 mb-4" />` au debut de chaque CardContent, avant le texte du temoignage -- alignant le design avec celui de la page Preuves.

Aucun autre fichier a modifier.

