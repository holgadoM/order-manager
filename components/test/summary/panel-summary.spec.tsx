// @vitest-environment jsdom

import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { PanelSummary } from "../../summary/panel-summary";

afterEach(() => {
  cleanup();
});

describe("PanelSummary", () => {
  it("muestra los conteos de pedidos pendientes, confirmados, entregados y productos activos", () => {
    render(
      <PanelSummary
        ordersResult={{
          ok: true,
          counts: { pendiente: 4, confirmado: 2, entregado: 7 },
        }}
        productsResult={{ ok: true, count: 5 }}
      />,
    );

    expect(screen.getByRole("heading", { name: "Pedidos pendientes" })).toBeTruthy();
    expect(screen.getByLabelText("Pedidos pendientes: 4").textContent).toBe("4");

    expect(screen.getByRole("heading", { name: "Pedidos confirmados" })).toBeTruthy();
    expect(screen.getByLabelText("Pedidos confirmados: 2").textContent).toBe("2");

    expect(screen.getByRole("heading", { name: "Pedidos entregados" })).toBeTruthy();
    expect(screen.getByLabelText("Pedidos entregados: 7").textContent).toBe("7");

    expect(screen.getByRole("heading", { name: "Productos activos" })).toBeTruthy();
    expect(screen.getByLabelText("Productos activos: 5").textContent).toBe("5");

    expect(screen.getByRole("heading", { name: "Accesos rápidos" })).toBeTruthy();
    expect(screen.getByRole("link", { name: "Crear un pedido" }).getAttribute("href")).toBe("/orders/new");
    expect(screen.getByRole("link", { name: "Ver pedidos" }).getAttribute("href")).toBe("/orders");
  });

  it("muestra ceros y guía útil cuando no hay datos", () => {
    render(
      <PanelSummary
        ordersResult={{
          ok: true,
          counts: { pendiente: 0, confirmado: 0, entregado: 0 },
        }}
        productsResult={{ ok: true, count: 0 }}
      />,
    );

    expect(screen.getByLabelText("Pedidos pendientes: 0").textContent).toBe("0");
    expect(screen.getByLabelText("Pedidos confirmados: 0").textContent).toBe("0");
    expect(screen.getByLabelText("Pedidos entregados: 0").textContent).toBe("0");
    expect(screen.getByLabelText("Productos activos: 0").textContent).toBe("0");

    expect(screen.getByRole("heading", { name: "Empieza a organizar tus pedidos" })).toBeTruthy();
    expect(screen.getByRole("link", { name: "Añadir productos" }).getAttribute("href")).toBe("/products");
    expect(screen.getByRole("link", { name: "Añadir clientes" }).getAttribute("href")).toBe("/customers");
    expect(screen.getByRole("link", { name: "Crear un pedido" }).getAttribute("href")).toBe("/orders/new");
  });

  it("muestra el aviso de error sin tumbar la página cuando falla una lectura", () => {
    render(
      <PanelSummary
        ordersResult={{
          ok: false,
          message: "No se pudieron cargar los pedidos. Inténtalo de nuevo.",
        }}
        productsResult={{ ok: true, count: 3 }}
      />,
    );

    expect(screen.getByRole("alert").textContent).toContain("No se pudieron cargar los pedidos.");
    expect(screen.getByLabelText("Pedidos pendientes: no disponible").textContent).toBe("—");
    expect(screen.getByLabelText("Productos activos: 3").textContent).toBe("3");
  });
});
