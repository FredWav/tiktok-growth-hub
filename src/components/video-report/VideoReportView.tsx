import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import type { VideoReport } from "../../../supabase/functions/_shared/video-report";
import { accountComparison, fmtNumber, scoreRows, statTiles } from "@/lib/pdf/video/view-model";

/**
 * Affichage web du rapport vidéo. Chaque bloc ne s'affiche que si WavStats a
 * fourni la donnée : rien n'est complété ni inventé côté site.
 */
function Block({ title, subtitle, children }: { title: string; subtitle?: string; children: ReactNode }) {
  return (
    <section className="mt-10">
      <h2 className="font-display text-2xl font-semibold">{title}</h2>
      <div className="mt-2 h-0.5 w-9 bg-primary" />
      {subtitle && <p className="mt-2 text-sm text-muted-foreground">{subtitle}</p>}
      <div className="mt-5 space-y-4">{children}</div>
    </section>
  );
}

const Card = ({ children, className = "" }: { children: ReactNode; className?: string }) => (
  <div className={`rounded-xl border border-border bg-card p-4 sm:p-5 ${className}`}>{children}</div>
);
const Label = ({ children }: { children: ReactNode }) => (
  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{children}</p>
);

function scoreTone(score: number) {
  if (score >= 70) return "bg-emerald-600";
  if (score >= 40) return "bg-amber-600";
  return "bg-red-600";
}

export function VideoReportView({ report, tiktokUrl }: { report: VideoReport; tiktokUrl: string }) {
  const { summary, video, hook, cta, description, thumbnail } = report;
  const tiles = statTiles(report);
  const scores = scoreRows(report);
  const comparison = accountComparison(report);

  return (
    <article>
      <header className="rounded-2xl bg-noir p-6 text-cream sm:p-8">
        <p className="text-xs font-semibold uppercase tracking-widest text-primary">Analyse Vidéo TikTok</p>
        <h1 className="mt-3 font-display text-2xl font-semibold leading-snug sm:text-3xl">
          {video.author ? `La vidéo de @${video.author}` : "Ton analyse vidéo"}
        </h1>
        {video.description && <p className="mt-2 line-clamp-3 text-sm text-cream/70">{video.description}</p>}
        <a href={tiktokUrl} target="_blank" rel="noopener noreferrer" className="mt-3 inline-block break-all text-xs text-primary underline underline-offset-2">
          Voir la vidéo sur TikTok
        </a>
        {summary.overallScore != null && (
          <div className="mt-6 flex items-end gap-2">
            <span className="font-display text-5xl font-semibold text-primary">{summary.overallScore}</span>
            <span className="pb-1.5 text-sm text-cream/70">/ 100 · score global</span>
          </div>
        )}
      </header>

      <Block title="En résumé">
        <p className="text-base leading-relaxed">{summary.verdict}</p>
        {summary.maturityNotice && (
          <p className="rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900">{summary.maturityNotice}</p>
        )}
        {report.strengths.length > 0 && (
          <div className="grid gap-3 sm:grid-cols-2">
            {report.strengths.map((s) => (
              <Card key={s.title}>
                <Label>Ce qui fonctionne</Label>
                <p className="mt-1 font-medium">{s.title}</p>
                {s.description && <p className="mt-1 text-sm text-muted-foreground">{s.description}</p>}
              </Card>
            ))}
          </div>
        )}
      </Block>

      {tiles.length > 0 && (
        <Block title="Performances" subtitle="Données publiques de la vidéo au moment de l'analyse.">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {tiles.map((t) => (
              <Card key={t.label} className="text-center">
                <p className="text-xl font-semibold">{t.value}</p>
                <Label>{t.label}</Label>
                {t.hint && <p className="mt-1 text-xs text-muted-foreground">{t.hint}</p>}
              </Card>
            ))}
          </div>
          {comparison.length > 0 && (
            <Card>
              <Label>Par rapport au reste du compte</Label>
              <ul className="mt-2 space-y-1 text-sm">
                {comparison.map((line) => <li key={line}>{line}</li>)}
              </ul>
            </Card>
          )}
          {scores.length > 0 && (
            <Card>
              <Label>Scores sur 100</Label>
              <div className="mt-3 space-y-3">
                {scores.map((s) => (
                  <div key={s.label}>
                    <div className="mb-1 flex justify-between text-sm"><span>{s.label}</span><span className="font-semibold">{s.value}</span></div>
                    <div className="h-1.5 rounded-full bg-muted"><div className={`h-1.5 rounded-full ${scoreTone(s.value)}`} style={{ width: `${s.value}%` }} /></div>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </Block>
      )}

      {hook && (
        <Block title="Ton accroche" subtitle={hook.spoken ? "Les premières secondes, telles que tu les prononces." : "Accroche estimée à partir des éléments disponibles (pas de parole exploitable au début)."}>
          {hook.text && (
            <blockquote className="rounded-xl border-l-4 border-primary bg-muted/40 p-4 text-lg font-medium italic">« {hook.text} »</blockquote>
          )}
          {hook.effectiveness && <Card><Label>Ce que ça donne</Label><p className="mt-1 text-sm leading-relaxed">{hook.effectiveness}</p></Card>}
          {hook.improvement && <Card><Label>À améliorer</Label><p className="mt-1 text-sm leading-relaxed">{hook.improvement}</p></Card>}
        </Block>
      )}

      {report.script.length > 0 && (
        <Block title="Structure de la vidéo" subtitle="Ce que tu dis, ce que ça produit, et une réécriture possible.">
          {report.script.map((segment) => (
            <Card key={segment.label}>
              <p className="font-semibold text-primary">{segment.label}</p>
              {segment.quote && <p className="mt-2 text-sm italic text-muted-foreground">« {segment.quote} »</p>}
              {segment.analysis && <p className="mt-2 text-sm leading-relaxed">{segment.analysis}</p>}
              {segment.rewrite && (
                <div className="mt-3 rounded-lg bg-primary/10 p-3">
                  <Label>Réécriture proposée</Label>
                  <p className="mt-1 text-sm font-medium">« {segment.rewrite} »</p>
                </div>
              )}
            </Card>
          ))}
          {report.speech?.wordsPerMinute != null && (
            <p className="text-sm text-muted-foreground">
              Débit : environ {fmtNumber(report.speech.wordsPerMinute)} mots par minute
              {report.speech.startsImmediately === true ? ", parole dès la première seconde." : report.speech.startsImmediately === false ? ", la parole ne démarre pas immédiatement." : "."}
            </p>
          )}
        </Block>
      )}

      {(cta || description || thumbnail) && (
        <Block title="Message et habillage">
          {cta && (cta.verdict || cta.improvement) && (
            <Card>
              <Label>Appel à l'action{cta.hasCta === false ? " · absent" : ""}</Label>
              {cta.verdict && <p className="mt-1 text-sm leading-relaxed">{cta.verdict}</p>}
              {cta.improvement && <p className="mt-2 text-sm font-medium">→ {cta.improvement}</p>}
            </Card>
          )}
          {description && (description.analysis || description.suggestions.length > 0) && (
            <Card>
              <Label>Description</Label>
              {description.analysis && <p className="mt-1 text-sm leading-relaxed">{description.analysis}</p>}
              {description.suggestions.map((s) => <p key={s} className="mt-2 text-sm font-medium">→ {s}</p>)}
              {description.hashtagSuggestions.length > 0 && (
                <p className="mt-3 text-sm text-muted-foreground">Hashtags à tester : {description.hashtagSuggestions.join(" ")}</p>
              )}
            </Card>
          )}
          {thumbnail && (thumbnail.verdict || thumbnail.suggestions.length > 0) && (
            <Card>
              <Label>Couverture</Label>
              {thumbnail.verdict && <p className="mt-1 text-sm leading-relaxed">{thumbnail.verdict}</p>}
              {thumbnail.suggestions.map((s) => <p key={s} className="mt-2 text-sm font-medium">→ {s}</p>)}
            </Card>
          )}
        </Block>
      )}

      {report.actionPlan.length > 0 && (
        <Block title="Si tu devais refaire cette vidéo demain" subtitle="Tes priorités, dans l'ordre.">
          <ol className="space-y-3">
            {report.actionPlan.map((action, index) => (
              <li key={action.title} className="flex gap-4 rounded-xl border border-border bg-card p-4">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary font-semibold text-primary-foreground">{index + 1}</span>
                <div>
                  <p className="font-medium">{action.title}</p>
                  {action.detail && <p className="mt-1 text-sm text-muted-foreground">{action.detail}</p>}
                </div>
              </li>
            ))}
          </ol>
        </Block>
      )}

      <section className="mt-12 rounded-2xl bg-noir p-6 text-cream sm:p-8">
        <h2 className="font-display text-xl font-semibold">Tu veux aller plus loin ?</h2>
        <p className="mt-2 text-sm text-cream/70">
          Cette analyse porte sur une seule vidéo. L'Analyse Express compare jusqu'à 120 vidéos de ton compte pour dégager ce qui marche vraiment chez toi.
        </p>
        <div className="mt-4 flex flex-col gap-3 text-sm sm:flex-row sm:items-center sm:gap-6">
          <Link to="/analyse-express" className="inline-flex justify-center rounded-lg bg-primary px-5 py-3 font-semibold text-primary-foreground">
            Analyser tout mon compte
          </Link>
          <a href="https://wavstats.com" target="_blank" rel="noopener noreferrer" className="text-primary underline underline-offset-2">
            Suivre mes contenus avec WavStats
          </a>
        </div>
      </section>
      <p className="mt-6 text-center text-xs text-muted-foreground">
        Analyse automatisée à partir des données publiques de la vidéo, sans relecture individuelle. Aucune garantie de résultat.
      </p>
    </article>
  );
}
