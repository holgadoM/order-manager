"use client";

import { useState } from "react";
import Link from "next/link";
import { createColumnHelper, flexRender, stockFeatures, useTable } from "@tanstack/react-table";

import { buttonVariants } from "@/components/ui/button";
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
  "h-8 w-full min-w-0 cursor-pointer rounded-lg border border-input bg-transparent px-2.5 py-1 text-base transition-colors duration-200 outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 md:text-sm dark:bg-input/30";

function statusFilterLabel(filter: StatusFilter): string {
  if (filter === "todos") {
    return "Todos los estados";
  }

  return orderStatusLabel(filter);
}

export function OrdersTable({ orders }: OrdersTableProps) {
  const [filter, setFilter] = useState<StatusFilter>("todos");
  const visibleOrders = filter === "todos" ? orders : orders.filter((order) => order.status === filter);
  const columns = columnHelper.columns([
    columnHelper.accessor("customerName", {
      header: "Cliente",
      cell: (info) => info.getValue(),
    }),
    columnHelper.accessor("status", {
      header: "Estado",
      cell: (info) => orderStatusLabel(info.getValue()),
    }),
    columnHelper.accessor("totalCents", {
      id: "total",
      header: "Total",
      cell: (info) => `${centsToEuros(info.getValue())} €`,
    }),
    columnHelper.accessor("createdAtLabel", {
      id: "date",
      header: "Fecha",
      cell: (info) => info.getValue(),
    }),
    columnHelper.display({
      id: "open",
      header: "Ficha",
      cell: (info) => {
        const order = info.row.original;

        return (
          <Link
            href={`/orders/${order.id}`}
            aria-label={`Ver pedido de ${order.customerName} del ${order.createdAtLabel}`}
            className={cn(buttonVariants({ variant: "outline", size: "sm" }), "cursor-pointer")}
          >
            Ver
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
  const emptyMessage =
    orders.length === 0
      ? "Todavía no hay pedidos. Crea el primero con el botón de arriba."
      : `No hay pedidos con estado ${statusFilterLabel(filter).toLowerCase()}.`;

  return (
    <Card className="bg-card">
      <CardHeader>
        <CardTitle>
          <h2 className="font-heading text-lg font-semibold">Tus pedidos</h2>
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="flex max-w-xs flex-col gap-2">
          <Label htmlFor="orders-status-filter">Filtrar por estado</Label>
          <select
            id="orders-status-filter"
            className={selectClassName}
            value={filter}
            onChange={(event) => {
              const value = event.target.value;
              setFilter(value === "todos" || ORDER_STATUSES.includes(value as OrderStatus) ? (value as StatusFilter) : "todos");
            }}
          >
            <option value="todos">Todos los estados</option>
            {ORDER_STATUSES.map((status) => (
              <option key={status} value={status}>
                {orderStatusLabel(status)}
              </option>
            ))}
          </select>
        </div>
        <p className="text-sm text-muted-foreground" aria-live="polite">
          {visibleOrders.length === 1 ? "1 pedido" : `${visibleOrders.length} pedidos`}
        </p>
        <Table aria-label="Pedidos">
          <TableHeader>
            {table.getHeaderGroups().map((group) => (
              <TableRow key={group.id} className="hover:bg-transparent">
                {group.headers.map((header) => (
                  <TableHead key={header.id} scope="col" colSpan={header.colSpan}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.length > 0 ? (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow className="hover:bg-transparent">
                <TableCell colSpan={columnCount} className="py-8 text-center whitespace-normal text-muted-foreground">
                  {emptyMessage}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
