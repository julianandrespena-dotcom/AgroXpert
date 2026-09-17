import {
  BarChart3,
  TrendingUp,
  Activity,
} from "lucide-react";

import { useState } from "react";

import Card from "../components/ui/Card";
import PowerBIEmbed from "../components/dashboard/PowerBIEmbed";

const DASHBOARDS = [
  {
    id: "consolidado",
    label: "D1 · Consolidado",
    title: "Dashboard Power BI",
    subtitle: "Control de flota Campo",
    embedUrl:
      import.meta.env.VITE_POWERBI_EMBED_URL,
  },
  {
    id: "detalle",
    label: "D2 · Detalle por suerte",
    title: "Dashboard Power BI",
    subtitle: "Detalle por suerte",
    embedUrl:
      import.meta.env.VITE_POWERBI_EMBED_URL_2,
  },
  {
    id: "labores",
    label: "D3 · Labores cotidianas",
    title: "Dashboard Power BI",
    subtitle: "Labores cotidianas",
    embedUrl:
      import.meta.env.VITE_POWERBI_EMBED_URL_3,
  },
];

export default function Dashboards() {

  const [activeDashboard, setActiveDashboard] =
    useState("consolidado");

  const selectedDashboard = DASHBOARDS.find(
    (dashboard) =>
      dashboard.id === activeDashboard
  );

  return (
    <div className="page-container dashboard-page">

      {/* ENCABEZADO */}

      <div className="page-header">

        <div>
          <span className="page-eyebrow">
            ANALÍTICA
          </span>

          <h1>
            Dashboards
          </h1>

          <p>
            Consulta los indicadores y análisis de la
            operación.
          </p>
        </div>

      </div>

      {/* SELECTOR DE DASHBOARDS */}

      <div className="dashboard-tabs">

        {DASHBOARDS.map((dashboard) => {

          const active =
            activeDashboard === dashboard.id;

          return (
            <button
              key={dashboard.id}
              type="button"
              className={`dashboard-tab ${
                active ? "active" : ""
              }`}
              onClick={() =>
                setActiveDashboard(dashboard.id)
              }
              aria-pressed={active}
            >
              {dashboard.label}
            </button>
          );

        })}

      </div>

      {/* INDICADORES SUPERIORES */}

      <div className="dashboard-summary">

        <Card className="dashboard-summary-card">

          <div className="dashboard-summary-icon blue">
            <BarChart3 size={20} />
          </div>

          <div>
            <span>
              Dashboard
            </span>

            <strong>
              {selectedDashboard.subtitle}
            </strong>
          </div>

        </Card>

        <Card className="dashboard-summary-card">

          <div className="dashboard-summary-icon green">
            <TrendingUp size={20} />
          </div>

          <div>
            <span>
              Fuente
            </span>

            <strong>
              Power BI / Fabric
            </strong>
          </div>

        </Card>

        <Card className="dashboard-summary-card">

          <div className="dashboard-summary-icon yellow">
            <Activity size={20} />
          </div>

          <div>
            <span>
              Estado
            </span>

            <strong>
              Conectado
            </strong>
          </div>

        </Card>

      </div>

      {/* DASHBOARD SELECCIONADO */}

      <PowerBIEmbed
        embedUrl={selectedDashboard.embedUrl}
        title={selectedDashboard.title}
        subtitle={selectedDashboard.subtitle}
      />

    </div>
  );
}