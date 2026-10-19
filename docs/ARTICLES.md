# Publier un article sur fredwav.com

Plan SEO de Thomas André-Lubin (octobre 2026) : environ 45 articles en 16 semaines,
répartis en 9 thèmes. Chaque article répond à une question tapée dans Google, mène
vers le guide de son thème, puis vers l'outil qui règle le problème (Analyse Express
ou Analyse vidéo).

## Le circuit

1. **Thomas rédige** un fichier Markdown dans `content/ressources/`, en partant de
   `content/ressources/_modele.md`. Le nom du fichier devient l'adresse :
   `shadowban-tiktok.md` → `fredwav.com/ressources/shadowban-tiktok`.
2. **Il propose l'article** sur GitHub (pull request vers `main`), avec `statut: brouillon`
   tant que Fred n'a pas relu.
3. **Fred relit**, ajoute ses exemples et ses captures, passe `statut: publie`, puis accepte
   la pull request.
4. **Le site se republie** : le build vérifie l'article, crée sa page, l'ajoute au guide du
   thème, à la page Ressources, au sitemap et à llms.txt.

Pour relire en local avant publication : `npm run dev`, puis ouvrir l'adresse de l'article.
Les brouillons sont visibles en local uniquement, jamais en ligne.

## Ce que le build refuse (avec un message qui dit quoi corriger)

- un champ obligatoire manquant (`titre`, `description` de 50 à 170 caractères,
  `introduction`, `theme`, `date`, `note_de_fred`) ;
- un thème inconnu, une date qui n'est pas au format AAAA-MM-JJ ;
- une adresse déjà utilisée (autre article, guide de thème, page du site) ;
- un lien `liens:` vers un article qui n'existe pas ;
- du HTML, un titre « # » dans le texte, une image sans texte alternatif ;
- un article publié de moins de 150 mots.

## Ce que la page fait toute seule

- fil d'Ariane Accueil › Ressources › Thème › Article, balises title et description,
  données structurées Article, date de mise à jour dans le sitemap ;
- encadré « Retour d'expérience de Fred », FAQ, mention « Rédigé avec l'aide de l'IA,
  relu et complété par Fred » (sauf `redige_avec_ia: false`) ;
- appels à l'outil là où `[[analyse-express]]` ou `[[analyse-video]]` est écrit, et en
  fin de page selon le thème ;
- en fin d'article : le guide du thème et deux autres ressources.

## Les 9 thèmes et leur guide

Une page guide `/ressources/<thème>` est publiée dès que le thème a une ressource.

| Thème | Adresse du guide | Outil proposé |
|---|---|---|
| Problèmes de vues | `probleme-vues-tiktok` | Analyse Express |
| Analyser ses stats | `analyser-stats-tiktok` | Analyse Express |
| Créer des vidéos | `creer-videos-tiktok` | Analyse vidéo |
| L'algorithme | `algorithme-tiktok` | Analyse Express |
| Le profil | `profil-tiktok` | Analyse Express |
| Percer et grandir | `grandir-sur-tiktok` | Analyse Express |
| La monétisation | `monetisation-tiktok` | Analyse Express |
| TikTok pour les pros | `tiktok-pour-les-pros` | Analyse Express |
| Outils et ressources | `outils-tiktok` | Analyse Express |

Les trois guides historiques gardent leur adresse et sont rattachés à un thème :
`vues-tiktok` (Problèmes de vues), `statistiques-tiktok` (Analyser ses stats),
`retention-tiktok` (Créer des vidéos).

## Calendrier (à compléter avec le tableau des mots-clés de Thomas)

Sujets cités dans le plan ; la liste complète des 45 articles est dans le tableau des
mots-clés de Thomas. Rythme visé : 3 articles par semaine. Aucune publication en masse.

| Mois | Thème principal | Articles prévus | Sujets déjà identifiés |
|---|---|---|---|
| 1 | Problèmes de vues | 11 | Shadowban : le détecter et en sortir · Pourquoi mes vues ont baissé · Passer sur le Pour toi · Le hook TikTok · Calculateur de taux d'engagement · Statistiques TikTok 2026 · 5 autres |
| 2 | Créer et diffuser | 11 | Comment faire une vidéo TikTok · Idées de contenu · Sous-titres et montage · Comment marche l'algorithme · Meilleure heure pour poster · Hashtags · 5 autres |
| 3 | Profil et croissance | 13 | Optimiser son profil · Bio et pseudo · Comment percer sur TikTok · Faire un live · Vues mais pas d'abonnés · Trouver sa niche · 7 autres |
| 4 | Gagner de l'argent | 10 | Monétisation TikTok · Combien rapporte TikTok · Devenir créateur UGC · TikTok Shop · TikTok pour les entreprises · TikTok Creative Center · 4 autres |

Avant le mois 1 (plan SEO) : remettre à jour les 3 articles existants. Le calculateur de
taux d'engagement est une page interactive, pas un article Markdown : à développer à part.
