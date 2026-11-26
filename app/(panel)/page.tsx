import { Suspense } from "react";

import { PanelSummary } from "@/components/summary/panel-summary";
import { getOrderStatusCounts } from "@/lib/order-listing";
import { countActiveProducts } from "@/lib/product-listing";

export default function PanelPage() {
  return (
    <section className="flex flex-col gap-6">
      <header className="flex flex-col gap-2">
        <h1 className="font-heading text-2xl font-semibold tracking-tight">Resumen</h1>
        <p className="max-w-2xl text-sm text-foreground/80">
          Consulta cuántos pedidos tienes en cada estado y los productos activos de tu cuenta.
        </p>
      </header>
      <Suspense fallback={<p className="text-sm text-muted-foreground">Cargando resumen…</p>}>
        <PanelSummaryContent />
      </Suspense>
    </section>
  );
}

async function PanelSummaryContent() {
  const [ordersResult, productsResult] = await Promise.all([
    getOrderStatusCounts(),
    countActiveProducts(),
  ]);

  return <PanelSummary ordersResult={ordersResult} productsResult={productsResult} />;
}
