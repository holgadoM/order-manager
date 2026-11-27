"use client";

import { createContext, useCallback, useContext, useState, type ReactNode } from "react";
import { Plus, X } from "lucide-react";

import { CreateCustomerForm } from "@/components/customers/customer-form";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

type CreateCustomerPanelContextValue = {
  openCreatePanel: () => void;
};

const CreateCustomerPanelContext = createContext<CreateCustomerPanelContextValue | null>(null);

export function useOpenCreateCustomerPanel() {
  return useContext(CreateCustomerPanelContext)?.openCreatePanel;
}

type CustomersPageShellProps = {
  children: ReactNode;
};

export function CustomersPageShell({ children }: CustomersPageShellProps) {
  const [open, setOpen] = useState(false);
  const openCreatePanel = useCallback(() => {
    setOpen(true);
  }, []);

  return (
    <CreateCustomerPanelContext.Provider value={{ openCreatePanel }}>
      <section className="flex flex-col gap-6">
        <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="flex flex-col gap-1.5">
            <h1 className="font-heading text-2xl font-semibold tracking-tight text-foreground">Clientes</h1>
            <p className="max-w-2xl text-sm text-muted-foreground">
              Guarda a quién le vendes. Solo ves los clientes de tu cuenta.
            </p>
          </div>
          <Button
            type="button"
            size="lg"
            className="w-full shrink-0 cursor-pointer gap-2 px-4 sm:w-auto"
            aria-expanded={open}
            aria-controls="create-customer-panel"
            onClick={() => setOpen((value) => !value)}
          >
            {open ? <X className="size-4" aria-hidden="true" /> : <Plus className="size-4" aria-hidden="true" />}
            <span>{open ? "Cerrar alta" : "Añadir cliente"}</span>
          </Button>
        </header>
        {open ? (
          <div id="create-customer-panel">
            <CreateCustomerForm />
          </div>
        ) : null}
        {children}
      </section>
    </CreateCustomerPanelContext.Provider>
  );
}

export function CustomersTableSkeleton() {
  return (
    <Card className="gap-0 overflow-hidden bg-card py-0" aria-busy="true" aria-label="Cargando clientes">
      <CardHeader className="border-b border-border px-4 py-4 sm:px-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-muted-foreground" role="status">
            Cargando clientes…
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
