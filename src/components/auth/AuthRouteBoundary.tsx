import { Outlet } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";

/** Chargé uniquement lorsque l'URL a réellement besoin d'une session Supabase. */
export function AuthProviderOutlet() {
  return (
    <AuthProvider>
      <Outlet />
    </AuthProvider>
  );
}

/** Frontière partagée par toutes les pages d'administration protégées. */
export function AdminProtectedOutlet() {
  return (
    <AuthProvider>
      <ProtectedRoute requiredRole="admin">
        <Outlet />
      </ProtectedRoute>
    </AuthProvider>
  );
}
