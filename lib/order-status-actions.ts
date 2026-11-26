"use server";

import { revalidatePath } from "next/cache";
import { unstable_rethrow } from "next/navigation";

import { requireSessionUser } from "@/lib/auth";
import {
  isOrderStatus,
  orderStatusWriteMessage,
  transitionOrderStatus,
} from "@/lib/orders";
import { createClient } from "@/lib/supabase/server";
import {
  updateOrderStatusSchema,
  updateOrderStatusValues,
  type OrderStatusFormState,
} from "@/lib/validation/orders";

function statusFailure(message: string): OrderStatusFormState {
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

function readCurrentStatus(value: unknown): string | null | undefined {
  if (typeof value !== "object" || value === null || !("data" in value) || !("error" in value)) {
    return undefined;
  }

  const result = value as { data: unknown; error: unknown };

  if (result.error !== null) {
    return undefined;
  }

  if (result.data === null) {
    return null;
  }

  if (typeof result.data !== "object" || result.data === null || !("status" in result.data)) {
    return undefined;
  }

  const status = result.data.status;

  return typeof status === "string" ? status : undefined;
}

function updatedOrderId(value: unknown): string | null | undefined {
  if (typeof value !== "object" || value === null || !("data" in value) || !("error" in value)) {
    return undefined;
  }

  const result = value as { data: unknown; error: unknown };

  if (result.error !== null) {
    return undefined;
  }

  if (result.data === null) {
    return null;
  }

  if (typeof result.data !== "object" || result.data === null || !("id" in result.data)) {
    return undefined;
  }

  return typeof result.data.id === "string" ? result.data.id : undefined;
}

export async function updateOrderStatus(
  _state: OrderStatusFormState,
  formData: FormData,
): Promise<OrderStatusFormState> {
  try {
    const user = await requireSessionUser();
    const parsed = updateOrderStatusSchema.safeParse(updateOrderStatusValues(formData));

    if (!parsed.success) {
      return statusFailure(parsed.error.issues[0]?.message ?? "Revisa el estado.");
    }

    const supabase = await createClient();
    const currentResult: unknown = await supabase
      .from("orders")
      .select("status")
      .eq("id", parsed.data.orderId)
      .eq("owner_id", user.id)
      .maybeSingle();
    const currentStatus = readCurrentStatus(currentResult);

    if (currentStatus === undefined) {
      return statusFailure(orderStatusWriteMessage(undefined));
    }

    if (currentStatus === null || !isOrderStatus(currentStatus)) {
      return statusFailure("No encontramos ese pedido.");
    }

    const decision = transitionOrderStatus(currentStatus, parsed.data.status);

    if (!decision.ok) {
      return statusFailure(decision.message);
    }

    const updateResult: unknown = await supabase
      .from("orders")
      .update({ status: decision.status })
      .eq("id", parsed.data.orderId)
      .eq("owner_id", user.id)
      .eq("status", currentStatus)
      .select("id")
      .maybeSingle();
    const updatedId = updatedOrderId(updateResult);

    if (updatedId === undefined) {
      const code = mutationErrorCode(updateResult);
      return statusFailure(orderStatusWriteMessage(code ? { code } : undefined));
    }

    if (updatedId === null) {
      return statusFailure("El pedido ya cambió de estado. Vuelve a intentarlo.");
    }

    revalidatePath("/orders");
    revalidatePath(`/orders/${parsed.data.orderId}`);
    return { ok: true, message: "Estado actualizado." };
  } catch (error) {
    unstable_rethrow(error);
    return statusFailure(orderStatusWriteMessage(error));
  }
}
