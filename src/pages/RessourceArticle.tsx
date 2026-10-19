import { Fragment } from "react";
import { Section } from "@/components/ui/section";
import {
  InlineExpressCta,
  InlineVideoCta,
  ResourceArticle,
  type RelatedResource,
} from "@/components/resources/ResourceArticle";
import type { Article } from "@/content/parse-article";
import { resourceByPath, resourcesOfTheme, THEME_BY_SLUG } from "@/content/articles";

const frenchDate = (iso: string) =>
  new Date(`${iso}T12:00:00Z`).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });

/** Liens de fin d'article : ceux choisis par l'auteur, puis le guide du thème et ses autres ressources. */
function relatedOf(article: Article): RelatedResource[] {
  const theme = THEME_BY_SLUG[article.theme];
  const chosen = article.related
    .map((slug) => resourceByPath(`/ressources/${slug}`))
    .filter((r): r is NonNullable<typeof r> => !!r);
  const siblings = resourcesOfTheme(article.theme).filter((r) => r.path !== article.path && !chosen.includes(r));
  const items: RelatedResource[] = [
    { href: `/ressources/${theme.slug}`, title: theme.title, description: theme.description, label: "Guide du thème" },
    ...[...chosen, ...siblings].map((r) => ({ href: r.path, title: r.title, description: r.description })),
  ];
  return items.slice(0, 3);
}

/** Article Markdown (content/ressources/<slug>.md) dans le gabarit des guides. */
export default function RessourceArticlePage({ article }: { article: Article }) {
  const theme = THEME_BY_SLUG[article.theme];
  // Le HTML vient du build (Markdown sans HTML brut, contrôlé par parse-article).
  const parts = article.html.split(/<!--cta:(express|video)-->/);
  return (
    <ResourceArticle
      path={article.path}
      slug={article.slug}
      eyebrow={article.title}
      title={article.title}
      introduction={article.introduction}
      readingTime={`${article.readingMinutes} min`}
      experienceNote={article.experienceNote}
      faq={article.faq}
      related={relatedOf(article)}
      updatedLabel={frenchDate(article.updated)}
      theme={{ href: `/ressources/${theme.slug}`, label: theme.name }}
      cta={theme.tool}
      showReportExtract={false}
      aiAssisted={article.aiAssisted}
      faqTitle="Questions fréquentes"
    >
      <Section variant="default" size="lg">
        <div className="mx-auto max-w-3xl prose prose-lg prose-neutral prose-headings:font-display prose-headings:tracking-tight prose-a:text-primary prose-a:underline-offset-4 prose-img:rounded-xl">
          {parts.map((part, index) =>
            index % 2 === 1 ? (
              <div key={index} className="not-prose">
                {part === "video"
                  ? <InlineVideoCta contentSlug={article.slug} />
                  : <InlineExpressCta contentSlug={article.slug} />}
              </div>
            ) : (
              <Fragment key={index}>
                <div dangerouslySetInnerHTML={{ __html: part }} />
              </Fragment>
            ),
          )}
        </div>
      </Section>
    </ResourceArticle>
  );
}
