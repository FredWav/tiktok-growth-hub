import { lazy, Suspense, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import ScrollToTop from "@/components/ScrollToTop";
import { CookieConsent } from "@/components/CookieConsent";
import { capturePageview } from "@/lib/posthog";
import { captureUtmParams } from "@/lib/tracking";
import { trackPageView, setupBeforeUnloadTracking } from "@/lib/page-tracker";
import { DiagnosticProvider } from "./contexts/DiagnosticContext";

function PostHogPageTracker() {
  const location = useLocation();
  useEffect(() => {
    capturePageview();
    trackPageView(location.pathname);
  }, [location.pathname]);
  useEffect(() => {
    captureUtmParams();
    setupBeforeUnloadTracking();
  }, []);
  return null;
}

// Home importée statiquement — critique path pour le FCP
import Home from "./pages/Home";

// Autres pages - lazy loaded
const Offres = lazy(() => import("./pages/Offres"));
const QuarantecinqJours = lazy(() => import("./pages/QuarantecinqJours"));
const VipCheckout = lazy(() => import("./pages/VipCheckout"));
const OneShot = lazy(() => import("./pages/OneShot"));
const OneShotSuccess = lazy(() => import("./pages/OneShotSuccess"));
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
const WavPremiumApplication = lazy(() => import("./pages/WavPremiumApplication"));
const DiagnosticStart = lazy(() => import("./pages/DiagnosticStart"));
const DiagnosticProcessing = lazy(() => import("./pages/DiagnosticProcessing"));
const DiagnosticResult = lazy(() => import("./pages/DiagnosticResult"));
const Mail = lazy(() => import("./pages/Mail"));

// Admin pages - lazy loaded
const AdminDashboard = lazy(() => import("./pages/admin/Dashboard"));
const AdminClients = lazy(() => import("./pages/admin/Clients"));
const AdminClientNew = lazy(() => import("./pages/admin/ClientNew"));
const AdminClientDetail = lazy(() => import("./pages/admin/ClientDetail"));
const AdminSessions = lazy(() => import("./pages/admin/Sessions"));
const AdminBookings = lazy(() => import("./pages/admin/Bookings"));
const AdminDeliverables = lazy(() => import("./pages/admin/Deliverables"));
const AdminTemplates = lazy(() => import("./pages/admin/Templates"));
const AdminSettings = lazy(() => import("./pages/admin/Settings"));
const AdminExpressAnalyses = lazy(() => import("./pages/admin/ExpressAnalyses"));
const AdminApplications = lazy(() => import("./pages/admin/Applications"));
const AdminDiagnostics = lazy(() => import("./pages/admin/Diagnostics"));
const AdminMarketing = lazy(() => import("./pages/admin/Marketing"));
const AdminDeepLinks = lazy(() => import("./pages/admin/DeepLinks"));
const AdminTestimonials = lazy(() => import("./pages/admin/Testimonials"));
const GoRedirect = lazy(() => import("./pages/GoRedirect"));

// Client pages - lazy loaded
const ClientDashboard = lazy(() => import("./pages/client/ClientDashboard"));
const ClientPlan = lazy(() => import("./pages/client/ClientPlan"));
const ClientDeliverables = lazy(() => import("./pages/client/ClientDeliverables"));
const ClientSessions = lazy(() => import("./pages/client/ClientSessions"));

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <CookieConsent />
        <ScrollToTop />
        <PostHogPageTracker />
        <DiagnosticProvider>
        <AuthProvider>
          <Suspense fallback={null}>
          <Routes>
            {/* Public routes */}
            <Route path="/" element={<Home />} />
            <Route path="/offres" element={<Offres />} />
            <Route path="/45-jours" element={<QuarantecinqJours />} />
            <Route path="/offres/45-jours" element={<QuarantecinqJours />} />
            <Route path="/offres/vip" element={<VipCheckout />} />
            <Route path="/one-shot" element={<OneShot />} />
            <Route path="/one-shot/success" element={<OneShotSuccess />} />
            <Route path="/a-propos" element={<APropos />} />
            <Route path="/preuves" element={<Preuves />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/auth/reset-password" element={<ResetPassword />} />
            <Route path="/mentions-legales" element={<MentionsLegales />} />
            <Route path="/politique-de-confidentialite" element={<PolitiqueConfidentialite />} />
            <Route path="/cgv" element={<CGV />} />
            <Route path="/mail" element={<Mail />} />
            <Route path="/analyse-express" element={<AnalyseExpress />} />
            <Route path="/analyse-express/result" element={<AnalyseExpressResult />} />
            <Route path="/wav-premium/candidature" element={<WavPremiumApplication />} />

            {/* Deep link redirect */}
            <Route path="/go/:slug" element={<GoRedirect />} />

            {/* Diagnostic funnel - wrapped outside Routes for shared state */}
            <Route path="/start" element={<DiagnosticStart />} />
            <Route path="/processing" element={<DiagnosticProcessing />} />
            <Route path="/result" element={<DiagnosticResult />} />

            {/* Admin routes */}
            <Route
              path="/admin"
              element={
                <ProtectedRoute requiredRole="admin">
                  <AdminDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/clients"
              element={
                <ProtectedRoute requiredRole="admin">
                  <AdminClients />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/clients/new"
              element={
                <ProtectedRoute requiredRole="admin">
                  <AdminClientNew />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/clients/:id"
              element={
                <ProtectedRoute requiredRole="admin">
                  <AdminClientDetail />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/sessions"
              element={
                <ProtectedRoute requiredRole="admin">
                  <AdminSessions />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/bookings"
              element={
                <ProtectedRoute requiredRole="admin">
                  <AdminBookings />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/deliverables"
              element={
                <ProtectedRoute requiredRole="admin">
                  <AdminDeliverables />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/templates"
              element={
                <ProtectedRoute requiredRole="admin">
                  <AdminTemplates />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/settings"
              element={
                <ProtectedRoute requiredRole="admin">
                  <AdminSettings />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/analyses"
              element={
                <ProtectedRoute requiredRole="admin">
                  <AdminExpressAnalyses />
                </ProtectedRoute>
              }
            />

            <Route
              path="/admin/applications"
              element={
                <ProtectedRoute requiredRole="admin">
                  <AdminApplications />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/diagnostics"
              element={
                <ProtectedRoute requiredRole="admin">
                  <AdminDiagnostics />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/marketing"
              element={
                <ProtectedRoute requiredRole="admin">
                  <AdminMarketing />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/deep-links"
              element={
                <ProtectedRoute requiredRole="admin">
                  <AdminDeepLinks />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/testimonials"
              element={
                <ProtectedRoute requiredRole="admin">
                  <AdminTestimonials />
                </ProtectedRoute>
              }
            />

            {/* Client routes */}
            <Route
              path="/app"
              element={
                <ProtectedRoute requiredRole="client">
                  <ClientDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/app/plan"
              element={
                <ProtectedRoute requiredRole="client">
                  <ClientPlan />
                </ProtectedRoute>
              }
            />
            <Route
              path="/app/deliverables"
              element={
                <ProtectedRoute requiredRole="client">
                  <ClientDeliverables />
                </ProtectedRoute>
              }
            />
            <Route
              path="/app/sessions"
              element={
                <ProtectedRoute requiredRole="client">
                  <ClientSessions />
                </ProtectedRoute>
              }
            />

            {/* 404 */}
            <Route path="*" element={<NotFound />} />
          </Routes>
          </Suspense>
        </AuthProvider>
        </DiagnosticProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
