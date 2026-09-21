import {
  Home,
  Bell,
  Sparkles,
  BarChart3,
  ClipboardList,
  Settings,
  LogOut,
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

export default function Sidebar({
  activePage,
  onNavigate,
  onLogout,
}) {
  const { role } = useApp();

  const visibleItems = NAV_ITEMS.filter((item) =>
    item.roles.includes(role.id)
  );

  return (
    <aside className="sidebar">

      {/* MARCA */}

      <div className="sidebar-brand">

        <div className="brand-mark">
          in
        </div>

        <div>

          <div className="brand-name">
            AgroXpert
          </div>

          <div className="brand-company">
            INCAUCA
          </div>

        </div>

      </div>

      {/* TÍTULO DEL MENÚ */}

      <div className="sidebar-section-title">
        MENÚ PRINCIPAL
      </div>

      {/* NAVEGACIÓN */}

      <nav className="sidebar-nav">

        {visibleItems.map((item) => {

          const Icon = ICONS[item.icon];

          const active =
            activePage === item.id;

          return (
            <button
              key={item.id}
              className={`sidebar-link ${
                active ? "active" : ""
              }`}
              onClick={() =>
                onNavigate(item.id)
              }
            >

              <Icon
                size={19}
                strokeWidth={2}
              />

              <span>
                {item.label}
              </span>

            </button>
          );
        })}

      </nav>

      {/* USUARIO / CERRAR SESIÓN */}

      <div className="sidebar-bottom">

        <div className="sidebar-user">

          <div className="user-avatar">
            {role.initials}
          </div>

          <div className="sidebar-user-info">

            <strong>
              {role.fullName}
            </strong>

            <span>
              {role.name}
            </span>

          </div>

        </div>

        <button
          className="sidebar-logout"
          onClick={onLogout}
        >

          <LogOut size={17} />

          <span>
            Cerrar sesión
          </span>

        </button>

      </div>

    </aside>
  );
}