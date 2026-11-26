import "server-only";

import { unstable_rethrow } from "next/navigation";
import { z } from "zod";

import { requireSessionUser } from "@/lib/auth";
import {
  SUMMARY_ORDER_STATUSES,
  orderListMessage,
  orderMissingMessage,
  toOrderDetail,
  toOrderSummaries,
  toRowCount,
  type OrderDetail,
  type OrderStatusCounts,
  type OrderSummary,
} from "@/lib/orders";
import { createClient } from "@/lib/supabase/server";

const LIST_COLUMNS = "id, status, created_at, customers(name), order_items(quantity, unit_price_cents)";
const DETAIL_COLUMNS =
  "id, status, notes, created_at, customers(name), order_items(id, product_name, quantity, unit_price_cents)";

export type OrderListResult = { ok: true; orders: OrderSummary[] } | { ok: false; message: string };

export type OrderStatusCountsResult =
  | { ok: true; counts: OrderStatusCounts }
  | { ok: false; message: string };

export type OrderDetailResult =
  | { ok: true; order: OrderDetail }
  | { ok: false; kind: "missing" | "error"; message: string };

export async function getOrderStatusCounts(): Promise<OrderStatusCountsResult> {
  try {
    const user = await requireSessionUser();
    const supabase = await createClient();
    const results = await Promise.all(
      SUMMARY_ORDER_STATUSES.map(async (status) => {
        const { count, error } = await supabase
          .from("orders")
          .select("id", { count: "exact", head: true })
          .eq("owner_id", user.id)
          .eq("status", status);

        return { status, count: error ? null : toRowCount(count) };
      }),
    );

    const counts: OrderStatusCounts = {
      pendiente: 0,
      confirmado: 0,
      entregado: 0,
    };

    for (const entry of results) {
      if (entry.count === null) {
        return { ok: false, message: orderListMessage() };
      }

      counts[entry.status] = entry.count;
    }

    return { ok: true, counts };
  } catch (error) {
    unstable_rethrow(error);
    return { ok: false, message: orderListMessage() };
  }
}

export async function listOrders(): Promise<OrderListResult> {
  try {
    const user = await requireSessionUser();
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("orders")
      .select(LIST_COLUMNS)
      .eq("owner_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      return { ok: false, message: orderListMessage() };
    }

    const orders = toOrderSummaries(data);

    if (!orders) {
      return { ok: false, message: orderListMessage() };
    }

    return { ok: true, orders };
  } catch (error) {
    unstable_rethrow(error);
    return { ok: false, message: orderListMessage() };
  }
}

export async function getOrder(id: string): Promise<OrderDetailResult> {
  try {
    const user = await requireSessionUser();

    if (!z.uuid().safeParse(id).success) {
      return { ok: false, kind: "missing", message: orderMissingMessage() };
    }

    const supabase = await createClient();
    const { data, error } = await supabase
      .from("orders")
      .select(DETAIL_COLUMNS)
      .eq("id", id)
      .eq("owner_id", user.id)
      .maybeSingle();

    if (error) {
      return { ok: false, kind: "error", message: orderListMessage() };
    }

    if (!data) {
      return { ok: false, kind: "missing", message: orderMissingMessage() };
    }

    const order = toOrderDetail(data);

    if (!order) {
      return { ok: false, kind: "error", message: orderListMessage() };
    }

    return { ok: true, order };
  } catch (error) {
    unstable_rethrow(error);
    return { ok: false, kind: "error", message: orderListMessage() };
  }
}
