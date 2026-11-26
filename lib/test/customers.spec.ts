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
    from: (table: string) => {
      if (table !== "customers") {
        throw new Error(`tabla inesperada: ${table}`);
      }

      return query;
    },
  })),
}));

import { requireSessionUser } from "../auth";
import { customerWriteMessage, listCustomers, toCustomers } from "../customers";

describe("toCustomers", () => {
  it("normaliza teléfono y notas nulos", () => {
    expect(
      toCustomers([
        { id: "c1", name: "Ana", phone: null, notes: "Recoge por la tarde" },
        { id: "c2", name: "Luis", phone: "600111222", notes: null },
      ]),
    ).toEqual([
      { id: "c1", name: "Ana", phone: null, notes: "Recoge por la tarde" },
      { id: "c2", name: "Luis", phone: "600111222", notes: null },
    ]);
  });

  it("rechaza un nombre vacío o una fila incompleta", () => {
    expect(toCustomers([{ id: "c1", name: "  ", phone: null, notes: null }])).toBeNull();
    expect(toCustomers([{ id: "c1", name: "Ana", phone: 600, notes: null }])).toBeNull();
    expect(toCustomers("Ana")).toBeNull();
  });
});

describe("customerWriteMessage", () => {
  it("explica el rechazo del nombre vacío que impone la base", () => {
    expect(customerWriteMessage({ code: "23514" })).toBe("El nombre es obligatorio.");
  });
});

describe("listCustomers", () => {
  beforeEach(() => {
    query.select.mockReset();
    query.eq.mockReset();
    query.order.mockReset();
    query.select.mockReturnValue(query);
    query.eq.mockReturnValue(query);
    query.order.mockResolvedValue({
      data: [{ id: "c1", name: "Ana", phone: null, notes: null }],
      error: null,
    });
  });

  it("pide solo las filas del usuario autenticado", async () => {
    const result = await listCustomers();

    expect(query.select).toHaveBeenCalledWith("id, name, phone, notes");
    expect(query.eq).toHaveBeenCalledWith("owner_id", "11111111-1111-4111-8111-111111111111");
    expect(result).toEqual({
      ok: true,
      customers: [{ id: "c1", name: "Ana", phone: null, notes: null }],
    });
  });

  it("devuelve un mensaje si Supabase o la red fallan", async () => {
    query.order.mockResolvedValueOnce({ data: null, error: { message: "db down" } });

    await expect(listCustomers()).resolves.toEqual({
      ok: false,
      message: "No se pudieron cargar los clientes. Inténtalo de nuevo.",
    });

    query.order.mockRejectedValueOnce(new Error("fetch failed"));

    await expect(listCustomers()).resolves.toEqual({
      ok: false,
      message: "No se pudieron cargar los clientes. Inténtalo de nuevo.",
    });
    expect(requireSessionUser).toHaveBeenCalled();
  });
});
