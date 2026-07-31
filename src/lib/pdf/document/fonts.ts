import { Font } from "@react-pdf/renderer";

import InterBold from "@/assets/fonts/Inter-Bold.ttf";
import InterMedium from "@/assets/fonts/Inter-Medium.ttf";
import InterRegular from "@/assets/fonts/Inter-Regular.ttf";
import PlayfairBold from "@/assets/fonts/PlayfairDisplay-Bold.ttf";

let registered = false;

/**
 * Enregistre les polices du rapport. Idempotent : `Font.register` est un état
 * global du module react-pdf, et le HMR rejouerait l'enregistrement à chaque
 * rechargement.
 *
 * Les TTF sont **statiques** (pas de fonte variable) : fontkit ne rend que
 * l'instance par défaut d'une fonte variable, ce qui écraserait les graisses.
 */
export function registerFonts(): void {
  if (registered) return;
  registered = true;

  Font.register({
    family: "Inter",
    fonts: [
      { src: InterRegular, fontWeight: 400 },
      { src: InterMedium, fontWeight: 500 },
      { src: InterBold, fontWeight: 700 },
    ],
  });

  Font.register({
    family: "Playfair Display",
    fonts: [{ src: PlayfairBold, fontWeight: 700 }],
  });

  // La césure automatique de react-pdf coupe les mots français n'importe où.
  Font.registerHyphenationCallback((word) => [word]);

  // Les textes de l'IA contiennent des emojis (ex. « ✅ Aucun shadowban »).
  // Sans source déclarée, ils sortiraient en glyphes vides.
  Font.registerEmojiSource({
    format: "png",
    url: "https://cdn.jsdelivr.net/gh/jdecked/twemoji@15.1.0/assets/72x72/",
    withVariationSelectors: true,
  });
}
