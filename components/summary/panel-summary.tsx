import Link from "next/link";
import { CheckCircle2, ClipboardList, Clock, Package, PackageCheck, Plus, ShoppingBag, Users } from "lucide-react";

import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { OrderStatusCountsResult } from "@/lib/order-listing";
import type { ActiveProductCountResult } from "@/lib/product-listing";
import { cn } from "@/lib/utils";

type PanelSummaryProps = {
  ordersResult: OrderStatusCountsResult;
  productsResult: ActiveProductCountResult;
};

type MetricCard = {
  id: string;
  label: string;
  value: number | null;
  helper: string;
  icon: typeof Clock;
  iconClassName: string;
};

export function PanelSummary({ ordersResult, productsResult }: PanelSummaryProps) {
  const errorMessages: string[] = [];

  if (!ordersResult.ok) {
    errorMessages.push(ordersResult.message);
  }

  if (!productsResult.ok) {
    errorMessages.push(productsResult.message);
  }

  const metrics: MetricCard[] = [
    {
      id: "pendiente",
      label: "Pedidos pendientes",
      value: ordersResult.ok ? ordersResult.counts.pendiente : null,
      helper: "Por confirmar",
      icon: Clock,
      iconClassName: "text-primary",
    },
    {
      id: "confirmado",
      label: "Pedidos confirmados",
      value: ordersResult.ok ? ordersResult.counts.confirmado : null,
      helper: "En preparación",
      icon: CheckCircle2,
      iconClassName: "text-primary",
    },
    {
      id: "entregado",
      label: "Pedidos entregados",
      value: ordersResult.ok ? ordersResult.counts.entregado : null,
      helper: "Completados",
      icon: PackageCheck,
      iconClassName: "text-success",
    },
    {
      id: "productos-activos",
      label: "Productos activos",
      value: productsResult.ok ? productsResult.count : null,
      helper: "Disponibles para pedir",
      icon: ShoppingBag,
      iconClassName: "text-primary",
    },
  ];

  const allCountsLoaded = ordersResult.ok && productsResult.ok;
  const orderCountSum = ordersResult.ok
    ? ordersResult.counts.pendiente + ordersResult.counts.confirmado + ordersResult.counts.entregado
    : 0;
  const activeProducts = productsResult.ok ? productsResult.count : 0;
  const isCompletelyEmpty = allCountsLoaded && orderCountSum === 0 && activeProducts === 0;

  return (
    <div className="flex flex-col gap-6">
      {errorMessages.length > 0 ? (
        <div
          role="alert"
          className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
        >
          {errorMessages.map((message) => (
            <p key={message}>{message}</p>
          ))}
        </div>
      ) : null}

      <section aria-labelledby="summary-metrics-heading">
        <h2 id="summary-metrics-heading" className="sr-only">
          Conteos principales
        </h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {metrics.map((metric) => {
            const Icon = metric.icon;

            return (
              <Card key={metric.id} className="bg-card">
                <CardHeader className="flex flex-row items-center justify-between gap-2 pb-1">
                  <CardTitle>
                    <h3 className="font-heading text-sm font-medium text-foreground/80">{metric.label}</h3>
                  </CardTitle>
                  <Icon className={cn("size-5 shrink-0", metric.iconClassName)} aria-hidden="true" />
                </CardHeader>
                <CardContent className="flex flex-col gap-1">
                  <p
                    className="font-heading text-3xl font-semibold tracking-tight tabular-nums text-foreground"
                    aria-label={
                      metric.value === null
                        ? `${metric.label}: no disponible`
                        : `${metric.label}: ${metric.value}`
                    }
                  >
                    {metric.value === null ? "—" : metric.value}
                  </p>
                  <p className="text-xs text-muted-foreground">{metric.helper}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </section>

      {isCompletelyEmpty ? (
        <Card className="bg-card">
          <CardHeader>
            <CardTitle>
              <h2 className="font-heading text-lg font-semibold">Empieza a organizar tus pedidos</h2>
            </CardTitle>
            <CardDescription className="text-sm text-foreground/80">
              Todavía no tienes pedidos ni productos activos. Prepara tu catálogo y registra tu primer pedido en
              tres pasos:
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <ol className="grid grid-cols-1 gap-3 text-sm text-foreground/80 md:grid-cols-3">
              <li className="rounded-lg border border-border bg-muted/40 p-3">
                <p className="font-medium text-foreground">1. Crea tus productos</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Añade lo que vendes con su precio en euros y déjalo activo.
                </p>
              </li>
              <li className="rounded-lg border border-border bg-muted/40 p-3">
                <p className="font-medium text-foreground">2. Guarda tus clientes</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Registra a quién le vendes para seleccionarlo rápido al crear pedidos.
                </p>
              </li>
              <li className="rounded-lg border border-border bg-muted/40 p-3">
                <p className="font-medium text-foreground">3. Crea tu primer pedido</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Combina cliente y productos activos y sigue su estado hasta la entrega.
                </p>
              </li>
            </ol>
            <div className="flex flex-wrap gap-2">
              <Link href="/products" className={cn(buttonVariants(), "cursor-pointer")}>
                <Package aria-hidden="true" />
                Añadir productos
              </Link>
              <Link href="/customers" className={cn(buttonVariants({ variant: "outline" }), "cursor-pointer")}>
                <Users aria-hidden="true" />
                Añadir clientes
              </Link>
              <Link href="/orders/new" className={cn(buttonVariants({ variant: "outline" }), "cursor-pointer")}>
                <Plus aria-hidden="true" />
                Crear un pedido
              </Link>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="bg-card">
          <CardHeader>
            <CardTitle>
              <h2 className="font-heading text-lg font-semibold">Accesos rápidos</h2>
            </CardTitle>
            <CardDescription className="text-sm text-foreground/80">
              {productsResult.ok && productsResult.count === 0
                ? "No tienes productos activos. Activa o crea al menos uno para poder añadirlo a nuevos pedidos."
                : ordersResult.ok && orderCountSum === 0
                  ? "Ya tienes productos activos. Puedes registrar tu primer pedido o revisar tus clientes."
                  : "Gestiona nuevos pedidos, actualiza estados y mantén al día tu catálogo."}
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            <Link href="/orders/new" className={cn(buttonVariants(), "cursor-pointer")}>
              <Plus aria-hidden="true" />
              Crear un pedido
            </Link>
            <Link href="/orders" className={cn(buttonVariants({ variant: "outline" }), "cursor-pointer")}>
              <ClipboardList aria-hidden="true" />
              Ver pedidos
            </Link>
            <Link href="/products" className={cn(buttonVariants({ variant: "outline" }), "cursor-pointer")}>
              <Package aria-hidden="true" />
              Gestionar productos
            </Link>
            <Link href="/customers" className={cn(buttonVariants({ variant: "outline" }), "cursor-pointer")}>
              <Users aria-hidden="true" />
              Gestionar clientes
            </Link>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
