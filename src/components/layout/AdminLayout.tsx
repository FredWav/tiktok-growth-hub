import React from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import {
  Settings,
  LogOut,
  Menu,
  X,
  Zap,
  LayoutDashboard,
  Users,
  FileText,
  BarChart3,
} from "lucide-react";
import { useState } from "react";

interface AdminLayoutProps {
  children: React.ReactNode;
}

// Menu organisé par tâche ; chaque rubrique regroupe ses sous-pages (onglets).
const navItems = [
  { label: "Vue d'ensemble", href: "/admin", icon: LayoutDashboard },
  { label: "Analyses", href: "/admin/analyses", icon: Zap },
  { label: "Clients", href: "/admin/clients", icon: Users },
  { label: "Site et contenus", href: "/admin/contenus", icon: FileText },
  { label: "Statistiques", href: "/admin/statistiques", icon: BarChart3 },
  { label: "Paramètres", href: "/admin/parametres", icon: Settings },
];

export const AdminLayout: React.FC<AdminLayoutProps> = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { signOut, user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-noir">
      {/* Mobile header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-noir-light border-b border-primary/20 z-50 flex items-center justify-between px-4">
        <p className="font-display text-xl text-primary">Admin</p>
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="text-cream p-2"
        >
          {sidebarOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {/* Sidebar */}
      <aside
        className={`
          fixed top-0 left-0 h-full w-64 bg-noir-light border-r border-primary/20 z-40
          transform transition-transform duration-300 lg:translate-x-0
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
        `}
      >
        <div className="p-6">
          <p className="font-display text-2xl text-primary">Admin Fred Wav</p>
          <p className="text-cream/60 text-sm mt-1 truncate">{user?.email}</p>
        </div>

        <nav className="px-4 space-y-1">
          {navItems.map((item) => {
            const isActive = item.href === "/admin"
              ? location.pathname === "/admin"
              : location.pathname.startsWith(item.href);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                to={item.href}
                onClick={() => setSidebarOpen(false)}
                className={`
                  flex items-center gap-3 px-4 py-3 rounded-lg transition-colors
                  ${
                    isActive
                      ? "bg-primary/20 text-primary"
                      : "text-cream/70 hover:bg-primary/10 hover:text-cream"
                  }
                `}
              >
                <Icon className="h-5 w-5" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-primary/20">
          <Button
            variant="ghost"
            className="w-full justify-start text-cream/70 hover:text-cream hover:bg-primary/10"
            onClick={handleSignOut}
          >
            <LogOut className="h-5 w-5 mr-3" />
            Déconnexion
          </Button>
        </div>
      </aside>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-30"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main content */}
      <main className="lg:ml-64 pt-16 lg:pt-0 min-h-screen">
        <div className="p-6 lg:p-8">{children}</div>
      </main>
    </div>
  );
};
