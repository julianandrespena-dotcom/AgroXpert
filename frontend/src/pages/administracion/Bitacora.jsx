import { useEffect, useState } from "react";
import {
  ArrowLeft,
  Search,
  RefreshCw,
  ClipboardList,
  Eye,
  ChevronLeft,
  ChevronRight,
  X,
} from "lucide-react";

const API_URL =
  import.meta.env.VITE_API_URL || "http://localhost:3000/api";

const PAGE_SIZE = 25;

const FILTERS = [
  { value: "", label: "Todas las categorías" },
  { value: "AUTENTICACION", label: "Autenticación" },
  { value: "AUTORIZACION", label: "Autorización" },
  { value: "ADMINISTRACION", label: "Administración" },
];

const RESULT_FILTERS = [
  { value: "", label: "Todos los resultados" },
  { value: "EXITOSO", label: "Exitoso" },
  { value: "FALLIDO", label: "Fallido" },
  { value: "DENEGADO", label: "Denegado" },
];

const EMPTY_PAGINATION = {
  pagina: 1,
  limite: PAGE_SIZE,
  total: 0,
  totalPaginas: 0,
};

export default function Bitacora({ onBack }) {
  const [registros, setRegistros] = useState([]);
  const [paginacion, setPaginacion] = useState(EMPTY_PAGINATION);

  const [busqueda, setBusqueda] = useState("");
  const [categoria, setCategoria] = useState("");
  const [resultado, setResultado] = useState("");
  const [fechaDesde, setFechaDesde] = useState("");
  const [fechaHasta, setFechaHasta] = useState("");

  const [pagina, setPagina] = useState(1);
  const [recarga, setRecarga] = useState(0);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [registroSeleccionado, setRegistroSeleccionado] =
    useState(null);

  useEffect(() => {
    const controller = new AbortController();

    async function cargarBitacora() {
      try {
        setLoading(true);
        setError("");

        const params = new URLSearchParams({
          pagina: String(pagina),
          limite: String(PAGE_SIZE),
        });

        if (busqueda.trim()) {
          params.set("busqueda", busqueda.trim());
        }

        if (categoria) {
          params.set("categoria", categoria);
        }

        if (resultado) {
          params.set("resultado", resultado);
        }

        if (fechaDesde) {
          params.set("fechaDesde", fechaDesde);
        }

        if (fechaHasta) {
          params.set("fechaHasta", fechaHasta);
        }

        const response = await fetch(
          `${API_URL}/bitacora?${params.toString()}`,
          {
            method: "GET",
            credentials: "include",
            signal: controller.signal,
          }
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data.mensaje ||
              data.message ||
              data.error ||
              "No fue posible consultar la bitácora."
          );
        }

        setRegistros(
          Array.isArray(data.registros) ? data.registros : []
        );

        setPaginacion(data.paginacion || EMPTY_PAGINATION);
      } catch (err) {
        if (err.name !== "AbortError") {
          setError(
            err.message ||
              "Ocurrió un error al consultar la bitácora."
          );
          setRegistros([]);
          setPaginacion(EMPTY_PAGINATION);
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }

    cargarBitacora();

    return () => controller.abort();
  }, [
    pagina,
    busqueda,
    categoria,
    resultado,
    fechaDesde,
    fechaHasta,
    recarga,
  ]);

  // Cerrar el detalle con la tecla Escape.
  useEffect(() => {
    if (!registroSeleccionado) return;

    const manejarTecla = (event) => {
      if (event.key === "Escape") {
        setRegistroSeleccionado(null);
      }
    };

    window.addEventListener("keydown", manejarTecla);

    return () => {
      window.removeEventListener("keydown", manejarTecla);
    };
  }, [registroSeleccionado]);

  const cambiarFiltro = (setter, value) => {
    setter(value);
    setPagina(1);
  };

  const formatearFecha = (fecha) => {
    if (!fecha) return "—";

    const date = new Date(fecha);

    if (Number.isNaN(date.getTime())) {
      return "—";
    }

    return new Intl.DateTimeFormat("es-CO", {
      dateStyle: "short",
      timeStyle: "medium",
    }).format(date);
  };

  const formatearDatos = (datos) => {
    if (!datos) return "Sin información";

    try {
      const parsed =
        typeof datos === "string" ? JSON.parse(datos) : datos;

      return JSON.stringify(parsed, null, 2);
    } catch {
      return String(datos);
    }
  };

  const limpiarFiltros = () => {
    setBusqueda("");
    setCategoria("");
    setResultado("");
    setFechaDesde("");
    setFechaHasta("");
    setPagina(1);
  };

  const actualizarBitacora = () => {
    setRecarga((current) => current + 1);
  };

  const totalPaginas = paginacion.totalPaginas || 0;

  const tieneFiltros =
    busqueda ||
    categoria ||
    resultado ||
    fechaDesde ||
    fechaHasta;

  const detalle = registroSeleccionado;

  return (
    <section className="administracion bitacora-page">

      {/* ENCABEZADO */}
      <div className="administracion-header">
        <div>
          <h1>Bitácora de auditoría</h1>
          <p>
            Consulta el historial de actividades realizadas en AgroXpert.
          </p>
        </div>

        <button
          type="button"
          className="btn-secondary"
          onClick={onBack}
        >
          <ArrowLeft size={17} />
          Volver a usuarios
        </button>
      </div>

      {/* RESUMEN */}
      <div className="bitacora-summary">
        <div className="bitacora-summary-icon">
          <ClipboardList size={22} />
        </div>

        <div className="bitacora-summary-info">
          <span>Registros encontrados</span>
          <strong>{paginacion.total}</strong>
        </div>
      </div>

      {/* FILTROS */}
      <div className="bitacora-filters">

        <div className="bitacora-filter-search">
          <Search size={18} />

          <input
            type="search"
            placeholder="Buscar usuario, evento o descripción..."
            value={busqueda}
            onChange={(event) =>
              cambiarFiltro(setBusqueda, event.target.value)
            }
          />
        </div>

        <label className="bitacora-filter-field">
          <span>Categoría</span>
          <select
            value={categoria}
            onChange={(event) =>
              cambiarFiltro(setCategoria, event.target.value)
            }
          >
            {FILTERS.map((filter) => (
              <option key={filter.value} value={filter.value}>
                {filter.label}
              </option>
            ))}
          </select>
        </label>

        <label className="bitacora-filter-field">
          <span>Resultado</span>
          <select
            value={resultado}
            onChange={(event) =>
              cambiarFiltro(setResultado, event.target.value)
            }
          >
            {RESULT_FILTERS.map((filter) => (
              <option key={filter.value} value={filter.value}>
                {filter.label}
              </option>
            ))}
          </select>
        </label>

        <label className="bitacora-filter-field">
          <span>Desde</span>
          <input
            type="date"
            value={fechaDesde}
            max={fechaHasta || undefined}
            onChange={(event) =>
              cambiarFiltro(setFechaDesde, event.target.value)
            }
          />
        </label>

        <label className="bitacora-filter-field">
          <span>Hasta</span>
          <input
            type="date"
            value={fechaHasta}
            min={fechaDesde || undefined}
            onChange={(event) =>
              cambiarFiltro(setFechaHasta, event.target.value)
            }
          />
        </label>

        <button
          type="button"
          className="bitacora-clear-button"
          onClick={limpiarFiltros}
          disabled={!tieneFiltros}
        >
          <X size={16} />
          Limpiar filtros
        </button>

      </div>

      {error && (
        <div className="admin-error">
          {error}
        </div>
      )}

      {/* TABLA */}
      <div className="users-table-container">
        {loading ? (
          <div className="admin-loading">
            Cargando registros de auditoría...
          </div>
        ) : (
          <table className="users-table bitacora-table">
            <thead>
              <tr>
                <th>Fecha y hora</th>
                <th>Usuario</th>
                <th>Categoría</th>
                <th>Evento</th>
                <th>Descripción</th>
                <th>Resultado</th>
                <th>Detalle</th>
              </tr>
            </thead>

            <tbody>
              {registros.length === 0 ? (
                <tr>
                  <td colSpan="7" className="bitacora-empty">
                    No se encontraron registros.
                  </td>
                </tr>
              ) : (
                registros.map((registro) => (
                  <tr key={registro.id}>
                    <td>
                      {formatearFecha(registro.fecha_hora_utc)}
                    </td>

                    <td>
                      {registro.actor_usuario || "Sistema"}
                    </td>

                    <td>{registro.categoria || "—"}</td>

                    <td>{registro.evento || "—"}</td>

                    <td>
                      {registro.descripcion || "—"}
                    </td>

                    <td>
                      <span
                        className={`bitacora-result bitacora-result-${String(
                          registro.resultado || ""
                        ).toLowerCase()}`}
                      >
                        {registro.resultado || "—"}
                      </span>
                    </td>

                    <td>
                      <button
                        type="button"
                        className="btn-icon"
                        title="Consultar detalle"
                        aria-label={`Consultar detalle del registro ${registro.id}`}
                        onClick={() =>
                          setRegistroSeleccionado(registro)
                        }
                      >
                        <Eye size={17} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
      </div>


      {/* PAGINACIÓN */}
      <div className="bitacora-pagination">

        <div className="bitacora-pagination-info">
          <span>
            Mostrando{" "}
            <strong>
              {paginacion.total === 0
                ? 0
                : (pagina - 1) * PAGE_SIZE + 1}
              {"–"}
              {Math.min(pagina * PAGE_SIZE, paginacion.total)}
            </strong>
            {" "}de{" "}
            <strong>{paginacion.total}</strong>
            {" "}registros
          </span>
        </div>

        <div className="bitacora-pagination-controls">

          <button
            type="button"
            className="bitacora-page-button"
            disabled={pagina <= 1 || loading}
            onClick={() => setPagina((current) => current - 1)}
            aria-label="Página anterior"
            title="Página anterior"
          >
            <ChevronLeft size={18} />
          </button>

          {Array.from(
            { length: totalPaginas },
            (_, index) => index + 1
          )
            .filter((number) => {
              return (
                number === 1 ||
                number === totalPaginas ||
                Math.abs(number - pagina) <= 1
              );
            })
            .reduce((items, number, index, array) => {
              if (
                index > 0 &&
                number - array[index - 1] > 1
              ) {
                items.push("ellipsis-" + number);
              }

              items.push(number);
              return items;
            }, [])
            .map((number) => {
              if (typeof number === "string") {
                return (
                  <span
                    key={number}
                    className="bitacora-page-ellipsis"
                  >
                    …
                  </span>
                );
              }

              return (
                <button
                  key={number}
                  type="button"
                  className={`bitacora-page-number ${
                    pagina === number ? "active" : ""
                  }`}
                  disabled={loading}
                  aria-current={
                    pagina === number ? "page" : undefined
                  }
                  onClick={() => setPagina(number)}
                >
                  {number}
                </button>
              );
            })}

          <button
            type="button"
            className="bitacora-page-button"
            disabled={pagina >= totalPaginas || loading}
            onClick={() => setPagina((current) => current + 1)}
            aria-label="Página siguiente"
            title="Página siguiente"
          >
            <ChevronRight size={18} />
          </button>

        </div>

      </div>

      {/* MODAL DE DETALLE */}
      {detalle && (
        <div
          className="bitacora-modal-overlay"
          onClick={() => setRegistroSeleccionado(null)}
        >
          <div
            className="bitacora-detail-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="bitacora-detail-title"
            onClick={(event) => event.stopPropagation()}
          >

            <div className="bitacora-modal-header">
              <div>
                <span className="bitacora-modal-eyebrow">
                  AUDITORÍA · REGISTRO #{detalle.id}
                </span>

                <h2 id="bitacora-detail-title">
                  Detalle del evento
                </h2>

                <p>
                  {detalle.evento || "Evento sin identificar"}
                </p>
              </div>

              <button
                type="button"
                className="btn-icon"
                aria-label="Cerrar detalle"
                onClick={() => setRegistroSeleccionado(null)}
              >
                <X size={20} />
              </button>
            </div>

            <div className="bitacora-modal-body">

              {/* ESTADO */}
              <div className="bitacora-detail-status">
                <span>Resultado de la operación</span>

                <span
                  className={`bitacora-result bitacora-result-${String(
                    detalle.resultado || ""
                  ).toLowerCase()}`}
                >
                  {detalle.resultado || "Sin resultado"}
                </span>
              </div>

              {/* INFORMACIÓN GENERAL */}
              <section className="bitacora-detail-section">
                <h3>Información general</h3>

                <div className="bitacora-detail-grid">
                  <div className="bitacora-detail-item">
                    <span>Fecha y hora</span>
                    <strong>
                      {formatearFecha(detalle.fecha_hora_utc)}
                    </strong>
                  </div>

                  <div className="bitacora-detail-item">
                    <span>Usuario responsable</span>
                    <strong>{detalle.actor_usuario || "—"}</strong>
                  </div>

                  <div className="bitacora-detail-item">
                    <span>Usuario afectado</span>
                    <strong>{detalle.usuario_afectado || "—"}</strong>
                  </div>

                  <div className="bitacora-detail-item">
                    <span>Categoría</span>
                    <strong>{detalle.categoria || "—"}</strong>
                  </div>

                  <div className="bitacora-detail-item">
                    <span>Módulo</span>
                    <strong>{detalle.modulo || "—"}</strong>
                  </div>

                  <div className="bitacora-detail-item">
                    <span>Dirección IP</span>
                    <strong>{detalle.ip || "—"}</strong>
                  </div>

                  <div className="bitacora-detail-item">
                    <span>Método HTTP</span>
                    <strong>{detalle.metodo || "—"}</strong>
                  </div>

                  <div className="bitacora-detail-item">
                    <span>Ruta</span>
                    <strong>{detalle.ruta || "—"}</strong>
                  </div>
                </div>
              </section>

              {/* DESCRIPCIÓN */}
              <section className="bitacora-detail-section">
                <h3>Descripción</h3>

                <p className="bitacora-detail-description">
                  {detalle.descripcion || "Sin descripción"}
                </p>
              </section>

              {/* MOTIVO */}
              {detalle.motivo && (
                <section className="bitacora-detail-section">
                  <h3>Motivo</h3>

                  <p className="bitacora-detail-description">
                    {detalle.motivo}
                  </p>
                </section>
              )}

              {/* CAMBIOS */}
              <section className="bitacora-detail-section">
                <h3>Datos del cambio</h3>

                <div className="bitacora-json-grid">
                  <div className="bitacora-json-card">
                    <h4>Datos anteriores</h4>
                    <pre>
                      {formatearDatos(detalle.datos_anteriores)}
                    </pre>
                  </div>

                  <div className="bitacora-json-card">
                    <h4>Datos nuevos</h4>
                    <pre>
                      {formatearDatos(detalle.datos_nuevos)}
                    </pre>
                  </div>
                </div>
              </section>

            </div>

            <div className="bitacora-modal-footer">
              <button
                type="button"
                className="btn-secondary"
                onClick={() => setRegistroSeleccionado(null)}
              >
                Cerrar detalle
              </button>
            </div>

          </div>
        </div>
      )}

    </section>
  );
}
