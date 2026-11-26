import { z } from "zod";

import {
  isOrderStatus,
  orderTotalCents,
  parseOrderQuantity,
  type OrderCatalogProduct,
  type OrderStatus,
} from "@/lib/orders";

const NOTES_MAX = 2000;

const notesSchema = z
  .string("Las notas no son válidas.")
  .trim()
  .max(NOTES_MAX, "Las notas son demasiado largas.")
  .transform((value) => (value.length === 0 ? null : value));

const itemSchema = z.object({
  productId: z.string("Elige un producto.").trim(),
  quantity: z.string("La cantidad tiene que ser un entero mayor que cero.").trim(),
});

export type OrderCatalog = {
  customerIds: readonly string[];
  products: readonly OrderCatalogProduct[];
};

export type OrderField = "customerId" | "notes" | "items" | "quantity" | "productId";

export type OrderFormState = {
  ok?: boolean;
  message?: string;
  errors?: Partial<Record<OrderField, string[]>>;
};

export const initialOrderFormState: OrderFormState = {};

export type OrderStatusFormState = {
  ok?: boolean;
  message?: string;
};

export type UpdateOrderStatusAction = (
  state: OrderStatusFormState,
  formData: FormData,
) => Promise<OrderStatusFormState>;

export const initialOrderStatusFormState: OrderStatusFormState = {};

export const updateOrderStatusSchema = z.object({
  orderId: z
    .string("El pedido no es válido.")
    .trim()
    .refine((value) => isUuid(value), "El pedido no es válido."),
  status: z
    .string("Elige un estado.")
    .trim()
    .refine((value): value is OrderStatus => isOrderStatus(value), "Elige un estado válido."),
});

export function updateOrderStatusValues(formData: FormData): {
  orderId: FormDataEntryValue | null;
  status: FormDataEntryValue | null;
} {
  return {
    orderId: formData.get("orderId"),
    status: formData.get("status"),
  };
}

function isUuid(value: string): boolean {
  return z.uuid().safeParse(value).success;
}

function activeOwnProducts(products: readonly OrderCatalogProduct[]): Map<string, OrderCatalogProduct> {
  const own = new Map<string, OrderCatalogProduct>();

  for (const product of products) {
    if (!product.active || product.name.trim().length === 0) {
      continue;
    }

    if (!Number.isInteger(product.priceCents) || product.priceCents <= 0) {
      continue;
    }

    own.set(product.id, product);
  }

  return own;
}

export function createOrderSchema(catalog: OrderCatalog) {
  const customerIds = new Set(catalog.customerIds);
  const products = activeOwnProducts(catalog.products);

  return z
    .object({
      customerId: z.string("Elige un cliente.").trim(),
      notes: notesSchema,
      items: z.array(itemSchema),
    })
    .superRefine((data, ctx) => {
      if (data.customerId.length === 0 || !isUuid(data.customerId)) {
        ctx.addIssue({
          code: "custom",
          path: ["customerId"],
          message: "Elige un cliente.",
        });
      } else if (!customerIds.has(data.customerId)) {
        ctx.addIssue({
          code: "custom",
          path: ["customerId"],
          message: "El cliente tiene que ser tuyo.",
        });
      }

      if (data.items.length === 0) {
        ctx.addIssue({
          code: "custom",
          path: ["items"],
          message: "Añade al menos un producto.",
        });
      }

      const captured: { quantity: number; unitPriceCents: number }[] = [];

      for (const [index, item] of data.items.entries()) {
        const quantity = parseOrderQuantity(item.quantity);
        const product = products.get(item.productId);

        if (quantity === null) {
          ctx.addIssue({
            code: "custom",
            path: ["items", index, "quantity"],
            message: "La cantidad tiene que ser un entero mayor que cero.",
          });
        }

        if (item.productId.length === 0) {
          ctx.addIssue({
            code: "custom",
            path: ["items", index, "productId"],
            message: "Elige un producto.",
          });
        } else if (!product) {
          ctx.addIssue({
            code: "custom",
            path: ["items", index, "productId"],
            message: "El producto tiene que estar activo y ser tuyo.",
          });
        }

        if (quantity !== null && product) {
          captured.push({ quantity, unitPriceCents: product.priceCents });
        }
      }

      if (captured.length !== data.items.length || data.items.length === 0) {
        return;
      }

      try {
        orderTotalCents(captured);
      } catch {
        ctx.addIssue({
          code: "custom",
          path: ["items"],
          message: "El total del pedido no cabe en un entero.",
        });
      }
    })
    .transform((data) => ({
      customerId: data.customerId,
      notes: data.notes,
      items: data.items.map((item) => {
        const product = products.get(item.productId);
        const quantity = parseOrderQuantity(item.quantity);

        if (!product || quantity === null) {
          throw new Error("El pedido no supera la validación.");
        }

        return {
          productId: product.id,
          productName: product.name,
          quantity,
          unitPriceCents: product.priceCents,
        };
      }),
    }));
}

export function orderFieldErrors(error: z.ZodError): OrderFormState["errors"] {
  const errors: Partial<Record<OrderField, string[]>> = {};

  for (const issue of error.issues) {
    const field = orderIssueField(issue.path);

    if (!field) {
      continue;
    }

    const current = errors[field] ?? [];

    if (!current.includes(issue.message)) {
      current.push(issue.message);
    }

    errors[field] = current;
  }

  return errors;
}

function orderIssueField(path: readonly PropertyKey[]): OrderField | null {
  const head = path[0];

  if (head === "customerId" || head === "notes") {
    return head;
  }

  if (head !== "items") {
    return null;
  }

  const nested = path[2];

  if (nested === "quantity" || nested === "productId") {
    return nested;
  }

  return "items";
}

function textField(value: FormDataEntryValue | null): string {
  return typeof value === "string" ? value : "";
}

export function createOrderFormValues(formData: FormData): {
  customerId: FormDataEntryValue | null;
  notes: string;
  items: { productId: FormDataEntryValue | null; quantity: FormDataEntryValue | null }[];
} {
  const productIds = formData.getAll("productId");
  const quantities = formData.getAll("quantity");
  const length = Math.max(productIds.length, quantities.length);
  const items: { productId: FormDataEntryValue | null; quantity: FormDataEntryValue | null }[] = [];

  for (let index = 0; index < length; index += 1) {
    const productId = productIds[index];
    const quantity = quantities[index];

    items.push({
      productId: typeof productId === "string" ? productId : null,
      quantity: typeof quantity === "string" ? quantity : null,
    });
  }

  return {
    customerId: formData.get("customerId"),
    notes: textField(formData.get("notes")),
    items,
  };
}
