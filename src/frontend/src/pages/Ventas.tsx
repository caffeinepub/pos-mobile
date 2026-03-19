import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { useQueryClient } from "@tanstack/react-query";
import {
  Calendar,
  DollarSign,
  FileDown,
  MoreVertical,
  Receipt,
  Search,
  Share2,
  Trash2,
  User,
  X,
} from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import type { Customer, PaymentType, Product, Sale } from "../backend.d";
import {
  useCustomers,
  usePaymentTypes,
  useProducts,
  useSales,
} from "../hooks/useQueries";

function formatPrice(amount: bigint): string {
  return (Number(amount) / 100).toFixed(2);
}

function formatDate(time: bigint): string {
  const date = new Date(Number(time) / 1_000_000);
  return date.toLocaleDateString("es-ES", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function getCustomerName(id: bigint, customers: Customer[]): string {
  return customers.find((c) => c.id === id)?.name ?? "Cliente desconocido";
}

function getPaymentName(id: bigint, pts: PaymentType[]): string {
  return pts.find((pt) => pt.id === id)?.name ?? "—";
}

function getProductName(id: bigint, products: Product[]): string {
  return products.find((p) => p.id === id)?.name ?? `Producto #${String(id)}`;
}

function SaleDetailSheet({
  sale,
  open,
  onClose,
  customers,
  paymentTypes,
  products,
}: {
  sale: Sale | null;
  open: boolean;
  onClose: () => void;
  customers: Customer[];
  paymentTypes: PaymentType[];
  products: Product[];
}) {
  if (!sale) return null;
  return (
    <Sheet
      open={open}
      onOpenChange={(v) => {
        if (!v) onClose();
      }}
    >
      <SheetContent
        side="bottom"
        className="h-[75vh] rounded-t-2xl"
        data-ocid="sale_detail.sheet"
      >
        <SheetHeader className="text-left pb-4">
          <SheetTitle>Detalle de venta</SheetTitle>
        </SheetHeader>
        <ScrollArea className="h-full pb-8">
          <div className="space-y-4 pr-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-muted rounded-xl p-3">
                <p className="text-xs text-muted-foreground mb-1">Cliente</p>
                <p className="font-semibold text-sm">
                  {getCustomerName(sale.customerId, customers)}
                </p>
              </div>
              <div className="bg-muted rounded-xl p-3">
                <p className="text-xs text-muted-foreground mb-1">Pago</p>
                <p className="font-semibold text-sm">
                  {getPaymentName(sale.paymentTypeId, paymentTypes)}
                </p>
              </div>
              <div className="bg-muted rounded-xl p-3">
                <p className="text-xs text-muted-foreground mb-1">Fecha</p>
                <p className="font-semibold text-sm">{formatDate(sale.date)}</p>
              </div>
              <div className="bg-muted rounded-xl p-3">
                <p className="text-xs text-muted-foreground mb-1">Total</p>
                <p className="font-semibold text-sm text-teal">
                  ${formatPrice(sale.totalAmount)}
                </p>
              </div>
            </div>
            <Separator />
            <div>
              <p className="text-sm font-semibold mb-3">
                Artículos ({sale.items.length})
              </p>
              <div className="space-y-2">
                {sale.items.map((item, idx) => (
                  <div
                    key={`${String(item.productId)}-${idx}`}
                    data-ocid={`sale_detail.item.${idx + 1}`}
                    className="flex items-center justify-between py-2 border-b border-border last:border-0"
                  >
                    <div>
                      <p className="text-sm font-medium">
                        {getProductName(item.productId, products)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {String(item.quantity)} × ${formatPrice(item.unitPrice)}
                      </p>
                    </div>
                    <span className="text-sm font-semibold">
                      $
                      {(
                        (Number(item.unitPrice) * Number(item.quantity)) /
                        100
                      ).toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-navy rounded-xl px-5 py-4 flex items-center justify-between">
              <span className="text-white/80 font-medium">Total</span>
              <span className="text-white text-xl font-bold">
                ${formatPrice(sale.totalAmount)}
              </span>
            </div>
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}

function SearchModal({
  open,
  onClose,
  onSearch,
}: {
  open: boolean;
  onClose: () => void;
  onSearch: (filters: SearchFilters) => void;
}) {
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [amountMin, setAmountMin] = useState("");
  const [amountMax, setAmountMax] = useState("");
  const [customer, setCustomer] = useState("");

  const handleApply = () => {
    onSearch({ dateFrom, dateTo, amountMin, amountMax, customer });
    onClose();
  };

  const handleClear = () => {
    setDateFrom("");
    setDateTo("");
    setAmountMin("");
    setAmountMax("");
    setCustomer("");
    onSearch({
      dateFrom: "",
      dateTo: "",
      amountMin: "",
      amountMax: "",
      customer: "",
    });
    onClose();
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
        data-ocid="ventas_search.dialog"
      >
        <DialogHeader>
          <DialogTitle>Buscar venta</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <Label
              htmlFor="search-customer"
              className="text-xs text-muted-foreground mb-1 block"
            >
              Cliente
            </Label>
            <div className="relative">
              <User
                size={14}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
              />
              <Input
                id="search-customer"
                placeholder="Nombre del cliente"
                value={customer}
                onChange={(e) => setCustomer(e.target.value)}
                className="pl-8"
                data-ocid="ventas_search.input"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label
                htmlFor="search-date-from"
                className="text-xs text-muted-foreground mb-1 block"
              >
                Fecha desde
              </Label>
              <div className="relative">
                <Calendar
                  size={14}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                />
                <Input
                  id="search-date-from"
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>
            <div>
              <Label
                htmlFor="search-date-to"
                className="text-xs text-muted-foreground mb-1 block"
              >
                Fecha hasta
              </Label>
              <div className="relative">
                <Calendar
                  size={14}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                />
                <Input
                  id="search-date-to"
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label
                htmlFor="search-amount-min"
                className="text-xs text-muted-foreground mb-1 block"
              >
                Importe mín.
              </Label>
              <div className="relative">
                <DollarSign
                  size={14}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                />
                <Input
                  id="search-amount-min"
                  type="number"
                  placeholder="0.00"
                  value={amountMin}
                  onChange={(e) => setAmountMin(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>
            <div>
              <Label
                htmlFor="search-amount-max"
                className="text-xs text-muted-foreground mb-1 block"
              >
                Importe máx.
              </Label>
              <div className="relative">
                <DollarSign
                  size={14}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                />
                <Input
                  id="search-amount-max"
                  type="number"
                  placeholder="9999.99"
                  value={amountMax}
                  onChange={(e) => setAmountMax(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>
          </div>
          <div className="flex gap-2 pt-1">
            <Button
              type="button"
              variant="outline"
              onClick={handleClear}
              className="flex-1"
              data-ocid="ventas_search.cancel_button"
            >
              <X size={14} className="mr-1" /> Limpiar
            </Button>
            <Button
              type="button"
              onClick={handleApply}
              className="flex-1 bg-teal text-white hover:bg-teal/90"
              data-ocid="ventas_search.submit_button"
            >
              <Search size={14} className="mr-1" /> Buscar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

interface SearchFilters {
  dateFrom: string;
  dateTo: string;
  amountMin: string;
  amountMax: string;
  customer: string;
}

export default function Ventas() {
  const queryClient = useQueryClient();
  const { data: sales = [], isLoading } = useSales();
  const { data: customers = [] } = useCustomers();
  const { data: paymentTypes = [] } = usePaymentTypes();
  const { data: products = [] } = useProducts();

  const [selectedSale, setSelectedSale] = useState<Sale | null>(null);
  const [showDetail, setShowDetail] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [filters, setFilters] = useState<SearchFilters>({
    dateFrom: "",
    dateTo: "",
    amountMin: "",
    amountMax: "",
    customer: "",
  });

  const filteredSales = useMemo(() => {
    let result = [...sales].sort((a, b) => Number(b.date) - Number(a.date));

    if (filters.customer) {
      result = result.filter((s) =>
        getCustomerName(s.customerId, customers)
          .toLowerCase()
          .includes(filters.customer.toLowerCase()),
      );
    }
    if (filters.dateFrom) {
      const from = new Date(filters.dateFrom).getTime() * 1_000_000;
      result = result.filter((s) => Number(s.date) >= from);
    }
    if (filters.dateTo) {
      const to = new Date(filters.dateTo).getTime() * 1_000_000 + 86400 * 1e9;
      result = result.filter((s) => Number(s.date) <= to);
    }
    if (filters.amountMin) {
      const min = Number.parseFloat(filters.amountMin) * 100;
      result = result.filter((s) => Number(s.totalAmount) >= min);
    }
    if (filters.amountMax) {
      const max = Number.parseFloat(filters.amountMax) * 100;
      result = result.filter((s) => Number(s.totalAmount) <= max);
    }
    return result;
  }, [sales, customers, filters]);

  const hasFilters = Object.values(filters).some(Boolean);

  const handleDelete = (sale: Sale, e: React.MouseEvent) => {
    e.stopPropagation();
    queryClient.setQueryData(["sales"], (old: Sale[] = []) =>
      old.filter((s) => s.id !== sale.id),
    );
    toast.success("Venta eliminada");
  };

  const handleShare = async (sale: Sale, e: React.MouseEvent) => {
    e.stopPropagation();
    const text = `Venta del ${formatDate(sale.date)}\nCliente: ${getCustomerName(sale.customerId, customers)}\nPago: ${getPaymentName(sale.paymentTypeId, paymentTypes)}\nTotal: $${formatPrice(sale.totalAmount)}`;
    if (navigator.share) {
      await navigator.share({ title: "Venta POS", text });
    } else {
      await navigator.clipboard.writeText(text);
      alert("Copiado al portapapeles");
    }
  };

  const exportCSV = () => {
    const header = "ID,Fecha,Cliente,Pago,Total";
    const rows = filteredSales.map(
      (s) =>
        `${String(s.id)},${formatDate(s.date)},${getCustomerName(s.customerId, customers)},${getPaymentName(s.paymentTypeId, paymentTypes)},$${formatPrice(s.totalAmount)}`,
    );
    const csv = [header, ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `ventas_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportPDF = () => {
    const content = filteredSales
      .map(
        (s) =>
          `<tr>
            <td>${String(s.id)}</td>
            <td>${formatDate(s.date)}</td>
            <td>${getCustomerName(s.customerId, customers)}</td>
            <td>${getPaymentName(s.paymentTypeId, paymentTypes)}</td>
            <td>$${formatPrice(s.totalAmount)}</td>
          </tr>`,
      )
      .join("");
    const html = `<html><head><title>Ventas</title><style>body{font-family:sans-serif;padding:20px}table{width:100%;border-collapse:collapse}th,td{border:1px solid #ddd;padding:8px;text-align:left}th{background:#0B2040;color:white}</style></head><body><h2>Lista de Ventas</h2><p>Exportado: ${new Date().toLocaleString("es-ES")}</p><table><thead><tr><th>ID</th><th>Fecha</th><th>Cliente</th><th>Pago</th><th>Total</th></tr></thead><tbody>${content}</tbody></table></body></html>`;
    const win = window.open("", "_blank");
    if (win) {
      win.document.write(html);
      win.document.close();
      win.print();
    }
  };

  return (
    <div className="px-4 pb-6 pt-4">
      {/* Toolbar */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          {hasFilters && (
            <span className="text-xs bg-teal/20 text-teal px-2 py-0.5 rounded-full font-medium">
              Filtrado
            </span>
          )}
          <span className="text-sm text-muted-foreground">
            {filteredSales.length} venta{filteredSales.length !== 1 ? "s" : ""}
          </span>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className="p-2 rounded-lg hover:bg-muted transition-colors"
              data-ocid="ventas.dropdown_menu"
            >
              <MoreVertical size={18} className="text-muted-foreground" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem
              onClick={() => setShowSearch(true)}
              data-ocid="ventas.search_button"
            >
              <Search size={14} className="mr-2" /> Buscar venta
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={exportCSV}
              data-ocid="ventas.export_csv_button"
            >
              <FileDown size={14} className="mr-2" /> Exportar CSV
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={exportPDF}
              data-ocid="ventas.export_pdf_button"
            >
              <FileDown size={14} className="mr-2" /> Exportar PDF
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Sales list */}
      {isLoading ? (
        <div className="space-y-3" data-ocid="ventas.loading_state">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 bg-muted rounded-xl animate-pulse" />
          ))}
        </div>
      ) : filteredSales.length === 0 ? (
        <div className="py-16 text-center" data-ocid="ventas.empty_state">
          <Receipt
            size={40}
            className="mx-auto text-muted-foreground/30 mb-3"
          />
          <p className="text-muted-foreground font-medium">
            Sin ventas{hasFilters ? " con estos filtros" : ""}
          </p>
          {hasFilters && (
            <button
              type="button"
              onClick={() =>
                setFilters({
                  dateFrom: "",
                  dateTo: "",
                  amountMin: "",
                  amountMax: "",
                  customer: "",
                })
              }
              className="text-teal text-sm mt-2 hover:underline"
            >
              Limpiar filtros
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-2">
          {filteredSales.map((sale, idx) => (
            <button
              type="button"
              key={String(sale.id)}
              data-ocid={`ventas.item.${idx + 1}`}
              onClick={() => {
                setSelectedSale(sale);
                setShowDetail(true);
              }}
              className="w-full flex items-center gap-3 bg-card rounded-xl px-4 py-3.5 shadow-xs border border-border hover:shadow-card transition-shadow text-left"
            >
              {/* Ticket icon */}
              <div className="w-10 h-10 rounded-xl bg-teal/15 flex items-center justify-center shrink-0">
                <Receipt size={18} className="text-teal" />
              </div>

              {/* Data */}
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm truncate">
                  {getCustomerName(sale.customerId, customers)}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {getPaymentName(sale.paymentTypeId, paymentTypes)} ·{" "}
                  {formatDate(sale.date)}
                </p>
                <p className="text-sm font-bold text-teal mt-0.5">
                  ${formatPrice(sale.totalAmount)}
                </p>
              </div>

              {/* Share + Delete */}
              <div className="flex items-center gap-1 shrink-0">
                <button
                  type="button"
                  data-ocid={`ventas.share_button.${idx + 1}`}
                  onClick={(e) => handleShare(sale, e)}
                  className="p-2 rounded-lg hover:bg-teal/10 transition-colors"
                  aria-label="Compartir venta"
                >
                  <Share2 size={16} className="text-muted-foreground" />
                </button>
                <button
                  type="button"
                  data-ocid={`ventas.delete_button.${idx + 1}`}
                  onClick={(e) => handleDelete(sale, e)}
                  className="p-2 rounded-lg hover:bg-destructive/10 transition-colors"
                  aria-label="Eliminar venta"
                >
                  <Trash2 size={16} className="text-destructive" />
                </button>
              </div>
            </button>
          ))}
        </div>
      )}

      <SaleDetailSheet
        sale={selectedSale}
        open={showDetail}
        onClose={() => setShowDetail(false)}
        customers={customers}
        paymentTypes={paymentTypes}
        products={products}
      />
      <SearchModal
        open={showSearch}
        onClose={() => setShowSearch(false)}
        onSearch={setFilters}
      />
    </div>
  );
}
