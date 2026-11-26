import { Suspense } from "react";

import { CreateProductForm } from "@/components/products/product-form";
import { ProductsTable } from "@/components/products/products-table";
import { listProducts } from "@/lib/product-listing";

export default function ProductsPage() {
  return (
    <section className="flex flex-col gap-6">
      <header className="flex flex-col gap-2">
        <h1 className="font-heading text-2xl font-semibold tracking-tight">Productos</h1>
        <p className="max-w-2xl text-sm text-foreground/80">
          Da de alta lo que vendes. El formulario usa euros; la base guarda céntimos.
        </p>
      </header>
      <Suspense fallback={<p className="text-sm text-muted-foreground">Cargando productos…</p>}>
        <ProductsCatalog />
      </Suspense>
    </section>
  );
}

async function ProductsCatalog() {
  const result = await listProducts();

  return (
    <div className="flex flex-col gap-6">
      <CreateProductForm />
      {result.ok ? (
        <ProductsTable products={result.products} />
      ) : (
        <div
          role="alert"
          className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
        >
          <p>{result.message}</p>
        </div>
      )}
    </div>
  );
}
