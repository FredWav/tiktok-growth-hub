import React from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import {
  LayoutDashboard,
  CheckSquare,
  FileText,
  Calendar,
  LogOut,
  Menu,
  X,
  User,
} from "lucide-react";
import { useState } from "react";

interface ClientLayoutProps {
  children: React.ReactNode;
}

const navItems = [
  { label: "Mon Espace", href: "/app", icon: LayoutDashboard },
  { label: "Plan d'Action", href: "/app/plan", icon: CheckSquare },
  { label: "Mes Livrables", href: "/app/deliverables", icon: FileText },
  { label: "Mes Rendez-vous", href: "/app/sessions", icon: Calendar },
];

export const ClientLayout: React.FC<ClientLayoutProps> = ({ children }) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const { signOut, user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-noir">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 h-16 bg-noir-light border-b border-primary/20 z-50">
        <div className="h-full max-w-6xl mx-auto px-4 flex items-center justify-between">
          <Link to="/app" className="font-display text-xl text-primary">
            Mon Espace Client
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-6">
            {navItems.map((item) => {
              const isActive = location.pathname === item.href;
              return (
                <Link
                  key={item.href}
                  to={item.href}
                  className={`
                    text-sm transition-colors
                    ${isActive ? "text-primary" : "text-cream/70 hover:text-cream"}
                  `}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="hidden md:flex items-center gap-4">
            <div className="flex items-center gap-2 text-cream/60 text-sm">
              <User className="h-4 w-4" />
              <span className="truncate max-w-[150px]">{user?.email}</span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleSignOut}
              className="text-cream/70 hover:text-cream"
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>

          {/* Mobile menu button */}
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="md:hidden text-cream p-2"
          >
            {menuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </header>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="md:hidden fixed inset-0 top-16 bg-noir-light z-40">
          <nav className="p-4 space-y-2">
            {navItems.map((item) => {
              const isActive = location.pathname === item.href;
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  to={item.href}
                  onClick={() => setMenuOpen(false)}
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
            <button
              onClick={handleSignOut}
              className="flex items-center gap-3 px-4 py-3 rounded-lg text-cream/70 hover:bg-primary/10 hover:text-cream w-full"
            >
              <LogOut className="h-5 w-5" />
              <span>Déconnexion</span>
            </button>
          </nav>
        </div>
      )}

      {/* Main content */}
      <main className="pt-16 min-h-screen">
        <div className="max-w-6xl mx-auto p-6">{children}</div>
      </main>
    </div>
  );
};
