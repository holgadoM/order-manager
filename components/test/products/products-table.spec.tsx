// @vitest-environment jsdom

import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/product-actions", () => ({
  createProduct: vi.fn(),
  updateProduct: vi.fn(),
}));

import { ProductsTable } from "../../products/products-table";

afterEach(() => {
  cleanup();
});

describe("ProductsTable", () => {
  it("muestra el estado vacío dentro de la tabla", () => {
    render(<ProductsTable products={[]} />);

    expect(screen.getByRole("table", { name: "Productos" })).toBeTruthy();
    expect(screen.getByRole("columnheader", { name: "Nombre" })).toBeTruthy();
    expect(screen.getByRole("columnheader", { name: "Precio" })).toBeTruthy();
    expect(screen.getByRole("columnheader", { name: "Estado" })).toBeTruthy();
    expect(screen.getByText("Todavía no hay productos. Crea el primero con el formulario de arriba.")).toBeTruthy();
  });

  it("lista el precio en euros y abre la edición", async () => {
    const user = userEvent.setup();
    render(
      <ProductsTable
        products={[{ id: "6b1f3a4e-8c2d-4f5a-9b7e-1d2c3a4b5c6d", name: "Tarta", priceCents: 1250, active: true }]}
      />,
    );

    expect(screen.getByRole("cell", { name: "Tarta" })).toBeTruthy();
    expect(screen.getByRole("cell", { name: "12,50 €" })).toBeTruthy();
    expect(screen.getByRole("cell", { name: "Activo" })).toBeTruthy();

    await user.click(screen.getByRole("button", { name: "Editar" }));

    expect(screen.getByRole("heading", { name: "Editar producto" })).toBeTruthy();
    expect((screen.getByLabelText("Precio (euros)") as HTMLInputElement).value).toBe("12,50");
  });
});
