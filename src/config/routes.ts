import {
  ROUTE_MANIFEST,
  type CsrRouteManifestEntry,
  type RedirectRouteManifestEntry,
  type SsgRouteManifestEntry,
} from "./seo";

/** Toutes les vues et règles de rendu dérivent du même manifeste typé. */
export const SSG_ROUTES = ROUTE_MANIFEST.filter(
  (route): route is SsgRouteManifestEntry => route.render === "ssg",
);

export const CLIENT_ONLY_ROUTES = ROUTE_MANIFEST.filter(
  (route): route is CsrRouteManifestEntry => route.render === "csr",
);

export const REDIRECT_ROUTES = ROUTE_MANIFEST.filter(
  (route): route is RedirectRouteManifestEntry => route.render === "redirect",
);

export const CLIENT_ONLY_ROUTE_PATTERNS = CLIENT_ONLY_ROUTES.map((route) => route.path);
export const LEGACY_REDIRECTS = REDIRECT_ROUTES.map((route) => ({
  from: route.path,
  to: route.redirectTo,
  status: route.status,
}));

export function normalizePathname(pathname: string): string {
  const normalized = pathname.replace(/\/{2,}/g, "/").replace(/\/$/, "");
  return normalized || "/";
}

function matchesPattern(pathname: string, pattern: string): boolean {
  const path = normalizePathname(pathname);
  const normalizedPattern = normalizePathname(pattern);
  const pathSegments = path.split("/");
  const patternSegments = normalizedPattern.split("/");

  if (pathSegments.length !== patternSegments.length) return false;

  return patternSegments.every(
    (segment, index) => segment.startsWith(":") || segment === pathSegments[index],
  );
}

export function manifestRouteForPath(pathname: string) {
  return ROUTE_MANIFEST.find((route) => matchesPattern(pathname, route.path));
}

/**
 * Ces paramètres changent le premier écran (retour de paiement ou démarrage
 * accéléré). Le document canonique reste SSG, mais cette visite repart en CSR.
 */
export function isClientOnlyQueryVariant(url: URL): boolean {
  const pathname = normalizePathname(url.pathname);

  if (pathname === "/wavacademy") {
    return url.searchParams.get("success") === "true" || url.searchParams.get("test") === "1";
  }

  if (pathname === "/analyse-express") {
    return url.searchParams.get("test") === "1";
  }

  return pathname === "/start" && url.searchParams.get("go") === "1";
}

export function isClientOnlyPath(pathname: string): boolean {
  return CLIENT_ONLY_ROUTES.some((route) => matchesPattern(pathname, route.path));
}
