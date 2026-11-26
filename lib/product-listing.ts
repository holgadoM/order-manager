import "server-only";

import { unstable_rethrow } from "next/navigation";

import { requireSessionUser } from "@/lib/auth";
import {
  productReadMessage,
  toProducts,
  type ProductListResult,
} from "@/lib/products";
import { createClient } from "@/lib/supabase/server";

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
