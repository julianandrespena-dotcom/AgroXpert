import { afterEach, describe, expect, it, vi } from "vitest";
import request from "supertest";

vi.mock("../src/database/fabric.js", () => ({
  getFabricPool: vi.fn(),
}));

import app from "../src/server.js";
import { getFabricPool } from "../src/database/fabric.js";

describe("AGX-29-HU-02 ÔÇö Zonas y haciendas visibles por usuario", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it("AGX-29-HU-02-CP-01: permite consultar las asignaciones propias", async () => {
    const usuarioId = 900001;

    const mockPool = {
      request: vi.fn(() => {
        const consulta = {
          input: vi.fn(() => consulta),
          query: vi.fn(),
        };

        consulta.query.mockImplementation(async (sqlQuery) => {
          if (sqlQuery.includes("FROM dbo.Usuarios")) {
            return {
              recordset: [
                {
                  id: usuarioId,
                  rol_id: 3,
                  rol: "Supervisor",
                },
              ],
            };
          }

          if (sqlQuery.includes("FROM dbo.Usuario_Zona")) {
            return {
              recordset: [{ id: 1, nombre: "Zona Norte" }],
            };
          }

          if (sqlQuery.includes("FROM dbo.Usuario_Hacienda")) {
            return {
              recordset: [
                {
                  id: 10,
                  codigo: "H001",
                  nombre: "Hacienda Norte",
                  zona_id: 1,
                  zona: "Zona Norte",
                },
              ],
            };
          }

          if (sqlQuery.includes("FROM dbo.Usuario_Suerte")) {
            return {
              recordset: [
                {
                  id: 100,
                  codigo: "H001001",
                  hacienda_id: 10,
                  hacienda_codigo: "H001",
                  hacienda: "Hacienda Norte",
                  zona_id: 1,
                  zona: "Zona Norte",
                },
              ],
            };
          }

          throw new Error("Consulta SQL no contemplada en la prueba.");
        });

        return consulta;
      }),
    };

    getFabricPool.mockResolvedValue(mockPool);

    const loginResponse = await request(app)
      .post("/api/auth/login")
      .send({
        usuario: "test_supervisor_1",
        password: "TestSup2026!",
      });

    expect(loginResponse.status).toBe(200);

    const cookie = loginResponse.headers["set-cookie"].find((value) =>
      value.startsWith("agroxpert_session="),
    );

    expect(cookie).toBeDefined();

    const response = await request(app)
      .get("/api/access/me")
      .set("Cookie", cookie.split(";")[0]);

    expect(response.status).toBe(200);
    expect(response.body.usuarioId).toBe(usuarioId);
    expect(response.body.rol).toBe("supervisor");
    expect(response.body.zonas).toEqual([
      { id: 1, nombre: "Zona Norte" },
    ]);
    expect(response.body.haciendas).toHaveLength(1);
    expect(response.body.haciendas[0].id).toBe(10);
    expect(response.body.suertes).toHaveLength(1);
    expect(response.body.suertes[0].id).toBe(100);
    expect(getFabricPool).toHaveBeenCalled();
  });
});
