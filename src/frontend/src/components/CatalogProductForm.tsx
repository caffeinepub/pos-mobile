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
import { ArrowLeft, Barcode, Plus, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import type { Product } from "../backend.d";
import { useCreateProduct, useUpdateProduct } from "../hooks/useQueries";
import { useQRScanner } from "../qr-code/useQRScanner";
import {
  DEFAULT_UNITS,
  getProductMeta,
  setProductMeta,
  upsertCatalogEntry,
} from "./AddProductScreen";

// ---------- Inline QR Scanner ----------
function InlineQRScanner({
  onResult,
  onClose,
}: {
  onResult: (code: string) => void;
  onClose: () => void;
}) {
  const scanner = useQRScanner({ facingMode: "environment" });
  const prevCount = useRef(0);

  // biome-ignore lint/correctness/useExhaustiveDependencies: scanner functions stable
  useEffect(() => {
    scanner.startScanning();
    return () => {
      scanner.stopScanning();
    };
  }, []);

  useEffect(() => {
    if (scanner.qrResults.length > prevCount.current) {
      prevCount.current = scanner.qrResults.length;
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
        data-ocid="catalog.scanner.close_button"
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
        data-ocid="catalog.unit.button"
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
        data-ocid="catalog.unit.input"
      />
      <Button
        type="button"
        size="sm"
        className="h-10 px-2 text-xs"
        onClick={handleConfirm}
        data-ocid="catalog.unit.save_button"
      >
        OK
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="h-10 px-2 text-xs"
        onClick={() => setOpen(false)}
        data-ocid="catalog.unit.cancel_button"
      >
        ✕
      </Button>
    </div>
  );
}

// ---------- Props ----------
export interface CatalogProductFormProps {
  onClose: () => void;
  onSaved?: () => void;
  editProduct?: Product | null;
}

// ---------- CatalogProductForm ----------
export default function CatalogProductForm({
  onClose,
  onSaved,
  editProduct,
}: CatalogProductFormProps) {
  const isEditing = !!editProduct;
  const createProduct = useCreateProduct();
  const updateProduct = useUpdateProduct();

  const [codigo, setCodigo] = useState("");
  const [nombre, setNombre] = useState("");
  const [units, setUnits] = useState<string[]>(DEFAULT_UNITS);
  const [selectedUnit, setSelectedUnit] = useState("Unidad");
  const [showQRScanner, setShowQRScanner] = useState(false);

  // biome-ignore lint/correctness/useExhaustiveDependencies: intentional
  useEffect(() => {
    if (editProduct) {
      setCodigo(editProduct.barcode);
      setNombre(editProduct.name);
      const meta = getProductMeta(editProduct.id);
      const savedUnit = meta.unit || "Unidad";
      setSelectedUnit(savedUnit);
      if (!DEFAULT_UNITS.includes(savedUnit)) {
        setUnits((prev) =>
          prev.includes(savedUnit) ? prev : [...prev, savedUnit],
        );
      }
    }
  }, [editProduct]);

  const handleAddUnit = (unit: string) => {
    setUnits((prev) => [...prev, unit]);
    setSelectedUnit(unit);
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
    try {
      if (isEditing && editProduct) {
        await updateProduct.mutateAsync({
          id: editProduct.id,
          name: nombre.trim(),
          price: editProduct.price,
          barcode: codigo.trim(),
          stock: editProduct.stock,
        });
        const existingMeta = getProductMeta(editProduct.id);
        setProductMeta(editProduct.id, { ...existingMeta, unit: selectedUnit });
        toast.success("Producto actualizado en catálogo");
      } else {
        const newId = await createProduct.mutateAsync({
          name: nombre.trim(),
          price: BigInt(0),
          barcode: codigo.trim(),
          stock: BigInt(0),
        });
        setProductMeta(newId, { image: null, unit: selectedUnit });
        toast.success("Producto agregado al catálogo");
      }
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
    <div className="h-full flex flex-col" data-ocid="catalog.dialog">
      {/* Header */}
      <div className="flex items-center px-4 py-3 border-b border-border shrink-0">
        <button
          type="button"
          onClick={onClose}
          className="flex items-center gap-2 text-sm font-medium text-foreground"
          data-ocid="catalog.close_button"
        >
          <ArrowLeft size={18} />
          {isEditing ? "Editar producto" : "Agregar producto al catálogo"}
        </button>
      </div>

      <ScrollArea className="flex-1 pr-1">
        <div className="px-5 pb-8 space-y-5 pt-4">
          {/* Código del producto */}
          <div className="space-y-1.5">
            <Label htmlFor="cp-codigo">Código del producto</Label>
            <div className="flex gap-2">
              <Input
                id="cp-codigo"
                placeholder="Ej. 001"
                value={codigo}
                onChange={(e) => setCodigo(e.target.value)}
                className="flex-1"
                data-ocid="catalog.input"
              />
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="shrink-0 h-10 w-10"
                onClick={() => setShowQRScanner((v) => !v)}
                data-ocid="catalog.scanner.toggle"
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
            <Label htmlFor="cp-nombre">
              Nombre del producto <span className="text-destructive">*</span>
            </Label>
            <Input
              id="cp-nombre"
              placeholder="Ej. Arroz 1kg"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              data-ocid="catalog.nombre.input"
            />
          </div>

          {/* Unidad de medida */}
          <div className="space-y-1.5">
            <Label>Unidad de medida</Label>
            <div className="flex gap-2 items-center">
              <Select value={selectedUnit} onValueChange={setSelectedUnit}>
                <SelectTrigger
                  className="flex-1"
                  data-ocid="catalog.unit.select"
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

          {/* Save button */}
          <Button
            type="button"
            className="w-full"
            onClick={handleGuardar}
            disabled={isPending}
            data-ocid="catalog.submit_button"
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
