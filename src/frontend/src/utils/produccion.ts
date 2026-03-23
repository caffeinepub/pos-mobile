// Producción – stored entirely in localStorage

export interface Insumo {
  id: string;
  nombre: string;
  codigo: string;
  cantidad: number;
  unidad: string;
  costoUnitario: number;
  costoTotal: number;
  fechaIngreso: string;
}

export interface InsumoMovimiento {
  id: string;
  insumoId: string;
  tipo: "entrada" | "salida" | "merma";
  cantidad: number;
  motivo: string;
  fecha: string;
  ordenId?: string;
}

export interface FichaInsumo {
  insumoId: string;
  nombreInsumo: string;
  cantidad: number;
  unidad: string;
  costoUnitario: number;
  costoLinea: number;
}

export interface FichaElaboracion {
  id: string;
  nombre: string;
  descripcion: string;
  rendimiento: number;
  unidadProducto: string;
  insumos: FichaInsumo[];
  costoTotal: number;
  costoPorUnidad: number;
  notas: string;
  fechaCreacion: string;
}

export interface OrdenInsumo {
  insumoId: string;
  nombreInsumo: string;
  cantidadRequerida: number;
  cantidadDisponible: number;
  unidad: string;
  costoUnitario: number;
}

export interface OrdenMerma {
  insumoId: string;
  nombreInsumo: string;
  cantidad: number;
  tipoMerma: string;
  observacion: string;
}

export interface OrdenProduccion {
  id: string;
  fichaId: string;
  nombreFicha: string;
  cantidadLotes: number;
  cantidadProducida: number;
  insumosRequeridos: OrdenInsumo[];
  mermas: OrdenMerma[];
  estado: "pendiente" | "en_proceso" | "completado" | "cancelado";
  costoTotal: number;
  costoPorUnidad: number;
  fechaCreacion: string;
  fechaCompletado?: string;
  notas: string;
}

export interface Transferencia {
  id: string;
  cantidad: number;
  fecha: string;
  destino: string;
}

export interface ProductoTerminado {
  id: string;
  ordenId: string;
  fichaId: string;
  nombre: string;
  cantidad: number;
  cantidadDisponible: number;
  costoUnitario: number;
  costoTotal: number;
  fechaProduccion: string;
  transferencias: Transferencia[];
}

const INSUMOS_KEY = "produccion_insumos";
const MOVIMIENTOS_KEY = "produccion_movimientos";
const FICHAS_KEY = "produccion_fichas";
const ORDENES_KEY = "produccion_ordenes";
const TERMINADOS_KEY = "produccion_terminados";
const TIPOS_MERMA_KEY = "produccion_tipos_merma";

function load<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function save<T>(key: string, data: T): void {
  localStorage.setItem(key, JSON.stringify(data));
}

// Insumos
export function getInsumos(): Insumo[] {
  return load<Insumo[]>(INSUMOS_KEY, []);
}
export function saveInsumos(list: Insumo[]): void {
  save(INSUMOS_KEY, list);
}
export function addInsumo(insumo: Omit<Insumo, "id">): Insumo {
  const all = getInsumos();
  const newItem: Insumo = { ...insumo, id: crypto.randomUUID() };
  all.push(newItem);
  saveInsumos(all);
  return newItem;
}
export function updateInsumo(id: string, data: Partial<Insumo>): void {
  const all = getInsumos().map((i) => (i.id === id ? { ...i, ...data } : i));
  saveInsumos(all);
}
export function deleteInsumo(id: string): void {
  saveInsumos(getInsumos().filter((i) => i.id !== id));
}

// Movimientos
export function getMovimientos(): InsumoMovimiento[] {
  return load<InsumoMovimiento[]>(MOVIMIENTOS_KEY, []);
}
export function addMovimiento(mov: Omit<InsumoMovimiento, "id">): void {
  const all = getMovimientos();
  all.push({ ...mov, id: crypto.randomUUID() });
  save(MOVIMIENTOS_KEY, all);
}

// Fichas
export function getFichas(): FichaElaboracion[] {
  return load<FichaElaboracion[]>(FICHAS_KEY, []);
}
export function saveFichas(list: FichaElaboracion[]): void {
  save(FICHAS_KEY, list);
}
export function addFicha(
  ficha: Omit<FichaElaboracion, "id">,
): FichaElaboracion {
  const all = getFichas();
  const newItem: FichaElaboracion = { ...ficha, id: crypto.randomUUID() };
  all.push(newItem);
  saveFichas(all);
  return newItem;
}
export function updateFicha(id: string, data: Partial<FichaElaboracion>): void {
  const all = getFichas().map((f) => (f.id === id ? { ...f, ...data } : f));
  saveFichas(all);
}
export function deleteFicha(id: string): void {
  saveFichas(getFichas().filter((f) => f.id !== id));
}

// Ordenes
export function getOrdenes(): OrdenProduccion[] {
  return load<OrdenProduccion[]>(ORDENES_KEY, []);
}
export function saveOrdenes(list: OrdenProduccion[]): void {
  save(ORDENES_KEY, list);
}
export function addOrden(orden: Omit<OrdenProduccion, "id">): OrdenProduccion {
  const all = getOrdenes();
  const newItem: OrdenProduccion = { ...orden, id: crypto.randomUUID() };
  all.push(newItem);
  saveOrdenes(all);
  return newItem;
}
export function updateOrden(id: string, data: Partial<OrdenProduccion>): void {
  const all = getOrdenes().map((o) => (o.id === id ? { ...o, ...data } : o));
  saveOrdenes(all);
}

// Terminados
export function getTerminados(): ProductoTerminado[] {
  return load<ProductoTerminado[]>(TERMINADOS_KEY, []);
}
export function saveTerminados(list: ProductoTerminado[]): void {
  save(TERMINADOS_KEY, list);
}
export function addTerminado(
  item: Omit<ProductoTerminado, "id">,
): ProductoTerminado {
  const all = getTerminados();
  const newItem: ProductoTerminado = { ...item, id: crypto.randomUUID() };
  all.push(newItem);
  saveTerminados(all);
  return newItem;
}
export function updateTerminado(
  id: string,
  data: Partial<ProductoTerminado>,
): void {
  const all = getTerminados().map((t) => (t.id === id ? { ...t, ...data } : t));
  saveTerminados(all);
}

// Tipos de merma
export function getTiposMerma(): string[] {
  const stored = load<string[] | null>(TIPOS_MERMA_KEY, null);
  if (Array.isArray(stored) && stored.length > 0) return stored;
  return [
    "Evaporación",
    "Desperdicio",
    "Defecto de calidad",
    "Rotura",
    "Vencimiento",
  ];
}
export function saveTiposMerma(tipos: string[]): void {
  save(TIPOS_MERMA_KEY, tipos);
}

// Currency helper
export function getCurrencySymbol(): string {
  try {
    const raw = localStorage.getItem("pos_selected_currency");
    if (!raw) return "";
    const obj = JSON.parse(raw) as { symbol?: string };
    return obj.symbol ?? "";
  } catch {
    return "";
  }
}

export function fmt(value: number): string {
  return value.toFixed(2);
}
