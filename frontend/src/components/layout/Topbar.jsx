import {
  Search,
  Bell,
} from "lucide-react";

import { useApp } from "../../context/AppContext";

export default function Topbar({
  onNavigate,
}) {
  const { role } = useApp();

  const handleAlerts = () => {
    onNavigate("alerts");
  };

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

        <div className="topbar-user">

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

        </div>

      </div>

    </header>
  );
}