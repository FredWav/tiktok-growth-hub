import { Link, Page, StyleSheet, Text, View } from "@react-pdf/renderer";

import { PageFooter, PageHeader } from "../chrome";
import { color, font, page, size } from "../theme";
import type { ReportModel } from "../../report-model";
import { EXPRESS_CONTINUATIONS } from "../../../../config/express-continuation";

const s = StyleSheet.create({
  page: {
    backgroundColor: color.cream,
    paddingTop: page.paddingTop,
    paddingBottom: page.paddingBottom,
    paddingHorizontal: page.paddingHorizontal,
    justifyContent: "center",
  },
  heading: {
    fontFamily: font.display,
    fontSize: 24,
    color: color.noir,
    textAlign: "center",
    marginBottom: 20,
  },
  box: { backgroundColor: color.noir, borderRadius: 12, padding: 24, marginBottom: 14 },
  eyebrow: {
    fontFamily: font.sans,
    fontSize: 8,
    fontWeight: 700,
    color: color.goldBright,
    textTransform: "uppercase",
    marginBottom: 8,
  },
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

      <Text style={s.heading}>À toi de choisir la suite</Text>
      {EXPRESS_CONTINUATIONS.map((continuation) => (
        <View key={continuation.key} style={s.box} wrap={false}>
          <Text style={s.eyebrow}>{continuation.eyebrow}</Text>
          <Text style={s.title}>{continuation.title}</Text>
          <Text style={s.intro}>{continuation.description}</Text>

          <Link
            src={continuation.external ? continuation.url : `https://fredwav.com${continuation.url}`}
            style={{ textDecoration: "none" }}
          >
            <View style={s.button}>
              <Text style={s.buttonText}>{continuation.button}</Text>
            </View>
          </Link>
        </View>
      ))}

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
