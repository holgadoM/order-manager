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

const customerId = "6b1f3a4e-8c2d-4f5a-9b7e-1d2c3a4b5c6d";
const tartaId = "7c2e4b5f-9d3e-4a6b-8c7d-2e3f4a5b6c7d";
const inactiveId = "a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d";
const orderId = "9e4a6d71-bf50-4c8d-ae9f-4a5b6c7d8e9f";
const ownerId = "11111111-1111-4111-8111-111111111111";

const inserts: { table: string; values: unknown }[] = [];
const deletes: string[] = [];

let customers: Record<string, unknown>[] = [];
let products: Record<string, unknown>[] = [];
let catalogError: { code: string } | null = null;
let orderInsertError: { code: string } | null = null;
let itemsInsertError: { code: string } | null = null;

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(async () => ({
    from(table: string) {
      return {
        select() {
          return {
            eq() {
              return {
                order: async () => {
                  if (catalogError) {
                    return { data: null, error: catalogError };
                  }

                  if (table === "customers") {
                    return { data: customers, error: null };
                  }

                  if (table === "products") {
                    return { data: products, error: null };
                  }

                  return { data: null, error: { code: "XX" } };
                },
              };
            },
          };
        },
        insert(values: unknown) {
          inserts.push({ table, values });

          if (table === "orders") {
            return {
              select() {
                return {
                  single: async () => ({
                    data: orderInsertError ? null : { id: orderId },
                    error: orderInsertError,
                  }),
                };
              },
            };
          }

          return Promise.resolve({ error: itemsInsertError });
        },
        delete() {
          return {
            eq() {
              return {
                eq: async () => {
                  deletes.push(table);
                  return { error: null };
                },
              };
            },
          };
        },
      };
    },
  })),
}));

import { revalidatePath } from "next/cache";

import { createOrder } from "../order-actions";

function orderForm(items: { productId: string; quantity: string }[], notes = ""): FormData {
  const data = new FormData();
  data.set("customerId", customerId);
  data.set("notes", notes);
  data.set("unitPriceCents", "1");
  data.set("productName", "Precio manipulado");

  for (const item of items) {
    data.append("productId", item.productId);
    data.append("quantity", item.quantity);
  }

  return data;
}

describe("createOrder", () => {
  beforeEach(() => {
    inserts.length = 0;
    deletes.length = 0;
    catalogError = null;
    orderInsertError = null;
    itemsInsertError = null;
    customers = [{ id: customerId, name: "Ana Ruiz" }];
    products = [
      { id: tartaId, name: "Tarta", price_cents: 1250, active: true },
      { id: inactiveId, name: "Galleta", price_cents: 400, active: false },
    ];
    vi.mocked(revalidatePath).mockClear();
  });

  it("guarda el pedido en pendiente y copia nombre y precio del producto en ese momento", async () => {
    const created = await createOrder({}, orderForm([{ productId: tartaId, quantity: "2" }], "  Sin azúcar  "));

    expect(created).toEqual({ ok: true, message: "Pedido creado. Total: 25,00 €." });
    expect(inserts).toEqual([
      {
        table: "orders",
        values: {
          owner_id: ownerId,
          customer_id: customerId,
          status: "pendiente",
          notes: "Sin azúcar",
        },
      },
      {
        table: "order_items",
        values: [
          {
            order_id: orderId,
            product_id: tartaId,
            product_name: "Tarta",
            quantity: 2,
            unit_price_cents: 1250,
          },
        ],
      },
    ]);
    expect(deletes).toEqual([]);
    expect(vi.mocked(revalidatePath).mock.calls).toEqual([["/orders"], ["/orders/new"]]);

    const tarta = products[0];
    if (!tarta) {
      throw new Error("Falta el producto del catálogo.");
    }
    tarta.name = "Tarta nueva";
    tarta.price_cents = 9999;

    inserts.length = 0;
    const later = await createOrder({}, orderForm([{ productId: tartaId, quantity: "1" }]));

    expect(later.ok).toBe(true);
    expect(inserts[1]?.values).toEqual([
      {
        order_id: orderId,
        product_id: tartaId,
        product_name: "Tarta nueva",
        quantity: 1,
        unit_price_cents: 9999,
      },
    ]);
  });

  it("no escribe sin cliente, sin ítems o con un producto inactivo o ajeno", async () => {
    const withoutItems = await createOrder({}, orderForm([]));
    expect(withoutItems.ok).toBe(false);
    expect(withoutItems.errors?.items).toEqual(["Añade al menos un producto."]);

    const inactive = await createOrder({}, orderForm([{ productId: inactiveId, quantity: "1" }]));
    expect(inactive.ok).toBe(false);
    expect(inactive.errors?.productId).toEqual(["El producto tiene que estar activo y ser tuyo."]);

    const foreign = await createOrder(
      {},
      orderForm([{ productId: "c3d4e5f6-a7b8-4c9d-8e0f-1a2b3c4d5e6f", quantity: "1" }]),
    );
    expect(foreign.ok).toBe(false);
    expect(foreign.errors?.productId).toEqual(["El producto tiene que estar activo y ser tuyo."]);

    const data = new FormData();
    data.set("customerId", "b2c3d4e5-f6a7-4b8c-9d0e-1f2a3b4c5d6e");
    data.set("notes", "");
    data.append("productId", tartaId);
    data.append("quantity", "1");
    const otherCustomer = await createOrder({}, data);
    expect(otherCustomer.ok).toBe(false);
    expect(otherCustomer.errors?.customerId).toEqual(["El cliente tiene que ser tuyo."]);

    const missingCustomer = new FormData();
    missingCustomer.set("notes", "");
    missingCustomer.append("productId", tartaId);
    missingCustomer.append("quantity", "1");
    const noCustomer = await createOrder({}, missingCustomer);
    expect(noCustomer.ok).toBe(false);
    expect(noCustomer.errors?.customerId).toEqual(["Elige un cliente."]);

    expect(inserts).toEqual([]);
  });

  it("no deja un pedido vacío si los ítems no se pueden guardar", async () => {
    itemsInsertError = { code: "23514" };
    const result = await createOrder({}, orderForm([{ productId: tartaId, quantity: "1" }]));

    expect(result.ok).toBe(false);
    expect(result.message).toMatch(/Revisa el cliente/);
    expect(deletes).toEqual(["orders"]);
    expect(vi.mocked(revalidatePath)).not.toHaveBeenCalled();
  });

  it("no crea ítems si el pedido no se puede guardar", async () => {
    orderInsertError = { code: "23503" };
    const result = await createOrder({}, orderForm([{ productId: tartaId, quantity: "1" }]));

    expect(result.ok).toBe(false);
    expect(result.message).toMatch(/ya no está disponible/);
    expect(inserts.map((insert) => insert.table)).toEqual(["orders"]);
    expect(deletes).toEqual([]);
  });

  it("explica un fallo al cargar el catálogo y no escribe", async () => {
    catalogError = { code: "XX" };
    const result = await createOrder({}, orderForm([{ productId: tartaId, quantity: "1" }]));

    expect(result).toEqual({
      ok: false,
      message: "No se pudieron cargar los clientes o los productos. Inténtalo de nuevo.",
    });
    expect(inserts).toEqual([]);
  });
});
