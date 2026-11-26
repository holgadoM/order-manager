"use server";

import { revalidatePath } from "next/cache";
import { unstable_rethrow } from "next/navigation";

import { requireSessionUser } from "@/lib/auth";
import { customerWriteMessage } from "@/lib/customers";
import { createClient } from "@/lib/supabase/server";
import {
  createCustomerFormValues,
  createCustomerSchema,
  customerFieldErrors,
  updateCustomerFormValues,
  updateCustomerSchema,
  type CustomerFormState,
} from "@/lib/validation/customers";

function failure(message: string): CustomerFormState {
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

export async function createCustomer(
  _state: CustomerFormState,
  formData: FormData,
): Promise<CustomerFormState> {
  const parsed = createCustomerSchema.safeParse(createCustomerFormValues(formData));

  if (!parsed.success) {
    return { ok: false, errors: customerFieldErrors(parsed.error) };
  }

  try {
    const user = await requireSessionUser();
    const supabase = await createClient();
    const result: unknown = await supabase.from("customers").insert({
      owner_id: user.id,
      name: parsed.data.name,
      phone: parsed.data.phone,
      notes: parsed.data.notes,
    });
    const errorCode = mutationErrorCode(result);

    if (errorCode === undefined) {
      return failure(customerWriteMessage(undefined));
    }

    if (errorCode !== null) {
      return failure(customerWriteMessage({ code: errorCode }));
    }

    revalidatePath("/customers");
    return { ok: true, message: "Cliente creado." };
  } catch (error) {
    unstable_rethrow(error);
    return failure(customerWriteMessage(error));
  }
}

export async function updateCustomer(
  _state: CustomerFormState,
  formData: FormData,
): Promise<CustomerFormState> {
  const parsed = updateCustomerSchema.safeParse(updateCustomerFormValues(formData));

  if (!parsed.success) {
    return { ok: false, errors: customerFieldErrors(parsed.error) };
  }

  try {
    const user = await requireSessionUser();
    const supabase = await createClient();
    const result: unknown = await supabase
      .from("customers")
      .update({
        name: parsed.data.name,
        phone: parsed.data.phone,
        notes: parsed.data.notes,
      })
      .eq("id", parsed.data.id)
      .eq("owner_id", user.id)
      .select("id");
    const errorCode = mutationErrorCode(result);

    if (errorCode === undefined) {
      return failure(customerWriteMessage(undefined));
    }

    if (errorCode !== null) {
      return failure(customerWriteMessage({ code: errorCode }));
    }

    const ids = updatedIds(result);

    if (!ids || ids.length === 0) {
      return failure("No se encontró el cliente.");
    }

    revalidatePath("/customers");
    return { ok: true, message: "Cambios guardados." };
  } catch (error) {
    unstable_rethrow(error);
    return failure(customerWriteMessage(error));
  }
}
