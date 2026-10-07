import { useState } from "react";

import Sidebar from "./Sidebar";
import Topbar from "./Topbar";
import MobileBottomNav from "./MobileBottomNav";

import Home from "../../pages/Home";
import Alerts from "../../pages/Alerts";
import Chatbot from "../../pages/Chatbot";
import Dashboards from "../../pages/Dashboards";
import RegistroPlanes from "../../pages/RegistroPlanes";
import Placeholder from "../../pages/Placeholder";

import { useApp } from "../../context/AppContext";

export default function AppShell() {
  const { role, logout } = useApp();

  const [activePage, setActivePage] =
    useState("home");

  const handleNavigate = (page) => {
    setActivePage(page);
  };

  const renderPage = () => {
    switch (activePage) {

      case "home":
        return (
          <Home
            onNavigate={handleNavigate}
          />
        );

      case "alerts":
        return <Alerts />;

      case "chat":
        return <Chatbot />;

      case "dashboards":

        if (!role.permissions.dashboards) {
          return (
            <Placeholder
              title="Acceso restringido"
              description="No tienes permisos para consultar los dashboards."
            />
          );
        }

        return <Dashboards />;

      case "plans":

        if (!role.permissions.plans) {
          return (
            <Placeholder
              title="Acceso restringido"
              description="No tienes permisos para acceder al registro de planes."
            />
          );
        }

        return <RegistroPlanes />;

      case "admin":

        if (!role.permissions.admin) {
          return (
            <Placeholder
              title="Acceso restringido"
              description="No tienes permisos para acceder a la administración."
            />
          );
        }

        return (
          <Placeholder
            title="Administración"
            description="Aquí se encontrarán las funciones administrativas de AgroXpert."
          />
        );

      default:
        return (
          <Home
            onNavigate={handleNavigate}
          />
        );
    }
  };

  return (
    <div className="app-shell">

      {/* SIDEBAR */}

      <Sidebar
        activePage={activePage}
        onNavigate={handleNavigate}
        onLogout={logout}
      />

      {/* CONTENIDO PRINCIPAL */}

      <div className="app-main">

        <Topbar
          onNavigate={handleNavigate}
        />

        <main className="app-content">
          {renderPage()}
        </main>

      </div>

      {/* NAVEGACIÓN MÓVIL */}

      <MobileBottomNav
        activePage={activePage}
        onNavigate={handleNavigate}
      />

    </div>
  );
}