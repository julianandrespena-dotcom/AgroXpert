import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import request from "supertest";
import bcrypt from "bcryptjs";

/*
 * AGX-33 · HU-06 — Contexto de zona y hacienda (ámbito automático)
 *
 * Aclaración del Product Owner (04/11/2026, DEF-05): el filtro global de
 * zona y hacienda se aplica automáticamente según la cuenta, sin
 * configuración manual, a partir de dbo.Usuario_Zona y dbo.Usuario_Hacienda
 * en Fabric. Estas pruebas verifican ese comportamiento en la API.
 */

vi.mock("../src/database/fabric.js", () => ({ getFabricPool: vi.fn() }));
vi.mock("../src/database/fabricAgricola.js", () => ({ getFabricAgricolaPool: vi.fn() }));

import app from "../src/server.js";
import { getFabricPool } from "../src/database/fabric.js";
import { getFabricAgricolaPool } from "../src/database/fabricAgricola.js";
import { _limpiarCacheEsquema } from "../src/services/esquemaAgricolaService.js";
import { crearPool, cookieDe } from "./_helpers.js";

const COLUMNAS = [
  ["modelo_de_datos_v2", "codsia", "varchar"], ["modelo_de_datos_v2", "Zona", "varchar"],
  ["modelo_de_datos_v2", "Hacienda", "varchar"], ["modelo_de_datos_v2", "Suerte", "varchar"],
  ["modelo_de_datos_v2", "Año", "int"], ["modelo_de_datos_v2", "TCH", "float"],
].map(([TABLE_NAME, COLUMN_NAME, DATA_TYPE]) => ({ TABLE_SCHEMA: "dbo", TABLE_NAME, COLUMN_NAME, DATA_TYPE }));

const poolAgricola = () =>
  crearPool(async (texto) =>
    texto.includes("INFORMATION_SCHEMA.COLUMNS") ? { recordset: COLUMNAS } : { recordset: [] },
  );

const HASH = bcrypt.hashSync("Clave-Director-2026", 4);
const DIRECTOR_DB = {
  id: 42, usuario: "director_ic02", password_hash: HASH, nombre: "Director IC02", cargo: "Director",
  activo: 1, intentos_fallidos: 0, bloqueado_hasta_utc: null, tipo_autenticacion: "LOCAL",
  acceso_global: 0, rol: "director", segundos_bloqueo: 0,
};
const DIRECTOR = { id: 42, usuario: "director_ic02", rol: "director", acceso_global: false };

/*
 * Fabric de permisos simulado. `asignaciones` es una función para poder
 * cambiar lo asignado entre solicitudes (como haría el Administrador).
 */
function poolPermisos(asignaciones) {
  return crearPool(async (texto, inputs) => {
    if (texto.includes("INSERT INTO dbo.Bitacora")) return { rowsAffected: [1], recordset: [] };
    if (texto.includes("intentos_fallidos = 0")) return { rowsAffected: [1], recordset: [] };
    if (texto.includes("FROM dbo.Usuarios AS u")) return { recordset: [DIRECTOR_DB] };
    if (texto.includes("dbo.Usuario_Zona") && texto.includes("dbo.Suertes")) {
      return { recordset: asignaciones(inputs.usuarioId).map((codigo) => ({ codigo })) };
    }
    return { recordset: [] };
  });
}

const consultaAmbito = (pool) => pool.consultas.filter((c) => c.texto.includes("dbo.Usuario_Zona") && c.texto.includes("dbo.Suertes"));
const codigosEnviados = (pool) =>
  pool.consultas.flatMap((c) =>
    Object.entries(c.inputs)
      .filter(([n]) => n === "codigos" || /^codigo\d+$/.test(n))
      .flatMap(([, v]) => String(v).split(",")),
  );

describe("AGX-33-HU-06 — Ámbito de zona y hacienda aplicado automáticamente", () => {
  beforeEach(() => {
    _limpiarCacheEsquema();
    vi.stubEnv("ENABLE_TEST_USERS", "false");
    vi.spyOn(console, "error").mockImplementation(() => {});
  });
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.clearAllMocks();
    vi.restoreAllMocks();
  });

  it("AGX-33-HU-06-CP-01: sin enviar ningún filtro, los dashboards se limitan a lo asignado en Usuario_Zona y Usuario_Hacienda", async () => {
    for (const ruta of ["/api/dashboard", "/api/dashboard/d1"]) {
      const permisos = poolPermisos(() => ["020001001", "020001002"]);
      const agricola = poolAgricola();
      getFabricPool.mockResolvedValue(permisos);
      getFabricAgricolaPool.mockResolvedValue(agricola);
      _limpiarCacheEsquema();

      const r = await request(app).get(ruta).set("Cookie", cookieDe(DIRECTOR));

      expect(r.status, ruta).toBe(200);
      const [ambito] = consultaAmbito(permisos);
      expect(ambito.inputs.usuarioId, ruta).toBe(42);
      expect(ambito.texto).toContain("dbo.Usuario_Zona");
      expect(ambito.texto).toContain("dbo.Usuario_Hacienda");
      expect(new Set(codigosEnviados(agricola)), ruta).toEqual(new Set(["020001001", "020001002"]));
    }
  });

  it("AGX-33-HU-06-CP-02: el cliente no puede ampliar el ámbito con parámetros de la URL", async () => {
    const permisos = poolPermisos(() => ["020001001"]);
    const agricola = poolAgricola();
    getFabricPool.mockResolvedValue(permisos);
    getFabricAgricolaPool.mockResolvedValue(agricola);

    const r = await request(app)
      .get("/api/dashboard/d1?usuarioId=1&zona=IC05&hacienda=050002")
      .set("Cookie", cookieDe(DIRECTOR));

    expect(r.status).toBe(200);
    expect(consultaAmbito(permisos)[0].inputs.usuarioId).toBe(42);
    expect(new Set(codigosEnviados(agricola))).toEqual(new Set(["020001001"]));
  });

  it("AGX-33-HU-06-CP-03: el ámbito se conserva entre sesiones porque se resuelve desde la cuenta", async () => {
    const permisos = poolPermisos(() => ["020001001"]);
    getFabricPool.mockResolvedValue(permisos);
    getFabricAgricolaPool.mockResolvedValue(poolAgricola());

    for (let sesion = 1; sesion <= 2; sesion++) {
      const login = await request(app)
        .post("/api/auth/login")
        .send({ usuario: "director_ic02", password: "Clave-Director-2026" });
      expect(login.status, `sesión ${sesion}`).toBe(200);
      const cookie = login.headers["set-cookie"].find((c) => c.startsWith("agroxpert_session=")).split(";")[0];

      const r = await request(app).get("/api/dashboard/d1").set("Cookie", cookie);
      expect(r.status, `sesión ${sesion}`).toBe(200);
    }

    const ambitos = consultaAmbito(permisos);
    expect(ambitos).toHaveLength(2);
    expect(ambitos.map((c) => c.inputs.usuarioId)).toEqual([42, 42]);
  });

  it("AGX-33-HU-06-CP-04: un cambio de asignación en Fabric se refleja en la siguiente consulta, sin volver a iniciar sesión", async () => {
    let asignado = ["020001001"];
    const agricolaAntes = poolAgricola();
    const agricolaDespues = poolAgricola();
    getFabricPool.mockResolvedValue(poolPermisos(() => asignado));
    const cookie = cookieDe(DIRECTOR);

    getFabricAgricolaPool.mockResolvedValue(agricolaAntes);
    await request(app).get("/api/dashboard/d1").set("Cookie", cookie);

    asignado = ["050002001"]; // el Administrador reasigna al director a otra zona
    getFabricAgricolaPool.mockResolvedValue(agricolaDespues);
    await request(app).get("/api/dashboard/d1").set("Cookie", cookie);

    expect(new Set(codigosEnviados(agricolaAntes))).toEqual(new Set(["020001001"]));
    expect(new Set(codigosEnviados(agricolaDespues))).toEqual(new Set(["050002001"]));
  });

  it("AGX-33-HU-06-CP-05: un usuario sin zonas ni haciendas asignadas no recibe datos por defecto", async () => {
    getFabricPool.mockResolvedValue(poolPermisos(() => []));

    const r = await request(app).get("/api/dashboard/d1").set("Cookie", cookieDe(DIRECTOR));

    expect(r.status).toBe(200);
    expect(r.body.indicadores.area.suertes).toBe(0);
    expect(getFabricAgricolaPool).not.toHaveBeenCalled();
  });
});
