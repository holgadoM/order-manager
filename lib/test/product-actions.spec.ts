import { beforeEach, describe, expect, it, vi } from "vitest";

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

const insert = vi.fn();
const update = vi.fn();

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(async () => ({
    from: (table: string) => {
      if (table !== "products") {
        throw new Error(`tabla inesperada: ${table}`);
      }

      return {
        insert,
        update: (values: unknown) => {
          update(values);
          return {
            eq: () => ({
              eq: () => ({
                select: async () => updateResult,
              }),
            }),
          };
        },
      };
    },
  })),
}));

import { revalidatePath } from "next/cache";

import { createProduct, updateProduct } from "../product-actions";

let updateResult: { data: { id: string }[] | null; error: { code?: string } | null } = {
  data: [{ id: "6b1f3a4e-8c2d-4f5a-9b7e-1d2c3a4b5c6d" }],
  error: null,
};

function formData(entries: Record<string, string>): FormData {
  const data = new FormData();

  for (const [key, value] of Object.entries(entries)) {
    data.set(key, value);
  }

  return data;
}

describe("createProduct", () => {
  beforeEach(() => {
    insert.mockReset();
    insert.mockResolvedValue({ error: null });
    vi.mocked(revalidatePath).mockClear();
  });

  it("no escribe si el nombre está vacío o el precio es inválido", async () => {
    const state = await createProduct(
      {},
      formData({ name: "   ", priceEuros: "0" }),
    );

    expect(state.ok).toBe(false);
    expect(state.errors?.name).toEqual(["El nombre es obligatorio."]);
    expect(state.errors?.priceEuros?.[0]).toContain("mayor que cero");
    expect(insert).not.toHaveBeenCalled();
  });

  it("guarda el precio en céntimos para el usuario autenticado", async () => {
    const state = await createProduct(
      {},
      formData({ name: "Tarta", priceEuros: "12,50" }),
    );

    expect(state).toEqual({ ok: true, message: "Producto creado." });
    expect(insert).toHaveBeenCalledWith({
      owner_id: "11111111-1111-4111-8111-111111111111",
      name: "Tarta",
      price_cents: 1250,
      active: true,
    });
    expect(revalidatePath).toHaveBeenCalledWith("/products");
  });

  it("muestra un fallo de Supabase sin lanzar", async () => {
    insert.mockResolvedValueOnce({ error: { code: "23514", message: "check" } });

    const state = await createProduct({}, formData({ name: "Tarta", priceEuros: "1" }));

    expect(state.ok).toBe(false);
    expect(state.message).toContain("precio");
  });

  it("muestra un fallo de red sin lanzar", async () => {
    insert.mockRejectedValueOnce(new Error("fetch failed"));

    const state = await createProduct({}, formData({ name: "Tarta", priceEuros: "1" }));

    expect(state.ok).toBe(false);
    expect(state.message).toBe("No se pudo guardar el producto. Inténtalo de nuevo.");
  });
});

describe("updateProduct", () => {
  beforeEach(() => {
    update.mockReset();
    updateResult = {
      data: [{ id: "6b1f3a4e-8c2d-4f5a-9b7e-1d2c3a4b5c6d" }],
      error: null,
    };
    vi.mocked(revalidatePath).mockClear();
  });

  it("no escribe si el precio es inválido", async () => {
    const state = await updateProduct(
      {},
      formData({
        id: "6b1f3a4e-8c2d-4f5a-9b7e-1d2c3a4b5c6d",
        name: "Tarta",
        priceEuros: "-3",
        active: "true",
      }),
    );

    expect(state.ok).toBe(false);
    expect(update).not.toHaveBeenCalled();
  });

  it("actualiza nombre, precio en céntimos y el estado activo", async () => {
    const state = await updateProduct(
      {},
      formData({
        id: "6b1f3a4e-8c2d-4f5a-9b7e-1d2c3a4b5c6d",
        name: "Tarta",
        priceEuros: "4,5",
      }),
    );

    expect(state).toEqual({ ok: true, message: "Cambios guardados." });
    expect(update).toHaveBeenCalledWith({
      name: "Tarta",
      price_cents: 450,
      active: false,
    });
  });
});
