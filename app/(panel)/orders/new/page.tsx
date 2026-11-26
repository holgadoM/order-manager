import Link from "next/link";
import { Suspense } from "react";

import { CreateOrderForm } from "@/components/orders/order-form";
import { listOrderCatalog } from "@/lib/order-catalog";

export default function NewOrderPage() {
  return (
    <section className="flex flex-col gap-6">
      <header className="flex flex-col gap-2">
        <Link
          href="/orders"
          className="w-fit cursor-pointer text-sm font-medium text-foreground underline-offset-4 transition-colors duration-200 hover:underline focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
        >
          Volver a pedidos
        </Link>
        <h1 className="font-heading text-2xl font-semibold tracking-tight">Nuevo pedido</h1>
        <p className="max-w-2xl text-sm text-foreground/80">
          Elige un cliente tuyo y al menos un producto activo. Al guardar, cada línea conserva el nombre y el
          precio de ese momento.
        </p>
      </header>
      <Suspense fallback={<p className="text-sm text-muted-foreground">Cargando clientes y productos…</p>}>
        <NewOrderCatalog />
      </Suspense>
    </section>
  );
}

async function NewOrderCatalog() {
  const catalog = await listOrderCatalog();

  if (!catalog.ok) {
    return (
      <div
        role="alert"
        className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
      >
        <p>{catalog.message}</p>
      </div>
    );
  }

  const activeProducts = catalog.products.filter((product) => product.active);

  return <CreateOrderForm customers={catalog.customers} products={activeProducts} />;
}
