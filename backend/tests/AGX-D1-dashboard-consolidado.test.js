import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import request from "supertest";

vi.mock("../src/database/fabric.js", () => ({
  getFabricPool: vi.fn(),
}));

vi.mock("../src/database/fabricAgricola.js", () => ({
  getFabricAgricolaPool: vi.fn(),
}));

import app from "../src/server.js";
import { getFabricPool } from "../src/database/fabric.js";
import { getFabricAgricolaPool } from "../src/database/fabricAgricola.js";
import { _limpiarCacheEsquema } from "../src/services/esquemaAgricolaService.js";
import {
  clasificarSuerte,
  consolidar,
  leerFiltros,
} from "../src/controllers/dashboard1Controller.js";

/* ---------- datos simulados ---------- */

const COLUMNAS = [
  ["modelo_de_datos_v2", "codsia", "varchar"],
  ["modelo_de_datos_v2", "Zona", "varchar"],
  ["modelo_de_datos_v2", "Hacienda", "varchar"],
  ["modelo_de_datos_v2", "Suerte", "varchar"],
  ["modelo_de_datos_v2", "Año", "int"],
  ["modelo_de_datos_v2", "TCH", "float"],
  ["modelo_de_datos_v2", "tchm", "float"],
  ["modelo_de_datos_v2", "% Sac. Caña", "float"],
  ["modelo_de_datos_v2", "Área Neta", "float"],
  ["Labores_Realizadas", "HACIENDA", "varchar"],
  ["Labores_Realizadas", "SUERTE", "varchar"],
  ["Labores_Realizadas", "NOMBRE_ACTIVIDAD", "varchar"],
  ["Labores_Realizadas", "FECHA_EJECUCION", "datetime2"],
].map(([TABLE_NAME, COLUMN_NAME, DATA_TYPE]) => ({
  TABLE_SCHEMA: "dbo",
  TABLE_NAME,
  COLUMN_NAME,
  DATA_TYPE,
}));

const fila = (anio, zona, hacienda, codigo, tch, tchm, sac, area) => ({
  anio,
  zona,
  hacienda,
  nombre_hacienda: null,
  codigo,
  suerte: codigo.slice(-3),
  tch_pond: tch * area,
  tch_area: area,
  tch_prom: tch,
  tchm_pond: tchm * area,
  tchm_area: area,
  tchm_prom: tchm,
  sac_pond: sac * area,
  sac_area: area,
  sac_prom: sac,
  area_neta: area,
});

const SUERTES = [
  fila(2025, "Central", "010001", "010001001", 130, 9, 11.5, 10),
  fila(2025, "Central", "010001", "010001002", 110, 8, 11.2, 10),
  fila(2025, "Sur", "010300", "010300001", 70, 6, 11.0, 20),
  fila(2024, "Central", "010001", "010001001", 120, 8.5, 11.4, 10),
  fila(2024, "Central", "010001", "010001002", 100, 7.5, 11.0, 10),
  fila(2024, "Sur", "010300", "010300001", 90, 7, 11.3, 20),
];

function crearPoolAgricola() {
  return {
    request: vi.fn(() => {
      const consulta = { input: vi.fn(() => consulta), query: vi.fn() };

      consulta.query.mockImplementation(async (texto) => {
        if (texto.includes("INFORMATION_SCHEMA.COLUMNS")) return { recordset: COLUMNAS };
        if (texto.includes("COUNT(DISTINCT b.codigo)")) {
          return {
            recordset: [
              { anio: 2025, zona: "Central", hacienda: "010001", nombre_hacienda: null, suertes: 2 },
              { anio: 2025, zona: "Sur", hacienda: "010300", nombre_hacienda: null, suertes: 1 },
              { anio: 2024, zona: "Central", hacienda: "010001", nombre_hacienda: null, suertes: 2 },
            ],
          };
        }
        if (texto.includes("area_neta")) return { recordset: SUERTES };
        if (texto.includes("GROUP BY b.zona")) {
          return {
            recordset: [
              { zona: "Central", tch_pond: 2400, tch_area: 20, tch_prom: 120 },
              { zona: "Sur", tch_pond: 2000, tch_area: 20, tch_prom: 100 },
            ],
          };
        }
        if (texto.includes("AS labor")) {
          return { recordset: [{ labor: "FERTILIZACION", registros: 40 }] };
        }
        throw new Error(`Consulta no contemplada: ${texto.slice(0, 80)}`);
      });

      return consulta;
    }),
  };
}

function crearPoolPermisos(codigos) {
  return {
    request: vi.fn(() => {
      const consulta = {
        input: vi.fn(() => consulta),
        query: vi.fn(async () => ({ recordset: codigos.map((codigo) => ({ codigo })) })),
      };
      return consulta;
    }),
  };
}

async function iniciarSesion(usuario, password) {
  const respuesta = await request(app).post("/api/auth/login").send({ usuario, password });
  const cookie = respuesta.headers["set-cookie"].find((v) => v.startsWith("agroxpert_session="));
  return cookie.split(";")[0];
}

/* ---------- pruebas ---------- */

describe("AGX-D1 — Dashboard 1 consolidado", () => {
  beforeEach(() => {
    vi.stubEnv("ENABLE_TEST_USERS", "true");
    _limpiarCacheEsquema();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.clearAllMocks();
  });

  it("AGX-D1-CP-01: rechaza solicitudes sin sesión", async () => {
    const respuesta = await request(app).get("/api/dashboard/d1");
    expect(respuesta.status).toBe(401);
  });

  it("AGX-D1-CP-02: el gerente obtiene KPIs ponderados por área y comparados con la zafra anterior", async () => {
    getFabricPool.mockResolvedValue(crearPoolPermisos(["010001001", "010001002", "010300001"]));
    getFabricAgricolaPool.mockResolvedValue(crearPoolAgricola());

    const cookie = await iniciarSesion("test_gerente", "TestGer2026!");
    const respuesta = await request(app).get("/api/dashboard/d1").set("Cookie", cookie);

    expect(respuesta.status).toBe(200);
    const { indicadores, grafico, semaforo, meta, filtros } = respuesta.body;

    // (130·10 + 110·10 + 70·20) / 40 = 95 ; anterior (1200+1000+1800)/40 = 100
    expect(indicadores.tch.valor).toBe(95);
    expect(indicadores.tch.anterior).toBe(100);
    expect(indicadores.tch.variacionPct).toBe(-5);
    expect(indicadores.area).toEqual({ suertes: 3, hectareas: 40 });

    expect(meta.anio).toBe(2025);
    expect(meta.alcance).toBe("global");
    expect(filtros.laboresDisponible).toBe(true);
    expect(filtros.opciones.labores[0].valor).toBe("FERTILIZACION");

    expect(grafico.agrupacion).toBe("zona");
    expect(grafico.barras.map((b) => b.etiqueta)).toEqual(["Central", "Sur"]);

    // Central ref 120: 130 → óptima, 110 → atención (0.917). Sur ref 100: 70 → crítica.
    const porId = Object.fromEntries(semaforo.categorias.map((c) => [c.id, c.suertes]));
    expect(porId).toEqual({ optima: 1, atencion: 1, critica: 1 });
  });

  it("AGX-D1-CP-03: el filtro de estado se aplica a los indicadores", async () => {
    getFabricPool.mockResolvedValue(crearPoolPermisos(["010001001", "010001002", "010300001"]));
    getFabricAgricolaPool.mockResolvedValue(crearPoolAgricola());

    const cookie = await iniciarSesion("test_supervisor_1", "TestSup2026!");
    const respuesta = await request(app)
      .get("/api/dashboard/d1?estado=critica")
      .set("Cookie", cookie);

    expect(respuesta.status).toBe(200);
    expect(respuesta.body.indicadores.area.suertes).toBe(1);
    expect(respuesta.body.indicadores.tch.valor).toBe(70);
    expect(respuesta.body.meta.alcance).toBe("asignado");
  });

  it("AGX-D1-CP-04: sin suertes asignadas devuelve un tablero vacío", async () => {
    getFabricPool.mockResolvedValue(crearPoolPermisos([]));
    getFabricAgricolaPool.mockResolvedValue(crearPoolAgricola());

    const cookie = await iniciarSesion("test_supervisor_2", "TestSup2026!");
    const respuesta = await request(app).get("/api/dashboard/d1").set("Cookie", cookie);

    expect(respuesta.status).toBe(200);
    expect(respuesta.body.indicadores.area.suertes).toBe(0);
    expect(getFabricAgricolaPool).not.toHaveBeenCalled();
  });

  it("AGX-D1-CP-05: utilidades de cálculo", () => {
    expect(consolidar([{ tch_pond: 1000, tch_area: 10, tch_prom: 100 }], "tch")).toBe(100);
    expect(consolidar([{ tch_pond: null, tch_area: null, tch_prom: 80 }], "tch")).toBe(80);
    expect(clasificarSuerte(96, 100)).toBe("optima");
    expect(clasificarSuerte(85, 100)).toBe("atencion");
    expect(clasificarSuerte(70, 100)).toBe("critica");
    expect(clasificarSuerte(null, 100)).toBeNull();
    expect(leerFiltros({ anio: "abc", estado: "x", indicador: "tchm" })).toMatchObject({
      anio: null,
      estado: "",
      indicador: "TCHM",
    });
  });
});
