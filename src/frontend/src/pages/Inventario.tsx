import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
  Barcode,
  Camera,
  ImageIcon,
  Loader2,
  Package,
  Pencil,
  Plus,
  QrCode,
  Trash2,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import type { Product } from "../backend.d";
import { useCamera } from "../camera/useCamera";
import {
  useCreateProduct,
  useDeleteProduct,
  useProducts,
  useUpdateProduct,
} from "../hooks/useQueries";
import { useQRScanner } from "../qr-code/useQRScanner";

function formatPrice(price: bigint): string {
  return (Number(price) / 100).toFixed(2);
}

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

// ---------- QR Scanner Overlay ----------
function QRScannerOverlay({
  onResult,
  onClose,
}: {
  onResult: (data: string) => void;
  onClose: () => void;
}) {
  const {
    qrResults,
    isActive,
    isSupported,
    error,
    isLoading,
    canStartScanning,
    startScanning,
    stopScanning,
    videoRef,
    canvasRef,
  } = useQRScanner({
    facingMode: "environment",
    scanInterval: 100,
    maxResults: 1,
  });

  const handledRef = useRef(false);

  // biome-ignore lint/correctness/useExhaustiveDependencies: mount-once
  useEffect(() => {
    startScanning();
    return () => {
      stopScanning();
    };
  }, []);

  useEffect(() => {
    if (qrResults.length > 0 && !handledRef.current) {
      handledRef.current = true;
      onResult(qrResults[0].data);
    }
  }, [qrResults, onResult]);

  return (
    <div className="fixed inset-0 z-[200] bg-black flex flex-col">
      <div className="flex items-center justify-between p-4">
        <span className="text-white font-semibold">Escanear código</span>
        <Button
          variant="ghost"
          size="sm"
          className="text-white hover:text-white hover:bg-white/20"
          onClick={onClose}
        >
          Cerrar
        </Button>
      </div>
      <div className="flex-1 relative flex items-center justify-center">
        {isSupported === false ? (
          <p className="text-white">Cámara no soportada</p>
        ) : (
          <>
            <video
              ref={videoRef}
              className="w-full max-h-full object-cover"
              playsInline
              muted
              style={{ minHeight: 240 }}
            />
            <canvas ref={canvasRef} style={{ display: "none" }} />
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="w-56 h-56 border-2 border-white rounded-xl opacity-70" />
            </div>
          </>
        )}
        {error && (
          <p className="absolute bottom-4 text-red-400 text-sm px-4 text-center">
            {error.message}
          </p>
        )}
        {isLoading && !isActive && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/60">
            <Loader2 className="text-white animate-spin" size={36} />
          </div>
        )}
      </div>
      {!isActive && canStartScanning && (
        <div className="p-4">
          <Button
            className="w-full"
            onClick={startScanning}
            disabled={isLoading}
          >
            Iniciar escáner
          </Button>
        </div>
      )}
    </div>
  );
}

// ---------- Camera Overlay ----------
function CameraOverlay({
  onCapture,
  onClose,
}: {
  onCapture: (file: File) => void;
  onClose: () => void;
}) {
  const {
    isActive,
    isSupported,
    error,
    isLoading,
    startCamera,
    stopCamera,
    capturePhoto,
    videoRef,
    canvasRef,
  } = useCamera({ facingMode: "environment" });

  // biome-ignore lint/correctness/useExhaustiveDependencies: mount-once
  useEffect(() => {
    startCamera();
    return () => {
      stopCamera();
    };
  }, []);

  const handleCapture = async () => {
    const file = await capturePhoto();
    if (file) {
      onCapture(file);
    }
  };

  return (
    <div className="fixed inset-0 z-[200] bg-black flex flex-col">
      <div className="flex items-center justify-between p-4">
        <span className="text-white font-semibold">Tomar foto</span>
        <Button
          variant="ghost"
          size="sm"
          className="text-white hover:text-white hover:bg-white/20"
          onClick={onClose}
        >
          Cerrar
        </Button>
      </div>
      <div className="flex-1 relative flex items-center justify-center">
        {isSupported === false ? (
          <p className="text-white">Cámara no soportada</p>
        ) : (
          <>
            <video
              ref={videoRef}
              className="w-full max-h-full object-cover"
              playsInline
              muted
              style={{ minHeight: 240 }}
            />
            <canvas ref={canvasRef} style={{ display: "none" }} />
          </>
        )}
        {error && (
          <p className="absolute bottom-16 text-red-400 text-sm px-4 text-center">
            {error.message}
          </p>
        )}
        {isLoading && !isActive && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/60">
            <Loader2 className="text-white animate-spin" size={36} />
          </div>
        )}
      </div>
      <div className="p-6">
        <Button
          className="w-full h-14 rounded-full text-base font-semibold"
          onClick={handleCapture}
          disabled={!isActive || isLoading}
          data-ocid="camera.primary_button"
        >
          <Camera size={20} className="mr-2" />
          Capturar foto
        </Button>
      </div>
    </div>
  );
}

// ---------- Add Unit Inline ----------
function AddUnitInline({
  onAdd,
}: {
  onAdd: (unit: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState("");

  const handleConfirm = () => {
    const trimmed = value.trim();
    if (trimmed) {
      onAdd(trimmed);
      setValue("");
      setOpen(false);
    }
  };

  if (!open) {
    return (
      <Button
        type="button"
        variant="outline"
        size="icon"
        className="h-10 w-10 shrink-0"
        onClick={() => setOpen(true)}
        data-ocid="inventario.unit.button"
      >
        <Plus size={16} />
      </Button>
    );
  }

  return (
    <div className="flex items-center gap-1">
      <Input
        className="h-10 w-24 text-sm"
        placeholder="Nueva..."
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && handleConfirm()}
        autoFocus
        data-ocid="inventario.unit.input"
      />
      <Button
        type="button"
        size="sm"
        className="h-10 px-2 text-xs"
        onClick={handleConfirm}
        data-ocid="inventario.unit.save_button"
      >
        OK
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="h-10 px-2 text-xs"
        onClick={() => setOpen(false)}
        data-ocid="inventario.unit.cancel_button"
      >
        ✕
      </Button>
    </div>
  );
}

// ---------- Product Modal (Add or Edit) ----------
function ProductModal({
  open,
  onClose,
  editProduct,
}: {
  open: boolean;
  onClose: () => void;
  editProduct?: Product | null;
}) {
  const isEditing = !!editProduct;
  const createProduct = useCreateProduct();
  const updateProduct = useUpdateProduct();

  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [showCamera, setShowCamera] = useState(false);
  const [showQR, setShowQR] = useState(false);

  const [nombre, setNombre] = useState("");
  const [codigo, setCodigo] = useState("");
  const [cantidad, setCantidad] = useState(0);
  const [units, setUnits] = useState<string[]>(DEFAULT_UNITS);
  const [selectedUnit, setSelectedUnit] = useState("Unidad");
  const [precioCosto, setPrecioCosto] = useState("");
  const [precioVenta, setPrecioVenta] = useState("");
  const [entradas, setEntradas] = useState(0);
  const [salidas, setSalidas] = useState(0);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Populate fields when editing
  // biome-ignore lint/correctness/useExhaustiveDependencies: open used intentionally to reset on reopen
  useEffect(() => {
    if (editProduct) {
      setNombre(editProduct.name);
      setCodigo(editProduct.barcode);
      setCantidad(Number(editProduct.stock));
      setPrecioVenta(formatPrice(editProduct.price));
      setPrecioCosto("");
      setEntradas(0);
      setSalidas(0);
    } else {
      resetFields();
    }
  }, [editProduct, open]);

  const resetFields = () => {
    setImagePreview(null);
    setNombre("");
    setCodigo("");
    setCantidad(0);
    setSelectedUnit("Unidad");
    setPrecioCosto("");
    setPrecioVenta("");
    setEntradas(0);
    setSalidas(0);
  };

  const handleGallery = () => fileInputRef.current?.click();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) setImagePreview(URL.createObjectURL(file));
    e.target.value = "";
  };

  const handleCameraCapture = (file: File) => {
    setImagePreview(URL.createObjectURL(file));
    setShowCamera(false);
  };

  const handleQRResult = (data: string) => {
    setCodigo(data);
    setShowQR(false);
  };

  const handleAddUnit = (unit: string) => {
    setUnits((prev) => [...prev, unit]);
    setSelectedUnit(unit);
  };

  const handleSalidas = (val: number) => {
    const maxSalidas = cantidad + entradas;
    setSalidas(Math.min(Math.max(0, val), maxSalidas));
  };

  const handleGuardar = async () => {
    if (!nombre.trim()) {
      toast.error("El nombre del producto es obligatorio");
      return;
    }
    const ventaNum = Number.parseFloat(precioVenta) || 0;
    if (!precioVenta.trim() || ventaNum <= 0) {
      toast.error("El precio de venta es obligatorio y debe ser mayor a 0");
      return;
    }
    if (cantidad < 0) {
      toast.error("La cantidad no puede ser negativa");
      return;
    }
    const stockFinal = isEditing
      ? cantidad + entradas - salidas
      : cantidad + entradas - salidas;
    try {
      if (isEditing && editProduct) {
        await updateProduct.mutateAsync({
          id: editProduct.id,
          name: nombre.trim(),
          price: BigInt(Math.round(ventaNum * 100)),
          barcode: codigo.trim(),
          stock: BigInt(Math.max(0, stockFinal)),
        });
        toast.success("Producto actualizado");
      } else {
        await createProduct.mutateAsync({
          name: nombre.trim(),
          price: BigInt(Math.round(ventaNum * 100)),
          barcode: codigo.trim(),
          stock: BigInt(Math.max(0, stockFinal)),
        });
        toast.success("Producto guardado");
      }
      handleClose();
    } catch (err) {
      toast.error(
        `Error: ${err instanceof Error ? err.message : "Error desconocido"}`,
      );
    }
  };

  const handleClose = () => {
    resetFields();
    onClose();
  };

  const isPending = createProduct.isPending || updateProduct.isPending;

  return (
    <>
      <Dialog open={open} onOpenChange={(o) => !o && handleClose()}>
        <DialogContent
          className="max-w-md w-full p-0 gap-0 max-h-[90vh] flex flex-col"
          data-ocid="inventario.dialog"
        >
          <DialogHeader className="px-5 pt-5 pb-3 shrink-0">
            <DialogTitle className="text-lg font-bold">
              {isEditing ? "Editar producto" : "Agregar producto"}
            </DialogTitle>
          </DialogHeader>

          <ScrollArea className="flex-1 overflow-auto">
            <div className="px-5 pb-6 space-y-5">
              {/* Image section */}
              <div className="flex flex-col items-center gap-3">
                <div className="w-36 h-36 rounded-2xl border-2 border-dashed border-border bg-muted flex items-center justify-center overflow-hidden">
                  {imagePreview ? (
                    <img
                      src={imagePreview}
                      alt="preview"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <ImageIcon size={40} className="text-muted-foreground/40" />
                  )}
                </div>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="flex flex-col items-center gap-1 h-auto py-2 px-3 text-xs"
                    onClick={handleGallery}
                    data-ocid="inventario.upload_button"
                  >
                    <ImageIcon size={16} />
                    Galería
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="flex flex-col items-center gap-1 h-auto py-2 px-3 text-xs"
                    onClick={() => setShowCamera(true)}
                    data-ocid="inventario.camera.button"
                  >
                    <Camera size={16} />
                    Cámara
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="flex flex-col items-center gap-1 h-auto py-2 px-3 text-xs text-destructive hover:text-destructive"
                    onClick={() => setImagePreview(null)}
                    disabled={!imagePreview}
                    data-ocid="inventario.delete_button"
                  >
                    <Trash2 size={16} />
                    Eliminar
                  </Button>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleFileChange}
                />
              </div>

              {/* Nombre */}
              <div className="space-y-1.5">
                <Label htmlFor="nombre">
                  Nombre del producto{" "}
                  <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="nombre"
                  placeholder="Ej. Arroz 1kg"
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  data-ocid="inventario.input"
                />
              </div>

              {/* Código */}
              <div className="space-y-1.5">
                <Label htmlFor="codigo">Código del producto</Label>
                <div className="flex gap-2">
                  <Input
                    id="codigo"
                    placeholder="Escribe o escanea"
                    value={codigo}
                    onChange={(e) => setCodigo(e.target.value)}
                    className="flex-1"
                    data-ocid="inventario.search_input"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    className="h-10 w-10 shrink-0"
                    onClick={() => setShowQR(true)}
                    data-ocid="inventario.qr.button"
                  >
                    <QrCode size={18} />
                  </Button>
                </div>
              </div>

              {/* Cantidad + Unidad */}
              <div className="space-y-1.5">
                <Label>Cantidad y unidad de medida</Label>
                <div className="flex gap-2 items-center">
                  <Input
                    type="number"
                    min={0}
                    placeholder="0"
                    value={cantidad === 0 ? "" : cantidad}
                    onChange={(e) => {
                      const val = Number.parseInt(e.target.value) || 0;
                      setCantidad(Math.max(0, val));
                    }}
                    className="w-24 shrink-0"
                    data-ocid="inventario.cantidad.input"
                  />
                  <Select value={selectedUnit} onValueChange={setSelectedUnit}>
                    <SelectTrigger
                      className="flex-1"
                      data-ocid="inventario.unit.select"
                    >
                      <SelectValue placeholder="Unidad" />
                    </SelectTrigger>
                    <SelectContent>
                      {units.map((u) => (
                        <SelectItem key={u} value={u}>
                          {u}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <AddUnitInline onAdd={handleAddUnit} />
                </div>
              </div>

              {/* Precio costo */}
              <div className="space-y-1.5">
                <Label htmlFor="precioCosto">Precio de costo</Label>
                <Input
                  id="precioCosto"
                  type="number"
                  min={0}
                  step="0.01"
                  placeholder="0.00"
                  value={precioCosto}
                  onChange={(e) => setPrecioCosto(e.target.value)}
                  data-ocid="inventario.costo.input"
                />
              </div>

              {/* Precio venta */}
              <div className="space-y-1.5">
                <Label htmlFor="precioVenta">
                  Precio de venta <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="precioVenta"
                  type="number"
                  min={0}
                  step="0.01"
                  placeholder="0.00"
                  value={precioVenta}
                  onChange={(e) => setPrecioVenta(e.target.value)}
                  data-ocid="inventario.venta.input"
                />
              </div>

              {/* Entradas y Salidas */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="entradas">Entradas</Label>
                  <Input
                    id="entradas"
                    type="number"
                    min={0}
                    placeholder="0"
                    value={entradas === 0 ? "" : entradas}
                    onChange={(e) => {
                      const val = Number.parseInt(e.target.value) || 0;
                      setEntradas(Math.max(0, val));
                    }}
                    data-ocid="inventario.entradas.input"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="salidas">Salidas</Label>
                  <Input
                    id="salidas"
                    type="number"
                    min={0}
                    placeholder="0"
                    value={salidas === 0 ? "" : salidas}
                    onChange={(e) =>
                      handleSalidas(Number.parseInt(e.target.value) || 0)
                    }
                    data-ocid="inventario.salidas.input"
                  />
                </div>
              </div>

              {/* Stock preview */}
              <p className="text-xs text-muted-foreground">
                Stock final: {Math.max(0, cantidad + entradas - salidas)}{" "}
                {selectedUnit}
              </p>

              {/* Guardar / Actualizar */}
              <Button
                className="w-full h-12 text-base font-semibold mt-2"
                onClick={handleGuardar}
                disabled={isPending}
                data-ocid="inventario.submit_button"
              >
                {isPending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : null}
                {isPending
                  ? isEditing
                    ? "Actualizando..."
                    : "Guardando..."
                  : isEditing
                    ? "Actualizar"
                    : "Guardar producto"}
              </Button>
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>

      {showCamera && (
        <CameraOverlay
          onCapture={handleCameraCapture}
          onClose={() => setShowCamera(false)}
        />
      )}

      {showQR && (
        <QRScannerOverlay
          onResult={handleQRResult}
          onClose={() => setShowQR(false)}
        />
      )}
    </>
  );
}

// ---------- Inventario Page ----------
export default function Inventario() {
  const { data: products = [], isLoading } = useProducts();
  const deleteProduct = useDeleteProduct();
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    setShowModal(true);
  };

  const handleDelete = async (product: Product) => {
    if (!window.confirm(`¿Eliminar "${product.name}"?`)) return;
    try {
      await deleteProduct.mutateAsync(product.id);
      toast.success("Producto eliminado");
    } catch {
      toast.error("Error al eliminar el producto");
    }
  };

  const handleModalClose = () => {
    setShowModal(false);
    setEditingProduct(null);
  };

  return (
    <div className="relative px-4 pb-6 pt-4">
      <p className="text-sm text-muted-foreground mb-4">
        {products.length} productos en inventario
      </p>
      <ScrollArea className="h-[calc(100vh-180px)]">
        {isLoading ? (
          <div className="space-y-3" data-ocid="inventario.loading_state">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-16 bg-muted rounded-xl animate-pulse" />
            ))}
          </div>
        ) : products.length === 0 ? (
          <div className="py-16 text-center" data-ocid="inventario.empty_state">
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
          <div className="space-y-2">
            {products.map((p, idx) => (
              <div
                key={String(p.id)}
                data-ocid={`inventario.item.${idx + 1}`}
                className="bg-card border border-border rounded-xl px-4 py-3 flex items-center gap-3 shadow-xs"
              >
                <div className="w-10 h-10 rounded-xl bg-teal/10 flex items-center justify-center shrink-0">
                  <Package size={16} className="text-teal" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm truncate">{p.name}</p>
                  <div className="flex items-center gap-1 mt-0.5">
                    <Barcode size={11} className="text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">
                      {p.barcode}
                    </span>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <p className="font-bold text-sm text-teal">
                    ${formatPrice(p.price)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Stock: {String(p.stock)}
                  </p>
                </div>
                {/* Edit / Delete buttons */}
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
            ))}
          </div>
        )}
      </ScrollArea>

      {/* FAB */}
      <button
        type="button"
        onClick={() => {
          setEditingProduct(null);
          setShowModal(true);
        }}
        className="absolute bottom-6 right-2 w-14 h-14 rounded-full bg-primary text-primary-foreground shadow-lg flex items-center justify-center hover:bg-primary/90 active:scale-95 transition-transform"
        data-ocid="inventario.open_modal_button"
        aria-label="Agregar producto"
      >
        <Plus size={28} strokeWidth={2.5} />
      </button>

      <ProductModal
        open={showModal}
        onClose={handleModalClose}
        editProduct={editingProduct}
      />
    </div>
  );
}
