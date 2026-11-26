// @vitest-environment jsdom

import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it } from "vitest";

import { OrdersTable } from "../../orders/orders-table";
import type { OrderSummary } from "@/lib/orders";

const pendiente: OrderSummary = {
  id: "9e4a6d71-bf50-4c8d-ae9f-4a5b6c7d8e9f",
  customerName: "Ana Ruiz",
  status: "pendiente",
  totalCents: 2800,
  createdAtLabel: "26/11/2026 12:46",
};

const entregado: OrderSummary = {
  id: "a15b7e82-c061-4d9e-bfa0-5b6c7d8e9fa0",
  customerName: "Luis Pérez",
  status: "entregado",
  totalCents: 300,
  createdAtLabel: "25/11/2026 09:00",
};

afterEach(() => {
  cleanup();
});

describe("OrdersTable", () => {
  it("muestra cliente, estado, total y fecha en la tabla", () => {
    render(<OrdersTable orders={[pendiente]} />);

    expect(screen.getByRole("table", { name: "Pedidos" })).toBeTruthy();
    expect(screen.getByRole("columnheader", { name: "Cliente" })).toBeTruthy();
    expect(screen.getByRole("columnheader", { name: "Estado" })).toBeTruthy();
    expect(screen.getByRole("columnheader", { name: "Total" })).toBeTruthy();
    expect(screen.getByRole("columnheader", { name: "Fecha" })).toBeTruthy();
    expect(screen.getByRole("cell", { name: "Ana Ruiz" })).toBeTruthy();
    expect(screen.getByRole("cell", { name: "Pendiente" })).toBeTruthy();
    expect(screen.getByRole("cell", { name: "28,00 €" })).toBeTruthy();
    expect(screen.getByRole("cell", { name: "26/11/2026 12:46" })).toBeTruthy();
    expect(screen.getByRole("link", { name: "Ver pedido de Ana Ruiz del 26/11/2026 12:46" }).getAttribute("href")).toBe(
      `/orders/${pendiente.id}`,
    );
  });

  it("filtra por estado e informa cuando no hay resultados", async () => {
    const user = userEvent.setup();
    render(<OrdersTable orders={[pendiente, entregado]} />);

    await user.selectOptions(screen.getByLabelText("Filtrar por estado"), "confirmado");

    expect(screen.getByText("No hay pedidos con estado confirmado.")).toBeTruthy();
    expect(screen.queryByRole("cell", { name: "Ana Ruiz" })).toBeNull();
    expect(screen.queryByRole("cell", { name: "Luis Pérez" })).toBeNull();
    expect(screen.getByText("0 pedidos")).toBeTruthy();

    await user.selectOptions(screen.getByLabelText("Filtrar por estado"), "entregado");

    expect(screen.getByRole("cell", { name: "Luis Pérez" })).toBeTruthy();
    expect(screen.queryByRole("cell", { name: "Ana Ruiz" })).toBeNull();
    expect(screen.getByRole("cell", { name: "3,00 €" })).toBeTruthy();
  });

  it("muestra el estado vacío cuando el usuario no tiene pedidos", () => {
    render(<OrdersTable orders={[]} />);

    expect(screen.getByText("Todavía no hay pedidos. Crea el primero con el botón de arriba.")).toBeTruthy();
  });
});
