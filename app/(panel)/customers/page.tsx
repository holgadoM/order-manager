import { Suspense } from "react";

import { CreateCustomerForm } from "@/components/customers/customer-form";
import { CustomersTable } from "@/components/customers/customers-table";
import { listCustomers } from "@/lib/customers";

export default function CustomersPage() {
  return (
    <section className="flex flex-col gap-6">
      <header className="flex flex-col gap-2">
        <h1 className="font-heading text-2xl font-semibold tracking-tight">Clientes</h1>
        <p className="max-w-2xl text-sm text-foreground/80">
          Guarda a quién le vendes. Solo ves los clientes de tu cuenta.
        </p>
      </header>
      <Suspense fallback={<p className="text-sm text-muted-foreground">Cargando clientes…</p>}>
        <CustomersCatalog />
      </Suspense>
    </section>
  );
}

async function CustomersCatalog() {
  const result = await listCustomers();

  return (
    <div className="flex flex-col gap-6">
      <CreateCustomerForm />
      {result.ok ? (
        <CustomersTable customers={result.customers} />
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
