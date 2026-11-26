// @vitest-environment jsdom

import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/product-actions", () => ({
  createProduct: vi.fn(),
  updateProduct: vi.fn(),
}));

import { CreateProductForm, EditProductForm, ProductForm } from "../../products/product-form";

afterEach(() => {
  cleanup();
});

describe("ProductForm", () => {
  it("no envía el alta si el nombre está vacío o el precio no es válido", async () => {
    const user = userEvent.setup();
    const action = vi.fn();
    render(<ProductForm mode="create" pending={false} action={action} state={{}} />);

    await user.click(screen.getByRole("button", { name: "Crear producto" }));

    expect(action).not.toHaveBeenCalled();
    const alert = screen.getByRole("alert");
    expect(alert.textContent).toContain("El nombre es obligatorio.");
    expect(alert.textContent).toContain("Introduce un precio.");
    expect(screen.getByLabelText("Nombre").getAttribute("aria-invalid")).toBe("true");
    expect(screen.getByLabelText("Precio (euros)").getAttribute("aria-invalid")).toBe("true");

    await user.type(screen.getByLabelText("Nombre"), "Tarta");
    await user.type(screen.getByLabelText("Precio (euros)"), "0");
    await user.click(screen.getByRole("button", { name: "Crear producto" }));

    expect(action).not.toHaveBeenCalled();
    expect(screen.getByRole("alert").textContent).toContain("mayor que cero");
  });

  it("envía el alta cuando el nombre y el precio en euros son válidos", async () => {
    const user = userEvent.setup();
    const action = vi.fn();
    render(<ProductForm mode="create" pending={false} action={action} state={{}} />);

    await user.type(screen.getByLabelText("Nombre"), "Tarta");
    await user.type(screen.getByLabelText("Precio (euros)"), "12,50");
    await user.click(screen.getByRole("button", { name: "Crear producto" }));

    expect(action).toHaveBeenCalledTimes(1);
    const formData = action.mock.calls[0]?.[0] as FormData;
    expect(formData.get("name")).toBe("Tarta");
    expect(formData.get("priceEuros")).toBe("12,50");
    expect(formData.get("active")).toBeNull();
  });

  it("muestra el error de Supabase y el estado de espera sin perder el formulario", () => {
    const { rerender } = render(
      <ProductForm
        mode="create"
        pending={false}
        action={vi.fn()}
        state={{ ok: false, message: "No se pudo guardar el producto. Inténtalo de nuevo." }}
      />,
    );

    const alert = screen.getByRole("alert");
    expect(alert.textContent).toContain("No se pudo guardar el producto. Inténtalo de nuevo.");
    expect(alert.className).toContain("text-destructive");
    expect(screen.getByLabelText("Nombre")).toBeTruthy();

    rerender(<ProductForm mode="create" pending={true} action={vi.fn()} state={{}} />);

    expect(screen.getByRole("button", { name: "Creando producto…" }).hasAttribute("disabled")).toBe(true);
  });

  it("edita nombre, precio y si está activo, y anuncia el guardado", async () => {
    const user = userEvent.setup();
    const action = vi.fn();
    const { rerender } = render(
      <ProductForm
        mode="edit"
        pending={false}
        action={action}
        product={{
          id: "6b1f3a4e-8c2d-4f5a-9b7e-1d2c3a4b5c6d",
          name: "Brownie",
          priceEuros: "3,50",
          active: true,
        }}
        state={{}}
      />,
    );

    expect((screen.getByLabelText("Nombre") as HTMLInputElement).value).toBe("Brownie");
    expect((screen.getByLabelText("Precio (euros)") as HTMLInputElement).value).toBe("3,50");
    const active = screen.getByLabelText("Activo") as HTMLInputElement;
    expect(active.checked).toBe(true);

    await user.clear(screen.getByLabelText("Nombre"));
    await user.click(screen.getByRole("button", { name: "Guardar cambios" }));
    expect(action).not.toHaveBeenCalled();
    expect(screen.getByRole("alert").textContent).toContain("El nombre es obligatorio.");

    await user.type(screen.getByLabelText("Nombre"), "Brownie grande");
    await user.click(active);
    await user.click(screen.getByRole("button", { name: "Guardar cambios" }));

    expect(action).toHaveBeenCalledTimes(1);
    const formData = action.mock.calls[0]?.[0] as FormData;
    expect(formData.get("id")).toBe("6b1f3a4e-8c2d-4f5a-9b7e-1d2c3a4b5c6d");
    expect(formData.get("name")).toBe("Brownie grande");
    expect(formData.get("priceEuros")).toBe("3,50");
    expect(formData.get("active")).toBeNull();

    rerender(
      <ProductForm
        mode="edit"
        pending={false}
        action={action}
        product={{
          id: "6b1f3a4e-8c2d-4f5a-9b7e-1d2c3a4b5c6d",
          name: "Brownie grande",
          priceEuros: "3,50",
          active: false,
        }}
        state={{ ok: true, message: "Cambios guardados." }}
      />,
    );

    const status = screen.getByRole("status");
    expect(status.textContent).toContain("Cambios guardados.");
    expect(status.className).toContain("text-success");
  });
});

describe("CreateProductForm", () => {
  it("ofrece el alta de un producto", () => {
    render(<CreateProductForm />);

    expect(screen.getByRole("heading", { name: "Nuevo producto" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Crear producto" }).getAttribute("type")).toBe("submit");
  });
});

describe("EditProductForm", () => {
  it("ofrece la edición del producto elegido", () => {
    render(
      <EditProductForm
        product={{
          id: "6b1f3a4e-8c2d-4f5a-9b7e-1d2c3a4b5c6d",
          name: "Brownie",
          priceEuros: "3,50",
          active: false,
        }}
      />,
    );

    expect(screen.getByRole("heading", { name: "Editar producto" })).toBeTruthy();
    expect((screen.getByLabelText("Activo") as HTMLInputElement).checked).toBe(false);
    expect(screen.getByText("Este producto no se ofrece ahora.")).toBeTruthy();
  });
});
