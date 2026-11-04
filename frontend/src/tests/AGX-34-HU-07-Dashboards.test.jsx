import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, within } from "@testing-library/react";
import Dashboards from "../pages/Dashboards";

/* Registros simulados de la base analítica, con dos años por suerte. */
const fila = (codsia, zona, hacienda, anio, tch, extra = {}) => ({
  codsia, Zona: zona, Hacienda: hacienda, Suerte: codsia.slice(-3), "Año": anio,
  TCH: tch, tchm: tch / 13, Variedad: "CC 01-1940", pH: 6.2, Textura: "Franco", ...extra,
});
const REGISTROS = [
  fila("010001001", "Central", "010001", 2024, 118),
  fila("010001001", "Central", "010001", 2025, 126),
  fila("010001002", "Central", "010001", 2024, 104),
  fila("010001002", "Central", "010001", 2025, 110),
  fila("010300001", "Sur", "010300", 2025, 92),
];

function respuestaOk(registros = REGISTROS) {
  return { ok: true, status: 200, json: async () => ({ registros }) };
}

async function abrirDashboard() {
  render(<Dashboards />);
  await screen.findByText("Centro de análisis agrícola");
}

describe("AGX-35-HU-08 — Dashboard 2 de detalle por suerte (interfaz)", () => {
  beforeEach(() => {
    globalThis.fetch = vi.fn(async () => respuestaOk());
  });
  afterEach(() => vi.restoreAllMocks());

  it("AGX-35-HU-08-UI-01: muestra la ficha con filtros por zona, hacienda, suerte y año y la sección de suelos y clima", async () => {
    await abrirDashboard();
    const filtros = screen.getByLabelText("Filtros del dashboard");
    for (const etiqueta of ["Zona", "Hacienda", "Suerte", "Año"]) {
      expect(within(filtros).getAllByText(etiqueta).length).toBeGreaterThan(0);
    }
    const secciones = screen.getByLabelText("Secciones del dashboard");
    expect(within(secciones).getByText("Suelos y clima")).toBeInTheDocument();
    expect(globalThis.fetch).toHaveBeenCalledWith(expect.stringMatching(/\/dashboard$/), expect.objectContaining({ credentials: "include" }));
  });

  it("AGX-35-HU-08-UI-02: si el rol no tiene permiso muestra el mensaje del servidor", async () => {
    globalThis.fetch = vi.fn(async () => ({ ok: false, status: 403, json: async () => ({ mensaje: "Tu rol no tiene acceso al dashboard agrícola." }) }));
    render(<Dashboards />);
    expect(await screen.findByText("Tu rol no tiene acceso al dashboard agrícola.")).toBeInTheDocument();
  });
});

describe("AGX-37-HU-10 — Comparar tendencias históricas de TCH y TCHM", () => {
  beforeEach(() => {
    globalThis.fetch = vi.fn(async () => respuestaOk());
  });
  afterEach(() => vi.restoreAllMocks());

  it("AGX-37-HU-10-CP-01: compara por años el indicador de una zona", async () => {
    await abrirDashboard();
    fireEvent.click(screen.getByRole("button", { name: /Comparaciones/ }));
    fireEvent.change(screen.getByLabelText("Zona", { selector: "select" }), { target: { value: "Central" } });
    fireEvent.click(screen.getByRole("button", { name: "Seleccionar todos" }));

    const resumen = await screen.findByText(/Años comparados:/);
    expect(within(resumen).getByText("2")).toBeInTheDocument();
  });

  it("AGX-37-HU-10-CP-02: exporta a CSV la vista filtrada", async () => {
    const crearUrl = vi.fn(() => "blob:agroxpert");
    URL.createObjectURL = crearUrl;
    URL.revokeObjectURL = vi.fn();
    const clic = vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {});

    await abrirDashboard();
    fireEvent.click(screen.getByRole("button", { name: /Explorador de datos/ }));
    fireEvent.click(screen.getByRole("button", { name: /Exportar CSV/ }));

    expect(crearUrl).toHaveBeenCalledTimes(1);
    const blob = crearUrl.mock.calls[0][0];
    expect(blob.type).toContain("text/csv");
    expect(clic).toHaveBeenCalled();
  });

  it("AGX-37-HU-10-CP-03: permite filtrar la comparación histórica por hacienda", async () => {
    await abrirDashboard();

    fireEvent.click(
      screen.getByRole("button", { name: /Comparaciones/ })
    );

    fireEvent.change(
      screen.getByLabelText("Zona", { selector: "select" }),
      { target: { value: "Central" } }
    );

    const filtroHacienda = screen.getByLabelText(
      "Hacienda (opcional)",
      { selector: "select" }
    );

    expect(filtroHacienda).toBeEnabled();
    expect(
      within(filtroHacienda).getByRole("option", { name: "010001" })
    ).toBeInTheDocument();

    fireEvent.change(filtroHacienda, {
      target: { value: "010001" },
    });

    expect(filtroHacienda).toHaveValue("010001");
  });
});
