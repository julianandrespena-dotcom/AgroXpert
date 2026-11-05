import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import request from "supertest";

/*
 * AGX-38 · HU-11 — Capa de dashboards y API de consulta con permisos por ámbito
 *
 * Criterio de aceptación: dado un usuario autenticado, cuando abre un
 * dashboard, entonces visualiza únicamente los datos de su ámbito, sin
 * volver a autenticarse.
 *
 * Fabric (permisos y base agrícola) se simula; el cliente real de Fabric
 * se prueba aparte con @azure/identity y mssql simulados.
 */

vi.mock("../src/database/fabric.js", () => ({ getFabricPool: vi.fn() }));
vi.mock("../src/database/fabricAgricola.js", () => ({ getFabricAgricolaPool: vi.fn() }));
vi.mock("@azure/identity", () => ({ ClientSecretCredential: vi.fn() }));
vi.mock("mssql", async (importOriginal) => {
  const real = await importOriginal();
  const ConnectionPool = vi.fn();
  return { ...real, default: { ...real.default, ConnectionPool }, ConnectionPool };
});

import app from "../src/server.js";
import sql from "mssql";
import { ClientSecretCredential } from "@azure/identity";
import { getFabricPool } from "../src/database/fabric.js";
import { getFabricAgricolaPool } from "../src/database/fabricAgricola.js";
import { _limpiarCacheEsquema } from "../src/services/esquemaAgricolaService.js";
import { crearPool, cookieDe } from "./_helpers.js";

/* ---------- datos simulados ---------- */

const COLUMNAS = [
  ["modelo_de_datos_v2", "codsia", "varchar"], ["modelo_de_datos_v2", "Zona", "varchar"],
  ["modelo_de_datos_v2", "Hacienda", "varchar"], ["modelo_de_datos_v2", "Suerte", "varchar"],
  ["modelo_de_datos_v2", "Año", "int"], ["modelo_de_datos_v2", "TCH", "float"],
  ["modelo_de_datos_v2", "tchm", "float"], ["modelo_de_datos_v2", "Área Neta", "float"],
].map(([TABLE_NAME, COLUMN_NAME, DATA_TYPE]) => ({ TABLE_SCHEMA: "dbo", TABLE_NAME, COLUMN_NAME, DATA_TYPE }));

const fila = (anio, zona, hacienda, codigo, tch, area) => ({
  anio, zona, hacienda, nombre_hacienda: null, codigo, suerte: codigo.slice(-3),
  tch_pond: tch * area, tch_area: area, tch_prom: tch,
  tchm_pond: null, tchm_area: null, tchm_prom: null,
  sac_pond: null, sac_area: null, sac_prom: null, area_neta: area,
});

function poolAgricola(filas = [fila(2025, "Central", "010001", "010001001", 120, 10)]) {
  return crearPool(async (texto) => {
    if (texto.includes("INFORMATION_SCHEMA.COLUMNS")) return { recordset: COLUMNAS };
    if (texto.includes("COUNT(DISTINCT b.codigo)")) {
      return { recordset: [{ anio: 2025, zona: "Central", hacienda: "010001", nombre_hacienda: null, suertes: 1 }] };
    }
    if (texto.includes("area_neta")) return { recordset: filas };
    if (texto.includes("GROUP BY b.zona")) return { recordset: [{ zona: "Central", tch_pond: 1200, tch_area: 10, tch_prom: 120 }] };
    return { recordset: [] };
  });
}

const poolPermisos = (codigos) =>
  crearPool(async (texto) =>
    texto.includes("INSERT INTO dbo.Bitacora")
      ? { rowsAffected: [1], recordset: [] }
      : { recordset: codigos.map((codigo) => ({ codigo })) },
  );

const SUPERVISOR = {
  id: 900001, usuario: "test_supervisor_1", rol: "supervisor",
  esUsuarioPrueba: true, acceso_global: false, zonasPermitidas: [1, 2],
};
const GERENTE = {
  id: 900004, usuario: "test_gerente", rol: "gerente",
  esUsuarioPrueba: true, acceso_global: true, zonasPermitidas: [],
};
const DIRECTOR_REAL = { id: 42, usuario: "director_real", rol: "director", acceso_global: false };

/** Códigos SIA que llegaron a la base agrícola en cualquier consulta. */
function codigosEnviados(pool) {
  return pool.consultas.flatMap((c) =>
    Object.entries(c.inputs)
      .filter(([nombre]) => nombre === "codigos" || /^codigo\d+$/.test(nombre))
      .flatMap(([, valor]) => String(valor).split(",")),
  );
}

/* ---------- pruebas de la API ---------- */

describe("AGX-38-HU-11 — API de dashboards con filtro de ámbito", () => {
  beforeEach(() => {
    _limpiarCacheEsquema();
    vi.spyOn(console, "error").mockImplementation(() => {});
  });
  afterEach(() => {
    vi.clearAllMocks();
    vi.restoreAllMocks();
  });

  it("AGX-38-HU-11-CP-01: con la sola cookie de sesión abre D1 sin pedir una segunda autenticación", async () => {
    getFabricPool.mockResolvedValue(poolPermisos(["010001001"]));
    getFabricAgricolaPool.mockResolvedValue(poolAgricola());

    const r = await request(app).get("/api/dashboard/d1").set("Cookie", cookieDe(SUPERVISOR));

    expect(r.status).toBe(200);
    expect(r.headers["www-authenticate"]).toBeUndefined();
    expect(r.body.meta.alcance).toBe("asignado");
    expect(r.body.meta.suertesAutorizadas).toBe(1);
  });

  it("AGX-38-HU-11-CP-02: en los dos endpoints de dashboards solo viajan a Fabric los códigos del ámbito del usuario", async () => {
    const autorizados = ["010001001", "010001002"];

    for (const ruta of ["/api/dashboard", "/api/dashboard/d1"]) {
      const agricola = poolAgricola();
      getFabricPool.mockResolvedValue(poolPermisos(autorizados));
      getFabricAgricolaPool.mockResolvedValue(agricola);
      _limpiarCacheEsquema();

      const r = await request(app).get(ruta).set("Cookie", cookieDe(SUPERVISOR));

      expect(r.status, ruta).toBe(200);
      const enviados = codigosEnviados(agricola);
      expect(enviados.length, ruta).toBeGreaterThan(0);
      expect(new Set(enviados), ruta).toEqual(new Set(autorizados));
    }
  });

  it("AGX-38-HU-11-CP-03: para un usuario real el ámbito se resuelve en Fabric por zona, hacienda y suerte asignadas", async () => {
    const permisos = poolPermisos(["010300001"]);
    getFabricPool.mockResolvedValue(permisos);
    getFabricAgricolaPool.mockResolvedValue(poolAgricola());

    const r = await request(app).get("/api/dashboard/d1").set("Cookie", cookieDe(DIRECTOR_REAL));

    expect(r.status).toBe(200);
    const consultaAmbito = permisos.consultas.find((c) => c.texto.includes("dbo.Suertes"));
    expect(consultaAmbito.inputs.usuarioId).toBe(42);
    for (const tabla of ["Usuario_Zona", "Usuario_Hacienda", "Usuario_Suerte"]) {
      expect(consultaAmbito.texto).toContain(`dbo.${tabla}`);
    }
  });

  it("AGX-38-HU-11-CP-04: el filtro de zona y hacienda del selector se propaga como parámetro a las consultas", async () => {
    const agricola = poolAgricola();
    getFabricPool.mockResolvedValue(poolPermisos(["010001001"]));
    getFabricAgricolaPool.mockResolvedValue(agricola);

    const r = await request(app)
      .get("/api/dashboard/d1?zona=Central&hacienda=010001")
      .set("Cookie", cookieDe(GERENTE));

    expect(r.status).toBe(200);
    const filtradas = agricola.consultas.filter(
      (c) =>
        c.inputs.zona === "Central" &&
        c.inputs.hacienda === "010001" &&
        c.texto.includes("b.zona = @zona") &&
        c.texto.includes("b.hacienda = @hacienda"),
    );
    expect(filtradas.length).toBeGreaterThan(0);
    // Los valores viajan como parámetros, nunca concatenados en el texto SQL.
    for (const c of agricola.consultas) expect(c.texto).not.toContain("'Central'");
    expect(r.body.filtros.aplicados).toMatchObject({ zona: "Central", hacienda: "010001" });
  });

  it("AGX-38-HU-11-CP-05: un valor malicioso en el filtro no se concatena al SQL", async () => {
    const agricola = poolAgricola();
    getFabricPool.mockResolvedValue(poolPermisos(["010001001"]));
    getFabricAgricolaPool.mockResolvedValue(agricola);
    const inyeccion = "Central' OR 1=1 --";

    const r = await request(app)
      .get(`/api/dashboard/d1?zona=${encodeURIComponent(inyeccion)}`)
      .set("Cookie", cookieDe(SUPERVISOR));

    expect(r.status).toBe(200);
    for (const c of agricola.consultas) expect(c.texto).not.toContain("OR 1=1");
    expect(agricola.consultas.some((c) => c.inputs.zona === inyeccion)).toBe(true);
  });

  it("AGX-38-HU-11-CP-06: el backend responde D1 dentro del umbral de 3 s (sin contar la latencia de Fabric)", async () => {
    const muchas = Array.from({ length: 5000 }, (_, i) =>
      fila(2025, `Zona ${i % 7}`, `0100${String(i % 90).padStart(2, "0")}`, String(10000000 + i).padStart(9, "0"), 80 + (i % 60), 5 + (i % 10)),
    );
    getFabricPool.mockResolvedValue(poolPermisos(muchas.map((f) => f.codigo)));
    getFabricAgricolaPool.mockResolvedValue(poolAgricola(muchas));

    const inicio = performance.now();
    const r = await request(app).get("/api/dashboard/d1").set("Cookie", cookieDe(GERENTE));
    const ms = performance.now() - inicio;

    expect(r.status).toBe(200);
    expect(ms).toBeLessThan(3000);
  });

  it("AGX-38-HU-11-CP-07: el mayordomo no consulta dashboards; el administrador sí consulta /api/dashboard dentro de su ámbito", async () => {
    // Aclaración del Product Owner (04/11/2026): el administrador puede recibir datos en /api/dashboard.
    const agricola = poolAgricola();
    getFabricPool.mockResolvedValue(poolPermisos(["010001001"]));
    getFabricAgricolaPool.mockResolvedValue(agricola);

    const mayordomo = cookieDe({ id: 700, usuario: "u_mayordomo", rol: "mayordomo" });
    for (const ruta of ["/api/dashboard", "/api/dashboard/d1"]) {
      const r = await request(app).get(ruta).set("Cookie", mayordomo);
      expect(r.status, `mayordomo ${ruta}`).toBe(403);
    }
    expect(getFabricAgricolaPool).not.toHaveBeenCalled();

    const admin = cookieDe({ id: 1, usuario: "u_administrador", rol: "administrador" });
    const r = await request(app).get("/api/dashboard").set("Cookie", admin);
    expect(r.status).toBe(200);
    expect(new Set(codigosEnviados(agricola))).toEqual(new Set(["010001001"]));
  });
});

/* ---------- cliente de Fabric ---------- */

describe("AGX-38-HU-11 — Cliente de Fabric con service principal", () => {
  const ENV = {
    ENTRA_TENANT_ID: "tenant-prueba",
    ENTRA_CLIENT_ID: "cliente-prueba",
    ENTRA_CLIENT_SECRET: "secreto-prueba",
    FABRIC_AGRICOLA_SERVER: "servidor.fabric.microsoft.com",
    FABRIC_AGRICOLA_DATABASE: "BaseAgricola",
  };

  beforeEach(() => {
    vi.resetModules();
    for (const [k, v] of Object.entries(ENV)) vi.stubEnv(k, v);
  });
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.clearAllMocks();
  });

  it("AGX-38-HU-11-CP-09: se autentica con el service principal y abre una conexión cifrada al Warehouse", async () => {
    const getToken = vi.fn(async () => ({ token: "token-fabric" }));
    ClientSecretCredential.mockImplementation(function () { return { getToken }; });
    const connect = vi.fn(async function () { return this; });
    sql.ConnectionPool.mockImplementation(function (config) { this.config = config; this.connect = connect; });

    const { getFabricAgricolaPool: real } = await vi.importActual("../src/database/fabricAgricola.js");
    const pool = await real();

    expect(ClientSecretCredential).toHaveBeenCalledWith("tenant-prueba", "cliente-prueba", "secreto-prueba");
    expect(getToken).toHaveBeenCalledWith("https://database.windows.net/.default");
    expect(pool.config).toMatchObject({
      server: "servidor.fabric.microsoft.com",
      database: "BaseAgricola",
      options: { encrypt: true, trustServerCertificate: false },
      authentication: { type: "azure-active-directory-access-token", options: { token: "token-fabric" } },
    });
  });

  it("AGX-38-HU-11-CP-10: sin la configuración del service principal falla con un mensaje claro", async () => {
    vi.stubEnv("ENTRA_CLIENT_SECRET", "");
    const { getFabricAgricolaPool: real } = await vi.importActual("../src/database/fabricAgricola.js");

    await expect(real()).rejects.toThrow(/Falta configurar la conexión agrícola/);
    expect(ClientSecretCredential).not.toHaveBeenCalled();
  });
});
