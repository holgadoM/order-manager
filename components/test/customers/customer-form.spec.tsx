// @vitest-environment jsdom

import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/customer-actions", () => ({
  createCustomer: vi.fn(),
  updateCustomer: vi.fn(),
}));

import { CreateCustomerForm, CustomerForm, EditCustomerForm } from "../../customers/customer-form";

afterEach(() => {
  cleanup();
});

describe("CustomerForm", () => {
  it("no envía el alta si el nombre está vacío y explica el error", async () => {
    const user = userEvent.setup();
    const action = vi.fn();
    render(<CustomerForm mode="create" pending={false} action={action} state={{}} />);

    await user.click(screen.getByRole("button", { name: "Crear cliente" }));

    expect(action).not.toHaveBeenCalled();
    const alert = screen.getByRole("alert");
    expect(alert.textContent).toContain("El nombre es obligatorio.");
    expect(screen.getByLabelText("Nombre").getAttribute("aria-invalid")).toBe("true");
  });

  it("envía el alta con teléfono y notas vacíos", async () => {
    const user = userEvent.setup();
    const action = vi.fn();
    render(<CustomerForm mode="create" pending={false} action={action} state={{}} />);

    await user.type(screen.getByLabelText("Nombre"), "Ana Ruiz");
    await user.click(screen.getByRole("button", { name: "Crear cliente" }));

    expect(action).toHaveBeenCalledTimes(1);
    const formData = action.mock.calls[0]?.[0] as FormData;
    expect(formData.get("name")).toBe("Ana Ruiz");
    expect(formData.get("phone")).toBe("");
    expect(formData.get("notes")).toBe("");
  });

  it("muestra el error de Supabase y el estado de espera sin perder el formulario", () => {
    const { rerender } = render(
      <CustomerForm
        mode="create"
        pending={false}
        action={vi.fn()}
        state={{ ok: false, message: "No se pudo guardar el cliente. Inténtalo de nuevo." }}
      />,
    );

    const alert = screen.getByRole("alert");
    expect(alert.textContent).toContain("No se pudo guardar el cliente. Inténtalo de nuevo.");
    expect(alert.className).toContain("text-destructive");
    expect(screen.getByLabelText("Nombre")).toBeTruthy();

    rerender(<CustomerForm mode="create" pending={true} action={vi.fn()} state={{}} />);

    expect(screen.getByRole("button", { name: "Creando cliente…" }).hasAttribute("disabled")).toBe(true);
  });

  it("edita nombre, teléfono y notas, y anuncia el guardado", async () => {
    const user = userEvent.setup();
    const action = vi.fn();
    const { rerender } = render(
      <CustomerForm
        mode="edit"
        pending={false}
        action={action}
        customer={{
          id: "6b1f3a4e-8c2d-4f5a-9b7e-1d2c3a4b5c6d",
          name: "Ana Ruiz",
          phone: "600111222",
          notes: "Por la tarde",
        }}
        state={{}}
      />,
    );

    expect((screen.getByLabelText("Nombre") as HTMLInputElement).value).toBe("Ana Ruiz");
    expect((screen.getByLabelText("Teléfono") as HTMLInputElement).value).toBe("600111222");
    expect((screen.getByLabelText("Notas") as HTMLTextAreaElement).value).toBe("Por la tarde");

    await user.clear(screen.getByLabelText("Nombre"));
    await user.click(screen.getByRole("button", { name: "Guardar cambios" }));
    expect(action).not.toHaveBeenCalled();
    expect(screen.getByRole("alert").textContent).toContain("El nombre es obligatorio.");

    await user.type(screen.getByLabelText("Nombre"), "Ana Ruiz López");
    await user.clear(screen.getByLabelText("Teléfono"));
    await user.clear(screen.getByLabelText("Notas"));
    await user.click(screen.getByRole("button", { name: "Guardar cambios" }));

    expect(action).toHaveBeenCalledTimes(1);
    const formData = action.mock.calls[0]?.[0] as FormData;
    expect(formData.get("id")).toBe("6b1f3a4e-8c2d-4f5a-9b7e-1d2c3a4b5c6d");
    expect(formData.get("name")).toBe("Ana Ruiz López");
    expect(formData.get("phone")).toBe("");
    expect(formData.get("notes")).toBe("");

    rerender(
      <CustomerForm
        mode="edit"
        pending={false}
        action={action}
        customer={{
          id: "6b1f3a4e-8c2d-4f5a-9b7e-1d2c3a4b5c6d",
          name: "Ana Ruiz López",
          phone: "",
          notes: "",
        }}
        state={{ ok: true, message: "Cambios guardados." }}
      />,
    );

    const status = screen.getByRole("status");
    expect(status.textContent).toContain("Cambios guardados.");
    expect(status.className).toContain("text-success");
  });
});

describe("CreateCustomerForm", () => {
  it("ofrece el alta de un cliente", () => {
    render(<CreateCustomerForm />);

    expect(screen.getByRole("heading", { name: "Nuevo cliente" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Crear cliente" }).getAttribute("type")).toBe("submit");
  });
});

describe("EditCustomerForm", () => {
  it("ofrece la edición del cliente elegido", () => {
    render(
      <EditCustomerForm
        customer={{
          id: "6b1f3a4e-8c2d-4f5a-9b7e-1d2c3a4b5c6d",
          name: "Ana Ruiz",
          phone: "",
          notes: "Sin gluten",
        }}
      />,
    );

    expect(screen.getByRole("heading", { name: "Editar cliente" })).toBeTruthy();
    expect((screen.getByLabelText("Notas") as HTMLTextAreaElement).value).toBe("Sin gluten");
  });
});
