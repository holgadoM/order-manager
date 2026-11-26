import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function OrdersPage() {
  return (
    <section className="flex flex-col gap-4">
      <header className="flex flex-col gap-2">
        <h1 className="font-heading text-2xl font-semibold tracking-tight">Pedidos</h1>
        <p className="max-w-2xl text-sm text-foreground/80">
          Crea un pedido con un cliente y los productos que va a llevar.
        </p>
      </header>
      <Link href="/orders/new" className={cn(buttonVariants(), "h-9 w-fit cursor-pointer")}>
        Crear un pedido
      </Link>
      <p className="text-sm text-muted-foreground">Todavía no hay pedidos.</p>
    </section>
  );
}