"use client";

import { useActionState, useState, type FormEvent } from "react";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { nextOrderStatuses, orderStatusLabel, transitionOrderStatus, type OrderStatus } from "@/lib/orders";
import {
  initialOrderStatusFormState,
  type OrderStatusFormState,
  type UpdateOrderStatusAction,
} from "@/lib/validation/orders";

type OrderStatusFormProps = {
  orderId: string;
  status: OrderStatus;
  state: OrderStatusFormState;
  pending: boolean;
  action: (formData: FormData) => void;
};

const selectClassName =
  "h-8 w-full min-w-0 cursor-pointer rounded-lg border border-input bg-transparent px-2.5 py-1 text-base transition-colors duration-200 outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 md:text-sm dark:bg-input/30 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40";

export function OrderStatusForm({ orderId, status, state, pending, action }: OrderStatusFormProps) {
  const options = nextOrderStatuses(status);
  const [clientMessage, setClientMessage] = useState<string | null>(null);
  const message = clientMessage ?? state.message;
  const failed = clientMessage !== null || state.ok === false;
  const statusId = `order-status-${orderId}`;
  const hintId = `order-status-hint-${orderId}`;

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    const next = new FormData(event.currentTarget).get("status");
    const decision = transitionOrderStatus(status, typeof next === "string" ? next : "");

    if (!decision.ok) {
      event.preventDefault();
      setClientMessage(decision.message);
      return;
    }

    setClientMessage(null);
  }

  if (options.length === 0) {
    return (
      <p className="text-sm text-foreground/80">
        Un pedido {orderStatusLabel(status).toLowerCase()} no cambia de estado.
      </p>
    );
  }

  return (
    <form action={action} onSubmit={onSubmit} className="flex flex-col gap-4">
      <input type="hidden" name="orderId" value={orderId} />
      <div className="flex max-w-xs flex-col gap-2">
        <Label htmlFor={statusId}>Nuevo estado</Label>
        <select
          key={status}
          id={statusId}
          name="status"
          className={selectClassName}
          defaultValue={options[0]}
          disabled={pending}
          aria-invalid={failed}
          aria-describedby={hintId}
          onChange={() => setClientMessage(null)}
        >
          {options.map((option) => (
            <option key={option} value={option}>
              {orderStatusLabel(option)}
            </option>
          ))}
        </select>
        <p id={hintId} className="text-sm text-muted-foreground">
          Desde {orderStatusLabel(status).toLowerCase()} solo puedes elegir un estado permitido.
        </p>
      </div>
      {message ? (
        <p
          role={failed ? "alert" : "status"}
          className={
            failed
              ? "rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
              : "rounded-lg border border-success/30 bg-success/10 px-3 py-2 text-sm text-success"
          }
        >
          {message}
        </p>
      ) : null}
      <Button type="submit" disabled={pending} aria-busy={pending} className="h-9 cursor-pointer self-start">
        {pending ? "Actualizando estado…" : "Actualizar estado"}
      </Button>
    </form>
  );
}

export function OrderStatusControl({
  orderId,
  status,
  action: updateStatus,
}: {
  orderId: string;
  status: OrderStatus;
  action: UpdateOrderStatusAction;
}) {
  const [state, formAction, pending] = useActionState(updateStatus, initialOrderStatusFormState);

  return <OrderStatusForm orderId={orderId} status={status} state={state} pending={pending} action={formAction} />;
}
