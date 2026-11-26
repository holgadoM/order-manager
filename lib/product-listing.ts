import "server-only";

import { unstable_rethrow } from "next/navigation";

import { requireSessionUser } from "@/lib/auth";
import { toRowCount } from "@/lib/orders";
import {
  productReadMessage,
  toProducts,
  type ProductListResult,
} from "@/lib/products";
import { createClient } from "@/lib/supabase/server";

export type ActiveProductCountResult =
  | { ok: true; count: number }
  | { ok: false; message: string };

export async function countActiveProducts(): Promise<ActiveProductCountResult> {
  try {
    const user = await requireSessionUser();
    const supabase = await createClient();
    const { count, error } = await supabase
      .from("products")
      .select("id", { count: "exact", head: true })
      .eq("owner_id", user.id)
      .eq("active", true);

    if (error) {
      return { ok: false, message: productReadMessage() };
    }

    const activeCount = toRowCount(count);

    if (activeCount === null) {
      return { ok: false, message: productReadMessage() };
    }

    return { ok: true, count: activeCount };
  } catch (error) {
    unstable_rethrow(error);
    return { ok: false, message: productReadMessage() };
  }
}

export async function listProducts(): Promise<ProductListResult> {
  try {
    const user = await requireSessionUser();
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("products")
      .select("id, name, price_cents, active")
      .eq("owner_id", user.id)
      .order("name", { ascending: true });

    if (error) {
      return { ok: false, message: productReadMessage() };
    }

    const products = toProducts(data);

    if (!products) {
      return { ok: false, message: productReadMessage() };
    }

    return { ok: true, products };
  } catch (error) {
    unstable_rethrow(error);
    return { ok: false, message: productReadMessage() };
  }
}
