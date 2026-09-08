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
  bulletRow: { flexDirection: "row", marginTop: 8 },
  bulletMark: { color: color.goldBright, fontSize: size.body, marginRight: 8, fontFamily: font.sans },
  bulletText: {
    fontFamily: font.sans,
    fontSize: size.body,
    color: color.cream,
    opacity: 0.85,
    lineHeight: 1.5,
    flex: 1,
  },
  button: {
    backgroundColor: color.goldBright,
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: "center",
    marginTop: 22,
  },
  buttonText: { fontFamily: font.sans, fontWeight: 700, fontSize: 11, color: color.noir },
  buttonSub: {
    fontFamily: font.sans,
    fontSize: size.micro,
    color: color.cream,
    opacity: 0.5,
    textAlign: "center",
    marginTop: 8,
  },
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

const BENEFITS = [
  "Comprendre ce qui fonctionne, ce qui ne fonctionne pas, et pourquoi.",
  "Ne plus être seul pour ta création de contenu.",
  "Des retours réguliers sur tes vidéos, et un cadre pour avancer.",
  "Aucune promesse de vues : personne ne contrôle un algorithme.",
];

export function CtaPage({ model }: { model: ReportModel }) {
  return (
    <Page size="A4" style={s.page}>
      <PageHeader username={model.meta.username} dateLabel={model.meta.generatedAtLabel} />

      <View style={s.box}>
        <Text style={s.title}>Des pistes à tester. À toi de choisir la suite.</Text>
        <Text style={s.intro}>
          Cette analyse est une photo de ton compte aujourd'hui. Ce qui fait la différence ensuite,
          c'est de retravailler tes vidéos semaine après semaine sans rester seul devant tes chiffres.
        </Text>
        {BENEFITS.map((b) => (
          <View key={b} style={s.bulletRow}>
            <Text style={s.bulletMark}>—</Text>
            <Text style={s.bulletText}>{b}</Text>
          </View>
        ))}

        <Link src="https://wavstats.com" style={{ textDecoration: "none" }}>
          <View style={s.button}>
            <Text style={s.buttonText}>WavStats — continuer en autonomie</Text>
          </View>
        </Link>
        <Link src="https://fredwav.com/wavacademy" style={{ textDecoration: "none" }}><View style={s.button}><Text style={s.buttonText}>Academy — le collectif · 749 € TTC / 6 mois</Text></View></Link>
        <Link src="https://fredwav.com/wav-premium" style={{ textDecoration: "none" }}><View style={s.button}><Text style={s.buttonText}>Premium — l’individuel · 1 990 € TTC / 30 jours</Text></View></Link>
        <Text style={s.buttonSub}>Trois suites volontaires. Les appels d’inscription ne sont pas des audits gratuits.</Text>
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
