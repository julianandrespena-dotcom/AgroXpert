import {
  Home,
  Bell,
  ClipboardList,
} from "lucide-react";

export default function TabletMayordomoNav({
  activePage,
  onNavigate,
}) {
  const items = [
    {
      id: "home",
      label: "Inicio",
      icon: Home,
    },
    {
      id: "alerts",
      label: "Alertas",
      icon: Bell,
    },
    {
      id: "plans",
      label: "Registro de labores",
      icon: ClipboardList,
    },
  ];

  return (
    <nav
      className="tablet-mayordomo-nav"
      aria-label="Navegación de Mayordomo"
    >
      {items.map((item) => {
        const Icon = item.icon;

        return (
          <button
            key={item.id}
            type="button"
            className={`tablet-mayordomo-nav-item ${
              activePage === item.id
                ? "active"
                : ""
            }`}
            onClick={() =>
              onNavigate(item.id)
            }
          >
            <Icon
              size={22}
              strokeWidth={2}
            />

            <span>
              {item.label}
            </span>
          </button>
        );
      })}
    </nav>
  );
}
