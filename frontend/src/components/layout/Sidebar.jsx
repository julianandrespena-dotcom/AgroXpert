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

  /*
   * Solo mostramos las opciones
   * permitidas para el rol actual.
   *
   * El administrador por ahora
   * solo tendrá acceso a Administración.
   */
  const visibleItems =
    role
      ? NAV_ITEMS.filter((item) => {
          if (role.id === "administrador") {
            return item.id === "admin";
          }

          return item.roles.includes(role.id);
        })
      : [];

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
            Gerencia de Campo
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

          const Icon =
            ICONS[item.icon];

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

          {/* AVATAR */}

          <div className="user-avatar">
            {role?.initials}
          </div>


          {/* INFORMACIÓN */}

          <div className="sidebar-user-info">

            <strong>
              {role?.fullName}
            </strong>

            <span>
              {role?.name}
            </span>

          </div>

        </div>


        {/* CERRAR SESIÓN */}

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