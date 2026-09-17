import {
  Search,
  Bell,
  ChevronDown,
  LogOut,
  UserRound,
} from "lucide-react";

import { useState } from "react";

import { useApp } from "../../context/AppContext";

export default function Topbar({
  onNavigate,
  onLogout,
}) {
  const { role } = useApp();

  const [showUserMenu, setShowUserMenu] =
    useState(false);

  const handleAlerts = () => {
    setShowUserMenu(false);
    onNavigate("alerts");
  };

  const handleLogout = () => {
    setShowUserMenu(false);
    onLogout();
  };

  return (
    <header className="topbar">

      {/* MARCA PARA MÓVIL */}

      <div className="topbar-mobile-brand">
        <div className="brand-mark small">
          in
        </div>

        <span>AgroXpert</span>
      </div>

      {/* BUSCADOR */}

      <div className="topbar-search">

        <Search size={18} />

        <input
          type="text"
          placeholder="Buscar..."
        />

      </div>

      {/* ACCIONES DEL USUARIO */}

      <div className="topbar-actions">

        {/* CAMPANA DE ALERTAS */}

        <button
          className="icon-button notification-button"
          onClick={handleAlerts}
          aria-label="Ver alertas"
          title="Ver alertas"
        >

          <Bell size={20} />

          <span className="notification-dot" />

        </button>

        {/* USUARIO */}

        <div className="topbar-user-wrapper">

          <button
            className={`topbar-user ${
              showUserMenu ? "open" : ""
            }`}
            onClick={() =>
              setShowUserMenu(!showUserMenu)
            }
            aria-label="Abrir información del usuario"
            aria-expanded={showUserMenu}
          >

            <div className="user-avatar">
              {role.initials}
            </div>

            <div className="topbar-user-info">

              <strong>
                {role.fullName}
              </strong>

              <span>
                {role.name}
              </span>

            </div>

            <ChevronDown
              size={17}
              className={
                showUserMenu
                  ? "user-chevron open"
                  : "user-chevron"
              }
            />

          </button>

          {/* MENÚ DEL USUARIO */}

          {showUserMenu && (

            <div className="topbar-user-menu">

              <div className="topbar-user-menu-header">

                <div className="topbar-user-menu-avatar">
                  {role.initials}
                </div>

                <div className="topbar-user-menu-info">

                  <strong>
                    {role.fullName}
                  </strong>

                  <span>
                    {role.name}
                  </span>

                </div>

              </div>

              <div className="topbar-user-menu-divider" />

              <div className="topbar-user-menu-role">

                <UserRound size={16} />

                <div>

                  <span>
                    Perfil
                  </span>

                  <strong>
                    {role.name}
                  </strong>

                </div>

              </div>

              <button
                className="topbar-user-menu-logout"
                onClick={handleLogout}
              >

                <LogOut size={17} />

                <span>
                  Cerrar sesión
                </span>

              </button>

            </div>

          )}

        </div>

      </div>

    </header>
  );
}