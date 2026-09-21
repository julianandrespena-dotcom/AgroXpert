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

export default function Home({
  onNavigate,
}) {
  const { role } = useApp();

  const isMayordomo = role.id === "mayordomo";

  return (
    <div
      className={`page-container ${
        isMayordomo ? "home-mayordomo" : ""
      }`}
    >
      {/* =====================================================
          HOME ESPECIAL PARA MAYORDOMO
          Se mantiene oculto visualmente en desktop y móvil.
      ====================================================== */}
      {isMayordomo && (
        <div className="mayordomo-tablet-home">
          <div className="mayordomo-location">
            <MapPin size={18} />
            <span>{role.scope}</span>
          </div>

          <div className="mayordomo-greeting">
            <span className="page-eyebrow">
              PANEL PRINCIPAL
            </span>

            <h1>
              Buenos días,{" "}
              {role.fullName.split(" ")[0]} 👋
            </h1>

            <p>
              Este es el resumen de la operación de hoy.
            </p>
          </div>

          <div className="mayordomo-alert">
            <div className="mayordomo-alert-icon">
              <Bell size={20} />
            </div>

            <div>
              <span>ALERTA IMPORTANTE</span>

              <strong>
                Se requiere atención en una actividad
              </strong>

              <small>
                Revisa las novedades de la operación.
              </small>
            </div>

            <button
              onClick={() => onNavigate("alerts")}
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
                <span>AGENDA DEL DÍA</span>

                <h2>
                  Agenda priorizada de hoy
                </h2>
              </div>

              <button
                className="mayordomo-ai-button"
                onClick={() => onNavigate("chat")}
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
          HOME ACTUAL
          Se mantiene para Gerente, Director y Supervisor.
          También queda como fallback para Mayordomo fuera
          del diseño tablet.
      ====================================================== */}
      <div className="home-default-content">
        <div className="page-header">
          <div>
            <span className="page-eyebrow">
              PANEL PRINCIPAL
            </span>

            <h1>
              Buenos días, {role.fullName.split(" ")[0]}
            </h1>

            <p>
              Este es el resumen de la operación
              correspondiente a tu ámbito.
            </p>
          </div>

          <Badge variant="green">
            Operación activa
          </Badge>
        </div>

        <Card className="welcome-card">
          <div className="welcome-content">
            <span className="welcome-label">
              ÁMBITO DE CONSULTA
            </span>

            <h2>{role.scope}</h2>

            <p>{role.description}</p>
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
              <span>Actividades programadas</span>

              <strong>24</strong>

              <small>Para hoy</small>
            </div>
          </Card>

          <Card className="kpi-card">
            <div className="kpi-icon green">
              <CheckCircle2 size={21} />
            </div>

            <div>
              <span>Actividades completadas</span>

              <strong>18</strong>

              <small>75% del día</small>
            </div>
          </Card>

          <Card className="kpi-card">
            <div className="kpi-icon yellow">
              <Clock3 size={21} />
            </div>

            <div>
              <span>Pendientes</span>

              <strong>6</strong>

              <small>Requieren seguimiento</small>
            </div>
          </Card>

          <Card className="kpi-card">
            <div className="kpi-icon red">
              <Bell size={21} />
            </div>

            <div>
              <span>Alertas</span>

              <strong>3</strong>

              <small>Sin atender</small>
            </div>
          </Card>
        </section>

        <section className="home-grid">
          <Card className="quick-actions-card">
            <div className="card-heading">
              <div>
                <span>ACCESOS RÁPIDOS</span>

                <h2>
                  ¿Qué necesitas consultar?
                </h2>
              </div>
            </div>

            <div className="quick-actions">
              <button
                onClick={() => onNavigate("chat")}
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
                onClick={() => onNavigate("alerts")}
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

              {role.id !== "mayordomo" && (
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
                <span>ESTADO OPERATIVO</span>

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