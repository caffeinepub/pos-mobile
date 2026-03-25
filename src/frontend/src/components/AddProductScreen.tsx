import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
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
  ImageIcon,
  ImagePlus,
  Plus,
  Search,
  Trash2,
  X,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import type { Product } from "../backend.d";
import { useCreateProduct, useUpdateProduct } from "../hooks/useQueries";
import { useQRScanner } from "../qr-code/useQRScanner";
import { getAlmacenes } from "../utils/almacenes";
import { getEntradas } from "../utils/entradas";
import { getPuntosVenta } from "../utils/puntosVenta";
import {
  type PVInventoryItem,
  updatePVItem,
  upsertPVItem,
} from "../utils/pvInventory";
import { getSalidas } from "../utils/salidas";

// ---------- Catalog localStorage helpers ----------
const CATALOGO_KEY = "pos_catalogo_productos";

interface CatalogEntry {
  id: string;
  codigo: string;
  nombre: string;
  unidad: string;
}

export function getCatalogo(): CatalogEntry[] {
  try {
    return JSON.parse(
      localStorage.getItem(CATALOGO_KEY) ?? "[]",
    ) as CatalogEntry[];
  } catch {
    return [];
  }
}

export function saveCatalogo(entries: CatalogEntry[]): void {
  localStorage.setItem(CATALOGO_KEY, JSON.stringify(entries));
}

export function upsertCatalogEntry(
  codigo: string,
  nombre: string,
  unidad: string,
): void {
  const all = getCatalogo();
  const idx = all.findIndex((e) => e.codigo === codigo && codigo !== "");
  if (idx >= 0) {
    all[idx] = { ...all[idx], nombre, unidad };
  } else {
    all.push({ id: crypto.randomUUID(), codigo, nombre, unidad });
  }
  saveCatalogo(all);
}

// ---------- ProductMeta helpers ----------
interface ProductMeta {
  image: string | null;
  unit: string;
  ubicacionTipo?: "almacen" | "puntoVenta" | "none";
  ubicacionId?: string;
  ubicacionNombre?: string;
  categoria?: string;
}

export function getProductMeta(id: bigint): ProductMeta {
  try {
    const raw = localStorage.getItem(`product-meta-${String(id)}`);
    if (raw) return JSON.parse(raw) as ProductMeta;
  } catch {}
  return { image: null, unit: "Unidad" };
}

export function setProductMeta(id: bigint, meta: ProductMeta) {
  try {
    localStorage.setItem(`product-meta-${String(id)}`, JSON.stringify(meta));
  } catch {}
}

// ---------- Constants ----------
export const DEFAULT_UNITS = [
  "Unidad",
  "Kg",
  "g",
  "L",
  "mL",
  "m",
  "cm",
  "Caja",
  "Paquete",
  "Docena",
];

// ---------- AddUnitInline ----------
function AddUnitInline({ onAdd }: { onAdd: (unit: string) => void }) {
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
        data-ocid="addproduct.unit.button"
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
        data-ocid="addproduct.unit.input"
      />
      <Button
        type="button"
        size="sm"
        className="h-10 px-2 text-xs"
        onClick={handleConfirm}
        data-ocid="addproduct.unit.save_button"
      >
        OK
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="h-10 px-2 text-xs"
        onClick={() => setOpen(false)}
        data-ocid="addproduct.unit.cancel_button"
      >
        ✕
      </Button>
    </div>
  );
}

// ---------- Inline QR Scanner ----------
function InlineQRScanner({
  onResult,
  onClose,
}: {
  onResult: (code: string) => void;
  onClose: () => void;
}) {
  const scanner = useQRScanner({ facingMode: "environment" });
  const prevResultCount = useRef(0);

  // biome-ignore lint/correctness/useExhaustiveDependencies: scanner functions stable
  useEffect(() => {
    scanner.startScanning();
    return () => {
      scanner.stopScanning();
    };
  }, []);

  useEffect(() => {
    if (scanner.qrResults.length > prevResultCount.current) {
      prevResultCount.current = scanner.qrResults.length;
      const latest = scanner.qrResults[0];
      if (latest) {
        onResult(latest.data);
        scanner.stopScanning();
      }
    }
  }, [scanner.qrResults, onResult, scanner]);

  return (
    <div className="mt-2 rounded-xl overflow-hidden border border-border bg-black relative">
      <video
        ref={scanner.videoRef}
        autoPlay
        playsInline
        muted
        className="w-full max-h-48 object-cover"
      />
      <canvas ref={scanner.canvasRef} className="hidden" />
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="w-40 h-40 border-2 border-primary/70 rounded-lg" />
      </div>
      <button
        type="button"
        onClick={onClose}
        className="absolute top-2 right-2 bg-black/60 rounded-full p-1 text-white"
        data-ocid="addproduct.scanner.close_button"
      >
        <X size={16} />
      </button>
      {scanner.isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/50">
          <p className="text-white text-xs">Iniciando cámara...</p>
        </div>
      )}
      {scanner.error && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/50 p-3">
          <p className="text-white text-xs text-center">
            {String(scanner.error ?? "")}
          </p>
        </div>
      )}
    </div>
  );
}

// ---------- Inline Camera Capture ----------
function InlineCameraCapture({
  onCapture,
  onClose,
}: {
  onCapture: (dataUrl: string) => void;
  onClose: () => void;
}) {
  const scanner = useQRScanner({ facingMode: "environment" });

  // biome-ignore lint/correctness/useExhaustiveDependencies: scanner functions stable
  useEffect(() => {
    scanner.startScanning();
    return () => {
      scanner.stopScanning();
    };
  }, []);

  const handleCapture = () => {
    if (!scanner.videoRef.current || !scanner.canvasRef.current) return;
    const video = scanner.videoRef.current;
    const canvas = scanner.canvasRef.current;
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL("image/jpeg", 0.8);
      onCapture(dataUrl);
      scanner.stopScanning();
    }
  };

  return (
    <div className="mt-2 rounded-xl overflow-hidden border border-border bg-black relative">
      <video
        ref={scanner.videoRef}
        autoPlay
        playsInline
        muted
        className="w-full max-h-56 object-cover"
      />
      <canvas ref={scanner.canvasRef} className="hidden" />
      <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-3">
        <button
          type="button"
          onClick={handleCapture}
          className="bg-white rounded-full w-12 h-12 flex items-center justify-center shadow-lg"
          data-ocid="addproduct.camera.capture_button"
        >
          <Camera size={22} className="text-primary" />
        </button>
        <button
          type="button"
          onClick={onClose}
          className="bg-black/60 rounded-full w-10 h-10 flex items-center justify-center"
          data-ocid="addproduct.camera.close_button"
        >
          <X size={16} className="text-white" />
        </button>
      </div>
      {scanner.isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/50">
          <p className="text-white text-xs">Iniciando cámara...</p>
        </div>
      )}
    </div>
  );
}

// ---------- Props ----------
export interface AddProductScreenProps {
  onClose: () => void;
  onSaved?: () => void;
  editProduct?: Product | null;
  initialAlmacenId?: string;
  editPVItem?: PVInventoryItem | null;
  initialPVId?: string;
  mode: "almacen" | "pv";
}

// ---------- Main Component ----------
export default function AddProductScreen({
  onClose,
  onSaved,
  editProduct,
  initialAlmacenId,
  editPVItem,
  initialPVId,
  mode,
}: AddProductScreenProps) {
  const isEditing = !!(editProduct || editPVItem);
  const createProduct = useCreateProduct();
  const updateProduct = useUpdateProduct();

  // Form state
  const [image, setImage] = useState<string | null>(null);
  const [codigo, setCodigo] = useState("");
  const [nombre, setNombre] = useState("");
  const [cantidad, setCantidad] = useState("1");
  const [units, setUnits] = useState<string[]>(DEFAULT_UNITS);
  const [selectedUnit, setSelectedUnit] = useState("Unidad");
  const [precioCosto, setPrecioCosto] = useState("");
  const [precioVenta, setPrecioVenta] = useState("");
  const [location, setLocation] = useState(""); // "almacen:id" or "pv:id"
  const [categoria, setCategoria] = useState("");

  // UI state
  const [showQRScanner, setShowQRScanner] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const [catalogSearch, setCatalogSearch] = useState("");
  const [showCatalogDropdown, setShowCatalogDropdown] = useState(false);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  // Derived informative fields
  const [stockFinal, setStockFinal] = useState(0);
  const [entradasHoy, setEntradasHoy] = useState(0);
  const [salidasHoy, setSalidasHoy] = useState(0);

  // Catalog search results
  const catalogResults =
    catalogSearch.length >= 1
      ? getCatalogo()
          .filter(
            (e) =>
              e.nombre.toLowerCase().includes(catalogSearch.toLowerCase()) ||
              e.codigo.toLowerCase().includes(catalogSearch.toLowerCase()),
          )
          .slice(0, 6)
      : [];

  // Location options
  const almacenes = getAlmacenes();
  const puntosVenta = getPuntosVenta();

  // Categories for selected location
  const locationCategories: string[] = (() => {
    if (location.startsWith("almacen:")) {
      const id = location.slice(8);
      const alm = almacenes.find((a) => a.id === id);
      return alm?.categorias ?? [];
    }
    if (location.startsWith("pv:")) {
      return ["Mercancía Para la Venta", "Insumos", "Consignación"];
    }
    return [];
  })();

  // Price percentage
  const costoNum = Number.parseFloat(precioCosto) || 0;
  const ventaNum = Number.parseFloat(precioVenta) || 0;
  const margen = costoNum > 0 ? ((ventaNum - costoNum) / costoNum) * 100 : 0;
  const margenStr = costoNum > 0 ? `${margen.toFixed(0)}%` : "";
  const margenRojo = margen > 50;

  // biome-ignore lint/correctness/useExhaustiveDependencies: intentional
  useEffect(() => {
    if (editProduct) {
      setNombre(editProduct.name);
      setCodigo(editProduct.barcode);
      const meta = getProductMeta(editProduct.id);
      const savedUnit = meta.unit || "Unidad";
      setSelectedUnit(savedUnit);
      if (!DEFAULT_UNITS.includes(savedUnit)) {
        setUnits((prev) =>
          prev.includes(savedUnit) ? prev : [...prev, savedUnit],
        );
      }
      if (meta.image) setImage(meta.image);
      if (meta.ubicacionTipo === "almacen" && meta.ubicacionId) {
        setLocation(`almacen:${meta.ubicacionId}`);
      } else if (meta.ubicacionTipo === "puntoVenta" && meta.ubicacionId) {
        setLocation(`pv:${meta.ubicacionId}`);
      }
      if (meta.categoria) setCategoria(meta.categoria);
      const priceVal = Number(editProduct.price) / 100;
      setPrecioVenta(priceVal > 0 ? priceVal.toFixed(2) : "");
      setStockFinal(Number(editProduct.stock));
      // Load today's movements
      const today = new Date().toDateString();
      const todayEntradas = getEntradas()
        .filter((e) => new Date(e.date).toDateString() === today)
        .flatMap((e) => e.items)
        .filter((i) => i.productId === String(editProduct.id))
        .reduce((s, i) => s + i.quantity, 0);
      const todaySalidas = getSalidas()
        .filter((s) => new Date(s.date).toDateString() === today)
        .flatMap((s) => s.items)
        .filter((i) => i.productId === String(editProduct.id))
        .reduce((s, i) => s + i.quantity, 0);
      setEntradasHoy(todayEntradas);
      setSalidasHoy(todaySalidas);
    } else if (editPVItem) {
      setNombre(editPVItem.productName);
      setCodigo(editPVItem.productCode);
      setSelectedUnit(editPVItem.unit);
      if (!DEFAULT_UNITS.includes(editPVItem.unit)) {
        setUnits((prev) =>
          prev.includes(editPVItem.unit) ? prev : [...prev, editPVItem.unit],
        );
      }
      setLocation(`pv:${editPVItem.pvId}`);
      const priceVal = editPVItem.price / 100;
      setPrecioVenta(priceVal > 0 ? priceVal.toFixed(2) : "");
      setStockFinal(editPVItem.stock);
      setCantidad(String(editPVItem.stock));
    } else {
      // New product defaults
      if (initialAlmacenId) setLocation(`almacen:${initialAlmacenId}`);
      else if (initialPVId) setLocation(`pv:${initialPVId}`);
      else if (mode === "pv" && puntosVenta.length === 1)
        setLocation(`pv:${puntosVenta[0].id}`);
      else if (mode === "almacen" && almacenes.length === 1)
        setLocation(`almacen:${almacenes[0].id}`);
    }
  }, [editProduct, editPVItem]);

  // Reset categoria when location changes
  // biome-ignore lint/correctness/useExhaustiveDependencies: location drives reset
  useEffect(() => {
    setCategoria("");
  }, [location]);

  const handlePrecioCostoChange = (val: string) => {
    setPrecioCosto(val);
    const num = Number.parseFloat(val);
    if (!Number.isNaN(num) && num > 0) {
      setPrecioVenta((num * 1.5).toFixed(2));
    }
  };

  const handleAddUnit = (unit: string) => {
    setUnits((prev) => [...prev, unit]);
    setSelectedUnit(unit);
  };

  const handleGalleryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      if (ev.target?.result) setImage(ev.target.result as string);
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const handleCatalogSelect = (entry: CatalogEntry) => {
    setCodigo(entry.codigo);
    setNombre(entry.nombre);
    const u = entry.unidad;
    setSelectedUnit(u);
    if (!units.includes(u)) setUnits((prev) => [...prev, u]);
    setCatalogSearch("");
    setShowCatalogDropdown(false);
  };

  const handleGuardar = async () => {
    if (!nombre.trim()) {
      toast.error("El nombre del producto es obligatorio");
      return;
    }
    if (!codigo.trim()) {
      toast.error("El código del producto es obligatorio");
      return;
    }

    const priceVentaCents = Math.round(
      (Number.parseFloat(precioVenta) || 0) * 100,
    );
    const cantidadNum = Math.max(0, Number.parseInt(cantidad) || 0);

    try {
      if (location.startsWith("pv:")) {
        const pvId = location.slice(3);
        const pv = puntosVenta.find((p) => p.id === pvId);
        if (!pv) {
          toast.error("Selecciona un Punto de Venta válido");
          return;
        }
        if (editPVItem) {
          updatePVItem(editPVItem.id, {
            productCode: codigo.trim(),
            productName: nombre.trim(),
            unit: selectedUnit,
            price: priceVentaCents,
            stock: cantidadNum,
            pvId,
            pvName: pv.name,
          });
          toast.success("Producto actualizado");
        } else {
          upsertPVItem(
            pvId,
            pv.name,
            codigo.trim(),
            nombre.trim(),
            selectedUnit,
            priceVentaCents,
            cantidadNum,
          );
          toast.success("Producto agregado a Inventario PV");
        }
      } else if (location.startsWith("almacen:")) {
        const almacenId = location.slice(8);
        const alm = almacenes.find((a) => a.id === almacenId);
        if (editProduct) {
          await updateProduct.mutateAsync({
            id: editProduct.id,
            name: nombre.trim(),
            price: BigInt(priceVentaCents),
            barcode: codigo.trim(),
            stock: editProduct.stock,
          });
          setProductMeta(editProduct.id, {
            image,
            unit: selectedUnit,
            ubicacionTipo: "almacen",
            ubicacionId: almacenId,
            ubicacionNombre: alm?.descripcion ?? "",
            categoria,
          });
          toast.success("Producto actualizado");
        } else {
          const newId = await createProduct.mutateAsync({
            name: nombre.trim(),
            price: BigInt(priceVentaCents),
            barcode: codigo.trim(),
            stock: BigInt(cantidadNum),
          });
          setProductMeta(newId, {
            image,
            unit: selectedUnit,
            ubicacionTipo: "almacen",
            ubicacionId: almacenId,
            ubicacionNombre: alm?.descripcion ?? "",
            categoria,
          });
          toast.success("Producto guardado");
        }
      } else {
        // No location - just create in catalog
        if (editProduct) {
          await updateProduct.mutateAsync({
            id: editProduct.id,
            name: nombre.trim(),
            price: BigInt(priceVentaCents),
            barcode: codigo.trim(),
            stock: editProduct.stock,
          });
          const existingMeta = getProductMeta(editProduct.id);
          setProductMeta(editProduct.id, {
            ...existingMeta,
            unit: selectedUnit,
            image,
          });
          toast.success("Producto actualizado");
        } else {
          const newId = await createProduct.mutateAsync({
            name: nombre.trim(),
            price: BigInt(priceVentaCents),
            barcode: codigo.trim(),
            stock: BigInt(cantidadNum),
          });
          setProductMeta(newId, { image, unit: selectedUnit });
          toast.success("Producto guardado");
        }
      }

      // Always upsert catalog entry
      upsertCatalogEntry(codigo.trim(), nombre.trim(), selectedUnit);

      onSaved?.();
      onClose();
    } catch (err) {
      toast.error(
        `Error: ${err instanceof Error ? err.message : "Error desconocido"}`,
      );
    }
  };

  const isPending = createProduct.isPending || updateProduct.isPending;

  return (
    <div className="flex flex-col h-full min-h-0" data-ocid="addproduct.dialog">
      {/* Header */}
      <div className="flex items-center px-4 py-3 border-b border-border shrink-0">
        <button
          type="button"
          onClick={onClose}
          className="flex items-center gap-2 text-sm font-medium text-foreground"
          data-ocid="addproduct.close_button"
        >
          <ArrowLeft size={18} />
          {isEditing ? "Editar producto" : "Agregar producto al catálogo"}
        </button>
      </div>

      <ScrollArea className="flex-1 pr-1" type="always">
        <div className="px-5 pb-8 space-y-5 pt-4">
          {/* Catalog search */}
          <div className="relative space-y-1.5">
            <Label>Buscar en catálogo</Label>
            <div className="relative">
              <Search
                size={15}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
              />
              <Input
                placeholder="Buscar por código o nombre..."
                value={catalogSearch}
                onChange={(e) => {
                  setCatalogSearch(e.target.value);
                  setShowCatalogDropdown(true);
                }}
                onFocus={() => setShowCatalogDropdown(true)}
                className="pl-9"
                data-ocid="addproduct.search_input"
              />
            </div>
            {showCatalogDropdown && catalogResults.length > 0 && (
              <div className="absolute z-20 left-0 right-0 top-full mt-1 bg-card border border-border rounded-xl shadow-lg overflow-hidden">
                {catalogResults.map((entry) => (
                  <button
                    key={entry.id}
                    type="button"
                    className="w-full flex flex-col px-3 py-2.5 text-left hover:bg-muted transition-colors border-b border-border last:border-0"
                    onClick={() => handleCatalogSelect(entry)}
                  >
                    <span className="text-sm font-medium">{entry.nombre}</span>
                    <span className="text-xs text-muted-foreground">
                      {entry.codigo} · {entry.unidad}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Product image */}
          <div className="space-y-3">
            <Label>Imagen del producto</Label>
            <div
              className="w-full flex items-center justify-center rounded-xl border-2 border-dashed border-border bg-muted/30 overflow-hidden"
              style={{ minHeight: 140 }}
            >
              {image ? (
                <img
                  src={image}
                  alt="Producto"
                  className="w-full max-h-48 object-contain"
                />
              ) : (
                <div className="flex flex-col items-center gap-2 py-8 text-muted-foreground">
                  <ImageIcon size={40} />
                  <span className="text-xs">Sin imagen</span>
                </div>
              )}
            </div>
            {showCamera && (
              <InlineCameraCapture
                onCapture={(dataUrl) => {
                  setImage(dataUrl);
                  setShowCamera(false);
                }}
                onClose={() => setShowCamera(false)}
              />
            )}
            <div className="grid grid-cols-3 gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="flex flex-col gap-1 h-auto py-2 text-xs"
                onClick={() => galleryInputRef.current?.click()}
                data-ocid="addproduct.upload_button"
              >
                <ImagePlus size={16} />
                Galería
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="flex flex-col gap-1 h-auto py-2 text-xs"
                onClick={() => {
                  setShowCamera(!showCamera);
                }}
                data-ocid="addproduct.camera.button"
              >
                <Camera size={16} />
                Tomar foto
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="flex flex-col gap-1 h-auto py-2 text-xs text-destructive hover:text-destructive"
                onClick={() => setImage(null)}
                disabled={!image}
                data-ocid="addproduct.delete_button"
              >
                <Trash2 size={16} />
                Eliminar
              </Button>
            </div>
            <input
              ref={galleryInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleGalleryChange}
            />
          </div>

          {/* Código del producto */}
          <div className="space-y-1.5">
            <Label htmlFor="ap-codigo">Código del producto</Label>
            <div className="flex gap-2">
              <Input
                id="ap-codigo"
                placeholder="Ej. 001"
                value={codigo}
                onChange={(e) => setCodigo(e.target.value)}
                className="flex-1"
                data-ocid="addproduct.input"
              />
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="shrink-0 h-10 w-10"
                onClick={() => setShowQRScanner((v) => !v)}
                data-ocid="addproduct.scanner.toggle"
                title="Escanear QR / código de barras"
              >
                <Barcode size={18} />
              </Button>
            </div>
            {showQRScanner && (
              <InlineQRScanner
                onResult={(code) => {
                  setCodigo(code);
                  setShowQRScanner(false);
                }}
                onClose={() => setShowQRScanner(false)}
              />
            )}
          </div>

          {/* Nombre del producto */}
          <div className="space-y-1.5">
            <Label htmlFor="ap-nombre">
              Nombre del producto <span className="text-destructive">*</span>
            </Label>
            <Input
              id="ap-nombre"
              placeholder="Ej. Arroz 1kg"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              data-ocid="addproduct.nombre.input"
            />
          </div>

          {/* Cantidad + Unidad de medida */}
          <div className="space-y-1.5">
            <Label>Cantidad y unidad de medida</Label>
            <div className="flex gap-2 items-center">
              <Input
                type="number"
                min="0"
                step="1"
                placeholder="0"
                value={cantidad}
                onChange={(e) => setCantidad(e.target.value)}
                className="w-24 shrink-0"
                data-ocid="addproduct.cantidad.input"
              />
              <Select value={selectedUnit} onValueChange={setSelectedUnit}>
                <SelectTrigger
                  className="flex-1"
                  data-ocid="addproduct.unit.select"
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

          {/* Precio de costo */}
          <div className="space-y-1.5">
            <Label htmlFor="ap-costo">Precio de costo</Label>
            <Input
              id="ap-costo"
              type="number"
              min="0"
              step="0.01"
              placeholder="0.00"
              value={precioCosto}
              onChange={(e) => handlePrecioCostoChange(e.target.value)}
              data-ocid="addproduct.costo.input"
            />
          </div>

          {/* Precio de venta */}
          <div className="space-y-1.5">
            <Label htmlFor="ap-venta">Precio de venta</Label>
            <div className="flex gap-2 items-center">
              <Input
                id="ap-venta"
                type="number"
                min="0"
                step="0.01"
                placeholder="0.00"
                value={precioVenta}
                onChange={(e) => setPrecioVenta(e.target.value)}
                className="flex-1"
                data-ocid="addproduct.venta.input"
              />
              {margenStr && (
                <span
                  className={`text-sm font-semibold shrink-0 min-w-[3.5rem] text-right ${
                    margenRojo ? "text-destructive" : "text-green-600"
                  }`}
                  title={
                    margenRojo ? "¡Margen supera el 50%!" : "Margen sobre costo"
                  }
                >
                  {margenStr}
                  {margenRojo && " ⚠"}
                </span>
              )}
            </div>
            {margenRojo && (
              <p className="text-xs text-destructive">
                El precio de venta supera el 50% sobre el costo.
              </p>
            )}
          </div>

          {/* Informative fields */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-muted/40 rounded-xl p-3 flex flex-col gap-1">
              <span className="text-[10px] text-muted-foreground uppercase tracking-wide">
                Stock final
              </span>
              <span className="text-lg font-bold text-foreground">
                {stockFinal}
              </span>
              <span className="text-[10px] text-muted-foreground">
                informativo
              </span>
            </div>
            <div className="bg-green-50 dark:bg-green-950/20 rounded-xl p-3 flex flex-col gap-1 border border-green-200 dark:border-green-800">
              <span className="text-[10px] text-green-700 dark:text-green-400 uppercase tracking-wide">
                Entradas hoy
              </span>
              <span className="text-lg font-bold text-green-700 dark:text-green-400">
                {entradasHoy}
              </span>
              <span className="text-[10px] text-muted-foreground">
                informativo
              </span>
            </div>
            <div className="bg-orange-50 dark:bg-orange-950/20 rounded-xl p-3 flex flex-col gap-1 border border-orange-200 dark:border-orange-800">
              <span className="text-[10px] text-orange-700 dark:text-orange-400 uppercase tracking-wide">
                Salidas hoy
              </span>
              <span className="text-lg font-bold text-orange-700 dark:text-orange-400">
                {salidasHoy}
              </span>
              <span className="text-[10px] text-muted-foreground">
                informativo
              </span>
            </div>
          </div>

          {/* Almacén o Punto de Venta */}
          <div className="space-y-1.5">
            <Label>Almacén o Punto de Venta</Label>
            <Select value={location} onValueChange={setLocation}>
              <SelectTrigger data-ocid="addproduct.location.select">
                <SelectValue placeholder="Seleccionar ubicación..." />
              </SelectTrigger>
              <SelectContent>
                {almacenes.length > 0 && (
                  <>
                    <SelectItem value="__almacen_header__" disabled>
                      ── Almacenes ──
                    </SelectItem>
                    {almacenes.map((a) => (
                      <SelectItem key={a.id} value={`almacen:${a.id}`}>
                        {a.descripcion}
                      </SelectItem>
                    ))}
                  </>
                )}
                {puntosVenta.length > 0 && (
                  <>
                    <SelectItem value="__pv_header__" disabled>
                      ── Puntos de Venta ──
                    </SelectItem>
                    {puntosVenta.map((pv) => (
                      <SelectItem key={pv.id} value={`pv:${pv.id}`}>
                        {pv.name}
                      </SelectItem>
                    ))}
                  </>
                )}
                {almacenes.length === 0 && puntosVenta.length === 0 && (
                  <SelectItem value="__none__" disabled>
                    Sin ubicaciones configuradas
                  </SelectItem>
                )}
              </SelectContent>
            </Select>
          </div>

          {/* Categoría */}
          {locationCategories.length > 0 && (
            <div className="space-y-1.5">
              <Label>Categoría</Label>
              <Select value={categoria} onValueChange={setCategoria}>
                <SelectTrigger data-ocid="addproduct.categoria.select">
                  <SelectValue placeholder="Seleccionar categoría..." />
                </SelectTrigger>
                <SelectContent>
                  {locationCategories.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Save button */}
          <Button
            type="button"
            className="w-full"
            onClick={handleGuardar}
            disabled={isPending}
            data-ocid="addproduct.submit_button"
          >
            {isPending
              ? "Guardando..."
              : isEditing
                ? "Actualizar producto"
                : "Guardar producto"}
          </Button>
        </div>
        <ScrollBar orientation="vertical" />
      </ScrollArea>
    </div>
  );
}
