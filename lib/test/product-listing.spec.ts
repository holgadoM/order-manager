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
import { countActiveProducts, listProducts } from "../product-listing";

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

describe("countActiveProducts", () => {
  beforeEach(() => {
    query.select.mockReset();
    query.eq.mockReset();
    query.order.mockReset();
  });

  it("cuenta solo productos activos del usuario autenticado", async () => {
    const eqCalls: [string, unknown][] = [];

    query.select.mockImplementation(() => {
      const chain = {
        eq(column: string, value: unknown) {
          eqCalls.push([column, value]);
          if (eqCalls.length < 2) {
            return chain;
          }

          return Promise.resolve({ count: 4, error: null });
        },
      };
      return chain;
    });

    await expect(countActiveProducts()).resolves.toEqual({ ok: true, count: 4 });
    expect(query.select).toHaveBeenCalledWith("id", { count: "exact", head: true });
    expect(eqCalls).toEqual([
      ["owner_id", "11111111-1111-4111-8111-111111111111"],
      ["active", true],
    ]);
  });

  it("devuelve cero cuando no hay productos activos", async () => {
    query.select.mockImplementation(() => ({
      eq: () => ({
        eq: async () => ({ count: 0, error: null }),
      }),
    }));

    await expect(countActiveProducts()).resolves.toEqual({ ok: true, count: 0 });
  });

  it("devuelve error si Supabase o la red fallan", async () => {
    query.select.mockImplementationOnce(() => ({
      eq: () => ({
        eq: async () => ({ count: null, error: { message: "db down" } }),
      }),
    }));

    await expect(countActiveProducts()).resolves.toEqual({
      ok: false,
      message: "No se pudieron cargar los productos. Inténtalo de nuevo.",
    });

    query.select.mockImplementationOnce(() => ({
      eq: () => ({
        eq: async () => {
          throw new Error("fetch failed");
        },
      }),
    }));

    await expect(countActiveProducts()).resolves.toEqual({
      ok: false,
      message: "No se pudieron cargar los productos. Inténtalo de nuevo.",
    });
  });
});
