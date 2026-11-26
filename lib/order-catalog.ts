import "server-only";

import { unstable_rethrow } from "next/navigation";

import { requireSessionUser } from "@/lib/auth";
import {
  orderReadMessage,
  toOrderCustomers,
  toOrderProducts,
  type OrderCatalogResult,
} from "@/lib/orders";
import { createClient } from "@/lib/supabase/server";

export async function listOrderCatalog(): Promise<OrderCatalogResult> {
  try {
    const user = await requireSessionUser();
    const supabase = await createClient();
    const [customersQuery, productsQuery] = await Promise.all([
      supabase.from("customers").select("id, name").eq("owner_id", user.id).order("name", { ascending: true }),
      supabase
        .from("products")
        .select("id, name, price_cents, active")
        .eq("owner_id", user.id)
        .order("name", { ascending: true }),
    ]);

    if (customersQuery.error || productsQuery.error) {
      return { ok: false, message: orderReadMessage() };
    }

    const customers = toOrderCustomers(customersQuery.data);
    const products = toOrderProducts(productsQuery.data);

    if (!customers || !products) {
      return { ok: false, message: orderReadMessage() };
    }

    return { ok: true, customers, products };
  } catch (error) {
    unstable_rethrow(error);
    return { ok: false, message: orderReadMessage() };
  }
}
