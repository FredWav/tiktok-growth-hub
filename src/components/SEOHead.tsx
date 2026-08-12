import { useEffect } from "react";
import { BASE_URL, OG_IMAGE, type RouteSeo } from "@/config/seo";

/**
 * Les pages passent `{...seoFor("/wavacademy")}` : les champs qui ne servent
 * qu'au build (noscript, sitemap, llms) sont acceptés puis ignorés ici.
 * title / description / path restent surchargeables pour les états dynamiques
 * (succès de paiement, branches du formulaire de candidature…).
 */
type SEOHeadProps = Partial<Omit<RouteSeo, "path" | "title" | "description" | "canonical" | "noindex">> & {
  title: string;
  description: string;
  path: string;
  canonical?: string | false;
  noindex?: boolean;
};

export function SEOHead({ title, description, path, canonical, noindex, schema, ogType = "website" }: SEOHeadProps) {
  useEffect(() => {
    document.title = title;
    const resolvedUrl = canonical === false ? `${BASE_URL}${path}` : canonical ?? `${BASE_URL}${path}`;

    const setMeta = (name: string, content: string, attr = "name") => {
      let el = document.querySelector(`meta[${attr}="${name}"]`) as HTMLMetaElement | null;
      if (!el) {
        el = document.createElement("meta");
        el.setAttribute(attr, name);
        document.head.appendChild(el);
      }
      el.setAttribute("content", content);
    };

    setMeta("description", description);
    document.querySelector('meta[name="keywords"]')?.remove();
    setMeta("robots", noindex ? "noindex, nofollow" : "index, follow");
    setMeta("og:title", title, "property");
    setMeta("og:description", description, "property");
    setMeta("og:url", resolvedUrl, "property");
    setMeta("og:type", ogType, "property");
    setMeta("og:locale", "fr_FR", "property");
    setMeta("og:site_name", "Fred Wav", "property");
    setMeta("og:image", OG_IMAGE, "property");
    setMeta("og:image:alt", "Fred Wav - Stratégie réseaux sociaux et contenus", "property");
    setMeta("twitter:card", "summary_large_image");
    setMeta("twitter:title", title);
    setMeta("twitter:description", description);
    setMeta("twitter:site", "@FredWav");
    setMeta("twitter:image", OG_IMAGE);

    // Canonical
    let canonicalLink = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
    if (canonical === false) {
      canonicalLink?.remove();
    } else {
      if (!canonicalLink) {
        canonicalLink = document.createElement("link");
        canonicalLink.setAttribute("rel", "canonical");
        document.head.appendChild(canonicalLink);
      }
      canonicalLink.setAttribute("href", resolvedUrl);
    }

    // Hreflang
    let hreflang = document.querySelector('link[hreflang="fr-FR"]') as HTMLLinkElement | null;
    if (canonical === false || noindex) {
      hreflang?.remove();
    } else {
      if (!hreflang) {
        hreflang = document.createElement("link");
        hreflang.setAttribute("rel", "alternate");
        hreflang.setAttribute("hreflang", "fr-FR");
        document.head.appendChild(hreflang);
      }
      hreflang.setAttribute("href", resolvedUrl);
    }

    // Le build SSG et le runtime partagent ce marqueur. On remplace toujours le
    // schéma de route précédent afin qu'une navigation SPA ne conserve jamais
    // le JSON-LD de la page d'atterrissage.
    document.querySelectorAll('script[data-seo-route-schema="true"]').forEach((script) => script.remove());

    const schemaScripts: HTMLScriptElement[] = [];
    if (schema && !noindex) {
      const script = document.createElement("script");
      script.type = "application/ld+json";
      script.dataset.seoRouteSchema = "true";
      script.text = JSON.stringify(schema);
      document.head.appendChild(script);
      schemaScripts.push(script);
    }

    return () => {
      schemaScripts.forEach((s) => {
        if (s.parentNode) s.parentNode.removeChild(s);
      });
    };
  }, [title, description, path, canonical, schema, noindex, ogType]);

  return null;
}
