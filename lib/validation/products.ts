import { z } from "zod";

import { eurosToCents } from "@/lib/products";

const NAME_MAX = 120;

const nameSchema = z
  .string("Introduce un nombre.")
  .trim()
  .min(1, "El nombre es obligatorio.")
  .max(NAME_MAX, "El nombre es demasiado largo.");

const priceEurosSchema = z.string("Introduce un precio.");

function refinePrice(priceEuros: string, ctx: z.RefinementCtx): void {
  const trimmed = priceEuros.trim();

  if (!trimmed) {
    ctx.addIssue({
      code: "custom",
      path: ["priceEuros"],
      message: "Introduce un precio.",
    });
    return;
  }

  if (eurosToCents(trimmed) === null) {
    ctx.addIssue({
      code: "custom",
      path: ["priceEuros"],
      message: "El precio debe ser mayor que cero, en euros y con hasta dos decimales.",
    });
  }
}

export const createProductSchema = z
  .object({
    name: nameSchema,
    priceEuros: priceEurosSchema,
  })
  .superRefine((data, ctx) => {
    refinePrice(data.priceEuros, ctx);
  })
  .transform((data) => ({
    name: data.name,
    priceCents: eurosToCents(data.priceEuros.trim()) ?? 0,
  }));

export const updateProductSchema = z
  .object({
    id: z.uuid({ error: "El producto no es válido." }),
    name: nameSchema,
    priceEuros: priceEurosSchema,
    active: z.boolean("Indica si el producto está activo."),
  })
  .superRefine((data, ctx) => {
    refinePrice(data.priceEuros, ctx);
  })
  .transform((data) => ({
    id: data.id,
    name: data.name,
    priceCents: eurosToCents(data.priceEuros.trim()) ?? 0,
    active: data.active,
  }));

export type CreateProductInput = z.input<typeof createProductSchema>;
export type UpdateProductInput = z.input<typeof updateProductSchema>;

export type ProductField = "name" | "priceEuros" | "active" | "id";

export type ProductFormState = {
  ok?: boolean;
  message?: string;
  errors?: Partial<Record<ProductField, string[]>>;
};

export const initialProductFormState: ProductFormState = {};

export function productFieldErrors(error: z.ZodError): ProductFormState["errors"] {
  const errors: Partial<Record<ProductField, string[]>> = {};

  for (const issue of error.issues) {
    const field = issue.path[0];

    if (field !== "name" && field !== "priceEuros" && field !== "active" && field !== "id") {
      continue;
    }

    const current = errors[field] ?? [];
    current.push(issue.message);
    errors[field] = current;
  }

  return errors;
}

export function createProductFormValues(formData: FormData): {
  name: FormDataEntryValue | null;
  priceEuros: FormDataEntryValue | null;
} {
  return {
    name: formData.get("name"),
    priceEuros: formData.get("priceEuros"),
  };
}

export function updateProductFormValues(formData: FormData): {
  id: FormDataEntryValue | null;
  name: FormDataEntryValue | null;
  priceEuros: FormDataEntryValue | null;
  active: boolean;
} {
  return {
    id: formData.get("id"),
    name: formData.get("name"),
    priceEuros: formData.get("priceEuros"),
    active: formData.get("active") === "true",
  };
}
