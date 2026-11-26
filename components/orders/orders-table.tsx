"use client";

import { useState } from "react";
import Link from "next/link";
import { createColumnHelper, flexRender, stockFeatures, useTable } from "@tanstack/react-table";
import {
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  ClipboardList,
  Clock,
  ListFilter,
  PackageCheck,
  Plus,
  RotateCcw,
  XCircle,
} from "lucide-react";

import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  ORDER_STATUSES,
  orderStatusLabel,
  type OrderStatus,
  type OrderSummary,
} from "@/lib/orders";
import { centsToEuros } from "@/lib/products";
import { cn } from "@/lib/utils";

const columnHelper = createColumnHelper<typeof stockFeatures, OrderSummary>();

type StatusFilter = OrderStatus | "todos";

type OrdersTableProps = {
  orders: OrderSummary[];
};

const selectClassName =
  "h-9 w-full min-w-0 appearance-none cursor-pointer rounded-lg border border-input bg-background py-1 pr-8 pl-8 text-base font-medium text-foreground transition-colors duration-200 outline-none hover:border-ring/60 focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 md:text-sm dark:bg-input/30";

const STATUS_INDICATOR: Record<
  OrderStatus,
  {
    icon: typeof Clock;
    className: string;
  }
> = {
  pendiente: {
    icon: Clock,
    className:
      "border-amber-300 bg-amber-50 text-amber-900 dark:border-amber-700/70 dark:bg-amber-950/60 dark:text-amber-200",
  },
  confirmado: {
    icon: CheckCircle2,
    className:
      "border-primary/25 bg-secondary text-secondary-foreground dark:border-border dark:bg-secondary dark:text-secondary-foreground",
  },
  entregado: {
    icon: PackageCheck,
    className:
      "border-emerald-300 bg-emerald-50 text-emerald-900 dark:border-emerald-700/70 dark:bg-emerald-950/60 dark:text-emerald-200",
  },
  cancelado: {
    icon: XCircle,
    className:
      "border-rose-300 bg-rose-50 text-rose-900 dark:border-rose-700/70 dark:bg-rose-950/60 dark:text-rose-200",
  },
};

const HEAD_ALIGN_CLASS: Record<string, string> = {
  total: "text-right",
  open: "w-[1%] text-right",
};

const CELL_ALIGN_CLASS: Record<string, string> = {
  total: "text-right tabular-nums",
  open: "text-right",
};

function statusFilterLabel(filter: StatusFilter): string {
  if (filter === "todos") {
    return "Todos los estados";
  }

  return orderStatusLabel(filter);
}

function formatOrderCount(visibleCount: number, totalCount: number, isFiltered: boolean): string {
  if (isFiltered) {
    return `${visibleCount} de ${totalCount} ${totalCount === 1 ? "pedido" : "pedidos"}`;
  }

  return visibleCount === 1 ? "1 pedido" : `${visibleCount} pedidos`;
}

function OrderStatusIndicator({ status }: { status: OrderStatus }) {
  const indicator = STATUS_INDICATOR[status];
  const Icon = indicator.icon;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium",
        indicator.className,
      )}
    >
      <Icon className="size-3.5 shrink-0" aria-hidden="true" />
      <span>{orderStatusLabel(status)}</span>
    </span>
  );
}

export function OrdersTable({ orders }: OrdersTableProps) {
  const [filter, setFilter] = useState<StatusFilter>("todos");
  const isFiltered = filter !== "todos";
  const visibleOrders = isFiltered ? orders.filter((order) => order.status === filter) : orders;

  const columns = columnHelper.columns([
    columnHelper.accessor("customerName", {
      header: "Cliente",
      cell: (info) => (
        <span className="block max-w-[14rem] truncate font-medium text-foreground sm:max-w-xs" title={info.getValue()}>
          {info.getValue()}
        </span>
      ),
    }),
    columnHelper.accessor("status", {
      header: "Estado",
      cell: (info) => <OrderStatusIndicator status={info.getValue()} />,
    }),
    columnHelper.accessor("totalCents", {
      id: "total",
      header: "Total",
      cell: (info) => (
        <span className="font-medium tabular-nums text-foreground">{`${centsToEuros(info.getValue())} €`}</span>
      ),
    }),
    columnHelper.accessor("createdAtLabel", {
      id: "date",
      header: "Fecha",
      cell: (info) => <span className="tabular-nums text-muted-foreground">{info.getValue()}</span>,
    }),
    columnHelper.display({
      id: "open",
      header: () => <span className="sr-only">Ficha</span>,
      cell: (info) => {
        const order = info.row.original;

        return (
          <Link
            href={`/orders/${order.id}`}
            aria-label={`Ver pedido de ${order.customerName} del ${order.createdAtLabel}`}
            className={cn(
              buttonVariants({ variant: "ghost", size: "sm" }),
              "cursor-pointer gap-1 text-foreground/80 hover:text-foreground",
            )}
          >
            <span>Ver</span>
            <ChevronRight className="size-3.5" aria-hidden="true" />
          </Link>
        );
      },
    }),
  ]);

  const table = useTable({
    features: stockFeatures,
    data: visibleOrders,
    columns,
    getRowId: (row) => row.id,
  });

  const headerGroup = table.getHeaderGroups()[0];
  const columnCount = headerGroup?.headers.length ?? 1;
  const countLabel = formatOrderCount(visibleOrders.length, orders.length, isFiltered);

  return (
    <Card className="gap-0 overflow-hidden bg-card py-0">
      <CardHeader className="border-b border-border px-4 py-4 sm:px-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-center gap-2.5">
            <CardTitle>
              <h2 className="font-heading text-base font-semibold tracking-tight text-foreground">Tus pedidos</h2>
            </CardTitle>
            <span
              aria-live="polite"
              className="inline-flex items-center rounded-full border border-border bg-muted/60 px-2.5 py-0.5 text-xs font-medium tabular-nums text-foreground/80"
            >
              {countLabel}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2 sm:justify-end">
            <Label htmlFor="orders-status-filter" className="text-xs font-medium text-muted-foreground sm:text-sm">
              Filtrar por estado
            </Label>
            <div className="relative min-w-0 flex-1 sm:w-48 sm:flex-initial">
              <ListFilter
                className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground"
                aria-hidden="true"
              />
              <select
                id="orders-status-filter"
                className={selectClassName}
                value={filter}
                onChange={(event) => {
                  const value = event.target.value;
                  setFilter(
                    value === "todos" || ORDER_STATUSES.includes(value as OrderStatus)
                      ? (value as StatusFilter)
                      : "todos",
                  );
                }}
              >
                <option value="todos">Todos los estados</option>
                {ORDER_STATUSES.map((status) => (
                  <option key={status} value={status}>
                    {orderStatusLabel(status)}
                  </option>
                ))}
              </select>
              <ChevronDown
                className="pointer-events-none absolute top-1/2 right-2.5 size-4 -translate-y-1/2 text-muted-foreground"
                aria-hidden="true"
              />
            </div>
            {isFiltered ? (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-9 cursor-pointer gap-1 px-2.5 text-xs text-muted-foreground hover:text-foreground"
                onClick={() => setFilter("todos")}
              >
                <RotateCcw className="size-3.5" aria-hidden="true" />
                <span>Limpiar</span>
              </Button>
            ) : null}
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-0">
        <Table aria-label="Pedidos">
          <TableHeader>
            {table.getHeaderGroups().map((group) => (
              <TableRow key={group.id} className="bg-muted/40 hover:bg-muted/40">
                {group.headers.map((header) => (
                  <TableHead
                    key={header.id}
                    scope="col"
                    colSpan={header.colSpan}
                    className={cn(
                      "h-10 px-4 text-xs font-medium text-muted-foreground sm:px-5",
                      HEAD_ALIGN_CLASS[header.column.id],
                    )}
                  >
                    {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.length > 0 ? (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id} className="transition-colors duration-150 hover:bg-muted/40">
                  {row.getVisibleCells().map((cell) => (
                    <TableCell
                      key={cell.id}
                      className={cn("px-4 py-3 sm:px-5", CELL_ALIGN_CLASS[cell.column.id])}
                    >
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow className="hover:bg-transparent">
                <TableCell colSpan={columnCount} className="px-4 py-12 text-center whitespace-normal sm:px-6">
                  <div className="mx-auto flex max-w-sm flex-col items-center gap-3">
                    <div className="flex size-11 items-center justify-center rounded-full bg-muted text-muted-foreground">
                      {orders.length === 0 ? (
                        <ClipboardList className="size-5" aria-hidden="true" />
                      ) : (
                        <ListFilter className="size-5" aria-hidden="true" />
                      )}
                    </div>
                    <div className="flex flex-col gap-1">
                      <p className="font-heading text-sm font-semibold text-foreground">
                        {orders.length === 0
                          ? "Todavía no hay pedidos"
                          : `No hay pedidos con estado ${statusFilterLabel(filter).toLowerCase()}.`}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {orders.length === 0
                          ? "Crea tu primer pedido para empezar a hacer seguimiento desde aquí."
                          : "Prueba con otro estado o limpia el filtro para ver todos los pedidos."}
                      </p>
                    </div>
                    {orders.length === 0 ? (
                      <Link
                        href="/orders/new"
                        className={cn(buttonVariants({ size: "sm" }), "mt-1 cursor-pointer gap-1.5")}
                      >
                        <Plus className="size-4" aria-hidden="true" />
                        <span>Crear un pedido</span>
                      </Link>
                    ) : (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="mt-1 cursor-pointer gap-1.5"
                        onClick={() => setFilter("todos")}
                      >
                        <RotateCcw className="size-3.5" aria-hidden="true" />
                        <span>Mostrar todos los pedidos</span>
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
