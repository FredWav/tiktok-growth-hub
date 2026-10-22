import { useEffect, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { ArrowRight, Check, ChevronDown } from "lucide-react";
import { Layout } from "@/components/layout/Layout";
import { SEOHead } from "@/components/SEOHead";
import { Section, SectionHeader } from "@/components/ui/section";
import { Button } from "@/components/ui/button";
import { ClientResults } from "@/components/ClientResults";
import { VideoTestimonials } from "@/components/VideoCard";
import { seoFor } from "@/config/seo";
import { ACADEMY_GUIDES_COUNT, ACADEMY_MODULES_COUNT, CREATORS_COUNT, INSTALLMENTS_LABEL, INSTALLMENTS_NOTE, launchLabel, OFFERS, priceLabel } from "@/config/offers";
import { ACADEMY_BOOKING_URL, ACADEMY_CALL_FORMAT } from "@/config/academy-booking";
import { WAVACADEMY_FAQ } from "@/config/wavacademy-faq";
import { trackOfferView } from "@/lib/funnel-events";
import { trackEvent } from "@/lib/tracking";

const offer = OFFERS.academy;

function BookingButton({ position, className = "" }: { position: string; className?: string }) {
  function track() {
    try {
      if (localStorage.getItem("cookie_consent") !== "accepted") return;
    } catch { return; }
    // This records the outbound click only. Google has not confirmed a booking.
    trackEvent("cta_click", { offer: "academy", target: ACADEMY_BOOKING_URL, position, source_page: "/wavacademy" });
    trackEvent("academy_calendar_click", { offer: "academy", position, source_page: "/wavacademy", source: "direct_calendar" });
  }
  return (
    <Button asChild variant="hero" size="lg" className={`min-h-12 h-auto whitespace-normal ${className}`}>
      <a href={ACADEMY_BOOKING_URL} onClick={track}>
        Réserver mon appel <ArrowRight aria-hidden="true" className="ml-2 h-4 w-4 shrink-0" />
      </a>
    </Button>
  );
}

function Price({ detailed = false }: { detailed?: boolean }) {
  return (
    <div className="space-y-1">
      <p className="font-display text-3xl md:text-4xl font-semibold">{priceLabel(offer)} <span className="font-sans text-base font-normal">TTC</span></p>
      <p className="text-sm">Un seul paiement · sans abonnement</p>
      {detailed && <p className="text-sm text-muted-foreground">{launchLabel(offer)}</p>}
    </div>
  );
}

export default function WavAcademy() {
  const [params] = useSearchParams();
  const heroRef = useRef<HTMLDivElement>(null);
  const finalRef = useRef<HTMLDivElement>(null);
  const [sticky, setSticky] = useState(false);

  useEffect(() => {
    // Wait for consent, including when it is given on this page, and count once.
    let viewed = false;
    const capture = () => {
      try {
        if (!viewed && localStorage.getItem("cookie_consent") === "accepted") {
          viewed = true;
          trackOfferView("academy");
        }
      } catch { /* Storage may be unavailable. Booking remains accessible. */ }
    };
    capture();
    if (viewed) return;
    const consentObserver = new MutationObserver(() => { capture(); if (viewed) consentObserver.disconnect(); });
    consentObserver.observe(document.body, { childList: true, subtree: true });
    return () => consentObserver.disconnect();
  }, []);

  useEffect(() => {
    if (typeof IntersectionObserver === "undefined") return;
    const update = () => {
      const hero = heroRef.current?.getBoundingClientRect();
      const last = finalRef.current?.getBoundingClientRect();
      setSticky(Boolean(hero && last && hero.bottom <= 80 && last.top >= window.innerHeight));
    };
    const observer = new IntersectionObserver(update, { rootMargin: "-80px 0px 0px 0px", threshold: 0 });
    if (heroRef.current) observer.observe(heroRef.current);
    if (finalRef.current) observer.observe(finalRef.current);
    return () => observer.disconnect();
  }, []);

  return (
    <div className="pb-24 md:pb-0">
      <Layout variant="landing">
        <SEOHead {...seoFor("/wavacademy")} />
        {params.get("success") === "true" && (
          <p role="status" className="container py-4">Retour du paiement reçu. La confirmation et tes accès arrivent par e-mail après vérification du règlement.</p>
        )}
        <div ref={heroRef}>
          <Section variant="cream" size="md" className="py-8 md:py-16">
            <div className="mx-auto max-w-3xl text-center">
              <p className="mb-4 text-sm font-semibold">Wav Academy · accompagnement collectif payant</p>
              <h1 className="font-display text-4xl md:text-6xl font-semibold tracking-tight">Sais quoi améliorer dans tes prochaines vidéos.</h1>
              <p className="mt-5 text-base md:text-xl text-muted-foreground">
                Une stratégie claire, des retours sur tes contenus et un groupe pour avancer avec Fred.
                Deux lives par semaine, des cours et un suivi sur Discord.
              </p>
              <div className="mt-5 space-y-4">
                <Price />
                <p className="text-sm text-muted-foreground">Accès tant que la Wav Academy existe.</p>
                <BookingButton position="hero" className="w-full sm:w-auto" />
                <p className="text-sm">{ACADEMY_CALL_FORMAT}. Sans engagement.</p>
                <a href="#programme" className="inline-flex min-h-11 items-center gap-2 text-sm underline underline-offset-4">
                  Voir le programme <ChevronDown aria-hidden="true" className="h-4 w-4" />
                </a>
              </div>
            </div>
          </Section>
        </div>

        <Section size="md">
          <div className="mx-auto max-w-3xl">
            <h2 className="font-display text-3xl md:text-4xl font-semibold">Tu publies. Mais tu ne sais pas toujours quoi changer.</h2>
            <p className="mt-4 text-muted-foreground">Les conseils se contredisent. Les vues ne deviennent pas forcément une audience utile. Tes statistiques te donnent des chiffres, sans toujours t'aider à décider.</p>
            <p className="mt-4">Dans l'Academy, tu travailles sur ton projet et tes contenus. L'objectif : comprendre tes choix, organiser tes essais et savoir quoi tester ensuite.</p>
          </div>
          <ol className="mx-auto mt-8 grid max-w-5xl gap-4 md:grid-cols-3">
            {[
              ["Une direction claire", "Tu présentes ton projet et ton objectif. Ta stratégie se construit avec Fred et le collectif."],
              ["Des retours sur le concret", "Tu crées et tu partages tes contenus. Les échanges en live et sur Discord t'aident à repérer les ajustements utiles."],
              ["Des décisions que tu comprends", "Tu apprends à lire tes résultats, à tester une amélioration et à ajuster ta prochaine vidéo."],
            ].map(([title, body], index) => (
              <li key={title} className="rounded-2xl border border-border p-5">
                <span className="text-sm font-semibold text-primary">0{index + 1}</span>
                <h3 className="mt-2 font-display text-xl font-semibold">{title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{body}</p>
              </li>
            ))}
          </ol>
        </Section>

        <Section id="programme" variant="cream" size="md" className="scroll-mt-20">
          <SectionHeader title="Ce que tu retrouves dans l'Academy" subtitle="TikTok, Instagram ou YouTube : un cadre pour apprendre, pratiquer et poser tes questions." className="mb-8 md:mb-10" />
          <div className="mx-auto grid max-w-5xl gap-6 md:grid-cols-2">
            <ul className="space-y-4">
              {offer.includes.map((item) => <li key={item} className="flex gap-3"><Check aria-hidden="true" className="mt-1 h-5 w-5 shrink-0 text-primary" /><span>{item}</span></li>)}
            </ul>
            <div className="space-y-4 rounded-2xl border border-border bg-background p-6">
              <h3 className="font-display text-2xl font-semibold">{ACADEMY_MODULES_COUNT} modules et {ACADEMY_GUIDES_COUNT} guides</h3>
              <p className="text-sm leading-relaxed">Les cours et ressources, avec leurs mises à jour, complètent le travail en live. Tu peux revenir dessus à ton rythme.</p>
              <p className="text-sm leading-relaxed">Les lives de cours ont un replay. Pour les autres lives, tu disposes du résumé. Les lives sont maintenus ou délégués pendant les congés.</p>
              <p className="text-sm leading-relaxed">La stratégie est personnalisée, le suivi reste collectif. Aucun coaching individuel ni crédit WavStats n'est inclus. Les services vendus séparément restent distincts.</p>
              <a href="#tarif" className="inline-flex min-h-11 items-center text-sm underline underline-offset-4">Voir le tarif et les conditions</a>
            </div>
          </div>
        </Section>

        <Section size="md">
          <div className="mx-auto mb-8 max-w-3xl">
            <h2 className="font-display text-3xl md:text-4xl font-semibold">Un regard humain sur ton travail.</h2>
            <p className="mt-4 text-muted-foreground">Je suis Fred, créateur de contenu, formateur et consultant en stratégie réseaux sociaux. Mon travail : t'aider à comprendre tes contenus, lire tes statistiques et choisir tes prochaines actions.</p>
            <p className="mt-3 font-semibold">{CREATORS_COUNT} créateurs accompagnés, toutes offres confondues.</p>

          </div>
          <ClientResults limit={2} offer="academy" />
          <VideoTestimonials offer="academy" limit={2} location="offre_academy" className="mx-auto mt-6 grid max-w-4xl gap-5 md:grid-cols-2" />
        </Section>

        <Section id="reservation" variant="cream" size="md" className="scroll-mt-20">
          <SectionHeader title="De la réservation à tes premiers pas" className="mb-8 md:mb-10" />
          <ol className="mx-auto grid max-w-5xl gap-4 md:grid-cols-2">
            {[
              ["Tu réserves ton appel", "Choisis ton créneau dans Google Agenda. Prépare le lien de ton compte ou quelques mots sur ton projet, et ton objectif principal."],
              ["On échange pendant 30 minutes", "En audio ou en visio selon disponibilité. On vérifie que le collectif correspond à ton projet et on précise ton démarrage. L'appel ne comprend pas d'audit de tes contenus."],
              ["Tu décides de rejoindre l'Academy", "Si tu souhaites t'inscrire, Fred te transmet ton lien personnel. Tu retrouves le prix et la date de démarrage, tu acceptes les modalités, puis tu règles en ligne ou par virement."],
              ["Tu reçois ton accès", "Après confirmation du règlement, tu reçois la confirmation par e-mail, puis ton lien personnel Discord à la date de démarrage. Présente ton projet dans le salon d'accueil : c'est le point de départ du travail."],
            ].map(([title, body], index) => (
              <li key={title} className="rounded-2xl border border-border bg-background p-5">
                <p className="text-sm font-semibold text-primary">0{index + 1}</p>
                <h3 className="mt-2 font-display text-xl font-semibold">{title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{body}</p>
              </li>
            ))}
          </ol>
          <div className="mt-7 text-center">
            <BookingButton position="process" />
            <p className="mt-3 text-sm">La réservation ne t'engage à aucun achat.</p>
            <p className="mx-auto mt-4 max-w-2xl text-sm text-muted-foreground">Pour obtenir de l'aide : Discord en semaine, réponse sous deux jours ouvrés. Si ton e-mail d'accès n'arrive pas, vérifie tes spams puis écris à <a href="mailto:contact@fredwav.com" className="underline">contact@fredwav.com</a>.</p>
          </div>
        </Section>

        <Section size="md">
          <div className="mx-auto grid max-w-4xl gap-8 md:grid-cols-2">
            <div>
              <h2 className="font-display text-2xl font-semibold">C'est pour toi si…</h2>
              <ul className="mt-4 list-disc space-y-3 pl-5">
                <li>Tu publies déjà ou tu as un projet concret à lancer.</li>
                <li>Tu veux un cadre et des retours sur tes vrais contenus.</li>
                <li>Tu es prêt à créer, tester et appliquer entre les lives.</li>
              </ul>
            </div>
            <div>
              <h2 className="font-display text-2xl font-semibold">Ce n'est probablement pas pour toi si…</h2>
              <ul className="mt-4 list-disc space-y-3 pl-5 text-muted-foreground">
                <li>Tu cherches un suivi individuel en tête-à-tête.</li>
                <li>Tu attends une recette virale ou des résultats garantis.</li>
                <li>Tu n'as pas de temps pour créer et publier en ce moment.</li>
              </ul>
            </div>
          </div>
        </Section>

        <Section id="tarif" variant="cream" size="md" className="scroll-mt-20">
          <div id="modalites" className="mx-auto max-w-2xl scroll-mt-24 rounded-2xl border-2 border-primary bg-background p-6 md:p-8">
            <h2 className="mb-4 font-display text-3xl font-semibold">Tarif Wav Academy</h2>
            <Price detailed />
            <p className="mt-5">Le collectif, deux lives par semaine, le suivi Discord, les cours et les ressources : accès tant que la Wav Academy existe.</p>
            <p className="mt-4 text-sm text-muted-foreground">Paiement par carte, {INSTALLMENTS_LABEL} ({INSTALLMENTS_NOTE}), ou par virement. La date de démarrage est précisée avant le paiement.</p>
            <p className="mt-4 text-sm text-muted-foreground">Pour les particuliers, les CGV prévoient 14 jours de rétractation, avec des règles distinctes pour les contenus numériques et le service en cas de démarrage anticipé. Hors droits légaux et manquement du vendeur, un arrêt pour convenance personnelle ne donne pas lieu à remboursement.</p>
            <Link to="/cgv" className="mt-2 inline-flex min-h-11 items-center text-sm underline">Lire les conditions complètes</Link>
            <BookingButton position="terms" className="mt-4 w-full" />
            <p className="mt-3 text-center text-sm">L'appel est sans engagement. Aucun résultat de vues, d'abonnés ou de revenus n'est garanti.</p>
          </div>
        </Section>

        <Section size="md">
          <SectionHeader title="Avant de réserver" className="mb-8 md:mb-10" />
          <div className="mx-auto max-w-3xl space-y-3">
            {WAVACADEMY_FAQ.map((item) => (
              <details key={item.question} className="group rounded-xl border border-border p-4">
                <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-4 font-semibold [&::-webkit-details-marker]:hidden">
                  {item.question}<ChevronDown aria-hidden="true" className="h-5 w-5 shrink-0 group-open:rotate-180" />
                </summary>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{item.answer}</p>
              </details>
            ))}
          </div>
        </Section>

        <div ref={finalRef}>
          <Section variant="cream" size="md">
            <div className="mx-auto max-w-2xl text-center">
              <h2 className="font-display text-3xl font-semibold">Un projet concret, un cadre pour avancer.</h2>
              <p className="mt-4 text-muted-foreground">Travaille tes contenus avec Fred et le collectif : cours, lives et suivi Discord, pour {priceLabel(offer)} TTC en un seul paiement.</p>
              <BookingButton position="final" className="mt-6 w-full sm:w-auto" />
              <p className="mt-3 text-sm">{ACADEMY_CALL_FORMAT}. Réserver ne t'engage à rien.</p>
            </div>
          </Section>
        </div>
        {sticky && (
          <div className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] md:hidden [body:has([data-cookie-consent])_&]:hidden">
            <BookingButton position="mobile_sticky" className="w-full" />
          </div>
        )}
      </Layout>
    </div>
  );
}
