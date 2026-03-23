export type AlmacenCategoria =
  | "Insumos"
  | "Mercanc\u00eda Para la Venta"
  | "Producci\u00f3n terminada"
  | "Consignaci\u00f3n";

export const ALMACEN_CATEGORIAS: AlmacenCategoria[] = [
  "Insumos",
  "Mercanc\u00eda Para la Venta",
  "Producci\u00f3n terminada",
  "Consignaci\u00f3n",
];

export interface Almacen {
  id: string;
  numero: number;
  descripcion: string;
  responsable: string;
  categorias: AlmacenCategoria[];
}

const KEY = "pos_almacenes";

export function getAlmacenes(): Almacen[] {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return JSON.parse(raw) as Almacen[];
  } catch {
    /* noop */
  }
  return [];
}

export function saveAlmacenes(list: Almacen[]): void {
  localStorage.setItem(KEY, JSON.stringify(list));
}

export function addAlmacen(data: Omit<Almacen, "id" | "numero">): Almacen {
  const list = getAlmacenes();
  const maxNum = list.reduce((m, a) => Math.max(m, a.numero), 0);
  const almacen: Almacen = {
    id: crypto.randomUUID(),
    numero: maxNum + 1,
    ...data,
  };
  saveAlmacenes([...list, almacen]);
  return almacen;
}

export function updateAlmacen(
  id: string,
  data: Partial<Omit<Almacen, "id" | "numero">>,
): void {
  saveAlmacenes(
    getAlmacenes().map((a) => (a.id === id ? { ...a, ...data } : a)),
  );
}

export function deleteAlmacen(id: string): void {
  saveAlmacenes(getAlmacenes().filter((a) => a.id !== id));
}
