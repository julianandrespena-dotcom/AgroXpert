
import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { useApp } from "../context/AppContext";
import AppShell from "../components/layout/AppShell";

vi.mock("../context/AppContext", () => ({
  useApp: vi.fn(),
}));

vi.mock("../components/layout/Sidebar", () => ({
  default: ({ onNavigate, onLogout }) => (
    <nav aria-label="Navegaci├│n de prueba">
      <button onClick={() => onNavigate("home")}>Inicio</button>
      <button onClick={() => onNavigate("dashboards")}>Dashboards</button>
      <button onClick={() => onNavigate("plans")}>Planes</button>
      <button onClick={() => onNavigate("admin")}>Administraci├│n</button>
      <button onClick={onLogout}>Cerrar sesi├│n</button>
    </nav>
  ),
}));

vi.mock("../components/layout/Topbar", () => ({
  default: () => <header>Barra superior</header>,
}));

vi.mock("../components/layout/MobileBottomNav", () => ({
  default: () => null,
}));

vi.mock("../pages/Home", () => ({
  default: () => <h1>Inicio</h1>,
}));

vi.mock("../pages/Alerts", () => ({
  default: () => <h1>Alertas</h1>,
}));

vi.mock("../pages/Chatbot", () => ({
  default: () => <h1>Chatbot</h1>,
}));

vi.mock("../pages/Dashboards", () => ({
  default: () => <h1>Dashboards</h1>,
}));

vi.mock("../pages/RegistroPlanes", () => ({
  default: () => <h1>Registro de planes</h1>,
}));

vi.mock("../pages/Administracion", () => ({
  default: () => <h1>Administraci├│n de usuarios</h1>,
}));

vi.mock("../pages/Placeholder", () => ({
  default: ({ title, description }) => (
    <section role="alert">
      <h1>{title}</h1>
      <p>{description}</p>
    </section>
  ),
}));

describe("AGX-31-HU-04 - Pantalla de inicio seg├║n rol", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("AGX-31-HU-04-CP-01: el administrador inicia en administraci├│n", () => {
    useApp.mockReturnValue({
      role: {
        id: "administrador",
        permissions: {
          dashboards: false,
          plans: false,
          admin: true,
        },
      },
      logout: vi.fn(),
    });

    render(<AppShell />);

    expect(
      screen.getByRole("heading", {
        name: "Administraci├│n de usuarios",
      })
    ).toBeTruthy();
  });

  it("AGX-31-HU-04-CP-02: el gerente accede a dashboards y tiene restringidos planes y administraci├│n", () => {
    useApp.mockReturnValue({
      role: {
        id: "gerente",
        permissions: {
          dashboards: true,
          plans: false,
          admin: false,
        },
      },
      logout: vi.fn(),
    });

    render(<AppShell />);

    expect(
      screen.getByRole("heading", { name: "Inicio" })
    ).toBeTruthy();

    fireEvent.click(
      screen.getByRole("button", { name: "Dashboards" })
    );

    expect(
      screen.getByRole("heading", { name: "Dashboards" })
    ).toBeTruthy();

    fireEvent.click(
      screen.getByRole("button", { name: "Planes" })
    );

    expect(
      screen.getByRole("heading", { name: "Acceso restringido" })
    ).toBeTruthy();

    fireEvent.click(
      screen.getByRole("button", { name: "Administraci├│n" })
    );

    expect(
      screen.getByText(
        "No tienes permisos para acceder a la administraci├│n."
      )
    ).toBeTruthy();
  });

  it("AGX-31-HU-04-CP-03: el mayordomo puede consultar planes, pero no dashboards ni administraci├│n", () => {
    useApp.mockReturnValue({
      role: {
        id: "mayordomo",
        permissions: {
          dashboards: false,
          plans: true,
          admin: false,
        },
      },
      logout: vi.fn(),
    });

    render(<AppShell />);

    expect(
      screen.getByRole("heading", { name: "Inicio" })
    ).toBeTruthy();

    fireEvent.click(
      screen.getByRole("button", { name: "Planes" })
    );

    expect(
      screen.getByRole("heading", { name: "Registro de planes" })
    ).toBeTruthy();

    fireEvent.click(
      screen.getByRole("button", { name: "Dashboards" })
    );

    expect(
      screen.getByText(
        "No tienes permisos para consultar los dashboards."
      )
    ).toBeTruthy();

    fireEvent.click(
      screen.getByRole("button", { name: "Administraci├│n" })
    );

    expect(
      screen.getByRole("heading", { name: "Acceso restringido" })
    ).toBeTruthy();
  });
});
