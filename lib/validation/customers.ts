import { z } from "zod";

const NAME_MAX = 120;
const PHONE_MAX = 40;
const NOTES_MAX = 2000;

const nameSchema = z
  .string("Introduce un nombre.")
  .trim()
  .min(1, "El nombre es obligatorio.")
  .max(NAME_MAX, "El nombre es demasiado largo.");

const phoneSchema = z
  .string("El teléfono no es válido.")
  .trim()
  .max(PHONE_MAX, "El teléfono es demasiado largo.")
  .transform((value) => (value.length === 0 ? null : value));

const notesSchema = z
  .string("Las notas no son válidas.")
  .trim()
  .max(NOTES_MAX, "Las notas son demasiado largas.")
  .transform((value) => (value.length === 0 ? null : value));

export const createCustomerSchema = z.object({
  name: nameSchema,
  phone: phoneSchema,
  notes: notesSchema,
});

export const updateCustomerSchema = z.object({
  id: z.uuid({ error: "El cliente no es válido." }),
  name: nameSchema,
  phone: phoneSchema,
  notes: notesSchema,
});

export type CreateCustomerInput = z.input<typeof createCustomerSchema>;
export type UpdateCustomerInput = z.input<typeof updateCustomerSchema>;

export type CustomerField = "name" | "phone" | "notes" | "id";

export type CustomerFormState = {
  ok?: boolean;
  message?: string;
  errors?: Partial<Record<CustomerField, string[]>>;
};

export const initialCustomerFormState: CustomerFormState = {};

export function customerFieldErrors(error: z.ZodError): CustomerFormState["errors"] {
  const errors: Partial<Record<CustomerField, string[]>> = {};

  for (const issue of error.issues) {
    const field = issue.path[0];

    if (field !== "name" && field !== "phone" && field !== "notes" && field !== "id") {
      continue;
    }

    const current = errors[field] ?? [];
    current.push(issue.message);
    errors[field] = current;
  }

  return errors;
}

function textField(value: FormDataEntryValue | null): string {
  return typeof value === "string" ? value : "";
}

export function createCustomerFormValues(formData: FormData): {
  name: FormDataEntryValue | null;
  phone: string;
  notes: string;
} {
  return {
    name: formData.get("name"),
    phone: textField(formData.get("phone")),
    notes: textField(formData.get("notes")),
  };
}

export function updateCustomerFormValues(formData: FormData): {
  id: FormDataEntryValue | null;
  name: FormDataEntryValue | null;
  phone: string;
  notes: string;
} {
  return {
    id: formData.get("id"),
    name: formData.get("name"),
    phone: textField(formData.get("phone")),
    notes: textField(formData.get("notes")),
  };
}
