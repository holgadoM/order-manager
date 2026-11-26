// @vitest-environment jsdom

import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/auth-actions", () => ({
  signIn: vi.fn(),
  signUp: vi.fn(),
}));

import { AuthForms, CredentialsForm } from "../../auth/auth-forms";

afterEach(() => {
  cleanup();
});

describe("CredentialsForm", () => {
  it("muestra el alta o el inicio de sesión y anuncia los errores", () => {
    const { rerender } = render(
      <CredentialsForm
        mode="login"
        pending={false}
        action={vi.fn()}
        state={{
          message: "Correo o contraseña incorrectos.",
          errors: {
            email: ["Introduce un correo válido."],
            password: ["Introduce una contraseña."],
          },
        }}
      />,
    );

    const submit = screen.getByRole("button", { name: "Iniciar sesión" });
    expect(submit.hasAttribute("disabled")).toBe(false);
    expect(screen.getByLabelText("Correo").getAttribute("aria-invalid")).toBe("true");
    expect(screen.getByLabelText("Contraseña").getAttribute("autocomplete")).toBe("current-password");
    const alert = screen.getByRole("alert");
    expect(alert.className).toContain("text-destructive");
    expect(alert.className).toContain("bg-destructive/10");
    expect(alert.textContent).toContain("Correo o contraseña incorrectos.");
    expect(alert.textContent).toContain("Introduce un correo válido.");
    expect(alert.textContent).toContain("Introduce una contraseña.");

    rerender(
      <CredentialsForm mode="signup" pending={true} action={vi.fn()} state={{}} />,
    );

    expect(screen.getByRole("button", { name: "Creando cuenta…" }).hasAttribute("disabled")).toBe(true);
    expect(screen.getByText("Mínimo 6 caracteres.")).toBeTruthy();
    expect(screen.getByLabelText("Contraseña").getAttribute("autocomplete")).toBe("new-password");
  });

  it("muestra el alta correcta en verde y el error de credenciales en rojo", () => {
    const successMessage = "Cuenta creada. Revisa tu correo para confirmarla antes de entrar.";
    const { rerender } = render(
      <CredentialsForm
        mode="signup"
        pending={false}
        action={vi.fn()}
        state={{ ok: true, message: successMessage }}
      />,
    );

    const success = screen.getByRole("status");
    expect(success.textContent).toContain(successMessage);
    expect(success.className).toContain("text-success");
    expect(success.className).toContain("border-success/30");
    expect(success.className).toContain("bg-success/10");
    expect(success.className.includes("text-destructive")).toBe(false);

    rerender(
      <CredentialsForm
        mode="signup"
        pending={false}
        action={vi.fn()}
        state={{ ok: false, message: "Ese correo ya tiene cuenta. Inicia sesión." }}
      />,
    );

    const error = screen.getByRole("alert");
    expect(error.textContent).toContain("Ese correo ya tiene cuenta. Inicia sesión.");
    expect(error.className).toContain("text-destructive");
    expect(error.className).toContain("border-destructive/30");
    expect(error.className).toContain("bg-destructive/10");
    expect(error.className.includes("text-success")).toBe(false);
  });
});

describe("AuthForms", () => {
  it("cambia entre iniciar sesión y crear cuenta", async () => {
    const user = userEvent.setup();
    render(<AuthForms />);

    expect(screen.getByRole("heading", { name: "Inicia sesión" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Iniciar sesión" }).getAttribute("type")).toBe("submit");

    await user.click(screen.getByRole("button", { name: "Crear una cuenta" }));

    expect(screen.getByRole("heading", { name: "Crea tu cuenta" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Crear cuenta" }).getAttribute("type")).toBe("submit");
    expect(screen.getByRole("button", { name: "Ya tengo cuenta" }).getAttribute("type")).toBe("button");
  });
});
