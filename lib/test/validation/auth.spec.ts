import { describe, expect, it } from "vitest";

import { authFieldErrors, loginSchema, signupSchema } from "../../validation/auth";

describe("loginSchema", () => {
  it("acepta un correo y una contraseña", () => {
    const parsed = loginSchema.safeParse({
      email: "  ana@negocio.com  ",
      password: "secreto",
    });

    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.email).toBe("ana@negocio.com");
    }
  });

  it("rechaza un correo inválido y una contraseña vacía", () => {
    const parsed = loginSchema.safeParse({
      email: "ana",
      password: "",
    });

    expect(parsed.success).toBe(false);
    if (!parsed.success) {
      expect(authFieldErrors(parsed.error)).toEqual({
        email: ["Introduce un correo válido."],
        password: ["Introduce una contraseña."],
      });
    }
  });

  it("rechaza valores que no son texto", () => {
    const parsed = loginSchema.safeParse({
      email: null,
      password: null,
    });

    expect(parsed.success).toBe(false);
    if (!parsed.success) {
      const errors = authFieldErrors(parsed.error);
      expect(errors?.email?.[0]).toBe("Introduce un correo.");
      expect(errors?.password?.[0]).toBe("Introduce una contraseña.");
    }
  });
});

describe("signupSchema", () => {
  it("acepta un alta con contraseña de al menos 6 caracteres", () => {
    const parsed = signupSchema.safeParse({
      email: "ana@negocio.com",
      password: "123456",
    });

    expect(parsed.success).toBe(true);
  });

  it("rechaza una contraseña corta", () => {
    const parsed = signupSchema.safeParse({
      email: "ana@negocio.com",
      password: "12345",
    });

    expect(parsed.success).toBe(false);
    if (!parsed.success) {
      expect(authFieldErrors(parsed.error)?.password).toEqual([
        "La contraseña debe tener al menos 6 caracteres.",
      ]);
    }
  });
});
