import { describe, expect, it } from "vitest";

import {
  createOrderFormValues,
  createOrderSchema,
  orderFieldErrors,
  type OrderCatalog,
} from "../../validation/orders";

const customerId = "6b1f3a4e-8c2d-4f5a-9b7e-1d2c3a4b5c6d";
const tartaId = "7c2e4b5f-9d3e-4a6b-8c7d-2e3f4a5b6c7d";
const cafeId = "8d3f5c60-ae4f-4b7c-9d8e-3f4a5b6c7d8e";
const inactiveId = "a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d";
const foreignCustomerId = "b2c3d4e5-f6a7-4b8c-9d0e-1f2a3b4c5d6e";

const catalog: OrderCatalog = {
  customerIds: [customerId],
  products: [
    { id: tartaId, name: "Tarta", priceCents: 1250, active: true },
    { id: cafeId, name: "Café", priceCents: 300, active: true },
    { id: inactiveId, name: "Galleta", priceCents: 400, active: false },
  ],
};

describe("createOrderSchema", () => {
  it("exige cliente propio y copia nombre y precio del producto activo", () => {
    const product = { id: tartaId, name: "Tarta", priceCents: 1250, active: true };
    const schema = createOrderSchema({
      customerIds: [customerId],
      products: [product, { id: cafeId, name: "Café", priceCents: 300, active: true }],
    });
    const parsed = schema.safeParse({
      customerId,
      notes: "  Sin azúcar  ",
      items: [
        { productId: tartaId, quantity: "2" },
        { productId: cafeId, quantity: "1" },
      ],
    });

    expect(parsed.success).toBe(true);
    if (!parsed.success) {
      return;
    }

    expect(parsed.data).toEqual({
      customerId,
      notes: "Sin azúcar",
      items: [
        { productId: tartaId, productName: "Tarta", quantity: 2, unitPriceCents: 1250 },
        { productId: cafeId, productName: "Café", quantity: 1, unitPriceCents: 300 },
      ],
    });

    product.name = "Tarta nueva";
    product.priceCents = 9999;
    const later = schema.safeParse({
      customerId,
      notes: "",
      items: [{ productId: tartaId, quantity: "1" }],
    });

    expect(parsed.data.items[0]).toEqual({
      productId: tartaId,
      productName: "Tarta",
      quantity: 2,
      unitPriceCents: 1250,
    });
    expect(later.success).toBe(true);
    if (later.success) {
      expect(later.data.items[0]).toEqual({
        productId: tartaId,
        productName: "Tarta nueva",
        quantity: 1,
        unitPriceCents: 9999,
      });
    }
  });

  it("deja la nota vacía en null", () => {
    const parsed = createOrderSchema(catalog).safeParse({
      customerId,
      notes: "   ",
      items: [{ productId: tartaId, quantity: "1" }],
    });

    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.notes).toBeNull();
    }
  });

  it("rechaza un pedido sin cliente, sin ítems o con cantidades que no son enteros mayores que cero", () => {
    const missing = createOrderSchema(catalog).safeParse({
      customerId: "",
      notes: "",
      items: [],
    });

    expect(missing.success).toBe(false);
    if (!missing.success) {
      expect(orderFieldErrors(missing.error)).toEqual({
        customerId: ["Elige un cliente."],
        items: ["Añade al menos un producto."],
      });
    }

    const badQuantity = createOrderSchema(catalog).safeParse({
      customerId,
      notes: "",
      items: [
        { productId: tartaId, quantity: "0" },
        { productId: cafeId, quantity: "1.5" },
        { productId: tartaId, quantity: "-2" },
      ],
    });

    expect(badQuantity.success).toBe(false);
    if (!badQuantity.success) {
      expect(orderFieldErrors(badQuantity.error)?.quantity).toEqual([
        "La cantidad tiene que ser un entero mayor que cero.",
      ]);
    }
  });

  it("rechaza un cliente ajeno y un producto inactivo o que no es propio", () => {
    const foreignCustomer = createOrderSchema(catalog).safeParse({
      customerId: foreignCustomerId,
      notes: "",
      items: [{ productId: tartaId, quantity: "1" }],
    });

    expect(foreignCustomer.success).toBe(false);
    if (!foreignCustomer.success) {
      expect(orderFieldErrors(foreignCustomer.error)?.customerId).toEqual(["El cliente tiene que ser tuyo."]);
    }

    const inactive = createOrderSchema(catalog).safeParse({
      customerId,
      notes: "",
      items: [{ productId: inactiveId, quantity: "1" }],
    });

    expect(inactive.success).toBe(false);
    if (!inactive.success) {
      expect(orderFieldErrors(inactive.error)?.productId).toEqual([
        "El producto tiene que estar activo y ser tuyo.",
      ]);
    }

    const foreignProduct = createOrderSchema(catalog).safeParse({
      customerId,
      notes: "",
      items: [{ productId: "c3d4e5f6-a7b8-4c9d-8e0f-1a2b3c4d5e6f", quantity: "1" }],
    });

    expect(foreignProduct.success).toBe(false);
    if (!foreignProduct.success) {
      expect(orderFieldErrors(foreignProduct.error)?.productId).toEqual([
        "El producto tiene que estar activo y ser tuyo.",
      ]);
    }
  });

  it("rechaza un total que no cabe en un entero", () => {
    const parsed = createOrderSchema({
      customerIds: [customerId],
      products: [{ id: tartaId, name: "Tarta", priceCents: 2_147_483_647, active: true }],
    }).safeParse({
      customerId,
      notes: "",
      items: [{ productId: tartaId, quantity: "2147483647" }],
    });

    expect(parsed.success).toBe(false);
    if (!parsed.success) {
      expect(orderFieldErrors(parsed.error)?.items).toEqual(["El total del pedido no cabe en un entero."]);
    }
  });
});

describe("createOrderFormValues", () => {
  it("lee cliente, nota y líneas en el orden del formulario", () => {
    const formData = new FormData();
    formData.set("customerId", customerId);
    formData.set("notes", "Por la tarde");
    formData.append("productId", tartaId);
    formData.append("quantity", "2");
    formData.append("productId", cafeId);
    formData.append("quantity", "1");
    formData.set("unitPriceCents", "1");

    expect(createOrderFormValues(formData)).toEqual({
      customerId,
      notes: "Por la tarde",
      items: [
        { productId: tartaId, quantity: "2" },
        { productId: cafeId, quantity: "1" },
      ],
    });
  });

  it("trata la nota ausente y un formulario sin líneas como vacíos", () => {
    const formData = new FormData();
    formData.set("customerId", customerId);

    expect(createOrderFormValues(formData)).toEqual({
      customerId,
      notes: "",
      items: [],
    });
  });
});
