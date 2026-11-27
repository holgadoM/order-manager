import { AlertCircle } from "lucide-react";
import { Suspense } from "react";

import { ProductsPageShell, ProductsTableSkeleton } from "@/components/products/products-page-shell";
import { ProductsTable } from "@/components/products/products-table";
import { listProducts } from "@/lib/product-listing";

export default function ProductsPage() {
  return (
    <ProductsPageShell>
      <Suspense fallback={<ProductsTableSkeleton />}>
        <ProductsCatalog />
      </Suspense>
    </ProductsPageShell>
  );
}

async function ProductsCatalog() {
  const result = await listProducts();

  if (!result.ok) {
    return (
      <div
        role="alert"
        className="flex items-start gap-3 rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive"
      >
        <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
        <p>{result.message}</p>
      </div>
    );
  }

  return <ProductsTable products={result.products} />;
}
