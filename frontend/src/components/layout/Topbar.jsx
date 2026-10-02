import {
  Search,
  Bell,
  ChevronDown,
  ClipboardList,
  Settings,
  LogOut,
} from "lucide-react";

import { useState } from "react";

import { useApp } from "../../context/AppContext";

export default function Topbar({
  onNavigate,
}) {
  const { role, logout } = useApp();

  const [showUserMenu, setShowUserMenu] =
    useState(false);

  // ALERTAS

  const handleAlerts = () => {
    onNavigate("alerts");
  };

  // MENÚ DE USUARIO

  const handleUserMenu = () => {
    setShowUserMenu((prev) => !prev);
  };

  // ACCIÓN SEGÚN ROL

  const handleRoleAction = () => {
    if (!role) return;

    if (role.id === "gerente") {
      onNavigate("admin");
    } else {
      onNavigate("plans");
    }

    setShowUserMenu(false);
  };

  // CERRAR SESIÓN

  const handleLogout = () => {
    setShowUserMenu(false);
    logout();
  };

  // OPCIÓN DEL MENÚ SEGÚN ROL

  const roleAction =
    role?.id === "gerente"
      ? {
          label: "Administración",
          icon: Settings,
        }
      : {
          label: "Registrar labores",
          icon: ClipboardList,
        };

  const RoleActionIcon =
    roleAction.icon;

  return (
    <header className="topbar">

      {/* MARCA PARA MÓVIL */}

      <div className="topbar-mobile-brand">

        <div className="brand-mark small">
          in
        </div>

        <span>
          AgroXpert
        </span>

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

        {/* CAMPANA
            No se muestra para administrador
        */}

        {role?.id !== "administrador" && (
          <button
            className="icon-button notification-button"
            onClick={handleAlerts}
            aria-label="Ver alertas"
            title="Ver alertas"
          >

            <Bell size={20} />

            <span className="notification-dot" />

          </button>
        )}


        {/* USUARIO */}

        <div className="topbar-user-wrapper">

          <button
            type="button"
            className={`topbar-user ${
              showUserMenu ? "open" : ""
            }`}
            onClick={handleUserMenu}
            aria-expanded={showUserMenu}
            aria-haspopup="true"
          >

            {/* AVATAR */}

            <div className="user-avatar">
              {role?.initials}
            </div>


            {/* INFORMACIÓN */}

            <div className="topbar-user-info">

              <strong>
                {role?.fullName}
              </strong>

              <span>
                {role?.name}
              </span>

            </div>


            {/* FLECHA */}

            <ChevronDown
              size={16}
              className={`user-chevron ${
                showUserMenu ? "open" : ""
              }`}
            />

          </button>


          {/* MENÚ DESPLEGABLE */}

          {showUserMenu && (

            <div className="topbar-user-menu">

              {/* INFORMACIÓN DEL USUARIO */}

              <div className="user-menu-header">

                <div className="user-avatar large">
                  {role?.initials}
                </div>

                <div>

                  <strong>
                    {role?.fullName}
                  </strong>

                  <span>
                    {role?.name}
                  </span>

                </div>

              </div>


              <div className="user-menu-divider" />


              {/* ACCIÓN SEGÚN ROL
                  No se muestra para administrador
              */}

              {role?.id !== "administrador" && (
                <button
                  type="button"
                  className="user-menu-item"
                  onClick={handleRoleAction}
                >

                  <RoleActionIcon
                    size={17}
                  />

                  <span>
                    {roleAction.label}
                  </span>

                </button>
              )}


              {/* CERRAR SESIÓN */}

              <button
                type="button"
                className="user-menu-item logout-item"
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