"use client";

import { createContext, useCallback, useContext, useState, type ReactNode } from "react";
import { Plus, X } from "lucide-react";

import { CreateProductForm } from "@/components/products/product-form";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

type CreateProductPanelContextValue = {
  openCreatePanel: () => void;
};

const CreateProductPanelContext = createContext<CreateProductPanelContextValue | null>(null);

export function useOpenCreateProductPanel() {
  return useContext(CreateProductPanelContext)?.openCreatePanel;
}

type ProductsPageShellProps = {
  children: ReactNode;
};

export function ProductsPageShell({ children }: ProductsPageShellProps) {
  const [open, setOpen] = useState(false);
  const openCreatePanel = useCallback(() => {
    setOpen(true);
  }, []);

  return (
    <CreateProductPanelContext.Provider value={{ openCreatePanel }}>
      <section className="flex flex-col gap-6">
        <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="flex flex-col gap-1.5">
            <h1 className="font-heading text-2xl font-semibold tracking-tight text-foreground">Productos</h1>
            <p className="max-w-2xl text-sm text-muted-foreground">
              Catálogo de lo que vendes. El precio se escribe en euros y se guarda en céntimos.
            </p>
          </div>
          <Button
            type="button"
            size="lg"
            className="w-full shrink-0 cursor-pointer gap-2 px-4 sm:w-auto"
            aria-expanded={open}
            aria-controls="create-product-panel"
            onClick={() => setOpen((value) => !value)}
          >
            {open ? <X className="size-4" aria-hidden="true" /> : <Plus className="size-4" aria-hidden="true" />}
            <span>{open ? "Cerrar alta" : "Añadir producto"}</span>
          </Button>
        </header>
        {open ? (
          <div id="create-product-panel">
            <CreateProductForm />
          </div>
        ) : null}
        {children}
      </section>
    </CreateProductPanelContext.Provider>
  );
}

export function ProductsTableSkeleton() {
  return (
    <Card className="gap-0 overflow-hidden bg-card py-0" aria-busy="true" aria-label="Cargando productos">
      <CardHeader className="border-b border-border px-4 py-4 sm:px-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-muted-foreground" role="status">
            Cargando productos…
          </p>
          <div className="h-6 w-24 rounded-full bg-muted motion-safe:animate-pulse" aria-hidden="true" />
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
