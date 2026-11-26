// @vitest-environment jsdom

import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/order-actions", () => ({
  createOrder: vi.fn(),
}));

import { CreateOrderForm, OrderForm } from "../../orders/order-form";

const customer = { id: "6b1f3a4e-8c2d-4f5a-9b7e-1d2c3a4b5c6d", name: "Ana Ruiz" };
const tarta = { id: "7c2e4b5f-9d3e-4a6b-8c7d-2e3f4a5b6c7d", name: "Tarta", priceCents: 1250 };
const cafe = { id: "8d3f5c60-ae4f-4b7c-9d8e-3f4a5b6c7d8e", name: "Café", priceCents: 300 };

afterEach(() => {
  cleanup();
});

async function addProduct(
  user: ReturnType<typeof userEvent.setup>,
  productId: string,
  quantity: string,
) {
  await user.selectOptions(screen.getByLabelText("Producto"), productId);
  await user.clear(screen.getByLabelText("Cantidad"));
  await user.type(screen.getByLabelText("Cantidad"), quantity);
  await user.click(screen.getByRole("button", { name: "Añadir producto" }));
}

describe("OrderForm", () => {
  it("no envía el pedido sin cliente ni líneas y explica el error", async () => {
    const user = userEvent.setup();
    const action = vi.fn();
    render(
      <OrderForm customers={[customer]} products={[tarta, cafe]} pending={false} action={action} state={{}} />,
    );

    await user.click(screen.getByRole("button", { name: "Crear pedido" }));

    expect(action).not.toHaveBeenCalled();
    const alert = screen.getByRole("alert");
    expect(alert.textContent).toContain("Elige un cliente.");
    expect(alert.textContent).toContain("Añade al menos un producto.");
    expect(screen.getByLabelText("Cliente").getAttribute("aria-invalid")).toBe("true");
    expect(screen.getByText("Total: 0,00 €")).toBeTruthy();
  });

  it("añade líneas en el navegador y muestra el total de cantidad por precio capturado", async () => {
    const user = userEvent.setup();
    const action = vi.fn();
    render(
      <OrderForm customers={[customer]} products={[tarta, cafe]} pending={false} action={action} state={{}} />,
    );

    await addProduct(user, tarta.id, "2");

    expect(screen.getByLabelText("Cantidad de Tarta")).toBeTruthy();
    expect(screen.getByText("Precio unitario: 12,50 €")).toBeTruthy();
    expect(screen.getByText("Importe: 25,00 €")).toBeTruthy();
    expect(screen.getByText("Total: 25,00 €")).toBeTruthy();

    await addProduct(user, cafe.id, "1");

    expect(screen.getByText("Precio unitario: 3,00 €")).toBeTruthy();
    expect(screen.getByText("Total: 28,00 €")).toBeTruthy();

    await user.clear(screen.getByLabelText("Cantidad de Tarta"));
    await user.type(screen.getByLabelText("Cantidad de Tarta"), "3");

    expect(screen.getByText("Importe: 37,50 €")).toBeTruthy();
    expect(screen.getByText("Total: 40,50 €")).toBeTruthy();

    await user.selectOptions(screen.getByLabelText("Cliente"), customer.id);
    await user.type(screen.getByLabelText("Nota"), "Sin azúcar");
    await user.click(screen.getByRole("button", { name: "Crear pedido" }));

    expect(action).toHaveBeenCalledTimes(1);
    const formData = action.mock.calls[0]?.[0] as FormData;
    expect(formData.get("customerId")).toBe(customer.id);
    expect(formData.get("notes")).toBe("Sin azúcar");
    expect(formData.getAll("productId")).toEqual([tarta.id, cafe.id]);
    expect(formData.getAll("quantity")).toEqual(["3", "1"]);
    expect(formData.get("unitPriceCents")).toBeNull();
  });

  it("suma la cantidad si el mismo producto se añade otra vez y quitar la línea recalcula el total", async () => {
    const user = userEvent.setup();
    render(<OrderForm customers={[customer]} products={[tarta]} pending={false} action={vi.fn()} state={{}} />);

    await addProduct(user, tarta.id, "2");
    await addProduct(user, tarta.id, "1");

    expect(screen.getAllByLabelText("Cantidad de Tarta")).toHaveLength(1);
    expect((screen.getByLabelText("Cantidad de Tarta") as HTMLInputElement).value).toBe("3");
    expect(screen.getByText("Total: 37,50 €")).toBeTruthy();

    await user.click(screen.getByRole("button", { name: "Quitar" }));

    expect(screen.queryByLabelText("Cantidad de Tarta")).toBeNull();
    expect(screen.getByText("Total: 0,00 €")).toBeTruthy();
  });

  it("no añade una línea con cantidad vacía, cero o decimal", async () => {
    const user = userEvent.setup();
    render(<OrderForm customers={[customer]} products={[tarta]} pending={false} action={vi.fn()} state={{}} />);

    await user.selectOptions(screen.getByLabelText("Producto"), tarta.id);
    await user.clear(screen.getByLabelText("Cantidad"));
    await user.type(screen.getByLabelText("Cantidad"), "0");
    await user.click(screen.getByRole("button", { name: "Añadir producto" }));

    expect(screen.getByRole("alert").textContent).toContain("La cantidad tiene que ser un entero mayor que cero.");
    expect(screen.queryByLabelText("Cantidad de Tarta")).toBeNull();

    await user.clear(screen.getByLabelText("Cantidad"));
    await user.type(screen.getByLabelText("Cantidad"), "1,5");
    await user.click(screen.getByRole("button", { name: "Añadir producto" }));

    expect(screen.queryByLabelText("Cantidad de Tarta")).toBeNull();
  });

  it("no envía una línea cuya cantidad deja de ser un entero mayor que cero", async () => {
    const user = userEvent.setup();
    const action = vi.fn();
    render(<OrderForm customers={[customer]} products={[tarta]} pending={false} action={action} state={{}} />);

    await addProduct(user, tarta.id, "2");
    await user.selectOptions(screen.getByLabelText("Cliente"), customer.id);
    await user.clear(screen.getByLabelText("Cantidad de Tarta"));
    await user.type(screen.getByLabelText("Cantidad de Tarta"), "1.5");
    await user.click(screen.getByRole("button", { name: "Crear pedido" }));

    expect(action).not.toHaveBeenCalled();
    expect(screen.getByRole("alert").textContent).toContain("La cantidad tiene que ser un entero mayor que cero.");
    expect(screen.getByText("Total: —")).toBeTruthy();
  });

  it("explica que faltan clientes o productos activos y no deja guardar", () => {
    const { rerender } = render(
      <OrderForm customers={[]} products={[tarta]} pending={false} action={vi.fn()} state={{}} />,
    );

    expect(screen.getByText(/Todavía no tienes clientes/).textContent).toContain("Ir a clientes");
    expect(screen.getByRole("link", { name: "Ir a clientes" }).getAttribute("href")).toBe("/customers");
    expect(screen.getByRole("button", { name: "Crear pedido" }).hasAttribute("disabled")).toBe(true);

    rerender(<OrderForm customers={[customer]} products={[]} pending={false} action={vi.fn()} state={{}} />);

    expect(screen.getByText(/No tienes productos activos/).textContent).toContain("Ir a productos");
    expect(screen.getByRole("link", { name: "Ir a productos" }).getAttribute("href")).toBe("/products");
    expect(screen.getByRole("button", { name: "Crear pedido" }).hasAttribute("disabled")).toBe(true);
  });

  it("muestra el error de guardado y el estado de espera", () => {
    const { rerender } = render(
      <OrderForm
        customers={[customer]}
        products={[tarta]}
        pending={false}
        action={vi.fn()}
        state={{ ok: false, message: "No se pudo guardar el pedido. Inténtalo de nuevo." }}
      />,
    );

    const alert = screen.getByRole("alert");
    expect(alert.textContent).toContain("No se pudo guardar el pedido. Inténtalo de nuevo.");
    expect(alert.className).toContain("text-destructive");

    rerender(
      <OrderForm customers={[customer]} products={[tarta]} pending={true} action={vi.fn()} state={{}} />,
    );

    expect(screen.getByRole("button", { name: "Creando pedido…" }).hasAttribute("disabled")).toBe(true);
  });

  it("anuncia el pedido creado", () => {
    render(
      <OrderForm
        customers={[customer]}
        products={[tarta]}
        pending={false}
        action={vi.fn()}
        state={{ ok: true, message: "Pedido creado. Total: 25,00 €." }}
      />,
    );

    const status = screen.getByRole("status");
    expect(status.textContent).toContain("Pedido creado. Total: 25,00 €.");
    expect(status.className).toContain("text-success");
  });
});

describe("CreateOrderForm", () => {
  it("ofrece el alta de un pedido", () => {
    render(<CreateOrderForm customers={[customer]} products={[tarta]} />);

    expect(screen.getByRole("heading", { name: "Datos del pedido" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Crear pedido" }).getAttribute("type")).toBe("submit");
  });
});
