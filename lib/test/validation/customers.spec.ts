import { describe, expect, it } from "vitest";

import {
  createCustomerFormValues,
  createCustomerSchema,
  customerFieldErrors,
  updateCustomerFormValues,
  updateCustomerSchema,
} from "../../validation/customers";

describe("createCustomerSchema", () => {
  it("acepta el nombre y deja teléfono y notas vacíos", () => {
    const parsed = createCustomerSchema.safeParse({
      name: "  Ana Ruiz  ",
      phone: "   ",
      notes: "",
    });

    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data).toEqual({ name: "Ana Ruiz", phone: null, notes: null });
    }
  });

  it("conserva teléfono y notas cuando vienen rellenos", () => {
    const parsed = createCustomerSchema.safeParse({
      name: "Ana Ruiz",
      phone: " 612 000 111 ",
      notes: "  Recoger por la tarde. ",
    });

    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data).toEqual({
        name: "Ana Ruiz",
        phone: "612 000 111",
        notes: "Recoger por la tarde.",
      });
    }
  });

  it("rechaza un nombre vacío y explica el error", () => {
    const parsed = createCustomerSchema.safeParse({
      name: "   ",
      phone: "",
      notes: "",
    });

    expect(parsed.success).toBe(false);
    if (!parsed.success) {
      expect(customerFieldErrors(parsed.error)).toEqual({
        name: ["El nombre es obligatorio."],
      });
    }
  });

  it("explica un nombre que no es texto", () => {
    const parsed = createCustomerSchema.safeParse({
      name: null,
      phone: "",
      notes: "",
    });

    expect(parsed.success).toBe(false);
    if (!parsed.success) {
      expect(customerFieldErrors(parsed.error)?.name).toEqual(["Introduce un nombre."]);
    }
  });
});

describe("updateCustomerSchema", () => {
  it("acepta nombre, teléfono y notas del cliente", () => {
    const parsed = updateCustomerSchema.safeParse({
      id: "6b1f3a4e-8c2d-4f5a-9b7e-1d2c3a4b5c6d",
      name: "Ana Ruiz",
      phone: "",
      notes: "Sin gluten",
    });

    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data).toEqual({
        id: "6b1f3a4e-8c2d-4f5a-9b7e-1d2c3a4b5c6d",
        name: "Ana Ruiz",
        phone: null,
        notes: "Sin gluten",
      });
    }
  });

  it("rechaza un nombre vacío y un identificador que no es uuid", () => {
    const parsed = updateCustomerSchema.safeParse({
      id: "cliente",
      name: " ",
      phone: "",
      notes: "",
    });

    expect(parsed.success).toBe(false);
    if (!parsed.success) {
      const errors = customerFieldErrors(parsed.error);
      expect(errors?.name).toEqual(["El nombre es obligatorio."]);
      expect(errors?.id?.[0]).toBe("El cliente no es válido.");
    }
  });
});

describe("valores del formulario", () => {
  it("lee el alta y trata teléfono y notas ausentes como vacíos", () => {
    const createData = new FormData();
    createData.set("name", "Ana");

    expect(createCustomerFormValues(createData)).toEqual({
      name: "Ana",
      phone: "",
      notes: "",
    });

    const updateData = new FormData();
    updateData.set("id", "6b1f3a4e-8c2d-4f5a-9b7e-1d2c3a4b5c6d");
    updateData.set("name", "Ana");
    updateData.set("phone", "600");
    updateData.set("notes", "Nota");

    expect(updateCustomerFormValues(updateData)).toEqual({
      id: "6b1f3a4e-8c2d-4f5a-9b7e-1d2c3a4b5c6d",
      name: "Ana",
      phone: "600",
      notes: "Nota",
    });
  });
});
