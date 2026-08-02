import { Image, StyleSheet, Text, View } from "@react-pdf/renderer";

import { color, font, size } from "./theme";

const s = StyleSheet.create({
  header: {
    position: "absolute",
    top: 28,
    left: 48,
    right: 48,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    borderBottomWidth: 0.75,
    borderBottomColor: color.line,
    paddingBottom: 7,
  },
  headerLeft: { flexDirection: "row", alignItems: "center" },
  brand: {
    fontFamily: font.sans,
    fontWeight: 700,
    fontSize: size.chrome,
    letterSpacing: 1.1,
    color: color.ink,
  },
  headerRight: { fontFamily: font.sans, fontSize: size.chrome, color: color.muted },
  footer: {
    position: "absolute",
    bottom: 26,
    left: 48,
    right: 48,
    flexDirection: "row",
    justifyContent: "space-between",
    borderTopWidth: 0.75,
    borderTopColor: color.line,
    paddingTop: 6,
  },
  footerText: { fontFamily: font.sans, fontSize: size.chrome, color: color.muted },
  monogram: { alignItems: "center", justifyContent: "center" },
  monogramText: { fontFamily: font.display, color: color.noir },
});

/** Pastille aux initiales : l'avatar TikTok n'est pas récupérable (CDN sans CORS). */
/**
 * Pastille ronde : l'avatar quand il a pu être récupéré, les initiales sinon.
 * `avatar` doit être un data URI — une URL distante ferait échouer le rendu.
 */
export function Monogram({
  initials,
  avatar,
  boxSize = 40,
  background = color.goldBright,
  textColor = color.noir,
  borderColor,
}: {
  initials: string;
  avatar?: string;
  boxSize?: number;
  background?: string;
  textColor?: string;
  borderColor?: string;
}) {
  const shape = {
    width: boxSize,
    height: boxSize,
    borderRadius: boxSize / 2,
    ...(borderColor ? { borderWidth: 1, borderColor } : {}),
  };

  if (avatar) {
    return <Image src={avatar} style={[s.monogram, shape, { objectFit: "cover" }]} />;
  }

  return (
    <View style={[s.monogram, shape, { backgroundColor: background }]}>
      <Text style={[s.monogramText, { color: textColor, fontSize: boxSize * 0.4 }]}>{initials}</Text>
    </View>
  );
}

export function PageHeader({ username, dateLabel }: { username: string; dateLabel: string }) {
  return (
    <View style={s.header} fixed>
      <View style={s.headerLeft}>
        <Monogram initials="FW" boxSize={14} background={color.noir} textColor={color.goldBright} />
        <Text style={[s.brand, { marginLeft: 6 }]}>FRED WAV — ANALYSE EXPRESS</Text>
      </View>
      <Text style={s.headerRight}>
        @{username} · {dateLabel}
      </Text>
    </View>
  );
}

export function PageFooter() {
  return (
    <View style={s.footer} fixed>
      <Text style={s.footerText}>fredwav.com</Text>
      {/*
        La couverture ne porte ni bandeau ni pied : la numérotation visible
        décale donc d'une page pour rester cohérente avec ce que lit le client.
      */}
      <Text
        style={s.footerText}
        render={({ pageNumber, totalPages }) => `Page ${pageNumber - 1} sur ${totalPages - 1}`}
      />
    </View>
  );
}
