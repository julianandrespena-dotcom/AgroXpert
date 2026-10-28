import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { useApp } from "../context/AppContext";
import Dashboard1 from "../pages/dashboard_1";

vi.mock("../context/AppContext", () => ({
  useApp: vi.fn(),
}));

vi.mock("../pages/Dashboards", () => ({
  default: () => <h2>Centro de análisis agrícola</h2>,
}));

const RESPUESTA = {
  filtros: {
    aplicados: { anio: 2025, indicador: "TCH" },
    opciones: {
      anios: [2025, 2024],
      zonas: [{ valor: "Central", etiqueta: "Central" }],
      haciendas: [{ valor: "010001", etiqueta: "010001", suertes: 2 }],
      suertes: [],
      labores: [],
      estados: [
        { id: "optima", etiqueta: "Óptima" },
        { id: "atencion", etiqueta: "Atención" },
        { id: "critica", etiqueta: "Crítica" },
      ],
      indicadores: [
        { id: "TCH", etiqueta: "TCH" },
        { id: "TCHM", etiqueta: "TCHM" },
      ],
    },
    laboresDisponible: false,
  },
  indicadores: {
    tch: { valor: 104.4, anterior: 101.3, variacionPct: 3.1 },
    tchm: { valor: 7.1, anterior: 6.7, variacion: 0.4 },
    sacarosa: { valor: 11.4, anterior: 11.4, variacion: 0 },
    area: { suertes: 5757, hectareas: 38400 },
  },
  grafico: {
    agrupacion: "zona",
    indicador: "TCH",
    etiquetaIndicador: "TCH",
    unidad: "ton/ha",
    barras: [
      { clave: "Central", etiqueta: "Central", valor: 131, suertes: 900 },
      { clave: "Sur", etiqueta: "Sur", valor: 96, suertes: 700 },
    ],
  },
  semaforo: {
    umbrales: { optima: 0.95, atencion: 0.8 },
    total: 100,
    sinDato: 0,
    categorias: [
      { id: "optima", etiqueta: "Óptima", suertes: 62, porcentaje: 62, hectareas: 1 },
      { id: "atencion", etiqueta: "Atención", suertes: 27, porcentaje: 27, hectareas: 1 },
      { id: "critica", etiqueta: "Crítica", suertes: 11, porcentaje: 11, hectareas: 1 },
    ],
  },
  meta: { anio: 2025, anioPrevio: 2024, alcance: "global", suertesAutorizadas: 5757 },
};

const rolGerente = {
  role: { id: "gerente", permissions: { dashboards: true, plans: false, admin: false } },
};

describe("AGX-D1 — Dashboard 1 consolidado (interfaz)", () => {
  beforeEach(() => {
    globalThis.fetch = vi.fn(async () => ({
      ok: true,
      status: 200,
      json: async () => RESPUESTA,
    }));
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("AGX-D1-UI-01: muestra los KPIs y gráficos con datos del backend", async () => {
    useApp.mockReturnValue(rolGerente);
    render(<Dashboard1 />);

    expect(await screen.findByText("TCH consolidado")).toBeTruthy();
    expect(screen.getByText("104,4")).toBeTruthy();
    expect(screen.getByText("5.757")).toBeTruthy();
    expect(screen.getByText("TCH por zona")).toBeTruthy();
    expect(screen.getByText("• estable")).toBeTruthy();

    const [url, opciones] = fetch.mock.calls[0];
    expect(url).toContain("/dashboard/d1?");
    expect(opciones.credentials).toBe("include");
  });

  it("AGX-D1-UI-02: seleccionar un estado en el semáforo vuelve a consultar con el filtro", async () => {
    useApp.mockReturnValue(rolGerente);
    render(<Dashboard1 />);

    fireEvent.click(await screen.findByRole("button", { name: /Crítica/ }));

    await waitFor(() => {
      expect(fetch.mock.calls.some(([url]) => url.includes("estado=critica"))).toBe(true);
    });
  });

  it("AGX-D1-UI-03: hacer clic en una zona profundiza el filtro", async () => {
    useApp.mockReturnValue(rolGerente);
    render(<Dashboard1 />);

    fireEvent.click(await screen.findByTitle(/^Central:/));

    await waitFor(() => {
      expect(fetch.mock.calls.some(([url]) => url.includes("zona=Central"))).toBe(true);
    });
  });

  it("AGX-D1-UI-04: la pestaña D2 reutiliza el centro de análisis existente", async () => {
    useApp.mockReturnValue(rolGerente);
    render(<Dashboard1 />);

    fireEvent.click(screen.getByRole("button", { name: "D2 · Detalle por suerte" }));
    expect(screen.getByRole("heading", { name: "Centro de análisis agrícola" })).toBeTruthy();
  });

  it("AGX-D1-UI-05: un rol sin permiso de dashboards no consulta datos", () => {
    useApp.mockReturnValue({
      role: { id: "mayordomo", permissions: { dashboards: false } },
    });
    render(<Dashboard1 />);

    expect(screen.getByRole("heading", { name: "Acceso restringido" })).toBeTruthy();
    expect(fetch).not.toHaveBeenCalled();
  });
});
