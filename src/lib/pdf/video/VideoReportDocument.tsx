import { Document, Link, Page, StyleSheet, Text, View } from "@react-pdf/renderer";
import type { ReactNode } from "react";

import type { VideoReport } from "../../../../supabase/functions/_shared/video-report";
import { Monogram } from "../document/chrome";
import { BulletRow, Card, Label, Paragraph, Row, ScoreBar, SectionTitle, StatCard } from "../document/primitives";
import { color, font, page, scoreColor, size } from "../document/theme";
import { accountComparison, fmtNumber, scoreRows, statTiles } from "./view-model";

/**
 * Rapport PDF de l'Analyse Vidéo. Réutilise la charte et les primitives du
 * rapport Express ; aucun saut de page forcé (voir primitives.tsx) : le contenu
 * s'enchaîne dans un seul flux et un bloc sans donnée n'est pas rendu.
 */
const s = StyleSheet.create({
  page: {
    backgroundColor: color.cream,
    paddingTop: page.paddingTop,
    paddingBottom: page.paddingBottom,
    paddingHorizontal: page.paddingHorizontal,
  },
  header: {
    position: "absolute", top: 28, left: page.paddingHorizontal, right: page.paddingHorizontal,
    flexDirection: "row", justifyContent: "space-between", alignItems: "center",
    paddingBottom: 8, borderBottomWidth: 0.75, borderBottomColor: color.line,
  },
  brand: { fontFamily: font.sans, fontWeight: 700, fontSize: size.chrome, letterSpacing: 1, color: color.ink, marginLeft: 6 },
  chrome: { fontFamily: font.sans, fontSize: size.chrome, color: color.muted },
  footer: {
    position: "absolute", bottom: 26, left: page.paddingHorizontal, right: page.paddingHorizontal,
    flexDirection: "row", justifyContent: "space-between",
  },
  hero: { backgroundColor: color.noir, borderRadius: 12, padding: 26 },
  eyebrow: { fontFamily: font.sans, fontWeight: 700, fontSize: size.micro, letterSpacing: 1.4, color: color.goldBright },
  heroTitle: { fontFamily: font.display, fontSize: 24, color: color.cream, lineHeight: 1.25, marginTop: 10 },
  heroText: { fontFamily: font.sans, fontSize: size.small, color: color.cream, opacity: 0.75, lineHeight: 1.5, marginTop: 8 },
  scoreValue: { fontFamily: font.display, fontSize: 44, color: color.goldBright },
  scoreUnit: { fontFamily: font.sans, fontSize: size.small, color: color.cream, opacity: 0.75, marginLeft: 6, marginBottom: 9 },
  verdict: { fontFamily: font.sans, fontSize: 11, color: color.ink, lineHeight: 1.6 },
  notice: { backgroundColor: color.goldSoft, borderRadius: 6, padding: 10, marginTop: 10 },
  quote: { borderLeftWidth: 3, borderLeftColor: color.gold, backgroundColor: color.white, padding: 12, borderRadius: 4 },
  quoteText: { fontFamily: font.display, fontSize: 13, color: color.ink, lineHeight: 1.4 },
  segmentLabel: { fontFamily: font.sans, fontWeight: 700, fontSize: size.h3, color: color.gold, marginBottom: 5 },
  italic: { fontFamily: font.sans, fontSize: size.body, color: color.muted, lineHeight: 1.5, marginBottom: 5 },
  rewrite: { backgroundColor: color.goldSoft, borderRadius: 6, padding: 9, marginTop: 4 },
  strong: { fontFamily: font.sans, fontWeight: 700, fontSize: size.body, color: color.ink, lineHeight: 1.5 },
  step: { flexDirection: "row", marginBottom: 9 },
  stepNumber: {
    width: 22, height: 22, borderRadius: 11, backgroundColor: color.goldBright,
    alignItems: "center", justifyContent: "center", marginRight: 10,
  },
  stepNumberText: { fontFamily: font.sans, fontWeight: 700, fontSize: 10, color: color.noir },
  ctaBox: { backgroundColor: color.noir, borderRadius: 12, padding: 22, marginTop: 22 },
  ctaTitle: { fontFamily: font.display, fontSize: 15, color: color.cream },
  ctaButton: { backgroundColor: color.goldBright, borderRadius: 8, paddingVertical: 10, alignItems: "center", marginTop: 14 },
  ctaButtonText: { fontFamily: font.sans, fontWeight: 700, fontSize: 10, color: color.noir },
  link: { color: color.goldBright, textDecoration: "none", fontFamily: font.sans, fontSize: size.small },
  legal: { fontFamily: font.sans, fontSize: size.micro, color: color.muted, textAlign: "center", marginTop: 14, lineHeight: 1.5 },
});

function ReportPage({ report, dateLabel, children }: { report: VideoReport; dateLabel: string; children: ReactNode }) {
  return (
    <Page size="A4" style={s.page} wrap>
      <View style={s.header} fixed>
        <View style={{ flexDirection: "row", alignItems: "center" }}>
          <Monogram initials="FW" boxSize={14} background={color.noir} textColor={color.goldBright} />
          <Text style={s.brand}>FRED WAV : ANALYSE VIDÉO</Text>
        </View>
        <Text style={s.chrome}>{report.video.author ? `@${report.video.author} · ` : ""}{dateLabel}</Text>
      </View>
      {children}
      <View style={s.footer} fixed>
        <Text style={s.chrome}>fredwav.com</Text>
        <Text style={s.chrome} render={({ pageNumber, totalPages }) => `Page ${pageNumber} sur ${totalPages}`} />
      </View>
    </Page>
  );
}

const chunk = <T,>(items: T[], n: number): T[][] =>
  items.reduce<T[][]>((rows, item, i) => (i % n ? rows[rows.length - 1].push(item) : rows.push([item]), rows), []);

function Advice({ label, verdict, tips }: { label: string; verdict: string | null; tips: string[] }) {
  if (!verdict && !tips.length) return null;
  return (
    <Card style={{ marginBottom: 8 }} noWrap>
      <Label>{label}</Label>
      {verdict ? <Paragraph style={{ marginTop: 4 }}>{verdict}</Paragraph> : null}
      {tips.map((tip) => <BulletRow key={tip}>{tip}</BulletRow>)}
    </Card>
  );
}

export function VideoReportDocument({ report, dateLabel }: { report: VideoReport; dateLabel: string }) {
  const { summary, video, hook, cta, description, thumbnail } = report;
  const tiles = statTiles(report);
  const scores = scoreRows(report);
  const comparison = accountComparison(report);
  const hasMessage = !!(cta?.verdict || cta?.improvement || description?.analysis || description?.suggestions.length
    || thumbnail?.verdict || thumbnail?.suggestions.length);
  const pageProps = { report, dateLabel };

  return (
    <Document
      title={`Analyse Vidéo TikTok${video.author ? ` : @${video.author}` : ""}`}
      author="Fred Wav" subject="Analyse d'une vidéo TikTok" creator="fredwav.com" producer="fredwav.com" language="fr-FR"
    >
      {/* Synthèse */}
      <ReportPage {...pageProps}>
        <View style={s.hero}>
          <Text style={s.eyebrow}>ANALYSE VIDÉO TIKTOK</Text>
          <Text style={s.heroTitle}>{video.author ? `La vidéo de @${video.author}` : "Ton analyse vidéo"}</Text>
          {video.description ? <Text style={s.heroText}>{video.description}</Text> : null}
          {summary.overallScore != null ? (
            <View style={{ flexDirection: "row", alignItems: "flex-end", marginTop: 16 }}>
              <Text style={s.scoreValue}>{summary.overallScore}</Text>
              <Text style={s.scoreUnit}>/ 100 · score global</Text>
            </View>
          ) : null}
        </View>

        <SectionTitle>En résumé</SectionTitle>
        <Text style={s.verdict}>{summary.verdict}</Text>
        {summary.maturityNotice ? (
          <View style={s.notice}><Paragraph style={{ marginBottom: 0 }}>{summary.maturityNotice}</Paragraph></View>
        ) : null}

        {report.strengths.length ? (
          <>
            <SectionTitle>Ce qui fonctionne</SectionTitle>
            {report.strengths.map((item) => (
              <Card key={item.title} style={{ marginBottom: 8 }} noWrap>
                <Text style={s.strong}>{item.title}</Text>
                {item.description ? <Paragraph style={{ marginTop: 3, marginBottom: 0 }}>{item.description}</Paragraph> : null}
              </Card>
            ))}
          </>
        ) : null}

        {report.improvements.length ? (
          <>
            <SectionTitle>Ce qui bloque</SectionTitle>
            {report.improvements.map((item) => (
              <Card key={item.title} style={{ marginBottom: 8 }} noWrap>
                <Text style={s.strong}>{item.title}</Text>
                {item.description ? <Paragraph style={{ marginTop: 3, marginBottom: 0 }}>{item.description}</Paragraph> : null}
              </Card>
            ))}
          </>
        ) : null}

        {/* Performances et accroche */}
          {tiles.length ? (
            <>
              <SectionTitle subtitle="Données publiques de la vidéo au moment de l'analyse.">Performances</SectionTitle>
              {chunk(tiles, 4).map((row, i) => (
                <Row key={i} style={{ marginBottom: 6, marginHorizontal: -3 }}>
                  {row.map((tile) => <StatCard key={tile.label} label={tile.label} value={tile.value} small />)}
                </Row>
              ))}
              {comparison.length ? (
                <Card style={{ marginTop: 6 }} noWrap>
                  <Label>Par rapport au reste du compte</Label>
                  <View style={{ marginTop: 6 }}>{comparison.map((line) => <BulletRow key={line}>{line}</BulletRow>)}</View>
                </Card>
              ) : null}
              {scores.length ? (
                <Card style={{ marginTop: 8 }} noWrap>
                  <Label>Scores sur 100</Label>
                  {scores.map((row) => (
                    <View key={row.label} style={{ marginTop: 8 }}>
                      <Row style={{ justifyContent: "space-between", marginBottom: 3 }}>
                        <Text style={{ fontFamily: font.sans, fontSize: size.body, color: color.ink }}>{row.label}</Text>
                        <Text style={s.strong}>{row.value}</Text>
                      </Row>
                      <ScoreBar score={row.value} barColor={scoreColor(row.value)} />
                    </View>
                  ))}
                </Card>
              ) : null}
            </>
          ) : null}

          {hook ? (
            <>
              <SectionTitle subtitle={hook.spoken
                ? "Les premières secondes, telles que tu les prononces."
                : "Accroche estimée à partir des éléments disponibles."}>Ton accroche</SectionTitle>
              {hook.text ? <View style={s.quote} wrap={false}><Text style={s.quoteText}>« {hook.text} »</Text></View> : null}
              <View style={{ marginTop: 8 }}>
                <Advice label="Ce que ça donne" verdict={hook.effectiveness} tips={[]} />
                <Advice label="À améliorer" verdict={hook.improvement} tips={[]} />
              </View>
            </>
          ) : null}

        {/* Structure et message */}
          {report.script.length ? (
            <>
              <SectionTitle subtitle="Ce que tu dis, ce que ça produit, et une réécriture possible.">Structure de la vidéo</SectionTitle>
              {report.script.map((segment) => (
                <Card key={segment.label} style={{ marginBottom: 8 }} noWrap>
                  <Text style={s.segmentLabel}>{segment.label}</Text>
                  {segment.quote ? <Text style={s.italic}>« {segment.quote} »</Text> : null}
                  {segment.analysis ? <Paragraph>{segment.analysis}</Paragraph> : null}
                  {segment.rewrite ? (
                    <View style={s.rewrite}>
                      <Label>Réécriture proposée</Label>
                      <Text style={[s.strong, { marginTop: 3 }]}>« {segment.rewrite} »</Text>
                    </View>
                  ) : null}
                </Card>
              ))}
              {report.speech?.wordsPerMinute != null ? (
                <Paragraph style={{ color: color.muted }}>
                  Débit : environ {fmtNumber(report.speech.wordsPerMinute)} mots par minute
                  {report.speech.startsImmediately === true ? ", parole dès la première seconde."
                    : report.speech.startsImmediately === false ? ", la parole ne démarre pas immédiatement." : "."}
                </Paragraph>
              ) : null}
            </>
          ) : null}

          {hasMessage ? (
            <>
              <SectionTitle>Message et habillage</SectionTitle>
              {cta ? (
                <Advice label={`Appel à l'action${cta.hasCta === false ? " · absent" : ""}`} verdict={cta.verdict}
                  tips={cta.improvement ? [cta.improvement] : []} />
              ) : null}
              {description ? (
                <Advice label="Description" verdict={description.analysis}
                  tips={[...description.suggestions,
                    ...(description.hashtagSuggestions.length ? [`Hashtags à tester : ${description.hashtagSuggestions.join(" ")}`] : [])]} />
              ) : null}
              {thumbnail ? <Advice label="Couverture" verdict={thumbnail.verdict} tips={thumbnail.suggestions} /> : null}
            </>
          ) : null}

        {/* Plan d'action et suite */}
        {report.actionPlan.length ? (
          <>
            <SectionTitle subtitle="Tes priorités, dans l'ordre.">Si tu devais refaire cette vidéo demain</SectionTitle>
            {report.actionPlan.map((action, index) => (
              <View key={action.title} style={s.step} wrap={false}>
                <View style={s.stepNumber}><Text style={s.stepNumberText}>{index + 1}</Text></View>
                <View style={{ flex: 1 }}>
                  <Text style={s.strong}>{action.title}</Text>
                  {action.detail ? <Paragraph style={{ color: color.muted, marginBottom: 0 }}>{action.detail}</Paragraph> : null}
                </View>
              </View>
            ))}
          </>
        ) : null}

        <View style={s.ctaBox} wrap={false}>
          <Text style={s.ctaTitle}>Tu veux aller plus loin ?</Text>
          <Text style={s.heroText}>
            Cette analyse porte sur une seule vidéo. L'Analyse Express compare jusqu'à 120 vidéos de ton compte pour dégager ce qui marche vraiment chez toi.
          </Text>
          <Link src="https://fredwav.com/analyse-express" style={{ textDecoration: "none" }}>
            <View style={s.ctaButton}><Text style={s.ctaButtonText}>Analyser tout mon compte sur FredWav.com</Text></View>
          </Link>
          <Text style={[s.heroText, { textAlign: "center", marginTop: 12 }]}>
            Pour suivre et analyser tes contenus au quotidien :{" "}
            <Link src="https://wavstats.com" style={s.link}>wavstats.com</Link>
          </Text>
        </View>
        <Text style={s.legal}>
          Analyse automatisée à partir des données publiques de la vidéo, sans relecture individuelle. Aucune garantie de résultat.
        </Text>
      </ReportPage>
    </Document>
  );
}
