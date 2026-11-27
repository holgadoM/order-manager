import Link from "next/link";
import { Plus } from "lucide-react";
import { Suspense } from "react";

import { PanelSummary, PanelSummarySkeleton } from "@/components/summary/panel-summary";
import { buttonVariants } from "@/components/ui/button";
import { getOrderStatusCounts } from "@/lib/order-listing";
import { countActiveProducts } from "@/lib/product-listing";
import { cn } from "@/lib/utils";

export default function PanelPage() {
  return (
    <section className="flex flex-col gap-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex flex-col gap-1.5">
          <h1 className="font-heading text-2xl font-semibold tracking-tight text-foreground">Resumen</h1>
          <p className="max-w-2xl text-sm text-muted-foreground">
            Consulta el estado de tus pedidos y tus productos activos de un vistazo.
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
      <Suspense fallback={<PanelSummarySkeleton />}>
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
