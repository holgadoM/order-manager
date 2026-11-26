// @vitest-environment jsdom

import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

import { OrderStatusControl, OrderStatusForm } from "../../orders/order-status-form";
import type { UpdateOrderStatusAction } from "@/lib/validation/orders";

const orderId = "9e4a6d71-bf50-4c8d-ae9f-4a5b6c7d8e9f";

afterEach(() => {
  cleanup();
});

describe("OrderStatusForm", () => {
  it("ofrece solo las transiciones de un pedido pendiente y envía la elegida", async () => {
    const user = userEvent.setup();
    const action = vi.fn();
    render(<OrderStatusForm orderId={orderId} status="pendiente" pending={false} action={action} state={{}} />);

    const select = screen.getByLabelText("Nuevo estado") as HTMLSelectElement;
    expect(Array.from(select.options).map((option) => option.value)).toEqual(["confirmado", "cancelado"]);

    await user.selectOptions(select, "cancelado");
    await user.click(screen.getByRole("button", { name: "Actualizar estado" }));

    expect(action).toHaveBeenCalledTimes(1);
    const formData = action.mock.calls[0]?.[0] as FormData;
    expect(formData.get("orderId")).toBe(orderId);
    expect(formData.get("status")).toBe("cancelado");
  });

  it("no envía una transición inválida y la explica", async () => {
    const user = userEvent.setup();
    const action = vi.fn();
    render(<OrderStatusForm orderId={orderId} status="pendiente" pending={false} action={action} state={{}} />);

    const select = screen.getByLabelText("Nuevo estado");
    const option = document.createElement("option");
    option.value = "entregado";
    option.text = "Entregado";
    select.append(option);
    await user.selectOptions(select, "entregado");
    await user.click(screen.getByRole("button", { name: "Actualizar estado" }));

    expect(action).not.toHaveBeenCalled();
    expect(screen.getByRole("alert").textContent).toContain("No se puede pasar de pendiente a entregado.");
  });

  it("muestra el rechazo del servidor sin ofrecer cambios en un pedido cerrado", () => {
    const { rerender } = render(
      <OrderStatusForm
        orderId={orderId}
        status="confirmado"
        pending={false}
        action={vi.fn()}
        state={{ ok: false, message: "No se puede pasar de confirmado a pendiente." }}
      />,
    );

    expect(screen.getByRole("alert").textContent).toContain("No se puede pasar de confirmado a pendiente.");
    expect((screen.getByLabelText("Nuevo estado") as HTMLSelectElement).getAttribute("aria-invalid")).toBe("true");

    rerender(<OrderStatusForm orderId={orderId} status="entregado" pending={false} action={vi.fn()} state={{}} />);

    expect(screen.getByText("Un pedido entregado no cambia de estado.")).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Actualizar estado" })).toBeNull();

    rerender(<OrderStatusForm orderId={orderId} status="cancelado" pending={false} action={vi.fn()} state={{}} />);

    expect(screen.getByText("Un pedido cancelado no cambia de estado.")).toBeTruthy();
  });
});

describe("OrderStatusControl", () => {
  it("monta el formulario de cambio de estado", () => {
    render(<OrderStatusControl orderId={orderId} status="confirmado" action={vi.fn()} />);

    expect(screen.getByRole("button", { name: "Actualizar estado" }).getAttribute("type")).toBe("submit");
    expect(Array.from((screen.getByLabelText("Nuevo estado") as HTMLSelectElement).options).map((option) => option.value)).toEqual([
      "entregado",
      "cancelado",
    ]);
  });

  it("envía una transición permitida por la acción recibida del servidor", async () => {
    const user = userEvent.setup();
    const updateStatus = vi.fn<UpdateOrderStatusAction>(async () => ({
      ok: true,
      message: "Estado actualizado.",
    }));

    render(<OrderStatusControl orderId={orderId} status="pendiente" action={updateStatus} />);

    await user.click(screen.getByRole("button", { name: "Actualizar estado" }));

    expect(updateStatus).toHaveBeenCalledTimes(1);
    const formData = updateStatus.mock.calls[0]?.[1];
    expect(formData).toBeInstanceOf(FormData);
    expect(formData?.get("orderId")).toBe(orderId);
    expect(formData?.get("status")).toBe("confirmado");
  });
});
