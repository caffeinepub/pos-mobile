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
  FileDown,
  MoreVertical,
  Package,
  Pencil,
  Plus,
  Search,
  Store,
  Trash2,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { buildFileHeader, buildHtmlHeader } from "../utils/businessData";
import { getPuntosVenta } from "../utils/puntosVenta";
import {
  type PVInventoryItem,
  deletePVItem,
  getPVInventory,
  updatePVItem,
  upsertPVItem,
} from "../utils/pvInventory";

const DEFAULT_UNITS = [
  "Unidad",
  "Kg",
  "g",
  "Litros",
  "ml",
  "Caja",
  "Paquete",
  "Docena",
];

function formatCents(cents: number): string {
  return (cents / 100).toFixed(2);
}

// ---------- Add/Edit Form Screen ----------
function PVItemFormScreen({
  onClose,
  editItem,
  onSaved,
}: {
  onClose: () => void;
  editItem?: PVInventoryItem | null;
  onSaved?: () => void;
}) {
  const isEditing = !!editItem;
  const puntosVenta = getPuntosVenta();

  const [productCode, setProductCode] = useState("");
  const [productName, setProductName] = useState("");
  const [unit, setUnit] = useState("Unidad");
  const [price, setPrice] = useState("");
  const [stock, setStock] = useState("");
  const [pvId, setPvId] = useState("");

  // biome-ignore lint/correctness/useExhaustiveDependencies: editItem used intentionally
  useEffect(() => {
    if (editItem) {
      setProductCode(editItem.productCode);
      setProductName(editItem.productName);
      setUnit(editItem.unit);
      setPrice(formatCents(editItem.price));
      setStock(String(editItem.stock));
      setPvId(editItem.pvId);
    } else {
      setProductCode("");
      setProductName("");
      setUnit("Unidad");
      setPrice("");
      setStock("");
      setPvId(puntosVenta.length === 1 ? puntosVenta[0].id : "");
    }
  }, [editItem]);

  const handleSave = () => {
    if (!productName.trim()) {
      toast.error("El nombre del producto es obligatorio");
      return;
    }
    if (!productCode.trim()) {
      toast.error("El código del producto es obligatorio");
      return;
    }
    if (!pvId) {
      toast.error("Selecciona un Punto de Venta");
      return;
    }
    const priceNum = Number.parseFloat(price);
    if (Number.isNaN(priceNum) || priceNum < 0) {
      toast.error("El precio debe ser un número válido");
      return;
    }
    const stockNum = Number.parseInt(stock) || 0;

    const selectedPV = puntosVenta.find((pv) => pv.id === pvId);
    if (!selectedPV) {
      toast.error("Punto de Venta no válido");
      return;
    }

    if (isEditing && editItem) {
      updatePVItem(editItem.id, {
        productCode: productCode.trim(),
        productName: productName.trim(),
        unit,
        price: Math.round(priceNum * 100),
        stock: Math.max(0, stockNum),
        pvId,
        pvName: selectedPV.name,
      });
      toast.success("Producto actualizado");
    } else {
      upsertPVItem(
        pvId,
        selectedPV.name,
        productCode.trim(),
        productName.trim(),
        unit,
        Math.round(priceNum * 100),
        Math.max(0, stockNum),
      );
      toast.success("Producto agregado a Inventario PV");
    }

    onSaved?.();
    onClose();
  };

  return (
    <div className="h-full flex flex-col" data-ocid="inventariopv.dialog">
      <div className="flex items-center px-4 py-3 border-b border-border shrink-0">
        <button
          type="button"
          onClick={onClose}
          className="flex items-center gap-2 text-sm font-medium text-foreground"
          data-ocid="inventariopv.close_button"
        >
          <ArrowLeft size={18} />
          {isEditing ? "Editar producto PV" : "Agregar producto PV"}
        </button>
      </div>

      <ScrollArea className="flex-1 overflow-auto">
        <div className="px-5 pb-6 space-y-5 pt-4">
          {puntosVenta.length === 0 && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
              <p className="text-sm text-yellow-800">
                Configure primero los Puntos de Venta en Configuración
              </p>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="pv-select">Punto de Venta *</Label>
            <Select value={pvId} onValueChange={setPvId}>
              <SelectTrigger
                id="pv-select"
                data-ocid="inventariopv.select"
                className="w-full"
              >
                <SelectValue placeholder="Seleccionar punto de venta..." />
              </SelectTrigger>
              <SelectContent>
                {puntosVenta.length === 0 ? (
                  <SelectItem value="__none__" disabled>
                    Sin puntos de venta configurados
                  </SelectItem>
                ) : (
                  puntosVenta.map((pv) => (
                    <SelectItem key={pv.id} value={pv.id}>
                      {pv.name}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="product-code">Código del producto *</Label>
            <Input
              id="product-code"
              placeholder="Ej: PROD-001"
              value={productCode}
              onChange={(e) => setProductCode(e.target.value)}
              data-ocid="inventariopv.input"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="product-name">Nombre del producto *</Label>
            <Input
              id="product-name"
              placeholder="Ej: Refresco Cola"
              value={productName}
              onChange={(e) => setProductName(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label>Unidad de medida</Label>
            <Select value={unit} onValueChange={setUnit}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {DEFAULT_UNITS.map((u) => (
                  <SelectItem key={u} value={u}>
                    {u}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="price">Precio de venta</Label>
            <Input
              id="price"
              type="number"
              min="0"
              step="0.01"
              placeholder="0.00"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="stock">Stock inicial</Label>
            <Input
              id="stock"
              type="number"
              min="0"
              step="1"
              placeholder="0"
              value={stock}
              onChange={(e) => setStock(e.target.value)}
            />
          </div>

          <div className="pt-2 flex gap-3">
            <Button
              variant="outline"
              className="flex-1"
              onClick={onClose}
              data-ocid="inventariopv.cancel_button"
            >
              Cancelar
            </Button>
            <Button
              className="flex-1 bg-teal text-white hover:bg-teal/90"
              onClick={handleSave}
              disabled={puntosVenta.length === 0}
              data-ocid="inventariopv.save_button"
            >
              {isEditing ? "Actualizar" : "Guardar"}
            </Button>
          </div>
        </div>
      </ScrollArea>
    </div>
  );
}

// ---------- Main Component ----------
export default function InventarioPV() {
  const [items, setItems] = useState<PVInventoryItem[]>(() => getPVInventory());
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState<PVInventoryItem | null>(null);
  const [showSearch, setShowSearch] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

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
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-muted-foreground">
          {filtered.length} producto{filtered.length !== 1 ? "s" : ""} en PV
        </p>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className="p-2 rounded-lg hover:bg-muted transition-colors"
              data-ocid="inventariopv.dropdown_menu"
            >
              <MoreVertical size={18} className="text-muted-foreground" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem onClick={() => setShowSearch(!showSearch)}>
              <Search size={14} className="mr-2" /> Buscar
            </DropdownMenuItem>
            <DropdownMenuItem onClick={exportCSV}>
              <FileDown size={14} className="mr-2" /> Exportar CSV
            </DropdownMenuItem>
            <DropdownMenuItem onClick={exportPDF}>
              <FileDown size={14} className="mr-2" /> Exportar PDF
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {showSearch && (
        <div className="mb-3">
          <div className="relative">
            <Search
              size={15}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
            />
            <input
              type="text"
              placeholder="Buscar por nombre o código..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full border border-border rounded-lg pl-9 pr-3 py-2 text-sm bg-background outline-none focus:ring-2 focus:ring-primary/30"
              data-ocid="inventariopv.search_input"
            />
          </div>
        </div>
      )}

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
        <div className="absolute inset-0 bg-background z-20 flex flex-col">
          <PVItemFormScreen
            onClose={() => {
              setShowForm(false);
              setEditingItem(null);
            }}
            editItem={editingItem}
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
