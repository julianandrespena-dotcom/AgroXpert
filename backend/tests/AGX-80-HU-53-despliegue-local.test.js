import { describe, expect, it } from "vitest";
import request from "supertest";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import app from "../src/server.js";

const raiz = resolve(__dirname, "..", "..");

describe("AGX-80-HU-53 — Primera versión local", () => {
  it("AGX-80-HU-53-CP-01: el backend arranca y responde la ruta de verificación", async () => {
    const r = await request(app).get("/");
    expect(r.status).toBe(200);
    expect(r.body.mensaje).toMatch(/funcionando/);
  });

  it("AGX-80-HU-53-CP-02: todos los módulos de la API están montados (401 y no 404 sin sesión)", async () => {
    for (const ruta of ["/api/auth/me", "/api/access/me", "/api/dashboard", "/api/dashboard/d1", "/api/users", "/api/admin/test"]) {
      const r = await request(app).get(ruta);
      expect(r.status, ruta).toBe(401);
    }
  });

  it("AGX-80-HU-53-CP-03: el repositorio trae plantillas de configuración sin secretos (.env.example)", () => {
    expect(existsSync(resolve(raiz, "backend", ".env.example"))).toBe(true);
    expect(existsSync(resolve(raiz, "frontend", ".env.example"))).toBe(true);
  });

  it("AGX-80-HU-53-CP-04: el README explica instalación, configuración y ejecución local", () => {
    const readme = readFileSync(resolve(raiz, "README.md"), "utf-8");
    for (const paso of ["npm install", "VITE_API_URL", "npm run dev", "localhost:5173", "localhost:3000"]) {
      expect(readme, paso).toContain(paso);
    }
  });
});
