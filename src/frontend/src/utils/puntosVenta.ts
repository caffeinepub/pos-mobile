export interface PuntoVenta {
  id: string;
  name: string;
}

const KEY = "pos_puntos_venta";
const SELECTED_KEY = "pos_selected_punto_venta";
const SALE_META_KEY = "pos_sale_meta";
const CTRL_NUM_KEY = "pos_ctrl_num";

export function getPuntosVenta(): PuntoVenta[] {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return JSON.parse(raw) as PuntoVenta[];
  } catch {
    /* noop */
  }
  return [];
}

export function savePuntosVenta(list: PuntoVenta[]): void {
  localStorage.setItem(KEY, JSON.stringify(list));
}

export function addPuntoVenta(name: string): PuntoVenta {
  const pv: PuntoVenta = { id: crypto.randomUUID(), name };
  savePuntosVenta([...getPuntosVenta(), pv]);
  return pv;
}

export function updatePuntoVenta(id: string, name: string): void {
  savePuntosVenta(
    getPuntosVenta().map((p) => (p.id === id ? { ...p, name } : p)),
  );
}

export function deletePuntoVenta(id: string): void {
  savePuntosVenta(getPuntosVenta().filter((p) => p.id !== id));
}

export function getSelectedPuntoVenta(): string {
  return localStorage.getItem(SELECTED_KEY) ?? "";
}

export function saveSelectedPuntoVenta(id: string): void {
  localStorage.setItem(SELECTED_KEY, id);
}

/** Returns the next consecutive control number and increments the counter */
export function getNextCtrlNum(): number {
  const current = Number.parseInt(
    localStorage.getItem(CTRL_NUM_KEY) ?? "0",
    10,
  );
  const next = current + 1;
  localStorage.setItem(CTRL_NUM_KEY, String(next));
  return next;
}

export interface SaleMeta {
  puntoVentaId: string;
  puntoVentaName: string;
  saleDate: string;
  ctrlNum?: number;
}

function getAllSaleMeta(): Record<string, SaleMeta> {
  try {
    const raw = localStorage.getItem(SALE_META_KEY);
    if (raw) return JSON.parse(raw) as Record<string, SaleMeta>;
  } catch {
    /* noop */
  }
  return {};
}

export function getSaleMeta(saleId: string): SaleMeta | null {
  return getAllSaleMeta()[saleId] ?? null;
}

export function saveSaleMeta(saleId: string, meta: SaleMeta): void {
  const all = getAllSaleMeta();
  all[saleId] = meta;
  localStorage.setItem(SALE_META_KEY, JSON.stringify(all));
}
