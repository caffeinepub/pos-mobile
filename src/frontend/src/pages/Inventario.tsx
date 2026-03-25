import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ArrowLeft,
  ArrowLeftRight,
  Barcode,
  BookOpen,
  CalendarDays,
  ChevronRight,
  FileDown,
  FileUp,
  Filter,
  History,
  LayoutGrid,
  LayoutList,
  MoreVertical,
  Package,
  PackageMinus,
  PackagePlus,
  Pencil,
  Plus,
  Search,
  Trash2,
  Warehouse,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import type { Product } from "../backend.d";
import AddProductoWindow from "../components/AddProductoWindow";
import CatalogProductForm from "../components/CatalogProductForm";
import {
  useCreateProduct,
  useDeleteProduct,
  useProducts,
  useUpdateProduct,
} from "../hooks/useQueries";
import { type Almacen, getAlmacenes } from "../utils/almacenes";
import { buildFileHeader, buildHtmlHeader } from "../utils/businessData";
import { getEntradas } from "../utils/entradas";
import { getSalidas } from "../utils/salidas";
import EntradaMercancia from "./EntradaMercancia";
import SalidaMercancia from "./SalidaMercancia";

// ---------- LocalStorage helpers ----------
interface ProductMeta {
  image: string | null;
  unit: string;
  ubicacionTipo?: "almacen" | "puntoVenta" | "none";
  ubicacionId?: string;
  ubicacionNombre?: string;
  categoria?: string;
}

function getProductMeta(id: bigint): ProductMeta {
  try {
    const raw = localStorage.getItem(`product-meta-${String(id)}`);
    if (raw) return JSON.parse(raw) as ProductMeta;
  } catch {}
  return { image: null, unit: "Unidad" };
}

function setProductMeta(id: bigint, meta: ProductMeta) {
  try {
    localStorage.setItem(`product-meta-${String(id)}`, JSON.stringify(meta));
  } catch {}
}

function removeProductMeta(id: bigint) {
  try {
    localStorage.removeItem(`product-meta-${String(id)}`);
  } catch {}
}

// ---------- XLSX helpers (SpreadsheetML) ----------
function downloadXLS(filename: string, headers: string[], rows: string[][]) {
  const xmlRows = [headers, ...rows]
    .map(
      (row) =>
        `<Row>${row
          .map(
            (cell) =>
              `<Cell><Data ss:Type="String">${String(cell)
                .replace(/&/g, "&amp;")
                .replace(/</g, "&lt;")
                .replace(/>/g, "&gt;")}</Data></Cell>`,
          )
          .join("")}</Row>`,
    )
    .join("\n");
  const xml = `<?xml version="1.0"?><?mso-application progid="Excel.Sheet"?><Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet" xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet"><Worksheet ss:Name="Sheet1"><Table>${xmlRows}</Table></Worksheet></Workbook>`;
  const blob = new Blob([xml], { type: "application/vnd.ms-excel" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function parseXLSText(text: string): string[][] {
  // Parse SpreadsheetML XML rows
  const rows: string[][] = [];
  const rowMatches = text.match(/<Row[^>]*>([\s\S]*?)<\/Row>/gi);
  if (!rowMatches) return rows;
  for (const rowXml of rowMatches) {
    const cellMatches = rowXml.match(/<Data[^>]*>([\s\S]*?)<\/Data>/gi);
    if (!cellMatches) continue;
    const cells = cellMatches.map((c) =>
      c
        .replace(/<Data[^>]*>/i, "")
        .replace(/<\/Data>/i, "")
        .replace(/&amp;/g, "&")
        .replace(/&lt;/g, "<")
        .replace(/&gt;/g, ">")
        .trim(),
    );
    rows.push(cells);
  }
  return rows;
}

// ---------- Warehouse Detail Screen ----------
function WarehouseDetailScreen({
  almacen,
  products,
  onBack,
  onForceUpdate,
}: {
  almacen: Almacen;
  products: Product[];
  onBack: () => void;
  onForceUpdate: () => void;
}) {
  const [showAddProduct, setShowAddProduct] = useState(false);
  const createProduct = useCreateProduct();
  const fileImportRef = useRef<HTMLInputElement>(null);

  const warehouseProducts = products.filter((p) => {
    const meta = getProductMeta(p.id);
    return meta.ubicacionTipo === "almacen" && meta.ubicacionId === almacen.id;
  });

  const CATALOG_HEADERS = [
    "Código del producto",
    "Nombre del Producto",
    "Unidad de medida",
  ];

  const exportCSV = () => {
    const header = buildFileHeader();
    const rows = warehouseProducts.map((p) => {
      const unit = getProductMeta(p.id).unit || "Unidad";
      return `${p.barcode},${p.name},${unit}`;
    });
    const csv = `${header
      .split("\n")
      .map((l) => `# ${l}`)
      .join("\n")}\n${[CATALOG_HEADERS.join(","), ...rows].join("\n")}`;
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `almacen_${almacen.descripcion.replace(/\s+/g, "_")}_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportXLS = () => {
    const rows = warehouseProducts.map((p) => [
      p.barcode,
      p.name,
      getProductMeta(p.id).unit || "Unidad",
    ]);
    downloadXLS(
      `almacen_${almacen.descripcion.replace(/\s+/g, "_")}_${new Date().toISOString().slice(0, 10)}.xls`,
      CATALOG_HEADERS,
      rows,
    );
  };

  const exportPDF = () => {
    const htmlHeader = buildHtmlHeader();
    const rows = warehouseProducts
      .map((p) => {
        const unit = getProductMeta(p.id).unit || "Unidad";
        return `<tr><td>${p.barcode}</td><td>${p.name}</td><td>${unit}</td></tr>`;
      })
      .join("");
    const html = `<html><head><title>Almacén: ${almacen.descripcion}</title><style>body{font-family:sans-serif;padding:20px}table{width:100%;border-collapse:collapse}th,td{border:1px solid #ddd;padding:8px;text-align:left}th{background:#0B2040;color:white}.header{margin-bottom:16px;padding:12px;background:#f5f5f5;border-radius:6px}</style></head><body><div class="header">${htmlHeader}</div><h2>Almacén: ${almacen.descripcion}</h2><table><thead><tr><th>Código</th><th>Nombre</th><th>Unidad</th></tr></thead><tbody>${rows}</tbody></table></body></html>`;
    const win = window.open("", "_blank");
    if (win) {
      win.document.write(html);
      win.document.close();
      win.print();
    }
  };

  const handleImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";
    try {
      const text = await file.text();
      let dataRows: string[][];

      const isXLS =
        file.name.toLowerCase().endsWith(".xls") ||
        file.name.toLowerCase().endsWith(".xlsx");

      if (isXLS && text.includes("<Row")) {
        // SpreadsheetML format
        dataRows = parseXLSText(text);
        // skip header row if it looks like the header
        if (
          dataRows.length > 0 &&
          dataRows[0][0]?.toLowerCase().includes("código")
        ) {
          dataRows = dataRows.slice(1);
        }
      } else if (isXLS) {
        toast.warning(
          "Para importar XLSX usa el formato .xls exportado desde esta app, o usa CSV",
        );
        return;
      } else {
        // CSV
        const lines = text
          .split("\n")
          .map((l) => l.trim())
          .filter((l) => l && !l.startsWith("#"));
        let headerSkipped = false;
        const filteredLines: string[] = [];
        for (const line of lines) {
          if (!headerSkipped && line.toLowerCase().startsWith("código")) {
            headerSkipped = true;
            continue;
          }
          filteredLines.push(line);
        }
        dataRows = filteredLines.map((l) => l.split(",").map((c) => c.trim()));
      }

      let imported = 0;
      let errors = 0;
      for (const cols of dataRows) {
        const codProd = cols[0] ?? "";
        const nameProd = cols[1] ?? "";
        const unitProd = cols[2] ?? "Unidad";
        if (!nameProd) {
          errors++;
          continue;
        }
        try {
          const newId = await createProduct.mutateAsync({
            name: nameProd,
            price: BigInt(0),
            barcode: codProd,
            stock: BigInt(0),
          });
          setProductMeta(newId, {
            image: null,
            unit: unitProd || "Unidad",
            ubicacionTipo: "almacen",
            ubicacionId: almacen.id,
            ubicacionNombre: almacen.descripcion,
          });
          imported++;
        } catch {
          errors++;
        }
      }

      onForceUpdate();
      if (imported > 0)
        toast.success(
          `${imported} producto${imported !== 1 ? "s" : ""} importado${imported !== 1 ? "s" : ""} correctamente`,
        );
      if (errors > 0)
        toast.warning(
          `${errors} fila${errors !== 1 ? "s" : ""} no se pudo${errors !== 1 ? "eron" : ""} importar`,
        );
    } catch {
      toast.error("Error al leer el archivo");
    }
  };

  return (
    <div className="absolute inset-0 z-10 bg-background flex flex-col">
      {/* Top bar */}
      <div className="flex items-center px-4 py-3 border-b border-border shrink-0">
        <button
          type="button"
          onClick={onBack}
          className="flex items-center gap-2 text-sm font-medium text-foreground flex-1"
          data-ocid="almacenes.back.button"
        >
          <ArrowLeft size={18} />
          <span className="truncate">{almacen.descripcion}</span>
        </button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className="p-2 rounded-lg hover:bg-muted transition-colors ml-2"
              data-ocid="almacenes.dropdown_menu"
            >
              <MoreVertical size={18} className="text-muted-foreground" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem onClick={() => fileImportRef.current?.click()}>
              <FileUp size={14} className="mr-2" /> Importar CSV
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => fileImportRef.current?.click()}>
              <FileUp size={14} className="mr-2" /> Importar XLSX
            </DropdownMenuItem>
            <DropdownMenuItem onClick={exportCSV}>
              <FileDown size={14} className="mr-2" /> Exportar CSV
            </DropdownMenuItem>
            <DropdownMenuItem onClick={exportXLS}>
              <FileDown size={14} className="mr-2" /> Exportar XLSX
            </DropdownMenuItem>
            <DropdownMenuItem onClick={exportPDF}>
              <FileDown size={14} className="mr-2" /> Exportar PDF
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        <input
          ref={fileImportRef}
          type="file"
          accept=".csv,.xls,.xlsx"
          className="hidden"
          onChange={handleImportFile}
        />
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden flex flex-col relative">
        {showAddProduct ? (
          <div className="absolute inset-0 bg-background z-20 flex flex-col">
            <AddProductoWindow
              mode="almacen"
              onClose={() => setShowAddProduct(false)}
              onSaved={() => {
                setShowAddProduct(false);
                onForceUpdate();
              }}
              initialAlmacenId={almacen.id}
            />
          </div>
        ) : (
          <>
            <ScrollArea className="flex-1">
              {warehouseProducts.length === 0 ? (
                <div
                  className="flex flex-col items-center justify-center py-16 gap-3 px-6"
                  data-ocid="almacenes.detail.empty_state"
                >
                  <Package size={40} className="text-muted-foreground/40" />
                  <p className="text-sm text-muted-foreground text-center">
                    No hay productos en este almacén.
                    <br />
                    Toca + para agregar.
                  </p>
                </div>
              ) : (
                <div className="px-4 pt-4 pb-24 space-y-2">
                  {warehouseProducts.map((p, idx) => {
                    const meta = getProductMeta(p.id);
                    return (
                      <div
                        key={String(p.id)}
                        data-ocid={`almacenes.item.${idx + 1}`}
                        className="bg-card border border-border rounded-xl px-4 py-3 flex items-center gap-3 shadow-xs"
                      >
                        <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                          <Package size={16} className="text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-sm truncate">
                            {p.name}
                          </p>
                          {p.barcode && (
                            <div className="flex items-center gap-1 mt-0.5">
                              <Barcode
                                size={11}
                                className="text-muted-foreground"
                              />
                              <span className="text-xs text-muted-foreground">
                                {p.barcode}
                              </span>
                            </div>
                          )}
                        </div>
                        <span className="text-xs text-muted-foreground shrink-0">
                          {meta.unit || "Unidad"}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </ScrollArea>

            {/* FAB */}
            <button
              type="button"
              onClick={() => setShowAddProduct(true)}
              className="absolute bottom-5 right-5 w-14 h-14 rounded-full bg-primary shadow-lg flex items-center justify-center hover:bg-primary/90 active:scale-95 transition-all z-10"
              data-ocid="almacenes.primary_button"
              aria-label="Agregar producto"
            >
              <Plus size={26} className="text-primary-foreground" />
            </button>
          </>
        )}
      </div>
    </div>
  );
}

// ---------- Historial de Movimientos ----------
function HistorialMovimientos() {
  const [expanded, setExpanded] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"list" | "grid">("list");
  const [filterText, setFilterText] = useState("");
  const [filterTipo, setFilterTipo] = useState<"todos" | "entrada" | "salida">(
    "todos",
  );
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [calendarOpen, setCalendarOpen] = useState(false);

  const entradas = getEntradas();
  const salidas = getSalidas();

  type MovimientoItem = {
    id: string;
    date: number;
    tipo: "entrada" | "salida";
    tipoNombre: string;
    destinoNombre: string;
    numProductos: number;
    totalValor: number;
    items: { productName: string; quantity: number; unitPrice: number }[];
  };

  const allMovimientos: MovimientoItem[] = [
    ...entradas.map((e) => ({
      id: e.id,
      date: e.date,
      tipo: "entrada" as const,
      tipoNombre: e.tipoEntradaNombre,
      destinoNombre: e.destinoNombre ?? "Sin destino",
      numProductos: e.items.length,
      totalValor: e.items.reduce((s, i) => s + i.unitPrice * i.quantity, 0),
      items: e.items.map((i) => ({
        productName: i.productName,
        quantity: i.quantity,
        unitPrice: i.unitPrice,
      })),
    })),
    ...salidas.map((s) => ({
      id: s.id,
      date: s.date,
      tipo: "salida" as const,
      tipoNombre: s.tipoSalidaNombre,
      destinoNombre: s.destinoNombre ?? "Sin destino",
      numProductos: s.items.length,
      totalValor: s.items.reduce((sum, i) => sum + i.unitPrice * i.quantity, 0),
      items: s.items.map((i) => ({
        productName: i.productName,
        quantity: i.quantity,
        unitPrice: i.unitPrice,
      })),
    })),
  ].sort((a, b) => b.date - a.date);

  const movimientos = allMovimientos.filter((mov) => {
    if (filterTipo !== "todos" && mov.tipo !== filterTipo) return false;
    if (selectedDate) {
      const movDate = new Date(mov.date);
      if (
        movDate.getFullYear() !== selectedDate.getFullYear() ||
        movDate.getMonth() !== selectedDate.getMonth() ||
        movDate.getDate() !== selectedDate.getDate()
      )
        return false;
    }
    if (filterText.trim()) {
      const q = filterText.toLowerCase();
      if (
        !mov.destinoNombre.toLowerCase().includes(q) &&
        !mov.tipoNombre.toLowerCase().includes(q) &&
        !mov.items.some((i) => i.productName.toLowerCase().includes(q))
      )
        return false;
    }
    return true;
  });

  const exportCSV = () => {
    const rows = movimientos.map((mov) =>
      [
        mov.tipo === "entrada" ? "Entrada" : "Salida",
        mov.tipoNombre,
        mov.destinoNombre,
        new Date(mov.date).toLocaleDateString("es-ES"),
        mov.numProductos,
        (mov.totalValor / 100).toFixed(2),
        mov.items.map((i) => `${i.productName}(x${i.quantity})`).join("; "),
      ].join(","),
    );
    const csv = [
      "Tipo,Categoría,Destino,Fecha,Productos,Importe,Detalle",
      ...rows,
    ].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `historial_movimientos_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportPDF = () => {
    const rows = movimientos
      .map(
        (mov) =>
          `<tr><td>${mov.tipo === "entrada" ? "Entrada" : "Salida"}</td><td>${mov.tipoNombre}</td><td>${mov.destinoNombre}</td><td>${new Date(mov.date).toLocaleDateString("es-ES")}</td><td>${mov.numProductos}</td><td>$${(mov.totalValor / 100).toFixed(2)}</td></tr>`,
      )
      .join("");
    const html = `<html><head><title>Historial de Movimientos</title><style>body{font-family:sans-serif;padding:20px}table{width:100%;border-collapse:collapse}th,td{border:1px solid #ddd;padding:8px;text-align:left}th{background:#0B2040;color:white}</style></head><body><h2>Historial de Movimientos</h2><table><thead><tr><th>Tipo</th><th>Categoría</th><th>Destino</th><th>Fecha</th><th>#Prod</th><th>Importe</th></tr></thead><tbody>${rows}</tbody></table></body></html>`;
    const win = window.open("", "_blank");
    if (win) {
      win.document.write(html);
      win.document.close();
      win.print();
    }
  };

  if (allMovimientos.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center py-16 px-4">
        <div
          className="text-center"
          data-ocid="inventario.historial.empty_state"
        >
          <Package
            size={40}
            className="mx-auto text-muted-foreground/30 mb-3"
          />
          <p className="text-muted-foreground text-sm">
            No hay movimientos registrados
          </p>
          <p className="text-xs text-muted-foreground/60 mt-1">
            Las entradas y salidas de mercancía aparecerán aquí
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      {/* Toolbar */}
      <div className="px-4 pt-3 pb-2 space-y-2 shrink-0">
        <div className="flex items-center gap-2">
          {/* Search input - BEFORE filter */}
          <div className="relative flex-1">
            <Search
              size={13}
              className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground"
            />
            <Input
              placeholder="Buscar..."
              value={filterText}
              onChange={(e) => setFilterText(e.target.value)}
              className="pl-7 h-9 text-xs"
            />
          </div>

          {/* Filter by tipo */}
          <Select
            value={filterTipo}
            onValueChange={(v) =>
              setFilterTipo(v as "todos" | "entrada" | "salida")
            }
          >
            <SelectTrigger className="h-9 text-xs w-[110px] shrink-0">
              <Filter size={13} className="mr-1 shrink-0" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos</SelectItem>
              <SelectItem value="entrada">Entradas</SelectItem>
              <SelectItem value="salida">Salidas</SelectItem>
            </SelectContent>
          </Select>

          {/* Calendar picker */}
          <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
            <PopoverTrigger asChild>
              <Button
                variant={selectedDate ? "default" : "outline"}
                size="sm"
                className="h-9 px-2 shrink-0"
              >
                <CalendarDays size={15} />
                {selectedDate && (
                  <span className="ml-1 text-xs">
                    {selectedDate.toLocaleDateString("es-ES", {
                      day: "2-digit",
                      month: "2-digit",
                    })}
                  </span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="end">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={(d) => {
                  setSelectedDate(d);
                  setCalendarOpen(false);
                }}
                initialFocus
              />
              {selectedDate && (
                <div className="p-2 border-t">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full text-xs"
                    onClick={() => setSelectedDate(undefined)}
                  >
                    Quitar filtro de fecha
                  </Button>
                </div>
              )}
            </PopoverContent>
          </Popover>

          {/* View toggle */}
          <div className="flex border border-border rounded-lg overflow-hidden shrink-0">
            <button
              type="button"
              onClick={() => setViewMode("list")}
              className={`p-2 transition-colors ${viewMode === "list" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted"}`}
            >
              <LayoutList size={15} />
            </button>
            <button
              type="button"
              onClick={() => setViewMode("grid")}
              className={`p-2 transition-colors ${viewMode === "grid" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted"}`}
            >
              <LayoutGrid size={15} />
            </button>
          </div>

          {/* Export menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="h-9 w-9 p-0 shrink-0"
              >
                <MoreVertical size={15} />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={exportCSV}>
                <FileDown size={14} className="mr-2" /> Exportar CSV
              </DropdownMenuItem>
              <DropdownMenuItem onClick={exportPDF}>
                <FileDown size={14} className="mr-2" /> Exportar PDF
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        <p className="text-xs text-muted-foreground">
          {movimientos.length} movimiento{movimientos.length !== 1 ? "s" : ""}
        </p>
      </div>

      {movimientos.length === 0 ? (
        <div className="flex-1 flex items-center justify-center py-8 px-4">
          <div className="text-center">
            <Package
              size={32}
              className="mx-auto text-muted-foreground/30 mb-2"
            />
            <p className="text-muted-foreground text-sm">Sin resultados</p>
          </div>
        </div>
      ) : viewMode === "list" ? (
        <ScrollArea className="flex-1">
          <div className="px-4 py-2 space-y-2">
            {movimientos.map((mov, idx) => (
              <div
                key={mov.id}
                data-ocid={`inventario.historial.item.${idx + 1}`}
                className="bg-card border border-border rounded-xl overflow-hidden shadow-xs"
              >
                <button
                  type="button"
                  onClick={() =>
                    setExpanded(expanded === mov.id ? null : mov.id)
                  }
                  className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-muted/50 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span
                        className={`text-xs font-semibold px-2 py-0.5 rounded-full ${mov.tipo === "entrada" ? "bg-emerald-100 text-emerald-700" : "bg-orange-100 text-orange-700"}`}
                      >
                        {mov.tipo === "entrada" ? "Entrada" : "Salida"}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {mov.tipoNombre}
                      </span>
                    </div>
                    <p className="text-sm font-medium truncate mt-1">
                      {mov.destinoNombre}
                    </p>
                    <div className="flex items-center gap-3 mt-0.5">
                      <span className="text-xs text-muted-foreground">
                        {new Date(mov.date).toLocaleDateString("es-ES", {
                          day: "2-digit",
                          month: "2-digit",
                          year: "numeric",
                        })}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {mov.numProductos} prod.
                      </span>
                      <span className="text-xs font-semibold ml-auto">
                        ${(mov.totalValor / 100).toFixed(2)}
                      </span>
                    </div>
                  </div>
                  <ChevronRight
                    size={16}
                    className={`text-muted-foreground shrink-0 transition-transform ${expanded === mov.id ? "rotate-90" : ""}`}
                  />
                </button>
                {expanded === mov.id && (
                  <div className="border-t border-border px-4 py-3 space-y-1.5 bg-muted/30">
                    {mov.items.map((item) => (
                      <div
                        key={`${item.productName}-${item.quantity}`}
                        className="flex items-center justify-between text-sm"
                      >
                        <span className="text-foreground truncate flex-1 mr-2">
                          {item.productName}
                        </span>
                        <span className="text-muted-foreground text-xs shrink-0">
                          x{item.quantity} · $
                          {(item.unitPrice / 100).toFixed(2)}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </ScrollArea>
      ) : (
        <ScrollArea className="flex-1">
          <div className="px-4 py-2 grid grid-cols-2 gap-2">
            {movimientos.map((mov, idx) => (
              <div
                key={mov.id}
                data-ocid={`inventario.historial.grid.${idx + 1}`}
                className="bg-card border border-border rounded-xl p-3 shadow-xs flex flex-col gap-1"
              >
                <span
                  className={`text-xs font-semibold px-2 py-0.5 rounded-full self-start ${mov.tipo === "entrada" ? "bg-emerald-100 text-emerald-700" : "bg-orange-100 text-orange-700"}`}
                >
                  {mov.tipo === "entrada" ? "Entrada" : "Salida"}
                </span>
                <p className="text-xs font-medium truncate mt-1">
                  {mov.destinoNombre}
                </p>
                <p className="text-xs text-muted-foreground truncate">
                  {mov.tipoNombre}
                </p>
                <p className="text-xs text-muted-foreground">
                  {new Date(mov.date).toLocaleDateString("es-ES", {
                    day: "2-digit",
                    month: "2-digit",
                    year: "numeric",
                  })}
                </p>
                <p className="text-xs font-semibold mt-auto">
                  ${(mov.totalValor / 100).toFixed(2)}
                </p>
              </div>
            ))}
          </div>
        </ScrollArea>
      )}
    </div>
  );
}

// ---------- Almacenes Tab ----------
function AlmacenesTab() {
  const { data: products = [] } = useProducts();
  const almacenes: Almacen[] = getAlmacenes();
  const [selectedAlmacen, setSelectedAlmacen] = useState<Almacen | null>(null);
  const [, forceUpdate] = useState(0);

  if (almacenes.length === 0) {
    return (
      <div
        data-ocid="almacenes.empty_state"
        className="flex flex-col items-center justify-center py-16 gap-3 px-6"
      >
        <Warehouse size={40} className="text-muted-foreground/40" />
        <p className="text-sm text-muted-foreground text-center">
          No hay almacenes configurados. Ve a{" "}
          <strong>Configuración › Almacenes</strong> para agregar almacenes.
        </p>
      </div>
    );
  }

  return (
    <div className="relative flex-1 overflow-hidden flex flex-col">
      {/* Warehouse list */}
      <ScrollArea className="flex-1">
        <div className="px-4 pt-4 pb-6 space-y-3">
          {almacenes.map((a, idx) => {
            const count = products.filter((p) => {
              const meta = getProductMeta(p.id);
              return (
                meta.ubicacionTipo === "almacen" && meta.ubicacionId === a.id
              );
            }).length;

            return (
              <button
                key={a.id}
                type="button"
                data-ocid={`almacenes.item.${idx + 1}`}
                onClick={() => setSelectedAlmacen(a)}
                className="w-full bg-card border border-border rounded-xl px-4 py-3 flex items-center gap-3 shadow-xs hover:border-primary/40 hover:bg-primary/5 active:scale-[0.99] transition-all text-left"
              >
                <Badge
                  variant="secondary"
                  className="text-xs font-mono px-2 py-0.5 shrink-0"
                >
                  #{a.numero}
                </Badge>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm text-foreground truncate">
                    {a.descripcion}
                  </p>
                  {a.responsable && (
                    <p className="text-xs text-muted-foreground truncate">
                      {a.responsable}
                    </p>
                  )}
                  {a.categorias.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1">
                      {a.categorias.map((cat) => (
                        <Badge
                          key={cat}
                          variant="outline"
                          className="text-xs px-1.5 py-0"
                        >
                          {cat}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Badge className="text-xs">{count}</Badge>
                  <ChevronRight size={16} className="text-muted-foreground" />
                </div>
              </button>
            );
          })}
        </div>
      </ScrollArea>

      {/* Warehouse detail overlay */}
      {selectedAlmacen && (
        <WarehouseDetailScreen
          almacen={selectedAlmacen}
          products={products}
          onBack={() => setSelectedAlmacen(null)}
          onForceUpdate={() => forceUpdate((n) => n + 1)}
        />
      )}
    </div>
  );
}

// ---------- Tab definitions ----------
const INV_TABS = [
  {
    id: "catalogo" as const,
    label: "Catálogo de Productos",
    icon: <BookOpen size={14} />,
  },
  {
    id: "movimientos" as const,
    label: "Movimientos",
    icon: <ArrowLeftRight size={14} />,
  },
  {
    id: "almacenes" as const,
    label: "Almacenes",
    icon: <Warehouse size={14} />,
  },
];

type InvTabId = "catalogo" | "movimientos" | "almacenes";

// ---------- Inventario Page ----------
interface InventarioProps {
  openAdd?: boolean;
  onAddComplete?: () => void;
  activeTab?: InvTabId;
  onTabChange?: (tab: string) => void;
}

export default function Inventario({
  openAdd,
  onAddComplete,
  activeTab: activeTabProp,
  onTabChange,
}: InventarioProps) {
  const { data: products = [], isLoading } = useProducts();
  const deleteProduct = useDeleteProduct();
  const createProduct = useCreateProduct();
  const [showProductScreen, setShowProductScreen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [, forceUpdate] = useState(0);
  const [viewMode, setViewMode] = useState<"list" | "grid">("list");
  const [catalogCalendarOpen, setCatalogCalendarOpen] = useState(false);
  const [catalogDate, setCatalogDate] = useState<Date | undefined>(undefined);
  const [internalTab, setInternalTab] = useState<InvTabId>("catalogo");
  const [movimientosTab, setMovimientosTab] = useState<
    "historial" | "entrada" | "salida"
  >("historial");

  const activeTab: InvTabId = activeTabProp ?? internalTab;

  const setActiveTab = (tab: InvTabId) => {
    setInternalTab(tab);
    onTabChange?.(tab);
  };

  // biome-ignore lint/correctness/useExhaustiveDependencies: sync prop
  useEffect(() => {
    if (activeTabProp && activeTabProp !== internalTab) {
      setInternalTab(activeTabProp);
    }
  }, [activeTabProp]);

  // biome-ignore lint/correctness/useExhaustiveDependencies: controlled by openAdd
  useEffect(() => {
    if (openAdd) {
      setInternalTab("catalogo");
      onTabChange?.("catalogo");
      setEditingProduct(null);
      setShowProductScreen(true);
    }
  }, [openAdd]);

  const fileInputRef2 = useRef<HTMLInputElement>(null);
  const fileXLSRef = useRef<HTMLInputElement>(null);

  const filteredProducts = searchTerm
    ? products.filter(
        (p) =>
          p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          p.barcode.toLowerCase().includes(searchTerm.toLowerCase()),
      )
    : products;

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    setShowProductScreen(true);
  };

  const handleDelete = async (product: Product) => {
    if (!window.confirm(`¿Eliminar "${product.name}"?`)) return;
    try {
      await deleteProduct.mutateAsync(product.id);
      removeProductMeta(product.id);
      toast.success("Producto eliminado");
    } catch {
      toast.error("Error al eliminar el producto");
    }
  };

  const handleModalClose = useCallback(() => {
    setShowProductScreen(false);
    setEditingProduct(null);
  }, []);

  const CATALOG_HEADERS = [
    "Código del producto",
    "Nombre del Producto",
    "Unidad de medida",
  ];

  const exportCSV = () => {
    const header = buildFileHeader();
    const rows = filteredProducts.map((p) => {
      const unit = getProductMeta(p.id).unit || "Unidad";
      return `${p.barcode},${p.name},${unit}`;
    });
    const csv = `${header
      .split("\n")
      .map((l) => `# ${l}`)
      .join("\n")}\n${[CATALOG_HEADERS.join(","), ...rows].join("\n")}`;
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `catalogo_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportXLS = () => {
    const rows = filteredProducts.map((p) => [
      p.barcode,
      p.name,
      getProductMeta(p.id).unit || "Unidad",
    ]);
    downloadXLS(
      `catalogo_${new Date().toISOString().slice(0, 10)}.xls`,
      CATALOG_HEADERS,
      rows,
    );
  };

  const exportPDF = () => {
    const htmlHeader = buildHtmlHeader();
    const rows = filteredProducts
      .map((p) => {
        const unit = getProductMeta(p.id).unit || "Unidad";
        return `<tr><td>${p.barcode}</td><td>${p.name}</td><td>${unit}</td></tr>`;
      })
      .join("");
    const html = `<html><head><title>Catálogo de Productos</title><style>body{font-family:sans-serif;padding:20px}table{width:100%;border-collapse:collapse}th,td{border:1px solid #ddd;padding:8px;text-align:left}th{background:#0B2040;color:white}.header{margin-bottom:16px;padding:12px;background:#f5f5f5;border-radius:6px}</style></head><body><div class="header">${htmlHeader}</div><h2>Catálogo de Productos</h2><table><thead><tr><th>Código</th><th>Nombre</th><th>Unidad</th></tr></thead><tbody>${rows}</tbody></table></body></html>`;
    const win = window.open("", "_blank");
    if (win) {
      win.document.write(html);
      win.document.close();
      win.print();
    }
  };

  const importCSV = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";
    try {
      const text = await file.text();
      const lines = text.split("\n");
      let imported = 0;
      let errors = 0;
      let headerSkipped = false;

      for (const rawLine of lines) {
        const line = rawLine.trim();
        if (!line) continue;
        if (line.startsWith("#")) continue;
        if (!headerSkipped && line.toLowerCase().startsWith("código")) {
          headerSkipped = true;
          continue;
        }

        const cols = line.split(",").map((c) => c.trim());
        const codProd = cols[0] ?? "";
        const nameProd = cols[1] ?? "";
        const unitProd = cols[2] ?? "Unidad";

        if (!nameProd) {
          errors++;
          continue;
        }

        try {
          const newId = await createProduct.mutateAsync({
            name: nameProd,
            price: BigInt(0),
            barcode: codProd,
            stock: BigInt(0),
          });
          setProductMeta(newId, { image: null, unit: unitProd || "Unidad" });
          imported++;
        } catch {
          errors++;
        }
      }

      forceUpdate((n) => n + 1);
      if (imported > 0) {
        toast.success(
          `${imported} producto${imported !== 1 ? "s" : ""} importado${imported !== 1 ? "s" : ""} correctamente`,
        );
      }
      if (errors > 0) {
        toast.warning(
          `${errors} fila${errors !== 1 ? "s" : ""} no se pudo${errors !== 1 ? "eron" : ""} importar`,
        );
      }
    } catch {
      toast.error("Error al leer el archivo CSV");
    }
  };

  const importXLS = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";
    try {
      const text = await file.text();
      if (!text.includes("<Row")) {
        toast.warning(
          "Para importar XLSX usa el formato .xls exportado desde esta app, o usa CSV",
        );
        return;
      }
      let dataRows = parseXLSText(text);
      if (
        dataRows.length > 0 &&
        dataRows[0][0]?.toLowerCase().includes("código")
      ) {
        dataRows = dataRows.slice(1);
      }
      let imported = 0;
      let errors = 0;
      for (const cols of dataRows) {
        const codProd = cols[0] ?? "";
        const nameProd = cols[1] ?? "";
        const unitProd = cols[2] ?? "Unidad";
        if (!nameProd) {
          errors++;
          continue;
        }
        try {
          const newId = await createProduct.mutateAsync({
            name: nameProd,
            price: BigInt(0),
            barcode: codProd,
            stock: BigInt(0),
          });
          setProductMeta(newId, { image: null, unit: unitProd || "Unidad" });
          imported++;
        } catch {
          errors++;
        }
      }
      forceUpdate((n) => n + 1);
      if (imported > 0)
        toast.success(
          `${imported} producto${imported !== 1 ? "s" : ""} importado${imported !== 1 ? "s" : ""} correctamente`,
        );
      if (errors > 0)
        toast.warning(
          `${errors} fila${errors !== 1 ? "s" : ""} no se pudo${errors !== 1 ? "eron" : ""} importar`,
        );
    } catch {
      toast.error("Error al leer el archivo");
    }
  };

  // Handle add-new-product request from EntradaMercancia (inside Movimientos tab)
  const handleAddNewProductFromEntrada = useCallback(() => {
    setInternalTab("catalogo");
    onTabChange?.("catalogo");
    setEditingProduct(null);
    setShowProductScreen(true);
  }, [onTabChange]);

  return (
    <div className="flex flex-col flex-1 overflow-hidden relative">
      {/* Tab bar */}
      <div className="border-b border-border bg-background shrink-0">
        <div
          className="flex overflow-x-auto scrollbar-hide"
          data-ocid="inventario.tab"
        >
          {INV_TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              data-ocid={`inventario.${tab.id}.tab`}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 px-3 py-2.5 text-xs font-medium whitespace-nowrap transition-colors border-b-2 shrink-0 ${
                activeTab === tab.id
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab: Catálogo de Productos */}
      {activeTab === "catalogo" && (
        <div className="relative flex-1 overflow-hidden flex flex-col">
          <div className="px-4 pb-6 pt-4 flex-1 overflow-hidden flex flex-col">
            {/* Unified Toolbar */}
            <div className="flex items-center gap-2 mb-3 shrink-0">
              {/* Search input */}
              <div className="relative flex-1">
                <Search
                  size={13}
                  className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground"
                />
                <input
                  type="text"
                  placeholder="Buscar por nombre o código..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full h-9 border border-border rounded-lg pl-7 pr-3 text-xs bg-background outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>
              {/* Calendar picker */}
              <Popover
                open={catalogCalendarOpen}
                onOpenChange={setCatalogCalendarOpen}
              >
                <PopoverTrigger asChild>
                  <Button
                    variant={catalogDate ? "default" : "outline"}
                    size="sm"
                    className="h-9 px-2 shrink-0"
                  >
                    <CalendarDays size={15} />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="end">
                  <Calendar
                    mode="single"
                    selected={catalogDate}
                    onSelect={(d) => {
                      setCatalogDate(d);
                      setCatalogCalendarOpen(false);
                    }}
                    initialFocus
                  />
                  {catalogDate && (
                    <div className="p-2 border-t">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="w-full text-xs"
                        onClick={() => setCatalogDate(undefined)}
                      >
                        Quitar filtro
                      </Button>
                    </div>
                  )}
                </PopoverContent>
              </Popover>
              {/* View toggle */}
              <div className="flex border border-border rounded-lg overflow-hidden shrink-0">
                <button
                  type="button"
                  onClick={() => setViewMode("list")}
                  className={`p-2 transition-colors ${viewMode === "list" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted"}`}
                >
                  <LayoutList size={15} />
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode("grid")}
                  className={`p-2 transition-colors ${viewMode === "grid" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted"}`}
                >
                  <LayoutGrid size={15} />
                </button>
              </div>
              {/* Three-dot menu */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    type="button"
                    className="p-2 h-9 w-9 flex items-center justify-center rounded-lg hover:bg-muted transition-colors border border-border"
                    data-ocid="inventario.dropdown_menu"
                  >
                    <MoreVertical size={15} className="text-muted-foreground" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem
                    onClick={() => fileInputRef2.current?.click()}
                  >
                    <FileUp size={14} className="mr-2" /> Importar CSV
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => fileXLSRef.current?.click()}>
                    <FileUp size={14} className="mr-2" /> Importar XLSX
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={exportCSV}>
                    <FileDown size={14} className="mr-2" /> Exportar CSV
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={exportXLS}>
                    <FileDown size={14} className="mr-2" /> Exportar XLSX
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={exportPDF}>
                    <FileDown size={14} className="mr-2" /> Exportar PDF
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <input
                ref={fileInputRef2}
                type="file"
                accept=".csv"
                className="hidden"
                onChange={importCSV}
              />
              <input
                ref={fileXLSRef}
                type="file"
                accept=".xls,.xlsx"
                className="hidden"
                onChange={importXLS}
              />
            </div>
            <p className="text-xs text-muted-foreground mb-3 shrink-0">
              {filteredProducts.length} productos en catálogo
            </p>
            <ScrollArea className="flex-1">
              {isLoading ? (
                <div className="space-y-3" data-ocid="inventario.loading_state">
                  {[1, 2, 3, 4].map((i) => (
                    <div
                      key={i}
                      className="h-16 bg-muted rounded-xl animate-pulse"
                    />
                  ))}
                </div>
              ) : products.length === 0 ? (
                <div
                  className="py-16 text-center"
                  data-ocid="inventario.empty_state"
                >
                  <Package
                    size={40}
                    className="mx-auto text-muted-foreground/30 mb-3"
                  />
                  <p className="text-muted-foreground">Sin productos</p>
                  <p className="text-xs text-muted-foreground/60 mt-1">
                    Toca + para agregar tu primer producto
                  </p>
                </div>
              ) : (
                <>
                  {viewMode === "list" ? (
                    <div className="space-y-2">
                      {filteredProducts.map((p, idx) => {
                        const meta = getProductMeta(p.id);
                        return (
                          <div
                            key={String(p.id)}
                            data-ocid={`inventario.item.${idx + 1}`}
                            className="bg-card border border-border rounded-xl px-4 py-3 flex items-center gap-3 shadow-xs"
                          >
                            <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                              <Package size={16} className="text-primary" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-semibold text-sm truncate">
                                {p.name}
                              </p>
                              <div className="flex items-center gap-2 mt-0.5">
                                {p.barcode && (
                                  <div className="flex items-center gap-1">
                                    <Barcode
                                      size={11}
                                      className="text-muted-foreground"
                                    />
                                    <span className="text-xs text-muted-foreground">
                                      {p.barcode}
                                    </span>
                                  </div>
                                )}
                                <span className="text-xs text-muted-foreground">
                                  {meta.unit || "Unidad"}
                                </span>
                              </div>
                            </div>
                            <div className="flex items-center gap-1 shrink-0">
                              <button
                                type="button"
                                onClick={() => handleEdit(p)}
                                className="w-8 h-8 flex items-center justify-center rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
                                aria-label="Editar producto"
                              >
                                <Pencil size={15} />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDelete(p)}
                                className="w-8 h-8 flex items-center justify-center rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                                aria-label="Eliminar producto"
                              >
                                <Trash2 size={15} />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-3">
                      {filteredProducts.map((p, idx) => {
                        const meta = getProductMeta(p.id);
                        return (
                          <div
                            key={String(p.id)}
                            data-ocid={`inventario.item.${idx + 1}`}
                            className="bg-card border border-border rounded-xl p-3 flex flex-col gap-2 shadow-xs"
                          >
                            <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
                              <Package size={16} className="text-primary" />
                            </div>
                            <p className="font-semibold text-xs truncate">
                              {p.name}
                            </p>
                            {p.barcode && (
                              <p className="text-xs text-muted-foreground truncate">
                                {p.barcode}
                              </p>
                            )}
                            <p className="text-xs text-muted-foreground">
                              {meta.unit || "Unidad"}
                            </p>
                            <div className="flex items-center justify-end gap-1">
                              <button
                                type="button"
                                onClick={() => handleEdit(p)}
                                className="p-1 rounded hover:bg-muted"
                              >
                                <Pencil size={13} />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDelete(p)}
                                className="p-1 rounded hover:bg-destructive/10 text-destructive"
                              >
                                <Trash2 size={13} />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </>
              )}
            </ScrollArea>
          </div>

          {/* FAB */}
          <button
            type="button"
            onClick={() => {
              setEditingProduct(null);
              setShowProductScreen(true);
            }}
            className="absolute bottom-5 right-5 w-14 h-14 rounded-full bg-primary shadow-lg flex items-center justify-center hover:bg-primary/90 active:scale-95 transition-all z-10"
            data-ocid="inventario.primary_button"
            aria-label="Agregar producto"
          >
            <Plus size={26} className="text-primary-foreground" />
          </button>

          {/* Product form overlay */}
          {showProductScreen && (
            <div className="absolute inset-0 z-10 bg-background">
              <CatalogProductForm
                onClose={handleModalClose}
                editProduct={editingProduct}
                onSaved={() => {
                  forceUpdate((n) => n + 1);
                  onAddComplete?.();
                }}
              />
            </div>
          )}
        </div>
      )}

      {/* Tab: Movimientos */}
      {activeTab === "movimientos" && (
        <div className="flex-1 overflow-hidden flex flex-col">
          {/* Sub-tab bar */}
          <div className="border-b border-border bg-background shrink-0">
            <div className="flex overflow-x-auto scrollbar-hide">
              <button
                type="button"
                data-ocid="inventario.historial.tab"
                onClick={() => setMovimientosTab("historial")}
                className={`flex items-center gap-1.5 flex-1 min-w-max px-3 py-2.5 text-xs font-medium whitespace-nowrap transition-colors border-b-2 ${
                  movimientosTab === "historial"
                    ? "border-primary text-primary"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                <History size={13} />
                Historial
              </button>
              <button
                type="button"
                data-ocid="inventario.entrada.tab"
                onClick={() => setMovimientosTab("entrada")}
                className={`flex items-center gap-1.5 flex-1 min-w-max px-3 py-2.5 text-xs font-medium whitespace-nowrap transition-colors border-b-2 ${
                  movimientosTab === "entrada"
                    ? "border-primary text-primary"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                <PackagePlus size={13} />
                Entrada de Mercancía
              </button>
              <button
                type="button"
                data-ocid="inventario.salida.tab"
                onClick={() => setMovimientosTab("salida")}
                className={`flex items-center gap-1.5 flex-1 min-w-max px-3 py-2.5 text-xs font-medium whitespace-nowrap transition-colors border-b-2 ${
                  movimientosTab === "salida"
                    ? "border-primary text-primary"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                <PackageMinus size={13} />
                Salida de Mercancía
              </button>
            </div>
          </div>
          {movimientosTab === "historial" ? (
            <HistorialMovimientos />
          ) : movimientosTab === "entrada" ? (
            <EntradaMercancia
              onAddNewProduct={handleAddNewProductFromEntrada}
            />
          ) : (
            <SalidaMercancia />
          )}
        </div>
      )}

      {/* Tab: Almacenes */}
      {activeTab === "almacenes" && <AlmacenesTab />}
    </div>
  );
}
