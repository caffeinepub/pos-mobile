import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  ArrowUpToLine,
  ChevronDown,
  ChevronRight,
  MapPin,
  Minus,
  Package,
  Plus,
  QrCode,
  Search,
  Trash2,
  Warehouse,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import type { Product } from "../backend.d";
import {
  useCreateProduct,
  useProducts,
  useUpdateProduct,
} from "../hooks/useQueries";
import { useQRScanner } from "../qr-code/useQRScanner";
import { getAlmacenes } from "../utils/almacenes";
import {
  type EntradaMercanciaTipo,
  getTiposEntrada,
  saveEntrada,
  saveTiposEntrada,
} from "../utils/entradas";
import { registrarMovimiento } from "../utils/movimientos";
import { addInsumo } from "../utils/produccion";
import { getPuntosVenta } from "../utils/puntosVenta";
import { upsertPVItem } from "../utils/pvInventory";

interface CartItem {
  product: Product;
  quantity: number;
}

function getProductMeta(id: bigint): { image: string | null; unit: string } {
  try {
    const raw = localStorage.getItem(`product-meta-${String(id)}`);
    if (raw) return JSON.parse(raw);
  } catch {}
  return { image: null, unit: "Unidad" };
}

function ProductThumb({ productId }: { productId: bigint }) {
  const meta = getProductMeta(productId);
  if (meta.image) {
    return (
      <div className="w-9 h-9 rounded-lg overflow-hidden shrink-0 border border-border">
        <img
          src={meta.image}
          alt="producto"
          className="w-full h-full object-cover"
        />
      </div>
    );
  }
  return (
    <div className="w-9 h-9 rounded-lg bg-muted flex items-center justify-center shrink-0">
      <Package size={14} className="text-muted-foreground" />
    </div>
  );
}

function formatPrice(price: bigint): string {
  return (Number(price) / 100).toFixed(2);
}

function QRScannerModal({
  open,
  onClose,
  onScan,
}: { open: boolean; onClose: () => void; onScan: (code: string) => void }) {
  const {
    videoRef,
    canvasRef,
    isScanning,
    isLoading,
    error,
    canStartScanning,
    startScanning,
    stopScanning,
    qrResults,
    clearResults,
    isSupported,
  } = useQRScanner({
    facingMode: "environment",
    scanInterval: 150,
    maxResults: 1,
  });

  const handleOpen = useCallback(() => {
    clearResults();
    startScanning();
  }, [clearResults, startScanning]);
  const handleClose = useCallback(() => {
    stopScanning();
  }, [stopScanning]);

  // biome-ignore lint/correctness/useExhaustiveDependencies: controlled by open
  useEffect(() => {
    if (open) handleOpen();
    else handleClose();
  }, [open, handleOpen, handleClose]);

  useEffect(() => {
    if (qrResults.length > 0) {
      onScan(qrResults[0].data);
      stopScanning();
      onClose();
    }
  }, [qrResults, onScan, stopScanning, onClose]);

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!v) onClose();
      }}
    >
      <DialogContent className="max-w-sm mx-auto">
        <DialogHeader>
          <DialogTitle>Escanear producto</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          {isSupported === false && (
            <p className="text-destructive text-sm">Cámara no soportada</p>
          )}
          {error && <p className="text-destructive text-sm">{error.message}</p>}
          <div className="relative rounded-xl overflow-hidden bg-black aspect-square">
            <video
              ref={videoRef}
              playsInline
              muted
              className="w-full h-full object-cover"
            />
            <canvas ref={canvasRef} className="hidden" />
            {isScanning && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="w-40 h-40 border-2 border-teal rounded-lg opacity-80" />
              </div>
            )}
          </div>
          {!isScanning && (
            <Button
              type="button"
              className="w-full bg-teal text-white hover:bg-teal/90"
              onClick={startScanning}
              disabled={!canStartScanning || isLoading}
            >
              {isLoading ? "Iniciando cámara..." : "Iniciar escaneo"}
            </Button>
          )}
          {isScanning && (
            <p className="text-center text-sm text-muted-foreground">
              Apunte el código hacia la cámara...
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

interface MultiSelectItem {
  product: Product;
  checked: boolean;
  qty: number;
}

function ProductPickerModal({
  open,
  onClose,
  onAddMultiple,
  products,
  onAddNewProduct,
}: {
  open: boolean;
  onClose: () => void;
  onAddMultiple: (items: { product: Product; quantity: number }[]) => void;
  products: Product[];
  onAddNewProduct?: () => void;
}) {
  const [search, setSearch] = useState("");
  const [selections, setSelections] = useState<Record<string, MultiSelectItem>>(
    {},
  );
  const [showNewProduct, setShowNewProduct] = useState(false);
  const [newName, setNewName] = useState("");
  const [newBarcode, setNewBarcode] = useState("");
  const [newStock, setNewStock] = useState("0");
  const [newPrice, setNewPrice] = useState("");

  const createProduct = useCreateProduct();

  const filtered = products.filter(
    (p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.barcode.includes(search),
  );

  const toggleProduct = (p: Product) => {
    const key = String(p.id);
    setSelections((prev) => {
      if (prev[key]) {
        const next = { ...prev };
        delete next[key];
        return next;
      }
      return { ...prev, [key]: { product: p, checked: true, qty: 1 } };
    });
  };

  const setQty = (p: Product, qty: number) => {
    const key = String(p.id);
    setSelections((prev) => ({
      ...prev,
      [key]: { ...prev[key], qty: Math.max(1, qty) },
    }));
  };

  const handleConfirm = () => {
    const items = Object.values(selections).map((s) => ({
      product: s.product,
      quantity: s.qty,
    }));
    if (items.length === 0) {
      toast.error("Selecciona al menos un producto");
      return;
    }
    onAddMultiple(items);
    resetAndClose();
  };

  const resetAndClose = () => {
    setSelections({});
    setSearch("");
    setShowNewProduct(false);
    setNewName("");
    setNewBarcode("");
    setNewStock("0");
    setNewPrice("");
    onClose();
  };

  const handleAddNewProduct = async () => {
    if (!newName.trim()) {
      toast.error("El nombre del producto es requerido");
      return;
    }
    const priceVal = Number.parseFloat(newPrice);
    if (!newPrice || Number.isNaN(priceVal) || priceVal <= 0) {
      toast.error("El precio de venta es requerido");
      return;
    }
    try {
      const created = await createProduct.mutateAsync({
        name: newName.trim(),
        price: BigInt(Math.round(priceVal * 100)),
        barcode: newBarcode.trim(),
        stock: BigInt(Number.parseInt(newStock) || 0),
      });
      const stockQty = Number.parseInt(newStock) || 0;
      if (created && typeof created === "object" && "id" in created) {
        onAddMultiple([
          {
            product: created as Product,
            quantity: stockQty > 0 ? stockQty : 1,
          },
        ]);
      }
      toast.success(`"${newName.trim()}" agregado al inventario`);
      resetAndClose();
    } catch {
      toast.error("Error al crear el producto");
    }
  };

  const selectedCount = Object.keys(selections).length;

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!v) resetAndClose();
      }}
    >
      <DialogContent className="max-w-sm mx-auto max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Seleccionar productos</DialogTitle>
        </DialogHeader>
        <div className="flex-1 overflow-y-auto space-y-3 pr-1">
          <div className="relative">
            <Search
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
            />
            <Input
              placeholder="Buscar producto..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
              data-ocid="entrada.search_input"
            />
          </div>
          <ScrollArea className="h-48">
            {filtered.length === 0 ? (
              <p className="text-center text-muted-foreground text-sm py-8">
                Sin resultados
              </p>
            ) : (
              <div className="space-y-1">
                {filtered.map((p) => {
                  const key = String(p.id);
                  const sel = selections[key];
                  return (
                    <div
                      key={key}
                      className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-muted transition-colors"
                    >
                      <Checkbox
                        checked={!!sel}
                        onCheckedChange={() => toggleProduct(p)}
                        id={`entrada-prod-${key}`}
                      />
                      <ProductThumb productId={p.id} />
                      <label
                        htmlFor={`entrada-prod-${key}`}
                        className="flex-1 cursor-pointer"
                      >
                        <p className="font-medium text-sm">{p.name}</p>
                        <p className="text-xs text-muted-foreground">
                          Stock: {String(p.stock)} · ${formatPrice(p.price)}
                        </p>
                      </label>
                      {sel && (
                        <Input
                          type="number"
                          min={1}
                          value={sel.qty}
                          onChange={(e) =>
                            setQty(p, Number.parseInt(e.target.value) || 1)
                          }
                          className="w-16 h-8 text-center text-sm"
                          onClick={(e) => e.stopPropagation()}
                        />
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </ScrollArea>

          <Button
            type="button"
            onClick={handleConfirm}
            className="w-full bg-emerald-500 hover:bg-emerald-400 text-white"
            data-ocid="entrada.confirm_button"
          >
            Agregar seleccionados
            {selectedCount > 0 && (
              <Badge className="ml-2 bg-white/20 text-white text-xs">
                {selectedCount}
              </Badge>
            )}
          </Button>

          <Separator />

          <button
            type="button"
            onClick={() => {
              if (onAddNewProduct) {
                resetAndClose();
                onAddNewProduct();
              } else {
                setShowNewProduct((v) => !v);
              }
            }}
            className="w-full flex items-center justify-between px-1 py-1 text-sm font-semibold text-emerald-600 hover:text-emerald-500 transition-colors"
            data-ocid="entrada.open_modal_button"
          >
            <span>Nuevo producto (no está en stock)</span>
            <ChevronRight size={16} />
          </button>

          {!onAddNewProduct && showNewProduct && (
            <div className="space-y-3 bg-muted/40 rounded-xl p-3">
              <div className="space-y-1">
                <Label className="text-xs font-medium">
                  Nombre <span className="text-destructive">*</span>
                </Label>
                <Input
                  placeholder="Nombre del producto"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  data-ocid="entrada.input"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs font-medium">Código / Barcode</Label>
                <Input
                  placeholder="Opcional"
                  value={newBarcode}
                  onChange={(e) => setNewBarcode(e.target.value)}
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <Label className="text-xs font-medium">Stock inicial</Label>
                  <Input
                    type="number"
                    min={0}
                    placeholder="0"
                    value={newStock}
                    onChange={(e) => setNewStock(e.target.value)}
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs font-medium">
                    Precio de venta <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    type="number"
                    min={0}
                    step="0.01"
                    placeholder="0.00"
                    value={newPrice}
                    onChange={(e) => setNewPrice(e.target.value)}
                  />
                </div>
              </div>
              <Button
                type="button"
                onClick={handleAddNewProduct}
                disabled={createProduct.isPending}
                className="w-full bg-emerald-500 hover:bg-emerald-400 text-white"
                data-ocid="entrada.primary_button"
              >
                {createProduct.isPending
                  ? "Agregando..."
                  : "Agregar al inventario"}
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function TipoEntradaModal({
  open,
  onClose,
  onSelect,
}: {
  open: boolean;
  onClose: () => void;
  onSelect: (t: EntradaMercanciaTipo) => void;
}) {
  const [tipos, setTipos] = useState<EntradaMercanciaTipo[]>(() =>
    getTiposEntrada(),
  );
  const [newName, setNewName] = useState("");

  useEffect(() => {
    if (open) setTipos(getTiposEntrada());
  }, [open]);

  const handleAdd = () => {
    const name = newName.trim();
    if (!name) return;
    const nuevo: EntradaMercanciaTipo = { id: crypto.randomUUID(), name };
    const updated = [...tipos, nuevo];
    setTipos(updated);
    saveTiposEntrada(updated);
    setNewName("");
    toast.success(`"${name}" agregado`);
  };

  const handleDelete = (id: string, name: string) => {
    const updated = tipos.filter((t) => t.id !== id);
    setTipos(updated);
    saveTiposEntrada(updated);
    toast.success(`"${name}" eliminado`);
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!v) onClose();
      }}
    >
      <DialogContent
        className="max-w-sm mx-auto"
        data-ocid="entrada.tipo_dialog"
      >
        <DialogHeader>
          <DialogTitle>Tipos de entrada</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <ScrollArea className="h-48">
            {tipos.length === 0 ? (
              <p
                className="text-center text-muted-foreground text-sm py-6"
                data-ocid="entrada.tipo_empty_state"
              >
                Sin tipos de entrada configurados
              </p>
            ) : (
              <div className="space-y-1">
                {tipos.map((t, idx) => (
                  <div
                    key={t.id}
                    data-ocid={`entrada.tipo_item.${idx + 1}`}
                    className="flex items-center justify-between px-3 py-2.5 rounded-lg hover:bg-muted group"
                  >
                    <button
                      type="button"
                      className="flex items-center gap-2 flex-1 text-left"
                      onClick={() => {
                        onSelect(t);
                        onClose();
                      }}
                    >
                      <ArrowUpToLine
                        size={15}
                        className="text-emerald-500 shrink-0"
                      />
                      <span className="text-sm font-medium">{t.name}</span>
                    </button>
                    <button
                      type="button"
                      data-ocid={`entrada.tipo_delete.${idx + 1}`}
                      onClick={() => handleDelete(t.id, t.name)}
                      className="p-1 rounded text-destructive opacity-0 group-hover:opacity-100 hover:bg-destructive/10 transition-all"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
          <Separator />
          <div className="flex gap-2">
            <Input
              placeholder="Nuevo tipo de entrada..."
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleAdd();
              }}
              data-ocid="entrada.tipo_input"
            />
            <Button
              type="button"
              onClick={handleAdd}
              disabled={!newName.trim()}
              className="bg-emerald-500 text-white hover:bg-emerald-400 shrink-0"
              data-ocid="entrada.tipo_submit"
            >
              <Plus size={16} />
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default function EntradaMercancia({
  onAddNewProduct,
}: { onAddNewProduct?: () => void } = {}) {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedTipo, setSelectedTipo] = useState<EntradaMercanciaTipo | null>(
    null,
  );
  const [selectedDestino, setSelectedDestino] = useState<{
    tipo: "almacen" | "puntoVenta" | "produccion";
    id: string;
    nombre: string;
  } | null>(null);
  const [showDestino, setShowDestino] = useState(false);
  const [showQR, setShowQR] = useState(false);
  const [showProducts, setShowProducts] = useState(false);
  const [showTipos, setShowTipos] = useState(false);
  const [isPending, setIsPending] = useState(false);

  const { data: products = [] } = useProducts();
  const updateProduct = useUpdateProduct();

  const addToCart = (product: Product, quantity = 1) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.product.id === product.id);
      if (existing)
        return prev.map((item) =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + quantity }
            : item,
        );
      return [...prev, { product, quantity }];
    });
  };

  const addMultipleToCart = (
    items: { product: Product; quantity: number }[],
  ) => {
    for (const item of items) {
      addToCart(item.product, item.quantity);
    }
  };

  const updateQty = (productId: bigint, delta: number) => {
    setCart((prev) =>
      prev
        .map((item) =>
          item.product.id === productId
            ? { ...item, quantity: item.quantity + delta }
            : item,
        )
        .filter((item) => item.quantity > 0),
    );
  };

  const handleQRScan = (code: string) => {
    const product = products.find((p) => p.barcode === code);
    if (product) {
      addToCart(product);
      toast.success(`"${product.name}" agregado`);
    } else toast.error(`Producto no encontrado: ${code}`);
  };

  const total = cart.reduce(
    (sum, item) => sum + Number(item.product.price) * item.quantity,
    0,
  );

  const handleRegistrarEntrada = async () => {
    if (cart.length === 0) {
      toast.error("Agrega al menos un producto");
      return;
    }
    if (!selectedTipo) {
      toast.error("Selecciona un tipo de entrada");
      return;
    }
    if (!selectedDestino) {
      toast.error("Selecciona un destino para la entrada");
      return;
    }

    const today = new Date().toISOString().split("T")[0];
    setIsPending(true);
    try {
      if (selectedDestino.tipo === "produccion") {
        // Send to produccion insumos
        for (const item of cart) {
          addInsumo({
            nombre: item.product.name,
            codigo: item.product.barcode || "",
            cantidad: item.quantity,
            unidad: "Unidad",
            costoUnitario: Number(item.product.price) / 100,
            costoTotal: (Number(item.product.price) / 100) * item.quantity,
            fechaIngreso: today,
          });
          registrarMovimiento(
            String(item.product.id),
            today,
            "entrada",
            item.quantity,
          );
        }
      } else {
        for (const item of cart) {
          const newStock = BigInt(Number(item.product.stock) + item.quantity);
          await updateProduct.mutateAsync({
            id: item.product.id,
            name: item.product.name,
            price: item.product.price,
            barcode: item.product.barcode,
            stock: newStock,
          });
          registrarMovimiento(
            String(item.product.id),
            today,
            "entrada",
            item.quantity,
          );
        }
      }

      // If destino is puntoVenta, also update PV inventory
      if (selectedDestino.tipo === "puntoVenta") {
        for (const item of cart) {
          const meta = getProductMeta(item.product.id);
          upsertPVItem(
            selectedDestino.id,
            selectedDestino.nombre.replace("PDV: ", ""),
            item.product.barcode || String(item.product.id),
            item.product.name,
            meta.unit ?? "Unidad",
            Number(item.product.price),
            item.quantity,
          );
        }
      }

      saveEntrada({
        date: Date.now(),
        items: cart.map((item) => ({
          productId: String(item.product.id),
          productName: item.product.name,
          quantity: item.quantity,
          unitPrice: Number(item.product.price),
        })),
        tipoEntradaId: selectedTipo.id,
        tipoEntradaNombre: selectedTipo.name,
        destinoTipo: selectedDestino.tipo,
        destinoId: selectedDestino.id,
        destinoNombre: selectedDestino.nombre,
      });

      toast.success(
        selectedDestino.tipo === "produccion"
          ? "Enviado a Producción (Insumos)"
          : "Entrada de mercancía registrada",
      );
      setCart([]);
      setSelectedTipo(null);
      setSelectedDestino(null);
    } catch {
      toast.error("Error al registrar la entrada");
    } finally {
      setIsPending(false);
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-hidden px-4 pt-4">
        <div className="h-full bg-card rounded-xl shadow-card border border-border overflow-hidden flex flex-col">
          <div className="flex items-center justify-between px-4 py-3 border-b border-border shrink-0">
            <div className="flex items-center gap-2">
              <ArrowUpToLine size={16} className="text-emerald-500" />
              <span className="font-semibold text-sm">
                Productos a ingresar
              </span>
            </div>
            {cart.length > 0 && (
              <Badge variant="secondary" className="text-xs">
                {cart.length} productos
              </Badge>
            )}
          </div>
          {/* Destino selector */}
          <button
            type="button"
            onClick={() => setShowDestino(true)}
            data-ocid="entrada.destino_select"
            className="flex items-center gap-2 px-4 py-2 border-b border-border bg-muted/30 hover:bg-muted/50 transition-colors w-full text-left"
          >
            <Warehouse
              size={14}
              className={
                selectedDestino ? "text-emerald-500" : "text-muted-foreground"
              }
            />
            <span className="text-xs font-medium text-foreground">
              Destino:
            </span>
            <span
              className={`text-xs flex-1 truncate ${selectedDestino ? "text-emerald-600 font-semibold" : "text-muted-foreground"}`}
            >
              {selectedDestino ? selectedDestino.nombre : "Seleccionar destino"}
            </span>
            <MapPin size={12} className="text-muted-foreground shrink-0" />
          </button>
          <div className="flex-1 overflow-y-auto">
            {cart.length === 0 ? (
              <div
                className="py-10 text-center"
                data-ocid="entrada.empty_state"
              >
                <ArrowUpToLine
                  size={32}
                  className="mx-auto text-muted-foreground/40 mb-2"
                />
                <p className="text-muted-foreground text-sm">Sin productos</p>
              </div>
            ) : (
              <div>
                {cart.map((item, idx) => (
                  <div
                    key={String(item.product.id)}
                    data-ocid={`entrada.item.${idx + 1}`}
                    className="flex items-center gap-3 px-4 py-3 border-b border-border last:border-0"
                  >
                    <ProductThumb productId={item.product.id} />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">
                        {item.product.name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Stock: {String(item.product.stock)} · $
                        {formatPrice(item.product.price)}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => updateQty(item.product.id, -1)}
                        className="w-6 h-6 rounded-full border border-border flex items-center justify-center hover:bg-muted transition-colors"
                      >
                        <Minus size={12} />
                      </button>
                      <span className="text-sm font-semibold w-6 text-center">
                        {item.quantity}
                      </span>
                      <button
                        type="button"
                        onClick={() => updateQty(item.product.id, 1)}
                        className="w-6 h-6 rounded-full bg-emerald-500 text-white flex items-center justify-center hover:bg-emerald-400 transition-colors"
                      >
                        <Plus size={12} />
                      </button>
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        setCart((p) =>
                          p.filter((i) => i.product.id !== item.product.id),
                        )
                      }
                      className="p-1 rounded-lg hover:bg-destructive/10 transition-colors"
                    >
                      <Trash2 size={14} className="text-destructive" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="shrink-0">
        <div className="flex items-center justify-around px-4 py-2">
          <button
            type="button"
            onClick={() => setShowQR(true)}
            data-ocid="entrada.scan_button"
            className="flex flex-col items-center gap-1 group"
          >
            <div className="w-10 h-10 flex items-center justify-center">
              <QrCode
                size={22}
                className="text-foreground group-hover:text-emerald-500 transition-colors"
              />
            </div>
          </button>
          <button
            type="button"
            onClick={() => setShowProducts(true)}
            data-ocid="entrada.add_product_button"
            className="flex flex-col items-center gap-1 group"
          >
            <div className="w-10 h-10 flex items-center justify-center">
              <Plus
                size={22}
                className="text-foreground group-hover:text-emerald-500 transition-colors"
              />
            </div>
          </button>
          <button
            type="button"
            onClick={() => setShowTipos(true)}
            data-ocid="entrada.tipo_select"
            className="flex flex-col items-center gap-1 group"
          >
            <div className="w-10 h-10 flex items-center justify-center">
              <ArrowUpToLine
                size={22}
                className={
                  selectedTipo
                    ? "text-emerald-500"
                    : "text-foreground group-hover:text-emerald-500 transition-colors"
                }
              />
            </div>
          </button>
        </div>

        <div className="bg-navy px-4 pt-3 pb-4 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white/60 text-xs">Tipo de entrada</p>
              <p className="text-white/90 text-sm font-semibold">
                {selectedTipo?.name ?? "No seleccionado"}
              </p>
            </div>
            <div className="text-right">
              <p className="text-white/60 text-xs">Total unidades</p>
              <p className="text-white text-2xl font-bold">
                {cart.reduce((s, i) => s + i.quantity, 0)}
              </p>
            </div>
          </div>
          {cart.length > 0 && (
            <p className="text-white/50 text-xs text-right">
              Valor ref: ${(total / 100).toFixed(2)}
            </p>
          )}
          <Button
            type="button"
            onClick={handleRegistrarEntrada}
            disabled={isPending || cart.length === 0}
            className="w-full h-12 bg-emerald-500 hover:bg-emerald-400 text-white font-semibold text-base rounded-xl"
            data-ocid="entrada.submit_button"
          >
            {isPending ? "Procesando..." : "Registrar Entrada"}
          </Button>
        </div>
      </div>

      <QRScannerModal
        open={showQR}
        onClose={() => setShowQR(false)}
        onScan={handleQRScan}
      />
      <ProductPickerModal
        open={showProducts}
        onClose={() => setShowProducts(false)}
        onAddMultiple={addMultipleToCart}
        products={products}
        onAddNewProduct={onAddNewProduct}
      />
      <TipoEntradaModal
        open={showTipos}
        onClose={() => setShowTipos(false)}
        onSelect={setSelectedTipo}
      />
      <DestinoModal
        open={showDestino}
        onClose={() => setShowDestino(false)}
        onSelect={(d) => {
          setSelectedDestino(d);
          setShowDestino(false);
        }}
      />
    </div>
  );
}

interface DestinoOption {
  tipo: "almacen" | "puntoVenta" | "produccion";
  id: string;
  nombre: string;
}

function DestinoModal({
  open,
  onClose,
  onSelect,
}: {
  open: boolean;
  onClose: () => void;
  onSelect: (d: DestinoOption) => void;
}) {
  const almacenes = getAlmacenes();
  const puntos = getPuntosVenta();

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-xs mx-auto rounded-2xl p-0 overflow-hidden">
        <DialogHeader className="px-4 pt-4 pb-2">
          <DialogTitle className="text-base">Seleccionar Destino</DialogTitle>
        </DialogHeader>
        <ScrollArea className="max-h-72">
          <div className="px-2 pb-4 space-y-1">
            <button
              type="button"
              onClick={() =>
                onSelect({
                  tipo: "produccion",
                  id: "produccion",
                  nombre: "Producción (Insumos)",
                })
              }
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-muted transition-colors text-left"
              data-ocid="entrada.destino.produccion"
            >
              <span className="text-lg">⚙️</span>
              <div>
                <p className="text-sm font-medium">Producción (Insumos)</p>
                <p className="text-xs text-muted-foreground">
                  Los productos irán a la pestaña Insumos
                </p>
              </div>
            </button>
            {almacenes.map((a) => (
              <button
                key={a.id}
                type="button"
                onClick={() =>
                  onSelect({
                    tipo: "almacen",
                    id: a.id,
                    nombre: `Almacén #${a.numero} - ${a.descripcion}`,
                  })
                }
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-muted transition-colors text-left"
              >
                <Warehouse
                  size={16}
                  className="text-muted-foreground shrink-0"
                />
                <div>
                  <p className="text-sm font-medium">
                    Almacén #{a.numero} - {a.descripcion}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {a.categorias.join(", ")}
                  </p>
                </div>
              </button>
            ))}
            {puntos.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() =>
                  onSelect({
                    tipo: "puntoVenta",
                    id: p.id,
                    nombre: `PDV: ${p.name}`,
                  })
                }
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-muted transition-colors text-left"
              >
                <MapPin size={16} className="text-muted-foreground shrink-0" />
                <p className="text-sm font-medium">PDV: {p.name}</p>
              </button>
            ))}
            {almacenes.length === 0 && puntos.length === 0 && (
              <p className="text-xs text-muted-foreground px-3 py-2">
                No hay almacenes ni puntos de venta configurados. Ve a
                Configuración para agregarlos.
              </p>
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
