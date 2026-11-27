// @vitest-environment jsdom

import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/product-actions", () => ({
  createProduct: vi.fn(),
  updateProduct: vi.fn(),
}));

import { ProductsPageShell } from "../../products/products-page-shell";
import { ProductsTable } from "../../products/products-table";

afterEach(() => {
  cleanup();
});

describe("ProductsTable", () => {
  it("muestra el estado vacío contextual, el conteo y la acción de alta", async () => {
    const user = userEvent.setup();
    render(
      <ProductsPageShell>
        <ProductsTable products={[]} />
      </ProductsPageShell>,
    );

    expect(screen.getByRole("heading", { name: "Productos" })).toBeTruthy();
    expect(screen.getByRole("table", { name: "Productos" })).toBeTruthy();
    expect(screen.getByRole("columnheader", { name: "Nombre" })).toBeTruthy();
    expect(screen.getByRole("columnheader", { name: "Precio" })).toBeTruthy();
    expect(screen.getByRole("columnheader", { name: "Estado" })).toBeTruthy();
    expect(screen.getByText("0 productos").getAttribute("aria-live")).toBe("polite");
    expect(screen.getByText("Todavía no hay productos")).toBeTruthy();

    await user.click(screen.getByRole("button", { name: "Añadir el primer producto" }));

    expect(screen.getByRole("heading", { name: "Nuevo producto" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Cerrar alta" }).getAttribute("aria-expanded")).toBe("true");
  });

  it("lista el precio en euros, el estado con icono y abre la edición", async () => {
    const user = userEvent.setup();
    render(
      <ProductsTable
        products={[
          { id: "6b1f3a4e-8c2d-4f5a-9b7e-1d2c3a4b5c6d", name: "Tarta", priceCents: 1250, active: true },
          { id: "7c2e4b5f-9d3e-5a6b-0c8f-2e3d4b5c6d7e", name: "Brownie", priceCents: 350, active: false },
        ]}
      />,
    );

    expect(screen.getByText("2 productos").getAttribute("aria-live")).toBe("polite");
    expect(screen.getByRole("cell", { name: "Tarta" })).toBeTruthy();

    const priceCell = screen.getByRole("cell", { name: "12,50 €" });
    expect(priceCell.className).toContain("tabular-nums");

    const activeCell = screen.getByRole("cell", { name: "Activo" });
    expect(activeCell.querySelector("svg")).toBeTruthy();
    expect(screen.getByRole("cell", { name: "Inactivo" }).querySelector("svg")).toBeTruthy();

    await user.click(screen.getByRole("button", { name: "Editar Tarta" }));

    expect(screen.getByRole("heading", { name: "Editar producto" })).toBeTruthy();
    expect((screen.getByLabelText("Precio (euros)") as HTMLInputElement).value).toBe("12,50");
  });
});
