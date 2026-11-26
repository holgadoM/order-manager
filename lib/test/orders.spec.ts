import { describe, expect, it } from "vitest";

import {
  formatOrderDate,
  nextOrderStatuses,
  orderListMessage,
  orderMissingMessage,
  orderReadMessage,
  orderStatusWriteMessage,
  orderTotalCents,
  orderWriteMessage,
  parseOrderQuantity,
  toOrderCustomers,
  toOrderDetail,
  toOrderProducts,
  toOrderSummaries,
  transitionOrderStatus,
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
    expect(orderListMessage()).toMatch(/No se pudieron cargar los pedidos/);
    expect(orderMissingMessage()).toMatch(/No encontramos ese pedido/);
    expect(orderStatusWriteMessage({ code: "23514" })).toMatch(/no está permitido/);
    expect(orderStatusWriteMessage(undefined)).toMatch(/No se pudo cambiar el estado/);
  });
});

describe("transición de estado", () => {
  it("permite pendiente → confirmado, confirmado → entregado y cancelar desde pendiente o confirmado", () => {
    expect(nextOrderStatuses("pendiente")).toEqual(["confirmado", "cancelado"]);
    expect(nextOrderStatuses("confirmado")).toEqual(["entregado", "cancelado"]);
    expect(nextOrderStatuses("entregado")).toEqual([]);
    expect(nextOrderStatuses("cancelado")).toEqual([]);

    expect(transitionOrderStatus("pendiente", "confirmado")).toEqual({ ok: true, status: "confirmado" });
    expect(transitionOrderStatus("confirmado", "entregado")).toEqual({ ok: true, status: "entregado" });
    expect(transitionOrderStatus("pendiente", "cancelado")).toEqual({ ok: true, status: "cancelado" });
    expect(transitionOrderStatus("confirmado", "cancelado")).toEqual({ ok: true, status: "cancelado" });
  });

  it("rechaza un salto, una vuelta atrás y cualquier cambio desde entregado o cancelado", () => {
    expect(transitionOrderStatus("pendiente", "entregado")).toEqual({
      ok: false,
      message: "No se puede pasar de pendiente a entregado.",
    });
    expect(transitionOrderStatus("confirmado", "pendiente")).toEqual({
      ok: false,
      message: "No se puede pasar de confirmado a pendiente.",
    });
    expect(transitionOrderStatus("entregado", "cancelado")).toEqual({
      ok: false,
      message: "Un pedido entregado no cambia de estado.",
    });
    expect(transitionOrderStatus("cancelado", "pendiente")).toEqual({
      ok: false,
      message: "Un pedido cancelado no cambia de estado.",
    });
    expect(transitionOrderStatus("pendiente", "cocinado")).toEqual({
      ok: false,
      message: "Ese estado no existe.",
    });
  });
});

describe("fecha y filas de pedido", () => {
  const createdAt = "2026-11-26T11:46:00.000Z";

  it("formatea la fecha en Europe/Madrid", () => {
    expect(formatOrderDate(createdAt)).toBe("26/11/2026 12:46");
    expect(formatOrderDate("no-es-fecha")).toBeNull();
  });

  it("calcula el total al leer y descarta un payload inválido", () => {
    const row = {
      id: "order-1",
      status: "pendiente",
      notes: "  Sin azúcar  ",
      created_at: createdAt,
      customers: { name: " Ana " },
      order_items: [
        { id: "line-1", product_name: "Tarta", quantity: 2, unit_price_cents: 1250 },
        { id: "line-2", product_name: "Café", quantity: 1, unit_price_cents: 300 },
      ],
    };

    expect(toOrderSummaries([row])).toEqual([
      {
        id: "order-1",
        customerName: "Ana",
        status: "pendiente",
        totalCents: 2800,
        createdAtLabel: "26/11/2026 12:46",
      },
    ]);
    expect(toOrderSummaries([{ ...row, customers: [{ name: "Ana" }] }])?.[0]?.customerName).toBe("Ana");
    expect(toOrderDetail(row)).toMatchObject({
      notes: "Sin azúcar",
      totalCents: 2800,
      items: [
        { id: "line-1", productName: "Tarta", quantity: 2, unitPriceCents: 1250 },
        { id: "line-2", productName: "Café", quantity: 1, unitPriceCents: 300 },
      ],
    });
    expect(toOrderSummaries([{ ...row, status: "enviado" }])).toBeNull();
    expect(toOrderSummaries([{ ...row, order_items: [{ quantity: 0, unit_price_cents: 100 }] }])).toBeNull();
    expect(toOrderDetail({ ...row, order_items: [{ quantity: 1, unit_price_cents: 100 }] })).toBeNull();
  });
});
