import { AlertCircle } from "lucide-react";
import { Suspense } from "react";

import { CustomersPageShell, CustomersTableSkeleton } from "@/components/customers/customers-page-shell";
import { CustomersTable } from "@/components/customers/customers-table";
import { listCustomers } from "@/lib/customers";

export default function CustomersPage() {
  return (
    <CustomersPageShell>
      <Suspense fallback={<CustomersTableSkeleton />}>
        <CustomersCatalog />
      </Suspense>
    </CustomersPageShell>
  );
}

async function CustomersCatalog() {
  const result = await listCustomers();

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

  return <CustomersTable customers={result.customers} />;
}
