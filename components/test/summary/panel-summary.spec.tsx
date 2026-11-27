// @vitest-environment jsdom

import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { PanelSummary, PanelSummarySkeleton } from "../../summary/panel-summary";

afterEach(() => {
  cleanup();
});

describe("PanelSummary", () => {
  it("muestra los conteos con formato tabular, contexto, iconos y accesos rápidos", () => {
    const { container } = render(
      <PanelSummary
        ordersResult={{
          ok: true,
          counts: { pendiente: 4, confirmado: 2, entregado: 7 },
        }}
        productsResult={{ ok: true, count: 5 }}
      />,
    );

    const pendingValue = screen.getByLabelText("Pedidos pendientes: 4");
    expect(screen.getByRole("heading", { name: "Pedidos pendientes" })).toBeTruthy();
    expect(pendingValue.textContent).toBe("4");
    expect(pendingValue.className).toContain("tabular-nums");
    expect(screen.getByText("Por confirmar")).toBeTruthy();

    const confirmedValue = screen.getByLabelText("Pedidos confirmados: 2");
    expect(screen.getByRole("heading", { name: "Pedidos confirmados" })).toBeTruthy();
    expect(confirmedValue.textContent).toBe("2");
    expect(confirmedValue.className).toContain("tabular-nums");
    expect(screen.getByText("En preparación")).toBeTruthy();

    const deliveredValue = screen.getByLabelText("Pedidos entregados: 7");
    expect(screen.getByRole("heading", { name: "Pedidos entregados" })).toBeTruthy();
    expect(deliveredValue.textContent).toBe("7");
    expect(deliveredValue.className).toContain("tabular-nums");
    expect(screen.getByText("Completados")).toBeTruthy();

    const activeProductsValue = screen.getByLabelText("Productos activos: 5");
    expect(screen.getByRole("heading", { name: "Productos activos" })).toBeTruthy();
    expect(activeProductsValue.textContent).toBe("5");
    expect(activeProductsValue.className).toContain("tabular-nums");
    expect(screen.getByText("Disponibles para pedir")).toBeTruthy();

    expect(container.querySelectorAll("section svg").length).toBeGreaterThanOrEqual(4);

    expect(screen.getByRole("heading", { name: "Accesos rápidos" })).toBeTruthy();
    const createOrderLink = screen.getByRole("link", { name: "Crear un pedido" });
    expect(createOrderLink.getAttribute("href")).toBe("/orders/new");
    expect(createOrderLink.className).toContain("bg-primary");
    expect(createOrderLink.className).toContain("cursor-pointer");

    expect(screen.getByRole("link", { name: "Ver pedidos" }).getAttribute("href")).toBe("/orders");
    expect(screen.getByRole("link", { name: "Gestionar productos" }).getAttribute("href")).toBe("/products");
    expect(screen.getByRole("link", { name: "Gestionar clientes" }).getAttribute("href")).toBe("/customers");
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
    expect(screen.getByText("1. Crea tus productos")).toBeTruthy();
    expect(screen.getByText("2. Guarda tus clientes")).toBeTruthy();
    expect(screen.getByText("3. Crea tu primer pedido")).toBeTruthy();

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

describe("PanelSummarySkeleton", () => {
  it("renderiza el esqueleto accesible coherente con la estructura del panel", () => {
    render(<PanelSummarySkeleton />);

    const skeletonRoot = screen.getByLabelText("Cargando resumen");
    expect(skeletonRoot.getAttribute("aria-busy")).toBe("true");
    expect(screen.getByRole("status").textContent).toBe("Cargando resumen…");
  });
});
