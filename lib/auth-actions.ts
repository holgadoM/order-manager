"use server";

import { redirect } from "next/navigation";
import type { AuthError } from "@supabase/supabase-js";

import { createClient } from "@/lib/supabase/server";
import {
  authFieldErrors,
  loginSchema,
  signupSchema,
  type AuthFormState,
} from "@/lib/validation/auth";

function credentialsFromForm(formData: FormData): {
  email: FormDataEntryValue | null;
  password: FormDataEntryValue | null;
} {
  return {
    email: formData.get("email"),
    password: formData.get("password"),
  };
}

function authErrorState(state: Omit<AuthFormState, "ok">): AuthFormState {
  return { ok: false, ...state };
}

function authFailureMessage(error: AuthError, intent: "login" | "signup"): string {
  switch (error.code) {
    case "invalid_credentials":
      return "Correo o contraseña incorrectos.";
    case "email_not_confirmed":
      return "Confirma el correo antes de iniciar sesión.";
    case "email_exists":
      return "Ese correo ya tiene cuenta. Inicia sesión.";
    case "email_address_invalid":
      return "Ese correo no es válido. Usa una dirección que pueda recibir mensajes.";
    case "weak_password":
      return "La contraseña debe tener al menos 6 caracteres.";
    case "over_request_rate_limit":
      return "Demasiados intentos. Espera un momento y vuelve a probar.";
    case "signup_disabled":
      return "El alta con correo está desactivada.";
    default:
      return intent === "login"
        ? "No se pudo iniciar sesión. Inténtalo de nuevo."
        : "No se pudo crear la cuenta. Inténtalo de nuevo.";
  }
}

export async function signIn(
  _state: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const parsed = loginSchema.safeParse(credentialsFromForm(formData));

  if (!parsed.success) {
    return authErrorState({ errors: authFieldErrors(parsed.error) });
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);

  if (error) {
    return authErrorState({ message: authFailureMessage(error, "login") });
  }

  redirect("/");
}

export async function signUp(
  _state: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const parsed = signupSchema.safeParse(credentialsFromForm(formData));

  if (!parsed.success) {
    return authErrorState({ errors: authFieldErrors(parsed.error) });
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp(parsed.data);

  if (error) {
    return authErrorState({ message: authFailureMessage(error, "signup") });
  }

  if (data.user && data.user.identities?.length === 0) {
    return authErrorState({ message: "Ese correo ya tiene cuenta. Inicia sesión." });
  }

  if (!data.session) {
    return {
      ok: true,
      message: "Cuenta creada. Revisa tu correo para confirmarla antes de entrar.",
    };
  }

  redirect("/");
}

export async function signOut(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
