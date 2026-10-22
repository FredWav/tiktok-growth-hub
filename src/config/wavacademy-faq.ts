import { ACADEMY_CALL_FORMAT } from "./academy-booking";
import { ACADEMY_LIVE_SLOT, ACADEMY_SUPPORT_DAYS, formatEuros, OFFERS } from "./offers";

const academy = OFFERS.academy;

export const WAVACADEMY_FAQ = [
  { question: "Pourquoi un appel avant l'inscription ?", answer: `L'échange dure ${ACADEMY_CALL_FORMAT.toLowerCase()}. On vérifie que l'Academy correspond à ton projet, que le format collectif te convient et on précise ton démarrage. Il porte sur l'inscription ; il ne comprend pas d'audit de tes contenus.` },
  { question: "Suis-je engagé en réservant ?", answer: "Non. Réserver l'appel ne t'engage à aucun achat. Tu décides après l'échange si tu souhaites rejoindre l'Academy." },
  { question: "Que se passe-t-il après l'appel ?", answer: "Si tu souhaites t'inscrire, Fred te transmet un lien personnel avec le prix et la date de démarrage. Tu acceptes les modalités puis tu paies en ligne ou par virement. Après confirmation du règlement, ton lien d'accès Discord est envoyé à la date convenue." },
  { question: "Je débute : faut-il déjà une audience ?", answer: "Aucun minimum d'abonnés ou de vidéos n'est imposé. Un projet concret et la volonté de mettre en pratique suffisent pour commencer à travailler dans le collectif." },
  { question: "Quelle différence avec les tutoriels gratuits ?", answer: "Un tutoriel peut t'apprendre une technique. Ici, tu peux aussi partager tes contenus, poser tes questions et confronter tes essais aux retours de Fred et du collectif. Les cours servent de support à ce travail dans la durée." },
  { question: "Combien de temps dois-je prévoir ?", answer: "Tu avances à ton rythme et tu choisis les lives utiles. Prévois du temps pour créer, publier et tester les ajustements retenus : l'Academy ne fait pas ce travail à ta place. Si tu n'as pas ce temps en ce moment, mieux vaut attendre." },
  { question: "Et si je ne peux pas assister aux lives ?", answer: `Les lives ont lieu ${ACADEMY_LIVE_SLOT}, heure de Paris. Chaque live a son résumé ; les lives de cours ont un replay. Tu peux aussi poser tes questions sur Discord. Tous les lives ne sont donc pas disponibles en replay.` },
  { question: "Comment obtenir de l'aide ?", answer: `Pose tes questions sur le Discord collectif : suivi ${ACADEMY_SUPPORT_DAYS}. Le week-end est off. Si tu rencontres un problème d'accès, écris à contact@fredwav.com.` },
  { question: "« À vie », ça veut dire quoi exactement ?", answer: "Un seul paiement donne accès à la communauté, aux lives, aux cours et aux ressources, mises à jour comprises, tant que la Wav Academy existe. Il n'y a ni abonnement ni renouvellement. Les CGV garantissent pendant cinq ans l'accès aux contenus numériques compris à la commande et précisent les dispositions en cas d'arrêt de l'Academy." },
  { question: "Y a-t-il de l'accompagnement individuel ?", answer: "Non. Ta stratégie est personnalisée, mais elle se travaille dans le collectif. L'accès à vie ne signifie pas un coaching individuel illimité." },
  { question: "Les crédits WavStats sont-ils inclus ?", answer: "Non. WavStats est un service distinct. Les autres services vendus séparément, dont les analyses, les Packs de hooks, le One Shot et le Wav Premium, ne sont pas inclus." },
  { question: "Quel est le prix de lancement ?", answer: `${formatEuros(academy.price)} TTC en un paiement jusqu'au ${academy.launch?.untilLabel}, puis ${formatEuros(academy.launch!.nextPrice)}. Les membres déjà inscrits ne paient rien de plus pour leur accès à l'Academy.` },
  { question: "Puis-je me rétracter ?", answer: "Les CGV prévoient un délai de 14 jours pour les particuliers. En cas de démarrage anticipé expressément demandé, le droit de rétractation sur le contenu numérique est perdu dès l'accès après reconnaissance expresse ; pour le service, le montant dû est proportionné à ce qui a déjà été fourni. Sans demande de démarrage anticipé, la date est fixée après le délai légal. Consulte les articles 8, 9.3 et 12 des CGV pour les conditions complètes." },
];
