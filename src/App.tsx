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
import { DiagnosticProvider } from "./contexts/DiagnosticContext";

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
const Preuves = lazy(() => import("./pages/Preuves"));
const Contact = lazy(() => import("./pages/Contact"));
const Auth = lazy(() => import("./pages/Auth"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));
const MentionsLegales = lazy(() => import("./pages/MentionsLegales"));
const PolitiqueConfidentialite = lazy(() => import("./pages/PolitiqueConfidentialite"));
const CGV = lazy(() => import("./pages/CGV"));
const NotFound = lazy(() => import("./pages/NotFound"));
const AnalyseExpress = lazy(() => import("./pages/AnalyseExpress"));
const AnalyseExpressResult = lazy(() => import("./pages/AnalyseExpressResult"));
const ReserverUnAppel = lazy(() => import("./pages/ReserverUnAppel"));
const DiagnosticStart = lazy(() => import("./pages/DiagnosticStart"));
const DiagnosticProcessing = lazy(() => import("./pages/DiagnosticProcessing"));
const DiagnosticResult = lazy(() => import("./pages/DiagnosticResult"));
const Mail = lazy(() => import("./pages/Mail"));
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

const SSG_ROUTE_ELEMENTS: Record<string, ReactNode> = {
  "/": <Home />,
  "/wavacademy": <WavAcademy />,
  "/analyse-express": <AnalyseExpress />,
  "/reserverunappel": <ReserverUnAppel />,
  "/preuves": <Preuves />,
  "/hooks-tiktok": <HooksTikTok />,
  "/ressources": <Ressources />,
  "/ressources/statistiques-tiktok": <RessourceStatistiquesTikTok />,
  "/ressources/vues-tiktok": <RessourceVuesTikTok />,
  "/ressources/retention-tiktok": <RessourceRetentionTikTok />,
  "/a-propos": <APropos />,
  "/newsletter": <Mail />,
  "/contact": <Contact />,
  "/cgv": <CGV />,
  "/mentions-legales": <MentionsLegales />,
  "/politique-de-confidentialite": <PolitiqueConfidentialite />,
};

/** Le manifeste décide quelles routes CSR existent ; cette map ne fournit que leur vue. */
const CSR_ROUTE_ELEMENTS: Record<string, ReactNode> = {
  "/start": <DiagnosticStart />,
  "/auth": <Auth />,
  "/auth/reset-password": <ResetPassword />,
  "/admin": <Navigate to="/admin/marketing" replace />,
  "/admin/settings": <AdminSettings />,
  "/admin/analyses": <AdminExpressAnalyses />,
  "/admin/applications": <AdminApplications />,
  "/admin/marketing": <AdminMarketing />,
  "/admin/deep-links": <AdminDeepLinks />,
  "/admin/testimonials": <AdminTestimonials />,
  "/admin/wavacademy-consents": <AdminWavAcademyConsents />,
  "/analyse-express/result": <AnalyseExpressResult />,
  "/processing": <DiagnosticProcessing />,
  "/result": <DiagnosticResult />,
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
      <DiagnosticProvider>
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
                <Route key={from} path={from} element={<Navigate to={to} replace />} />
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
      </DiagnosticProvider>
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
