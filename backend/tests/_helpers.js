import { vi } from "vitest";
import { createSession } from "../src/services/sessionService.js";

/* Pool de Fabric simulado que registra cada consulta y sus parámetros. */
export function crearPool(responder) {
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

/* Crea una sesión en memoria y devuelve la cookie lista para Supertest. */
export function cookieDe(user) {
  const { token } = createSession({ activo: true, ...user });
  return `agroxpert_session=${token}`;
}
