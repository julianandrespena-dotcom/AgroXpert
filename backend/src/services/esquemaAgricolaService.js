import { getFabricAgricolaPool } from "../database/fabricAgricola.js";

/*
 * ESQUEMA DE FABRIC AGRÍCOLA
 *
 * Lee INFORMATION_SCHEMA una vez (con caché) y resuelve qué columna real
 * corresponde a cada concepto (TCH, Área neta, Año…). Así el dashboard
 * funciona aunque los nombres de columna cambien entre versiones del modelo
 * y los identificadores usados en SQL provienen del propio catálogo de la
 * base (nunca del usuario), lo que evita inyección SQL.
 *
 * Tablas configurables en backend/.env:
 *   FABRIC_AGRICOLA_TABLA_PRODUCCION (por defecto: modelo_de_datos_v2)
 *   FABRIC_AGRICOLA_TABLA_LABORES    (por defecto: primera tabla cuyo nombre contenga "labor")
 */

const CACHE_MS = 10 * 60 * 1000;

const ALIAS_PRODUCCION = {
  codsia: ["codsia", "codigo_sia", "Código de suerte", "Codigo SIA"],
  zona: ["Zona"],
  hacienda: ["Hacienda", "Cod Hacienda", "codigo_hacienda"],
  nombreHacienda: ["Nombre Hacienda", "NombreHacienda", "Nom Hacienda", "Nombre"],
  suerte: ["Suerte"],
  anio: ["Año", "Ano", "Anio", "Zafra", "year"],
  tch: ["TCH"],
  tchm: ["tchm", "TCH mensual", "TCH_Mensual"],
  sacarosa: [
    "% Sac Fabrica",
    "% Sac. Fabrica",
    "Sac Fabrica",
    "Sacarosa Fabrica",
    "% Sac. Caña",
    "% Sac Caña",
    "Sac Caña",
    "Sac_Cana",
    "SacCana",
    "Sacarosa",
  ],
  area: ["Área Neta", "Area Neta", "area_neta", "AreaNeta"],
};

const ALIAS_LABORES = {
  codsia: ["codsia", "codigo_sia"],
  hacienda: ["HACIENDA", "Cod Hacienda"],
  suerte: ["SUERTE"],
  labor: ["NOMBRE_ACTIVIDAD", "Nombre Actividad", "Labor", "Nombre Labor"],
  fecha: ["FECHA_EJECUCION", "Fecha Ejecucion", "Fecha Labor", "Fecha"],
};

const TIPOS_NUMERICOS = new Set([
  "int",
  "bigint",
  "smallint",
  "tinyint",
  "decimal",
  "numeric",
  "float",
  "real",
  "money",
  "smallmoney",
]);

const TIPOS_FECHA = new Set(["date", "datetime", "datetime2", "smalldatetime", "datetimeoffset"]);

export function normalizar(valor) {
  return String(valor ?? "")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
}

/** Identificador T-SQL seguro: [nombre] con ] escapado. */
export function q(identificador) {
  return `[${String(identificador).replace(/]/g, "]]")}]`;
}

function resolverColumnas(columnas, alias) {
  const resultado = {};

  for (const [concepto, candidatos] of Object.entries(alias)) {
    let encontrada = null;

    // 1. Coincidencia exacta (normalizada), respetando el orden de alias.
    for (const candidato of candidatos) {
      encontrada = columnas.find((c) => normalizar(c.nombre) === normalizar(candidato));
      if (encontrada) break;
    }

    // 2. Coincidencia parcial solo para alias largos (evita que "TCH" capture "tchm").
    if (!encontrada) {
      for (const candidato of candidatos) {
        const n = normalizar(candidato);
        if (n.length < 7) continue;
        encontrada = columnas.find((c) => normalizar(c.nombre).includes(n));
        if (encontrada) break;
      }
    }

    resultado[concepto] = encontrada
      ? {
          nombre: encontrada.nombre,
          tipo: encontrada.tipo,
          numerica: TIPOS_NUMERICOS.has(encontrada.tipo),
          fecha: TIPOS_FECHA.has(encontrada.tipo),
        }
      : null;
  }

  return resultado;
}

let cache = null;

export async function obtenerEsquemaAgricola({ forzar = false } = {}) {
  if (!forzar && cache && Date.now() - cache.creado < CACHE_MS) {
    return cache.esquema;
  }

  const pool = await getFabricAgricolaPool();
  const resultado = await pool.request().query(`
    SELECT TABLE_SCHEMA, TABLE_NAME, COLUMN_NAME, DATA_TYPE
    FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = 'dbo'
    ORDER BY TABLE_NAME, ORDINAL_POSITION
  `);

  const tablas = new Map();
  for (const fila of resultado.recordset ?? []) {
    const clave = String(fila.TABLE_NAME).toLowerCase();
    if (!tablas.has(clave)) tablas.set(clave, { nombre: fila.TABLE_NAME, columnas: [] });
    tablas.get(clave).columnas.push({
      nombre: fila.COLUMN_NAME,
      tipo: String(fila.DATA_TYPE ?? "").toLowerCase(),
    });
  }

  // Tabla de producción (obligatoria).
  const nombreProduccion = (process.env.FABRIC_AGRICOLA_TABLA_PRODUCCION || "modelo_de_datos_v2").toLowerCase();
  const tablaProduccion = tablas.get(nombreProduccion);

  if (!tablaProduccion) {
    throw new Error(`No existe la tabla dbo.${nombreProduccion} en Fabric agrícola.`);
  }

  const produccion = {
    tabla: tablaProduccion.nombre,
    columnas: resolverColumnas(tablaProduccion.columnas, ALIAS_PRODUCCION),
  };

  const faltantes = ["codsia", "zona", "hacienda", "anio", "tch"].filter(
    (concepto) => !produccion.columnas[concepto],
  );

  if (faltantes.length) {
    throw new Error(
      `La tabla dbo.${produccion.tabla} no tiene columnas reconocibles para: ${faltantes.join(", ")}.`,
    );
  }

  // Tabla de labores (opcional: si no existe, el filtro "Labor" se desactiva).
  let labores = null;
  const nombreLabores = process.env.FABRIC_AGRICOLA_TABLA_LABORES?.toLowerCase();
  const tablaLabores = nombreLabores
    ? tablas.get(nombreLabores)
    : [...tablas.values()].find(
        (t) => normalizar(t.nombre).includes("labor") && t.nombre.toLowerCase() !== nombreProduccion,
      );

  if (tablaLabores) {
    const columnas = resolverColumnas(tablaLabores.columnas, ALIAS_LABORES);
    const tieneLlave = columnas.codsia || (columnas.hacienda && columnas.suerte);

    if (tieneLlave && columnas.labor && columnas.fecha) {
      labores = { tabla: tablaLabores.nombre, columnas };
    }
  }

  const esquema = { produccion, labores };
  cache = { creado: Date.now(), esquema };
  return esquema;
}

/* ---------- Constructores de expresiones SQL ---------- */

/** Convierte una columna a FLOAT de forma tolerante (texto con coma decimal incluido). */
export function exprNumero(alias, columna) {
  if (!columna) return "CAST(NULL AS FLOAT)";
  const ref = `${alias}.${q(columna.nombre)}`;
  if (columna.numerica) return `CAST(${ref} AS FLOAT)`;
  return `TRY_CAST(REPLACE(LTRIM(RTRIM(CAST(${ref} AS VARCHAR(64)))), ',', '.') AS FLOAT)`;
}

export function exprTexto(alias, columna, largo = 200) {
  if (!columna) return "CAST(NULL AS VARCHAR(1))";
  return `LTRIM(RTRIM(CAST(${alias}.${q(columna.nombre)} AS VARCHAR(${largo}))))`;
}

export function exprEntero(alias, columna) {
  const ref = `${alias}.${q(columna.nombre)}`;
  if (columna.numerica) return `CAST(${ref} AS INT)`;
  if (columna.fecha) return `YEAR(${ref})`;
  return `TRY_CAST(LTRIM(RTRIM(CAST(${ref} AS VARCHAR(20)))) AS INT)`;
}

export function exprAnioFecha(alias, columna) {
  const ref = `${alias}.${q(columna.nombre)}`;
  if (columna.fecha) return `YEAR(${ref})`;
  return `YEAR(TRY_CONVERT(DATETIME2, ${ref}))`;
}

/** Código SIA de la tabla de labores: codsia directo o hacienda + suerte. */
export function exprCodigoLabor(alias, columnas) {
  if (columnas.codsia) return exprTexto(alias, columnas.codsia, 50);
  return `CONCAT(${exprTexto(alias, columnas.hacienda, 20)}, ${exprTexto(alias, columnas.suerte, 20)})`;
}

/** Solo para pruebas. */
export function _limpiarCacheEsquema() {
  cache = null;
}
