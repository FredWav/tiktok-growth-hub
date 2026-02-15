import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";

// Public pages
import Home from "./pages/Home";
import Offres from "./pages/Offres";
import VipCheckout from "./pages/VipCheckout";
import OneShot from "./pages/OneShot";
import OneShotSuccess from "./pages/OneShotSuccess";
import APropos from "./pages/APropos";
import Preuves from "./pages/Preuves";
import Contact from "./pages/Contact";
import Auth from "./pages/Auth";
import ResetPassword from "./pages/ResetPassword";
import NotFound from "./pages/NotFound";

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
        <AuthProvider>
          <Routes>
            {/* Public routes */}
            <Route path="/" element={<Home />} />
            <Route path="/offres" element={<Offres />} />
            <Route path="/offres/45-jours" element={<Offres />} />
            <Route path="/offres/vip" element={<VipCheckout />} />
            <Route path="/one-shot" element={<OneShot />} />
            <Route path="/one-shot/success" element={<OneShotSuccess />} />
            <Route path="/a-propos" element={<APropos />} />
            <Route path="/preuves" element={<Preuves />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/auth/reset-password" element={<ResetPassword />} />

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
