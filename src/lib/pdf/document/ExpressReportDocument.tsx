import { Document, Page, StyleSheet } from "@react-pdf/renderer";

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
import { hasActionPlan, hasBranding, hasStrengths } from "../report-model";
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
  // Des groupes de contenu paginables remplacent les anciens
  // `break` : une `<Page>` démarre à froid par construction, sans dépendre de
  // l'algorithme de pagination — donc sans le risque de boucle infinie qu'un
  // saut forcé en première position déclenchait.
  const chrome = (
    <PageHeader username={model.meta.username} dateLabel={model.meta.generatedAtLabel} />
  );

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
        {chrome}
        <SummarySection model={model} />
        <HealthSection model={model} />
        <StatsSection model={model} />
        <PublicationSection model={model} />
        <TopVideosSection model={model} />
        <PageFooter />
      </Page>

      {/* Recommandations : un groupe fluide évite les pages presque vides.
          Les gardes évitent d'émettre une page blanche
          quand l'IA n'a rien renvoyé pour un bloc. */}
      {hasStrengths(model) || hasActionPlan(model) || hasBranding(model) ? (
        <Page size="A4" style={s.page} wrap>
          {chrome}
          {hasStrengths(model) && <StrengthsSection model={model} />}
          {hasActionPlan(model) && <ActionPlanSection model={model} />}
          {hasBranding(model) && <BrandingSection model={model} />}
          <PageFooter />
        </Page>
      ) : null}

      <CtaPage model={model} />
    </Document>
  );
}
