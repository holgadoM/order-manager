import "server-only";

import { unstable_rethrow } from "next/navigation";

import { requireSessionUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export type Customer = {
  id: string;
  name: string;
  phone: string | null;
  notes: string | null;
};

export type CustomerListResult =
  | { ok: true; customers: Customer[] }
  | { ok: false; message: string };

export function customerReadMessage(): string {
  return "No se pudieron cargar los clientes. Inténtalo de nuevo.";
}

export function customerWriteMessage(error: unknown): string {
  const code =
    typeof error === "object" && error !== null && "code" in error && typeof error.code === "string"
      ? error.code
      : "";

  if (code === "23514") {
    return "El nombre es obligatorio.";
  }

  return "No se pudo guardar el cliente. Inténtalo de nuevo.";
}

function readOptionalText(value: unknown): string | null | undefined {
  if (value === null) {
    return null;
  }

  if (typeof value === "string") {
    return value;
  }

  return undefined;
}

export function toCustomers(value: unknown): Customer[] | null {
  if (!Array.isArray(value)) {
    return null;
  }

  const customers: Customer[] = [];

  for (const item of value) {
    if (typeof item !== "object" || item === null) {
      return null;
    }

    const row = item as Record<string, unknown>;
    const phone = readOptionalText(row.phone);
    const notes = readOptionalText(row.notes);

    if (
      typeof row.id !== "string" ||
      typeof row.name !== "string" ||
      row.name.trim().length === 0 ||
      phone === undefined ||
      notes === undefined
    ) {
      return null;
    }

    customers.push({
      id: row.id,
      name: row.name,
      phone,
      notes,
    });
  }

  return customers;
}

export async function listCustomers(): Promise<CustomerListResult> {
  try {
    const user = await requireSessionUser();
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("customers")
      .select("id, name, phone, notes")
      .eq("owner_id", user.id)
      .order("name", { ascending: true });

    if (error) {
      return { ok: false, message: customerReadMessage() };
    }

    const customers = toCustomers(data);

    if (!customers) {
      return { ok: false, message: customerReadMessage() };
    }

    return { ok: true, customers };
  } catch (error) {
    unstable_rethrow(error);
    return { ok: false, message: customerReadMessage() };
  }
}
