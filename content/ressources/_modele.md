---
# Modèle d'article : copier ce fichier, le renommer (adresse de l'article, ex.
# pourquoi-mes-vues-baissent.md → fredwav.com/ressources/pourquoi-mes-vues-baissent),
# puis remplir. Les fichiers commençant par « _ » ne sont jamais publiés.
titre: Pourquoi mes vues TikTok ont baissé (et comment le vérifier)
# Facultatif : titre pour Google, si différent du titre affiché (60 caractères environ).
titre_seo: Vues TikTok en baisse : les vraies causes | Fred Wav
# 50 à 170 caractères : le texte sous le lien dans Google.
description: Une baisse de vues sur TikTok a presque toujours une cause vérifiable. Voici comment trouver la tienne avant de tout changer.
# Une à trois phrases sous le titre.
introduction: Une baisse de vues n'est pas une punition de l'algorithme. C'est un signal, et il se lit dans tes statistiques.
# Un des 9 thèmes (src/config/themes.ts) : probleme-vues-tiktok, analyser-stats-tiktok,
# creer-videos-tiktok, algorithme-tiktok, profil-tiktok, grandir-sur-tiktok,
# monetisation-tiktok, tiktok-pour-les-pros, outils-tiktok
theme: probleme-vues-tiktok
date: 2026-11-02
# Facultatif : date de la dernière mise à jour importante.
mise_a_jour: 2026-11-02
# « brouillon » (visible seulement en local) ou « publie ».
statut: brouillon
# Le retour d'expérience de Fred, affiché en encadré : un vrai cas, avec ses mots.
note_de_fred: Quand un créateur m'écrit que ses vues ont chuté, je regarde d'abord ses trois dernières vidéos avant de parler d'algorithme.
# Mettre false si l'article a été écrit sans IA.
redige_avec_ia: true
# Facultatif : adresses d'autres articles à proposer en fin de page.
liens:
  - vues-tiktok
faq:
  - question: Est-ce que c'est un shadowban ?
    reponse: Rarement. Vérifie d'abord l'état du compte dans l'application, puis compare tes dernières vidéos entre elles.
  - question: Faut-il supprimer les vidéos qui font peu de vues ?
    reponse: Non. Elles servent de point de comparaison pour comprendre ce qui a changé.
---

## Commence par vérifier l'état de ton compte

Le texte s'écrit en Markdown : des paragraphes séparés par une ligne vide, des
intertitres « ## » (jamais « # », réservé au titre), du **gras**, des listes :

- une idée par ligne ;
- des phrases courtes.

Un lien vers une autre page : [comprendre ses statistiques](/ressources/statistiques-tiktok).

Une capture (déposée dans public/ressources/) : ![Courbe de rétention d'une vidéo](/ressources/exemple.png)

Au moment où le lecteur réalise qu'il a le problème, place l'appel à l'outil,
seul sur sa ligne : `[[analyse-express]]` pour l'analyse de compte, `[[analyse-video]]`
pour l'analyse d'une vidéo.

[[analyse-express]]

## Ensuite, regarde tes trois dernières vidéos

| Vidéo | Vues | Rétention à 3 s |
| --- | --- | --- |
| A | 12 000 | 68 % |
| B | 900 | 31 % |

Le HTML n'est pas accepté : le build refuse l'article avec un message qui dit quoi corriger.
