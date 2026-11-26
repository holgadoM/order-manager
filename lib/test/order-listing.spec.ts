import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

vi.mock("next/navigation", () => ({
  unstable_rethrow: () => undefined,
}));

vi.mock("@/lib/auth", () => ({
  requireSessionUser: vi.fn(async () => ({
    id: "11111111-1111-4111-8111-111111111111",
    email: "ana@negocio.com",
  })),
}));

const query = {
  select: vi.fn(),
  eq: vi.fn(),
  order: vi.fn(),
  maybeSingle: vi.fn(),
};

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(async () => ({
    from: () => query,
  })),
}));

import { createClient } from "../supabase/server";
import { getOrder, listOrders } from "../order-listing";

const ownerId = "11111111-1111-4111-8111-111111111111";
const orderId = "9e4a6d71-bf50-4c8d-ae9f-4a5b6c7d8e9f";

const summaryRow = {
  id: orderId,
  status: "pendiente",
  created_at: "2026-11-26T11:46:00.000Z",
  customers: { name: "Ana" },
  order_items: [{ quantity: 2, unit_price_cents: 1250 }],
};

describe("listOrders", () => {
  beforeEach(() => {
    query.select.mockReset();
    query.eq.mockReset();
    query.order.mockReset();
    query.maybeSingle.mockReset();
    query.select.mockReturnValue(query);
    query.eq.mockReturnValue(query);
    query.order.mockResolvedValue({ data: [summaryRow], error: null });
    vi.mocked(createClient).mockClear();
  });

  it("pide solo los pedidos del usuario y calcula el total", async () => {
    const result = await listOrders();

    expect(query.select).toHaveBeenCalledWith(
      "id, status, created_at, customers(name), order_items(quantity, unit_price_cents)",
    );
    expect(query.eq).toHaveBeenCalledWith("owner_id", ownerId);
    expect(query.order).toHaveBeenCalledWith("created_at", { ascending: false });
    expect(result).toEqual({
      ok: true,
      orders: [
        {
          id: orderId,
          customerName: "Ana",
          status: "pendiente",
          totalCents: 2500,
          createdAtLabel: "26/11/2026 12:46",
        },
      ],
    });
  });

  it("explica un fallo de lectura sin tumbar la página", async () => {
    query.order.mockResolvedValueOnce({ data: null, error: { message: "db down" } });

    await expect(listOrders()).resolves.toEqual({
      ok: false,
      message: "No se pudieron cargar los pedidos. Inténtalo de nuevo.",
    });

    query.order.mockRejectedValueOnce(new Error("fetch failed"));

    await expect(listOrders()).resolves.toEqual({
      ok: false,
      message: "No se pudieron cargar los pedidos. Inténtalo de nuevo.",
    });
  });
});

describe("getOrder", () => {
  beforeEach(() => {
    query.select.mockReset();
    query.eq.mockReset();
    query.maybeSingle.mockReset();
    query.select.mockReturnValue(query);
    query.eq.mockReturnValue(query);
    query.maybeSingle.mockResolvedValue({
      data: {
        ...summaryRow,
        notes: null,
        order_items: [{ id: "line-1", product_name: "Tarta", quantity: 2, unit_price_cents: 1250 }],
      },
      error: null,
    });
    vi.mocked(createClient).mockClear();
  });

  it("lee la ficha del pedido propio", async () => {
    const result = await getOrder(orderId);

    expect(query.eq).toHaveBeenCalledWith("id", orderId);
    expect(query.eq).toHaveBeenCalledWith("owner_id", ownerId);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.order.totalCents).toBe(2500);
      expect(result.order.items).toEqual([
        { id: "line-1", productName: "Tarta", quantity: 2, unitPriceCents: 1250 },
      ]);
    }
  });

  it("no consulta la base si el identificador no es un uuid", async () => {
    await expect(getOrder("no-es-un-pedido")).resolves.toEqual({
      ok: false,
      kind: "missing",
      message: "No encontramos ese pedido.",
    });
    expect(createClient).not.toHaveBeenCalled();
  });

  it("distingue un pedido ausente de un error de lectura", async () => {
    query.maybeSingle.mockResolvedValueOnce({ data: null, error: null });

    await expect(getOrder(orderId)).resolves.toEqual({
      ok: false,
      kind: "missing",
      message: "No encontramos ese pedido.",
    });

    query.maybeSingle.mockResolvedValueOnce({ data: null, error: { message: "db down" } });

    await expect(getOrder(orderId)).resolves.toEqual({
      ok: false,
      kind: "error",
      message: "No se pudieron cargar los pedidos. Inténtalo de nuevo.",
    });
  });
});
