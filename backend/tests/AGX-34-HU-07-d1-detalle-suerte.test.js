import { afterEach, describe, expect, it, vi } from "vitest";
import request from "supertest";

vi.mock("../src/database/fabric.js", () => ({ getFabricPool: vi.fn() }));
vi.mock("../src/database/fabricAgricola.js", () => ({ getFabricAgricolaPool: vi.fn() }));

import app from "../src/server.js";
import { getFabricPool } from "../src/database/fabric.js";
import { getFabricAgricolaPool } from "../src/database/fabricAgricola.js";
import { crearPool, cookieDe } from "./_helpers.js";

const DIRECTOR = {
  id: 900003, usuario: "test_director_1", rol: "director",
  esUsuarioPrueba: true, acceso_global: false, zonasPermitidas: [5],
};

/* Una suerte con variables de las cinco familias: cultivo, suelo, clima, labores y productividad. */
const SUERTE = {
  codsia: "010300001", Zona: "Sur", Hacienda: "010300", Suerte: "001", "Año": 2025,
  Variedad: "CC 01-1940", Corte: 3, Edad: 13.2,                       // cultivo
  pH: 6.4, Textura: "Franco arcilloso", Serie: "Palmira", Ambiente: "6", // suelo
  "Lluvias (0 - 3 Meses)": 412, "Num.Riegos": 4,                      // clima
  ULTIMA_LABOR: "FERTILIZACION", OPORTUNIDAD_LABOR: "A tiempo",       // labores
  TCH: "120,5", tchm: 9.1, "% Sac. Caña": 11.6,                       // productividad
};

describe("AGX-35-HU-08 — Dashboard 2 de detalle por suerte (API)", () => {
  afterEach(() => vi.clearAllMocks());

  it("AGX-35-HU-08-CP-01: devuelve en una sola respuesta las cinco familias de variables de la suerte", async () => {
    getFabricPool.mockResolvedValue(crearPool(async () => ({ recordset: [{ codigo: "010300001" }] })));
    getFabricAgricolaPool.mockResolvedValue(crearPool(async () => ({ recordset: [SUERTE] })));

    const r = await request(app).get("/api/dashboard").set("Cookie", cookieDe(DIRECTOR));

    expect(r.status).toBe(200);
    const fila = r.body.registros[0];
    for (const campo of ["Variedad", "pH", "Textura", "Lluvias (0 - 3 Meses)", "ULTIMA_LABOR", "TCH"]) {
      expect(fila, campo).toHaveProperty(campo);
    }
    expect(r.body.filtros.suertes).toEqual(["010300001"]);
  });

  it("AGX-35-HU-08-CP-02: calcula los indicadores aunque el TCH venga con coma decimal", async () => {
    getFabricPool.mockResolvedValue(crearPool(async () => ({ recordset: [{ codigo: "010300001" }] })));
    getFabricAgricolaPool.mockResolvedValue(crearPool(async () => ({ recordset: [SUERTE] })));

    const r = await request(app).get("/api/dashboard").set("Cookie", cookieDe(DIRECTOR));

    expect(r.body.indicadores).toEqual({ tchPromedio: 120.5, tchMensual: 9.1, totalSuertes: 1 });
  });

  it("AGX-35-HU-08-CP-03: sin suertes asignadas devuelve una ficha vacía y no consulta la base analítica", async () => {
    getFabricPool.mockResolvedValue(crearPool(async () => ({ recordset: [] })));

    const r = await request(app).get("/api/dashboard").set("Cookie", cookieDe(DIRECTOR));

    expect(r.status).toBe(200);
    expect(r.body.registros).toEqual([]);
    expect(getFabricAgricolaPool).not.toHaveBeenCalled();
  });

  it("AGX-35-HU-08-CP-04: si Fabric falla responde 500 con un mensaje para el usuario", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    getFabricPool.mockRejectedValue(new Error("Fabric no disponible"));

    const r = await request(app).get("/api/dashboard").set("Cookie", cookieDe(DIRECTOR));

    expect(r.status).toBe(500);
    expect(r.body.mensaje).toMatch(/No fue posible cargar/);
  });
});
