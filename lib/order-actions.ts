"use server";

import { revalidatePath } from "next/cache";
import { unstable_rethrow } from "next/navigation";

import { requireSessionUser } from "@/lib/auth";
import { listOrderCatalog } from "@/lib/order-catalog";
import { orderTotalCents, orderWriteMessage } from "@/lib/orders";
import { centsToEuros } from "@/lib/products";
import { createClient } from "@/lib/supabase/server";
import {
  createOrderFormValues,
  createOrderSchema,
  orderFieldErrors,
  type OrderFormState,
} from "@/lib/validation/orders";

function failure(message: string): OrderFormState {
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

function insertedId(value: unknown): string | null {
  if (typeof value !== "object" || value === null || !("data" in value)) {
    return null;
  }

  const data = value.data;

  if (typeof data !== "object" || data === null || !("id" in data) || typeof data.id !== "string") {
    return null;
  }

  return data.id;
}

export async function createOrder(
  _state: OrderFormState,
  formData: FormData,
): Promise<OrderFormState> {
  try {
    const user = await requireSessionUser();
    const catalog = await listOrderCatalog();

    if (!catalog.ok) {
      return failure(catalog.message);
    }

    const parsed = createOrderSchema({
      customerIds: catalog.customers.map((customer) => customer.id),
      products: catalog.products,
    }).safeParse(createOrderFormValues(formData));

    if (!parsed.success) {
      return { ok: false, errors: orderFieldErrors(parsed.error) };
    }

    let totalCents: number;

    try {
      totalCents = orderTotalCents(
        parsed.data.items.map((item) => ({
          quantity: item.quantity,
          unitPriceCents: item.unitPriceCents,
        })),
      );
    } catch (error) {
      unstable_rethrow(error);
      return failure("El total del pedido no cabe en un entero.");
    }

    const supabase = await createClient();
    const orderResult: unknown = await supabase
      .from("orders")
      .insert({
        owner_id: user.id,
        customer_id: parsed.data.customerId,
        status: "pendiente",
        notes: parsed.data.notes,
      })
      .select("id")
      .single();
    const orderError = mutationErrorCode(orderResult);

    if (orderError === undefined) {
      return failure(orderWriteMessage(undefined));
    }

    if (orderError !== null) {
      return failure(orderWriteMessage({ code: orderError }));
    }

    const orderId = insertedId(orderResult);

    if (!orderId) {
      return failure(orderWriteMessage(undefined));
    }

    const itemsResult: unknown = await supabase.from("order_items").insert(
      parsed.data.items.map((item) => ({
        order_id: orderId,
        product_id: item.productId,
        product_name: item.productName,
        quantity: item.quantity,
        unit_price_cents: item.unitPriceCents,
      })),
    );
    const itemsError = mutationErrorCode(itemsResult);

    if (itemsError === undefined || itemsError !== null) {
      await supabase.from("orders").delete().eq("id", orderId).eq("owner_id", user.id);
      return failure(orderWriteMessage(itemsError ? { code: itemsError } : undefined));
    }

    revalidatePath("/orders");
    revalidatePath("/orders/new");
    return { ok: true, message: `Pedido creado. Total: ${centsToEuros(totalCents)} €.` };
  } catch (error) {
    unstable_rethrow(error);
    return failure(orderWriteMessage(error));
  }
}
