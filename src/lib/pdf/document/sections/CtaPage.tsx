import { Link, Page, StyleSheet, Text, View } from "@react-pdf/renderer";

import { PageFooter, PageHeader } from "../chrome";
import { color, font, page, size } from "../theme";
import type { ReportModel } from "../../report-model";

const s = StyleSheet.create({
  page: {
    backgroundColor: color.cream,
    paddingTop: page.paddingTop,
    paddingBottom: page.paddingBottom,
    paddingHorizontal: page.paddingHorizontal,
    justifyContent: "center",
  },
  box: { backgroundColor: color.noir, borderRadius: 12, padding: 30 },
  title: { fontFamily: font.display, fontSize: 21, color: color.cream, lineHeight: 1.3 },
  intro: {
    fontFamily: font.sans,
    fontSize: size.body,
    color: color.cream,
    opacity: 0.75,
    lineHeight: 1.6,
    marginTop: 12,
  },
  button: {
    backgroundColor: color.goldBright,
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: "center",
    marginTop: 22,
  },
  buttonText: { fontFamily: font.sans, fontWeight: 700, fontSize: 11, color: color.noir },
  outro: {
    fontFamily: font.sans,
    fontSize: size.small,
    color: color.muted,
    textAlign: "center",
    marginTop: 20,
    lineHeight: 1.6,
  },
  link: { color: color.gold, textDecoration: "none" },
});

export function CtaPage({ model }: { model: ReportModel }) {
  return (
    <Page size="A4" style={s.page}>
      <PageHeader username={model.meta.username} dateLabel={model.meta.generatedAtLabel} />

      <View style={s.box}>
        <Text style={s.title}>Satisfait de ton analyse ?</Text>
        <Text style={s.intro}>
          Obtiens des retours sur toutes tes vidéos avec la méthode de Fred Wav grâce à WavStats,
          l'outil qui propulse ton analyse, pensé pour les créateurs de contenu et les solopreneurs.
        </Text>

        <Link src="https://wavstats.com" style={{ textDecoration: "none" }}>
          <View style={s.button}>
            <Text style={s.buttonText}>Propulser mon analyse avec WavStats</Text>
          </View>
        </Link>
      </View>

      <Text style={s.outro}>
        Analyse automatisée, sans relecture individuelle ·{" "}
        <Link src="https://fredwav.com" style={s.link}>
          fredwav.com
        </Link>
        {"\n"}Rapport confidentiel préparé pour @{model.meta.username} le {model.meta.generatedAtLabel}.
      </Text>

      <PageFooter />
    </Page>
  );
}
