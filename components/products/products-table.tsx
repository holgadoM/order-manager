"use client";

import { Fragment, useState } from "react";
import { createColumnHelper, flexRender, stockFeatures, useTable } from "@tanstack/react-table";

import { EditProductForm } from "@/components/products/product-form";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { centsToEuros, type Product } from "@/lib/products";

const columnHelper = createColumnHelper<typeof stockFeatures, Product>();

type ProductsTableProps = {
  products: Product[];
};

export function ProductsTable({ products }: ProductsTableProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const columns = columnHelper.columns([
    columnHelper.accessor("name", {
      header: "Nombre",
      cell: (info) => info.getValue(),
    }),
    columnHelper.accessor("priceCents", {
      id: "price",
      header: "Precio",
      cell: (info) => `${centsToEuros(info.getValue())} €`,
    }),
    columnHelper.accessor("active", {
      id: "active",
      header: "Estado",
      cell: (info) => (info.getValue() ? "Activo" : "Inactivo"),
    }),
    columnHelper.display({
      id: "actions",
      header: "Acciones",
      cell: (info) => {
        const product = info.row.original;
        const isEditing = editingId === product.id;

        return (
          <Button
            type="button"
            variant="outline"
            className="cursor-pointer"
            aria-expanded={isEditing}
            onClick={() => setEditingId(isEditing ? null : product.id)}
          >
            {isEditing ? "Cerrar" : "Editar"}
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

  return (
    <Card className="bg-card">
      <CardHeader>
        <CardTitle>
          <h2 className="font-heading text-lg font-semibold">Tu catálogo</h2>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Table aria-label="Productos">
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
              table.getRowModel().rows.map((row) => {
                const isEditing = editingId === row.original.id;

                return (
                  <Fragment key={row.id}>
                    <TableRow data-state={isEditing ? "selected" : undefined}>
                      {row.getVisibleCells().map((cell) => (
                        <TableCell key={cell.id}>
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </TableCell>
                      ))}
                    </TableRow>
                    {isEditing ? (
                      <TableRow className="hover:bg-transparent">
                        <TableCell colSpan={columnCount} className="whitespace-normal">
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
                <TableCell colSpan={columnCount} className="py-8 text-center whitespace-normal text-muted-foreground">
                  Todavía no hay productos. Crea el primero con el formulario de arriba.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
