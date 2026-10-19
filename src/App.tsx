import { ARTICLES, PUBLISHED_THEMES } from "./content/articles";
import { lazy, Suspense, useEffect, type ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Navigate, Route, Routes, useLocation } from "react-router-dom";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SEOHead } from "@/components/SEOHead";
import ScrollToTop from "@/components/ScrollToTop";
import { CookieConsent } from "@/components/CookieConsent";
import { capturePageview } from "@/lib/posthog";
import { captureUtmParams, syncAttributionToPostHog } from "@/lib/tracking";
import { CLIENT_ONLY_ROUTES, LEGACY_REDIRECTS, SSG_ROUTES, manifestRouteForPath } from "@/config/routes";
import type { ClientBoundary } from "@/config/seo";

function PostHogPageTracker() {
  const location = useLocation();

  useEffect(() => {
    if (localStorage.getItem("cookie_consent") === "accepted") {
      captureUtmParams();
      syncAttributionToPostHog();
      void import("@/lib/page-tracker").then(({ setupBeforeUnloadTracking }) => {
        setupBeforeUnloadTracking();
      });
    }
  }, []);

  useEffect(() => {
    if (location.pathname.startsWith("/inscription/") || location.pathname.startsWith("/claim/") || location.pathname === "/analyse-express/result" || location.pathname === "/analyse-video/rapport" || location.pathname.startsWith("/admin")) return;
    capturePageview();

    if (localStorage.getItem("cookie_consent") === "accepted") {
      void import("@/lib/page-tracker").then(({ trackPageView }) => {
        void trackPageView(location.pathname);
      });
    }
  }, [location.pathname]);

  return null;
}

const Home = lazy(() => import("./pages/Home"));
const APropos = lazy(() => import("./pages/APropos"));
const Temoignages = lazy(() => import("./pages/Temoignages"));
const Analyses = lazy(() => import("./pages/Analyses"));
const Accompagnements = lazy(() => import("./pages/Accompagnements"));
const OneShot = lazy(() => import("./pages/OneShot"));
const Candidature = lazy(() => import("./pages/Candidature"));
const AcademyInscription = lazy(() => import("./pages/AcademyInscription"));
const AcademyMerci = lazy(() => import("./pages/AcademyMerci"));
const Contact = lazy(() => import("./pages/Contact"));
const Auth = lazy(() => import("./pages/Auth"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));
const MentionsLegales = lazy(() => import("./pages/MentionsLegales"));
const PolitiqueConfidentialite = lazy(() => import("./pages/PolitiqueConfidentialite"));
const CGV = lazy(() => import("./pages/CGV"));
const NotFound = lazy(() => import("./pages/NotFound"));
const AnalyseExpress = lazy(() => import("./pages/AnalyseExpress"));
const AnalyseExpressResult = lazy(() => import("./pages/AnalyseExpressResult"));
const AnalyseVideo = lazy(() => import("./pages/AnalyseVideo"));
const AnalyseVideoMerci = lazy(() => import("./pages/AnalyseVideoMerci"));
const AnalyseVideoRapport = lazy(() => import("./pages/AnalyseVideoRapport"));
const WavPremium = lazy(() => import("./pages/WavPremium"));
const Enrollment = lazy(() => import("./pages/Enrollment"));
const AdminCommerce = lazy(() => import("./pages/admin/Commerce"));
const HooksTikTok = lazy(() => import("./pages/HooksTikTok"));
const WavAcademy = lazy(() => import("./pages/WavAcademy"));
const Claim = lazy(() => import("./pages/Claim"));
const GoRedirect = lazy(() => import("./pages/GoRedirect"));
const Ressources = lazy(() => import("./pages/Ressources"));
const RessourceStatistiquesTikTok = lazy(() => import("./pages/RessourceStatistiquesTikTok"));
const RessourceVuesTikTok = lazy(() => import("./pages/RessourceVuesTikTok"));
const RessourceRetentionTikTok = lazy(() => import("./pages/RessourceRetentionTikTok"));
const Retractation = lazy(() => import("./pages/Retractation"));

const AdminSettings = lazy(() => import("./pages/admin/Settings"));
const AdminOverview = lazy(() => import("./pages/admin/Overview"));
const AdminOffersPlaces = lazy(() => import("./pages/admin/OffersPlaces"));
const AdminExpressAnalyses = lazy(() => import("./pages/admin/ExpressAnalyses"));
const AdminApplications = lazy(() => import("./pages/admin/Applications"));
const AdminMarketing = lazy(() => import("./pages/admin/Marketing"));
const AdminDeepLinks = lazy(() => import("./pages/admin/DeepLinks"));
const AdminTestimonials = lazy(() => import("./pages/admin/Testimonials"));
const AdminWavAcademyConsents = lazy(() => import("./pages/admin/WavAcademyConsents"));
const AuthProviderOutlet = lazy(() =>
  import("./components/auth/AuthRouteBoundary").then(({ AuthProviderOutlet: Component }) => ({ default: Component })),
);
const AdminProtectedOutlet = lazy(() =>
  import("./components/auth/AuthRouteBoundary").then(({ AdminProtectedOutlet: Component }) => ({ default: Component })),
);

const DevPdfPreview = import.meta.env.DEV ? lazy(() => import("./pages/dev/PdfPreview")) : null;

const RessourceArticlePage = lazy(() => import("./pages/RessourceArticle"));
const RessourceTheme = lazy(() => import("./pages/RessourceTheme"));

const SSG_ROUTE_ELEMENTS: Record<string, ReactNode> = {
  ...Object.fromEntries(ARTICLES.map((article) => [article.path, <RessourceArticlePage article={article} />])),
  ...Object.fromEntries(PUBLISHED_THEMES.map((theme) => [`/ressources/${theme.slug}`, <RessourceTheme theme={theme} />])),
  "/": <Home />,
  "/wavacademy": <WavAcademy />,
  "/analyse-express": <AnalyseExpress />,
  "/analyse-video": <AnalyseVideo />,
  "/wav-premium": <WavPremium />,
  "/one-shot": <OneShot />,
  "/analyses": <Analyses />,
  "/accompagnements": <Accompagnements />,
  "/temoignages": <Temoignages />,
  "/hooks-tiktok": <HooksTikTok />,
  "/ressources": <Ressources />,
  "/ressources/statistiques-tiktok": <RessourceStatistiquesTikTok />,
  "/ressources/vues-tiktok": <RessourceVuesTikTok />,
  "/ressources/retention-tiktok": <RessourceRetentionTikTok />,
  "/a-propos": <APropos />,
  "/contact": <Contact />,
  "/cgv": <CGV />,
  "/mentions-legales": <MentionsLegales />,
  "/politique-de-confidentialite": <PolitiqueConfidentialite />,
};

/** Le manifeste décide quelles routes CSR existent ; cette map ne fournit que leur vue. */
const CSR_ROUTE_ELEMENTS: Record<string, ReactNode> = {
  "/candidature": <Candidature />,
  "/wavacademy/inscription": <AcademyInscription />,
  "/wavacademy/merci": <AcademyMerci />,
  "/inscription/:token": <Enrollment />,
  "/auth": <Auth />,
  "/auth/reset-password": <ResetPassword />,
  "/admin": <AdminOverview />,
  "/admin/analyses": <AdminExpressAnalyses />,
  "/admin/clients": <AdminCommerce />,
  "/admin/clients/historique": <AdminApplications />,
  "/admin/clients/consentements": <AdminWavAcademyConsents />,
  "/admin/contenus": <AdminTestimonials />,
  "/admin/contenus/offres": <AdminOffersPlaces />,
  "/admin/contenus/liens": <AdminDeepLinks />,
  "/admin/statistiques": <AdminMarketing />,
  "/admin/parametres": <AdminSettings />,
  // Anciennes adresses de l'admin.
  "/admin/commandes": <Navigate to="/admin/clients" replace />,
  "/admin/applications": <Navigate to="/admin/clients/historique" replace />,
  "/admin/wavacademy-consents": <Navigate to="/admin/clients/consentements" replace />,
  "/admin/testimonials": <Navigate to="/admin/contenus" replace />,
  "/admin/deep-links": <Navigate to="/admin/contenus/liens" replace />,
  "/admin/marketing": <Navigate to="/admin/statistiques" replace />,
  "/admin/settings": <Navigate to="/admin/parametres" replace />,
  "/analyse-express/result": <AnalyseExpressResult />,
  "/analyse-video/merci": <AnalyseVideoMerci />,
  "/analyse-video/rapport": <AnalyseVideoRapport />,
  "/claim/error": <Claim />,
  "/claim/:token": <Claim />,
  "/go/:slug": <GoRedirect />,
  "/retractation": <Retractation />,
};

/**
 * Le head de la coquille CSR est déjà `noindex`. Ce composant maintient cette
 * consigne lors des navigations SPA et passe après le head éventuel de la page.
 */
function NoIndexRoute({ children }: { children: ReactNode }) {
  const location = useLocation();
  const route = manifestRouteForPath(location.pathname);

  return (
    <>
      {children}
      <SEOHead
        title={route?.title ?? "Espace privé | Fred Wav"}
        description={route?.description ?? "Cette page fonctionnelle n'est pas destinée aux résultats de recherche."}
        path={location.pathname}
        canonical={route?.canonical ?? false}
        noindex
      />
    </>
  );
}

function CampaignRedirect({ to }: { to: string }) {
  const location = useLocation();
  return <Navigate to={`${to}${location.search}${location.hash}`} replace />;
}

function csrRouteElements(boundary: ClientBoundary) {
  return CLIENT_ONLY_ROUTES.filter((route) => route.clientBoundary === boundary).map((route) => {
    const element = CSR_ROUTE_ELEMENTS[route.path];
    if (!element) {
      throw new Error(`[routes] Aucun composant associé à la route CSR ${route.path}.`);
    }

    return (
      <Route
        key={route.path}
        path={route.path}
        element={<NoIndexRoute>{element}</NoIndexRoute>}
      />
    );
  });
}

function createAppQueryClient() {
  return new QueryClient();
}

export function AppProviders({ queryClient, children }: { queryClient: QueryClient; children: ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        {children}
      </TooltipProvider>
    </QueryClientProvider>
  );
}

/** Arbre partagé par BrowserRouter (client) et StaticRouter (SSG). */
export function AppRouterContent() {
  return (
    <>
      <CookieConsent />
      <ScrollToTop />
      <PostHogPageTracker />
      <>
        <Suspense fallback={null}>
          <Routes>
              {SSG_ROUTES.map((route) => {
                const element = SSG_ROUTE_ELEMENTS[route.path];
                if (!element) {
                  throw new Error(`[routes] Aucun composant associé à la route SSG ${route.path}.`);
                }
                return <Route key={route.path} path={route.path} element={element} />;
              })}

              {LEGACY_REDIRECTS.map(({ from, to }) => (
                <Route key={from} path={from} element={<CampaignRedirect to={to} />} />
              ))}

              {csrRouteElements("none")}
              <Route element={<AuthProviderOutlet />}>{csrRouteElements("auth")}</Route>
              <Route element={<AdminProtectedOutlet />}>{csrRouteElements("admin")}</Route>

              {DevPdfPreview && (
                <Route
                  path="/dev/pdf"
                  element={
                    <NoIndexRoute>
                      <DevPdfPreview />
                    </NoIndexRoute>
                  }
                />
              )}

            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </>
    </>
  );
}

const browserQueryClient = createAppQueryClient();

export default function App() {
  return (
    <AppProviders queryClient={browserQueryClient}>
      <BrowserRouter>
        <AppRouterContent />
      </BrowserRouter>
    </AppProviders>
  );
}
