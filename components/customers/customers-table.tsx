"use client";

import { Fragment, useState } from "react";
import { createColumnHelper, flexRender, stockFeatures, useTable } from "@tanstack/react-table";

import { EditCustomerForm } from "@/components/customers/customer-form";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export type CustomerRow = {
  id: string;
  name: string;
  phone: string | null;
  notes: string | null;
};

const columnHelper = createColumnHelper<typeof stockFeatures, CustomerRow>();

type CustomersTableProps = {
  customers: CustomerRow[];
};

function optionalCell(value: string | null, emptyLabel: string) {
  if (!value) {
    return emptyLabel;
  }

  return (
    <span className="block max-w-xs truncate" title={value}>
      {value}
    </span>
  );
}

export function CustomersTable({ customers }: CustomersTableProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const columns = columnHelper.columns([
    columnHelper.accessor("name", {
      header: "Nombre",
      cell: (info) => info.getValue(),
    }),
    columnHelper.accessor("phone", {
      id: "phone",
      header: "Teléfono",
      cell: (info) => optionalCell(info.getValue(), "Sin teléfono"),
    }),
    columnHelper.accessor("notes", {
      id: "notes",
      header: "Notas",
      cell: (info) => optionalCell(info.getValue(), "Sin notas"),
    }),
    columnHelper.display({
      id: "actions",
      header: "Acciones",
      cell: (info) => {
        const customer = info.row.original;
        const isEditing = editingId === customer.id;

        return (
          <Button
            type="button"
            variant="outline"
            className="cursor-pointer"
            aria-expanded={isEditing}
            onClick={() => setEditingId(isEditing ? null : customer.id)}
          >
            {isEditing ? "Cerrar" : "Editar"}
          </Button>
        );
      },
    }),
  ]);
  const table = useTable({
    features: stockFeatures,
    data: customers,
    columns,
    getRowId: (row) => row.id,
  });
  const headerGroup = table.getHeaderGroups()[0];
  const columnCount = headerGroup?.headers.length ?? 1;

  return (
    <Card className="bg-card">
      <CardHeader>
        <CardTitle>
          <h2 className="font-heading text-lg font-semibold">Tus clientes</h2>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Table aria-label="Clientes">
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
                          <EditCustomerForm
                            customer={{
                              id: row.original.id,
                              name: row.original.name,
                              phone: row.original.phone ?? "",
                              notes: row.original.notes ?? "",
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
                  Todavía no hay clientes. Crea el primero con el formulario de arriba.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
