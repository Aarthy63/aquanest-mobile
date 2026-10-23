import { describe, expect, it } from "vitest";
import { products } from "./catalog";
import { cartTotals, clampQty, moqShortfalls, unitPrice } from "./pricing";

const purifier = products.find((p) => p.category === "purifiers")!;
const filter = products.find((p) => p.category === "filters")!;

describe("pricing rules", () => {
  it("catalog has at least 50 products", () => {
    expect(products.length).toBeGreaterThanOrEqual(50);
  });

  it("approved dealers get the wholesale price, customers get retail", () => {
    expect(unitPrice(purifier, true)).toBe(purifier.wholesalePrice);
    expect(unitPrice(purifier, false)).toBe(purifier.price);
    expect(purifier.wholesalePrice).toBeLessThan(purifier.price);
  });

  it("charges ₹79 delivery below ₹999 and free delivery from ₹999", () => {
    const small = cartTotals([{ product: { ...filter, price: 500 }, qty: 1 }], false);
    expect(small.delivery).toBe(79);
    expect(small.total).toBe(579);
    const big = cartTotals([{ product: { ...filter, price: 999 }, qty: 1 }], false);
    expect(big.delivery).toBe(0);
  });

  it("flags dealer lines below the minimum order quantity", () => {
    const lines = [{ product: purifier, qty: purifier.moq - 1 }];
    expect(moqShortfalls(lines, true)).toHaveLength(1);
    expect(moqShortfalls(lines, false)).toHaveLength(0);
  });

  it("never allows quantity above stock", () => {
    expect(clampQty(12, 5)).toBe(5);
    expect(clampQty(-2, 5)).toBe(0);
  });
});
