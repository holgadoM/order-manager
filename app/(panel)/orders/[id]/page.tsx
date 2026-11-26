import Link from "next/link";
import { Suspense } from "react";

import { OrderDetailView } from "@/components/orders/order-detail";
import { getOrder } from "@/lib/order-listing";

export default function OrderPage({ params }: { params: Promise<{ id: string }> }) {
  return (
    <Suspense fallback={<p className="text-sm text-muted-foreground">Cargando pedido…</p>}>
      <OrderPageContent params={params} />
    </Suspense>
  );
}

async function OrderPageContent({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const result = await getOrder(id);

  return (
    <section className="flex flex-col gap-6">
      <Link
        href="/orders"
        className="w-fit cursor-pointer text-sm font-medium text-foreground underline-offset-4 transition-colors duration-200 hover:underline focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
      >
        Volver a pedidos
      </Link>
      {result.ok ? (
        <OrderDetailView order={result.order} />
      ) : (
        <div
          role={result.kind === "error" ? "alert" : undefined}
          className={
            result.kind === "error"
              ? "rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
              : "rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground"
          }
        >
          <p>{result.message}</p>
        </div>
      )}
    </section>
  );
}
