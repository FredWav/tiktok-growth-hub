import { Link, useLocation } from "react-router-dom";

/** Sous-pages d'une rubrique de l'admin, affichées en onglets sous le titre. */
export function AdminTabs({ items }: { items: { href: string; label: string }[] }) {
  const { pathname } = useLocation();
  return (
    <nav aria-label="Sous-rubriques" className="flex flex-wrap gap-2 border-b border-primary/20 pb-3 mb-6">
      {items.map((item) => {
        const active = pathname === item.href;
        return (
          <Link
            key={item.href}
            to={item.href}
            aria-current={active ? "page" : undefined}
            className={`min-h-11 inline-flex items-center rounded-lg px-4 text-sm transition-colors ${
              active ? "bg-primary/20 text-primary" : "text-cream/70 hover:bg-primary/10 hover:text-cream"
            }`}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

export const CLIENT_TABS = [
  { href: "/admin/clients", label: "Demandes et commandes" },
  { href: "/admin/clients/historique", label: "Anciennes candidatures" },
  { href: "/admin/clients/consentements", label: "Consentements Academy (archive)" },
];

export const CONTENT_TABS = [
  { href: "/admin/contenus", label: "Témoignages" },
  { href: "/admin/contenus/offres", label: "Offres et places" },
  { href: "/admin/contenus/liens", label: "Liens de campagne" },
];
