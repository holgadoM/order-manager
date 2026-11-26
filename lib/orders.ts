const MAX_INT = 2_147_483_647;
const POSITIVE_INTEGER = /^[1-9]\d*$/;

export type OrderTotalLine = {
  quantity: number;
  unitPriceCents: number;
};

export type OrderCatalogCustomer = {
  id: string;
  name: string;
};

export type OrderCatalogProduct = {
  id: string;
  name: string;
  priceCents: number;
  active: boolean;
};

export type OrderCatalogResult =
  | { ok: true; customers: OrderCatalogCustomer[]; products: OrderCatalogProduct[] }
  | { ok: false; message: string };

export const ORDER_STATUSES = ["pendiente", "confirmado", "entregado", "cancelado"] as const;

export type OrderStatus = (typeof ORDER_STATUSES)[number];

export type OrderSummary = {
  id: string;
  customerName: string;
  status: OrderStatus;
  totalCents: number;
  createdAtLabel: string;
};

export type OrderLine = {
  id: string;
  productName: string;
  quantity: number;
  unitPriceCents: number;
};

export type OrderDetail = {
  id: string;
  customerName: string;
  status: OrderStatus;
  notes: string | null;
  createdAtLabel: string;
  items: OrderLine[];
  totalCents: number;
};

const NEXT_STATUSES: Record<OrderStatus, readonly OrderStatus[]> = {
  pendiente: ["confirmado", "cancelado"],
  confirmado: ["entregado", "cancelado"],
  entregado: [],
  cancelado: [],
};

const STATUS_LABEL: Record<OrderStatus, string> = {
  pendiente: "Pendiente",
  confirmado: "Confirmado",
  entregado: "Entregado",
  cancelado: "Cancelado",
};

export function parseOrderQuantity(value: string): number | null {
  if (!POSITIVE_INTEGER.test(value)) {
    return null;
  }

  const quantity = Number(value);

  if (!Number.isSafeInteger(quantity) || quantity > MAX_INT) {
    return null;
  }

  return quantity;
}

export function orderTotalCents(lines: readonly OrderTotalLine[]): number {
  let total = 0;

  for (const line of lines) {
    if (!Number.isInteger(line.quantity) || line.quantity <= 0) {
      throw new Error("La cantidad tiene que ser un entero mayor que cero.");
    }

    if (!Number.isInteger(line.unitPriceCents) || line.unitPriceCents <= 0) {
      throw new Error("El precio unitario tiene que ser un entero de céntimos mayor que cero.");
    }

    const lineTotal = line.quantity * line.unitPriceCents;

    if (!Number.isSafeInteger(lineTotal)) {
      throw new Error("El importe de la línea no cabe en un entero.");
    }

    total += lineTotal;

    if (!Number.isSafeInteger(total)) {
      throw new Error("El total del pedido no cabe en un entero.");
    }
  }

  return total;
}

export function isOrderStatus(value: string): value is OrderStatus {
  return (ORDER_STATUSES as readonly string[]).includes(value);
}

export function orderStatusLabel(status: OrderStatus): string {
  return STATUS_LABEL[status];
}

export function nextOrderStatuses(status: OrderStatus): readonly OrderStatus[] {
  return NEXT_STATUSES[status];
}

export function transitionOrderStatus(
  from: OrderStatus,
  to: string,
): { ok: true; status: OrderStatus } | { ok: false; message: string } {
  if (!isOrderStatus(to)) {
    return { ok: false, message: "Ese estado no existe." };
  }

  if (nextOrderStatuses(from).includes(to)) {
    return { ok: true, status: to };
  }

  if (from === "entregado" || from === "cancelado") {
    return {
      ok: false,
      message: `Un pedido ${orderStatusLabel(from).toLowerCase()} no cambia de estado.`,
    };
  }

  return {
    ok: false,
    message: `No se puede pasar de ${orderStatusLabel(from).toLowerCase()} a ${orderStatusLabel(to).toLowerCase()}.`,
  };
}

export function formatOrderDate(value: string): string | null {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  const parts = new Intl.DateTimeFormat("es-ES", {
    timeZone: "Europe/Madrid",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);

  const read = (type: Intl.DateTimeFormatPartTypes) => parts.find((part) => part.type === type)?.value;
  const day = read("day");
  const month = read("month");
  const year = read("year");
  const hour = read("hour");
  const minute = read("minute");

  if (!day || !month || !year || !hour || !minute) {
    return null;
  }

  return `${day}/${month}/${year} ${hour}:${minute}`;
}

export function orderReadMessage(): string {
  return "No se pudieron cargar los clientes o los productos. Inténtalo de nuevo.";
}

export function orderListMessage(): string {
  return "No se pudieron cargar los pedidos. Inténtalo de nuevo.";
}

export function orderMissingMessage(): string {
  return "No encontramos ese pedido.";
}

export function orderStatusWriteMessage(error: unknown): string {
  const code =
    typeof error === "object" && error !== null && "code" in error && typeof error.code === "string"
      ? error.code
      : "";

  if (code === "23514") {
    return "Ese cambio de estado no está permitido.";
  }

  return "No se pudo cambiar el estado. Inténtalo de nuevo.";
}

export function orderWriteMessage(error: unknown): string {
  const code =
    typeof error === "object" && error !== null && "code" in error && typeof error.code === "string"
      ? error.code
      : "";

  if (code === "23514") {
    return "Revisa el cliente, los productos y las cantidades.";
  }

  if (code === "23503") {
    return "El cliente o el producto ya no está disponible.";
  }

  return "No se pudo guardar el pedido. Inténtalo de nuevo.";
}

function readName(value: unknown): string | null {
  if (typeof value !== "string") {
    return null;
  }

  const name = value.trim();

  if (name.length === 0) {
    return null;
  }

  return name;
}

export function toOrderCustomers(value: unknown): OrderCatalogCustomer[] | null {
  if (!Array.isArray(value)) {
    return null;
  }

  const customers: OrderCatalogCustomer[] = [];

  for (const item of value) {
    if (typeof item !== "object" || item === null) {
      return null;
    }

    const row = item as Record<string, unknown>;
    const name = readName(row.name);

    if (typeof row.id !== "string" || name === null) {
      return null;
    }

    customers.push({ id: row.id, name });
  }

  return customers;
}

export function toOrderProducts(value: unknown): OrderCatalogProduct[] | null {
  if (!Array.isArray(value)) {
    return null;
  }

  const products: OrderCatalogProduct[] = [];

  for (const item of value) {
    if (typeof item !== "object" || item === null) {
      return null;
    }

    const row = item as Record<string, unknown>;
    const name = readName(row.name);
    const priceCents = row.price_cents;

    if (
      typeof row.id !== "string" ||
      name === null ||
      typeof priceCents !== "number" ||
      !Number.isInteger(priceCents) ||
      priceCents <= 0 ||
      typeof row.active !== "boolean"
    ) {
      return null;
    }

    products.push({
      id: row.id,
      name,
      priceCents,
      active: row.active,
    });
  }

  return products;
}

function readRecord(value: unknown): Record<string, unknown> | null {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return null;
  }

  return value as Record<string, unknown>;
}

function readCustomerName(value: unknown): string | null {
  if (Array.isArray(value)) {
    const first = value[0];

    if (value.length !== 1 || first === undefined) {
      return null;
    }

    return readCustomerName(first);
  }

  const row = readRecord(value);

  if (!row) {
    return null;
  }

  return readName(row.name);
}

function readNotes(value: unknown): string | null | undefined {
  if (value === null) {
    return null;
  }

  if (typeof value !== "string") {
    return undefined;
  }

  const notes = value.trim();

  return notes.length === 0 ? null : notes;
}

function readPositiveInt(value: unknown): number | null {
  if (typeof value !== "number" || !Number.isInteger(value) || value <= 0) {
    return null;
  }

  return value;
}

function readLineTotals(value: unknown): OrderTotalLine[] | null {
  if (!Array.isArray(value)) {
    return null;
  }

  const lines: OrderTotalLine[] = [];

  for (const item of value) {
    const row = readRecord(item);

    if (!row) {
      return null;
    }

    const quantity = readPositiveInt(row.quantity);
    const unitPriceCents = readPositiveInt(row.unit_price_cents);

    if (quantity === null || unitPriceCents === null) {
      return null;
    }

    lines.push({ quantity, unitPriceCents });
  }

  return lines;
}

function readTotal(lines: readonly OrderTotalLine[]): number | null {
  try {
    return orderTotalCents(lines);
  } catch {
    return null;
  }
}

function readSummaryBase(value: unknown): {
  id: string;
  customerName: string;
  status: OrderStatus;
  createdAtLabel: string;
  lines: OrderTotalLine[];
  totalCents: number;
} | null {
  const row = readRecord(value);

  if (!row || typeof row.id !== "string" || typeof row.status !== "string" || !isOrderStatus(row.status)) {
    return null;
  }

  const customerName = readCustomerName(row.customers);
  const createdAtLabel = typeof row.created_at === "string" ? formatOrderDate(row.created_at) : null;
  const lines = readLineTotals(row.order_items);

  if (!customerName || !createdAtLabel || !lines) {
    return null;
  }

  const totalCents = readTotal(lines);

  if (totalCents === null) {
    return null;
  }

  return {
    id: row.id,
    customerName,
    status: row.status,
    createdAtLabel,
    lines,
    totalCents,
  };
}

export function toOrderSummaries(value: unknown): OrderSummary[] | null {
  if (!Array.isArray(value)) {
    return null;
  }

  const orders: OrderSummary[] = [];

  for (const item of value) {
    const summary = readSummaryBase(item);

    if (!summary) {
      return null;
    }

    orders.push({
      id: summary.id,
      customerName: summary.customerName,
      status: summary.status,
      totalCents: summary.totalCents,
      createdAtLabel: summary.createdAtLabel,
    });
  }

  return orders;
}

export function toOrderDetail(value: unknown): OrderDetail | null {
  const summary = readSummaryBase(value);
  const row = readRecord(value);

  if (!summary || !row || !Array.isArray(row.order_items)) {
    return null;
  }

  const notes = readNotes(row.notes);

  if (notes === undefined) {
    return null;
  }

  const items: OrderLine[] = [];

  for (const item of row.order_items) {
    const line = readRecord(item);
    const productName = line ? readName(line.product_name) : null;
    const quantity = line ? readPositiveInt(line.quantity) : null;
    const unitPriceCents = line ? readPositiveInt(line.unit_price_cents) : null;

    if (!line || typeof line.id !== "string" || !productName || quantity === null || unitPriceCents === null) {
      return null;
    }

    items.push({
      id: line.id,
      productName,
      quantity,
      unitPriceCents,
    });
  }

  return {
    id: summary.id,
    customerName: summary.customerName,
    status: summary.status,
    notes,
    createdAtLabel: summary.createdAtLabel,
    items,
    totalCents: summary.totalCents,
  };
}
