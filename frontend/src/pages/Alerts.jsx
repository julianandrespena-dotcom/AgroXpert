import {
  AlertTriangle,
  CheckCircle2,
  Clock3,
  MapPin,
} from "lucide-react";

import Card from "../components/ui/Card";
import Badge from "../components/ui/Badge";

const alerts = [
  {
    type: "critical",
    title: "Actividad pendiente",
    description:
      "Se encuentra pendiente una actividad programada para la zona.",
    location: "Zona Central",
    time: "Hace 20 min",
  },

  {
    type: "warning",
    title: "Actividad próxima",
    description:
      "Una actividad programada requiere seguimiento durante la jornada.",
    location: "Hda. San Fernando Norte",
    time: "Hace 1 hora",
  },

  {
    type: "info",
    title: "Actividad completada",
    description:
      "Se registró correctamente la finalización de una actividad.",
    location: "Zona Central",
    time: "Hace 2 horas",
  },
];

export default function Alerts() {
  return (
    <div className="page-container">

      {/* ENCABEZADO */}

      <div className="page-header">

        <div>

          <span className="page-eyebrow">
            MONITOREO
          </span>

          <h1>
            Alertas
          </h1>

          <p>
            Consulta las novedades y eventos
            importantes de la operación.
          </p>

        </div>

        <Badge variant="red">
          3 activas
        </Badge>

      </div>

      {/* RESUMEN */}

      <div className="alerts-summary">

        <Card>

          <div className="alert-summary-icon red">
            <AlertTriangle size={20} />
          </div>

          <div>

            <span>
              Alertas críticas
            </span>

            <strong>
              1
            </strong>

          </div>

        </Card>

        <Card>

          <div className="alert-summary-icon yellow">
            <Clock3 size={20} />
          </div>

          <div>

            <span>
              En seguimiento
            </span>

            <strong>
              1
            </strong>

          </div>

        </Card>

        <Card>

          <div className="alert-summary-icon green">
            <CheckCircle2 size={20} />
          </div>

          <div>

            <span>
              Atendidas
            </span>

            <strong>
              8
            </strong>

          </div>

        </Card>

      </div>

      {/* LISTA DE ALERTAS */}

      <Card className="alerts-card">

        <div className="alerts-list">

          {alerts.map((alert, index) => (

            <div
              className="alert-item"
              key={index}
            >

              <div
                className={`alert-item-icon ${alert.type}`}
              >
                <AlertTriangle size={19} />
              </div>

              <div className="alert-item-content">

                <div className="alert-item-title">

                  <strong>
                    {alert.title}
                  </strong>

                  <span>
                    {alert.time}
                  </span>

                </div>

                <p>
                  {alert.description}
                </p>

                <div className="alert-location">

                  <MapPin size={13} />

                  {alert.location}

                </div>

              </div>

              <button className="alert-view-button">
                Ver
              </button>

            </div>

          ))}

        </div>

      </Card>

    </div>
  );
}