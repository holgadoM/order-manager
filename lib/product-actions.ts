"use server";

import { revalidatePath } from "next/cache";
import { unstable_rethrow } from "next/navigation";

import { requireSessionUser } from "@/lib/auth";
import { productWriteMessage } from "@/lib/products";
import { createClient } from "@/lib/supabase/server";
import {
  createProductFormValues,
  createProductSchema,
  productFieldErrors,
  updateProductFormValues,
  updateProductSchema,
  type ProductFormState,
} from "@/lib/validation/products";

function failure(message: string): ProductFormState {
  return { ok: false, message };
}

function mutationErrorCode(value: unknown): string | null | undefined {
  if (typeof value !== "object" || value === null || !("error" in value)) {
    return undefined;
  }

  const error = value.error;

  if (error === null) {
    return null;
  }

  if (typeof error === "object" && error !== null && "code" in error && typeof error.code === "string") {
    return error.code;
  }

  if (typeof error === "object" && error !== null) {
    return "";
  }

  return undefined;
}

function updatedIds(value: unknown): string[] | null {
  if (typeof value !== "object" || value === null || !("data" in value)) {
    return null;
  }

  const data = value.data;

  if (!Array.isArray(data)) {
    return null;
  }

  const ids: string[] = [];

  for (const item of data) {
    if (typeof item !== "object" || item === null || !("id" in item) || typeof item.id !== "string") {
      return null;
    }

    ids.push(item.id);
  }

  return ids;
}

export async function createProduct(
  _state: ProductFormState,
  formData: FormData,
): Promise<ProductFormState> {
  const parsed = createProductSchema.safeParse(createProductFormValues(formData));

  if (!parsed.success) {
    return { ok: false, errors: productFieldErrors(parsed.error) };
  }

  if (parsed.data.priceCents <= 0) {
    return {
      ok: false,
      errors: {
        priceEuros: ["El precio debe ser mayor que cero, en euros y con hasta dos decimales."],
      },
    };
  }

  try {
    const user = await requireSessionUser();
    const supabase = await createClient();
    const result: unknown = await supabase.from("products").insert({
      owner_id: user.id,
      name: parsed.data.name,
      price_cents: parsed.data.priceCents,
      active: true,
    });
    const errorCode = mutationErrorCode(result);

    if (errorCode === undefined) {
      return failure(productWriteMessage(undefined));
    }

    if (errorCode !== null) {
      return failure(productWriteMessage({ code: errorCode }));
    }

    revalidatePath("/products");
    return { ok: true, message: "Producto creado." };
  } catch (error) {
    unstable_rethrow(error);
    return failure(productWriteMessage(error));
  }
}

export async function updateProduct(
  _state: ProductFormState,
  formData: FormData,
): Promise<ProductFormState> {
  const parsed = updateProductSchema.safeParse(updateProductFormValues(formData));

  if (!parsed.success) {
    return { ok: false, errors: productFieldErrors(parsed.error) };
  }

  if (parsed.data.priceCents <= 0) {
    return {
      ok: false,
      errors: {
        priceEuros: ["El precio debe ser mayor que cero, en euros y con hasta dos decimales."],
      },
    };
  }

  try {
    const user = await requireSessionUser();
    const supabase = await createClient();
    const result: unknown = await supabase
      .from("products")
      .update({
        name: parsed.data.name,
        price_cents: parsed.data.priceCents,
        active: parsed.data.active,
      })
      .eq("id", parsed.data.id)
      .eq("owner_id", user.id)
      .select("id");
    const errorCode = mutationErrorCode(result);

    if (errorCode === undefined) {
      return failure(productWriteMessage(undefined));
    }

    if (errorCode !== null) {
      return failure(productWriteMessage({ code: errorCode }));
    }

    const ids = updatedIds(result);

    if (!ids || ids.length === 0) {
      return failure("No se encontró el producto.");
    }

    revalidatePath("/products");
    return { ok: true, message: "Cambios guardados." };
  } catch (error) {
    unstable_rethrow(error);
    return failure(productWriteMessage(error));
  }
}
