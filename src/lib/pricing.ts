import type { Product } from "./catalog";

export const FREE_DELIVERY_THRESHOLD = 999;
export const DELIVERY_FEE = 79;

export interface PricedLine {
  product: Product;
  qty: number;
}

/** Approved dealers pay wholesale; everyone else pays the retail price. */
export function unitPrice(product: Product, isApprovedDealer: boolean) {
  return isApprovedDealer ? product.wholesalePrice : product.price;
}

export function cartTotals(lines: PricedLine[], isApprovedDealer: boolean) {
  const subtotal = lines.reduce((s, l) => s + unitPrice(l.product, isApprovedDealer) * l.qty, 0);
  const mrpTotal = lines.reduce((s, l) => s + l.product.mrp * l.qty, 0);
  const delivery = subtotal === 0 || subtotal >= FREE_DELIVERY_THRESHOLD ? 0 : DELIVERY_FEE;
  return {
    subtotal,
    delivery,
    total: subtotal + delivery,
    savings: Math.max(0, mrpTotal - subtotal),
    itemCount: lines.reduce((s, l) => s + l.qty, 0),
  };
}

/** Dealers must order at least the minimum quantity of each product. */
export function moqShortfalls(lines: PricedLine[], isApprovedDealer: boolean) {
  if (!isApprovedDealer) return [];
  return lines.filter((l) => l.qty < l.product.moq);
}

/** Never allow more than what is in stock. */
export function clampQty(qty: number, stock: number) {
  return Math.max(0, Math.min(Math.floor(qty), stock));
}
