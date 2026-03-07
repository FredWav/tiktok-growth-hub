import { useEffect } from "react";
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

// Public pages
import Home from "./pages/Home";
import Offres from "./pages/Offres";
import QuarantecinqJours from "./pages/QuarantecinqJours";
import VipCheckout from "./pages/VipCheckout";
import OneShot from "./pages/OneShot";
import OneShotSuccess from "./pages/OneShotSuccess";
import APropos from "./pages/APropos";
import Preuves from "./pages/Preuves";
import Contact from "./pages/Contact";
import Auth from "./pages/Auth";
import ResetPassword from "./pages/ResetPassword";
import MentionsLegales from "./pages/MentionsLegales";
import PolitiqueConfidentialite from "./pages/PolitiqueConfidentialite";
import CGV from "./pages/CGV";
import NotFound from "./pages/NotFound";
import AnalyseExpress from "./pages/AnalyseExpress";
import AnalyseExpressResult from "./pages/AnalyseExpressResult";
import WavPremiumApplication from "./pages/WavPremiumApplication";
import DiagnosticStart from "./pages/DiagnosticStart";
import DiagnosticProcessing from "./pages/DiagnosticProcessing";
import DiagnosticResult from "./pages/DiagnosticResult";
import { DiagnosticProvider } from "./contexts/DiagnosticContext";

// Admin pages
import AdminDashboard from "./pages/admin/Dashboard";
import AdminClients from "./pages/admin/Clients";
import AdminClientNew from "./pages/admin/ClientNew";
import AdminClientDetail from "./pages/admin/ClientDetail";
import AdminSessions from "./pages/admin/Sessions";
import AdminBookings from "./pages/admin/Bookings";
import AdminDeliverables from "./pages/admin/Deliverables";
import AdminTemplates from "./pages/admin/Templates";
import AdminSettings from "./pages/admin/Settings";
import AdminExpressAnalyses from "./pages/admin/ExpressAnalyses";
import AdminApplications from "./pages/admin/Applications";
import AdminDiagnostics from "./pages/admin/Diagnostics";
import AdminMarketing from "./pages/admin/Marketing";

// Client pages
import ClientDashboard from "./pages/client/ClientDashboard";
import ClientPlan from "./pages/client/ClientPlan";
import ClientDeliverables from "./pages/client/ClientDeliverables";
import ClientSessions from "./pages/client/ClientSessions";

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
            <Route path="/analyse-express" element={<AnalyseExpress />} />
            <Route path="/analyse-express/result" element={<AnalyseExpressResult />} />
            <Route path="/wav-premium/candidature" element={<WavPremiumApplication />} />

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
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
