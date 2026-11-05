
import { afterEach, describe, expect, it } from "vitest";
import request from "supertest";
import app from "../src/server.js";


describe("AGX-28-HU-01: Inicio de sesión", () => {
  it("AGX-28-HU-01-CP-01: rechaza la solicitud si faltan las credenciales", async () => {
    const response = await request(app)
      .post("/api/auth/login")
      .send({});

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
    expect(response.body.message).toBeTruthy();
  });

  it("AGX-28-HU-01-CP-02: rechaza una contraseña incorrecta", async () => {
    const response = await request(app)
      .post("/api/auth/login")
      .send({
        usuario: "test_supervisor_1",
        password: "ContraseñaIncorrecta-123",
      });

    expect(response.status).toBe(401);
    expect(response.body.success).toBe(false);
    expect(response.body.message).toBeTruthy();
    expect(response.headers["set-cookie"]).toBeUndefined();
  });

  
  it("AGX-28-HU-01-CP-03: permite iniciar sesión con credenciales válidas", async () => {
    const response = await request(app)
      .post("/api/auth/login")
      .send({
        usuario: "test_supervisor_1",
        password: "TestSup2026!",
      });

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.user.rol).toBe("supervisor");
    expect(response.body.user.usuario).toBe("test_supervisor_1");

    const cookies = response.headers["set-cookie"];

    expect(cookies).toBeDefined();
    expect(
      cookies.some((cookie) => cookie.startsWith("agroxpert_session=")),
    ).toBe(true);
  });

  
  it("AGX-28-HU-01-CP-04: consulta el usuario de una sesión válida", async () => {
    const loginResponse = await request(app)
      .post("/api/auth/login")
      .send({
        usuario: "test_supervisor_1",
        password: "TestSup2026!",
      });

    expect(loginResponse.status).toBe(200);

    const cookies = loginResponse.headers["set-cookie"];
    expect(cookies).toBeDefined();

    const sessionCookie = cookies.find((cookie) =>
      cookie.startsWith("agroxpert_session="),
    );

    expect(sessionCookie).toBeDefined();

    const response = await request(app)
      .get("/api/auth/me")
      .set("Cookie", sessionCookie.split(";")[0]);

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.authenticated).toBe(true);
    expect(response.body.user.usuario).toBe("test_supervisor_1");
    expect(response.body.user.rol).toBe("supervisor");
  });

  it("AGX-28-HU-01-CP-05: rechaza la consulta de sesión sin autenticación", async () => {
    const response = await request(app).get("/api/auth/me");

    expect(response.status).toBe(401);
    expect(response.body.success).toBe(false);
  });
  
  it("AGX-28-HU-01-CP-06: cierra la sesión e impide reutilizarla", async () => {
    const agent = request.agent(app);

    const loginResponse = await agent
      .post("/api/auth/login")
      .send({
        usuario: "test_supervisor_1",
        password: "TestSup2026!",
      });

    expect(loginResponse.status).toBe(200);

    const sessionResponse = await agent.get("/api/auth/me");

    expect(sessionResponse.status).toBe(200);
    expect(sessionResponse.body.authenticated).toBe(true);

    const logoutResponse = await agent.post("/api/auth/logout");

    expect(logoutResponse.status).toBe(200);
    expect(logoutResponse.body.success).toBe(true);

    const responseAfterLogout = await agent.get("/api/auth/me");

    expect(responseAfterLogout.status).toBe(401);
    expect(responseAfterLogout.body.success).toBe(false);
  });

  
  it("AGX-28-HU-01-CP-07: rechaza un usuario inexistente", async () => {
    const response = await request(app)
      .post("/api/auth/login")
      .send({
        usuario: "usuario_inexistente_98765",
        password: "ClavePrueba-2026!",
      });

    expect(response.status).toBe(401);
    expect(response.body.success).toBe(false);
    expect(response.body.message).toBeTruthy();
    expect(response.headers["set-cookie"]).toBeUndefined();
  });
  
  it("AGX-28-HU-01-CP-08: rechaza una cookie de sesión inválida", async () => {
    const response = await request(app)
      .get("/api/auth/me")
      .set("Cookie", "agroxpert_session=token_invalido_12345");

    expect(response.status).toBe(401);
    expect(response.body.success).toBe(false);
    expect(response.body.authenticated).not.toBe(true);
  });
  

describe("AGX-28-HU-01: Configuración de cuentas de prueba", () => {
  it("AGX-28-HU-01-CP-09: rechaza las cuentas temporales si están deshabilitadas", async () => {
    const valorAnterior = process.env.ENABLE_TEST_USERS;
    process.env.ENABLE_TEST_USERS = "false";

    try {
      const response = await request(app)
        .post("/api/auth/login")
        .send({
          usuario: "test_supervisor_1",
          password: "TestSup2026!",
        });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.headers["set-cookie"]).toBeUndefined();
    } finally {
      if (valorAnterior === undefined) {
        delete process.env.ENABLE_TEST_USERS;
      } else {
        process.env.ENABLE_TEST_USERS = valorAnterior;
      }
    }
  });
});

  it("AGX-28-HU-01-CP-10: normaliza espacios y mayúsculas del usuario", async () => {
    const response = await request(app)
      .post("/api/auth/login")
      .send({
        usuario: "  TEST_SUPERVISOR_1  ",
        password: "TestSup2026!",
      });

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.user.usuario).toBe("test_supervisor_1");
    expect(response.body.user.rol).toBe("supervisor");
  });
});
