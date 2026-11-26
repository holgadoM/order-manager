import { describe, expect, it } from "vitest";

import { centsToEuros, eurosToCents, toProducts } from "../products";

describe("eurosToCents", () => {
  it("convierte euros con coma o punto a céntimos", () => {
    expect(eurosToCents("12,50")).toBe(1250);
    expect(eurosToCents("12.5")).toBe(1250);
    expect(eurosToCents(" 0,01 ")).toBe(1);
    expect(eurosToCents("7")).toBe(700);
    expect(eurosToCents("00,50")).toBe(50);
  });

  it("rechaza cero, negativos, vacíos y más de dos decimales", () => {
    expect(eurosToCents("0")).toBeNull();
    expect(eurosToCents("0,00")).toBeNull();
    expect(eurosToCents("-1")).toBeNull();
    expect(eurosToCents("")).toBeNull();
    expect(eurosToCents("   ")).toBeNull();
    expect(eurosToCents("abc")).toBeNull();
    expect(eurosToCents("1.234")).toBeNull();
    expect(eurosToCents("12,")).toBeNull();
    expect(eurosToCents("1e2")).toBeNull();
  });

  it("rechaza importes que no caben en un entero de Postgres", () => {
    expect(eurosToCents("21474836,47")).toBe(2_147_483_647);
    expect(eurosToCents("21474836,48")).toBeNull();
  });
});

describe("centsToEuros", () => {
  it("muestra céntimos como euros con dos decimales", () => {
    expect(centsToEuros(1250)).toBe("12,50");
    expect(centsToEuros(1)).toBe("0,01");
    expect(centsToEuros(100)).toBe("1,00");
    expect(centsToEuros(0)).toBe("0,00");
  });

  it("exige un entero", () => {
    expect(() => centsToEuros(12.5)).toThrow(/entero/);
  });
});

describe("toProducts", () => {
  it("acepta filas de producto y descarta un payload inválido", () => {
    expect(
      toProducts([
        { id: "p1", name: "Tarta", price_cents: 1250, active: true },
      ]),
    ).toEqual([{ id: "p1", name: "Tarta", priceCents: 1250, active: true }]);

    expect(toProducts([{ id: "p1", name: " ", price_cents: 1250, active: true }])).toBeNull();
    expect(toProducts("no-es-una-lista")).toBeNull();
  });
});
