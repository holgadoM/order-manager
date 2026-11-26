import Link from "next/link";
import { Plus } from "lucide-react";
import { Suspense } from "react";

import { OrdersTable } from "@/components/orders/orders-table";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { listOrders } from "@/lib/order-listing";
import { cn } from "@/lib/utils";

export default function OrdersPage() {
  return (
    <section className="flex flex-col gap-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex flex-col gap-1.5">
          <h1 className="font-heading text-2xl font-semibold tracking-tight text-foreground">Pedidos</h1>
          <p className="max-w-2xl text-sm text-muted-foreground">
            Consulta los pedidos de tu cuenta, filtra por estado y abre su ficha para gestionarlo.
          </p>
        </div>
        <Link
          href="/orders/new"
          className={cn(buttonVariants({ size: "lg" }), "w-full shrink-0 cursor-pointer gap-2 px-4 sm:w-auto")}
        >
          <Plus className="size-4" aria-hidden="true" />
          <span>Crear un pedido</span>
        </Link>
      </header>
      <Suspense fallback={<OrdersTableSkeleton />}>
        <OrdersCatalog />
      </Suspense>
    </section>
  );
}

function OrdersTableSkeleton() {
  return (
    <Card className="gap-0 overflow-hidden bg-card py-0" aria-busy="true" aria-label="Cargando pedidos">
      <CardHeader className="border-b border-border px-4 py-4 sm:px-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-muted-foreground" role="status">
            Cargando pedidos…
          </p>
          <div className="h-9 w-full rounded-lg bg-muted motion-safe:animate-pulse sm:w-48" aria-hidden="true" />
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-3 p-4 sm:p-5" aria-hidden="true">
        <div className="h-9 w-full rounded-md bg-muted/60 motion-safe:animate-pulse" />
        <div className="h-11 w-full rounded-md bg-muted/40 motion-safe:animate-pulse" />
        <div className="h-11 w-full rounded-md bg-muted/40 motion-safe:animate-pulse" />
      </CardContent>
    </Card>
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
