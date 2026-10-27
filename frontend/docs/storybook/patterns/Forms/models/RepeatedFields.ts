export type LineItem = {
  id: string;
  description: string;
  pricing: { quantity: number | null; unitPrice: number | null };
};

export type LineItemsFormValue = { items: LineItem[] };

export function createLineItem(id: string, description = ""): LineItem {
  return { id, description, pricing: { quantity: 1, unitPrice: 10 } };
}

export function lineItemsTotal(items: LineItem[]) {
  return items.reduce((total, item) => total + (item.pricing.quantity ?? 0) * (item.pricing.unitPrice ?? 0), 0);
}
