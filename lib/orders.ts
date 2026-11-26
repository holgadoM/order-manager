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

export function orderReadMessage(): string {
  return "No se pudieron cargar los clientes o los productos. Inténtalo de nuevo.";
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
