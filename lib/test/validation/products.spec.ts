import { describe, expect, it } from "vitest";

import {
  createProductFormValues,
  createProductSchema,
  productFieldErrors,
  updateProductFormValues,
  updateProductSchema,
} from "../../validation/products";

describe("createProductSchema", () => {
  it("guarda el precio en céntimos a partir de euros", () => {
    const parsed = createProductSchema.safeParse({
      name: "  Tarta de queso  ",
      priceEuros: "12,50",
    });

    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data).toEqual({ name: "Tarta de queso", priceCents: 1250 });
    }
  });

  it("rechaza un nombre vacío y un precio que no es mayor que cero", () => {
    const parsed = createProductSchema.safeParse({
      name: "   ",
      priceEuros: "0,00",
    });

    expect(parsed.success).toBe(false);
    if (!parsed.success) {
      expect(productFieldErrors(parsed.error)).toEqual({
        name: ["El nombre es obligatorio."],
        priceEuros: ["El precio debe ser mayor que cero, en euros y con hasta dos decimales."],
      });
    }
  });

  it("explica un precio vacío o que no es texto", () => {
    const empty = createProductSchema.safeParse({ name: "Tarta", priceEuros: "" });
    const missing = createProductSchema.safeParse({ name: null, priceEuros: null });

    expect(empty.success).toBe(false);
    if (!empty.success) {
      expect(productFieldErrors(empty.error)?.priceEuros).toEqual(["Introduce un precio."]);
    }

    expect(missing.success).toBe(false);
    if (!missing.success) {
      const errors = productFieldErrors(missing.error);
      expect(errors?.name?.[0]).toBe("Introduce un nombre.");
      expect(errors?.priceEuros?.[0]).toBe("Introduce un precio.");
    }
  });
});

describe("updateProductSchema", () => {
  it("acepta nombre, precio y si está activo", () => {
    const parsed = updateProductSchema.safeParse({
      id: "6b1f3a4e-8c2d-4f5a-9b7e-1d2c3a4b5c6d",
      name: "Brownie",
      priceEuros: "3.5",
      active: false,
    });

    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data).toEqual({
        id: "6b1f3a4e-8c2d-4f5a-9b7e-1d2c3a4b5c6d",
        name: "Brownie",
        priceCents: 350,
        active: false,
      });
    }
  });

  it("rechaza un identificador que no es uuid", () => {
    const parsed = updateProductSchema.safeParse({
      id: "producto",
      name: "Brownie",
      priceEuros: "3,50",
      active: true,
    });

    expect(parsed.success).toBe(false);
    if (!parsed.success) {
      expect(productFieldErrors(parsed.error)?.id?.[0]).toBe("El producto no es válido.");
    }
  });
});

describe("valores del formulario", () => {
  it("lee el alta y trata el producto inactivo cuando el checkbox no viaja", () => {
    const createData = new FormData();
    createData.set("name", "Tarta");
    createData.set("priceEuros", "4,00");

    expect(createProductFormValues(createData)).toEqual({
      name: "Tarta",
      priceEuros: "4,00",
    });

    const updateData = new FormData();
    updateData.set("id", "6b1f3a4e-8c2d-4f5a-9b7e-1d2c3a4b5c6d");
    updateData.set("name", "Tarta");
    updateData.set("priceEuros", "4");

    expect(updateProductFormValues(updateData).active).toBe(false);

    updateData.set("active", "true");
    expect(updateProductFormValues(updateData).active).toBe(true);
  });
});
