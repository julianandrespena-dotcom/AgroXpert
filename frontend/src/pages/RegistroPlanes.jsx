import {
  CalendarDays,
  CheckCircle2,
  Clock3,
  Plus,
} from "lucide-react";

import Card from "../components/ui/Card";
import Badge from "../components/ui/Badge";

const plans = [
  {
    title: "Aplicación agrícola",
    location: "Hda. San Fernando Norte",
    date: "09 Sep 2026",
    status: "Pendiente",
  },

  {
    title: "Revisión de cultivo",
    location: "Zona Central",
    date: "09 Sep 2026",
    status: "En proceso",
  },

  {
    title: "Seguimiento de actividad",
    location: "Hda. San Fernando Norte",
    date: "10 Sep 2026",
    status: "Programado",
  },
];

export default function RegistroPlanes() {
  return (
    <div className="page-container">

      <div className="page-header">

        <div>
          <span className="page-eyebrow">
            OPERACIÓN
          </span>

          <h1>
            Registro de planes
          </h1>

          <p>
            Consulta y realiza seguimiento a los
            planes de trabajo.
          </p>
        </div>

        <button className="new-plan-button">
          <Plus size={17} />
          Nuevo plan
        </button>

      </div>

      <div className="plans-summary">

        <Card>
          <CalendarDays size={20} />

          <div>
            <span>
              Planes programados
            </span>

            <strong>
              12
            </strong>
          </div>
        </Card>

        <Card>
          <Clock3 size={20} />

          <div>
            <span>
              En proceso
            </span>

            <strong>
              4
            </strong>
          </div>
        </Card>

        <Card>
          <CheckCircle2 size={20} />

          <div>
            <span>
              Completados
            </span>

            <strong>
              28
            </strong>
          </div>
        </Card>

      </div>

      <Card className="plans-card">

        <div className="plans-card-header">
          <div>
            <strong>
              Planes recientes
            </strong>

            <span>
              Actividades de la operación
            </span>
          </div>
        </div>

        <div className="plans-list">

          {plans.map((plan, index) => (
            <div
              className="plan-item"
              key={index}
            >

              <div className="plan-icon">
                <CalendarDays size={18} />
              </div>

              <div className="plan-info">
                <strong>
                  {plan.title}
                </strong>

                <span>
                  {plan.location}
                </span>
              </div>

              <div className="plan-date">
                {plan.date}
              </div>

              <Badge
                variant={
                  plan.status ===
                  "Pendiente"
                    ? "yellow"
                    : plan.status ===
                      "En proceso"
                    ? "blue"
                    : "green"
                }
              >
                {plan.status}
              </Badge>

            </div>
          ))}

        </div>

      </Card>

    </div>
  );
}