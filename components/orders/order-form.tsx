"use client";

import { useActionState, useState, type FormEvent } from "react";
import Link from "next/link";
import { Check } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { createOrder } from "@/lib/order-actions";
import { orderTotalCents, parseOrderQuantity } from "@/lib/orders";
import { centsToEuros } from "@/lib/products";
import {
  createOrderFormValues,
  createOrderSchema,
  initialOrderFormState,
  orderFieldErrors,
  type OrderFormState,
} from "@/lib/validation/orders";

export type OrderFormCustomer = {
  id: string;
  name: string;
};

export type OrderFormProduct = {
  id: string;
  name: string;
  priceCents: number;
};

type DraftLine = {
  productId: string;
  productName: string;
  unitPriceCents: number;
  quantity: string;
};

type OrderFormProps = {
  customers: OrderFormCustomer[];
  products: OrderFormProduct[];
  state: OrderFormState;
  pending: boolean;
  action: (formData: FormData) => void;
};

const selectClassName =
  "h-8 w-full min-w-0 cursor-pointer rounded-lg border border-input bg-transparent px-2.5 py-1 text-base transition-colors outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 md:text-sm dark:bg-input/30 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40";

function draftTotalCents(lines: readonly DraftLine[]): number | null {
  const parsed: { quantity: number; unitPriceCents: number }[] = [];

  for (const line of lines) {
    const quantity = parseOrderQuantity(line.quantity);

    if (quantity === null) {
      return null;
    }

    parsed.push({ quantity, unitPriceCents: line.unitPriceCents });
  }

  try {
    return orderTotalCents(parsed);
  } catch {
    return null;
  }
}

function lineAmount(line: DraftLine): string | null {
  const quantity = parseOrderQuantity(line.quantity);

  if (quantity === null) {
    return null;
  }

  try {
    return centsToEuros(orderTotalCents([{ quantity, unitPriceCents: line.unitPriceCents }]));
  } catch {
    return null;
  }
}

export function OrderForm({ customers, products, state, pending, action }: OrderFormProps) {
  const [clientErrors, setClientErrors] = useState<OrderFormState["errors"]>();
  const [draftError, setDraftError] = useState<string>();
  const [customerId, setCustomerId] = useState("");
  const [productId, setProductId] = useState("");
  const [draftQuantity, setDraftQuantity] = useState("1");
  const [lines, setLines] = useState<DraftLine[]>([]);
  const [seenState, setSeenState] = useState(state);
  const [formKey, setFormKey] = useState(0);

  if (state !== seenState) {
    setSeenState(state);

    if (state.ok) {
      setFormKey((key) => key + 1);
      setLines([]);
      setCustomerId("");
      setProductId("");
      setDraftQuantity("1");
      setDraftError(undefined);
      setClientErrors(undefined);
    }
  }
  const errors = clientErrors ?? state.errors;
  const customerErrors = errors?.customerId ?? [];
  const notesErrors = errors?.notes ?? [];
  const itemErrors = errors?.items ?? [];
  const quantityErrors = errors?.quantity ?? [];
  const productErrors = errors?.productId ?? [];
  const message = clientErrors || draftError ? undefined : state.message;
  const hasFieldErrors =
    customerErrors.length > 0 ||
    notesErrors.length > 0 ||
    itemErrors.length > 0 ||
    quantityErrors.length > 0 ||
    productErrors.length > 0 ||
    Boolean(draftError);
  const isSuccess = !clientErrors && !draftError && state.ok === true && !hasFieldErrors;
  const hasAlert = Boolean(message) || hasFieldErrors;
  const canChoose = customers.length > 0 && products.length > 0;
  const totalCents = draftTotalCents(lines);
  const totalText = totalCents === null ? "—" : `${centsToEuros(totalCents)} €`;
  const customerErrorId = customerErrors.length > 0 ? "order-customer-error" : undefined;
  const notesErrorId = notesErrors.length > 0 ? "order-notes-error" : undefined;
  const notesHintId = "order-notes-hint";
  const notesDescribedBy = [notesHintId, notesErrorId].filter(Boolean).join(" ") || undefined;
  const submitLabel = pending ? "Creando pedido…" : "Crear pedido";

  function addLine() {
    const product = products.find((item) => item.id === productId);
    const quantity = parseOrderQuantity(draftQuantity.trim());

    if (!product) {
      setDraftError("Elige un producto.");
      return;
    }

    if (quantity === null) {
      setDraftError("La cantidad tiene que ser un entero mayor que cero.");
      return;
    }

    const current = lines.find((line) => line.productId === product.id);
    const currentQuantity = current ? parseOrderQuantity(current.quantity) : 0;
    const nextQuantity = (currentQuantity ?? 0) + quantity;

    if (current && currentQuantity === null) {
      setDraftError("La cantidad tiene que ser un entero mayor que cero.");
      return;
    }

    if (!Number.isSafeInteger(nextQuantity) || nextQuantity > 2_147_483_647) {
      setDraftError("La cantidad es demasiado grande.");
      return;
    }

    setDraftError(undefined);
    setClientErrors(undefined);
    setLines((existing) => {
      if (!existing.some((line) => line.productId === product.id)) {
        return [
          ...existing,
          {
            productId: product.id,
            productName: product.name,
            unitPriceCents: product.priceCents,
            quantity: String(quantity),
          },
        ];
      }

      return existing.map((line) =>
        line.productId === product.id ? { ...line, quantity: String(nextQuantity) } : line,
      );
    });
    setProductId("");
    setDraftQuantity("1");
  }

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    setDraftError(undefined);
    const formData = new FormData(event.currentTarget);
    const parsed = createOrderSchema({
      customerIds: customers.map((customer) => customer.id),
      products: products.map((product) => ({ ...product, active: true })),
    }).safeParse(createOrderFormValues(formData));

    if (!parsed.success) {
      event.preventDefault();
      setClientErrors(orderFieldErrors(parsed.error));
      return;
    }

    setClientErrors(undefined);
  }

  return (
    <form key={formKey} action={action} onSubmit={onSubmit} className="flex flex-col gap-5" noValidate>
      {hasAlert ? (
        <div
          role={isSuccess ? "status" : "alert"}
          className={
            isSuccess
              ? "flex items-start gap-2 rounded-lg border border-success/30 bg-success/10 px-3 py-2 text-sm text-success"
              : "rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
          }
        >
          {isSuccess ? <Check className="mt-0.5 size-4 shrink-0" aria-hidden="true" /> : null}
          {message ? <p>{message}</p> : null}
          {draftError ? <p>{draftError}</p> : null}
          {customerErrors.map((error) => (
            <p key={error} id={customerErrorId}>
              {error}
            </p>
          ))}
          {notesErrors.map((error) => (
            <p key={error} id={notesErrorId}>
              {error}
            </p>
          ))}
          {itemErrors.map((error) => (
            <p key={error}>{error}</p>
          ))}
          {productErrors.map((error) => (
            <p key={error}>{error}</p>
          ))}
          {quantityErrors.map((error) => (
            <p key={error}>{error}</p>
          ))}
        </div>
      ) : null}

      {customers.length === 0 ? (
        <p className="text-sm text-foreground/80">
          Todavía no tienes clientes.{" "}
          <Link
            href="/customers"
            className="cursor-pointer font-medium underline-offset-4 transition-colors duration-200 hover:underline focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
          >
            Ir a clientes
          </Link>
        </p>
      ) : (
        <div className="flex flex-col gap-2">
          <Label htmlFor="order-customer">Cliente</Label>
          <select
            id="order-customer"
            name="customerId"
            value={customerId}
            onChange={(event) => setCustomerId(event.target.value)}
            aria-invalid={customerErrors.length > 0}
            aria-describedby={customerErrorId}
            className={selectClassName}
          >
            <option value="">Elige un cliente</option>
            {customers.map((customer) => (
              <option key={customer.id} value={customer.id}>
                {customer.name}
              </option>
            ))}
          </select>
        </div>
      )}

      <div className="flex flex-col gap-2">
        <Label htmlFor="order-notes">Nota</Label>
        <Textarea id="order-notes" name="notes" rows={3} aria-invalid={notesErrors.length > 0} aria-describedby={notesDescribedBy} />
        <p id={notesHintId} className="text-sm text-muted-foreground">
          Opcional. Horario, entrega o lo que quieras recordar de este pedido.
        </p>
      </div>

      <fieldset className="flex flex-col gap-4">
        <legend className="font-heading text-base font-semibold">Productos del pedido</legend>
        {products.length === 0 ? (
          <p className="text-sm text-foreground/80">
            No tienes productos activos.{" "}
            <Link
              href="/products"
              className="cursor-pointer font-medium underline-offset-4 transition-colors duration-200 hover:underline focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
            >
              Ir a productos
            </Link>
          </p>
        ) : (
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <div className="flex min-w-0 flex-1 flex-col gap-2">
              <Label htmlFor="order-product">Producto</Label>
              <select
                id="order-product"
                value={productId}
                onChange={(event) => setProductId(event.target.value)}
                className={selectClassName}
              >
                <option value="">Elige un producto</option>
                {products.map((product) => (
                  <option key={product.id} value={product.id}>
                    {product.name} — {centsToEuros(product.priceCents)} €
                  </option>
                ))}
              </select>
            </div>
            <div className="flex w-full flex-col gap-2 sm:w-28">
              <Label htmlFor="order-draft-quantity">Cantidad</Label>
              <Input
                id="order-draft-quantity"
                inputMode="numeric"
                value={draftQuantity}
                onChange={(event) => setDraftQuantity(event.target.value)}
                autoComplete="off"
              />
            </div>
            <Button type="button" variant="outline" onClick={addLine} className="h-9 cursor-pointer">
              Añadir producto
            </Button>
          </div>
        )}

        {lines.length === 0 ? (
          <p className="text-sm text-muted-foreground">Añade al menos un producto activo.</p>
        ) : (
          <ul className="flex flex-col gap-3">
            {lines.map((line) => {
              const amount = lineAmount(line);
              const quantityInvalid = parseOrderQuantity(line.quantity) === null;
              const quantityId = `order-line-quantity-${line.productId}`;

              return (
                <li
                  key={line.productId}
                  className="flex flex-col gap-3 rounded-lg border border-border bg-background p-3 sm:flex-row sm:items-end sm:justify-between"
                >
                  <input type="hidden" name="productId" value={line.productId} />
                  <div className="min-w-0">
                    <p className="font-medium">{line.productName}</p>
                    <p className="text-sm text-muted-foreground">
                      Precio unitario: {centsToEuros(line.unitPriceCents)} €
                    </p>
                    <p className="text-sm">Importe: {amount === null ? "—" : `${amount} €`}</p>
                  </div>
                  <div className="flex flex-col gap-2 sm:w-28">
                    <Label htmlFor={quantityId}>Cantidad de {line.productName}</Label>
                    <Input
                      id={quantityId}
                      name="quantity"
                      inputMode="numeric"
                      value={line.quantity}
                      aria-invalid={quantityInvalid || quantityErrors.length > 0}
                      onChange={(event) => {
                        const quantity = event.target.value;
                        setLines((existing) =>
                          existing.map((item) =>
                            item.productId === line.productId ? { ...item, quantity } : item,
                          ),
                        );
                      }}
                      autoComplete="off"
                    />
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setLines((existing) => existing.filter((item) => item.productId !== line.productId));
                    }}
                    className="h-9 cursor-pointer"
                  >
                    Quitar
                  </Button>
                </li>
              );
            })}
          </ul>
        )}

        <p aria-live="polite" className="font-heading text-lg font-semibold">
          {`Total: ${totalText}`}
        </p>
        <p className="text-sm text-muted-foreground">
          El total es la suma de cantidad por el precio unitario de cada línea, en céntimos.
        </p>
      </fieldset>

      <Button
        type="submit"
        disabled={pending || !canChoose}
        aria-busy={pending}
        className="h-9 cursor-pointer self-start"
      >
        {submitLabel}
      </Button>
    </form>
  );
}

export function CreateOrderForm({
  customers,
  products,
}: {
  customers: OrderFormCustomer[];
  products: OrderFormProduct[];
}) {
  const [state, action, pending] = useActionState(createOrder, initialOrderFormState);

  return (
    <Card className="bg-card">
      <CardHeader>
        <CardTitle>
          <h2 className="font-heading text-lg font-semibold">Datos del pedido</h2>
        </CardTitle>
        <CardDescription className="text-sm text-foreground/80">
          El precio de cada producto se copia al guardar el pedido.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <OrderForm customers={customers} products={products} state={state} pending={pending} action={action} />
      </CardContent>
    </Card>
  );
}
