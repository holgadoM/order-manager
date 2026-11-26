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
};

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(async () => ({
    from: () => query,
  })),
}));

import { requireSessionUser } from "../auth";
import { listProducts } from "../product-listing";

describe("listProducts", () => {
  beforeEach(() => {
    query.select.mockReset();
    query.eq.mockReset();
    query.order.mockReset();
    query.select.mockReturnValue(query);
    query.eq.mockReturnValue(query);
    query.order.mockResolvedValue({
      data: [{ id: "p1", name: "Tarta", price_cents: 1250, active: true }],
      error: null,
    });
  });

  it("pide solo las filas del usuario autenticado", async () => {
    const result = await listProducts();

    expect(query.select).toHaveBeenCalledWith("id, name, price_cents, active");
    expect(query.eq).toHaveBeenCalledWith("owner_id", "11111111-1111-4111-8111-111111111111");
    expect(result).toEqual({
      ok: true,
      products: [{ id: "p1", name: "Tarta", priceCents: 1250, active: true }],
    });
  });

  it("devuelve un mensaje si Supabase o la red fallan", async () => {
    query.order.mockResolvedValueOnce({ data: null, error: { message: "db down" } });

    await expect(listProducts()).resolves.toEqual({
      ok: false,
      message: "No se pudieron cargar los productos. Inténtalo de nuevo.",
    });

    query.order.mockRejectedValueOnce(new Error("fetch failed"));

    await expect(listProducts()).resolves.toEqual({
      ok: false,
      message: "No se pudieron cargar los productos. Inténtalo de nuevo.",
    });
    expect(requireSessionUser).toHaveBeenCalled();
  });
});
