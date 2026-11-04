import {
  Home,
  Bell,
  Sparkles,
  BarChart3,
  ClipboardList,
  Settings,
  Users,
} from "lucide-react";

import { NAV_ITEMS } from "../../data/navigation";
import { useApp } from "../../context/AppContext";

const ICONS = {
  Home,
  Bell,
  Sparkles,
  BarChart3,
  ClipboardList,
  Settings,
  Users,
};

export default function MobileBottomNav({
  activePage,
  onNavigate,
}) {
  const { role } = useApp();

  const visibleItems = role
    ? NAV_ITEMS.filter((item) => item.roles.includes(role.id))
    : [];

  const preferredOrder =
    role?.id === "administrador"
      ? ["admin", "bitacora"]
      : ["home", "alerts", "chat", "dashboards", "plans", "admin-gerente"];

  const mobileItems = preferredOrder
    .map((id) => visibleItems.find((item) => item.id === id))
    .filter(Boolean)
    .slice(0, 5);

  return (
    <nav className="mobile-bottom-nav">
      {mobileItems.map((item) => {
        const Icon = ICONS[item.icon];

        if (!Icon) return null;

        return (
          <button
            key={item.id}
            type="button"
            className={`mobile-nav-item ${
              activePage === item.id ? "active" : ""
            }`}
            onClick={() => onNavigate(item.id)}
          >
            <Icon size={21} />
            <span>{item.label}</span>
          </button>
        );
      })}
    </nav>
  );
}