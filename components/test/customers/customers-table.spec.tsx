// @vitest-environment jsdom

import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/customer-actions", () => ({
  createCustomer: vi.fn(),
  updateCustomer: vi.fn(),
}));

import { CustomersTable } from "../../customers/customers-table";

afterEach(() => {
  cleanup();
});

describe("CustomersTable", () => {
  it("muestra el estado vacío dentro de la tabla", () => {
    render(<CustomersTable customers={[]} />);

    expect(screen.getByRole("table", { name: "Clientes" })).toBeTruthy();
    expect(screen.getByRole("columnheader", { name: "Nombre" })).toBeTruthy();
    expect(screen.getByRole("columnheader", { name: "Teléfono" })).toBeTruthy();
    expect(screen.getByRole("columnheader", { name: "Notas" })).toBeTruthy();
    expect(screen.getByText("Todavía no hay clientes. Crea el primero con el formulario de arriba.")).toBeTruthy();
  });

  it("lista teléfono y notas y abre la edición", async () => {
    const user = userEvent.setup();
    render(
      <CustomersTable
        customers={[
          {
            id: "6b1f3a4e-8c2d-4f5a-9b7e-1d2c3a4b5c6d",
            name: "Ana Ruiz",
            phone: "600111222",
            notes: null,
          },
        ]}
      />,
    );

    expect(screen.getByRole("cell", { name: "Ana Ruiz" })).toBeTruthy();
    expect(screen.getByRole("cell", { name: "600111222" })).toBeTruthy();
    expect(screen.getByRole("cell", { name: "Sin notas" })).toBeTruthy();

    await user.click(screen.getByRole("button", { name: "Editar" }));

    expect(screen.getByRole("heading", { name: "Editar cliente" })).toBeTruthy();
    expect((screen.getByLabelText("Teléfono") as HTMLInputElement).value).toBe("600111222");
    expect((screen.getByLabelText("Notas") as HTMLTextAreaElement).value).toBe("");
  });
});
