import { Page, StyleSheet, Text, View } from "@react-pdf/renderer";

import { Donut } from "../charts";
import { Monogram } from "../chrome";
import { color, font } from "../theme";
import type { ReportModel } from "../../report-model";

const s = StyleSheet.create({
  page: { backgroundColor: color.noir, paddingVertical: 40, paddingHorizontal: 54 },
  topRule: { height: 3, backgroundColor: color.goldBright, width: 46, marginBottom: 20 },
  brand: {
    fontFamily: font.display,
    fontSize: 30,
    color: color.goldBright,
    letterSpacing: 0.5,
  },
  kicker: {
    fontFamily: font.sans,
    fontWeight: 700,
    fontSize: 8,
    letterSpacing: 3,
    color: color.cream,
    opacity: 0.65,
    marginTop: 8,
  },
  title: { fontFamily: font.display, fontSize: 25, color: color.cream, marginTop: 24 },
  subtitle: {
    fontFamily: font.sans,
    fontSize: 10.5,
    color: color.goldSoft,
    marginTop: 8,
    lineHeight: 1.5,
  },
  identity: { flexDirection: "row", alignItems: "center", marginTop: 22 },
  handle: { fontFamily: font.sans, fontWeight: 700, fontSize: 17, color: color.cream },
  displayName: { fontFamily: font.sans, fontSize: 9.5, color: color.cream, opacity: 0.6, marginTop: 2 },
  chips: { flexDirection: "row", flexWrap: "wrap", marginTop: 8 },
  chip: {
    borderWidth: 0.75,
    borderColor: color.goldBright,
    borderRadius: 10,
    paddingVertical: 2.5,
    paddingHorizontal: 8,
    marginRight: 5,
    marginBottom: 4,
  },
  chipText: { fontFamily: font.sans, fontSize: 7.5, color: color.goldBright },
  scoreBlock: { flexDirection: "row", alignItems: "center", marginTop: 20 },
  scoreLabel: {
    fontFamily: font.sans,
    fontWeight: 700,
    fontSize: 7.5,
    letterSpacing: 1.6,
    color: color.cream,
    opacity: 0.6,
  },
  scoreStatus: { fontFamily: font.display, fontSize: 19, color: color.goldBright, marginTop: 6 },
  miniStats: { flexDirection: "row", marginTop: 18, borderTopWidth: 0.75, borderTopColor: "#332F28", paddingTop: 12 },
  miniValue: { fontFamily: font.sans, fontWeight: 700, fontSize: 15, color: color.goldBright },
  miniLabel: {
    fontFamily: font.sans,
    fontSize: 7,
    letterSpacing: 0.8,
    color: color.cream,
    opacity: 0.55,
    marginTop: 3,
    textTransform: "uppercase",
  },
  contentsTitle: {
    fontFamily: font.sans,
    fontWeight: 700,
    fontSize: 7.5,
    letterSpacing: 1.6,
    color: color.cream,
    opacity: 0.6,
    marginBottom: 8,
  },
  contentsRow: { flexDirection: "row", marginBottom: 3 },
  contentsMark: { color: color.goldBright, fontSize: 9, marginRight: 7, fontFamily: font.sans },
  contentsText: { fontFamily: font.sans, fontSize: 9, color: color.cream, opacity: 0.82 },
  footer: {
    fontFamily: font.sans,
    fontSize: 7.5,
    color: color.cream,
    opacity: 0.4,
    // Poussé en pied de page : la couverture reste équilibrée quel que soit le
    // nombre d'entrées du sommaire.
    marginTop: "auto",
    borderTopWidth: 0.75,
    borderTopColor: "#332F28",
    paddingTop: 10,
  },
});

export function CoverPage({ model }: { model: ReportModel }) {
  const { meta, health, stats, contents } = model;
  const miniStats = stats.primary.slice(0, 3);

  return (
    <Page size="A4" style={s.page}>
      <View style={s.topRule} />
      <Text style={s.brand}>FredWav</Text>
      <Text style={s.kicker}>ANALYSE EXPRESS</Text>

      <Text style={s.title}>Ce qui fonctionne sur ton compte,{"\n"}ce qui ne fonctionne pas, et pourquoi.</Text>
      <Text style={s.subtitle}>
        Tes chiffres, ton rythme de publication, tes meilleures vidéos et ce qu'il faut corriger en
        priorité. Sans jargon : chaque terme est expliqué.
      </Text>

      <View style={s.identity}>
        <Monogram initials={meta.initials} avatar={meta.avatar} boxSize={44} />
        <View style={{ marginLeft: 14, flex: 1 }}>
          <Text style={s.handle}>@{meta.username}</Text>
          {meta.displayName !== meta.username ? (
            <Text style={s.displayName}>{meta.displayName}</Text>
          ) : null}
          <View style={s.chips}>
            {meta.niche ? (
              <View style={s.chip}>
                <Text style={s.chipText}>
                  {meta.niche}
                  {meta.nicheConfidence !== undefined ? ` · fiabilité ${meta.nicheConfidence} %` : ""}
                </Text>
              </View>
            ) : null}
            {meta.creatorLevel ? (
              <View style={s.chip}>
                <Text style={s.chipText}>{meta.creatorLevel}</Text>
              </View>
            ) : null}
            {meta.verified ? (
              <View style={s.chip}>
                <Text style={s.chipText}>Compte vérifié</Text>
              </View>
            ) : null}
          </View>
        </View>
      </View>

      {health ? (
        <View style={s.scoreBlock}>
          <Donut score={health.total} diameter={106} />
          <View style={{ marginLeft: 22, flex: 1 }}>
            <Text style={s.scoreLabel}>SCORE DE SANTÉ DU COMPTE</Text>
            {health.statusLabel ? <Text style={s.scoreStatus}>{health.statusLabel}</Text> : null}
            <Text style={[s.subtitle, { fontSize: 9, marginTop: 6 }]}>
              Une note globale calculée sur l'engagement, la régularité, la qualité des contenus et le
              potentiel de croissance.
            </Text>
          </View>
        </View>
      ) : null}

      {miniStats.length ? (
        <View style={s.miniStats}>
          {miniStats.map((stat) => (
            <View key={stat.label} style={{ flex: 1 }}>
              <Text style={s.miniValue}>{stat.value}</Text>
              <Text style={s.miniLabel}>{stat.label}</Text>
            </View>
          ))}
        </View>
      ) : null}

      {contents.length ? (
        <View style={{ marginTop: 18 }}>
          <Text style={s.contentsTitle}>CE QUE CONTIENT CE RAPPORT</Text>
          {contents.slice(0, 8).map((item) => (
            <View key={item} style={s.contentsRow}>
              <Text style={s.contentsMark}>—</Text>
              <Text style={s.contentsText}>{item}</Text>
            </View>
          ))}
        </View>
      ) : null}

      <Text style={s.footer}>
        Rapport généré le {meta.generatedAtLabel} · Confidentiel, préparé pour @{meta.username} ·
        fredwav.com
      </Text>
    </Page>
  );
}
