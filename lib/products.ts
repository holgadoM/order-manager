const MAX_PRICE_CENTS = 2_147_483_647;
const EURO_AMOUNT = /^(\d+)(?:[.,](\d{1,2}))?$/;

export type Product = {
  id: string;
  name: string;
  priceCents: number;
  active: boolean;
};

export type ProductListResult =
  | { ok: true; products: Product[] }
  | { ok: false; message: string };

export function eurosToCents(input: string): number | null {
  const match = EURO_AMOUNT.exec(input.trim());

  if (!match) {
    return null;
  }

  const euros = Number(match[1]);
  const fraction = (match[2] ?? "").padEnd(2, "0");

  if (!Number.isSafeInteger(euros)) {
    return null;
  }

  const cents = euros * 100 + Number(fraction);

  if (!Number.isSafeInteger(cents) || cents <= 0 || cents > MAX_PRICE_CENTS) {
    return null;
  }

  return cents;
}

export function centsToEuros(cents: number): string {
  if (!Number.isInteger(cents)) {
    throw new Error("El precio en céntimos tiene que ser un entero.");
  }

  const sign = cents < 0 ? "-" : "";
  const absolute = Math.abs(cents);
  const euros = Math.trunc(absolute / 100);
  const remainder = absolute % 100;

  return `${sign}${euros},${remainder.toString().padStart(2, "0")}`;
}

export function productReadMessage(): string {
  return "No se pudieron cargar los productos. Inténtalo de nuevo.";
}

export function productWriteMessage(error: unknown): string {
  const code =
    typeof error === "object" && error !== null && "code" in error && typeof error.code === "string"
      ? error.code
      : "";

  if (code === "23514") {
    return "Revisa el nombre y el precio. El precio tiene que ser mayor que cero.";
  }

  return "No se pudo guardar el producto. Inténtalo de nuevo.";
}

export function toProducts(value: unknown): Product[] | null {
  if (!Array.isArray(value)) {
    return null;
  }

  const products: Product[] = [];

  for (const item of value) {
    if (typeof item !== "object" || item === null) {
      return null;
    }

    const row = item as Record<string, unknown>;
    const priceCents = row.price_cents;

    if (
      typeof row.id !== "string" ||
      typeof row.name !== "string" ||
      row.name.trim().length === 0 ||
      typeof priceCents !== "number" ||
      !Number.isInteger(priceCents) ||
      priceCents <= 0 ||
      typeof row.active !== "boolean"
    ) {
      return null;
    }

    products.push({
      id: row.id,
      name: row.name,
      priceCents,
      active: row.active,
    });
  }

  return products;
}
