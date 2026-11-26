import { z } from "zod";

const emailSchema = z
  .string("Introduce un correo.")
  .trim()
  .pipe(z.email("Introduce un correo válido."));

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string("Introduce una contraseña.").min(1, "Introduce una contraseña."),
});

export const signupSchema = z.object({
  email: emailSchema,
  password: z
    .string("Introduce una contraseña.")
    .min(6, "La contraseña debe tener al menos 6 caracteres."),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type SignupInput = z.infer<typeof signupSchema>;

export type AuthFormState = {
  ok?: boolean;
  errors?: {
    email?: string[];
    password?: string[];
  };
  message?: string;
};

export const initialAuthFormState: AuthFormState = {};

export function authFieldErrors(error: z.ZodError): AuthFormState["errors"] {
  const flattened = error.flatten().fieldErrors as {
    email?: string[];
    password?: string[];
  };

  return {
    email: flattened.email,
    password: flattened.password,
  };
}
