import { StyleSheet, Text, View } from "@react-pdf/renderer";

import { WeekBars } from "../charts";
import {
  BulletRow,
  Card,
  Chip,
  ChipRow,
  Label,
  Paragraph,
  Row,
  ScoreBar,
  SectionTitle,
  StatCard,
  SubTitle,
} from "../primitives";
import { color, font, impactColor, riskColor, scoreColor, size } from "../theme";
import type { ActionItem, ReportModel } from "../../report-model";

const s = StyleSheet.create({
  lead: {
    backgroundColor: color.creamDark,
    borderLeftWidth: 2.5,
    borderLeftColor: color.gold,
    borderRadius: 4,
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  leadText: { fontFamily: font.sans, fontSize: 10, color: color.ink, lineHeight: 1.6 },
  scoreRow: { flexDirection: "row", alignItems: "center", marginBottom: 8 },
  scoreName: { fontFamily: font.sans, fontSize: size.body, color: color.ink, width: "44%" },
  scoreValue: {
    fontFamily: font.sans,
    fontWeight: 700,
    fontSize: size.body,
    width: 34,
    textAlign: "right",
  },
  kv: { marginBottom: 9, width: "50%", paddingRight: 10 },
  kvValue: { fontFamily: font.sans, fontWeight: 500, fontSize: size.body, color: color.ink, marginTop: 2 },
  tableHead: {
    flexDirection: "row",
    backgroundColor: color.creamDark,
    borderRadius: 4,
    paddingVertical: 6,
    paddingHorizontal: 8,
  },
  th: {
    fontFamily: font.sans,
    fontWeight: 700,
    fontSize: size.micro,
    letterSpacing: 0.5,
    color: color.muted,
    textTransform: "uppercase",
  },
  tr: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    paddingHorizontal: 8,
    borderBottomWidth: 0.5,
    borderBottomColor: color.line,
  },
  td: { fontFamily: font.sans, fontSize: size.small, color: color.ink, textAlign: "right" },
  rank: {
    fontFamily: font.sans,
    fontWeight: 700,
    fontSize: size.small,
    color: color.gold,
    width: 14,
  },
  videoDesc: { fontFamily: font.sans, fontSize: size.small, color: color.ink, lineHeight: 1.35 },
  videoDate: { fontFamily: font.sans, fontSize: size.micro, color: color.muted, marginTop: 2 },
  itemNumber: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: color.gold,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 8,
  },
  itemNumberText: { fontFamily: font.sans, fontWeight: 700, fontSize: 7.5, color: color.white },
  verdictScore: {
    fontFamily: font.sans,
    fontWeight: 700,
    fontSize: 18,
    color: color.gold,
  },
});

const NUM_COL = 46;

/* ── Synthèse ────────────────────────────────────────────────────────────── */

export function SummarySection({ model }: { model: ReportModel }) {
  const { ai, meta } = model;
  return (
    <>
      <SectionTitle subtitle="Ce qui ressort de l'analyse de ton compte.">Ce qu'il faut retenir</SectionTitle>
      {ai?.summary ? (
        <View style={s.lead} minPresenceAhead={70}>
          <Text style={s.leadText} orphans={3} widows={3}>
            {ai.summary}
          </Text>
        </View>
      ) : (
        <Card minAhead={40}>
          <Paragraph style={{ marginBottom: 0, color: color.muted }}>
            L'analyse rédigée par l'IA n'est pas disponible pour ce rapport. Les données chiffrées
            ci-dessous restent complètes.
          </Paragraph>
        </Card>
      )}
      {meta.bio ? (
        <View style={{ marginTop: 12 }}>
          <Label>Ta description de profil actuelle</Label>
          <Paragraph style={{ marginTop: 4, color: color.muted }}>{meta.bio}</Paragraph>
        </View>
      ) : null}
    </>
  );
}

/* ── Score de santé ──────────────────────────────────────────────────────── */

export function HealthSection({ model }: { model: ReportModel }) {
  const health = model.health;
  const sb = model.shadowban;
  if (!health) return null;
  return (
    // Titre et carte solidaires : séparés, le titre restait en bas de la page
    // précédente et la carte ouvrait la suivante sans en-tête.
    <View wrap={false}>
      <SectionTitle subtitle="Six critères, chacun noté sur 100. Les notes les plus basses sont celles où tu as le plus à gagner.">
        Le détail de ta note
      </SectionTitle>
      <Card noWrap>
        {health.components.map((c) => (
          <View key={c.key} style={s.scoreRow} wrap={false}>
            <Text style={s.scoreName}>{c.label}</Text>
            <View style={{ flex: 1, marginHorizontal: 8 }}>
              <ScoreBar score={c.score} barColor={scoreColor(c.score)} />
            </View>
            <Text style={[s.scoreValue, { color: scoreColor(c.score) }]}>{c.score}</Text>
          </View>
        ))}
        {/* La visibilité tient en une ligne : lui dédier une section entière
            produisait une page presque vide. */}
        {sb ? (
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              marginTop: 12,
              paddingTop: 10,
              borderTopWidth: 0.75,
              borderTopColor: color.line,
            }}
          >
            <View
              style={{
                borderRadius: 10,
                paddingVertical: 3,
                paddingHorizontal: 9,
                backgroundColor: riskColor(sb.riskLevel),
              }}
            >
              <Text
                style={{ fontFamily: font.sans, fontWeight: 700, fontSize: size.micro, color: color.white }}
              >
                {sb.riskLabel}
              </Text>
            </View>
            <Text
              style={{
                fontFamily: font.sans,
                fontSize: size.small,
                color: color.muted,
                marginLeft: 10,
                flex: 1,
              }}
            >
              Visibilité de tes vidéos{sb.ratioLabel ? ` — ${sb.ratioLabel}` : ""}
            </Text>
          </View>
        ) : null}
      </Card>
      {health.priorityActions.length ? (
        <View style={{ marginTop: 14 }}>
          <SubTitle>À traiter en premier</SubTitle>
          {health.priorityActions.map((a, i) => (
            <BulletRow key={i}>{a}</BulletRow>
          ))}
        </View>
      ) : null}
      {sb?.recommendations.length ? (
        <View style={{ marginTop: 12 }}>
          <SubTitle>Pour préserver ta visibilité</SubTitle>
          {sb.recommendations.map((r, i) => (
            <BulletRow key={i}>{r}</BulletRow>
          ))}
        </View>
      ) : null}
    </View>
  );
}

/* ── Statistiques ────────────────────────────────────────────────────────── */

function StatRow({ items, small }: { items: { label: string; value: string }[]; small?: boolean }) {
  return (
    <Row style={{ marginHorizontal: -3, marginBottom: 8 }}>
      {items.map((it) => (
        <StatCard key={it.label} label={it.label} value={it.value} small={small} />
      ))}
    </Row>
  );
}

export function StatsSection({ model }: { model: ReportModel }) {
  const { primary, averages, medians } = model.stats;
  if (!primary.length && !averages.length && !medians.length) return null;
  return (
    <>
      <View wrap={false}>
        <SectionTitle subtitle="Les chiffres de ton compte, et ce que chaque vidéo génère en moyenne.">
          Tes chiffres
        </SectionTitle>
        {primary.length ? <StatRow items={primary} /> : null}
      </View>
      {averages.length ? (
        <View style={{ marginTop: 8 }} minPresenceAhead={70}>
          <Label>En moyenne, par vidéo</Label>
          <View style={{ marginTop: 6 }}>
            <StatRow items={averages} small />
          </View>
        </View>
      ) : null}
      {medians.length ? (
        <View style={{ marginTop: 6 }} minPresenceAhead={70}>
          <Label>Ta vidéo « typique »</Label>
          <Text
            style={{
              fontFamily: font.sans,
              fontSize: size.micro,
              color: color.muted,
              marginTop: 3,
              marginBottom: 6,
            }}
          >
            Ce que fait la moitié de tes vidéos. Plus fiable que la moyenne, qu'une seule vidéo
            exceptionnelle suffit à fausser.
          </Text>
          <StatRow items={medians} small />
        </View>
      ) : null}
      {model.hashtags.length ? (
        <View style={{ marginTop: 10 }} minPresenceAhead={50}>
          <Label>Les mots-clés (hashtags) que tu utilises le plus</Label>
          <ChipRow>
            {model.hashtags.map((h) => (
              <Chip key={h} tone={color.gold}>
                {h}
              </Chip>
            ))}
          </ChipRow>
        </View>
      ) : null}
    </>
  );
}

/* ── Rythme de publication ───────────────────────────────────────────────── */

function KeyValue({ label, value }: { label: string; value: string }) {
  return (
    <View style={s.kv}>
      <Label>{label}</Label>
      <Text style={s.kvValue}>{value}</Text>
    </View>
  );
}

export function PublicationSection({ model }: { model: ReportModel }) {
  const p = model.publication;
  if (!p) return null;
  return (
    // Titre et carte solidaires : la carte ne peut pas se scinder (grille
    // flex-wrap), elle sauterait à la page suivante en abandonnant son titre.
    <View wrap={false}>
      <SectionTitle subtitle="À quelle fréquence tu publies, et quand tes vidéos marchent le mieux.">
        Ton rythme de publication
      </SectionTitle>
      <Card noWrap>
        <Row style={{ flexWrap: "wrap" }}>
          {p.frequency ? <KeyValue label="Fréquence" value={p.frequency} /> : null}
          {p.lastPostLabel ? <KeyValue label="Dernière publication" value={p.lastPostLabel} /> : null}
          {p.bestDays.length ? <KeyValue label="Meilleurs jours" value={p.bestDays.join(" · ")} /> : null}
          {p.bestHours.length ? (
            <KeyValue label="Meilleurs horaires" value={p.bestHours.join(" · ")} />
          ) : null}
          {p.maxGapLabel ? <KeyValue label="Plus longue pause" value={p.maxGapLabel} /> : null}
        </Row>
        {p.consistencyScore !== undefined ? (
          <View style={{ marginTop: 4 }} wrap={false}>
            <Row style={{ justifyContent: "space-between", marginBottom: 4 }}>
              <Label>Régularité de tes publications</Label>
              <Text
                style={{
                  fontFamily: font.sans,
                  fontWeight: 700,
                  fontSize: size.small,
                  color: scoreColor(p.consistencyScore),
                }}
              >
                {p.consistencyScore} / 100
              </Text>
            </Row>
            <ScoreBar score={p.consistencyScore} barColor={scoreColor(p.consistencyScore)} />
          </View>
        ) : null}
        {p.weeklyDistribution ? (
          <View style={{ marginTop: 14 }}>
            <Label>Tes publications selon le jour de la semaine</Label>
            <View style={{ marginTop: 8 }}>
              <WeekBars data={p.weeklyDistribution} />
            </View>
          </View>
        ) : null}
      </Card>
    </View>
  );
}

/* ── Top vidéos ──────────────────────────────────────────────────────────── */

export function TopVideosSection({ model }: { model: ReportModel }) {
  if (!model.topVideos.length) return null;
  return (
    // Titre, en-tête et lignes solidaires : le tableau tient largement sur une
    // page, et une ligne isolée en tête de page suivante n'a aucun sens.
    <View wrap={false}>
      <SectionTitle subtitle="Tes cinq vidéos les plus vues, et ce qu'elles ont généré.">
        Tes meilleures vidéos
      </SectionTitle>
      <View>
        <View style={s.tableHead}>
          <Text style={[s.th, { width: 14 }]}> </Text>
          <Text style={[s.th, { flex: 1 }]}>Vidéo</Text>
          <Text style={[s.th, { width: NUM_COL, textAlign: "right" }]}>Vues</Text>
          <Text style={[s.th, { width: NUM_COL, textAlign: "right" }]}>J'aime</Text>
          <Text style={[s.th, { width: NUM_COL, textAlign: "right" }]}>Commentaires</Text>
          <Text style={[s.th, { width: NUM_COL, textAlign: "right" }]}>Partages</Text>
          <Text style={[s.th, { width: NUM_COL, textAlign: "right" }]}>Enregistr.</Text>
          <Text style={[s.th, { width: NUM_COL, textAlign: "right" }]}>Interactions</Text>
        </View>
        {model.topVideos.map((v) => (
          <View key={v.rank} style={s.tr} wrap={false}>
            <Text style={s.rank}>{v.rank}</Text>
            <View style={{ flex: 1, paddingRight: 8 }}>
              <Text style={s.videoDesc}>{v.description}</Text>
              {v.dateLabel ? <Text style={s.videoDate}>{v.dateLabel}</Text> : null}
            </View>
            <Text style={[s.td, { width: NUM_COL, fontWeight: 700 }]}>{v.views}</Text>
            <Text style={[s.td, { width: NUM_COL }]}>{v.likes}</Text>
            <Text style={[s.td, { width: NUM_COL }]}>{v.comments}</Text>
            <Text style={[s.td, { width: NUM_COL }]}>{v.shares}</Text>
            <Text style={[s.td, { width: NUM_COL }]}>{v.saves}</Text>
            <Text style={[s.td, { width: NUM_COL, color: color.gold, fontWeight: 700 }]}>
              {v.erLabel ?? "—"}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}

/* ── Forces et axes ──────────────────────────────────────────────────────── */

function TitledList({
  items,
  accent,
}: {
  items: { title: string; description: string }[];
  accent: string;
}) {
  return (
    <>
      {items.map((it, i) => (
        <View key={i} style={{ marginBottom: 10 }} minPresenceAhead={44}>
          <Text
            style={{
              fontFamily: font.sans,
              fontWeight: 700,
              fontSize: size.body,
              color: accent,
              marginBottom: 3,
            }}
          >
            {it.title}
          </Text>
          {it.description ? (
            <Text
              style={{
                fontFamily: font.sans,
                fontSize: size.small,
                color: color.muted,
                lineHeight: 1.5,
              }}
              orphans={2}
              widows={2}
            >
              {it.description}
            </Text>
          ) : null}
        </View>
      ))}
    </>
  );
}

export function StrengthsSection({ model }: { model: ReportModel }) {
  const ai = model.ai;
  if (!ai || (!ai.strengths.length && !ai.improvements.length)) return null;
  return (
    <>
      <SectionTitle subtitle="Ce qui marche sur ton compte, et ce qui te freine.">
        Ce qui fonctionne, ce qui bloque
      </SectionTitle>
      {ai.strengths.length ? (
        <View style={{ marginBottom: 6 }}>
          <SubTitle>Ce qui fonctionne déjà</SubTitle>
          <TitledList items={ai.strengths} accent={color.green} />
        </View>
      ) : null}
      {ai.improvements.length ? (
        <View>
          <SubTitle newPage>Ce qu'il faut corriger</SubTitle>
          <TitledList items={ai.improvements} accent={color.amber} />
        </View>
      ) : null}
    </>
  );
}

/* ── Plans d'action ──────────────────────────────────────────────────────── */

/**
 * Interlignes resserrés : les deux plans d'action doivent tenir sur une seule
 * page. Le texte n'est pas raccourci, seuls les espacements le sont.
 */
function ActionList({ items }: { items: ActionItem[] }) {
  return (
    <>
      {items.map((it, i) => (
        <View key={i} style={{ marginBottom: 5 }} minPresenceAhead={40}>
          <Row style={{ alignItems: "flex-start" }}>
            <View style={s.itemNumber}>
              <Text style={s.itemNumberText}>{i + 1}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text
                style={{ fontFamily: font.sans, fontSize: size.body, color: color.ink, lineHeight: 1.3 }}
              >
                {it.text}
              </Text>
              {it.metric || it.impact || it.effort || it.timeline ? (
                <View style={{ flexDirection: "row", flexWrap: "wrap", marginTop: 2 }}>
                  {it.metric ? <Chip tone={color.muted} dense>{it.metric}</Chip> : null}
                  {it.impact ? (
                    <Chip tone={impactColor(it.impact)} dense>
                      Impact {it.impact}
                    </Chip>
                  ) : null}
                  {it.effort ? (
                    <Chip tone={color.muted} dense>
                      Effort {it.effort}
                    </Chip>
                  ) : null}
                  {it.timeline ? (
                    <Chip tone={color.gold} dense>
                      {it.timeline}
                    </Chip>
                  ) : null}
                </View>
              ) : null}
            </View>
          </Row>
        </View>
      ))}
    </>
  );
}

export function ActionPlanSection({ model }: { model: ReportModel }) {
  const ai = model.ai;
  if (!ai || (!ai.actionPlan.length && !ai.strategy36.length)) return null;
  return (
    <>
      {ai.actionPlan.length ? (
        <>
          <SectionTitle newPage subtitle="À appliquer dans l'ordre, sur les trente prochains jours.">
            Plan d'action 30 jours
          </SectionTitle>
          <ActionList items={ai.actionPlan} />
        </>
      ) : null}
      {ai.strategy36.length ? (
        <>
          {/* Pas de saut de page : les deux plans tiennent ensemble sur une page. */}
          <SectionTitle tight subtitle="Ce qui se construit sur la durée, une fois les bases posées.">
            Stratégie 3-6 mois
          </SectionTitle>
          <ActionList items={ai.strategy36} />
        </>
      ) : null}
    </>
  );
}

/* ── Optimisation du profil ──────────────────────────────────────────────── */

function Verdict({ title, score, verdict }: { title: string; score?: number; verdict: string }) {
  // Les verdicts de l'IA sont de longs paragraphes numérotés, parfois suivis de
  // listes : on les éclate pour éviter un pavé de 2 000 signes d'un seul tenant.
  const parts = verdict
    .split(/\n+|(?=\b\d+\.\s)/)
    .map((p) => p.trim())
    .filter(Boolean);
  const [first, ...rest] = parts;
  const renderPart = (p: string, key: number) =>
    p.startsWith("• ") ? (
      <BulletRow key={key}>{p.slice(2)}</BulletRow>
    ) : (
      <Paragraph key={key} style={{ fontSize: size.small, color: color.muted, marginBottom: 4 }}>
        {p}
      </Paragraph>
    );

  return (
    <View style={{ marginBottom: 8 }}>
      {/* Titre et premier paragraphe solidaires : seul, le titre restait en bas
          de page pendant que son texte ouvrait la suivante. */}
      <View wrap={false}>
        <View style={{ flexDirection: "row", alignItems: "baseline", marginBottom: 4 }}>
          <Text style={{ fontFamily: font.sans, fontWeight: 700, fontSize: size.h3, color: color.ink }}>
            {title}
          </Text>
          {score !== undefined ? (
            <Text style={[s.verdictScore, { marginLeft: 10 }]}>{score}/10</Text>
          ) : null}
        </View>
        {first ? renderPart(first, 0) : null}
      </View>
      {rest.map((p, i) => (
        <View key={i + 1} minPresenceAhead={38}>
          {renderPart(p, i + 1)}
        </View>
      ))}
    </View>
  );
}

export function BrandingSection({ model }: { model: ReportModel }) {
  const ai = model.ai;
  if (!ai) return null;
  const hasAny =
    ai.bioOptimized.length || ai.hashtagStrategy || ai.profilePhoto || ai.gridVisual;
  if (!hasAny) return null;

  return (
    <>
      <SectionTitle newPage subtitle="Ta description, tes mots-clés, ta photo et l'allure générale de ton profil.">
        Améliorer ton profil
      </SectionTitle>

      {/* Bloc volontairement dense : ce sont trois lignes courtes, elles n'ont
          pas besoin de la respiration d'une carte pleine. */}
      {ai.bioOptimized.length ? (
        <View style={{ marginBottom: 8 }}>
          <SubTitle tight minAhead={150}>
            Propositions pour ta description de profil
          </SubTitle>
          {ai.bioOptimized.map((b, i) => (
            <View
              key={i}
              style={{
                backgroundColor: color.creamDark,
                borderRadius: 5,
                paddingVertical: 5,
                paddingHorizontal: 10,
                marginBottom: 3,
              }}
              wrap={false}
              minPresenceAhead={30}
            >
              <Text style={{ fontFamily: font.sans, fontSize: size.body, color: color.ink, lineHeight: 1.3 }}>
                {b}
              </Text>
            </View>
          ))}
        </View>
      ) : null}

      {ai.hashtagStrategy ? (
        <View style={{ marginBottom: 8 }}>
          <SubTitle tight minAhead={150}>
            Quels mots-clés (hashtags) utiliser
          </SubTitle>
          {ai.hashtagStrategy.strategy ? (
            <Paragraph style={{ fontSize: size.small, color: color.muted }}>
              {ai.hashtagStrategy.strategy}
            </Paragraph>
          ) : null}
          {ai.hashtagStrategy.suggested.length ? (
            <View style={{ marginTop: 6 }}>
              <Label>À tester</Label>
              <ChipRow>
                {ai.hashtagStrategy.suggested.map((h) => (
                  <Chip key={h} tone={color.gold} filled>
                    {h}
                  </Chip>
                ))}
              </ChipRow>
            </View>
          ) : null}
        </View>
      ) : null}

      {ai.profilePhoto ? (
        <Verdict title="Photo de profil" score={ai.profilePhoto.score} verdict={ai.profilePhoto.verdict} />
      ) : null}
      {ai.gridVisual ? (
        <Verdict title="L'allure générale de ton profil" score={ai.gridVisual.score} verdict={ai.gridVisual.verdict} />
      ) : null}
    </>
  );
}
