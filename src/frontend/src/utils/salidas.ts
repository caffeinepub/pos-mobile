// Salidas de Mercancía – stored entirely in localStorage

export interface SalidaItem {
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number; // cents
}

export interface SalidaMercanciaTipo {
  id: string;
  name: string;
}

export interface SalidaMercancia {
  id: string;
  date: number; // ms timestamp
  items: SalidaItem[];
  tipoSalidaId: string;
  tipoSalidaNombre: string;
  motivo?: string;
}

const SALIDAS_KEY = "pos_salidas";
const TIPOS_KEY = "pos_salida_types";

export function getSalidas(): SalidaMercancia[] {
  try {
    return JSON.parse(
      localStorage.getItem(SALIDAS_KEY) ?? "[]",
    ) as SalidaMercancia[];
  } catch {
    return [];
  }
}

export function saveSalida(
  salida: Omit<SalidaMercancia, "id">,
): SalidaMercancia {
  const all = getSalidas();
  const newSalida: SalidaMercancia = { ...salida, id: crypto.randomUUID() };
  all.push(newSalida);
  localStorage.setItem(SALIDAS_KEY, JSON.stringify(all));
  return newSalida;
}

export function deleteSalida(id: string): void {
  const all = getSalidas().filter((s) => s.id !== id);
  localStorage.setItem(SALIDAS_KEY, JSON.stringify(all));
}

export function getTiposSalida(): SalidaMercanciaTipo[] {
  try {
    const stored = JSON.parse(localStorage.getItem(TIPOS_KEY) ?? "null");
    if (Array.isArray(stored) && stored.length > 0)
      return stored as SalidaMercanciaTipo[];
  } catch {
    // ignore
  }
  // Default types
  return [
    { id: "1", name: "Merma" },
    { id: "2", name: "Consumo interno" },
    { id: "3", name: "Donación" },
  ];
}

export function saveTiposSalida(tipos: SalidaMercanciaTipo[]): void {
  localStorage.setItem(TIPOS_KEY, JSON.stringify(tipos));
}
