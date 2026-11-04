import sql from "mssql";
import { getFabricAgricolaPool } from "../database/fabricAgricola.js";
import { obtenerCodigosAutorizados } from "../services/permisosAgricolasService.js";
import {
  exprAnioFecha,
  exprCodigoLabor,
  exprEntero,
  exprNumero,
  exprTexto,
  obtenerEsquemaAgricola,
  q,
} from "../services/esquemaAgricolaService.js";

/*
 * DASHBOARD 1 · CONSOLIDADO
 *
 * GET /api/dashboard/d1?anio=&zona=&hacienda=&suerte=&labor=&estado=&indicador=
 *
 * Toda la agregación se hace en Fabric (SQL) sobre la tabla completa de
 * producción, restringida a las suertes autorizadas del usuario. Al
 * navegador solo viajan indicadores y series ya calculadas.
 */

// Semáforo provisional: TCH de la suerte frente al TCH ponderado de su zona
// en la misma zafra (toda la base agrícola). Ajustar con el criterio experto.
export const UMBRALES_SEMAFORO = { optima: 0.95, atencion: 0.8 };

const ESTADOS = [
  { id: "optima", etiqueta: "Óptima" },
  { id: "atencion", etiqueta: "Atención" },
  { id: "critica", etiqueta: "Crítica" },
];

const INDICADORES = {
  TCH: { campo: "tch", etiqueta: "TCH", unidad: "ton/ha" },
  TCHM: { campo: "tchm", etiqueta: "TCHM", unidad: "ton/ha·mes" },
  SACAROSA: { campo: "sac", etiqueta: "Sacarosa", unidad: "%" },
};

const MAX_BARRAS = 12;

/* ---------- utilidades ---------- */

function textoFiltro(valor, largo = 100) {
  if (typeof valor !== "string") return "";
  return valor.trim().slice(0, largo);
}

export function leerFiltros(query = {}) {
  const anio = Number.parseInt(query.anio, 10);
  const estado = textoFiltro(query.estado).toLowerCase();
  const indicador = textoFiltro(query.indicador).toUpperCase();

  return {
    anio: Number.isInteger(anio) && anio >= 1990 && anio <= 2100 ? anio : null,
    zona: textoFiltro(query.zona),
    hacienda: textoFiltro(query.hacienda, 50),
    suerte: textoFiltro(query.suerte, 50),
    labor: textoFiltro(query.labor, 200),
    estado: ESTADOS.some((e) => e.id === estado) ? estado : "",
    indicador: INDICADORES[indicador] ? indicador : "TCH",
  };
}

const redondear = (valor, decimales = 2) =>
  valor == null || !Number.isFinite(valor) ? null : Number(valor.toFixed(decimales));

const n = (valor) => {
  const numero = Number(valor);
  return valor == null || !Number.isFinite(numero) ? null : numero;
};

/** Valor de un indicador para una suerte: ponderado por área o promedio simple. */
function valorSuerte(fila, campo) {
  const area = n(fila[`${campo}_area`]);
  const pond = n(fila[`${campo}_pond`]);
  if (area && area > 0 && pond != null) return pond / area;
  return n(fila[`${campo}_prom`]);
}

/** Valor consolidado de un conjunto de suertes, ponderado por área cuando existe. */
export function consolidar(filas, campo) {
  let sumaPond = 0;
  let sumaArea = 0;
  const simples = [];

  for (const fila of filas) {
    const area = n(fila[`${campo}_area`]);
    const pond = n(fila[`${campo}_pond`]);
    if (area && area > 0 && pond != null) {
      sumaPond += pond;
      sumaArea += area;
    }
    const prom = n(fila[`${campo}_prom`]);
    if (prom != null) simples.push(prom);
  }

  if (sumaArea > 0) return sumaPond / sumaArea;
  if (simples.length) return simples.reduce((a, b) => a + b, 0) / simples.length;
  return null;
}

export function clasificarSuerte(tchSuerte, tchReferencia) {
  if (tchSuerte == null || !tchReferencia) return null;
  const relacion = tchSuerte / tchReferencia;
  if (relacion >= UMBRALES_SEMAFORO.optima) return "optima";
  if (relacion >= UMBRALES_SEMAFORO.atencion) return "atencion";
  return "critica";
}

function etiquetaHacienda(codigo, nombre) {
  return nombre && nombre !== codigo ? `${codigo} · ${nombre}` : codigo;
}

function respuestaVacia(filtros, mensaje) {
  return {
    filtros: {
      aplicados: filtros,
      opciones: {
        anios: [],
        zonas: [],
        haciendas: [],
        suertes: [],
        labores: [],
        estados: ESTADOS,
        indicadores: Object.entries(INDICADORES).map(([id, i]) => ({ id, etiqueta: i.etiqueta })),
      },
      laboresDisponible: false,
    },
    indicadores: {
      tch: { valor: null, anterior: null, variacionPct: null },
      tchm: { valor: null, anterior: null, variacion: null },
      sacarosa: { valor: null, anterior: null, variacion: null },
      area: { suertes: 0, hectareas: null },
    },
    grafico: { agrupacion: "zona", indicador: filtros.indicador, unidad: "", barras: [] },
    semaforo: { umbrales: UMBRALES_SEMAFORO, total: 0, sinDato: 0, categorias: [] },
    meta: { anio: null, anioPrevio: null, alcance: "asignado", mensaje },
  };
}

/* ---------- controlador ---------- */

export async function getDashboard1Data(req, res) {
  try {
    const usuarioId = Number(req.user?.id);
    const rol = String(req.user?.rol ?? "").toLowerCase();

    if (!Number.isInteger(usuarioId) || usuarioId <= 0) {
      return res.status(401).json({ mensaje: "No se pudo identificar al usuario autenticado." });
    }

    // Misma regla que dashboardController: el mayordomo no consulta dashboards.
    if (rol === "mayordomo") {
      return res.status(403).json({ mensaje: "Tu rol no tiene acceso al dashboard agrícola." });
    }

    const filtros = leerFiltros(req.query);
    const { global, codigos } = await obtenerCodigosAutorizados(req.user);

    if (codigos.length === 0) {
      return res.json(respuestaVacia(filtros, "No tienes suertes asignadas."));
    }

    const esquema = await obtenerEsquemaAgricola();
    const pool = await getFabricAgricolaPool();

    const P = esquema.produccion;
    const c = P.columnas;
    const tabla = `dbo.${q(P.tabla)}`;

    const eCodigo = exprTexto("m", c.codsia, 50);
    const eZona = exprTexto("m", c.zona);
    const eHacienda = exprTexto("m", c.hacienda, 50);
    const eNombre = exprTexto("m", c.nombreHacienda);
    const eSuerte = c.suerte ? exprTexto("m", c.suerte, 20) : eCodigo;
    const eAnio = exprEntero("m", c.anio);

    // Las suertes autorizadas viajan como un único parámetro (sin el límite
    // de 2.100 parámetros de SQL Server) y se expanden con STRING_SPLIT.
    const listaCodigos = codigos.join(",");
    const cteAutorizadas = `autorizadas AS (
      SELECT DISTINCT LTRIM(RTRIM(value)) AS codigo
      FROM STRING_SPLIT(@codigos, ',')
    )`;
    const cteBase = `base AS (
      SELECT
        ${eCodigo} AS codigo,
        ${eZona} AS zona,
        ${eHacienda} AS hacienda,
        ${eNombre} AS nombre_hacienda,
        ${eSuerte} AS suerte,
        ${eAnio} AS anio,
        ${exprNumero("m", c.tch)} AS tch,
        ${exprNumero("m", c.tchm)} AS tchm,
        ${exprNumero("m", c.sacarosa)} AS sac,
        ${exprNumero("m", c.area)} AS area
      FROM ${tabla} m
    )`;

    const nuevaConsulta = () =>
      pool.request().input("codigos", sql.VarChar(sql.MAX), listaCodigos);

    /* 1. Catálogo de facetas (años, zonas, haciendas) dentro del alcance. */
    const catalogo = await nuevaConsulta().query(`
      WITH ${cteAutorizadas}, ${cteBase}
      SELECT
        b.anio,
        b.zona,
        b.hacienda,
        MAX(b.nombre_hacienda) AS nombre_hacienda,
        COUNT(DISTINCT b.codigo) AS suertes
      FROM base b
      INNER JOIN autorizadas a ON a.codigo = b.codigo
      WHERE b.anio IS NOT NULL
      GROUP BY b.anio, b.zona, b.hacienda
    `);

    const filasCatalogo = catalogo.recordset ?? [];
    const anios = [...new Set(filasCatalogo.map((f) => n(f.anio)).filter((a) => a != null))].sort(
      (a, b) => b - a,
    );

    if (!anios.length) {
      return res.json(respuestaVacia(filtros, "No hay registros de producción para tus suertes."));
    }

    const anio = filtros.anio && anios.includes(filtros.anio) ? filtros.anio : anios[0];
    const anioPrevio = anio - 1;
    const catalogoAnio = filasCatalogo.filter((f) => n(f.anio) === anio);

    const zonas = [...new Set(catalogoAnio.map((f) => f.zona).filter(Boolean))]
      .sort((a, b) => a.localeCompare(b, "es"))
      .map((zona) => ({ valor: zona, etiqueta: zona }));

    const haciendasMap = new Map();
    for (const f of catalogoAnio) {
      if (!f.hacienda || (filtros.zona && f.zona !== filtros.zona)) continue;
      const previa = haciendasMap.get(f.hacienda);
      haciendasMap.set(f.hacienda, {
        valor: f.hacienda,
        etiqueta: etiquetaHacienda(f.hacienda, f.nombre_hacienda),
        suertes: (previa?.suertes ?? 0) + (n(f.suertes) ?? 0),
      });
    }
    const haciendas = [...haciendasMap.values()].sort((a, b) =>
      a.etiqueta.localeCompare(b.etiqueta, "es", { numeric: true }),
    );

    /* 2. Filtros dinámicos (todos parametrizados). */
    const condiciones = [];
    const aplicarFiltros = (request) => {
      request.input("anio", sql.Int, anio).input("anioPrevio", sql.Int, anioPrevio);
      if (filtros.zona) request.input("zona", sql.VarChar(200), filtros.zona);
      if (filtros.hacienda) request.input("hacienda", sql.VarChar(50), filtros.hacienda);
      if (filtros.suerte) request.input("suerte", sql.VarChar(50), filtros.suerte);
      if (filtros.labor && esquema.labores) request.input("labor", sql.VarChar(200), filtros.labor);
      return request;
    };

    if (filtros.zona) condiciones.push("b.zona = @zona");
    if (filtros.hacienda) condiciones.push("b.hacienda = @hacienda");
    if (filtros.suerte) condiciones.push("b.codigo = @suerte");

    const L = esquema.labores;
    if (filtros.labor && L) {
      condiciones.push(`EXISTS (
        SELECT 1
        FROM dbo.${q(L.tabla)} l
        WHERE ${exprCodigoLabor("l", L.columnas)} = b.codigo
          AND ${exprAnioFecha("l", L.columnas.fecha)} = b.anio
          AND ${exprTexto("l", L.columnas.labor)} = @labor
      )`);
    }

    const where = condiciones.length ? `AND ${condiciones.join("\n AND ")}` : "";

    const agregados = (campo) => `
      SUM(CASE WHEN b.${campo} IS NOT NULL AND b.area > 0 THEN b.${campo} * b.area END) AS ${campo}_pond,
      SUM(CASE WHEN b.${campo} IS NOT NULL AND b.area > 0 THEN b.area END) AS ${campo}_area,
      AVG(b.${campo}) AS ${campo}_prom`;

    const consultaSuertes = aplicarFiltros(nuevaConsulta()).query(`
      WITH ${cteAutorizadas}, ${cteBase}
      SELECT
        b.anio,
        b.zona,
        b.hacienda,
        MAX(b.nombre_hacienda) AS nombre_hacienda,
        b.codigo,
        MAX(b.suerte) AS suerte,
        ${agregados("tch")},
        ${agregados("tchm")},
        ${agregados("sac")},
        MAX(CASE WHEN b.area > 0 THEN b.area END) AS area_neta
      FROM base b
      INNER JOIN autorizadas a ON a.codigo = b.codigo
      WHERE b.anio IN (@anio, @anioPrevio)
        ${where}
      GROUP BY b.anio, b.zona, b.hacienda, b.codigo
    `);

    // Referencia del semáforo: TCH de cada zona en la zafra, sobre toda la base.
    const consultaReferencia = pool
      .request()
      .input("anio", sql.Int, anio)
      .query(`
        WITH ${cteBase}
        SELECT
          b.zona,
          ${agregados("tch")}
        FROM base b
        WHERE b.anio = @anio
          AND b.tch IS NOT NULL
        GROUP BY b.zona
      `);

    const consultaOpcionesSuerte = filtros.hacienda
      ? aplicarFiltros(nuevaConsulta()).query(`
          WITH ${cteAutorizadas}, ${cteBase}
          SELECT DISTINCT b.codigo, b.suerte
          FROM base b
          INNER JOIN autorizadas a ON a.codigo = b.codigo
          WHERE b.anio = @anio
            AND b.hacienda = @hacienda
        `)
      : Promise.resolve({ recordset: [] });

    const consultaOpcionesLabor = L
      ? nuevaConsulta()
          .input("anio", sql.Int, anio)
          .query(`
            WITH ${cteAutorizadas}
            SELECT TOP 300
              ${exprTexto("l", L.columnas.labor)} AS labor,
              COUNT(*) AS registros
            FROM dbo.${q(L.tabla)} l
            INNER JOIN autorizadas a ON a.codigo = ${exprCodigoLabor("l", L.columnas)}
            WHERE ${exprAnioFecha("l", L.columnas.fecha)} = @anio
            GROUP BY ${exprTexto("l", L.columnas.labor)}
            ORDER BY COUNT(*) DESC
          `)
      : Promise.resolve({ recordset: [] });

    const [rSuertes, rReferencia, rOpcSuerte, rOpcLabor] = await Promise.all([
      consultaSuertes,
      consultaReferencia,
      consultaOpcionesSuerte,
      consultaOpcionesLabor,
    ]);

    /* 3. Semáforo por suerte. */
    const referencia = new Map(
      (rReferencia.recordset ?? []).map((f) => [f.zona, consolidar([f], "tch")]),
    );

    const filas = rSuertes.recordset ?? [];
    let actuales = filas
      .filter((f) => n(f.anio) === anio)
      .map((f) => ({
        ...f,
        estado: clasificarSuerte(valorSuerte(f, "tch"), referencia.get(f.zona)),
      }));

    const conteoSemaforo = (lista) => {
      const total = lista.filter((f) => f.estado).length;
      return {
        umbrales: UMBRALES_SEMAFORO,
        total,
        sinDato: lista.length - total,
        categorias: ESTADOS.map(({ id, etiqueta }) => {
          const grupo = lista.filter((f) => f.estado === id);
          return {
            id,
            etiqueta,
            suertes: grupo.length,
            porcentaje: total ? redondear((grupo.length / total) * 100, 1) : 0,
            hectareas: redondear(grupo.reduce((s, f) => s + (n(f.area_neta) ?? 0), 0), 1),
          };
        }),
      };
    };

    // El donut siempre muestra la distribución completa; el filtro de estado
    // aplica a indicadores y gráfico de barras.
    const semaforo = conteoSemaforo(actuales);

    if (filtros.estado) {
      actuales = actuales.filter((f) => f.estado === filtros.estado);
    }

    const codigosActuales = new Set(actuales.map((f) => f.codigo));
    const previas = filas.filter(
      (f) => n(f.anio) === anioPrevio && (!filtros.estado || codigosActuales.has(f.codigo)),
    );

    /* 4. Indicadores (KPIs). */
    const tch = consolidar(actuales, "tch");
    const tchPrev = consolidar(previas, "tch");
    const tchm = consolidar(actuales, "tchm");
    const tchmPrev = consolidar(previas, "tchm");
    const sac = consolidar(actuales, "sac");
    const sacPrev = consolidar(previas, "sac");

    const hectareas = actuales.reduce((s, f) => s + (n(f.area_neta) ?? 0), 0);

    const indicadores = {
      tch: {
        valor: redondear(tch, 1),
        anterior: redondear(tchPrev, 1),
        variacionPct: tch != null && tchPrev ? redondear(((tch - tchPrev) / tchPrev) * 100, 1) : null,
      },
      tchm: {
        valor: redondear(tchm, 2),
        anterior: redondear(tchmPrev, 2),
        variacion: tchm != null && tchmPrev != null ? redondear(tchm - tchmPrev, 2) : null,
      },
      sacarosa: {
        valor: redondear(sac, 2),
        anterior: redondear(sacPrev, 2),
        variacion: sac != null && sacPrev != null ? redondear(sac - sacPrev, 2) : null,
        disponible: Boolean(c.sacarosa),
      },
      area: {
        suertes: codigosActuales.size,
        hectareas: c.area ? redondear(hectareas, 1) : null,
      },
    };

    /* 5. Gráfico de barras con navegación zona → hacienda → suerte. */
    const indicador = INDICADORES[filtros.indicador];
    const agrupacion = filtros.hacienda ? "suerte" : filtros.zona ? "hacienda" : "zona";

    const grupos = new Map();
    for (const f of actuales) {
      const clave = agrupacion === "zona" ? f.zona : agrupacion === "hacienda" ? f.hacienda : f.codigo;
      if (!clave) continue;
      if (!grupos.has(clave)) {
        grupos.set(clave, {
          clave,
          etiqueta:
            agrupacion === "hacienda"
              ? f.nombre_hacienda || f.hacienda
              : agrupacion === "suerte"
                ? f.suerte || f.codigo
                : f.zona,
          filas: [],
        });
      }
      grupos.get(clave).filas.push(f);
    }

    const barras = [...grupos.values()]
      .map((g) => ({
        clave: g.clave,
        etiqueta: g.etiqueta,
        valor: redondear(consolidar(g.filas, indicador.campo), indicador.campo === "tch" ? 0 : 2),
        suertes: g.filas.length,
      }))
      .filter((b) => b.valor != null)
      .sort((a, b) => b.valor - a.valor)
      .slice(0, MAX_BARRAS);

    /* 6. Respuesta. */
    return res.json({
      filtros: {
        aplicados: { ...filtros, anio },
        opciones: {
          anios,
          zonas,
          haciendas,
          suertes: (rOpcSuerte.recordset ?? [])
            .map((f) => ({ valor: f.codigo, etiqueta: f.suerte || f.codigo }))
            .sort((a, b) => a.etiqueta.localeCompare(b.etiqueta, "es", { numeric: true })),
          labores: (rOpcLabor.recordset ?? [])
            .filter((f) => f.labor)
            .map((f) => ({ valor: f.labor, etiqueta: f.labor, registros: n(f.registros) })),
          estados: ESTADOS,
          indicadores: Object.entries(INDICADORES).map(([id, i]) => ({ id, etiqueta: i.etiqueta })),
        },
        laboresDisponible: Boolean(L),
      },
      indicadores,
      grafico: {
        agrupacion,
        indicador: filtros.indicador,
        etiquetaIndicador: indicador.etiqueta,
        unidad: indicador.unidad,
        barras,
      },
      semaforo,
      meta: {
        anio,
        anioPrevio,
        alcance: global ? "global" : "asignado",
        suertesAutorizadas: codigos.length,
        generadoEn: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error("Error cargando el Dashboard 1 (consolidado):", error);
    return res.status(500).json({ mensaje: "No fue posible cargar el dashboard consolidado." });
  }
}
