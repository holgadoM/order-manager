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

const insert = vi.fn();
const update = vi.fn();

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(async () => ({
    from: (table: string) => {
      if (table !== "customers") {
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

import { createCustomer, updateCustomer } from "../customer-actions";

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

describe("createCustomer", () => {
  beforeEach(() => {
    insert.mockReset();
    insert.mockResolvedValue({ error: null });
    vi.mocked(revalidatePath).mockClear();
  });

  it("no escribe si el nombre está vacío y explica el error", async () => {
    const state = await createCustomer({}, formData({ name: "   ", phone: "", notes: "" }));

    expect(state.ok).toBe(false);
    expect(state.errors?.name).toEqual(["El nombre es obligatorio."]);
    expect(insert).not.toHaveBeenCalled();
  });

  it("guarda teléfono y notas vacíos como nulos para el usuario autenticado", async () => {
    const state = await createCustomer({}, formData({ name: "Ana Ruiz" }));

    expect(state).toEqual({ ok: true, message: "Cliente creado." });
    expect(insert).toHaveBeenCalledWith({
      owner_id: "11111111-1111-4111-8111-111111111111",
      name: "Ana Ruiz",
      phone: null,
      notes: null,
    });
    expect(revalidatePath).toHaveBeenCalledWith("/customers");
  });

  it("muestra un fallo de Supabase sin lanzar", async () => {
    insert.mockResolvedValueOnce({ error: { code: "23514", message: "check" } });

    const state = await createCustomer({}, formData({ name: "Ana", phone: "600", notes: "Nota" }));

    expect(state.ok).toBe(false);
    expect(state.message).toBe("El nombre es obligatorio.");
  });

  it("muestra un fallo de red sin lanzar", async () => {
    insert.mockRejectedValueOnce(new Error("fetch failed"));

    const state = await createCustomer({}, formData({ name: "Ana" }));

    expect(state.ok).toBe(false);
    expect(state.message).toBe("No se pudo guardar el cliente. Inténtalo de nuevo.");
  });
});

describe("updateCustomer", () => {
  beforeEach(() => {
    update.mockReset();
    updateResult = {
      data: [{ id: "6b1f3a4e-8c2d-4f5a-9b7e-1d2c3a4b5c6d" }],
      error: null,
    };
    vi.mocked(revalidatePath).mockClear();
  });

  it("no escribe si el nombre está vacío", async () => {
    const state = await updateCustomer(
      {},
      formData({
        id: "6b1f3a4e-8c2d-4f5a-9b7e-1d2c3a4b5c6d",
        name: " ",
        phone: "600",
        notes: "",
      }),
    );

    expect(state.ok).toBe(false);
    expect(state.errors?.name).toEqual(["El nombre es obligatorio."]);
    expect(update).not.toHaveBeenCalled();
  });

  it("actualiza nombre, teléfono y notas", async () => {
    const state = await updateCustomer(
      {},
      formData({
        id: "6b1f3a4e-8c2d-4f5a-9b7e-1d2c3a4b5c6d",
        name: "Ana Ruiz",
        phone: "611 222 333",
        notes: "Prefiere por la mañana",
      }),
    );

    expect(state).toEqual({ ok: true, message: "Cambios guardados." });
    expect(update).toHaveBeenCalledWith({
      name: "Ana Ruiz",
      phone: "611 222 333",
      notes: "Prefiere por la mañana",
    });
    expect(revalidatePath).toHaveBeenCalledWith("/customers");
  });
});
