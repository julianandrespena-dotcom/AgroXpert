import { describe, it, expect } from "vitest";
import request from "supertest";
import app from "../src/server.js";

describe("GET /", () => {
  it("responde correctamente y confirma que el backend funciona", async () => {
    const response = await request(app).get("/");

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      mensaje: "Backend de AgroXpert funcionando correctamente",
    });
  });
});
