"use client";

import { useActionState, useEffect, useRef, useState, type FormEvent } from "react";
import { Check } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { createCustomer, updateCustomer } from "@/lib/customer-actions";
import {
  createCustomerFormValues,
  createCustomerSchema,
  customerFieldErrors,
  initialCustomerFormState,
  updateCustomerFormValues,
  updateCustomerSchema,
  type CustomerFormState,
} from "@/lib/validation/customers";

export type CustomerFormMode = "create" | "edit";

export type EditableCustomer = {
  id: string;
  name: string;
  phone: string;
  notes: string;
};

type CustomerFormProps = {
  mode: CustomerFormMode;
  customer?: EditableCustomer;
  state: CustomerFormState;
  pending: boolean;
  action: (formData: FormData) => void;
};

export function CustomerForm({ mode, customer, state, pending, action }: CustomerFormProps) {
  const formRef = useRef<HTMLFormElement>(null);
  const [clientErrors, setClientErrors] = useState<CustomerFormState["errors"]>();
  const isEdit = mode === "edit";
  const idPrefix = isEdit ? "edit-customer" : "create-customer";
  const errors = clientErrors ?? state.errors;
  const nameErrors = errors?.name ?? [];
  const phoneErrors = errors?.phone ?? [];
  const notesErrors = errors?.notes ?? [];
  const message = clientErrors ? undefined : state.message;
  const hasFieldErrors = nameErrors.length > 0 || phoneErrors.length > 0 || notesErrors.length > 0;
  const isSuccess = !clientErrors && state.ok === true && !hasFieldErrors;
  const hasAlert = Boolean(message) || hasFieldErrors;
  const phoneHintId = `${idPrefix}-phone-hint`;
  const notesHintId = `${idPrefix}-notes-hint`;
  const nameErrorId = nameErrors.length > 0 ? `${idPrefix}-name-error` : undefined;
  const phoneErrorId = phoneErrors.length > 0 ? `${idPrefix}-phone-error` : undefined;
  const notesErrorId = notesErrors.length > 0 ? `${idPrefix}-notes-error` : undefined;
  const phoneDescribedBy = [phoneHintId, phoneErrorId].filter(Boolean).join(" ") || undefined;
  const notesDescribedBy = [notesHintId, notesErrorId].filter(Boolean).join(" ") || undefined;
  const submitLabel = pending
    ? isEdit
      ? "Guardando…"
      : "Creando cliente…"
    : isEdit
      ? "Guardar cambios"
      : "Crear cliente";

  useEffect(() => {
    if (!isEdit && state.ok) {
      formRef.current?.reset();
    }
  }, [isEdit, state]);

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    const formData = new FormData(event.currentTarget);
    const parsed = isEdit
      ? updateCustomerSchema.safeParse(updateCustomerFormValues(formData))
      : createCustomerSchema.safeParse(createCustomerFormValues(formData));

    if (!parsed.success) {
      event.preventDefault();
      setClientErrors(customerFieldErrors(parsed.error));
      return;
    }

    setClientErrors(undefined);
  }

  return (
    <form ref={formRef} action={action} onSubmit={onSubmit} className="flex flex-col gap-4" noValidate>
      {isEdit && customer ? <input type="hidden" name="id" value={customer.id} /> : null}

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
          {nameErrors.map((error) => (
            <p key={error} id={nameErrorId}>
              {error}
            </p>
          ))}
          {phoneErrors.map((error) => (
            <p key={error} id={phoneErrorId}>
              {error}
            </p>
          ))}
          {notesErrors.map((error) => (
            <p key={error} id={notesErrorId}>
              {error}
            </p>
          ))}
        </div>
      ) : null}

      <div className="flex flex-col gap-2">
        <Label htmlFor={`${idPrefix}-name`}>Nombre</Label>
        <Input
          id={`${idPrefix}-name`}
          name="name"
          defaultValue={customer?.name}
          aria-invalid={nameErrors.length > 0}
          aria-describedby={nameErrorId}
          autoComplete="name"
          required
        />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor={`${idPrefix}-phone`}>Teléfono</Label>
        <Input
          id={`${idPrefix}-phone`}
          name="phone"
          type="tel"
          defaultValue={customer?.phone}
          aria-invalid={phoneErrors.length > 0}
          aria-describedby={phoneDescribedBy}
          autoComplete="tel"
        />
        <p id={phoneHintId} className="text-sm text-muted-foreground">
          Opcional. Puedes dejarlo vacío.
        </p>
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor={`${idPrefix}-notes`}>Notas</Label>
        <Textarea
          id={`${idPrefix}-notes`}
          name="notes"
          rows={3}
          defaultValue={customer?.notes}
          aria-invalid={notesErrors.length > 0}
          aria-describedby={notesDescribedBy}
        />
        <p id={notesHintId} className="text-sm text-muted-foreground">
          Opcional. Dirección, preferencias o lo que necesites recordar.
        </p>
      </div>

      <Button type="submit" disabled={pending} aria-busy={pending} className="h-9 cursor-pointer self-start">
        {submitLabel}
      </Button>
    </form>
  );
}

export function CreateCustomerForm() {
  const [state, action, pending] = useActionState(createCustomer, initialCustomerFormState);

  return (
    <Card className="bg-card">
      <CardHeader>
        <CardTitle>
          <h2 className="font-heading text-lg font-semibold">Nuevo cliente</h2>
        </CardTitle>
        <CardDescription className="text-sm text-foreground/80">
          El nombre es obligatorio. El teléfono y las notas puedes dejarlos vacíos.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <CustomerForm mode="create" state={state} pending={pending} action={action} />
      </CardContent>
    </Card>
  );
}

export function EditCustomerForm({ customer }: { customer: EditableCustomer }) {
  const [state, action, pending] = useActionState(updateCustomer, initialCustomerFormState);

  return (
    <div className="flex flex-col gap-3 py-2 whitespace-normal">
      <h3 className="font-heading text-base font-semibold">Editar cliente</h3>
      <CustomerForm key={customer.id} mode="edit" customer={customer} state={state} pending={pending} action={action} />
    </div>
  );
}
