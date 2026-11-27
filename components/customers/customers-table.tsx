"use client";

import { Fragment, useState } from "react";
import { createColumnHelper, flexRender, stockFeatures, useTable } from "@tanstack/react-table";
import { Pencil, Users, X } from "lucide-react";

import { EditCustomerForm } from "@/components/customers/customer-form";
import { useOpenCreateCustomerPanel } from "@/components/customers/customers-page-shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils";

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

const HEAD_ALIGN_CLASS: Record<string, string> = {
  actions: "w-[1%] text-right",
};

const CELL_ALIGN_CLASS: Record<string, string> = {
  actions: "text-right",
};

function formatCustomerCount(count: number): string {
  return count === 1 ? "1 cliente" : `${count} clientes`;
}

function OptionalCell({ value, emptyLabel }: { value: string | null; emptyLabel: string }) {
  if (!value) {
    return <span className="text-muted-foreground/70">{emptyLabel}</span>;
  }
  return (
    <span className="block max-w-[14rem] truncate sm:max-w-xs" title={value}>
      {value}
    </span>
  );
}

export function CustomersTable({ customers }: CustomersTableProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const openCreatePanel = useOpenCreateCustomerPanel();

  const columns = columnHelper.columns([
    columnHelper.accessor("name", {
      header: "Nombre",
      cell: (info) => (
        <span className="block max-w-[14rem] truncate font-medium text-foreground sm:max-w-xs" title={info.getValue()}>
          {info.getValue()}
        </span>
      ),
    }),
    columnHelper.accessor("phone", {
      id: "phone",
      header: "Teléfono",
      cell: (info) => <OptionalCell value={info.getValue()} emptyLabel="Sin teléfono" />,
    }),
    columnHelper.accessor("notes", {
      id: "notes",
      header: "Notas",
      cell: (info) => <OptionalCell value={info.getValue()} emptyLabel="Sin notas" />,
    }),
    columnHelper.display({
      id: "actions",
      header: () => <span className="sr-only">Acciones</span>,
      cell: (info) => {
        const customer = info.row.original;
        const isEditing = editingId === customer.id;

        return (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="cursor-pointer gap-1 text-foreground/80 hover:text-foreground"
            aria-expanded={isEditing}
            aria-label={isEditing ? `Cerrar edición de ${customer.name}` : `Editar ${customer.name}`}
            onClick={() => setEditingId(isEditing ? null : customer.id)}
          >
            {isEditing ? (
              <X className="size-3.5" aria-hidden="true" />
            ) : (
              <Pencil className="size-3.5" aria-hidden="true" />
            )}
            <span>{isEditing ? "Cerrar" : "Editar"}</span>
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
  const countLabel = formatCustomerCount(customers.length);

  return (
    <Card className="gap-0 overflow-hidden bg-card py-0">
      <CardHeader className="border-b border-border px-4 py-4 sm:px-5">
        <div className="flex flex-wrap items-center gap-2.5">
          <CardTitle>
            <h2 className="font-heading text-base font-semibold tracking-tight text-foreground">Tus clientes</h2>
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
        <Table aria-label="Clientes">
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
                        <TableCell
                          colSpan={columnCount}
                          className="whitespace-normal bg-muted/25 px-4 py-4 sm:px-5"
                        >
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
                <TableCell colSpan={columnCount} className="px-4 py-12 text-center whitespace-normal sm:px-6">
                  <div className="mx-auto flex max-w-sm flex-col items-center gap-3">
                    <div className="flex size-11 items-center justify-center rounded-full bg-muted text-muted-foreground">
                      <Users className="size-5" aria-hidden="true" />
                    </div>
                    <div className="flex flex-col gap-1">
                      <p className="font-heading text-sm font-semibold text-foreground">Todavía no hay clientes</p>
                      <p className="text-sm text-muted-foreground">
                        Añade el primero con nombre, teléfono y notas para empezar tu lista.
                      </p>
                    </div>
                    {openCreatePanel ? (
                      <Button
                        type="button"
                        size="sm"
                        className="mt-1 cursor-pointer gap-1.5"
                        aria-label="Añadir el primer cliente"
                        onClick={openCreatePanel}
                      >
                        <Users className="size-4" aria-hidden="true" />
                        <span>Añadir cliente</span>
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
