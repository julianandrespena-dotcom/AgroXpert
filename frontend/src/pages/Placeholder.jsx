import { Construction } from "lucide-react";

export default function Placeholder({
  title,
  description,
}) {
  return (
    <div className="placeholder-page">
      <div className="placeholder-icon">
        <Construction size={30} />
      </div>

      <span className="page-eyebrow">
        MÓDULO EN DESARROLLO
      </span>

      <h1>{title}</h1>

      <p>{description}</p>

      <small>
        Esta pantalla forma parte de la
        navegación de prueba de AgroXpert.
      </small>
    </div>
  );
}