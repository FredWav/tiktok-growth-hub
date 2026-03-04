import React from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import {
  LayoutDashboard,
  Users,
  Calendar,
  CreditCard,
  FileText,
  Mail,
  Settings,
  LogOut,
  Menu,
  X,
  Zap,
  ClipboardList,
  Stethoscope,
  BarChart3,
} from "lucide-react";
import { useState } from "react";
import { AdminChatbot } from "@/components/admin/AdminChatbot";

interface AdminLayoutProps {
  children: React.ReactNode;
}

const navItems = [
  { label: "Dashboard", href: "/admin", icon: LayoutDashboard },
  { label: "Clients", href: "/admin/clients", icon: Users },
  { label: "Sessions", href: "/admin/sessions", icon: Calendar },
  { label: "Réservations", href: "/admin/bookings", icon: CreditCard },
  { label: "Livrables", href: "/admin/deliverables", icon: FileText },
  { label: "Templates", href: "/admin/templates", icon: Mail },
  { label: "Analyses Express", href: "/admin/analyses", icon: Zap },
  { label: "Candidatures", href: "/admin/applications", icon: ClipboardList },
  { label: "Diagnostics", href: "/admin/diagnostics", icon: Stethoscope },
  { label: "Marketing", href: "/admin/marketing", icon: BarChart3 },
  { label: "Paramètres", href: "/admin/settings", icon: Settings },
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
        <h1 className="font-display text-xl text-primary">Admin</h1>
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
          <h1 className="font-display text-2xl text-primary">Admin Panel</h1>
          <p className="text-cream/60 text-sm mt-1 truncate">{user?.email}</p>
        </div>

        <nav className="px-4 space-y-1">
          {navItems.map((item) => {
            const isActive = location.pathname === item.href;
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

      {/* Admin Chatbot */}
      <AdminChatbot />
    </div>
  );
};
