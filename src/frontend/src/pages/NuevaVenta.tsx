import { Badge } from "@/components/ui/badge";
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
import { Separator } from "@/components/ui/separator";
import {
  CheckCircle2,
  CreditCard,
  Loader2,
  Minus,
  Package,
  Plus,
  QrCode,
  Search,
  ShoppingCart,
  Trash2,
  User,
  UserPlus,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import type { Customer, PaymentType, Product } from "../backend.d";
import {
  useCreatePaymentType,
  useCreateSale,
  useCustomers,
  useDeletePaymentType,
  usePaymentTypes,
  useProducts,
} from "../hooks/useQueries";
import { useQRScanner } from "../qr-code/useQRScanner";

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

  useEffect(() => {
    if (open) {
      handleOpen();
    } else {
      handleClose();
    }
  }, [open, handleOpen, handleClose]);

  const handleResult = useCallback(() => {
    if (qrResults.length > 0) {
      onScan(qrResults[0].data);
      stopScanning();
      onClose();
    }
  }, [qrResults, onScan, stopScanning, onClose]);

  useEffect(() => {
    handleResult();
  }, [handleResult]);

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!v) onClose();
      }}
    >
      <DialogContent className="max-w-sm mx-auto" data-ocid="qr_scanner.dialog">
        <DialogHeader>
          <DialogTitle>Escanear producto</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          {isSupported === false && (
            <p className="text-destructive text-sm">
              Cámara no soportada en este dispositivo
            </p>
          )}
          {error && (
            <p
              className="text-destructive text-sm"
              data-ocid="qr_scanner.error_state"
            >
              {error.message}
            </p>
          )}
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
              data-ocid="qr_scanner.primary_button"
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
  onAdd: (product: Product) => void;
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
      <DialogContent
        className="max-w-sm mx-auto"
        data-ocid="product_picker.dialog"
      >
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
              data-ocid="product_picker.search_input"
            />
          </div>
          <ScrollArea className="h-64">
            {filtered.length === 0 ? (
              <p
                className="text-center text-muted-foreground text-sm py-8"
                data-ocid="product_picker.empty_state"
              >
                Sin resultados
              </p>
            ) : (
              <div className="space-y-1">
                {filtered.map((p, idx) => (
                  <button
                    type="button"
                    key={String(p.id)}
                    data-ocid={`product_picker.item.${idx + 1}`}
                    onClick={() => {
                      onAdd(p);
                      onClose();
                    }}
                    className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg hover:bg-muted transition-colors text-left"
                  >
                    <div className="flex items-center gap-2">
                      <ProductThumb productId={p.id} />
                      <div>
                        <p className="font-medium text-sm">{p.name}</p>
                        <p className="text-xs text-muted-foreground">
                          Stock: {String(p.stock)} · ${formatPrice(p.price)}
                        </p>
                      </div>
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

function CustomerModal({
  open,
  onClose,
  onSelect,
  customers,
  onNavigateToClientes,
}: {
  open: boolean;
  onClose: () => void;
  onSelect: (c: Customer) => void;
  customers: Customer[];
  onNavigateToClientes: () => void;
}) {
  const [search, setSearch] = useState("");

  const filtered = customers.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!v) onClose();
      }}
    >
      <DialogContent
        className="max-w-sm mx-auto"
        data-ocid="customer_modal.dialog"
      >
        <DialogHeader>
          <DialogTitle>Seleccionar cliente</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div className="relative">
            <Search
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
            />
            <Input
              placeholder="Buscar cliente..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
              data-ocid="customer_modal.search_input"
            />
          </div>
          <ScrollArea className="h-52">
            {filtered.length === 0 ? (
              <p
                className="text-center text-muted-foreground text-sm py-8"
                data-ocid="customer_modal.empty_state"
              >
                Sin clientes
              </p>
            ) : (
              <div className="space-y-1">
                {filtered.map((c, idx) => (
                  <button
                    type="button"
                    key={String(c.id)}
                    data-ocid={`customer_modal.item.${idx + 1}`}
                    onClick={() => {
                      onSelect(c);
                      onClose();
                    }}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-muted transition-colors text-left"
                  >
                    <div className="w-8 h-8 rounded-full bg-teal/20 flex items-center justify-center shrink-0">
                      <User size={14} className="text-teal" />
                    </div>
                    <div>
                      <p className="font-medium text-sm">{c.name}</p>
                      <p className="text-xs text-muted-foreground">{c.phone}</p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </ScrollArea>
          <Separator />
          <Button
            type="button"
            variant="outline"
            className="w-full"
            onClick={() => {
              onClose();
              onNavigateToClientes();
            }}
            data-ocid="customer_modal.go_to_clientes.button"
          >
            <UserPlus className="mr-2 h-4 w-4" />
            Agregar clientes
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function PaymentTypeModal({
  open,
  onClose,
  onSelect,
  paymentTypes,
}: {
  open: boolean;
  onClose: () => void;
  onSelect: (pt: PaymentType) => void;
  paymentTypes: PaymentType[];
}) {
  const [newName, setNewName] = useState("");
  const createPT = useCreatePaymentType();
  const deletePT = useDeletePaymentType();

  const handleAdd = async () => {
    const name = newName.trim();
    if (!name) return;
    await createPT.mutateAsync(name);
    setNewName("");
    toast.success(`Tipo de pago "${name}" agregado`);
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
        data-ocid="payment_type.dialog"
      >
        <DialogHeader>
          <DialogTitle>Tipos de pago</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <ScrollArea className="h-48">
            {paymentTypes.length === 0 ? (
              <p
                className="text-center text-muted-foreground text-sm py-6"
                data-ocid="payment_type.empty_state"
              >
                Sin tipos de pago
              </p>
            ) : (
              <div className="space-y-1">
                {paymentTypes.map((pt, idx) => (
                  <div
                    key={String(pt.id)}
                    data-ocid={`payment_type.item.${idx + 1}`}
                    className="flex items-center justify-between px-3 py-2.5 rounded-lg hover:bg-muted group"
                  >
                    <button
                      type="button"
                      className="flex items-center gap-2 flex-1 text-left"
                      onClick={() => {
                        onSelect(pt);
                        onClose();
                      }}
                    >
                      <CreditCard size={15} className="text-teal shrink-0" />
                      <span className="text-sm font-medium">{pt.name}</span>
                    </button>
                    <button
                      type="button"
                      data-ocid={`payment_type.delete_button.${idx + 1}`}
                      onClick={async () => {
                        await deletePT.mutateAsync(pt.id);
                        toast.success(`"${pt.name}" eliminado`);
                      }}
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
              placeholder="Nuevo tipo de pago..."
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleAdd();
              }}
              data-ocid="payment_type.input"
            />
            <Button
              type="button"
              onClick={handleAdd}
              disabled={!newName.trim() || createPT.isPending}
              className="bg-teal text-white hover:bg-teal/90 shrink-0"
              data-ocid="payment_type.submit_button"
            >
              <Plus size={16} />
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default function NuevaVenta({
  onNavigateToClientes,
}: {
  onNavigateToClientes?: () => void;
}) {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(
    null,
  );
  const [selectedPaymentType, setSelectedPaymentType] =
    useState<PaymentType | null>(null);
  const [showQR, setShowQR] = useState(false);
  const [showProducts, setShowProducts] = useState(false);
  const [showCustomers, setShowCustomers] = useState(false);
  const [showPayment, setShowPayment] = useState(false);
  const [cashPaid, setCashPaid] = useState("");

  const { data: products = [] } = useProducts();
  const { data: customers = [] } = useCustomers();
  const { data: paymentTypes = [] } = usePaymentTypes();
  const createSale = useCreateSale();

  const addToCart = (product: Product) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.product.id === product.id);
      if (existing) {
        return prev.map((item) =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item,
        );
      }
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
      toast.success(`"${product.name}" agregado al carrito`);
    } else {
      toast.error(`Producto no encontrado: ${code}`);
    }
  };

  const total = cart.reduce(
    (sum, item) => sum + Number(item.product.price) * item.quantity,
    0,
  );

  const isCash = selectedPaymentType?.name.toLowerCase().trim() === "efectivo";
  const totalPesos = total / 100;
  const cashPaidNum = Number.parseFloat(cashPaid) || 0;
  const change = cashPaidNum - totalPesos;

  const handleRealizarVenta = async () => {
    if (cart.length === 0) {
      toast.error("El carrito está vacío");
      return;
    }
    if (!selectedPaymentType) {
      toast.error("Seleccione un tipo de pago");
      return;
    }
    if (isCash && cashPaidNum < totalPesos) {
      toast.error("El monto pagado es menor al total de la venta");
      return;
    }

    await createSale.mutateAsync({
      customerId: selectedCustomer?.id ?? BigInt(0),
      paymentTypeId: selectedPaymentType.id,
      items: cart.map((item) => ({
        productId: item.product.id,
        quantity: BigInt(item.quantity),
        unitPrice: item.product.price,
      })),
    });

    toast.success("¡Venta realizada exitosamente!");
    setCart([]);
    setSelectedCustomer(null);
    setSelectedPaymentType(null);
    setCashPaid("");
  };

  return (
    <div className="flex flex-col h-full">
      {/* Cart - scrollable area that fills available space */}
      <div className="flex-1 overflow-hidden px-4 pt-4">
        <div className="h-full bg-card rounded-xl shadow-card border border-border overflow-hidden flex flex-col">
          <div className="flex items-center justify-between px-4 py-3 border-b border-border shrink-0">
            <div className="flex items-center gap-2">
              <ShoppingCart size={16} className="text-teal" />
              <span className="font-semibold text-sm">Carrito</span>
            </div>
            {cart.length > 0 && (
              <Badge variant="secondary" className="text-xs">
                {cart.length} productos
              </Badge>
            )}
          </div>

          <div className="flex-1 overflow-y-auto">
            {cart.length === 0 ? (
              <div className="py-10 text-center" data-ocid="cart.empty_state">
                <ShoppingCart
                  size={32}
                  className="mx-auto text-muted-foreground/40 mb-2"
                />
                <p className="text-muted-foreground text-sm">Carrito vacío</p>
              </div>
            ) : (
              <div>
                {cart.map((item, idx) => (
                  <div
                    key={String(item.product.id)}
                    data-ocid={`cart.item.${idx + 1}`}
                    className="flex items-center gap-3 px-4 py-3 border-b border-border last:border-0"
                  >
                    <ProductThumb productId={item.product.id} />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">
                        {item.product.name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        ${formatPrice(item.product.price)} c/u
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
                        className="w-6 h-6 rounded-full bg-teal text-white flex items-center justify-center hover:bg-teal/80 transition-colors"
                      >
                        <Plus size={12} />
                      </button>
                    </div>
                    <span className="text-sm font-semibold w-16 text-right">
                      $
                      {(
                        (Number(item.product.price) * item.quantity) /
                        100
                      ).toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Fixed bottom bar */}
      <div className="shrink-0">
        {/* Action icons row - no background */}
        <div className="flex items-center justify-around px-4 py-2">
          {/* Scan */}
          <button
            type="button"
            onClick={() => setShowQR(true)}
            data-ocid="nueva_venta.scan_button"
            className="flex flex-col items-center gap-1 group"
          >
            <div className="w-10 h-10 flex items-center justify-center transition-colors">
              <QrCode
                size={22}
                className="text-foreground group-hover:text-teal transition-colors"
              />
            </div>
          </button>

          {/* Add product */}
          <button
            type="button"
            onClick={() => setShowProducts(true)}
            data-ocid="nueva_venta.add_product_button"
            className="flex flex-col items-center gap-1 group"
          >
            <div className="w-10 h-10 flex items-center justify-center transition-colors">
              <Plus
                size={22}
                className="text-foreground group-hover:text-teal transition-colors"
              />
            </div>
          </button>

          {/* Customer */}
          <button
            type="button"
            onClick={() => setShowCustomers(true)}
            data-ocid="nueva_venta.customer_select"
            className="flex flex-col items-center gap-1 group"
          >
            <div className="w-10 h-10 flex items-center justify-center transition-colors">
              <User
                size={22}
                className={
                  selectedCustomer
                    ? "text-teal"
                    : "text-foreground group-hover:text-teal transition-colors"
                }
              />
            </div>
          </button>

          {/* Payment type */}
          <button
            type="button"
            onClick={() => setShowPayment(true)}
            data-ocid="nueva_venta.payment_select"
            className="flex flex-col items-center gap-1 group"
          >
            <div className="w-10 h-10 flex items-center justify-center transition-colors">
              <CreditCard
                size={22}
                className={
                  selectedPaymentType
                    ? "text-teal"
                    : "text-foreground group-hover:text-teal transition-colors"
                }
              />
            </div>
          </button>
        </div>

        {/* Navy box: total + cash fields + submit */}
        <div className="bg-navy px-4 pt-3 pb-4 space-y-3">
          {/* Total */}
          <div className="flex items-center justify-between">
            <span className="text-white/80 font-medium text-sm">Total</span>
            <span className="text-white text-2xl font-bold">
              ${totalPesos.toFixed(2)}
            </span>
          </div>

          {/* Cash fields when Efectivo is selected */}
          {isCash && (
            <div className="space-y-2">
              <Separator className="bg-white/10" />
              <div className="flex items-center gap-3">
                <Label className="text-white/70 text-xs w-28 shrink-0">
                  Pagó el cliente
                </Label>
                <div className="relative flex-1">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/50 text-sm">
                    $
                  </span>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="0.00"
                    value={cashPaid}
                    onChange={(e) => setCashPaid(e.target.value)}
                    className="pl-7 bg-white/10 border-white/20 text-white placeholder:text-white/30 h-9"
                    data-ocid="nueva_venta.cash_paid.input"
                  />
                </div>
              </div>
              <div className="flex items-center justify-between px-1">
                <span className="text-white/70 text-xs">A devolver</span>
                <span
                  className={`text-sm font-bold ${
                    cashPaidNum > 0
                      ? change >= 0
                        ? "text-green-400"
                        : "text-red-400"
                      : "text-white/40"
                  }`}
                >
                  {cashPaidNum > 0
                    ? `$${Math.max(change, 0).toFixed(2)}`
                    : "$0.00"}
                </span>
              </div>
            </div>
          )}

          {/* Submit */}
          <Button
            type="button"
            onClick={handleRealizarVenta}
            disabled={createSale.isPending || cart.length === 0}
            className="w-full h-12 bg-teal hover:bg-teal/90 text-white font-semibold text-base rounded-xl"
            data-ocid="nueva_venta.submit_button"
          >
            {createSale.isPending ? "Procesando..." : "Realizar Venta"}
          </Button>
        </div>
      </div>

      {/* Modals */}
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
      <CustomerModal
        open={showCustomers}
        onClose={() => setShowCustomers(false)}
        onSelect={setSelectedCustomer}
        customers={customers}
        onNavigateToClientes={() => {
          setShowCustomers(false);
          if (onNavigateToClientes) onNavigateToClientes();
        }}
      />
      <PaymentTypeModal
        open={showPayment}
        onClose={() => setShowPayment(false)}
        onSelect={setSelectedPaymentType}
        paymentTypes={paymentTypes}
      />
    </div>
  );
}
