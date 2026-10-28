import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowDownRight,
  ArrowUpRight,
  CheckSquare,
  ChevronDown,
  LayoutGrid,
  Lock,
  MapPin,
  RefreshCw,
  Search,
  Sparkles,
} from "lucide-react";

import Dashboards from "./Dashboards";
import { useApp } from "../context/AppContext";
import "../styles/dashboard_1.css";

/*
 * DASHBOARD 1 · CONSOLIDADO
 *
 * Consume GET /api/dashboard/d1 (authMiddleware + requireRole). El backend
 * agrega la base completa de Fabric agrícola, restringida a las suertes
 * autorizadas del usuario; aquí solo se presentan los resultados.
 */

const API_URL = (import.meta.env.VITE_API_URL || "/api").replace(/\/$/, "");

const FILTROS_INICIALES = {
  anio: "",
  zona: "",
  hacienda: "",
  suerte: "",
  labor: "",
  estado: "",
  indicador: "TCH",
};

const PESTANAS = [
  { id: "d1", label: "D1 · Consolidado" },
  { id: "d2", label: "D2 · Detalle por suerte" },
  { id: "d3", label: "D3 · Labores cotidianas", disabled: true },
  { id: "d4", label: "D4 · Planes IA", disabled: true, ia: true },
  { id: "d5", label: "D5 · Oportunidad de labores", disabled: true },
];

const COLORES_ESTADO = {
  optima: "var(--grn, #16a34a)",
  atencion: "var(--amber, #f5a524)",
  critica: "var(--red, #e5484d)",
};

const AGRUPACION_TITULO = {
  zona: "zona",
  hacienda: "hacienda",
  suerte: "suerte",
};

const AGRUPACION_DETALLE = {
  zona: "conjunto de haciendas",
  hacienda: "haciendas de la zona",
  suerte: "suertes de la hacienda",
};

/* ---------- formato ---------- */

const formatoNumero = (valor, decimales = 1) =>
  valor == null
    ? "—"
    : new Intl.NumberFormat("es-CO", {
        minimumFractionDigits: decimales,
        maximumFractionDigits: decimales,
      }).format(valor);

const formatoEntero = (valor) =>
  valor == null ? "—" : new Intl.NumberFormat("es-CO").format(valor);

function formatoHectareas(valor) {
  if (valor == null) return "sin área";
  if (valor >= 1000) return `${formatoNumero(valor / 1000, 1)}k ha`;
  return `${formatoNumero(valor, 0)} ha`;
}

/* ---------- componentes ---------- */

function FacetChip({
  label,
  value,
  display,
  options,
  onChange,
  disabled,
  hint,
}) {
  const [abierto, setAbierto] = useState(false);
  const [busqueda, setBusqueda] = useState("");
  const ref = useRef(null);

  useEffect(() => {
    if (!abierto) return undefined;

    const cerrar = (event) => {
      if (event.type === "keydown" && event.key !== "Escape") return;
      if (event.type === "mousedown" && ref.current?.contains(event.target))
        return;
      setAbierto(false);
    };

    document.addEventListener("mousedown", cerrar);
    document.addEventListener("keydown", cerrar);
    return () => {
      document.removeEventListener("mousedown", cerrar);
      document.removeEventListener("keydown", cerrar);
    };
  }, [abierto]);

  const filtradas = useMemo(() => {
    const texto = busqueda.trim().toLowerCase();
    if (!texto) return options;
    return options.filter((o) =>
      String(o.etiqueta).toLowerCase().includes(texto),
    );
  }, [options, busqueda]);

  const seleccionar = (valor) => {
    onChange(valor);
    setAbierto(false);
    setBusqueda("");
  };

  return (
    <div className="d1-chip-wrap" ref={ref}>
      <button
        type="button"
        className={`d1-chip ${value ? "is-active" : ""}`}
        onClick={() => setAbierto((v) => !v)}
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={abierto}
        title={disabled ? hint : undefined}
      >
        <span className="d1-chip-label">{label}:</span>
        <strong>{display}</strong>
        {disabled ? <Lock size={12} /> : <ChevronDown size={14} />}
      </button>

      {abierto && (
        <div className="d1-popover" role="listbox" aria-label={label}>
          {options.length > 8 && (
            <label className="d1-popover-search">
              <Search size={14} />
              <input
                autoFocus
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                placeholder={`Buscar ${label.toLowerCase()}…`}
              />
            </label>
          )}

          <ul>
            {options.allowEmpty !== false && (
              <li>
                <button
                  type="button"
                  className={!value ? "is-selected" : ""}
                  onClick={() => seleccionar("")}
                >
                  Todas
                </button>
              </li>
            )}
            {filtradas.map((o) => (
              <li key={o.valor}>
                <button
                  type="button"
                  className={
                    String(o.valor) === String(value) ? "is-selected" : ""
                  }
                  onClick={() => seleccionar(o.valor)}
                >
                  <span>{o.etiqueta}</span>
                  {o.extra != null && <small>{o.extra}</small>}
                </button>
              </li>
            ))}
            {!filtradas.length && (
              <li className="d1-popover-empty">Sin coincidencias</li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
}

function Variacion({ valor, sufijo = "", decimales = 1, estableBajo = 0 }) {
  if (valor == null)
    return <span className="d1-kpi-note">sin zafra anterior</span>;
  if (Math.abs(valor) <= estableBajo)
    return <span className="d1-kpi-note">• estable</span>;

  const sube = valor > 0;
  const Icono = sube ? ArrowUpRight : ArrowDownRight;

  return (
    <span className={`d1-kpi-delta ${sube ? "is-up" : "is-down"}`}>
      <Icono size={14} />
      {sube ? "+" : ""}
      {formatoNumero(valor, decimales)}
      {sufijo}
    </span>
  );
}

function KpiCard({ icon: Icon, tone, label, value, unit, children }) {
  return (
    <article className="d1-kpi">
      <header>
        <span className={`d1-kpi-icon tone-${tone}`}>
          <Icon size={18} />
        </span>
        <span>{label}</span>
      </header>
      <p className="d1-kpi-value">
        {value}
        {unit && <small>{unit}</small>}
      </p>
      <footer>{children}</footer>
    </article>
  );
}

function BarChart({ grafico, onSelect }) {
  const barras = grafico?.barras ?? [];
  const maximo = Math.max(...barras.map((b) => b.valor), 0);
  const decimales = grafico?.indicador === "TCH" ? 0 : 1;

  if (!barras.length) {
    return (
      <p className="d1-empty">Sin datos para los filtros seleccionados.</p>
    );
  }

  return (
    <div className="d1-bars" role="list">
      {barras.map((b) => {
        const alto = maximo ? Math.max(4, (b.valor / maximo) * 100) : 0;
        const esMaximo = b.valor === maximo;
        const interactiva = grafico.agrupacion !== "suerte";

        return (
          <button
            type="button"
            role="listitem"
            key={b.clave}
            className={`d1-bar ${esMaximo ? "is-max" : ""}`}
            onClick={() => interactiva && onSelect(b.clave)}
            disabled={!interactiva}
            title={`${b.etiqueta}: ${formatoNumero(b.valor, decimales)} ${grafico.unidad} · ${b.suertes} suertes`}
          >
            <span className="d1-bar-value">
              {formatoNumero(b.valor, decimales)}
            </span>
            <span className="d1-bar-track">
              <span className="d1-bar-fill" style={{ height: `${alto}%` }} />
            </span>
            <span className="d1-bar-label">{b.etiqueta}</span>
          </button>
        );
      })}
    </div>
  );
}

function EstadoDonut({ semaforo, activo, onSelect }) {
  const categorias = semaforo?.categorias ?? [];
  const radio = 60;
  const circunferencia = 2 * Math.PI * radio;
  const optima = categorias.find((c) => c.id === "optima");

  if (!semaforo?.total) {
    return <p className="d1-empty">Sin suertes con TCH para clasificar.</p>;
  }

  const segmentos = categorias.reduce((lista, c) => {
    const inicio = lista.length ? lista[lista.length - 1].fin : 0;
    const largo = (c.porcentaje / 100) * circunferencia;
    return [...lista, { ...c, largo, inicio, fin: inicio + largo }];
  }, []);

  return (
    <div className="d1-donut-wrap">
      <svg
        viewBox="0 0 160 160"
        className="d1-donut"
        role="img"
        aria-label="Distribución de suertes por estado"
      >
        <circle
          cx="80"
          cy="80"
          r={radio}
          fill="none"
          stroke="var(--line-2, #eef1f6)"
          strokeWidth="22"
        />
        {segmentos.map((c) => (
          <circle
            key={c.id}
            cx="80"
            cy="80"
            r={radio}
            fill="none"
            stroke={COLORES_ESTADO[c.id]}
            strokeWidth="22"
            strokeDasharray={`${c.largo} ${circunferencia - c.largo}`}
            strokeDashoffset={-c.inicio}
            transform="rotate(-90 80 80)"
            opacity={activo && activo !== c.id ? 0.25 : 1}
          />
        ))}
        <text x="80" y="80" textAnchor="middle" className="d1-donut-value">
          {formatoNumero(optima?.porcentaje ?? 0, 0)}%
        </text>
        <text x="80" y="100" textAnchor="middle" className="d1-donut-caption">
          óptimas
        </text>
      </svg>

      <ul className="d1-legend">
        {categorias.map((c) => (
          <li key={c.id}>
            <button
              type="button"
              className={activo === c.id ? "is-selected" : ""}
              onClick={() => onSelect(activo === c.id ? "" : c.id)}
              title={`${c.suertes} suertes · ${formatoHectareas(c.hectareas)}`}
            >
              <span
                className="d1-dot"
                style={{ background: COLORES_ESTADO[c.id] }}
              />
              <strong>{c.etiqueta}</strong>
              <span>{formatoNumero(c.porcentaje, 0)}%</span>
            </button>
          </li>
        ))}
        {semaforo.sinDato > 0 && (
          <li className="d1-legend-note">
            {formatoEntero(semaforo.sinDato)} suertes sin TCH
          </li>
        )}
      </ul>
    </div>
  );
}

/* ---------- página ---------- */

export default function Dashboard1() {
  const { role } = useApp() ?? {};

  const [pestana, setPestana] = useState("d1");
  const [filtros, setFiltros] = useState(FILTROS_INICIALES);
  const [recarga, setRecarga] = useState(0);
  // Resultado de la última consulta respondida, identificado por su clave.
  const [resultado, setResultado] = useState({
    clave: null,
    datos: null,
    error: "",
  });

  const puedeVer = Boolean(role?.permissions?.dashboards);
  const clave = JSON.stringify({ filtros, recarga });
  const { datos, error: errorConsulta } = resultado;
  const cargando = resultado.clave !== clave;
  const error = cargando ? "" : errorConsulta;

  useEffect(() => {
    if (!puedeVer || pestana !== "d1") return undefined;

    const controlador = new AbortController();
    const parametros = new URLSearchParams(
      Object.entries(filtros).filter(
        ([, valor]) => valor !== "" && valor != null,
      ),
    );

    fetch(`${API_URL}/dashboard/d1?${parametros}`, {
      method: "GET",
      credentials: "include",
      headers: { Accept: "application/json" },
      signal: controlador.signal,
    })
      .then(async (response) => {
        const cuerpo = await response.json().catch(() => ({}));

        if (!response.ok) {
          throw new Error(
            cuerpo.mensaje ||
              cuerpo.message ||
              (response.status === 401
                ? "Tu sesión ha expirado. Inicia sesión nuevamente."
                : response.status === 403
                  ? "Tu rol no tiene permiso para consultar este dashboard."
                  : "No fue posible cargar el dashboard consolidado."),
          );
        }

        setResultado({ clave, datos: cuerpo, error: "" });
      })
      .catch((err) => {
        if (err.name === "AbortError") return;
        setResultado((previo) => ({
          clave,
          datos: previo.datos,
          error: err.message,
        }));
      });

    return () => controlador.abort();
  }, [clave, filtros, puedeVer, pestana]);

  const cambiarFiltro = useCallback((campo, valor) => {
    setFiltros((actual) => {
      const siguiente = { ...actual, [campo]: valor };
      if (campo === "zona") {
        siguiente.hacienda = "";
        siguiente.suerte = "";
      }
      if (campo === "hacienda") siguiente.suerte = "";
      return siguiente;
    });
  }, []);

  const limpiar = () => setFiltros(FILTROS_INICIALES);

  const opciones = datos?.filtros?.opciones;
  const aplicados = datos?.filtros?.aplicados ?? {};
  const meta = datos?.meta;
  const kpi = datos?.indicadores;

  const etiquetaDe = (lista, valor) =>
    lista?.find((o) => String(o.valor ?? o.id) === String(valor))?.etiqueta ??
    valor;

  const haciendasOpc = useMemo(
    () =>
      (opciones?.haciendas ?? []).map((h) => ({
        ...h,
        extra: `${h.suertes} st.`,
      })),
    [opciones],
  );

  const indicadoresOpc = useMemo(() => {
    const lista = (opciones?.indicadores ?? []).map((i) => ({
      valor: i.id,
      etiqueta: i.etiqueta,
    }));
    lista.allowEmpty = false;
    return lista;
  }, [opciones]);

  const aniosOpc = useMemo(() => {
    const lista = (opciones?.anios ?? []).map((a) => ({
      valor: String(a),
      etiqueta: `Zafra ${a}`,
    }));
    lista.allowEmpty = false;
    return lista;
  }, [opciones]);

  const hayFiltros = Object.entries(filtros).some(
    ([campo, valor]) => valor && valor !== FILTROS_INICIALES[campo],
  );

  const seleccionarBarra = (clave) => {
    if (datos?.grafico?.agrupacion === "zona") cambiarFiltro("zona", clave);
    else if (datos?.grafico?.agrupacion === "hacienda")
      cambiarFiltro("hacienda", clave);
  };

  if (!puedeVer) {
    return (
      <section className="d1-page">
        <div className="d1-state">
          <Lock size={26} />
          <h2>Acceso restringido</h2>
          <p>Tu rol no tiene permisos para consultar los dashboards.</p>
        </div>
      </section>
    );
  }

  const tituloGrafico = `${datos?.grafico?.etiquetaIndicador ?? "TCH"} por ${
    AGRUPACION_TITULO[datos?.grafico?.agrupacion] ?? "zona"
  }`;

  return (
    <section className="d1-page">
      <header className="d1-header">
        <div>
          <h1>Dashboards</h1>
          <p>
            Producción, clima, suelo y maquinaria integrados en un solo lugar
          </p>
        </div>
        {meta && (
          <span className="d1-scope">
            <MapPin size={14} />
            {meta.alcance === "global"
              ? "Todo el ingenio"
              : `Tus asignaciones · ${formatoEntero(meta.suertesAutorizadas)} suertes`}
          </span>
        )}
      </header>

      {/* PESTAÑAS */}
      <nav className="d1-tabs" aria-label="Dashboards disponibles">
        {PESTANAS.map((p) => (
          <button
            key={p.id}
            type="button"
            className={pestana === p.id ? "is-active" : ""}
            onClick={() => !p.disabled && setPestana(p.id)}
            disabled={p.disabled}
            aria-current={pestana === p.id ? "page" : undefined}
            title={p.disabled ? "Próximamente" : undefined}
          >
            {p.label}
            {p.ia && <Sparkles size={13} />}
          </button>
        ))}
      </nav>

      {pestana === "d2" ? (
        <Dashboards />
      ) : (
        <>
          {/* FILTROS FACETADOS */}
          <section className="d1-card d1-facets" aria-label="Filtros">
            <div className="d1-facets-head">
              <span className="d1-eyebrow">Filtros facetados</span>
              <span className="d1-facets-sub">
                — combinables simultáneamente
              </span>
              <button
                type="button"
                className="d1-clear"
                onClick={limpiar}
                disabled={!hayFiltros}
              >
                Limpiar
              </button>
            </div>

            <div className="d1-chips">
              <FacetChip
                label="Zona"
                value={filtros.zona}
                display={filtros.zona || "Todas"}
                options={opciones?.zonas ?? []}
                onChange={(v) => cambiarFiltro("zona", v)}
              />
              <FacetChip
                label="Hacienda"
                value={filtros.hacienda}
                display={
                  filtros.hacienda
                    ? etiquetaDe(opciones?.haciendas, filtros.hacienda)
                    : `${formatoEntero(opciones?.haciendas?.length ?? 0)} haciendas`
                }
                options={haciendasOpc}
                onChange={(v) => cambiarFiltro("hacienda", v)}
              />
              <FacetChip
                label="Suerte"
                value={filtros.suerte}
                display={
                  filtros.suerte
                    ? etiquetaDe(opciones?.suertes, filtros.suerte)
                    : "Todas"
                }
                options={opciones?.suertes ?? []}
                onChange={(v) => cambiarFiltro("suerte", v)}
                disabled={!filtros.hacienda}
                hint="Selecciona primero una hacienda"
              />
              <FacetChip
                label="Labor"
                value={filtros.labor}
                display={filtros.labor || "Todas"}
                options={(opciones?.labores ?? []).map((l) => ({
                  ...l,
                  extra: formatoEntero(l.registros),
                }))}
                onChange={(v) => cambiarFiltro("labor", v)}
                disabled={datos ? !datos.filtros?.laboresDisponible : true}
                hint="No hay tabla de labores disponible en Fabric agrícola"
              />
              <FacetChip
                label="Estado"
                value={filtros.estado}
                display={
                  filtros.estado
                    ? etiquetaDe(opciones?.estados, filtros.estado)
                    : "Todos"
                }
                options={(opciones?.estados ?? []).map((e) => ({
                  valor: e.id,
                  etiqueta: e.etiqueta,
                }))}
                onChange={(v) => cambiarFiltro("estado", v)}
              />
              <FacetChip
                label="Fecha"
                value={filtros.anio}
                display={aplicados.anio ? `Zafra ${aplicados.anio}` : "—"}
                options={aniosOpc}
                onChange={(v) => cambiarFiltro("anio", v)}
              />
              <FacetChip
                label="Indicador"
                value={filtros.indicador}
                display={etiquetaDe(opciones?.indicadores, filtros.indicador)}
                options={indicadoresOpc}
                onChange={(v) => cambiarFiltro("indicador", v)}
              />
            </div>
            {cargando && datos && (
              <div className="d1-progress" aria-hidden="true" />
            )}
          </section>

          {error ? (
            <div className="d1-state d1-state-error" role="alert">
              <h2>No fue posible cargar el dashboard</h2>
              <p>{error}</p>
              <button
                type="button"
                className="d1-retry"
                onClick={() => setRecarga((n) => n + 1)}
              >
                <RefreshCw size={15} /> Reintentar
              </button>
            </div>
          ) : !datos && cargando ? (
            <div
              className="d1-skeleton"
              aria-busy="true"
              aria-label="Cargando dashboard"
            >
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="d1-card d1-skeleton-card" />
              ))}
            </div>
          ) : (
            <div className={cargando ? "d1-content is-loading" : "d1-content"}>
              {meta?.mensaje && <p className="d1-notice">{meta.mensaje}</p>}

              {/* KPIs */}
              <div className="d1-kpis">
                <KpiCard
                  icon={LayoutGrid}
                  tone="blue"
                  label="TCH consolidado"
                  value={formatoNumero(kpi?.tch?.valor, 1)}
                  unit="ton/ha"
                >
                  <Variacion valor={kpi?.tch?.variacionPct} sufijo="%" />
                </KpiCard>

                <KpiCard
                  icon={LayoutGrid}
                  tone="green"
                  label="TCHM"
                  value={formatoNumero(kpi?.tchm?.valor, 1)}
                  unit="ton/ha·mes"
                >
                  <Variacion valor={kpi?.tchm?.variacion} />
                </KpiCard>

                <KpiCard
                  icon={CheckSquare}
                  tone="yellow"
                  label="Sacarosa fábrica"
                  value={formatoNumero(kpi?.sacarosa?.valor, 1)}
                  unit="%"
                >
                  <Variacion
                    valor={kpi?.sacarosa?.variacion}
                    sufijo=" pts"
                    estableBajo={0.1}
                  />
                </KpiCard>

                <KpiCard
                  icon={MapPin}
                  tone="blue"
                  label="Área neta"
                  value={formatoEntero(kpi?.area?.suertes)}
                  unit="suertes"
                >
                  <span className="d1-kpi-note">
                    • {formatoHectareas(kpi?.area?.hectareas)}
                  </span>
                </KpiCard>
              </div>

              {/* GRÁFICOS */}
              <div className="d1-charts">
                <article className="d1-card d1-panel">
                  <header>
                    <h2>{tituloGrafico}</h2>
                    <span>
                      {AGRUPACION_DETALLE[datos?.grafico?.agrupacion] ?? ""}
                    </span>
                  </header>
                  <BarChart
                    grafico={datos?.grafico}
                    onSelect={seleccionarBarra}
                  />
                  {datos?.grafico?.agrupacion !== "suerte" &&
                    (datos?.grafico?.barras?.length ?? 0) > 0 && (
                      <p className="d1-hint">
                        Haz clic en una barra para profundizar.
                      </p>
                    )}
                </article>

                <article className="d1-card d1-panel">
                  <header>
                    <h2>Estado de suertes</h2>
                    <span>por semáforo</span>
                  </header>
                  <EstadoDonut
                    semaforo={datos?.semaforo}
                    activo={filtros.estado}
                    onSelect={(v) => cambiarFiltro("estado", v)}
                  />
                  {datos?.semaforo?.umbrales && (
                    <p className="d1-hint">
                      TCH de la suerte frente al TCH de su zona en la zafra:
                      óptima ≥{" "}
                      {Math.round(datos.semaforo.umbrales.optima * 100)}%,
                      atención ≥{" "}
                      {Math.round(datos.semaforo.umbrales.atencion * 100)}%.
                    </p>
                  )}
                </article>
              </div>
            </div>
          )}
        </>
      )}
    </section>
  );
}
