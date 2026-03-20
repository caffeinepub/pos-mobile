import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  ArrowDownToLine,
  CreditCard,
  Minus,
  Plus,
  QrCode,
  Search,
  Trash2,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import type { Product } from "../backend.d";
import { useProducts, useUpdateProduct } from "../hooks/useQueries";
import { useQRScanner } from "../qr-code/useQRScanner";
import {
  type SalidaMercanciaTipo,
  getTiposSalida,
  saveSalida,
} from "../utils/salidas";

interface CartItem {
  product: Product;
  quantity: number;
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

function ProductPickerModal({
  open,
  onClose,
  onAdd,
  products,
}: {
  open: boolean;
  onClose: () => void;
  onAdd: (p: Product) => void;
  products: Product[];
}) {
  const [search, setSearch] = useState("");
  const filtered = products.filter(
    (p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.barcode.includes(search),
  );
  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!v) onClose();
      }}
    >
      <DialogContent className="max-w-sm mx-auto">
        <DialogHeader>
          <DialogTitle>Agregar producto</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
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
            />
          </div>
          <ScrollArea className="h-64">
            {filtered.length === 0 ? (
              <p className="text-center text-muted-foreground text-sm py-8">
                Sin resultados
              </p>
            ) : (
              <div className="space-y-1">
                {filtered.map((p) => (
                  <button
                    type="button"
                    key={String(p.id)}
                    onClick={() => {
                      onAdd(p);
                      onClose();
                    }}
                    className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg hover:bg-muted transition-colors text-left"
                  >
                    <div>
                      <p className="font-medium text-sm">{p.name}</p>
                      <p className="text-xs text-muted-foreground">
                        Stock: {String(p.stock)} · ${formatPrice(p.price)}
                      </p>
                    </div>
                    <Plus size={16} className="text-teal shrink-0" />
                  </button>
                ))}
              </div>
            )}
          </ScrollArea>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function TipoSalidaModal({
  open,
  onClose,
  onSelect,
  tipos,
}: {
  open: boolean;
  onClose: () => void;
  onSelect: (t: SalidaMercanciaTipo) => void;
  tipos: SalidaMercanciaTipo[];
}) {
  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!v) onClose();
      }}
    >
      <DialogContent className="max-w-sm mx-auto">
        <DialogHeader>
          <DialogTitle>Tipo de salida</DialogTitle>
        </DialogHeader>
        <div className="space-y-1">
          {tipos.length === 0 ? (
            <p className="text-center text-muted-foreground text-sm py-6">
              Sin tipos de salida configurados
            </p>
          ) : (
            tipos.map((t) => (
              <button
                type="button"
                key={t.id}
                onClick={() => {
                  onSelect(t);
                  onClose();
                }}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-muted transition-colors text-left"
              >
                <CreditCard size={15} className="text-orange-500 shrink-0" />
                <span className="text-sm font-medium">{t.name}</span>
              </button>
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default function SalidaMercancia() {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedTipo, setSelectedTipo] = useState<SalidaMercanciaTipo | null>(
    null,
  );
  const [showQR, setShowQR] = useState(false);
  const [showProducts, setShowProducts] = useState(false);
  const [showTipos, setShowTipos] = useState(false);
  const [isPending, setIsPending] = useState(false);

  const { data: products = [] } = useProducts();
  const updateProduct = useUpdateProduct();
  const tipos = getTiposSalida();

  const addToCart = (product: Product) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.product.id === product.id);
      if (existing)
        return prev.map((item) =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item,
        );
      return [...prev, { product, quantity: 1 }];
    });
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

  const handleRegistrarSalida = async () => {
    if (cart.length === 0) {
      toast.error("Agrega al menos un producto");
      return;
    }
    if (!selectedTipo) {
      toast.error("Selecciona un tipo de salida");
      return;
    }

    setIsPending(true);
    try {
      // Reduce stock for each product
      for (const item of cart) {
        const newStock = BigInt(
          Math.max(Number(item.product.stock) - item.quantity, 0),
        );
        await updateProduct.mutateAsync({
          id: item.product.id,
          name: item.product.name,
          price: item.product.price,
          barcode: item.product.barcode,
          stock: newStock,
        });
      }

      saveSalida({
        date: Date.now(),
        items: cart.map((item) => ({
          productId: String(item.product.id),
          productName: item.product.name,
          quantity: item.quantity,
          unitPrice: Number(item.product.price),
        })),
        tipoSalidaId: selectedTipo.id,
        tipoSalidaNombre: selectedTipo.name,
      });

      toast.success("Salida de mercancía registrada");
      setCart([]);
      setSelectedTipo(null);
    } catch {
      toast.error("Error al registrar la salida");
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
              <ArrowDownToLine size={16} className="text-orange-500" />
              <span className="font-semibold text-sm">Productos a rebajar</span>
            </div>
            {cart.length > 0 && (
              <Badge variant="secondary" className="text-xs">
                {cart.length} productos
              </Badge>
            )}
          </div>
          <div className="flex-1 overflow-y-auto">
            {cart.length === 0 ? (
              <div className="py-10 text-center" data-ocid="salida.empty_state">
                <ArrowDownToLine
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
                    data-ocid={`salida.item.${idx + 1}`}
                    className="flex items-center gap-3 px-4 py-3 border-b border-border last:border-0"
                  >
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
                        className="w-6 h-6 rounded-full bg-orange-500 text-white flex items-center justify-center hover:bg-orange-400 transition-colors"
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
            data-ocid="salida.scan_button"
            className="flex flex-col items-center gap-1 group"
          >
            <div className="w-10 h-10 flex items-center justify-center">
              <QrCode
                size={22}
                className="text-foreground group-hover:text-orange-500 transition-colors"
              />
            </div>
          </button>
          <button
            type="button"
            onClick={() => setShowProducts(true)}
            data-ocid="salida.add_product_button"
            className="flex flex-col items-center gap-1 group"
          >
            <div className="w-10 h-10 flex items-center justify-center">
              <Plus
                size={22}
                className="text-foreground group-hover:text-orange-500 transition-colors"
              />
            </div>
          </button>
          <button
            type="button"
            onClick={() => setShowTipos(true)}
            data-ocid="salida.tipo_select"
            className="flex flex-col items-center gap-1 group"
          >
            <div className="w-10 h-10 flex items-center justify-center">
              <CreditCard
                size={22}
                className={
                  selectedTipo
                    ? "text-orange-500"
                    : "text-foreground group-hover:text-orange-500 transition-colors"
                }
              />
            </div>
          </button>
        </div>

        <div className="bg-navy px-4 pt-3 pb-4 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white/60 text-xs">Tipo de salida</p>
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
            onClick={handleRegistrarSalida}
            disabled={isPending || cart.length === 0}
            className="w-full h-12 bg-orange-500 hover:bg-orange-400 text-white font-semibold text-base rounded-xl"
            data-ocid="salida.submit_button"
          >
            {isPending ? "Procesando..." : "Registrar Salida"}
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
        onAdd={addToCart}
        products={products}
      />
      <TipoSalidaModal
        open={showTipos}
        onClose={() => setShowTipos(false)}
        onSelect={setSelectedTipo}
        tipos={tipos}
      />
    </div>
  );
}
