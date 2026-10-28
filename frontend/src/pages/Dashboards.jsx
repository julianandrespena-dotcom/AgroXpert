import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Activity,
  BarChart3,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Download,
  Filter,
  RefreshCw,
  Search,
  SlidersHorizontal,
  TrendingUp,
  X,
} from "lucide-react";
import "../styles/dashboard.css";

const PAGE_SIZE = 25;

const VARIABLE_GROUPS = [
  {
    id: "produccion",
    label: "Producción y rendimiento",
    description: "Indicadores de productividad y desempeño del cultivo.",
    variables: [
      { label: "TCH", aliases: ["TCH", "tch"], unit: "t/ha" },
      { label: "TCH mensual", aliases: ["tchm", "TCHM"], unit: "t/ha" },
      { label: "TAH", aliases: ["TAH", "tah"], unit: "t/ha" },
      { label: "TAHM", aliases: ["TAHM", "tahm"], unit: "t/ha" },
      {
        label: "Rendimiento",
        aliases: ["Rdto", "rdto", "Rendimiento", "rendimiento"],
        unit: "%",
      },
      {
        label: "Área neta",
        aliases: ["Área Neta", "Area Neta", "area_neta", "AreaNeta"],
        unit: "ha",
      },
      {
        label: "Número de corte",
        aliases: ["Número de corte", "Numero de corte", "numero_corte", "Corte"],
        unit: "",
      },
      {
        label: "Edad del corte",
        aliases: ["Edad del corte", "Edad", "edad_corte", "EdadCorte"],
        unit: "días",
      },
      {
        label: "Porcentaje de sacarosa",
        aliases: ["% Sac. Caña", "Sac Caña", "Sac_Cana", "SacCana"],
        unit: "%",
      },
      {
        label: "Vejez",
        aliases: ["Vejez", "vejez"],
        unit: "",
      },
    ],
  },
  {
    id: "clima",
    label: "Clima y manejo del cultivo",
    description: "Variables climáticas, riego y condiciones del cultivo.",
    variables: [
      {
        label: "Lluvia del ciclo",
        aliases: ["Lluvia del ciclo", "Lluvia_Ciclo", "LluviaCiclo"],
        unit: "mm",
      },
      {
        label: "Lluvia primeros 90 días",
        aliases: [
          "Lluvia primeros 90 días",
          "Lluvia primeros 90 dias",
          "Lluvia_90",
          "Lluvia90",
        ],
        unit: "mm",
      },
      {
        label: "Lluvia 10 días antes de cosecha",
        aliases: [
          "Lluvias 10 días antes de la cosecha anterior",
          "Lluvias 10 dias antes de la cosecha anterior",
          "Lluvia_10_dias",
          "Lluvia10Dias",
        ],
        unit: "mm",
      },
      {
        label: "Número de riegos",
        aliases: ["Número de riegos", "Numero de riegos", "Riegos", "numero_riegos"],
        unit: "",
      },
      {
        label: "Semanas de madurante",
        aliases: [
          "Semanas de madurante",
          "Semanas_Madurante",
          "SemanasMadurante",
        ],
        unit: "semanas",
      },
      {
        label: "Despoblación",
        aliases: ["Despoblación", "Despoblacion", "despoblacion"],
        unit: "%",
      },
      {
        label: "Imperfecciones de nivelación",
        aliases: [
          "Imperfecciones de nivelación",
          "Imperfecciones de nivelacion",
          "Imperfecciones_Nivelacion",
        ],
        unit: "",
      },
    ],
  },
  {
    id: "suelos",
    label: "Química del suelo",
    description: "Propiedades químicas y disponibilidad de nutrientes.",
    variables: [
      { label: "pH", aliases: ["pH", "PH", "ph"], unit: "" },
      { label: "CE", aliases: ["CE", "ce"], unit: "" },
      { label: "MO", aliases: ["MO", "mo", "Materia orgánica", "Materia Organica"], unit: "%" },
      { label: "P", aliases: ["P", "Fósforo", "Fosforo"], unit: "" },
      { label: "S", aliases: ["S", "Azufre"], unit: "" },
      { label: "Ca", aliases: ["Ca", "Calcio"], unit: "" },
      { label: "Mg", aliases: ["Mg", "Magnesio"], unit: "" },
      { label: "K", aliases: ["K", "Potasio"], unit: "" },
      { label: "Na", aliases: ["Na", "Sodio"], unit: "" },
      { label: "Al", aliases: ["Al", "Aluminio"], unit: "" },
      { label: "CIC", aliases: ["CIC", "cic"], unit: "" },
      { label: "Ca-Mg", aliases: ["Ca-Mg", "Ca_Mg", "CaMg"], unit: "" },
      { label: "Ca-K", aliases: ["Ca-K", "Ca_K", "CaK"], unit: "" },
      { label: "B", aliases: ["B", "Boro"], unit: "" },
      { label: "Cu", aliases: ["Cu", "Cobre"], unit: "" },
      { label: "Fe", aliases: ["Fe", "Hierro"], unit: "" },
      { label: "Mn", aliases: ["Mn", "Manganeso"], unit: "" },
      { label: "Zn", aliases: ["Zn", "Zinc"], unit: "" },
    ],
  },
  {
    id: "textura",
    label: "Textura y bases del suelo",
    description: "Distribución de textura y relaciones de bases.",
    variables: [
      { label: "Arena", aliases: ["Arena", "arena"], unit: "%" },
      { label: "Limos", aliases: ["Limos", "Limo", "limos"], unit: "%" },
      { label: "Arcillas", aliases: ["Arcillas", "Arcilla", "arcillas"], unit: "%" },
      { label: "Ca-BASES", aliases: ["Ca-BASES", "Ca_BASES", "CaBases"], unit: "" },
      { label: "Mg-BASES", aliases: ["Mg-BASES", "Mg_BASES", "MgBases"], unit: "" },
      { label: "K-BASES", aliases: ["K-BASES", "K_BASES", "KBases"], unit: "" },
      { label: "Na-BASES", aliases: ["Na-BASES", "Na_BASES", "NaBases"], unit: "" },
      { label: "Al-BASES", aliases: ["Al-BASES", "Al_BASES", "AlBases"], unit: "" },
    ],
  },
];

const numberFormat = new Intl.NumberFormat("es-CO", {
  maximumFractionDigits: 2,
});

function normalizeKey(value) {
  return String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
}

function toNumber(value) {
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : null;
  }

  if (value == null || String(value).trim() === "") return null;

  let text = String(value).trim().replace(/\s/g, "");

  if (text.includes(",") && text.includes(".")) {
    if (text.lastIndexOf(",") > text.lastIndexOf(".")) {
      text = text.replace(/\./g, "").replace(",", ".");
    } else {
      text = text.replace(/,/g, "");
    }
  } else if (text.includes(",")) {
    text = text.replace(",", ".");
  }

  const number = Number(text);
  return Number.isFinite(number) ? number : null;
}

function displayValue(value, unit = "") {
  const number = toNumber(value);

  if (number !== null) {
    return `${numberFormat.format(number)}${unit ? ` ${unit}` : ""}`;
  }

  if (value == null || String(value).trim() === "") return "—";
  return String(value);
}

function uniqueValues(rows, getter) {
  return [...new Set(rows.map(getter).map((v) => String(v ?? "").trim()).filter(Boolean))]
    .sort((a, b) => a.localeCompare(b, "es", { numeric: true }));
}

function average(values) {
  const valid = values.map(toNumber).filter((value) => value !== null);
  if (!valid.length) return null;
  return valid.reduce((sum, value) => sum + value, 0) / valid.length;
}

function findKey(rows, aliases) {
  if (!rows.length) return null;

  const keys = Object.keys(rows[0]);
  const normalizedKeys = keys.map((key) => ({
    key,
    normalized: normalizeKey(key),
  }));

  for (const alias of aliases) {
    const normalizedAlias = normalizeKey(alias);
    const exact = normalizedKeys.find((item) => item.normalized === normalizedAlias);
    if (exact) return exact.key;
  }

  for (const alias of aliases) {
    const normalizedAlias = normalizeKey(alias);
    if (normalizedAlias.length < 3) continue;

    const partial = normalizedKeys.find(
      (item) =>
        item.normalized.includes(normalizedAlias) ||
        normalizedAlias.includes(item.normalized)
    );

    if (partial) return partial.key;
  }

  return null;
}

function findVariable(rows, variable) {
  const key = findKey(rows, variable.aliases);
  return key ? { ...variable, key } : null;
}

function findLocationKey(rows, aliases) {
  return findKey(rows, aliases);
}

function correlation(rows, xKey, yKey) {
  const pairs = rows
    .map((row) => [toNumber(row[xKey]), toNumber(row[yKey])])
    .filter(([x, y]) => x !== null && y !== null);

  if (pairs.length < 3) return { value: null, count: pairs.length };

  const meanX = average(pairs.map(([x]) => x));
  const meanY = average(pairs.map(([, y]) => y));

  let numerator = 0;
  let denominatorX = 0;
  let denominatorY = 0;

  for (const [x, y] of pairs) {
    numerator += (x - meanX) * (y - meanY);
    denominatorX += (x - meanX) ** 2;
    denominatorY += (y - meanY) ** 2;
  }

  const denominator = Math.sqrt(denominatorX * denominatorY);

  return {
    value: denominator === 0 ? null : numerator / denominator,
    count: pairs.length,
  };
}

function correlationLabel(value) {
  if (value == null) return "No calculable";
  const absolute = Math.abs(value);

  if (absolute < 0.2) return "Muy débil";
  if (absolute < 0.4) return "Débil";
  if (absolute < 0.6) return "Moderada";
  if (absolute < 0.8) return "Fuerte";
  return "Muy fuerte";
}

function csvCell(value) {
  const text = String(value ?? "");
  return `"${text.replace(/"/g, '""')}"`;
}

function downloadCSV(rows, columns) {
  if (!rows.length || !columns.length) return;

  const content = [
    columns.map((column) => csvCell(column.label)).join(";"),
    ...rows.map((row) =>
      columns.map((column) => csvCell(row[column.key])).join(";")
    ),
  ].join("\r\n");

  const blob = new Blob(["\uFEFF", content], {
    type: "text/csv;charset=utf-8;",
  });

  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "agroxpert_datos_agricolas.csv";
  link.click();
  URL.revokeObjectURL(url);
}

function MetricCard({ label, value, detail, icon: Icon }) {
  return (
    <article className="agx-metric-card">
      <div className="agx-metric-top">
        <span>{label}</span>
        <span className="agx-metric-icon">
          <Icon size={19} />
        </span>
      </div>
      <strong className="agx-metric-value">{value}</strong>
      <span className="agx-metric-detail">{detail}</span>
    </article>
  );
}

function SectionHeading({ eyebrow, title, description, action }) {
  return (
    <div className="agx-section-heading">
      <div>
        {eyebrow && <span className="agx-eyebrow">{eyebrow}</span>}
        <h2>{title}</h2>
        {description && <p>{description}</p>}
      </div>
      {action}
    </div>
  );
}

function SearchableFilter({ label, value, onChange, options, placeholder }) {
  const listId = `agx-options-${normalizeKey(label)}`;

  return (
    <label className="agx-filter-field">
      <span>{label}</span>
      <div className="agx-input-with-icon">
        <Search size={16} aria-hidden="true" />
        <input
          list={listId}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder || `Buscar ${label.toLowerCase()}...`}
        />
        {value && (
          <button
            type="button"
            className="agx-input-clear"
            onClick={() => onChange("")}
            aria-label={`Limpiar filtro ${label}`}
          >
            <X size={14} />
          </button>
        )}
      </div>
      <datalist id={listId}>
        {options.map((option) => (
          <option key={option} value={option} />
        ))}
      </datalist>
    </label>
  );
}

function ScatterPlot({ rows, xKey, yKey, xLabel, yLabel, colorKey }) {
  const [selectedPoint, setSelectedPoint] = useState(null);

  const points = useMemo(
    () =>
      rows
        .map((row, index) => ({
          row,
          index,
          x: toNumber(row[xKey]),
          y: toNumber(row[yKey]),
        }))
        .filter((point) => point.x !== null && point.y !== null),
    [rows, xKey, yKey]
  );

  if (points.length < 2) {
    return (
      <div className="agx-chart-empty">
        No hay suficientes registros numéricos para comparar estas variables.
      </div>
    );
  }

  const width = 760;
  const height = 360;
  const left = 66;
  const right = 24;
  const top = 22;
  const bottom = 58;
  const plotWidth = width - left - right;
  const plotHeight = height - top - bottom;

  const minX = Math.min(...points.map((point) => point.x));
  const maxX = Math.max(...points.map((point) => point.x));
  const minY = Math.min(...points.map((point) => point.y));
  const maxY = Math.max(...points.map((point) => point.y));

  const rangeX = maxX - minX || 1;
  const rangeY = maxY - minY || 1;

  const xPos = (value) => left + ((value - minX) / rangeX) * plotWidth;
  const yPos = (value) => top + plotHeight - ((value - minY) / rangeY) * plotHeight;

  const groups = uniqueValues(
    points.map((point) => point.row),
    (row) => (colorKey ? row[colorKey] : "Registros")
  );

  const palette = ["#2449B3", "#00845A", "#D18B00", "#8A53B8", "#D45555", "#0C8C9E"];
  const groupColor = (value) => {
    const index = groups.indexOf(String(value ?? "").trim());
    return palette[(index < 0 ? 0 : index) % palette.length];
  };

  const tickValues = (min, max) =>
    Array.from({ length: 5 }, (_, index) => min + ((max - min) * index) / 4);

  return (
    <div className="agx-scatter-wrap">
      <svg
        className="agx-scatter-svg"
        viewBox={`0 0 ${width} ${height}`}
        role="img"
        aria-label={`Gráfico de dispersión de ${xLabel} frente a ${yLabel}`}
      >
        {tickValues(minY, maxY).map((tick, index) => {
          const y = yPos(tick);
          return (
            <g key={`y-${index}`}>
              <line
                x1={left}
                y1={y}
                x2={width - right}
                y2={y}
                stroke="#E4E8F0"
                strokeDasharray="4 5"
              />
              <text x={left - 10} y={y + 4} textAnchor="end" className="agx-axis-text">
                {numberFormat.format(tick)}
              </text>
            </g>
          );
        })}

        {tickValues(minX, maxX).map((tick, index) => {
          const x = xPos(tick);
          return (
            <g key={`x-${index}`}>
              <line
                x1={x}
                y1={top}
                x2={x}
                y2={top + plotHeight}
                stroke="#EDF0F5"
                strokeDasharray="4 5"
              />
              <text
                x={x}
                y={top + plotHeight + 22}
                textAnchor="middle"
                className="agx-axis-text"
              >
                {numberFormat.format(tick)}
              </text>
            </g>
          );
        })}

        <line
          x1={left}
          y1={top + plotHeight}
          x2={width - right}
          y2={top + plotHeight}
          stroke="#A8B1C2"
        />
        <line
          x1={left}
          y1={top}
          x2={left}
          y2={top + plotHeight}
          stroke="#A8B1C2"
        />

        {points.map((point) => {
          const groupValue = colorKey ? point.row[colorKey] : "Registros";
          const isSelected = selectedPoint === point.index;

          return (
            <g
              key={`${point.index}-${point.x}-${point.y}`}
              onMouseEnter={() => setSelectedPoint(point.index)}
              onMouseLeave={() => setSelectedPoint(null)}
            >
              <circle
                cx={xPos(point.x)}
                cy={yPos(point.y)}
                r={isSelected ? 7 : 4.5}
                fill={groupColor(groupValue)}
                fillOpacity={isSelected ? 1 : 0.72}
                stroke="#FFFFFF"
                strokeWidth={isSelected ? 2 : 1}
              >
                <title>
                  {`${xLabel}: ${displayValue(point.x)} | ${yLabel}: ${displayValue(point.y)}`}
                </title>
              </circle>
              {isSelected && (
                <g>
                  <rect
                    x={Math.min(xPos(point.x) + 10, width - 210)}
                    y={Math.max(yPos(point.y) - 44, 4)}
                    width="196"
                    height="38"
                    rx="6"
                    fill="#17233D"
                  />
                  <text
                    x={Math.min(xPos(point.x) + 18, width - 202)}
                    y={Math.max(yPos(point.y) - 28, 20)}
                    fill="#FFFFFF"
                    fontSize="11"
                  >
                    {`${xLabel}: ${numberFormat.format(point.x)}`}
                  </text>
                  <text
                    x={Math.min(xPos(point.x) + 18, width - 202)}
                    y={Math.max(yPos(point.y) - 14, 34)}
                    fill="#FFFFFF"
                    fontSize="11"
                  >
                    {`${yLabel}: ${numberFormat.format(point.y)}`}
                  </text>
                </g>
              )}
            </g>
          );
        })}

        <text
          x={left + plotWidth / 2}
          y={height - 10}
          textAnchor="middle"
          className="agx-axis-title"
        >
          {xLabel}
        </text>
        <text
          x="18"
          y={top + plotHeight / 2}
          textAnchor="middle"
          transform={`rotate(-90 18 ${top + plotHeight / 2})`}
          className="agx-axis-title"
        >
          {yLabel}
        </text>
      </svg>

      {groups.length > 1 && (
        <div className="agx-legend">
          {groups.slice(0, 10).map((group) => (
            <span key={group} className="agx-legend-item">
              <i style={{ background: groupColor(group) }} />
              {group}
            </span>
          ))}
          {groups.length > 10 && (
            <span className="agx-legend-more">
              +{groups.length - 10} grupos
            </span>
          )}
        </div>
      )}
    </div>
  );
}

function BarChart({ rows, categoryKey, metricKey, categoryLabel, metricLabel }) {
  const grouped = useMemo(() => {
    const groups = new Map();

    for (const row of rows) {
      const category = String(row[categoryKey] ?? "").trim() || "Sin dato";
      const value = toNumber(row[metricKey]);

      if (value === null) continue;

      if (!groups.has(category)) groups.set(category, []);
      groups.get(category).push(value);
    }

    return [...groups.entries()]
      .map(([label, values]) => ({
        label,
        value: average(values),
        count: values.length,
      }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 12);
  }, [rows, categoryKey, metricKey]);

  if (!grouped.length) {
    return <div className="agx-chart-empty">No hay valores suficientes para esta comparación.</div>;
  }

  const max = Math.max(...grouped.map((item) => item.value), 1);

  return (
    <div className="agx-bar-list">
      {grouped.map((item) => (
        <div className="agx-bar-row" key={item.label}>
          <div className="agx-bar-label" title={item.label}>
            {item.label}
          </div>
          <div className="agx-bar-track">
            <div
              className="agx-bar-fill"
              style={{ width: `${Math.max(2, (item.value / max) * 100)}%` }}
            />
          </div>
          <div className="agx-bar-value">{numberFormat.format(item.value)}</div>
          <div className="agx-bar-count">{item.count} obs.</div>
        </div>
      ))}
      <div className="agx-chart-footnote">
        Promedio de {metricLabel} por {categoryLabel.toLowerCase()}. Se muestran hasta 12 grupos con valores disponibles.
      </div>
    </div>
  );
}

function CorrelationMatrix({ rows, variables }) {
  const available = variables.slice(0, 8);

  if (available.length < 2) {
    return (
      <div className="agx-chart-empty">
        No se detectaron suficientes variables numéricas para construir la matriz.
      </div>
    );
  }

  const cells = available.map((rowVariable) =>
    available.map((columnVariable) => {
      if (rowVariable.key === columnVariable.key) {
        return { value: 1, count: rows.length };
      }
      return correlation(rows, rowVariable.key, columnVariable.key);
    })
  );

  const background = (value) => {
    if (value == null) return "#F0F2F6";
    const strength = Math.abs(value);
    if (value >= 0) {
      return `rgba(0, 132, 90, ${0.12 + strength * 0.72})`;
    }
    return `rgba(196, 69, 69, ${0.12 + strength * 0.72})`;
  };

  return (
    <div className="agx-matrix-scroll">
      <table className="agx-matrix">
        <thead>
          <tr>
            <th aria-label="Variable" />
            {available.map((variable) => (
              <th key={variable.key} title={variable.label}>
                {variable.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {available.map((rowVariable, rowIndex) => (
            <tr key={rowVariable.key}>
              <th>{rowVariable.label}</th>
              {available.map((columnVariable, columnIndex) => {
                const cell = cells[rowIndex][columnIndex];
                return (
                  <td
                    key={columnVariable.key}
                    style={{ background: background(cell.value) }}
                    title={`${rowVariable.label} / ${columnVariable.label}: ${
                      cell.value == null ? "No calculable" : numberFormat.format(cell.value)
                    }`}
                  >
                    <span>{cell.value == null ? "—" : numberFormat.format(cell.value)}</span>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
      <div className="agx-matrix-legend">
        <span><i className="agx-matrix-negative" /> Asociación negativa</span>
        <span><i className="agx-matrix-neutral" /> Débil o no calculable</span>
        <span><i className="agx-matrix-positive" /> Asociación positiva</span>
      </div>
    </div>
  );
}

export default function Dashboards() {
  const apiUrl = (import.meta.env.VITE_API_URL || "/api").replace(/\/$/, "");

  const [registros, setRegistros] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [actualizando, setActualizando] = useState(false);
  const [error, setError] = useState("");

  const [nivelComparacion, setNivelComparacion] = useState("Zona");
  const [zonaComparacion, setZonaComparacion] = useState("");
  const [aniosComparacion, setAniosComparacion] = useState([]);
  const [indicadorComparacion, setIndicadorComparacion] = useState("");

  const [zona, setZona] = useState("");
  const [hacienda, setHacienda] = useState("");
  const [suerte, setSuerte] = useState("");
  const [anio, setAnio] = useState("");
  const [busqueda, setBusqueda] = useState("");

  const [ejeX, setEjeX] = useState("");
  const [ejeY, setEjeY] = useState("");
  const [colorPor, setColorPor] = useState("Zona");
  const [variableBarras, setVariableBarras] = useState("");
  const [agruparPor, setAgruparPor] = useState("Zona");

  const [seccionActiva, setSeccionActiva] = useState("resumen");
  const [columnasVisibles, setColumnasVisibles] = useState([]);
  const [mostrarSelectorColumnas, setMostrarSelectorColumnas] = useState(false);
  const [pagina, setPagina] = useState(1);
  const [orden, setOrden] = useState({ key: "", direction: "asc" });

  const cargarDatos = useCallback(async (esActualizacion = false) => {
    if (esActualizacion) setActualizando(true);
    else setCargando(true);

    setError("");

    try {
      const response = await fetch(`${apiUrl}/dashboard`, {
        method: "GET",
        credentials: "include",
        headers: { Accept: "application/json" },
      });

      const result = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          result.mensaje ||
            (response.status === 401
              ? "Tu sesión ha expirado. Inicia sesión nuevamente."
              : response.status === 403
                ? "Tu rol no tiene permiso para consultar este dashboard."
                : "No fue posible cargar los datos agrícolas.")
        );
      }

      setRegistros(Array.isArray(result.registros) ? result.registros : []);
    } catch (err) {
      setError(err.message || "Ocurrió un error al cargar el dashboard.");
    } finally {
      setCargando(false);
      setActualizando(false);
    }
  }, [apiUrl]);

  useEffect(() => {
    cargarDatos();
  }, [cargarDatos]);

  const campos = useMemo(() => {
    if (!registros.length) {
      return {
        zona: null,
        hacienda: null,
        suerte: null,
        anio: null,
      };
    }

    return {
      zona: findLocationKey(registros, ["Zona", "zona"]),
      hacienda: findLocationKey(registros, ["Hacienda", "hacienda"]),
      suerte: findLocationKey(registros, ["codsia", "codigo_sia", "Código de suerte", "Suerte"]),
      anio: findLocationKey(registros, ["Año", "Ano", "Anio", "anio", "year"]),
    };
  }, [registros]);

  const columnas = useMemo(() => {
    if (!registros.length) return [];

    return Object.keys(registros[0]).map((key) => ({
      key,
      label: key,
      numeric: registros.some((row) => toNumber(row[key]) !== null),
    }));
  }, [registros]);

  const variablesDisponibles = useMemo(() => {
    const mapped = VARIABLE_GROUPS.flatMap((group) =>
      group.variables
        .map((variable) => findVariable(registros, variable))
        .filter(Boolean)
        .map((variable) => ({ ...variable, group: group.label, groupId: group.id }))
    );

    const used = new Set(mapped.map((variable) => variable.key));

    const extraNumeric = columnas
      .filter((column) => column.numeric && !used.has(column.key))
      .map((column) => ({
        label: column.label,
        key: column.key,
        unit: "",
        group: "Otras variables",
        groupId: "otras",
      }));

    return [...mapped, ...extraNumeric];
  }, [registros, columnas]);

  const numericColumns = useMemo(
    () => columnas.filter((column) => column.numeric),
    [columnas]
  );

  useEffect(() => {
    if (!variablesDisponibles.length) return;

    const first = variablesDisponibles.find((variable) =>
      ["tch", "tchm"].includes(normalizeKey(variable.label))
    ) || variablesDisponibles[0];

    const second = variablesDisponibles.find((variable) =>
      ["lluvia del ciclo", "edad del corte", "ph", "mo"].includes(normalizeKey(variable.label))
    ) || variablesDisponibles.find((variable) => variable.key !== first.key);

    setEjeX((current) =>
      variablesDisponibles.some((variable) => variable.key === current)
        ? current
        : second?.key || first.key
    );

    setEjeY((current) =>
      variablesDisponibles.some((variable) => variable.key === current)
        ? current
        : first.key
    );

    setVariableBarras((current) =>
      variablesDisponibles.some((variable) => variable.key === current)
        ? current
        : first.key
    );
  }, [variablesDisponibles]);

  const zonas = useMemo(
    () => uniqueValues(registros, (row) => campos.zona ? row[campos.zona] : ""),
    [registros, campos.zona]
  );

  const haciendas = useMemo(
    () =>
      uniqueValues(
        registros.filter((row) => !zona || String(row[campos.zona] ?? "") === zona),
        (row) => campos.hacienda ? row[campos.hacienda] : ""
      ),
    [registros, campos.hacienda, campos.zona, zona]
  );

  const suertes = useMemo(
    () =>
      uniqueValues(
        registros.filter(
          (row) =>
            (!zona || String(row[campos.zona] ?? "") === zona) &&
            (!hacienda || String(row[campos.hacienda] ?? "") === hacienda)
        ),
        (row) => campos.suerte ? row[campos.suerte] : ""
      ),
    [registros, campos.suerte, campos.zona, campos.hacienda, zona, hacienda]
  );

  const anios = useMemo(
    () => uniqueValues(registros, (row) => campos.anio ? row[campos.anio] : ""),
    [registros, campos.anio]
  );

  const zonasComparacion = zonas;

const registrosBaseComparacion = useMemo(() => {
  const query = normalizeKey(busqueda);

  return registros.filter((row) => {
    // La comparación utiliza su propia zona y sus propios años.
    // Los filtros globales de hacienda, suerte y búsqueda se mantienen.
    if (hacienda && String(row[campos.hacienda] ?? "") !== hacienda) {
      return false;
    }

    if (suerte && String(row[campos.suerte] ?? "") !== suerte) {
      return false;
    }

    if (query) {
      const found = Object.values(row).some((value) =>
        normalizeKey(value).includes(query)
      );

      if (!found) return false;
    }

    return true;
  });
}, [registros, hacienda, suerte, busqueda, campos]);

const aniosComparacionDisponibles = useMemo(
  () =>
    uniqueValues(
      registrosBaseComparacion.filter(
        (row) =>
          !zonaComparacion ||
          String(row[campos.zona] ?? "") === zonaComparacion
      ),
      (row) => (campos.anio ? row[campos.anio] : "")
    ),
  [registrosBaseComparacion, zonaComparacion, campos]
);

useEffect(() => {
  setAniosComparacion((actuales) =>
    actuales.filter((year) => aniosComparacionDisponibles.includes(year))
  );
}, [aniosComparacionDisponibles]);

useEffect(() => {
  if (!zonaComparacion && zonasComparacion.length) {
    setZonaComparacion(zona || zonasComparacion[0]);
  }
}, [zona, zonaComparacion, zonasComparacion]);

useEffect(() => {
  if (
    indicadorComparacion &&
    variablesDisponibles.some(
      (variable) => variable.key === indicadorComparacion
    )
  ) {
    return;
  }

  const preferida = variablesDisponibles.find(
    (variable) => normalizeKey(variable.label) === "tch"
  );

  setIndicadorComparacion(
    preferida?.key || variablesDisponibles[0]?.key || ""
  );
}, [variablesDisponibles, indicadorComparacion]);

const datosComparacionAnual = useMemo(() => {
  if (!campos.anio || !campos.zona || !indicadorComparacion) {
    return [];
  }

  return aniosComparacion
    .map((year) => {
      const filas = registrosBaseComparacion.filter(
        (row) =>
          String(row[campos.zona] ?? "") === zonaComparacion &&
          String(row[campos.anio] ?? "") === year
      );

      const valores = filas
        .map((row) => toNumber(row[indicadorComparacion]))
        .filter((value) => value !== null);

      return {
        year,
        value: average(valores),
        count: valores.length,
      };
    })
    .filter((item) => item.value !== null)
    .sort((a, b) =>
      a.year.localeCompare(b.year, "es", { numeric: true })
    );
}, [
  campos,
  registrosBaseComparacion,
  zonaComparacion,
  aniosComparacion,
  indicadorComparacion,
]);

  const filtrados = useMemo(() => {
    const query = normalizeKey(busqueda);

    return registros.filter((row) => {
      if (zona && String(row[campos.zona] ?? "") !== zona) return false;
      if (hacienda && String(row[campos.hacienda] ?? "") !== hacienda) return false;
      if (suerte && String(row[campos.suerte] ?? "") !== suerte) return false;
      if (anio && String(row[campos.anio] ?? "") !== anio) return false;

      if (query) {
        const found = Object.values(row).some((value) =>
          normalizeKey(value).includes(query)
        );
        if (!found) return false;
      }

      return true;
    });
  }, [registros, zona, hacienda, suerte, anio, busqueda, campos]);

  useEffect(() => {
    setPagina(1);
  }, [zona, hacienda, suerte, anio, busqueda, orden.key, orden.direction]);

  const tchVariable = variablesDisponibles.find(
    (variable) => normalizeKey(variable.label) === "tch"
  );
  const tchmVariable = variablesDisponibles.find(
    (variable) => normalizeKey(variable.label) === "tchmensual"
  );
  const tahVariable = variablesDisponibles.find(
    (variable) => normalizeKey(variable.label) === "tah"
  );
  const areaVariable = variablesDisponibles.find(
    (variable) => normalizeKey(variable.label) === "areaneta"
  );

  const totalSuertes = useMemo(() => {
    if (!campos.suerte) return filtrados.length;
    return new Set(
      filtrados.map((row) => String(row[campos.suerte] ?? "").trim()).filter(Boolean)
    ).size;
  }, [filtrados, campos.suerte]);

  const metricas = useMemo(() => {
    const sumArea = areaVariable
      ? filtrados.reduce((sum, row) => sum + (toNumber(row[areaVariable.key]) ?? 0), 0)
      : null;

    return {
      tch: tchVariable ? average(filtrados.map((row) => row[tchVariable.key])) : null,
      tchm: tchmVariable ? average(filtrados.map((row) => row[tchmVariable.key])) : null,
      tah: tahVariable ? average(filtrados.map((row) => row[tahVariable.key])) : null,
      area: areaVariable ? sumArea : null,
    };
  }, [filtrados, tchVariable, tchmVariable, tahVariable, areaVariable]);

  const variableX = variablesDisponibles.find((variable) => variable.key === ejeX);
  const variableY = variablesDisponibles.find((variable) => variable.key === ejeY);
  const variableSeleccionadaBarras = variablesDisponibles.find(
    (variable) => variable.key === variableBarras
  );

  const groupKey = useMemo(() => {
    const map = {
      Zona: campos.zona,
      Hacienda: campos.hacienda,
      Suerte: campos.suerte,
      Año: campos.anio,
    };
    return map[agruparPor] || campos.zona;
  }, [agruparPor, campos]);

  const statsRelacion = useMemo(
    () =>
      variableX && variableY
        ? correlation(filtrados, variableX.key, variableY.key)
        : { value: null, count: 0 },
    [filtrados, variableX, variableY]
  );

  const filasOrdenadas = useMemo(() => {
    if (!orden.key) return filtrados;

    return [...filtrados].sort((a, b) => {
      const aNumber = toNumber(a[orden.key]);
      const bNumber = toNumber(b[orden.key]);

      let comparison;

      if (aNumber !== null && bNumber !== null) {
        comparison = aNumber - bNumber;
      } else {
        comparison = String(a[orden.key] ?? "").localeCompare(
          String(b[orden.key] ?? ""),
          "es",
          { numeric: true }
        );
      }

      return orden.direction === "asc" ? comparison : -comparison;
    });
  }, [filtrados, orden]);

  const columnasSeleccionadas = useMemo(() => {
    if (!columnasVisibles.length) return columnas.slice(0, 8);
    return columnas.filter((column) => columnasVisibles.includes(column.key));
  }, [columnas, columnasVisibles]);

  const totalPaginas = Math.max(1, Math.ceil(filasOrdenadas.length / PAGE_SIZE));
  const filasPagina = filasOrdenadas.slice((pagina - 1) * PAGE_SIZE, pagina * PAGE_SIZE);

  const limpiarFiltros = () => {
    setZona("");
    setHacienda("");
    setSuerte("");
    setAnio("");
    setBusqueda("");
  };

  const cambiarOrden = (key) => {
    setOrden((current) => ({
      key,
      direction:
        current.key === key && current.direction === "asc" ? "desc" : "asc",
    }));
  };

  const secciones = [
    { id: "resumen", label: "Resumen", icon: Activity },
    { id: "relaciones", label: "Relaciones", icon: TrendingUp },
    { id: "comparacion", label: "Comparaciones", icon: BarChart3 },
    { id: "suelos", label: "Suelos y clima", icon: SlidersHorizontal },
    { id: "datos", label: "Explorador de datos", icon: Filter },
  ];

  const variablesDeSuelosClima = variablesDisponibles.filter((variable) =>
    ["suelos", "textura", "clima"].includes(variable.groupId)
  );

  if (cargando) {
    return (
      <main className="agx-dashboard">
        <div className="agx-state-card">
          <RefreshCw className="agx-spin" size={26} />
          <h2>Cargando análisis agrícola</h2>
          <p>Consultando los datos autorizados para tu usuario.</p>
        </div>
      </main>
    );
  }

  if (error && registros.length === 0) {
    return (
      <main className="agx-dashboard">
        <div className="agx-state-card agx-state-error">
          <Activity size={28} />
          <h2>No fue posible cargar el dashboard</h2>
          <p>{error}</p>
          <button className="agx-button agx-button-primary" onClick={() => cargarDatos()}>
            <RefreshCw size={16} /> Reintentar
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="agx-dashboard">
      <header className="agx-dashboard-header">
        <div>
          <span className="agx-eyebrow">AGROXPERT · INTELIGENCIA AGRONÓMICA</span>
          <h1>Centro de análisis agrícola</h1>
          <p>
            Explora la productividad, compara condiciones agronómicas y encuentra
            relaciones en los datos de tus unidades productivas.
          </p>
        </div>
        <button
          className="agx-button agx-button-secondary"
          onClick={() => cargarDatos(true)}
          disabled={actualizando}
        >
          <RefreshCw size={16} className={actualizando ? "agx-spin" : ""} />
          {actualizando ? "Actualizando..." : "Actualizar datos"}
        </button>
      </header>

      {error && (
        <div className="agx-inline-error" role="alert">
          {error}
        </div>
      )}

      <section className="agx-filter-panel" aria-label="Filtros del dashboard">
        <div className="agx-filter-panel-heading">
          <div className="agx-filter-title">
            <Filter size={18} />
            <div>
              <strong>Contexto de análisis</strong>
              <span>Los filtros se aplican a todos los gráficos y a la tabla.</span>
            </div>
          </div>
          <button className="agx-text-button" onClick={limpiarFiltros}>
            Limpiar filtros
          </button>
        </div>

        <div className="agx-filter-grid">
          <SearchableFilter label="Zona" value={zona} onChange={(value) => {
            setZona(value);
            setHacienda("");
            setSuerte("");
          }} options={zonas} />
          <SearchableFilter label="Hacienda" value={hacienda} onChange={(value) => {
            setHacienda(value);
            setSuerte("");
          }} options={haciendas} />
          <SearchableFilter label="Suerte" value={suerte} onChange={setSuerte} options={suertes} />
          <SearchableFilter label="Año" value={anio} onChange={setAnio} options={anios} />
        </div>

        <div className="agx-filter-summary">
          <span>
            <strong>{numberFormat.format(filtrados.length)}</strong> registros
          </span>
          <span>
            <strong>{numberFormat.format(totalSuertes)}</strong> suertes únicas
          </span>
          <span>Datos visibles según tus permisos</span>
        </div>
      </section>

      <nav className="agx-dashboard-tabs" aria-label="Secciones del dashboard">
        {secciones.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            className={seccionActiva === id ? "agx-tab agx-tab-active" : "agx-tab"}
            onClick={() => setSeccionActiva(id)}
          >
            <Icon size={16} />
            {label}
          </button>
        ))}
      </nav>

      {seccionActiva === "resumen" && (
        <section className="agx-section">
          <SectionHeading
            eyebrow="VISTA GENERAL"
            title="Resumen de productividad"
            description="Indicadores calculados a partir de los registros incluidos en el contexto actual."
          />

          <div className="agx-metrics-grid">
            <MetricCard
              label="TCH promedio"
              value={metricas.tch == null ? "—" : numberFormat.format(metricas.tch)}
              detail={tchVariable ? "Toneladas de caña por hectárea" : "Variable no disponible"}
              icon={TrendingUp}
            />
            <MetricCard
              label="TCH mensual promedio"
              value={metricas.tchm == null ? "—" : numberFormat.format(metricas.tchm)}
              detail={tchmVariable ? "Según los registros disponibles" : "Variable no disponible"}
              icon={Activity}
            />
            <MetricCard
              label="TAH promedio"
              value={metricas.tah == null ? "—" : numberFormat.format(metricas.tah)}
              detail={tahVariable ? "Indicador de productividad" : "Variable no disponible"}
              icon={BarChart3}
            />
            <MetricCard
              label="Área neta acumulada"
              value={metricas.area == null ? "—" : numberFormat.format(metricas.area)}
              detail={areaVariable ? "Suma de áreas registradas (ha)" : "Variable no disponible"}
              icon={SlidersHorizontal}
            />
          </div>

          <div className="agx-chart-grid agx-chart-grid-main">
            <article className="agx-panel agx-panel-wide">
              <SectionHeading
                title="Distribución de productividad por grupo"
                description="Compara el promedio de una variable entre zonas, haciendas u otros grupos."
              />
              <div className="agx-chart-controls">
                <label>
                  <span>Indicador</span>
                  <select value={variableBarras} onChange={(event) => setVariableBarras(event.target.value)}>
                    {variablesDisponibles.map((variable) => (
                      <option key={variable.key} value={variable.key}>{variable.label}</option>
                    ))}
                  </select>
                </label>
                <label>
                  <span>Agrupar por</span>
                  <select value={agruparPor} onChange={(event) => setAgruparPor(event.target.value)}>
                    {[
                      ["Zona", campos.zona],
                      ["Hacienda", campos.hacienda],
                      ["Año", campos.anio],
                    ].filter(([, key]) => key).map(([label]) => (
                      <option key={label} value={label}>{label}</option>
                    ))}
                  </select>
                </label>
              </div>
              {groupKey && variableSeleccionadaBarras ? (
                <BarChart
                  rows={filtrados}
                  categoryKey={groupKey}
                  metricKey={variableSeleccionadaBarras.key}
                  categoryLabel={agruparPor}
                  metricLabel={variableSeleccionadaBarras.label}
                />
              ) : (
                <div className="agx-chart-empty">No se encontró una columna adecuada para agrupar los datos.</div>
              )}
            </article>

            <article className="agx-panel">
              <SectionHeading
                title="Calidad de los datos"
                description="Cobertura del contexto seleccionado."
              />
              <div className="agx-quality-list">
                <div>
                  <span>Registros disponibles</span>
                  <strong>{numberFormat.format(filtrados.length)}</strong>
                </div>
                <div>
                  <span>Suertes únicas</span>
                  <strong>{numberFormat.format(totalSuertes)}</strong>
                </div>
                <div>
                  <span>Variables numéricas detectadas</span>
                  <strong>{numberFormat.format(numericColumns.length)}</strong>
                </div>
                <div>
                  <span>Variables agronómicas reconocidas</span>
                  <strong>{numberFormat.format(variablesDisponibles.length)}</strong>
                </div>
              </div>
              <p className="agx-chart-footnote">
                Las variables se detectan a partir de las columnas que devuelve la fuente.
                Los indicadores sin datos suficientes se muestran como “—”.
              </p>
            </article>
          </div>
        </section>
      )}

      {seccionActiva === "relaciones" && (
        <section className="agx-section">
          <SectionHeading
            eyebrow="ANÁLISIS EXPLORATORIO"
            title="Explorador de relaciones"
            description="Selecciona dos variables para estudiar su asociación entre las suertes del contexto filtrado."
          />

          <article className="agx-panel">
            <div className="agx-relation-controls">
              <label>
                <span>Variable independiente · X</span>
                <select
                  value={ejeX}
                  onChange={(event) => setEjeX(event.target.value)}
                >
                  {variablesDisponibles.map((variable) => (
                    <option key={variable.key} value={variable.key}>
                      {variable.label}
                      {variable.unit ? ` (${variable.unit})` : ""}
                    </option>
                  ))}
                </select>
              </label>

              <button
                className="agx-swap-button"
                type="button"
                title="Intercambiar ejes"
                onClick={() => {
                  setEjeX(ejeY);
                  setEjeY(ejeX);
                }}
              >
                ↔
              </button>

              <label>
                <span>Variable dependiente · Y</span>
                <select
                  value={ejeY}
                  onChange={(event) => setEjeY(event.target.value)}
                >
                  {variablesDisponibles.map((variable) => (
                    <option key={variable.key} value={variable.key}>
                      {variable.label}
                      {variable.unit ? ` (${variable.unit})` : ""}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            {variableX && variableY && variableX.key !== variableY.key ? (
              <>
                <div className="agx-relation-statistics">
                  <div>
                    <span>Correlación de Pearson (r)</span>
                    <strong>
                      {statsRelacion.value == null
                        ? "No calculable"
                        : numberFormat.format(statsRelacion.value)}
                    </strong>
                  </div>
                  <div>
                    <span>Asociación lineal</span>
                    <strong>{correlationLabel(statsRelacion.value)}</strong>
                  </div>
                  <div>
                    <span>Pares válidos</span>
                    <strong>{numberFormat.format(statsRelacion.count)}</strong>
                  </div>
                </div>

                <ScatterPlot
                  rows={filtrados}
                  xKey={variableX.key}
                  yKey={variableY.key}
                  xLabel={variableX.label}
                  yLabel={variableY.label}
                  colorKey={null}
                />

                <p className="agx-analysis-note">
                  La correlación de Pearson mide asociación lineal entre los valores numéricos
                  disponibles. No demuestra causalidad. La selección de filtros cambia los
                  registros incluidos en el cálculo.
                </p>
              </>
            ) : (
              <div className="agx-chart-empty">
                Selecciona dos variables diferentes para comparar su relación.
              </div>
            )}
          </article>

          <article className="agx-panel">
            <SectionHeading
              title="Matriz de correlaciones"
              description="Vista rápida de las asociaciones lineales entre variables numéricas reconocidas."
            />
            <CorrelationMatrix rows={filtrados} variables={variablesDisponibles.filter((variable) =>
              ["produccion", "clima", "suelos"].includes(variable.groupId)
            )} />
            <p className="agx-analysis-note">
              Verde representa asociación positiva y rojo asociación negativa. La matriz muestra
              correlaciones, no efectos causales. Para una interpretación agronómica se deben
              considerar el tamaño de muestra, el contexto y la calidad de los datos.
            </p>
          </article>
        </section>
      )}

      {seccionActiva === "comparacion" && (
        <section className="agx-section">
            <SectionHeading
              eyebrow="COMPARACIÓN HISTÓRICA"
              title="Comparación de indicadores por año"
              description="Selecciona una zona, un indicador y varios años para comparar sus promedios. Los filtros globales de hacienda, suerte y búsqueda se conservan."
            />

            <article className="agx-panel">
              <div className="agx-year-comparison-controls">
                <label>
                  <span>Zona</span>
                  <select
                    value={zonaComparacion}
                    onChange={(event) => {
                      setZonaComparacion(event.target.value);
                      setAniosComparacion([]);
                    }}
                  >
                    <option value="">Seleccionar zona</option>
                    {zonasComparacion.map((item) => (
                      <option key={item} value={item}>
                        {item}
                      </option>
                    ))}
                  </select>
                </label>

                <label>
                  <span>Indicador</span>
                  <select
                    value={indicadorComparacion}
                    onChange={(event) =>
                      setIndicadorComparacion(event.target.value)
                    }
                  >
                    {variablesDisponibles.map((variable) => (
                      <option key={variable.key} value={variable.key}>
                        {variable.label}
                        {variable.unit ? ` (${variable.unit})` : ""}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              <div className="agx-year-picker">
                <div className="agx-year-picker-heading">
                  <strong>Años que deseas comparar</strong>
                  <div>
                    <button
                      type="button"
                      className="agx-text-button"
                      onClick={() =>
                        setAniosComparacion([...aniosComparacionDisponibles])
                      }
                    >
                      Seleccionar todos
                    </button>
                    <button
                      type="button"
                      className="agx-text-button"
                      onClick={() => setAniosComparacion([])}
                    >
                      Limpiar
                    </button>
                  </div>
                </div>

                <div className="agx-year-options">
                  {aniosComparacionDisponibles.map((year) => (
                    <label className="agx-year-option" key={year}>
                      <input
                        type="checkbox"
                        checked={aniosComparacion.includes(year)}
                        onChange={(event) => {
                          setAniosComparacion((current) =>
                            event.target.checked
                              ? [...current, year].sort((a, b) =>
                                  a.localeCompare(b, "es", { numeric: true })
                                )
                              : current.filter((item) => item !== year)
                          );
                        }}
                      />
                      <span>{year}</span>
                    </label>
                  ))}
                </div>
              </div>

              {datosComparacionAnual.length > 0 ? (
                <>
                  <div className="agx-year-chart-summary">
                    <span>
                      Indicador:{" "}
                      <strong>
                        {
                          variablesDisponibles.find(
                            (variable) =>
                              variable.key === indicadorComparacion
                          )?.label
                        }
                      </strong>
                    </span>
                    <span>
                      Zona: <strong>{zonaComparacion}</strong>
                    </span>
                    <span>
                      Años comparados:{" "}
                      <strong>{datosComparacionAnual.length}</strong>
                    </span>
                  </div>

                  <div className="agx-year-chart">
                    {(() => {
                      const max = Math.max(
                        ...datosComparacionAnual.map((item) =>
                          Math.abs(item.value)
                        ),
                        1
                      );

                      return datosComparacionAnual.map((item) => (
                        <div className="agx-year-bar-row" key={item.year}>
                          <span className="agx-year-bar-label">{item.year}</span>

                          <div
                            className="agx-year-bar-track"
                            role="img"
                            aria-label={`${item.year}: ${numberFormat.format(
                              item.value
                            )}`}
                          >
                            <div
                              className="agx-year-bar-fill"
                              style={{
                                width: `${Math.max(
                                  1,
                                  (Math.abs(item.value) / max) * 100
                                )}%`,
                              }}
                            />
                          </div>

                          <strong className="agx-year-bar-value">
                            {numberFormat.format(item.value)}
                          </strong>

                          <span className="agx-year-bar-count">
                            {item.count} obs.
                          </span>
                        </div>
                      ));
                    })()}
                  </div>

                  <p className="agx-chart-footnote">
                    Cada barra representa el promedio del indicador en ese año para
                    la zona seleccionada. “Obs.” indica cuántos valores numéricos
                    se utilizaron en el cálculo.
                  </p>
                </>
              ) : (
                <div className="agx-chart-empty">
                  {!campos.anio
                    ? "No se detectó una columna de año en los datos."
                    : !zonaComparacion
                      ? "Selecciona una zona para comenzar."
                      : aniosComparacion.length === 0
                        ? "Selecciona uno o varios años para compararlos."
                        : "No hay valores numéricos disponibles para la selección actual."}
                </div>
              )}
            </article>
          </section>
      )}

      {seccionActiva === "suelos" && (
        <section className="agx-section">
          <SectionHeading
            eyebrow="CONDICIONES AGRONÓMICAS"
            title="Suelos y clima"
            description="Explora variables disponibles para el contexto actual. Puedes cruzarlas en la sección Relaciones."
          />

          {["suelos", "textura", "clima"].map((groupId) => {
            const group = VARIABLE_GROUPS.find((item) => item.id === groupId);
            const variables = variablesDeSuelosClima.filter((variable) => variable.groupId === groupId);

            if (!variables.length) return null;

            return (
              <article className="agx-panel" key={groupId}>
                <SectionHeading title={group.label} description={group.description} />
                <div className="agx-variable-cards">
                  {variables.map((variable) => {
                    const mean = average(filtrados.map((row) => row[variable.key]));
                    const validCount = filtrados.filter((row) => toNumber(row[variable.key]) !== null).length;

                    return (
                      <button
                        type="button"
                        className="agx-variable-card"
                        key={variable.key}
                        onClick={() => {
                          setEjeX(variable.key);
                          if (tchVariable) setEjeY(tchVariable.key);
                          else if (variablesDisponibles.length > 1) {
                            setEjeY(variablesDisponibles.find((item) => item.key !== variable.key)?.key || variable.key);
                          }
                          setSeccionActiva("relaciones");
                        }}
                        title={`Explorar relación entre ${variable.label} y productividad`}
                      >
                        <span>{variable.label}</span>
                        <strong>{mean == null ? "—" : displayValue(mean, variable.unit)}</strong>
                        <small>{validCount} observaciones numéricas</small>
                        <span className="agx-variable-link">Analizar relación →</span>
                      </button>
                    );
                  })}
                </div>
              </article>
            );
          })}

          <article className="agx-panel">
            <SectionHeading
              title="Relaciones entre suelo y productividad"
              description="Selecciona una variable del suelo para investigar su asociación con el TCH u otro indicador."
            />
            <button
              className="agx-button agx-button-primary"
              onClick={() => {
                const soilVariable = variablesDeSuelosClima.find((variable) =>
                  ["suelos", "textura"].includes(variable.groupId)
                );
                if (soilVariable) setEjeX(soilVariable.key);
                if (tchVariable) setEjeY(tchVariable.key);
                setSeccionActiva("relaciones");
              }}
              disabled={!variablesDeSuelosClima.some((variable) =>
                ["suelos", "textura"].includes(variable.groupId)
              )}
            >
              <TrendingUp size={16} />
              Abrir explorador de relaciones
            </button>
          </article>
        </section>
      )}

      {seccionActiva === "datos" && (
        <section className="agx-section">
          <SectionHeading
            eyebrow="TRANSPARENCIA Y DETALLE"
            title="Explorador de datos"
            description="Busca registros, ordena columnas y exporta el conjunto filtrado para análisis complementarios."
            action={
              <button
                className="agx-button agx-button-secondary"
                onClick={() => downloadCSV(filasOrdenadas, columnas)}
                disabled={!filasOrdenadas.length}
              >
                <Download size={16} /> Exportar CSV
              </button>
            }
          />

          <div className="agx-data-toolbar">
            <label className="agx-global-search">
              <Search size={17} />
              <input
                value={busqueda}
                onChange={(event) => setBusqueda(event.target.value)}
                placeholder="Buscar en todas las columnas..."
              />
              {busqueda && (
                <button type="button" onClick={() => setBusqueda("")} aria-label="Limpiar búsqueda">
                  <X size={15} />
                </button>
              )}
            </label>

            <div className="agx-column-selector-wrap">
              <button
                className="agx-button agx-button-secondary"
                onClick={() => setMostrarSelectorColumnas((value) => !value)}
                aria-expanded={mostrarSelectorColumnas}
              >
                <SlidersHorizontal size={16} />
                Columnas
                <ChevronDown size={15} />
              </button>

              {mostrarSelectorColumnas && (
                <div className="agx-column-selector">
                  <div className="agx-column-selector-heading">
                    <strong>Columnas visibles</strong>
                    <button type="button" onClick={() => setMostrarSelectorColumnas(false)} aria-label="Cerrar selector">
                      <X size={15} />
                    </button>
                  </div>
                  {columnas.map((column) => (
                    <label key={column.key}>
                      <input
                        type="checkbox"
                        checked={
                          columnasVisibles.length === 0
                            ? columnas.slice(0, 8).some((item) => item.key === column.key)
                            : columnasVisibles.includes(column.key)
                        }
                        onChange={(event) => {
                          setColumnasVisibles((current) => {
                            const base = current.length ? current : columnas.slice(0, 8).map((item) => item.key);
                            return event.target.checked
                              ? [...new Set([...base, column.key])]
                              : base.filter((key) => key !== column.key);
                          });
                        }}
                      />
                      {column.label}
                    </label>
                  ))}
                  <button
                    className="agx-text-button"
                    onClick={() => setColumnasVisibles(columnas.slice(0, 8).map((column) => column.key))}
                  >
                    Restaurar selección inicial
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="agx-table-meta">
            <span>{numberFormat.format(filasOrdenadas.length)} registros encontrados</span>
            <span>Página {pagina} de {totalPaginas}</span>
          </div>

          {filasOrdenadas.length === 0 ? (
            <div className="agx-chart-empty">
              No hay registros que coincidan con los filtros y la búsqueda.
            </div>
          ) : (
            <>
              <div className="agx-table-wrap">
                <table className="agx-data-table">
                  <thead>
                    <tr>
                      {columnasSeleccionadas.map((column) => (
                        <th key={column.key}>
                          <button type="button" onClick={() => cambiarOrden(column.key)}>
                            {column.label}
                            {orden.key === column.key && (
                              <span>{orden.direction === "asc" ? " ↑" : " ↓"}</span>
                            )}
                          </button>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filasPagina.map((row, index) => (
                      <tr key={`${String(row[campos.suerte] ?? "registro")}-${(pagina - 1) * PAGE_SIZE + index}`}>
                        {columnasSeleccionadas.map((column) => (
                          <td key={column.key}>
                            {displayValue(row[column.key])}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="agx-pagination">
                <span>
                  Mostrando {(pagina - 1) * PAGE_SIZE + 1}–{Math.min(pagina * PAGE_SIZE, filasOrdenadas.length)} de {filasOrdenadas.length}
                </span>
                <div>
                  <button
                    className="agx-page-button"
                    disabled={pagina <= 1}
                    onClick={() => setPagina((current) => Math.max(1, current - 1))}
                    aria-label="Página anterior"
                  >
                    <ChevronLeft size={17} />
                  </button>
                  <button
                    className="agx-page-button"
                    disabled={pagina >= totalPaginas}
                    onClick={() => setPagina((current) => Math.min(totalPaginas, current + 1))}
                    aria-label="Página siguiente"
                  >
                    <ChevronRight size={17} />
                  </button>
                </div>
              </div>
            </>
          )}
        </section>
      )}

      <footer className="agx-dashboard-footer">
        <span>AgroXpert · Análisis de datos agrícolas</span>
        <span>Las visualizaciones respetan el conjunto de datos autorizado por el servidor.</span>
      </footer>
    </main>
  );
}