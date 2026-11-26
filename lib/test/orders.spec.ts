import { describe, expect, it } from "vitest";

import {
  orderReadMessage,
  orderTotalCents,
  orderWriteMessage,
  parseOrderQuantity,
  toOrderCustomers,
  toOrderProducts,
} from "../orders";

describe("orderTotalCents", () => {
  it("suma cantidad por el precio unitario capturado, en céntimos", () => {
    expect(
      orderTotalCents([
        { quantity: 2, unitPriceCents: 1250 },
        { quantity: 1, unitPriceCents: 300 },
      ]),
    ).toBe(2800);
    expect(orderTotalCents([])).toBe(0);
    expect(orderTotalCents([{ quantity: 1, unitPriceCents: 1 }])).toBe(1);
  });

  it("rechaza cantidades o precios que no son enteros mayores que cero", () => {
    expect(() => orderTotalCents([{ quantity: 0, unitPriceCents: 100 }])).toThrow(/entero mayor que cero/);
    expect(() => orderTotalCents([{ quantity: -1, unitPriceCents: 100 }])).toThrow(/cantidad/i);
    expect(() => orderTotalCents([{ quantity: 1.5, unitPriceCents: 100 }])).toThrow(/cantidad/i);
    expect(() => orderTotalCents([{ quantity: 1, unitPriceCents: 0 }])).toThrow(/precio unitario/i);
    expect(() => orderTotalCents([{ quantity: 2, unitPriceCents: 12.5 }])).toThrow(/precio unitario/i);
  });

  it("rechaza un total que no cabe en un entero seguro", () => {
    expect(() => orderTotalCents([{ quantity: 2_147_483_647, unitPriceCents: 2_147_483_647 }])).toThrow(
      /no cabe en un entero/,
    );
  });
});

describe("parseOrderQuantity", () => {
  it("acepta enteros mayores que cero y rechaza el resto", () => {
    expect(parseOrderQuantity("1")).toBe(1);
    expect(parseOrderQuantity("10")).toBe(10);
    expect(parseOrderQuantity("2147483647")).toBe(2_147_483_647);
    expect(parseOrderQuantity("0")).toBeNull();
    expect(parseOrderQuantity("1.5")).toBeNull();
    expect(parseOrderQuantity("1,5")).toBeNull();
    expect(parseOrderQuantity("-2")).toBeNull();
    expect(parseOrderQuantity("01")).toBeNull();
    expect(parseOrderQuantity("")).toBeNull();
    expect(parseOrderQuantity("2147483648")).toBeNull();
  });
});

describe("filas del catálogo", () => {
  it("acepta clientes y productos del pedido y descarta un payload inválido", () => {
    expect(toOrderCustomers([{ id: "c1", name: " Ana " }])).toEqual([{ id: "c1", name: "Ana" }]);
    expect(toOrderCustomers([{ id: "c1", name: " " }])).toBeNull();
    expect(
      toOrderProducts([
        { id: "p1", name: "Tarta", price_cents: 1250, active: true },
        { id: "p2", name: "Galleta", price_cents: 400, active: false },
      ]),
    ).toEqual([
      { id: "p1", name: "Tarta", priceCents: 1250, active: true },
      { id: "p2", name: "Galleta", priceCents: 400, active: false },
    ]);
    expect(toOrderProducts([{ id: "p1", name: "Tarta", price_cents: 0, active: true }])).toBeNull();
    expect(toOrderProducts("no-es-una-lista")).toBeNull();
  });
});

describe("mensajes", () => {
  it("explica fallos de lectura y de escritura", () => {
    expect(orderReadMessage()).toMatch(/No se pudieron cargar/);
    expect(orderWriteMessage({ code: "23514" })).toMatch(/Revisa el cliente/);
    expect(orderWriteMessage({ code: "23503" })).toMatch(/ya no está disponible/);
    expect(orderWriteMessage(undefined)).toMatch(/No se pudo guardar el pedido/);
  });
});
