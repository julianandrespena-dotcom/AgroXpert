import { afterEach, describe, expect, it, vi } from "vitest";
import request from "supertest";

vi.mock("../src/database/fabric.js", () => ({ getFabricPool: vi.fn() }));
vi.mock("../src/database/fabricAgricola.js", () => ({ getFabricAgricolaPool: vi.fn() }));

import app from "../src/server.js";
import { getFabricPool } from "../src/database/fabric.js";
import { getFabricAgricolaPool } from "../src/database/fabricAgricola.js";
import { obtenerCodigosAutorizados } from "../src/services/permisosAgricolasService.js";
import { crearPool, cookieDe } from "./_helpers.js";

describe("AGX-38-HU-11 — API de consulta con permisos por ámbito", () => {
  afterEach(() => vi.clearAllMocks());

  it("AGX-38-HU-11-CP-01: el gerente con acceso global consulta todas las suertes activas sin filtro de zona", async () => {
    const permisos = crearPool(async () => ({ recordset: [{ codigo: "A" }, { codigo: "B" }] }));
    getFabricPool.mockResolvedValue(permisos);

    const r = await obtenerCodigosAutorizados({ id: 900004, esUsuarioPrueba: true, acceso_global: true });

    expect(r).toEqual({ global: true, codigos: ["A", "B"] });
    expect(permisos.consultas[0].texto).not.toContain("z.id IN");
  });

  it("AGX-38-HU-11-CP-02: un usuario real se filtra por sus asignaciones de suerte, hacienda o zona", async () => {
    const permisos = crearPool(async () => ({ recordset: [{ codigo: " 010001001 " }, { codigo: "010001001" }] }));
    getFabricPool.mockResolvedValue(permisos);

    const r = await obtenerCodigosAutorizados({ id: 42, rol: "director" });

    expect(permisos.consultas[0].inputs).toEqual({ usuarioId: 42 });
    expect(permisos.consultas[0].texto).toMatch(/Usuario_Suerte[\s\S]*Usuario_Hacienda[\s\S]*Usuario_Zona/);
    // Códigos limpios y sin duplicados.
    expect(r.codigos).toEqual(["010001001"]);
  });

  it("AGX-38-HU-11-CP-03: un usuario de prueba sin zonas válidas no recibe códigos", async () => {
    const permisos = crearPool(async () => ({ recordset: [{ codigo: "X" }] }));
    getFabricPool.mockResolvedValue(permisos);

    const r = await obtenerCodigosAutorizados({ id: 1, esUsuarioPrueba: true, zonasPermitidas: [0, "x", -3] });

    expect(r).toEqual({ global: false, codigos: [] });
    expect(permisos.consultas).toHaveLength(0);
  });

  it("AGX-38-HU-11-CP-04: con una sola sesión abre el centro de análisis y D1 sin volver a autenticarse", async () => {
    getFabricPool.mockResolvedValue(crearPool(async () => ({ recordset: [] })));
    getFabricAgricolaPool.mockResolvedValue(crearPool(async () => ({ recordset: [] })));
    const cookie = cookieDe({ id: 900004, rol: "gerente", esUsuarioPrueba: true, acceso_global: true });

    const centro = await request(app).get("/api/dashboard").set("Cookie", cookie);
    const d1 = await request(app).get("/api/dashboard/d1").set("Cookie", cookie);

    expect(centro.status).toBe(200);
    expect(d1.status).toBe(200);
  });
});
