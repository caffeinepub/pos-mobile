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
  Barcode,
  Camera,
  FileDown,
  FileUp,
  ImageIcon,
  LayoutGrid,
  LayoutList,
  Loader2,
  MoreVertical,
  Package,
  Pencil,
  Plus,
  QrCode,
  Search,
  Trash2,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
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
import { getAlmacenes } from "../utils/almacenes";
import { buildFileHeader, buildHtmlHeader } from "../utils/businessData";
import { getMovimientoDelDia } from "../utils/movimientos";
import { getPuntosVenta } from "../utils/puntosVenta";

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

async function toBase64(src: string): Promise<string> {
  if (src.startsWith("data:")) return src;
  const res = await fetch(src);
  const blob = await res.blob();
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

// ---------- ProductThumbnail ----------
function ProductThumbnail({ productId }: { productId: bigint }) {
  const meta = getProductMeta(productId);
  if (meta.image) {
    return (
      <div className="w-10 h-10 rounded-xl overflow-hidden shrink-0 border border-border">
        <img
          src={meta.image}
          alt="producto"
          className="w-full h-full object-cover"
        />
      </div>
    );
  }
  return (
    <div className="w-10 h-10 rounded-xl bg-teal/10 flex items-center justify-center shrink-0">
      <Package size={16} className="text-teal" />
    </div>
  );
}

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
        data-ocid="inventariopv.unit.button"
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
        data-ocid="inventariopv.unit.input"
      />
      <Button
        type="button"
        size="sm"
        className="h-10 px-2 text-xs"
        onClick={handleConfirm}
        data-ocid="inventariopv.unit.save_button"
      >
        OK
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="h-10 px-2 text-xs"
        onClick={() => setOpen(false)}
        data-ocid="inventariopv.unit.cancel_button"
      >
        ✕
      </Button>
    </div>
  );
}

// ---------- Product Form Screen ----------
function ProductFormScreen({
  onClose,
  editProduct,
  onSaved,
}: {
  onClose: () => void;
  editProduct?: Product | null;
  onSaved?: () => void;
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
  const [ubicacion, setUbicacion] = useState<{
    tipo: "almacen" | "puntoVenta" | "none";
    id: string;
  }>({ tipo: "none", id: "" });
  const [categoria, setCategoria] = useState<string>("");

  const fileInputRef = useRef<HTMLInputElement>(null);

  // biome-ignore lint/correctness/useExhaustiveDependencies: editProduct used intentionally
  useEffect(() => {
    if (editProduct) {
      setNombre(editProduct.name);
      setCodigo(editProduct.barcode);
      setCantidad(Number(editProduct.stock));
      setPrecioVenta(formatPrice(editProduct.price));
      setPrecioCosto("");
      const meta = getProductMeta(editProduct.id);
      setImagePreview(meta.image);
      const savedUnit = meta.unit || "Unidad";
      setSelectedUnit(savedUnit);
      if (!DEFAULT_UNITS.includes(savedUnit)) {
        setUnits((prev) =>
          prev.includes(savedUnit) ? prev : [...prev, savedUnit],
        );
      }
      setUbicacion({
        tipo: meta.ubicacionTipo ?? "none",
        id: meta.ubicacionId ?? "",
      });
      setCategoria(meta.categoria ?? "");
    } else {
      resetFields();
    }
  }, [editProduct]);

  const resetFields = () => {
    setImagePreview(null);
    setNombre("");
    setCodigo("");
    setCantidad(0);
    setSelectedUnit("Unidad");
    setPrecioCosto("");
    setPrecioVenta("");
    setUbicacion({ tipo: "none", id: "" });
    setCategoria("");
    setUnits(DEFAULT_UNITS);
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
    const stockFinal = cantidad;
    try {
      let base64Image: string | null = null;
      if (imagePreview) {
        try {
          base64Image = await toBase64(imagePreview);
        } catch {
          base64Image = null;
        }
      }

      if (isEditing && editProduct) {
        await updateProduct.mutateAsync({
          id: editProduct.id,
          name: nombre.trim(),
          price: BigInt(Math.round(ventaNum * 100)),
          barcode: codigo.trim(),
          stock: BigInt(Math.max(0, stockFinal)),
        });
        setProductMeta(editProduct.id, {
          image: base64Image,
          unit: selectedUnit,
          ubicacionTipo: ubicacion.tipo,
          ubicacionId: ubicacion.id,
          ubicacionNombre:
            ubicacion.tipo === "almacen"
              ? getAlmacenes().find((a) => a.id === ubicacion.id)?.descripcion
              : ubicacion.tipo === "puntoVenta"
                ? getPuntosVenta().find((p) => p.id === ubicacion.id)?.name
                : undefined,
          categoria: categoria || undefined,
        });
        toast.success("Producto actualizado");
      } else {
        const newId = await createProduct.mutateAsync({
          name: nombre.trim(),
          price: BigInt(Math.round(ventaNum * 100)),
          barcode: codigo.trim(),
          stock: BigInt(Math.max(0, stockFinal)),
        });
        setProductMeta(newId, {
          image: base64Image,
          unit: selectedUnit,
          ubicacionTipo: ubicacion.tipo,
          ubicacionId: ubicacion.id,
          ubicacionNombre:
            ubicacion.tipo === "almacen"
              ? getAlmacenes().find((a) => a.id === ubicacion.id)?.descripcion
              : ubicacion.tipo === "puntoVenta"
                ? getPuntosVenta().find((p) => p.id === ubicacion.id)?.name
                : undefined,
          categoria: categoria || undefined,
        });
        toast.success("Producto guardado");
      }
      onSaved?.();
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
      <div className="h-full flex flex-col" data-ocid="inventariopv.dialog">
        <div className="flex items-center px-4 py-3 border-b border-border shrink-0">
          <button
            type="button"
            onClick={handleClose}
            className="flex items-center gap-2 text-sm font-medium text-foreground"
          >
            <ArrowLeft size={18} />
            {isEditing ? "Editar producto" : "Agregar producto"}
          </button>
        </div>

        <ScrollArea className="flex-1 overflow-auto">
          <div className="px-5 pb-6 space-y-5 pt-4">
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
                  data-ocid="inventariopv.upload_button"
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
                  data-ocid="inventariopv.camera.button"
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
                  data-ocid="inventariopv.delete_button"
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
              <Label htmlFor="pv-nombre">
                Nombre del producto <span className="text-destructive">*</span>
              </Label>
              <Input
                id="pv-nombre"
                placeholder="Ej. Arroz 1kg"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                data-ocid="inventariopv.input"
              />
            </div>

            {/* Código */}
            <div className="space-y-1.5">
              <Label htmlFor="pv-codigo">Código del producto</Label>
              <div className="flex gap-2">
                <Input
                  id="pv-codigo"
                  placeholder="Escribe o escanea"
                  value={codigo}
                  onChange={(e) => setCodigo(e.target.value)}
                  className="flex-1"
                  data-ocid="inventariopv.search_input"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="h-10 w-10 shrink-0"
                  onClick={() => setShowQR(true)}
                  data-ocid="inventariopv.qr.button"
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
                  data-ocid="inventariopv.cantidad.input"
                />
                <Select value={selectedUnit} onValueChange={setSelectedUnit}>
                  <SelectTrigger
                    className="flex-1"
                    data-ocid="inventariopv.unit.select"
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
              <Label htmlFor="pv-precioCosto">Precio de costo</Label>
              <Input
                id="pv-precioCosto"
                type="number"
                min={0}
                step="0.01"
                placeholder="0.00"
                value={precioCosto}
                onChange={(e) => setPrecioCosto(e.target.value)}
                data-ocid="inventariopv.costo.input"
              />
            </div>

            {/* Precio venta */}
            <div className="space-y-1.5">
              <Label htmlFor="pv-precioVenta">
                Precio de venta <span className="text-destructive">*</span>
              </Label>
              <Input
                id="pv-precioVenta"
                type="number"
                min={0}
                step="0.01"
                placeholder="0.00"
                value={precioVenta}
                onChange={(e) => setPrecioVenta(e.target.value)}
                data-ocid="inventariopv.venta.input"
              />
            </div>

            {/* Movimientos informativo (solo edición) */}
            {isEditing &&
              editProduct &&
              (() => {
                const today = new Date().toISOString().split("T")[0];
                const mov = getMovimientoDelDia(String(editProduct.id), today);
                if (mov && (mov.entradas > 0 || mov.salidas > 0)) {
                  return (
                    <p className="text-xs text-muted-foreground bg-muted/40 rounded-lg px-3 py-2">
                      Movimientos hoy:{" "}
                      <span className="text-emerald-600 font-medium">
                        Entradas: {mov.entradas}
                      </span>
                      {" | "}
                      <span className="text-orange-500 font-medium">
                        Salidas: {mov.salidas}
                      </span>
                    </p>
                  );
                }
                return (
                  <p className="text-xs text-muted-foreground/60">
                    Sin movimientos hoy
                  </p>
                );
              })()}

            {/* Stock preview */}
            <p className="text-xs text-muted-foreground">
              Stock final: {Math.max(0, cantidad)} {selectedUnit}
            </p>

            {/* Almacén o Punto de Venta */}
            <div className="space-y-1.5">
              <Label>Almacén o Punto de Venta</Label>
              <Select
                value={
                  ubicacion.tipo === "none"
                    ? "__none__"
                    : `${ubicacion.tipo}::${ubicacion.id}`
                }
                onValueChange={(val) => {
                  if (val === "__none__") {
                    setUbicacion({ tipo: "none", id: "" });
                    setCategoria("");
                  } else {
                    const [tipo, id] = val.split("::");
                    setUbicacion({
                      tipo: tipo as "almacen" | "puntoVenta",
                      id,
                    });
                    setCategoria("");
                  }
                }}
              >
                <SelectTrigger data-ocid="inventariopv.ubicacion.select">
                  <SelectValue placeholder="Sin asignar" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">Sin asignar</SelectItem>
                  {getAlmacenes().map((a) => (
                    <SelectItem key={a.id} value={`almacen::${a.id}`}>
                      Almacén #{a.numero} - {a.descripcion}
                    </SelectItem>
                  ))}
                  {getPuntosVenta().map((p) => (
                    <SelectItem key={p.id} value={`puntoVenta::${p.id}`}>
                      PDV: {p.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Categoría (solo si hay almacén seleccionado) */}
            {ubicacion.tipo === "almacen" &&
              (() => {
                const almacen = getAlmacenes().find(
                  (a) => a.id === ubicacion.id,
                );
                if (!almacen || almacen.categorias.length === 0) return null;
                return (
                  <div className="space-y-1.5">
                    <Label>Categoría en el almacén</Label>
                    <Select
                      value={categoria || "__none__"}
                      onValueChange={(val) =>
                        setCategoria(val === "__none__" ? "" : val)
                      }
                    >
                      <SelectTrigger data-ocid="inventariopv.categoria.select">
                        <SelectValue placeholder="Sin categoría" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__none__">Sin categoría</SelectItem>
                        {almacen.categorias.map((cat) => (
                          <SelectItem key={cat} value={cat}>
                            {cat}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                );
              })()}

            {/* Guardar / Actualizar */}
            <Button
              className="w-full h-12 text-base font-semibold mt-2"
              onClick={handleGuardar}
              disabled={isPending}
              data-ocid="inventariopv.submit_button"
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
      </div>

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

// ---------- InventarioPV Page ----------
export default function InventarioPV() {
  const { data: products = [], isLoading } = useProducts();
  const deleteProduct = useDeleteProduct();
  const createProduct = useCreateProduct();
  const [showProductScreen, setShowProductScreen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [showSearch, setShowSearch] = useState(false);
  const [, forceUpdate] = useState(0);
  const [viewMode, setViewMode] = useState<"list" | "grid">("list");

  const fileInputRef2 = useRef<HTMLInputElement>(null);

  // Filter: show products assigned to puntoVenta or with no assignment (backward compat)
  const pvProducts = products.filter((p) => {
    const meta = getProductMeta(p.id);
    return (
      !meta.ubicacionTipo ||
      meta.ubicacionTipo === "puntoVenta" ||
      meta.ubicacionTipo === "none"
    );
  });

  const filteredProducts = searchTerm
    ? pvProducts.filter(
        (p) =>
          p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          p.barcode.toLowerCase().includes(searchTerm.toLowerCase()),
      )
    : pvProducts;

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

  const exportCSV = () => {
    const header = buildFileHeader();
    const cols =
      "Código del producto,Nombre del producto,Stock final,Unidad de medida,Precio de venta";
    const rows = filteredProducts.map((p) => {
      const unit = getProductMeta(p.id).unit;
      return `${p.barcode},${p.name},${String(p.stock)},${unit},${formatPrice(p.price)}`;
    });
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
    const rows = filteredProducts
      .map((p) => {
        const unit = getProductMeta(p.id).unit;
        return `<tr><td>${p.barcode}</td><td>${p.name}</td><td>${String(p.stock)}</td><td>${unit}</td><td>$${formatPrice(p.price)}</td></tr>`;
      })
      .join("");
    const html = `<html><head><title>Inventario PV</title><style>body{font-family:sans-serif;padding:20px}table{width:100%;border-collapse:collapse}th,td{border:1px solid #ddd;padding:8px;text-align:left}th{background:#0B2040;color:white}.header{margin-bottom:16px;padding:12px;background:#f5f5f5;border-radius:6px}</style></head><body><div class="header">${htmlHeader}</div><h2>Inventario Punto de Venta</h2><table><thead><tr><th>Código</th><th>Nombre</th><th>Stock</th><th>Unidad</th><th>Precio venta</th></tr></thead><tbody>${rows}</tbody></table></body></html>`;
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
        if (!headerSkipped && line.toLowerCase().startsWith("nombre")) {
          headerSkipped = true;
          continue;
        }

        const cols = line.split(",").map((c) => c.trim());
        const nombre = cols[0] ?? "";
        const codigo = cols[1] ?? "";
        const cantidad = Number.parseInt(cols[2] ?? "0") || 0;
        const unidad = cols[3] ?? "Unidad";
        const precioVenta = Number.parseFloat(cols[5] ?? "0") || 0;

        if (!nombre || precioVenta <= 0) {
          errors++;
          continue;
        }

        try {
          const newId = await createProduct.mutateAsync({
            name: nombre,
            price: BigInt(Math.round(precioVenta * 100)),
            barcode: codigo,
            stock: BigInt(Math.max(0, cantidad)),
          });
          setProductMeta(newId, { image: null, unit: unidad || "Unidad" });
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

  return (
    <div className="relative px-4 pb-6 pt-4">
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-muted-foreground">
          {filteredProducts.length} productos en punto de venta
        </p>
        <div className="flex items-center gap-1 ml-auto mr-1">
          <button
            type="button"
            onClick={() => setViewMode("list")}
            className={`p-1.5 rounded-lg transition-colors ${
              viewMode === "list"
                ? "bg-muted text-foreground"
                : "text-muted-foreground hover:bg-muted"
            }`}
          >
            <LayoutList size={16} />
          </button>
          <button
            type="button"
            onClick={() => setViewMode("grid")}
            className={`p-1.5 rounded-lg transition-colors ${
              viewMode === "grid"
                ? "bg-muted text-foreground"
                : "text-muted-foreground hover:bg-muted"
            }`}
          >
            <LayoutGrid size={16} />
          </button>
        </div>
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
            <DropdownMenuItem onClick={() => fileInputRef2.current?.click()}>
              <FileUp size={14} className="mr-2" /> Importar CSV
            </DropdownMenuItem>
            <DropdownMenuItem onClick={exportCSV}>
              <FileDown size={14} className="mr-2" /> Exportar CSV
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
      </div>
      {showSearch && (
        <div className="mb-3">
          <input
            type="text"
            placeholder="Buscar por nombre o código..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>
      )}
      <ScrollArea className="h-[calc(100vh-180px)]">
        {isLoading ? (
          <div className="space-y-3" data-ocid="inventariopv.loading_state">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-16 bg-muted rounded-xl animate-pulse" />
            ))}
          </div>
        ) : pvProducts.length === 0 ? (
          <div
            className="py-16 text-center"
            data-ocid="inventariopv.empty_state"
          >
            <Package
              size={40}
              className="mx-auto text-muted-foreground/30 mb-3"
            />
            <p className="text-muted-foreground">
              Sin productos en punto de venta
            </p>
            <p className="text-xs text-muted-foreground/60 mt-1">
              Toca + para agregar tu primer producto
            </p>
          </div>
        ) : (
          <>
            {viewMode === "list" ? (
              <div className="space-y-2">
                {filteredProducts.map((p, idx) => (
                  <div
                    key={String(p.id)}
                    data-ocid={`inventariopv.item.${idx + 1}`}
                    className="bg-card border border-border rounded-xl px-4 py-3 flex items-center gap-3 shadow-xs"
                  >
                    <ProductThumbnail productId={p.id} />
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
            ) : (
              <div className="grid grid-cols-2 gap-3">
                {filteredProducts.map((p, idx) => (
                  <div
                    key={String(p.id)}
                    data-ocid={`inventariopv.item.${idx + 1}`}
                    className="bg-card border border-border rounded-xl p-3 flex flex-col gap-2 shadow-xs"
                  >
                    <ProductThumbnail productId={p.id} />
                    <p className="font-semibold text-xs truncate">{p.name}</p>
                    <p className="font-bold text-xs text-teal">
                      ${formatPrice(p.price)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Stock: {String(p.stock)}
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
                ))}
              </div>
            )}
          </>
        )}
      </ScrollArea>

      {/* FAB */}
      <button
        type="button"
        onClick={() => {
          setEditingProduct(null);
          setShowProductScreen(true);
        }}
        className="absolute bottom-6 right-2 w-14 h-14 rounded-full bg-primary text-primary-foreground shadow-lg flex items-center justify-center hover:bg-primary/90 active:scale-95 transition-transform"
        data-ocid="inventariopv.open_modal_button"
        aria-label="Agregar producto"
      >
        <Plus size={28} strokeWidth={2.5} />
      </button>

      {showProductScreen && (
        <div className="absolute inset-0 bg-background z-20 flex flex-col">
          <ProductFormScreen
            onClose={() => {
              setShowProductScreen(false);
              setEditingProduct(null);
              handleModalClose();
            }}
            editProduct={editingProduct}
            onSaved={() => {
              forceUpdate((n) => n + 1);
              setShowProductScreen(false);
              setEditingProduct(null);
            }}
          />
        </div>
      )}
    </div>
  );
}
