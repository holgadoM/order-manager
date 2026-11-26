import Link from "next/link";
import { Suspense } from "react";

import { OrdersTable } from "@/components/orders/orders-table";
import { buttonVariants } from "@/components/ui/button";
import { listOrders } from "@/lib/order-listing";
import { cn } from "@/lib/utils";

export default function OrdersPage() {
  return (
    <section className="flex flex-col gap-6">
      <header className="flex flex-col gap-2">
        <h1 className="font-heading text-2xl font-semibold tracking-tight">Pedidos</h1>
        <p className="max-w-2xl text-sm text-foreground/80">
          Consulta los pedidos de tu cuenta, filtra por estado y abre la ficha para cambiarlo.
        </p>
      </header>
      <Link href="/orders/new" className={cn(buttonVariants(), "h-9 w-fit cursor-pointer")}>
        Crear un pedido
      </Link>
      <Suspense fallback={<p className="text-sm text-muted-foreground">Cargando pedidos…</p>}>
        <OrdersCatalog />
      </Suspense>
    </section>
  );
}

async function OrdersCatalog() {
  const result = await listOrders();

  if (!result.ok) {
    return (
      <div
        role="alert"
        className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
      >
        <p>{result.message}</p>
      </div>
    );
  }

  return <OrdersTable orders={result.orders} />;
}
