import {
  ArrowUpRight,
  Bell,
  Bot,
  CalendarCheck,
  CheckCircle2,
  Clock3,
  MapPin,
  Tractor,
  Droplets,
  Waves,
  Plus,
} from "lucide-react";

import { useApp } from "../context/AppContext";
import Card from "../components/ui/Card";
import Badge from "../components/ui/Badge";

const ROLE_HOME_CONFIG = {
  gerente: {
    eyebrow: "PANEL GERENCIAL",
    title: "Resumen general de la operación",
    description:
      "Consulta el estado general de la operación y los principales indicadores de tu ámbito.",
    scopeLabel: "ÁMBITO DE GESTIÓN",
    operationLabel: "Operación activa",
  },

  director: {
    eyebrow: "PANEL DE OPERACIÓN",
    title: "Seguimiento de la operación",
    description:
      "Consulta el estado de las actividades y los principales indicadores de tu ámbito.",
    scopeLabel: "ÁMBITO DE CONSULTA",
    operationLabel: "Operación activa",
  },

  supervisor: {
    eyebrow: "PANEL DE SUPERVISIÓN",
    title: "Seguimiento de actividades",
    description:
      "Consulta las actividades programadas, pendientes y novedades de tu ámbito.",
    scopeLabel: "ÁMBITO DE SUPERVISIÓN",
    operationLabel: "Operación activa",
  },

  mayordomo: {
    eyebrow: "PANEL PRINCIPAL",
    title: "Resumen de la operación de hoy",
    description:
      "Consulta las actividades y novedades correspondientes a tu hacienda.",
    scopeLabel: "HACIENDA",
    operationLabel: "Operación activa",
  },
};

export default function Home({
  onNavigate,
}) {
  const { role } = useApp();

  const isMayordomo =
    role?.id === "mayordomo";

  const homeConfig =
    ROLE_HOME_CONFIG[role?.id] ||
    ROLE_HOME_CONFIG.supervisor;

  const firstName =
    role?.fullName
      ?.split(" ")
      .filter(Boolean)[0] ||
    "Usuario";

  return (
    <div
      className={`page-container ${
        isMayordomo
          ? "home-mayordomo"
          : ""
      }`}
    >
      {/* =====================================================
          HOME ESPECIAL PARA MAYORDOMO
      ====================================================== */}

      {isMayordomo && (
        <div className="mayordomo-tablet-home">

          <div className="mayordomo-location">
            <MapPin size={18} />

            <span>
              {role?.scope}
            </span>
          </div>

          <div className="mayordomo-greeting">

            <span className="page-eyebrow">
              {homeConfig.eyebrow}
            </span>

            <h1>
              Buenos días,{" "}
              {firstName} 👋
            </h1>

            <p>
              {homeConfig.description}
            </p>

          </div>

          <div className="mayordomo-alert">

            <div className="mayordomo-alert-icon">
              <Bell size={20} />
            </div>

            <div>
              <span>
                ALERTA IMPORTANTE
              </span>

              <strong>
                Se requiere atención en una actividad
              </strong>

              <small>
                Revisa las novedades de la operación.
              </small>
            </div>

            <button
              onClick={() =>
                onNavigate("alerts")
              }
              aria-label="Ver alertas"
            >
              <ArrowUpRight size={19} />
            </button>

          </div>

          <section className="mayordomo-kpis">

            <div className="mayordomo-kpi">
              <span className="mayordomo-kpi-number">
                8
              </span>

              <span className="mayordomo-kpi-label">
                Labores
              </span>
            </div>

            <div className="mayordomo-kpi">
              <span className="mayordomo-kpi-number">
                5
              </span>

              <span className="mayordomo-kpi-label">
                Suertes
              </span>
            </div>

            <div className="mayordomo-kpi">
              <span className="mayordomo-kpi-number">
                3
              </span>

              <span className="mayordomo-kpi-label">
                Alertas
              </span>
            </div>

          </section>

          <section className="mayordomo-agenda">

            <div className="mayordomo-section-heading">

              <div>
                <span>
                  AGENDA DEL DÍA
                </span>

                <h2>
                  Agenda priorizada de hoy
                </h2>
              </div>

              <button
                className="mayordomo-ai-button"
                onClick={() =>
                  onNavigate("chat")
                }
              >
                <Plus size={16} />
                Priorizada por IA
              </button>

            </div>

            <div className="mayordomo-agenda-list">

              <button className="mayordomo-agenda-item">

                <div className="mayordomo-agenda-icon red">
                  <Tractor size={20} />
                </div>

                <div className="mayordomo-agenda-info">

                  <strong>
                    Control mecánico de maquinaria
                  </strong>

                  <span>
                    Revisar equipos programados para hoy
                  </span>

                </div>

                <Badge variant="red">
                  Crítica
                </Badge>

              </button>

              <button className="mayordomo-agenda-item">

                <div className="mayordomo-agenda-icon green">
                  <Droplets size={20} />
                </div>

                <div className="mayordomo-agenda-info">

                  <strong>
                    Riego de ventanas
                  </strong>

                  <span>
                    Verificar cumplimiento de la programación
                  </span>

                </div>

                <Badge variant="green">
                  Óptima
                </Badge>

              </button>

              <button className="mayordomo-agenda-item">

                <div className="mayordomo-agenda-icon yellow">
                  <Waves size={20} />
                </div>

                <div className="mayordomo-agenda-info">

                  <strong>
                    Mantenimiento de zanjas
                  </strong>

                  <span>
                    Actividad pendiente de seguimiento
                  </span>

                </div>

                <Badge variant="yellow">
                  Atención
                </Badge>

              </button>

            </div>

          </section>

        </div>
      )}

      {/* =====================================================
          HOME SEGÚN ROL
      ====================================================== */}

      <div className="home-default-content">

        <div className="page-header">

          <div>

            <span className="page-eyebrow">
              {homeConfig.eyebrow}
            </span>

            <h1>
              Buenos días, {firstName}
            </h1>

            <p>
              {homeConfig.description}
            </p>

          </div>

          <Badge variant="green">
            {homeConfig.operationLabel}
          </Badge>

        </div>

        <Card className="welcome-card">

          <div className="welcome-content">

            <span className="welcome-label">
              {homeConfig.scopeLabel}
            </span>

            <h2>
              {role?.scope || "Sin ámbito asignado"}
            </h2>

            <p>
              {role?.description ||
                "Información correspondiente al ámbito asignado al usuario."}
            </p>

          </div>

          <div className="welcome-icon">
            <MapPin size={25} />
          </div>

        </Card>

        <section className="kpi-grid">

          <Card className="kpi-card">

            <div className="kpi-icon blue">
              <CalendarCheck size={21} />
            </div>

            <div>
              <span>
                Actividades programadas
              </span>

              <strong>
                24
              </strong>

              <small>
                Para hoy
              </small>
            </div>

          </Card>

          <Card className="kpi-card">

            <div className="kpi-icon green">
              <CheckCircle2 size={21} />
            </div>

            <div>
              <span>
                Actividades completadas
              </span>

              <strong>
                18
              </strong>

              <small>
                75% del día
              </small>
            </div>

          </Card>

          <Card className="kpi-card">

            <div className="kpi-icon yellow">
              <Clock3 size={21} />
            </div>

            <div>
              <span>
                Pendientes
              </span>

              <strong>
                6
              </strong>

              <small>
                Requieren seguimiento
              </small>
            </div>

          </Card>

          <Card className="kpi-card">

            <div className="kpi-icon red">
              <Bell size={21} />
            </div>

            <div>
              <span>
                Alertas
              </span>

              <strong>
                3
              </strong>

              <small>
                Sin atender
              </small>
            </div>

          </Card>

        </section>

        <section className="home-grid">

          <Card className="quick-actions-card">

            <div className="card-heading">

              <div>

                <span>
                  ACCESOS RÁPIDOS
                </span>

                <h2>
                  ¿Qué necesitas consultar?
                </h2>

              </div>

            </div>

            <div className="quick-actions">

              <button
                onClick={() =>
                  onNavigate("chat")
                }
              >

                <div className="quick-action-icon">
                  <Bot size={22} />
                </div>

                <div>

                  <strong>
                    Consultar al Chatbot IA
                  </strong>

                  <span>
                    Obtén información y recomendaciones
                    agrícolas.
                  </span>

                </div>

                <ArrowUpRight size={18} />

              </button>

              <button
                onClick={() =>
                  onNavigate("alerts")
                }
              >

                <div className="quick-action-icon alert">
                  <Bell size={22} />
                </div>

                <div>

                  <strong>
                    Revisar alertas
                  </strong>

                  <span>
                    Consulta las novedades de la operación.
                  </span>

                </div>

                <ArrowUpRight size={18} />

              </button>

              {role?.permissions?.dashboards && (
                <button
                  onClick={() =>
                    onNavigate("dashboards")
                  }
                >

                  <div className="quick-action-icon dashboard">
                    <CalendarCheck size={22} />
                  </div>

                  <div>

                    <strong>
                      Ver dashboards
                    </strong>

                    <span>
                      Analiza los principales indicadores.
                    </span>

                  </div>

                  <ArrowUpRight size={18} />

                </button>
              )}

            </div>

          </Card>

          <Card className="status-card">

            <div className="card-heading">

              <div>

                <span>
                  ESTADO OPERATIVO
                </span>

                <h2>
                  Resumen de hoy
                </h2>

              </div>

            </div>

            <div className="status-list">

              <div>

                <span className="status-dot green" />

                <div>

                  <strong>
                    Operación normal
                  </strong>

                  <small>
                    Sin interrupciones reportadas
                  </small>

                </div>

              </div>

              <div>

                <span className="status-dot yellow" />

                <div>

                  <strong>
                    6 actividades pendientes
                  </strong>

                  <small>
                    Requieren seguimiento
                  </small>

                </div>

              </div>

              <div>

                <span className="status-dot red" />

                <div>

                  <strong>
                    3 alertas activas
                  </strong>

                  <small>
                    Consulta las novedades
                  </small>

                </div>

              </div>

              <div>

                <span className="status-dot green" />

                <div>

                  <strong>
                    Operación normal
                  </strong>

                  <small>
                    Sin interrupciones
                  </small>

                </div>

              </div>

            </div>

          </Card>

        </section>

      </div>

    </div>
  );
}