import { StyleSheet, Text, View } from "@react-pdf/renderer";
import type { Style } from "@react-pdf/types";
import type { ReactNode } from "react";

import { color, font, size } from "./theme";

const s = StyleSheet.create({
  sectionTitleWrap: { marginTop: 22, marginBottom: 12 },
  sectionTitle: { fontFamily: font.display, fontSize: size.h2, color: color.ink },
  sectionRule: { marginTop: 6, width: 34, height: 2, backgroundColor: color.gold },
  sectionSubtitle: {
    fontFamily: font.sans,
    fontSize: size.small,
    color: color.muted,
    marginTop: 6,
    lineHeight: 1.5,
  },
  subTitle: {
    fontFamily: font.sans,
    fontWeight: 700,
    fontSize: size.h3,
    color: color.ink,
    marginTop: 14,
    marginBottom: 8,
  },
  label: {
    fontFamily: font.sans,
    fontWeight: 700,
    fontSize: size.micro,
    letterSpacing: 0.8,
    color: color.muted,
    textTransform: "uppercase",
  },
  paragraph: {
    fontFamily: font.sans,
    fontSize: size.body,
    color: color.ink,
    lineHeight: 1.55,
    marginBottom: 6,
  },
  card: {
    backgroundColor: color.white,
    borderWidth: 0.75,
    borderColor: color.line,
    borderRadius: 8,
    padding: 14,
  },
  statCard: {
    backgroundColor: color.white,
    borderWidth: 0.75,
    borderColor: color.line,
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 10,
    alignItems: "center",
  },
  statValue: {
    fontFamily: font.sans,
    fontWeight: 700,
    fontSize: size.statValue,
    color: color.ink,
    marginBottom: 4,
  },
  chip: {
    borderRadius: 10,
    paddingVertical: 3,
    paddingHorizontal: 8,
    marginRight: 5,
    marginBottom: 4,
  },
  chipText: { fontFamily: font.sans, fontSize: size.micro, fontWeight: 500 },
  bulletRow: { flexDirection: "row", marginBottom: 5 },
  bulletMark: { color: color.gold, fontSize: size.body, marginRight: 6, fontFamily: font.sans },
  bulletText: { fontFamily: font.sans, fontSize: size.body, color: color.ink, lineHeight: 1.5, flex: 1 },
  row: { flexDirection: "row" },
});

/**
 * Un titre de section ne doit jamais rester seul en bas de page : 90 pt de
 * présence exigée en aval, soit le titre plus trois lignes de corps.
 */
export function SectionTitle({
  children,
  subtitle,
  newPage,
  tight,
}: {
  children: string;
  subtitle?: string;
  /** Ouvre une page neuve : réservé aux sections que le lecteur doit aborder à froid. */
  newPage?: boolean;
  /** Marge haute réduite, pour enchaîner deux sections sur la même page. */
  tight?: boolean;
}) {
  return (
    <View
      style={[s.sectionTitleWrap, tight ? { marginTop: 12, marginBottom: 8 } : {}]}
      minPresenceAhead={130}
      break={newPage}
    >
      <Text style={s.sectionTitle}>{children}</Text>
      <View style={s.sectionRule} />
      {subtitle ? <Text style={s.sectionSubtitle}>{subtitle}</Text> : null}
    </View>
  );
}

export function SubTitle({
  children,
  newPage,
  minAhead,
  tight,
}: {
  children: ReactNode;
  newPage?: boolean;
  minAhead?: number;
  /** Marges réduites, pour les sections qui enchaînent plusieurs sous-blocs. */
  tight?: boolean;
}) {
  return (
    <View break={newPage} minPresenceAhead={minAhead ?? 60}>
      <Text style={[s.subTitle, tight ? { marginTop: 8, marginBottom: 5 } : {}]}>{children}</Text>
    </View>
  );
}

export function Label({ children }: { children: ReactNode }) {
  return <Text style={s.label}>{children}</Text>;
}

export function Paragraph({ children, style }: { children: ReactNode; style?: Style }) {
  return (
    <Text style={[s.paragraph, style ?? {}]} orphans={3} widows={3}>
      {children}
    </Text>
  );
}

export function Card({
  children,
  style,
  noWrap,
  minAhead,
}: {
  children: ReactNode;
  style?: Style;
  noWrap?: boolean;
  minAhead?: number;
}) {
  return (
    <View style={[s.card, style ?? {}]} wrap={!noWrap} minPresenceAhead={minAhead ?? 60}>
      {children}
    </View>
  );
}

export function StatCard({ label, value, small }: { label: string; value: string; small?: boolean }) {
  return (
    <View style={[s.statCard, { flex: 1, marginHorizontal: 3 }]} wrap={false}>
      <Text style={[s.statValue, small ? { fontSize: size.statValueSmall } : {}]}>{value}</Text>
      <Text style={[s.label, { textAlign: "center" }]}>{label}</Text>
    </View>
  );
}

/** Barre de progression en Views empilées : pas de SVG, largeur en pourcentage. */
export function ScoreBar({ score, barColor }: { score: number; barColor: string }) {
  const pct = Math.max(0, Math.min(100, score));
  return (
    <View style={{ height: 6, backgroundColor: color.creamDark, borderRadius: 3 }}>
      <View style={{ height: 6, width: `${pct}%`, backgroundColor: barColor, borderRadius: 3 }} />
    </View>
  );
}

export function Chip({
  children,
  tone = color.muted,
  filled,
  dense,
}: {
  children: ReactNode;
  tone?: string;
  filled?: boolean;
  /** Version resserrée, pour les listes denses des plans d'action. */
  dense?: boolean;
}) {
  return (
    <View
      style={[
        s.chip,
        dense ? { paddingVertical: 1.5, marginBottom: 2 } : {},
        filled
          ? { backgroundColor: tone }
          : { borderWidth: 0.75, borderColor: tone, backgroundColor: color.white },
      ]}
    >
      <Text style={[s.chipText, { color: filled ? color.white : tone }]}>{children}</Text>
    </View>
  );
}

export function ChipRow({ children }: { children: ReactNode }) {
  return <View style={{ flexDirection: "row", flexWrap: "wrap", marginTop: 6 }}>{children}</View>;
}

export function BulletRow({ children }: { children: ReactNode }) {
  return (
    <View style={s.bulletRow} minPresenceAhead={24}>
      <Text style={s.bulletMark}>•</Text>
      <Text style={s.bulletText}>{children}</Text>
    </View>
  );
}

export function Row({ children, style }: { children: ReactNode; style?: Style }) {
  return <View style={[s.row, style ?? {}]}>{children}</View>;
}
