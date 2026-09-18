import {
  Home,
  Bell,
  Sparkles,
  BarChart3,
  ClipboardList,
  Settings,
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
};

export default function MobileBottomNav({
  activePage,
  onNavigate,
}) {
  const { role } = useApp();

  const visibleItems = NAV_ITEMS.filter((item) =>
    item.roles.includes(role.id)
  );

  const preferredOrder = [
    "home",
    "alerts",
    "chat",
    "dashboards",
    "plans",
    "admin",
  ];

  const mobileItems = preferredOrder
    .map((id) =>
      visibleItems.find(
        (item) => item.id === id
      )
    )
    .filter(Boolean)
    .slice(0, 4);

  return (
    <nav className="mobile-bottom-nav">

      {mobileItems.map((item) => {

        const Icon = ICONS[item.icon];

        return (
          <button
            key={item.id}
            className={`mobile-nav-item ${
              activePage === item.id
                ? "active"
                : ""
            }`}
            onClick={() =>
              onNavigate(item.id)
            }
          >

            <Icon size={21} />

            <span>
              {item.label}
            </span>

          </button>
        );
      })}

    </nav>
  );
}