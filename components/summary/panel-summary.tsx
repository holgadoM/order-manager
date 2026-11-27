import Link from "next/link";
import {
  AlertCircle,
  CheckCircle2,
  ChevronRight,
  ClipboardList,
  Clock,
  Package,
  PackageCheck,
  Plus,
  ShoppingBag,
  Users,
} from "lucide-react";

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
  tag: string;
  helper: string;
  icon: typeof Clock;
  toneClassName: string;
};

type QuickActionItem = {
  href: string;
  label: string;
  description: string;
  icon: typeof ClipboardList;
};

const QUICK_ACTIONS: QuickActionItem[] = [
  {
    href: "/orders",
    label: "Ver pedidos",
    description: "Filtra por estado y abre fichas",
    icon: ClipboardList,
  },
  {
    href: "/products",
    label: "Gestionar productos",
    description: "Precios y disponibilidad",
    icon: Package,
  },
  {
    href: "/customers",
    label: "Gestionar clientes",
    description: "Directorio y datos de contacto",
    icon: Users,
  },
];

const ONBOARDING_STEPS = [
  {
    step: "1. Crea tus productos",
    description: "Añade lo que vendes con su precio en euros y déjalo activo.",
    icon: Package,
  },
  {
    step: "2. Guarda tus clientes",
    description: "Registra a quién le vendes para seleccionarlo rápido al crear pedidos.",
    icon: Users,
  },
  {
    step: "3. Crea tu primer pedido",
    description: "Combina cliente y productos activos y sigue su estado hasta la entrega.",
    icon: Plus,
  },
];

/**
 * Esqueleto de carga coherente con la estructura de métricas y accesos rápidos del panel.
 */
export function PanelSummarySkeleton() {
  return (
    <div className="flex flex-col gap-6" aria-busy="true" aria-label="Cargando resumen">
      <p className="sr-only" role="status">
        Cargando resumen…
      </p>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4" aria-hidden="true">
        {Array.from({ length: 4 }).map((_, index) => (
          <Card key={index} className="gap-3 bg-card py-4">
            <CardHeader className="flex flex-row items-center justify-between gap-2 pb-0">
              <div className="h-4 w-28 rounded-md bg-muted motion-safe:animate-pulse" />
              <div className="size-9 rounded-lg bg-muted motion-safe:animate-pulse" />
            </CardHeader>
            <CardContent className="flex flex-col gap-2.5">
              <div className="h-8 w-14 rounded-md bg-muted/80 motion-safe:animate-pulse" />
              <div className="h-5 w-28 rounded-full bg-muted/60 motion-safe:animate-pulse" />
            </CardContent>
          </Card>
        ))}
      </div>
      <Card className="bg-card" aria-hidden="true">
        <CardHeader className="border-b border-border">
          <div className="h-5 w-36 rounded-md bg-muted motion-safe:animate-pulse" />
          <div className="h-4 w-72 max-w-full rounded-md bg-muted/70 motion-safe:animate-pulse" />
        </CardHeader>
        <CardContent className="flex flex-col gap-4 pt-1">
          <div className="h-16 w-full rounded-xl bg-muted/50 motion-safe:animate-pulse" />
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div className="h-16 rounded-xl bg-muted/40 motion-safe:animate-pulse" />
            <div className="h-16 rounded-xl bg-muted/40 motion-safe:animate-pulse" />
            <div className="h-16 rounded-xl bg-muted/40 motion-safe:animate-pulse" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

/**
 * Resumen principal del panel con conteos de pedidos, productos activos y accesos guiados.
 */
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
      tag: "Pendiente",
      helper: "Por confirmar",
      icon: Clock,
      toneClassName:
        "border-amber-300 bg-amber-50 text-amber-900 dark:border-amber-700/70 dark:bg-amber-950/60 dark:text-amber-200",
    },
    {
      id: "confirmado",
      label: "Pedidos confirmados",
      value: ordersResult.ok ? ordersResult.counts.confirmado : null,
      tag: "Confirmado",
      helper: "En preparación",
      icon: CheckCircle2,
      toneClassName:
        "border-primary/25 bg-secondary text-secondary-foreground dark:border-border dark:bg-secondary dark:text-secondary-foreground",
    },
    {
      id: "entregado",
      label: "Pedidos entregados",
      value: ordersResult.ok ? ordersResult.counts.entregado : null,
      tag: "Entregado",
      helper: "Completados",
      icon: PackageCheck,
      toneClassName:
        "border-emerald-300 bg-emerald-50 text-emerald-900 dark:border-emerald-700/70 dark:bg-emerald-950/60 dark:text-emerald-200",
    },
    {
      id: "productos-activos",
      label: "Productos activos",
      value: productsResult.ok ? productsResult.count : null,
      tag: "Catálogo",
      helper: "Disponibles para pedir",
      icon: ShoppingBag,
      toneClassName:
        "border-sky-300 bg-sky-50 text-sky-900 dark:border-sky-700/70 dark:bg-sky-950/60 dark:text-sky-200",
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
          className="flex items-start gap-3 rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive"
        >
          <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
          <div className="flex flex-col gap-1">
            {errorMessages.map((message) => (
              <p key={message}>{message}</p>
            ))}
          </div>
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
              <Card key={metric.id} className="gap-3 bg-card py-4">
                <CardHeader className="flex flex-row items-start justify-between gap-3 pb-0">
                  <CardTitle className="pt-0.5">
                    <h3 className="font-heading text-sm font-medium text-muted-foreground">{metric.label}</h3>
                  </CardTitle>
                  <span
                    className={cn(
                      "inline-flex size-9 shrink-0 items-center justify-center rounded-lg border",
                      metric.toneClassName,
                    )}
                    aria-hidden="true"
                  >
                    <Icon className="size-4" />
                  </span>
                </CardHeader>
                <CardContent className="flex flex-col gap-2.5">
                  <p
                    className={cn(
                      "font-heading text-3xl font-semibold tracking-tight tabular-nums",
                      metric.value === null ? "text-muted-foreground" : "text-foreground",
                    )}
                    aria-label={
                      metric.value === null
                        ? `${metric.label}: no disponible`
                        : `${metric.label}: ${metric.value}`
                    }
                  >
                    {metric.value === null ? "—" : metric.value}
                  </p>
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={cn(
                        "inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium",
                        metric.toneClassName,
                      )}
                    >
                      {metric.tag}
                    </span>
                    <span className="text-xs text-muted-foreground">{metric.helper}</span>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </section>

      {isCompletelyEmpty ? (
        <Card className="bg-card">
          <CardHeader className="border-b border-border">
            <CardTitle>
              <h2 className="font-heading text-lg font-semibold text-foreground">Empieza a organizar tus pedidos</h2>
            </CardTitle>
            <CardDescription className="max-w-2xl text-sm text-muted-foreground">
              Todavía no tienes pedidos ni productos activos. Prepara tu catálogo y registra tu primer pedido en tres
              pasos:
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-5 pt-1">
            <ol className="grid grid-cols-1 gap-3 md:grid-cols-3">
              {ONBOARDING_STEPS.map((item) => {
                const StepIcon = item.icon;

                return (
                  <li key={item.step} className="flex flex-col gap-2 rounded-xl border border-border bg-muted/35 p-4">
                    <div className="flex items-center gap-2.5">
                      <span
                        className="inline-flex size-7 shrink-0 items-center justify-center rounded-lg border border-border bg-card text-foreground/80"
                        aria-hidden="true"
                      >
                        <StepIcon className="size-3.5" />
                      </span>
                      <p className="font-heading text-sm font-semibold text-foreground">{item.step}</p>
                    </div>
                    <p className="text-xs leading-relaxed text-muted-foreground">{item.description}</p>
                  </li>
                );
              })}
            </ol>
            <div className="flex flex-col gap-2.5 border-t border-border pt-4 sm:flex-row sm:flex-wrap sm:items-center">
              <Link
                href="/products"
                className={cn(buttonVariants({ size: "lg" }), "w-full cursor-pointer gap-2 sm:w-auto")}
              >
                <Package className="size-4" aria-hidden="true" />
                <span>Añadir productos</span>
              </Link>
              <Link
                href="/customers"
                className={cn(buttonVariants({ variant: "outline", size: "lg" }), "w-full cursor-pointer gap-2 sm:w-auto")}
              >
                <Users className="size-4" aria-hidden="true" />
                <span>Añadir clientes</span>
              </Link>
              <Link
                href="/orders/new"
                className={cn(buttonVariants({ variant: "outline", size: "lg" }), "w-full cursor-pointer gap-2 sm:w-auto")}
              >
                <Plus className="size-4" aria-hidden="true" />
                <span>Crear un pedido</span>
              </Link>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="bg-card">
          <CardHeader className="border-b border-border">
            <CardTitle>
              <h2 className="font-heading text-lg font-semibold text-foreground">Accesos rápidos</h2>
            </CardTitle>
            <CardDescription className="text-sm text-muted-foreground">
              {productsResult.ok && productsResult.count === 0
                ? "No tienes productos activos. Activa o crea al menos uno para poder añadirlo a nuevos pedidos."
                : ordersResult.ok && orderCountSum === 0
                  ? "Ya tienes productos activos. Puedes registrar tu primer pedido o revisar tus clientes."
                  : "Gestiona nuevos pedidos, actualiza estados y mantén al día tu catálogo."}
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4 pt-1">
            <div className="flex flex-col items-start justify-between gap-3 rounded-xl border border-primary/20 bg-secondary/40 p-4 sm:flex-row sm:items-center">
              <div className="flex flex-col gap-0.5">
                <p className="font-heading text-sm font-semibold text-foreground">Nuevo pedido</p>
                <p className="text-xs text-muted-foreground">
                  Selecciona un cliente y añade productos activos en segundos.
                </p>
              </div>
              <Link
                href="/orders/new"
                className={cn(buttonVariants({ size: "lg" }), "w-full shrink-0 cursor-pointer gap-2 sm:w-auto")}
              >
                <Plus className="size-4" aria-hidden="true" />
                <span>Crear un pedido</span>
              </Link>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              {QUICK_ACTIONS.map((action) => {
                const Icon = action.icon;

                return (
                  <Link
                    key={action.href}
                    href={action.href}
                    aria-label={action.label}
                    className="group flex cursor-pointer items-center justify-between gap-3 rounded-xl border border-border bg-background p-3.5 text-left transition-colors duration-200 hover:border-ring/50 hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <span
                        className="flex size-9 shrink-0 items-center justify-center rounded-lg border border-border bg-muted/60 text-foreground/80 transition-colors duration-200 group-hover:bg-card group-hover:text-foreground"
                        aria-hidden="true"
                      >
                        <Icon className="size-4" />
                      </span>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-foreground">{action.label}</p>
                        <p className="truncate text-xs text-muted-foreground">{action.description}</p>
                      </div>
                    </div>
                    <ChevronRight
                      className="size-4 shrink-0 text-muted-foreground transition-transform duration-200 group-hover:translate-x-0.5 group-hover:text-foreground"
                      aria-hidden="true"
                    />
                  </Link>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
