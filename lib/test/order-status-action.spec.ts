import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  unstable_rethrow: () => undefined,
}));

vi.mock("@/lib/auth", () => ({
  requireSessionUser: vi.fn(async () => ({
    id: "11111111-1111-4111-8111-111111111111",
    email: "ana@negocio.com",
  })),
}));

const ownerId = "11111111-1111-4111-8111-111111111111";
const orderId = "9e4a6d71-bf50-4c8d-ae9f-4a5b6c7d8e9f";

const updates: unknown[] = [];
const filters: [string, unknown][] = [];
let currentStatus: string | null = "pendiente";
let updateId: string | null = orderId;
let updateError: { code: string } | null = null;

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(async () => ({
    from(table: string) {
      if (table !== "orders") {
        throw new Error(`tabla inesperada: ${table}`);
      }

      const api = {
        select() {
          return api;
        },
        eq(column: string, value: unknown) {
          filters.push([column, value]);
          return api;
        },
        update(values: unknown) {
          updates.push(values);
          return api;
        },
        maybeSingle: async () => {
          if (updates.length === 0) {
            return {
              data: currentStatus === null ? null : { status: currentStatus },
              error: null,
            };
          }

          return {
            data: updateError || updateId === null ? null : { id: updateId },
            error: updateError,
          };
        },
      };

      return api;
    },
  })),
}));

import { revalidatePath } from "next/cache";

import { updateOrderStatus } from "../order-status-actions";

function form(status: string, id = orderId): FormData {
  const data = new FormData();
  data.set("orderId", id);
  data.set("status", status);
  return data;
}

describe("updateOrderStatus", () => {
  beforeEach(() => {
    updates.length = 0;
    filters.length = 0;
    currentStatus = "pendiente";
    updateId = orderId;
    updateError = null;
    vi.mocked(revalidatePath).mockClear();
  });

  it("persiste una transición permitida del pedido propio", async () => {
    const result = await updateOrderStatus({}, form("confirmado"));

    expect(result).toEqual({ ok: true, message: "Estado actualizado." });
    expect(updates).toEqual([{ status: "confirmado" }]);
    expect(filters).toEqual(
      expect.arrayContaining([
        ["id", orderId],
        ["owner_id", ownerId],
        ["status", "pendiente"],
      ]),
    );
    expect(revalidatePath).toHaveBeenCalledWith("/orders");
    expect(revalidatePath).toHaveBeenCalledWith(`/orders/${orderId}`);
  });

  it("no escribe una transición inválida y explica el motivo", async () => {
    const result = await updateOrderStatus({}, form("entregado"));

    expect(result).toEqual({
      ok: false,
      message: "No se puede pasar de pendiente a entregado.",
    });
    expect(updates).toEqual([]);
    expect(revalidatePath).not.toHaveBeenCalled();
  });

  it("no escribe si el pedido ya está entregado", async () => {
    currentStatus = "entregado";

    const result = await updateOrderStatus({}, form("cancelado"));

    expect(result.ok).toBe(false);
    expect(result.message).toMatch(/entregado no cambia de estado/);
    expect(updates).toEqual([]);
  });

  it("rechaza un identificador inválido antes de tocar la base", async () => {
    const result = await updateOrderStatus({}, form("confirmado", "pedido"));

    expect(result).toEqual({ ok: false, message: "El pedido no es válido." });
    expect(updates).toEqual([]);
    expect(filters).toEqual([]);
  });
});
