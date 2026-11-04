import { afterEach, describe, expect, it, vi } from "vitest";
import request from "supertest";

vi.mock("../src/database/fabric.js", () => ({ getFabricPool: vi.fn() }));
vi.mock("../src/database/fabricAgricola.js", () => ({ getFabricAgricolaPool: vi.fn() }));

import app from "../src/server.js";
import { getFabricPool } from "../src/database/fabric.js";
import { getFabricAgricolaPool } from "../src/database/fabricAgricola.js";
import { createSession } from "../src/services/sessionService.js";
import { _limpiarCacheEsquema } from "../src/services/esquemaAgricolaService.js";

/* Esquema mínimo de la base analítica que el Dashboard 1 inspecciona. */
const COLUMNAS = [
  ["modelo_de_datos_v2", "codsia", "varchar"], ["modelo_de_datos_v2", "Zona", "varchar"],
  ["modelo_de_datos_v2", "Hacienda", "varchar"], ["modelo_de_datos_v2", "Suerte", "varchar"],
  ["modelo_de_datos_v2", "Año", "int"], ["modelo_de_datos_v2", "TCH", "float"],
  ["modelo_de_datos_v2", "tchm", "float"], ["modelo_de_datos_v2", "Área Neta", "float"],
].map(([TABLE_NAME, COLUMN_NAME, DATA_TYPE]) => ({ TABLE_SCHEMA: "dbo", TABLE_NAME, COLUMN_NAME, DATA_TYPE }));
const responderAgricola = async (texto) =>
  texto.includes("INFORMATION_SCHEMA.COLUMNS") ? { recordset: COLUMNAS } : { recordset: [] };

/* Pool simulado que registra cada consulta y sus parámetros. */
function crearPool(responder) {
  const consultas = [];
  return {
    consultas,
    request: vi.fn(() => {
      const registro = { inputs: {}, texto: "" };
      const consulta = {
        input: vi.fn((nombre, _tipo, valor) => {
          registro.inputs[nombre] = valor;
          return consulta;
        }),
        query: vi.fn(async (texto) => {
          registro.texto = texto;
          consultas.push(registro);
          return responder(texto, registro.inputs);
        }),
      };
      return consulta;
    }),
  };
}

function cookieDe(user) {
  const { token } = createSession({ activo: true, ...user });
  return `agroxpert_session=${token}`;
}

const SUPERVISOR_IC02 = {
  id: 900001, usuario: "test_supervisor_1", rol: "supervisor",
  esUsuarioPrueba: true, acceso_global: false, zonasPermitidas: [1, 2],
};

describe("AGX-30-HU-03 — Permisos por rol en todos los módulos", () => {
  afterEach(() => {
    vi.clearAllMocks();
    vi.restoreAllMocks();
  });

  it("AGX-30-HU-03-CP-01: sin sesión, todos los módulos responden 401", async () => {
    for (const ruta of ["/api/dashboard", "/api/dashboard/d1", "/api/access/me", "/api/users", "/api/admin/test"]) {
      const respuesta = await request(app).get(ruta);
      expect(respuesta.status, ruta).toBe(401);
    }
  });

  it("AGX-30-HU-03-CP-02: el supervisor solo consulta las suertes de sus zonas", async () => {
    const permisos = crearPool(async () => ({ recordset: [{ codigo: "010001001" }, { codigo: "010001002" }] }));
    const agricola = crearPool(async () => ({ recordset: [] }));
    getFabricPool.mockResolvedValue(permisos);
    getFabricAgricolaPool.mockResolvedValue(agricola);

    const respuesta = await request(app).get("/api/dashboard").set("Cookie", cookieDe(SUPERVISOR_IC02));

    expect(respuesta.status).toBe(200);
    // La consulta de permisos se filtra por las zonas 1 y 2 del usuario.
    expect(permisos.consultas[0].inputs).toEqual({ zona0: 1, zona1: 2 });
    expect(permisos.consultas[0].texto).toContain("z.id IN (@zona0, @zona1)");
    // La consulta agrícola solo recibe los códigos autorizados.
    expect(Object.values(agricola.consultas[0].inputs)).toEqual(["010001001", "010001002"]);
  });

  it("AGX-30-HU-03-CP-03: un supervisor de una zona no recibe datos de otra zona en D1", async () => {
    const permisos = crearPool(async () => ({ recordset: [{ codigo: "010001001" }] }));
    const agricola = crearPool(responderAgricola);
    getFabricPool.mockResolvedValue(permisos);
    getFabricAgricolaPool.mockResolvedValue(agricola);
    _limpiarCacheEsquema();

    const respuesta = await request(app)
      .get("/api/dashboard/d1?zona=IC05")
      .set("Cookie", cookieDe(SUPERVISOR_IC02));

    // Aunque pida la zona IC05, el filtro de ámbito solo envía sus códigos autorizados.
    const conCodigos = agricola.consultas.filter((c) => "codigos" in c.inputs);
    expect(conCodigos.length).toBeGreaterThan(0);
    for (const c of conCodigos) expect(c.inputs.codigos).toBe("010001001");
    expect(respuesta.status).toBe(200);
    expect(respuesta.body.indicadores.area.suertes).toBe(0);
  });

  it("AGX-30-HU-03-CP-04: el supervisor no accede a los módulos de administración", async () => {
    const cookie = cookieDe(SUPERVISOR_IC02);
    for (const ruta of ["/api/users", "/api/access/zonas", "/api/admin/test"]) {
      const respuesta = await request(app).get(ruta).set("Cookie", cookie);
      expect(respuesta.status, ruta).toBe(403);
    }
  });

  it("AGX-30-HU-03-CP-05: el mayordomo no accede a los dashboards", async () => {
    const cookie = cookieDe({ id: 700, usuario: "mayordomo_prueba", rol: "mayordomo" });
    const centro = await request(app).get("/api/dashboard").set("Cookie", cookie);
    const d1 = await request(app).get("/api/dashboard/d1").set("Cookie", cookie);
    expect(centro.status).toBe(403);
    expect(d1.status).toBe(403);
    expect(getFabricAgricolaPool).not.toHaveBeenCalled();
  });

  it("AGX-30-HU-03-CP-06: el intento no autorizado queda registrado en una bitácora", async () => {
    const consultasBitacora = [];

    const poolBitacora = {
      request: vi.fn(() => {
        const registro = { inputs: {}, texto: "" };

        const consulta = {
          input: vi.fn((nombre, _tipo, valor) => {
            registro.inputs[nombre] = valor;
            return consulta;
          }),

          query: vi.fn(async (texto) => {
            registro.texto = texto;
            consultasBitacora.push(registro);
            return { rowsAffected: [1], recordset: [] };
          }),
        };

        return consulta;
      }),
    };

    getFabricPool.mockResolvedValue(poolBitacora);

    const respuesta = await request(app)
      .get("/api/users")
      .set("Cookie", cookieDe(SUPERVISOR_IC02));

    expect(respuesta.status).toBe(403);

    expect(poolBitacora.request).toHaveBeenCalled();

    expect(consultasBitacora.length).toBeGreaterThan(0);

    expect(
      consultasBitacora.some((consulta) =>
        consulta.texto.toLowerCase().includes("insert"),
      ),
    ).toBe(true);

    expect(
      JSON.stringify(consultasBitacora).includes("900001"),
    ).toBe(true);
  });
});
