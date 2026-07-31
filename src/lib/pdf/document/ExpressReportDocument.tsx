import { Document, Page, StyleSheet, View } from "@react-pdf/renderer";

import { PageFooter, PageHeader } from "./chrome";
import { color, page } from "./theme";
import { CoverPage } from "./sections/CoverPage";
import { CtaPage } from "./sections/CtaPage";
import {
  ActionPlanSection,
  BrandingSection,
  HealthSection,
  PublicationSection,
  StatsSection,
  StrengthsSection,
  SummarySection,
  TopVideosSection,
} from "./sections/ContentSections";
import type { ReportModel } from "../report-model";

const s = StyleSheet.create({
  page: {
    backgroundColor: color.cream,
    paddingTop: page.paddingTop,
    paddingBottom: page.paddingBottom,
    paddingHorizontal: page.paddingHorizontal,
  },
});

export function ExpressReportDocument({ model }: { model: ReportModel }) {
  const hasRecommendations =
    !!model.ai &&
    (model.ai.strengths.length > 0 ||
      model.ai.improvements.length > 0 ||
      model.ai.actionPlan.length > 0 ||
      model.ai.strategy36.length > 0 ||
      model.ai.bioOptimized.length > 0 ||
      !!model.ai.profilePhoto ||
      !!model.ai.gridVisual);

  return (
    <Document
      title={`Analyse Express — @${model.meta.username}`}
      author="Fred Wav"
      subject="Audit TikTok"
      creator="fredwav.com"
      producer="fredwav.com"
      language="fr-FR"
    >
      <CoverPage model={model} />

      {/* Constat : les chiffres. */}
      <Page size="A4" style={s.page} wrap>
        <PageHeader username={model.meta.username} dateLabel={model.meta.generatedAtLabel} />
        <SummarySection model={model} />
        <HealthSection model={model} />
        <StatsSection model={model} />
        <PublicationSection model={model} />
        <TopVideosSection model={model} />
        <PageFooter />
      </Page>

      {/* Recommandations : page neuve, c'est le repère éditorial du rapport. */}
      {hasRecommendations ? (
        <Page size="A4" style={s.page} wrap>
          <PageHeader username={model.meta.username} dateLabel={model.meta.generatedAtLabel} />
          <View>
            <StrengthsSection model={model} />
            <ActionPlanSection model={model} />
            <BrandingSection model={model} />
          </View>
          <PageFooter />
        </Page>
      ) : null}

      <CtaPage model={model} />
    </Document>
  );
}
