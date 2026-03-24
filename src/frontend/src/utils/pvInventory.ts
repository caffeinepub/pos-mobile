// PV Inventory – items per Punto de Venta, stored in localStorage

export interface PVInventoryItem {
  id: string;
  productCode: string;
  productName: string;
  unit: string;
  pvId: string;
  pvName: string;
  stock: number;
  price: number; // cents
}

const KEY = "pos_pv_inventory";

export function getPVInventory(): PVInventoryItem[] {
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? "[]") as PVInventoryItem[];
  } catch {
    return [];
  }
}

export function savePVInventory(items: PVInventoryItem[]): void {
  localStorage.setItem(KEY, JSON.stringify(items));
}

export function getPVInventoryByPV(pvId: string): PVInventoryItem[] {
  return getPVInventory().filter((i) => i.pvId === pvId);
}

/** If same productCode + pvId exists, ADD quantity to stock; else create new entry */
export function upsertPVItem(
  pvId: string,
  pvName: string,
  code: string,
  name: string,
  unit: string,
  price: number,
  quantity: number,
): void {
  const all = getPVInventory();
  const idx = all.findIndex((i) => i.productCode === code && i.pvId === pvId);
  if (idx >= 0) {
    all[idx] = { ...all[idx], stock: all[idx].stock + quantity };
  } else {
    all.push({
      id: crypto.randomUUID(),
      productCode: code,
      productName: name,
      unit,
      pvId,
      pvName,
      stock: quantity,
      price,
    });
  }
  savePVInventory(all);
}

/** Reduce stock for matching productCode + pvId (min 0) */
export function reducePVStock(
  pvId: string,
  productCode: string,
  quantity: number,
): void {
  const all = getPVInventory().map((i) =>
    i.productCode === productCode && i.pvId === pvId
      ? { ...i, stock: Math.max(0, i.stock - quantity) }
      : i,
  );
  savePVInventory(all);
}

export function deletePVItem(id: string): void {
  savePVInventory(getPVInventory().filter((i) => i.id !== id));
}

export function updatePVItem(
  id: string,
  updates: Partial<Omit<PVInventoryItem, "id">>,
): void {
  savePVInventory(
    getPVInventory().map((i) => (i.id === id ? { ...i, ...updates } : i)),
  );
}
