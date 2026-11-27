"use client";

import { Fragment, useState } from "react";
import { createColumnHelper, flexRender, stockFeatures, useTable } from "@tanstack/react-table";
import { CheckCircle2, CircleOff, Package, Pencil, Plus, X } from "lucide-react";

import { EditProductForm } from "@/components/products/product-form";
import { useOpenCreateProductPanel } from "@/components/products/products-page-shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { centsToEuros, type Product } from "@/lib/products";
import { cn } from "@/lib/utils";

const columnHelper = createColumnHelper<typeof stockFeatures, Product>();

type ProductsTableProps = {
  products: Product[];
};

const HEAD_ALIGN_CLASS: Record<string, string> = {
  price: "text-right",
  actions: "w-[1%] text-right",
};

const CELL_ALIGN_CLASS: Record<string, string> = {
  price: "text-right tabular-nums",
  actions: "text-right",
};

function formatProductCount(count: number): string {
  return count === 1 ? "1 producto" : `${count} productos`;
}

function ProductStatusIndicator({ active }: { active: boolean }) {
  const Icon = active ? CheckCircle2 : CircleOff;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium",
        active
          ? "border-emerald-300 bg-emerald-50 text-emerald-900 dark:border-emerald-700/70 dark:bg-emerald-950/60 dark:text-emerald-200"
          : "border-border bg-muted/70 text-foreground/80 dark:bg-muted/40",
      )}
    >
      <Icon className="size-3.5 shrink-0" aria-hidden="true" />
      <span>{active ? "Activo" : "Inactivo"}</span>
    </span>
  );
}

export function ProductsTable({ products }: ProductsTableProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const openCreatePanel = useOpenCreateProductPanel();
  const columns = columnHelper.columns([
    columnHelper.accessor("name", {
      header: "Nombre",
      cell: (info) => (
        <span className="block max-w-[14rem] truncate font-medium text-foreground sm:max-w-xs" title={info.getValue()}>
          {info.getValue()}
        </span>
      ),
    }),
    columnHelper.accessor("priceCents", {
      id: "price",
      header: "Precio",
      cell: (info) => (
        <span className="font-medium tabular-nums text-foreground">{`${centsToEuros(info.getValue())} €`}</span>
      ),
    }),
    columnHelper.accessor("active", {
      id: "active",
      header: "Estado",
      cell: (info) => <ProductStatusIndicator active={info.getValue()} />,
    }),
    columnHelper.display({
      id: "actions",
      header: () => <span className="sr-only">Acciones</span>,
      cell: (info) => {
        const product = info.row.original;
        const isEditing = editingId === product.id;

        return (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="cursor-pointer gap-1 text-foreground/80 hover:text-foreground"
            aria-expanded={isEditing}
            aria-label={isEditing ? `Cerrar edición de ${product.name}` : `Editar ${product.name}`}
            onClick={() => setEditingId(isEditing ? null : product.id)}
          >
            {isEditing ? <X className="size-3.5" aria-hidden="true" /> : <Pencil className="size-3.5" aria-hidden="true" />}
            <span>{isEditing ? "Cerrar" : "Editar"}</span>
          </Button>
        );
      },
    }),
  ]);
  const table = useTable({
    features: stockFeatures,
    data: products,
    columns,
    getRowId: (row) => row.id,
  });
  const headerGroup = table.getHeaderGroups()[0];
  const columnCount = headerGroup?.headers.length ?? 1;
  const countLabel = formatProductCount(products.length);

  return (
    <Card className="gap-0 overflow-hidden bg-card py-0">
      <CardHeader className="border-b border-border px-4 py-4 sm:px-5">
        <div className="flex flex-wrap items-center gap-2.5">
          <CardTitle>
            <h2 className="font-heading text-base font-semibold tracking-tight text-foreground">Tu catálogo</h2>
          </CardTitle>
          <span
            aria-live="polite"
            className="inline-flex items-center rounded-full border border-border bg-muted/60 px-2.5 py-0.5 text-xs font-medium tabular-nums text-foreground/80"
          >
            {countLabel}
          </span>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <Table aria-label="Productos">
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
              table.getRowModel().rows.map((row) => {
                const isEditing = editingId === row.original.id;

                return (
                  <Fragment key={row.id}>
                    <TableRow
                      data-state={isEditing ? "selected" : undefined}
                      className="transition-colors duration-150 hover:bg-muted/40"
                    >
                      {row.getVisibleCells().map((cell) => (
                        <TableCell
                          key={cell.id}
                          className={cn("px-4 py-3 sm:px-5", CELL_ALIGN_CLASS[cell.column.id])}
                        >
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </TableCell>
                      ))}
                    </TableRow>
                    {isEditing ? (
                      <TableRow className="hover:bg-transparent">
                        <TableCell colSpan={columnCount} className="whitespace-normal bg-muted/25 px-4 py-4 sm:px-5">
                          <EditProductForm
                            product={{
                              id: row.original.id,
                              name: row.original.name,
                              priceEuros: centsToEuros(row.original.priceCents),
                              active: row.original.active,
                            }}
                          />
                        </TableCell>
                      </TableRow>
                    ) : null}
                  </Fragment>
                );
              })
            ) : (
              <TableRow className="hover:bg-transparent">
                <TableCell colSpan={columnCount} className="px-4 py-12 text-center whitespace-normal sm:px-6">
                  <div className="mx-auto flex max-w-sm flex-col items-center gap-3">
                    <div className="flex size-11 items-center justify-center rounded-full bg-muted text-muted-foreground">
                      <Package className="size-5" aria-hidden="true" />
                    </div>
                    <div className="flex flex-col gap-1">
                      <p className="font-heading text-sm font-semibold text-foreground">Todavía no hay productos</p>
                      <p className="text-sm text-muted-foreground">
                        Añade el primero con nombre y precio en euros para empezar tu catálogo.
                      </p>
                    </div>
                    {openCreatePanel ? (
                      <Button
                        type="button"
                        size="sm"
                        className="mt-1 cursor-pointer gap-1.5"
                        aria-label="Añadir el primer producto"
                        onClick={openCreatePanel}
                      >
                        <Plus className="size-4" aria-hidden="true" />
                        <span>Añadir producto</span>
                      </Button>
                    ) : null}
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
