// Entradas de Mercancía – stored entirely in localStorage

export interface EntradaItem {
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number; // cents
}

export interface EntradaMercanciaTipo {
  id: string;
  name: string;
}

export interface EntradaMercancia {
  id: string;
  date: number; // ms timestamp
  items: EntradaItem[];
  tipoEntradaId: string;
  tipoEntradaNombre: string;
}

const ENTRADAS_KEY = "pos_entradas";
const TIPOS_KEY = "pos_entrada_types";

export function getEntradas(): EntradaMercancia[] {
  try {
    return JSON.parse(
      localStorage.getItem(ENTRADAS_KEY) ?? "[]",
    ) as EntradaMercancia[];
  } catch {
    return [];
  }
}

export function saveEntrada(
  entrada: Omit<EntradaMercancia, "id">,
): EntradaMercancia {
  const all = getEntradas();
  const newEntrada: EntradaMercancia = { ...entrada, id: crypto.randomUUID() };
  all.push(newEntrada);
  localStorage.setItem(ENTRADAS_KEY, JSON.stringify(all));
  return newEntrada;
}

export function deleteEntrada(id: string): void {
  const all = getEntradas().filter((e) => e.id !== id);
  localStorage.setItem(ENTRADAS_KEY, JSON.stringify(all));
}

export function getTiposEntrada(): EntradaMercanciaTipo[] {
  try {
    const stored = JSON.parse(localStorage.getItem(TIPOS_KEY) ?? "null");
    if (Array.isArray(stored) && stored.length > 0)
      return stored as EntradaMercanciaTipo[];
  } catch {
    // ignore
  }
  // Default types
  return [
    { id: "1", name: "IR" },
    { id: "2", name: "Transferencia" },
  ];
}

export function saveTiposEntrada(tipos: EntradaMercanciaTipo[]): void {
  localStorage.setItem(TIPOS_KEY, JSON.stringify(tipos));
}
