// Movimientos diarios de productos – almacenados en localStorage

export interface MovimientoDiario {
  productId: string;
  date: string; // YYYY-MM-DD
  entradas: number;
  salidas: number;
}

const KEY = "pos_movimientos_diarios";

export function getMovimientosDiarios(): MovimientoDiario[] {
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? "[]") as MovimientoDiario[];
  } catch {
    return [];
  }
}

export function saveMovimientosDiarios(list: MovimientoDiario[]): void {
  localStorage.setItem(KEY, JSON.stringify(list));
}

export function getMovimientoDelDia(
  productId: string,
  date: string,
): MovimientoDiario | null {
  const all = getMovimientosDiarios();
  return all.find((m) => m.productId === productId && m.date === date) ?? null;
}

export function registrarMovimiento(
  productId: string,
  date: string,
  tipo: "entrada" | "salida",
  cantidad: number,
): void {
  const all = getMovimientosDiarios();
  const idx = all.findIndex(
    (m) => m.productId === productId && m.date === date,
  );
  if (idx >= 0) {
    if (tipo === "entrada") {
      all[idx].entradas += cantidad;
    } else {
      all[idx].salidas += cantidad;
    }
    saveMovimientosDiarios(all);
  } else {
    const nuevo: MovimientoDiario = {
      productId,
      date,
      entradas: tipo === "entrada" ? cantidad : 0,
      salidas: tipo === "salida" ? cantidad : 0,
    };
    saveMovimientosDiarios([...all, nuevo]);
  }
}
