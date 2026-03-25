import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  CalendarDays,
  FileDown,
  FileUp,
  LayoutGrid,
  LayoutList,
  MoreVertical,
  Package,
  Pencil,
  Plus,
  Search,
  Store,
  Trash2,
} from "lucide-react";
import React from "react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import AddProductoWindow from "../components/AddProductoWindow";
import { buildFileHeader, buildHtmlHeader } from "../utils/businessData";
import { getPuntosVenta } from "../utils/puntosVenta";
import {
  type PVInventoryItem,
  deletePVItem,
  getPVInventory,
  updatePVItem,
  upsertPVItem,
} from "../utils/pvInventory";

function formatCents(cents: number): string {
  return (cents / 100).toFixed(2);
}

// ---------- Main Component ----------
export default function InventarioPV() {
  const [items, setItems] = useState<PVInventoryItem[]>(() => getPVInventory());
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState<PVInventoryItem | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [pvViewMode, setPvViewMode] = useState<"list" | "grid">("list");
  const [pvSelectedDate, setPvSelectedDate] = useState("");
  const pvDateInputRef = React.useRef<HTMLInputElement>(null);

  const reload = useCallback(() => {
    setItems(getPVInventory());
  }, []);

  const filtered = searchTerm
    ? items.filter(
        (i) =>
          i.productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          i.productCode.toLowerCase().includes(searchTerm.toLowerCase()),
      )
    : items;

  const handleEdit = (item: PVInventoryItem) => {
    setEditingItem(item);
    setShowForm(true);
  };

  const handleDelete = (item: PVInventoryItem) => {
    if (!window.confirm(`¿Eliminar "${item.productName}" de ${item.pvName}?`))
      return;
    deletePVItem(item.id);
    reload();
    toast.success("Producto eliminado del Inventario PV");
  };

  const exportCSV = () => {
    const header = buildFileHeader();
    const cols = "Código,Nombre,Unidad,Punto de Venta,Stock,Precio";
    const rows = filtered.map(
      (i) =>
        `${i.productCode},${i.productName},${i.unit},${i.pvName},${i.stock},${formatCents(i.price)}`,
    );
    const csv = `${header
      .split("\n")
      .map((l) => `# ${l}`)
      .join("\n")}\n${[cols, ...rows].join("\n")}`;
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `inventario_pv_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportPDF = () => {
    const htmlHeader = buildHtmlHeader();
    const rows = filtered
      .map(
        (i) =>
          `<tr><td>${i.productCode}</td><td>${i.productName}</td><td>${i.unit}</td><td>${i.pvName}</td><td>${i.stock}</td><td>$${formatCents(i.price)}</td></tr>`,
      )
      .join("");
    const html = `<html><head><title>Inventario PV</title><style>body{font-family:sans-serif;padding:20px}table{width:100%;border-collapse:collapse}th,td{border:1px solid #ddd;padding:8px;text-align:left}th{background:#0B2040;color:white}.header{margin-bottom:16px;padding:12px;background:#f5f5f5;border-radius:6px}</style></head><body><div class="header">${htmlHeader}</div><h2>Inventario Punto de Venta</h2><table><thead><tr><th>Código</th><th>Nombre</th><th>Unidad</th><th>Punto de Venta</th><th>Stock</th><th>Precio</th></tr></thead><tbody>${rows}</tbody></table></body></html>`;
    const win = window.open("", "_blank");
    if (win) {
      win.document.write(html);
      win.document.close();
      win.print();
    }
  };

  return (
    <div className="relative px-4 pb-6 pt-4">
      {/* Unified Toolbar */}
      <div className="flex items-center gap-2 mb-2">
        {/* Search input */}
        <div className="relative flex-1">
          <Search
            size={13}
            className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground"
          />
          <Input
            placeholder="Buscar producto..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-7 h-9 text-xs"
            data-ocid="inventariopv.search_input"
          />
        </div>
        {/* Calendar */}
        <div className="relative shrink-0">
          <Button
            variant={pvSelectedDate ? "default" : "outline"}
            size="sm"
            className="h-9 px-2"
            onClick={() =>
              pvDateInputRef.current?.showPicker?.() ??
              pvDateInputRef.current?.click()
            }
          >
            <CalendarDays size={15} />
            {pvSelectedDate && (
              <span className="ml-1 text-xs">
                {new Date(`${pvSelectedDate}T00:00:00`).toLocaleDateString(
                  "es-ES",
                  { day: "2-digit", month: "2-digit" },
                )}
              </span>
            )}
          </Button>
          <input
            ref={pvDateInputRef}
            type="date"
            style={{
              position: "absolute",
              width: 0,
              height: 0,
              opacity: 0,
              pointerEvents: "none",
            }}
            max={new Date().toISOString().split("T")[0]}
            value={pvSelectedDate}
            onChange={(e) => setPvSelectedDate(e.target.value)}
          />
          {pvSelectedDate && (
            <button
              type="button"
              className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-destructive text-white rounded-full text-[9px] flex items-center justify-center z-10"
              onClick={() => setPvSelectedDate("")}
            >
              ✕
            </button>
          )}
        </div>
        {/* View toggle */}
        <div className="flex border border-border rounded-lg overflow-hidden shrink-0">
          <button
            type="button"
            onClick={() => setPvViewMode("list")}
            className={`p-2 transition-colors ${pvViewMode === "list" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted"}`}
          >
            <LayoutList size={15} />
          </button>
          <button
            type="button"
            onClick={() => setPvViewMode("grid")}
            className={`p-2 transition-colors ${pvViewMode === "grid" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted"}`}
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
              data-ocid="inventariopv.dropdown_menu"
            >
              <MoreVertical size={15} className="text-muted-foreground" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem onClick={exportCSV}>
              <FileDown size={14} className="mr-2" /> Exportar CSV
            </DropdownMenuItem>
            <DropdownMenuItem onClick={exportPDF}>
              <FileDown size={14} className="mr-2" /> Exportar PDF
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <p className="text-xs text-muted-foreground mb-3">
        {filtered.length} producto{filtered.length !== 1 ? "s" : ""} en PV
      </p>

      <ScrollArea className="h-[calc(100vh-180px)]">
        {items.length === 0 ? (
          <div
            className="py-16 text-center"
            data-ocid="inventariopv.empty_state"
          >
            <Package
              size={40}
              className="mx-auto text-muted-foreground/30 mb-3"
            />
            <p className="text-muted-foreground">
              Sin productos en Inventario PV
            </p>
            <p className="text-xs text-muted-foreground/60 mt-1">
              Toca + para agregar o usa Entrada de Mercancía
            </p>
          </div>
        ) : pvViewMode === "grid" ? (
          <div className="grid grid-cols-2 gap-2 p-1">
            {filtered.map((item, idx) => (
              <div
                key={item.id}
                data-ocid={`inventariopv.item.${idx + 1}`}
                className="bg-card border border-border rounded-xl p-3 flex flex-col gap-1 shadow-xs"
              >
                <div className="w-9 h-9 rounded-lg bg-teal/10 flex items-center justify-center mb-1">
                  <Package size={14} className="text-teal" />
                </div>
                <p className="font-semibold text-xs truncate">
                  {item.productName}
                </p>
                <p className="text-xs text-muted-foreground truncate">
                  {item.productCode}
                </p>
                <p className="text-xs text-muted-foreground">{item.unit}</p>
                <p className="text-xs font-bold text-teal">
                  ${formatCents(item.price)}
                </p>
                <p className="text-xs text-muted-foreground">
                  Stock: {item.stock}
                </p>
                <div className="flex gap-1 mt-auto">
                  <button
                    type="button"
                    onClick={() => handleEdit(item)}
                    className="p-1 rounded hover:bg-muted"
                    data-ocid={`inventariopv.edit_button.${idx + 1}`}
                  >
                    <Pencil size={12} />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(item)}
                    className="p-1 rounded hover:bg-destructive/10 text-destructive"
                    data-ocid={`inventariopv.delete_button.${idx + 1}`}
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-2">
            {filtered.map((item, idx) => (
              <div
                key={item.id}
                data-ocid={`inventariopv.item.${idx + 1}`}
                className="bg-card border border-border rounded-xl px-4 py-3 flex items-center gap-3 shadow-xs"
              >
                <div className="w-10 h-10 rounded-xl bg-teal/10 flex items-center justify-center shrink-0">
                  <Package size={16} className="text-teal" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <p className="font-semibold text-sm truncate">
                      {item.productName}
                    </p>
                    <span className="text-xs bg-teal/10 text-teal px-2 py-0.5 rounded-full font-medium shrink-0 flex items-center gap-1">
                      <Store size={10} />
                      {item.pvName}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Cód: {item.productCode} &middot; {item.unit}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <p className="font-bold text-sm text-teal">
                    ${formatCents(item.price)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Stock: {item.stock}
                  </p>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    type="button"
                    onClick={() => handleEdit(item)}
                    className="w-8 h-8 flex items-center justify-center rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
                    aria-label="Editar"
                    data-ocid={`inventariopv.edit_button.${idx + 1}`}
                  >
                    <Pencil size={15} />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(item)}
                    className="w-8 h-8 flex items-center justify-center rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                    aria-label="Eliminar"
                    data-ocid={`inventariopv.delete_button.${idx + 1}`}
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </ScrollArea>

      {/* FAB */}
      <button
        type="button"
        onClick={() => {
          setEditingItem(null);
          setShowForm(true);
        }}
        className="absolute bottom-6 right-2 w-14 h-14 rounded-full bg-primary text-primary-foreground shadow-lg flex items-center justify-center hover:bg-primary/90 active:scale-95 transition-transform"
        data-ocid="inventariopv.open_modal_button"
        aria-label="Agregar producto"
      >
        <Plus size={28} strokeWidth={2.5} />
      </button>

      {showForm && (
        <div className="fixed inset-0 bg-background z-50 flex flex-col">
          <AddProductoWindow
            mode="pv"
            onClose={() => {
              setShowForm(false);
              setEditingItem(null);
            }}
            editPVItem={editingItem}
            onSaved={() => {
              reload();
              setShowForm(false);
              setEditingItem(null);
            }}
          />
        </div>
      )}
    </div>
  );
}
