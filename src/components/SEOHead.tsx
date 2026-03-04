import { useEffect } from "react";

interface SEOHeadProps {
  title: string;
  description: string;
  path: string;
  keywords?: string;
  noindex?: boolean;
  schema?: Record<string, unknown> | Record<string, unknown>[];
}

const BASE_URL = "https://fredwav.com";

export function SEOHead({ title, description, path, keywords, noindex, schema }: SEOHeadProps) {
  useEffect(() => {
    document.title = title;

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
    if (keywords) setMeta("keywords", keywords);
    setMeta("robots", noindex ? "noindex, nofollow" : "index, follow");
    setMeta("og:title", title, "property");
    setMeta("og:description", description, "property");
    setMeta("og:url", `${BASE_URL}${path}`, "property");
    setMeta("og:type", "website", "property");
    setMeta("og:locale", "fr_FR", "property");
    setMeta("og:site_name", "Fred Wav", "property");
    setMeta("og:image", "https://lovable.dev/opengraph-image-p98pqg.png", "property");
    setMeta("og:image:alt", "Fred Wav - Expert Stratégie TikTok", "property");
    setMeta("twitter:card", "summary_large_image");
    setMeta("twitter:title", title);
    setMeta("twitter:description", description);
    setMeta("twitter:site", "@FredWav");
    setMeta("twitter:image", "https://lovable.dev/opengraph-image-p98pqg.png");

    // Canonical
    let canonical = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
    if (!canonical) {
      canonical = document.createElement("link");
      canonical.setAttribute("rel", "canonical");
      document.head.appendChild(canonical);
    }
    canonical.setAttribute("href", `${BASE_URL}${path}`);

    // Hreflang
    let hreflang = document.querySelector('link[hreflang="fr-FR"]') as HTMLLinkElement | null;
    if (!hreflang) {
      hreflang = document.createElement("link");
      hreflang.setAttribute("rel", "alternate");
      hreflang.setAttribute("hreflang", "fr-FR");
      document.head.appendChild(hreflang);
    }
    hreflang.setAttribute("href", `${BASE_URL}${path}`);

    // JSON-LD schema injection
    const schemaScripts: HTMLScriptElement[] = [];
    if (schema) {
      const schemas = Array.isArray(schema) ? schema : [schema];
      schemas.forEach((s) => {
        const script = document.createElement("script");
        script.type = "application/ld+json";
        script.text = JSON.stringify(s);
        document.head.appendChild(script);
        schemaScripts.push(script);
      });
    }

    return () => {
      schemaScripts.forEach((s) => {
        if (s.parentNode) s.parentNode.removeChild(s);
      });
    };
  }, [title, description, path, keywords, schema]);

  return null;
}
