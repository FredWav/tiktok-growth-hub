import { trackEvent } from "./tracking";

/**
 * Lecture des pages, sans rien à ajouter page par page :
 * - section_view : un intertitre (h2) est réellement arrivé à l'écran, avec le temps
 *   écoulé depuis l'arrivée sur la page : jusqu'où on lit, et à quel rythme ;
 * - faq_open : une question de FAQ (<details>) est ouverte : les doutes qui reviennent.
 * Seul du texte public du site est envoyé (titres, questions), jamais de saisie.
 */
export function setupJourneyTracking(pathname: string): () => void {
  if (typeof window === "undefined" || typeof IntersectionObserver === "undefined") return () => {};
  const arrivedAt = Date.now();
  const seen = new Set<string>();
  const label = (el: Element) => (el.textContent ?? "").replace(/\s+/g, " ").trim().slice(0, 90);

  const observer = new IntersectionObserver((entries) => {
    for (const entry of entries) {
      if (!entry.isIntersecting) continue;
      const section = label(entry.target);
      observer.unobserve(entry.target);
      if (!section || seen.has(section)) continue;
      seen.add(section);
      trackEvent("section_view", {
        section,
        source_page: pathname,
        seconds_on_page: String(Math.round((Date.now() - arrivedAt) / 1000)),
      });
    }
  }, { threshold: 0.6 });

  // Le contenu arrive après le changement de page : on attend qu'il soit affiché.
  const timer = window.setTimeout(() => {
    document.querySelectorAll("main h2").forEach((h) => observer.observe(h));
  }, 800);

  const onToggle = (e: Event) => {
    const details = e.target;
    if (!(details instanceof HTMLDetailsElement) || !details.open) return;
    const summary = details.querySelector("summary");
    if (summary) trackEvent("faq_open", { question: label(summary), source_page: pathname });
  };
  document.addEventListener("toggle", onToggle, true);

  return () => {
    window.clearTimeout(timer);
    observer.disconnect();
    document.removeEventListener("toggle", onToggle, true);
  };
}
