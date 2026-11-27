"use client";

import { useActionState, useEffect, useRef, useState, type FormEvent } from "react";
import { AlertCircle, Check, PackagePlus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createProduct, updateProduct } from "@/lib/product-actions";
import {
  createProductFormValues,
  createProductSchema,
  initialProductFormState,
  productFieldErrors,
  updateProductFormValues,
  updateProductSchema,
  type ProductFormState,
} from "@/lib/validation/products";
import { cn } from "@/lib/utils";

export type ProductFormMode = "create" | "edit";

export type EditableProduct = {
  id: string;
  name: string;
  priceEuros: string;
  active: boolean;
};

type ProductFormProps = {
  mode: ProductFormMode;
  product?: EditableProduct;
  state: ProductFormState;
  pending: boolean;
  action: (formData: FormData) => void;
};

export function ProductForm({ mode, product, state, pending, action }: ProductFormProps) {
  const formRef = useRef<HTMLFormElement>(null);
  const [clientErrors, setClientErrors] = useState<ProductFormState["errors"]>();
  const [active, setActive] = useState(product?.active ?? true);
  const isEdit = mode === "edit";
  const idPrefix = isEdit ? "edit-product" : "create-product";
  const errors = clientErrors ?? state.errors;
  const nameErrors = errors?.name ?? [];
  const priceErrors = errors?.priceEuros ?? [];
  const activeErrors = errors?.active ?? [];
  const message = clientErrors ? undefined : state.message;
  const hasFieldErrors = nameErrors.length > 0 || priceErrors.length > 0 || activeErrors.length > 0;
  const isSuccess = !clientErrors && state.ok === true && !hasFieldErrors;
  const hasAlert = Boolean(message) || hasFieldErrors;
  const priceHintId = `${idPrefix}-price-hint`;
  const nameErrorId = nameErrors.length > 0 ? `${idPrefix}-name-error` : undefined;
  const priceErrorId = priceErrors.length > 0 ? `${idPrefix}-price-error` : undefined;
  const priceDescribedBy = [priceHintId, priceErrorId].filter(Boolean).join(" ") || undefined;
  const submitLabel = pending
    ? isEdit
      ? "Guardando…"
      : "Creando producto…"
    : isEdit
      ? "Guardar cambios"
      : "Crear producto";

  useEffect(() => {
    if (!isEdit && state.ok) {
      formRef.current?.reset();
    }
  }, [isEdit, state]);

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    const formData = new FormData(event.currentTarget);
    const parsed = isEdit
      ? updateProductSchema.safeParse(updateProductFormValues(formData))
      : createProductSchema.safeParse(createProductFormValues(formData));

    if (!parsed.success) {
      event.preventDefault();
      setClientErrors(productFieldErrors(parsed.error));
      return;
    }

    setClientErrors(undefined);
  }

  return (
    <form ref={formRef} action={action} onSubmit={onSubmit} className="flex flex-col gap-4" noValidate>
      {isEdit && product ? <input type="hidden" name="id" value={product.id} /> : null}

      {hasAlert ? (
        <div
          role={isSuccess ? "status" : "alert"}
          className={cn(
            "flex items-start gap-2 rounded-lg border px-3 py-2 text-sm",
            isSuccess
              ? "border-success/30 bg-success/10 text-success"
              : "border-destructive/30 bg-destructive/10 text-destructive",
          )}
        >
          {isSuccess ? (
            <Check className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
          ) : (
            <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
          )}
          <div className="flex min-w-0 flex-col gap-1">
            {message ? <p>{message}</p> : null}
            {nameErrors.map((error) => (
              <p key={error} id={nameErrorId}>
                {error}
              </p>
            ))}
            {priceErrors.map((error) => (
              <p key={error} id={priceErrorId}>
                {error}
              </p>
            ))}
            {activeErrors.map((error) => (
              <p key={error}>{error}</p>
            ))}
          </div>
        </div>
      ) : null}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-2">
          <Label htmlFor={`${idPrefix}-name`}>Nombre</Label>
          <Input
            id={`${idPrefix}-name`}
            name="name"
            defaultValue={product?.name}
            aria-invalid={nameErrors.length > 0}
            aria-describedby={nameErrorId}
            autoComplete="off"
            className="h-9 cursor-text"
          />
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor={`${idPrefix}-price`}>Precio (euros)</Label>
          <Input
            id={`${idPrefix}-price`}
            name="priceEuros"
            inputMode="decimal"
            defaultValue={product?.priceEuros}
            placeholder="12,50"
            aria-invalid={priceErrors.length > 0}
            aria-describedby={priceDescribedBy}
            autoComplete="off"
            className="h-9 cursor-text tabular-nums"
          />
          <p id={priceHintId} className="text-sm text-muted-foreground">
            En euros, con hasta dos decimales. Ejemplo: 12,50.
          </p>
        </div>
      </div>

      {isEdit ? (
        <div className="flex flex-col gap-2">
          <Label
            htmlFor={`${idPrefix}-active`}
            className="cursor-pointer rounded-lg border border-border bg-background px-3 py-2.5 transition-colors duration-200 hover:bg-muted/50 has-focus-visible:border-ring has-focus-visible:ring-3 has-focus-visible:ring-ring/50"
          >
            <input
              id={`${idPrefix}-active`}
              name="active"
              type="checkbox"
              value="true"
              defaultChecked={product?.active ?? false}
              onChange={(event) => setActive(event.target.checked)}
              className="size-4 cursor-pointer accent-primary"
            />
            Activo
          </Label>
          {active ? null : (
            <p className="text-sm text-muted-foreground">Este producto no se ofrece ahora.</p>
          )}
        </div>
      ) : null}

      <Button
        type="submit"
        size="lg"
        disabled={pending}
        aria-busy={pending}
        className="h-9 w-full cursor-pointer self-start sm:w-auto"
      >
        {submitLabel}
      </Button>
    </form>
  );
}

export function CreateProductForm() {
  const [state, action, pending] = useActionState(createProduct, initialProductFormState);

  return (
    <Card className="gap-0 overflow-hidden bg-card py-0">
      <CardHeader className="border-b border-border px-4 py-4 sm:px-5">
        <div className="flex items-start gap-3">
          <span
            className="mt-0.5 inline-flex size-9 shrink-0 items-center justify-center rounded-lg border border-border bg-muted/60 text-foreground/80"
            aria-hidden="true"
          >
            <PackagePlus className="size-4" />
          </span>
          <div className="flex min-w-0 flex-col gap-1">
            <CardTitle>
              <h2 className="font-heading text-base font-semibold tracking-tight text-foreground">Nuevo producto</h2>
            </CardTitle>
            <CardDescription className="text-sm text-muted-foreground">
              El precio se escribe en euros y se guarda en céntimos.
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="px-4 py-4 sm:px-5">
        <ProductForm mode="create" state={state} pending={pending} action={action} />
      </CardContent>
    </Card>
  );
}

export function EditProductForm({ product }: { product: EditableProduct }) {
  const [state, action, pending] = useActionState(updateProduct, initialProductFormState);

  return (
    <div className="flex flex-col gap-3 whitespace-normal">
      <h3 className="font-heading text-sm font-semibold text-foreground">Editar producto</h3>
      <ProductForm key={product.id} mode="edit" product={product} state={state} pending={pending} action={action} />
    </div>
  );
}
