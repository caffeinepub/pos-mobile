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
import {
  ArrowDownToLine,
  BarChart2,
  Calendar,
  FileDown,
  FileText,
  MoreVertical,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import { useMemo, useState } from "react";
import type { Customer, Product, Sale } from "../backend.d";
import { useCustomers, useProducts, useSales } from "../hooks/useQueries";
import { buildHtmlHeader } from "../utils/businessData";
import { getSalidas } from "../utils/salidas";

function formatPrice(amount: bigint | number): string {
  return (Number(amount) / 100).toFixed(2);
}

function isoDate(time: bigint): string {
  return new Date(Number(time) / 1_000_000).toISOString().slice(0, 10);
}

function getCustomerName(id: bigint, customers: Customer[]): string {
  return customers.find((c) => c.id === id)?.name ?? "Sin cliente";
}

// Simple bar chart rendered with divs
function BarChart({ data }: { data: { label: string; value: number }[] }) {
  const max = Math.max(...data.map((d) => d.value), 1);
  return (
    <div className="flex items-end gap-1 h-32 w-full">
      {data.map((d) => (
        <div key={d.label} className="flex flex-col items-center flex-1 gap-1">
          <div
            className="w-full rounded-t-sm bg-teal transition-all"
            style={{ height: `${Math.max((d.value / max) * 100, 4)}%` }}
          />
          <span className="text-[9px] text-muted-foreground truncate w-full text-center">
            {d.label}
          </span>
        </div>
      ))}
    </div>
  );
}

// ─── Sales Report Modal ───────────────────────────────────────────────────────

interface SalesReportProps {
  open: boolean;
  onClose: () => void;
  sales: Sale[];
  customers: Customer[];
}

function SalesReportModal({
  open,
  onClose,
  sales,
  customers,
}: SalesReportProps) {
  const [dateMode, setDateMode] = useState<"range" | "single">("range");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [singleDate, setSingleDate] = useState("");

  const filtered = useMemo(() => {
    if (dateMode === "single" && singleDate) {
      return sales.filter((s) => isoDate(s.date) === singleDate);
    }
    let result = [...sales];
    if (dateFrom) {
      const from = new Date(dateFrom).getTime() * 1_000_000;
      result = result.filter((s) => Number(s.date) >= from);
    }
    if (dateTo) {
      const to = new Date(dateTo).getTime() * 1_000_000 + 86400 * 1_000_000_000;
      result = result.filter((s) => Number(s.date) <= to);
    }
    return result;
  }, [sales, dateMode, dateFrom, dateTo, singleDate]);

  const totalRevenue = filtered.reduce(
    (acc, s) => acc + Number(s.totalAmount),
    0,
  );
  const numSales = filtered.length;
  const highest =
    numSales > 0 ? Math.max(...filtered.map((s) => Number(s.totalAmount))) : 0;
  const lowest =
    numSales > 0 ? Math.min(...filtered.map((s) => Number(s.totalAmount))) : 0;
  const average = numSales > 0 ? totalRevenue / numSales : 0;

  const perCustomer = useMemo(() => {
    const map = new Map<string, number>();
    for (const s of filtered) {
      const name = getCustomerName(s.customerId, customers);
      map.set(name, (map.get(name) ?? 0) + Number(s.totalAmount));
    }
    return Array.from(map.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);
  }, [filtered, customers]);

  const chartData = useMemo(() => {
    const map = new Map<string, number>();
    for (const s of filtered) {
      const d = isoDate(s.date);
      map.set(d, (map.get(d) ?? 0) + Number(s.totalAmount));
    }
    return Array.from(map.entries())
      .sort()
      .slice(-10)
      .map(([label, value]) => ({
        label: label.slice(5),
        value,
      }));
  }, [filtered]);

  const exportPDF = () => {
    const htmlHeader = buildHtmlHeader();
    const customerRows = perCustomer
      .map(
        ([name, amount]) =>
          `<tr><td>${name}</td><td>$${formatPrice(amount)}</td></tr>`,
      )
      .join("");

    const periodLabel =
      dateMode === "single" && singleDate
        ? singleDate
        : [dateFrom, dateTo].filter(Boolean).join(" — ") ||
          "Todos los períodos";

    const html = `<html><head><title>Reporte de Ventas</title>
<style>
body{font-family:sans-serif;padding:20px;color:#1a1a1a}
h2{color:#0B2040;margin-bottom:4px}
.header{margin-bottom:16px;padding:12px;background:#f5f5f5;border-radius:6px}
.total-box{text-align:center;background:#0B2040;color:white;border-radius:10px;padding:20px;margin:16px 0}
.total-box .amount{font-size:2.5rem;font-weight:bold}
.stats{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin:16px 0}
.stat{background:#f5f5f5;border-radius:8px;padding:12px}
.stat .label{font-size:11px;color:#666;margin-bottom:4px}
.stat .value{font-size:1.2rem;font-weight:bold}
table{width:100%;border-collapse:collapse;margin-top:12px}
th,td{border:1px solid #ddd;padding:8px;text-align:left;font-size:13px}
th{background:#0B2040;color:white}
</style></head>
<body>
<div class="header">${htmlHeader}</div>
<h2>Reporte de Ventas</h2>
<p style="font-size:12px;color:#666">Período: ${periodLabel}</p>
<div class="total-box">
  <div style="font-size:13px;opacity:0.8;margin-bottom:6px">Importe Total</div>
  <div class="amount">$${formatPrice(totalRevenue)}</div>
</div>
<div class="stats">
  <div class="stat"><div class="label">Total de ventas</div><div class="value">${numSales}</div></div>
  <div class="stat"><div class="label">Venta más alta</div><div class="value">$${formatPrice(highest)}</div></div>
  <div class="stat"><div class="label">Venta más baja</div><div class="value">$${formatPrice(lowest)}</div></div>
  <div class="stat"><div class="label">Venta promedio</div><div class="value">$${formatPrice(average)}</div></div>
</div>
<h3>Monto total por cliente</h3>
<table>
  <thead><tr><th>Cliente</th><th>Total</th></tr></thead>
  <tbody>${customerRows || '<tr><td colspan="2">Sin datos</td></tr>'}</tbody>
</table>
</body></html>`;
    const win = window.open("", "_blank");
    if (win) {
      win.document.write(html);
      win.document.close();
      win.print();
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!v) onClose();
      }}
    >
      <DialogContent
        className="max-w-sm mx-auto p-0 gap-0 overflow-hidden"
        data-ocid="sales_report.dialog"
      >
        <DialogHeader className="flex flex-row items-center justify-between px-4 pt-4 pb-0">
          <DialogTitle className="text-base">Reporte de Ventas</DialogTitle>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className="p-1.5 rounded-lg hover:bg-muted transition-colors"
              >
                <MoreVertical size={18} className="text-muted-foreground" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-44">
              <DropdownMenuItem onClick={exportPDF}>
                <FileDown size={14} className="mr-2" /> Exportar PDF
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </DialogHeader>

        <ScrollArea className="max-h-[80vh]">
          <div className="px-4 pb-6 pt-3 space-y-4">
            <div className="bg-navy rounded-2xl py-5 text-center">
              <p className="text-white/70 text-xs mb-1">Importe Total</p>
              <p className="text-white text-3xl font-bold">
                ${formatPrice(totalRevenue)}
              </p>
            </div>

            <div className="space-y-2">
              <div className="flex gap-2">
                <Button
                  variant={dateMode === "range" ? "default" : "outline"}
                  size="sm"
                  className="flex-1 h-8 text-xs"
                  onClick={() => setDateMode("range")}
                >
                  Rango de fechas
                </Button>
                <Button
                  variant={dateMode === "single" ? "default" : "outline"}
                  size="sm"
                  className="flex-1 h-8 text-xs"
                  onClick={() => setDateMode("single")}
                >
                  Fecha específica
                </Button>
              </div>

              {dateMode === "range" ? (
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label className="text-xs text-muted-foreground mb-1 block">
                      Desde
                    </Label>
                    <div className="relative">
                      <Calendar
                        size={12}
                        className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground"
                      />
                      <Input
                        type="date"
                        value={dateFrom}
                        onChange={(e) => setDateFrom(e.target.value)}
                        className="pl-7 h-8 text-xs"
                      />
                    </div>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground mb-1 block">
                      Hasta
                    </Label>
                    <div className="relative">
                      <Calendar
                        size={12}
                        className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground"
                      />
                      <Input
                        type="date"
                        value={dateTo}
                        onChange={(e) => setDateTo(e.target.value)}
                        className="pl-7 h-8 text-xs"
                      />
                    </div>
                  </div>
                </div>
              ) : (
                <div>
                  <Label className="text-xs text-muted-foreground mb-1 block">
                    Fecha
                  </Label>
                  <div className="relative">
                    <Calendar
                      size={12}
                      className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground"
                    />
                    <Input
                      type="date"
                      value={singleDate}
                      onChange={(e) => setSingleDate(e.target.value)}
                      className="pl-7 h-8 text-xs"
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="bg-card border border-border rounded-xl p-3">
              <p className="text-xs font-semibold text-muted-foreground mb-3">
                Ventas por día
              </p>
              {chartData.length > 0 ? (
                <BarChart data={chartData} />
              ) : (
                <div className="h-32 flex items-center justify-center">
                  <p className="text-xs text-muted-foreground">
                    Sin datos en el período
                  </p>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                Estadísticas
              </p>
              <div className="grid grid-cols-2 gap-2">
                <div className="bg-card border border-border rounded-xl p-3">
                  <p className="text-xs text-muted-foreground mb-1">
                    Total de ventas
                  </p>
                  <p className="text-lg font-bold text-foreground">
                    ${formatPrice(totalRevenue)}
                  </p>
                </div>
                <div className="bg-card border border-border rounded-xl p-3">
                  <p className="text-xs text-muted-foreground mb-1">
                    Núm. de ventas
                  </p>
                  <p className="text-lg font-bold text-foreground">
                    {numSales}
                  </p>
                </div>
                <div className="bg-card border border-border rounded-xl p-3">
                  <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                    <TrendingUp size={10} className="text-green-500" /> Más alta
                  </p>
                  <p className="text-lg font-bold text-green-500">
                    ${formatPrice(highest)}
                  </p>
                </div>
                <div className="bg-card border border-border rounded-xl p-3">
                  <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                    <TrendingDown size={10} className="text-red-500" /> Más baja
                  </p>
                  <p className="text-lg font-bold text-red-500">
                    ${formatPrice(lowest)}
                  </p>
                </div>
                <div className="col-span-2 bg-card border border-border rounded-xl p-3">
                  <p className="text-xs text-muted-foreground mb-1">Promedio</p>
                  <p className="text-lg font-bold text-teal">
                    ${formatPrice(average)}
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                Monto por cliente
              </p>
              {perCustomer.length > 0 ? (
                <div className="space-y-1.5">
                  {perCustomer.map(([name, amount]) => (
                    <div
                      key={name}
                      className="flex items-center justify-between bg-card border border-border rounded-xl px-3 py-2"
                    >
                      <span className="text-sm font-medium truncate max-w-[55%]">
                        {name}
                      </span>
                      <span className="text-sm font-bold text-teal">
                        ${formatPrice(amount)}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-muted-foreground py-2">
                  Sin datos en el período
                </p>
              )}
            </div>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}

// ─── Products Report Modal ────────────────────────────────────────────────────

interface ProductsReportProps {
  open: boolean;
  onClose: () => void;
  sales: Sale[];
  products: Product[];
}

function ProductsReportModal({
  open,
  onClose,
  sales,
  products,
}: ProductsReportProps) {
  const [dateMode, setDateMode] = useState<"range" | "single">("range");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [singleDate, setSingleDate] = useState("");

  const filteredSales = useMemo(() => {
    if (dateMode === "single" && singleDate) {
      return sales.filter((s) => isoDate(s.date) === singleDate);
    }
    let result = [...sales];
    if (dateFrom) {
      const from = new Date(dateFrom).getTime() * 1_000_000;
      result = result.filter((s) => Number(s.date) >= from);
    }
    if (dateTo) {
      const to = new Date(dateTo).getTime() * 1_000_000 + 86400 * 1_000_000_000;
      result = result.filter((s) => Number(s.date) <= to);
    }
    return result;
  }, [sales, dateMode, dateFrom, dateTo, singleDate]);

  // Aggregate per product: { qty, revenue }
  const productStats = useMemo(() => {
    const map = new Map<
      bigint,
      { name: string; qty: number; revenue: number }
    >();
    for (const sale of filteredSales) {
      for (const item of sale.items) {
        const prod = products.find((p) => p.id === item.productId);
        const name = prod?.name ?? `Prod #${item.productId}`;
        const prev = map.get(item.productId) ?? { name, qty: 0, revenue: 0 };
        map.set(item.productId, {
          name,
          qty: prev.qty + Number(item.quantity),
          revenue:
            prev.revenue + Number(item.quantity) * Number(item.unitPrice),
        });
      }
    }
    return Array.from(map.values());
  }, [filteredSales, products]);

  const totalQty = productStats.reduce((acc, p) => acc + p.qty, 0);

  const mostSold =
    productStats.length > 0
      ? productStats.reduce((a, b) => (b.qty > a.qty ? b : a))
      : null;
  const leastSold =
    productStats.length > 0
      ? productStats.reduce((a, b) => (b.qty < a.qty ? b : a))
      : null;
  const mostRevenue =
    productStats.length > 0
      ? productStats.reduce((a, b) => (b.revenue > a.revenue ? b : a))
      : null;
  const leastRevenue =
    productStats.length > 0
      ? productStats.reduce((a, b) => (b.revenue < a.revenue ? b : a))
      : null;

  // Chart: top 8 products by qty
  const chartData = useMemo(() => {
    return [...productStats]
      .sort((a, b) => b.qty - a.qty)
      .slice(0, 8)
      .map((p) => ({
        label: p.name.length > 8 ? `${p.name.slice(0, 7)}…` : p.name,
        value: p.qty,
      }));
  }, [productStats]);

  const exportPDF = () => {
    const htmlHeader = buildHtmlHeader();
    const periodLabel =
      dateMode === "single" && singleDate
        ? singleDate
        : [dateFrom, dateTo].filter(Boolean).join(" — ") ||
          "Todos los períodos";

    const rows = [...productStats]
      .sort((a, b) => b.qty - a.qty)
      .map(
        (p) =>
          `<tr><td>${p.name}</td><td>${p.qty}</td><td>$${formatPrice(p.revenue)}</td></tr>`,
      )
      .join("");

    const html = `<html><head><title>Reporte de Productos</title>
<style>
body{font-family:sans-serif;padding:20px;color:#1a1a1a}
h2{color:#0B2040;margin-bottom:4px}
.header{margin-bottom:16px;padding:12px;background:#f5f5f5;border-radius:6px}
.total-box{text-align:center;background:#0B2040;color:white;border-radius:10px;padding:20px;margin:16px 0}
.total-box .amount{font-size:2.5rem;font-weight:bold}
.stats{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin:16px 0}
.stat{background:#f5f5f5;border-radius:8px;padding:12px}
.stat .label{font-size:11px;color:#666;margin-bottom:4px}
.stat .value{font-size:1.1rem;font-weight:bold;word-break:break-word}
table{width:100%;border-collapse:collapse;margin-top:12px}
th,td{border:1px solid #ddd;padding:8px;text-align:left;font-size:13px}
th{background:#0B2040;color:white}
</style></head>
<body>
<div class="header">${htmlHeader}</div>
<h2>Reporte de Productos</h2>
<p style="font-size:12px;color:#666">Período: ${periodLabel}</p>
<div class="total-box">
  <div style="font-size:13px;opacity:0.8;margin-bottom:6px">Total Productos Vendidos</div>
  <div class="amount">${totalQty}</div>
</div>
<div class="stats">
  <div class="stat"><div class="label">Más vendido</div><div class="value">${mostSold?.name ?? "—"} (${mostSold?.qty ?? 0})</div></div>
  <div class="stat"><div class="label">Menos vendido</div><div class="value">${leastSold?.name ?? "—"} (${leastSold?.qty ?? 0})</div></div>
  <div class="stat"><div class="label">Más ingresos</div><div class="value">${mostRevenue?.name ?? "—"} ($${formatPrice(mostRevenue?.revenue ?? 0)})</div></div>
  <div class="stat"><div class="label">Menos ingresos</div><div class="value">${leastRevenue?.name ?? "—"} ($${formatPrice(leastRevenue?.revenue ?? 0)})</div></div>
</div>
<h3>Detalle por producto</h3>
<table>
  <thead><tr><th>Producto</th><th>Cantidad</th><th>Ingresos</th></tr></thead>
  <tbody>${rows || '<tr><td colspan="3">Sin datos</td></tr>'}</tbody>
</table>
</body></html>`;
    const win = window.open("", "_blank");
    if (win) {
      win.document.write(html);
      win.document.close();
      win.print();
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!v) onClose();
      }}
    >
      <DialogContent
        className="max-w-sm mx-auto p-0 gap-0 overflow-hidden"
        data-ocid="products_report.dialog"
      >
        <DialogHeader className="flex flex-row items-center justify-between px-4 pt-4 pb-0">
          <DialogTitle className="text-base">Reporte de Productos</DialogTitle>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className="p-1.5 rounded-lg hover:bg-muted transition-colors"
                data-ocid="products_report.menu_button"
              >
                <MoreVertical size={18} className="text-muted-foreground" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-44">
              <DropdownMenuItem
                onClick={exportPDF}
                data-ocid="products_report.export_pdf"
              >
                <FileDown size={14} className="mr-2" /> Exportar PDF
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </DialogHeader>

        <ScrollArea className="max-h-[80vh]">
          <div className="px-4 pb-6 pt-3 space-y-4">
            {/* Total products sold */}
            <div className="bg-navy rounded-2xl py-5 text-center">
              <p className="text-white/70 text-xs mb-1">
                Total Productos Vendidos
              </p>
              <p className="text-white text-3xl font-bold">{totalQty}</p>
            </div>

            {/* Date selector */}
            <div className="space-y-2">
              <div className="flex gap-2">
                <Button
                  variant={dateMode === "range" ? "default" : "outline"}
                  size="sm"
                  className="flex-1 h-8 text-xs"
                  onClick={() => setDateMode("range")}
                >
                  Rango de fechas
                </Button>
                <Button
                  variant={dateMode === "single" ? "default" : "outline"}
                  size="sm"
                  className="flex-1 h-8 text-xs"
                  onClick={() => setDateMode("single")}
                >
                  Fecha específica
                </Button>
              </div>

              {dateMode === "range" ? (
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label className="text-xs text-muted-foreground mb-1 block">
                      Desde
                    </Label>
                    <div className="relative">
                      <Calendar
                        size={12}
                        className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground"
                      />
                      <Input
                        type="date"
                        value={dateFrom}
                        onChange={(e) => setDateFrom(e.target.value)}
                        className="pl-7 h-8 text-xs"
                      />
                    </div>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground mb-1 block">
                      Hasta
                    </Label>
                    <div className="relative">
                      <Calendar
                        size={12}
                        className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground"
                      />
                      <Input
                        type="date"
                        value={dateTo}
                        onChange={(e) => setDateTo(e.target.value)}
                        className="pl-7 h-8 text-xs"
                      />
                    </div>
                  </div>
                </div>
              ) : (
                <div>
                  <Label className="text-xs text-muted-foreground mb-1 block">
                    Fecha
                  </Label>
                  <div className="relative">
                    <Calendar
                      size={12}
                      className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground"
                    />
                    <Input
                      type="date"
                      value={singleDate}
                      onChange={(e) => setSingleDate(e.target.value)}
                      className="pl-7 h-8 text-xs"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Bar chart: products vs qty */}
            <div className="bg-card border border-border rounded-xl p-3">
              <p className="text-xs font-semibold text-muted-foreground mb-1">
                Cantidad vendida por producto
              </p>
              <p className="text-[10px] text-muted-foreground mb-3">
                Eje X: productos · Eje Y: unidades
              </p>
              {chartData.length > 0 ? (
                <BarChart data={chartData} />
              ) : (
                <div className="h-32 flex items-center justify-center">
                  <p className="text-xs text-muted-foreground">
                    Sin datos en el período
                  </p>
                </div>
              )}
            </div>

            {/* Stats */}
            <div className="space-y-2">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                Estadísticas
              </p>
              <div className="grid grid-cols-2 gap-2">
                <div className="col-span-2 bg-card border border-border rounded-xl p-3">
                  <p className="text-xs text-muted-foreground mb-1">
                    Total productos vendidos
                  </p>
                  <p className="text-lg font-bold text-foreground">
                    {totalQty} unidades
                  </p>
                </div>

                <div className="bg-card border border-border rounded-xl p-3">
                  <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                    <TrendingUp size={10} className="text-green-500" /> Más
                    vendido
                  </p>
                  <p className="text-sm font-bold text-green-500 truncate">
                    {mostSold?.name ?? "—"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {mostSold?.qty ?? 0} uds.
                  </p>
                </div>

                <div className="bg-card border border-border rounded-xl p-3">
                  <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                    <TrendingDown size={10} className="text-red-500" /> Menos
                    vendido
                  </p>
                  <p className="text-sm font-bold text-red-500 truncate">
                    {leastSold?.name ?? "—"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {leastSold?.qty ?? 0} uds.
                  </p>
                </div>

                <div className="bg-card border border-border rounded-xl p-3">
                  <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                    <TrendingUp size={10} className="text-teal" /> Más ingresos
                  </p>
                  <p className="text-sm font-bold text-teal truncate">
                    {mostRevenue?.name ?? "—"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    ${formatPrice(mostRevenue?.revenue ?? 0)}
                  </p>
                </div>

                <div className="bg-card border border-border rounded-xl p-3">
                  <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                    <TrendingDown size={10} className="text-orange-400" /> Menos
                    ingresos
                  </p>
                  <p className="text-sm font-bold text-orange-400 truncate">
                    {leastRevenue?.name ?? "—"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    ${formatPrice(leastRevenue?.revenue ?? 0)}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}

// ─── Salidas Report Modal ─────────────────────────────────────────────────────
function SalidasReportModal({
  open,
  onClose,
}: { open: boolean; onClose: () => void }) {
  const [dateMode, setDateMode] = useState<"range" | "single">("range");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [singleDate, setSingleDate] = useState("");

  const allSalidas = getSalidas();

  const filtered = useMemo(() => {
    if (dateMode === "single" && singleDate) {
      return allSalidas.filter(
        (s) => new Date(s.date).toISOString().slice(0, 10) === singleDate,
      );
    }
    let result = [...allSalidas];
    if (dateFrom)
      result = result.filter((s) => s.date >= new Date(dateFrom).getTime());
    if (dateTo)
      result = result.filter(
        (s) => s.date <= new Date(dateTo).getTime() + 86400000,
      );
    return result;
  }, [allSalidas, dateMode, dateFrom, dateTo, singleDate]);

  // Aggregate product quantities
  const productMap = useMemo(() => {
    const map = new Map<string, number>();
    for (const s of filtered) {
      for (const item of s.items) {
        map.set(
          item.productName,
          (map.get(item.productName) ?? 0) + item.quantity,
        );
      }
    }
    return map;
  }, [filtered]);

  const totalUnits = Array.from(productMap.values()).reduce((a, b) => a + b, 0);
  const productEntries = Array.from(productMap.entries()).sort(
    (a, b) => b[1] - a[1],
  );
  const mostOut = productEntries[0];
  const leastOut = productEntries[productEntries.length - 1];

  const tipoMap = useMemo(() => {
    const map = new Map<string, number>();
    for (const s of filtered) {
      map.set(s.tipoSalidaNombre, (map.get(s.tipoSalidaNombre) ?? 0) + 1);
    }
    return map;
  }, [filtered]);
  const topTipo = Array.from(tipoMap.entries()).sort((a, b) => b[1] - a[1])[0];

  const chartData = productEntries
    .slice(0, 10)
    .map(([label, value]) => ({ label, value }));

  const exportPDF = () => {
    const htmlHeader = buildHtmlHeader();
    const periodLabel =
      dateMode === "single" && singleDate
        ? singleDate
        : [dateFrom, dateTo].filter(Boolean).join(" — ") ||
          "Todos los períodos";
    const rows = productEntries
      .map(([name, qty]) => `<tr><td>${name}</td><td>${qty}</td></tr>`)
      .join("");
    const html = `<html><head><title>Reporte Salidas</title>
<style>body{font-family:sans-serif;padding:20px}h2{color:#0B2040}.header{margin-bottom:16px;padding:12px;background:#f5f5f5;border-radius:6px}.total-box{text-align:center;background:#ea580c;color:white;border-radius:10px;padding:20px;margin:16px 0}.total-box .amount{font-size:2.5rem;font-weight:bold}table{width:100%;border-collapse:collapse;margin-top:12px}th,td{border:1px solid #ddd;padding:8px;text-align:left;font-size:13px}th{background:#ea580c;color:white}</style></head>
<body><div class="header">${htmlHeader}</div><h2>Reporte de Salidas de Mercancía</h2>
<p style="font-size:12px;color:#666">Período: ${periodLabel}</p>
<div class="total-box"><div style="font-size:13px;opacity:0.8;margin-bottom:6px">Total Unidades Salidas</div><div class="amount">${totalUnits}</div></div>
<table><thead><tr><th>Producto</th><th>Cantidad</th></tr></thead><tbody>${rows || '<tr><td colspan="2">Sin datos</td></tr>'}</tbody></table>
</body></html>`;
    const win = window.open("", "_blank");
    if (win) {
      win.document.write(html);
      win.document.close();
      win.print();
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!v) onClose();
      }}
    >
      <DialogContent
        className="max-w-sm mx-auto p-0 gap-0 overflow-hidden"
        data-ocid="salidas_report.dialog"
      >
        <DialogHeader className="flex flex-row items-center justify-between px-4 pt-4 pb-0">
          <DialogTitle className="text-base">Reporte de Salidas</DialogTitle>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className="p-1.5 rounded-lg hover:bg-muted transition-colors"
              >
                <MoreVertical size={18} className="text-muted-foreground" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-44">
              <DropdownMenuItem onClick={exportPDF}>
                <FileDown size={14} className="mr-2" /> Exportar PDF
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </DialogHeader>
        <ScrollArea className="max-h-[80vh]">
          <div className="px-4 pb-6 pt-3 space-y-4">
            <div className="bg-orange-500 rounded-2xl py-5 text-center">
              <p className="text-white/80 text-xs mb-1">
                Total Unidades Salidas
              </p>
              <p className="text-white text-3xl font-bold">{totalUnits}</p>
            </div>
            <div className="space-y-2">
              <div className="flex gap-2">
                <Button
                  variant={dateMode === "range" ? "default" : "outline"}
                  size="sm"
                  className="flex-1 h-8 text-xs"
                  onClick={() => setDateMode("range")}
                >
                  Rango de fechas
                </Button>
                <Button
                  variant={dateMode === "single" ? "default" : "outline"}
                  size="sm"
                  className="flex-1 h-8 text-xs"
                  onClick={() => setDateMode("single")}
                >
                  Fecha específica
                </Button>
              </div>
              {dateMode === "range" ? (
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label className="text-xs text-muted-foreground mb-1 block">
                      Desde
                    </Label>
                    <div className="relative">
                      <Calendar
                        size={12}
                        className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground"
                      />
                      <Input
                        type="date"
                        value={dateFrom}
                        onChange={(e) => setDateFrom(e.target.value)}
                        className="pl-7 h-8 text-xs"
                      />
                    </div>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground mb-1 block">
                      Hasta
                    </Label>
                    <div className="relative">
                      <Calendar
                        size={12}
                        className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground"
                      />
                      <Input
                        type="date"
                        value={dateTo}
                        onChange={(e) => setDateTo(e.target.value)}
                        className="pl-7 h-8 text-xs"
                      />
                    </div>
                  </div>
                </div>
              ) : (
                <div>
                  <Label className="text-xs text-muted-foreground mb-1 block">
                    Fecha
                  </Label>
                  <div className="relative">
                    <Calendar
                      size={12}
                      className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground"
                    />
                    <Input
                      type="date"
                      value={singleDate}
                      onChange={(e) => setSingleDate(e.target.value)}
                      className="pl-7 h-8 text-xs"
                    />
                  </div>
                </div>
              )}
            </div>
            <div className="bg-card border border-border rounded-xl p-3">
              <p className="text-xs font-semibold text-muted-foreground mb-3">
                Unidades por producto
              </p>
              {chartData.length > 0 ? (
                <BarChart data={chartData} />
              ) : (
                <p className="text-center text-muted-foreground text-sm py-4">
                  Sin datos en el período
                </p>
              )}
            </div>
            <div className="space-y-2">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                Estadísticas
              </p>
              <div className="grid grid-cols-2 gap-2">
                <div className="col-span-2 bg-card border border-border rounded-xl p-3">
                  <p className="text-xs text-muted-foreground mb-1">
                    Total unidades salidas
                  </p>
                  <p className="text-lg font-bold">{totalUnits} unidades</p>
                </div>
                <div className="bg-card border border-border rounded-xl p-3">
                  <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                    <TrendingUp size={10} className="text-orange-500" /> Más
                    salidas
                  </p>
                  <p className="text-sm font-bold text-orange-500 truncate">
                    {mostOut?.[0] ?? "—"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {mostOut?.[1] ?? 0} uds.
                  </p>
                </div>
                <div className="bg-card border border-border rounded-xl p-3">
                  <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                    <TrendingDown size={10} className="text-red-500" /> Menos
                    salidas
                  </p>
                  <p className="text-sm font-bold text-red-500 truncate">
                    {leastOut?.[0] ?? "—"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {leastOut?.[1] ?? 0} uds.
                  </p>
                </div>
                <div className="col-span-2 bg-card border border-border rounded-xl p-3">
                  <p className="text-xs text-muted-foreground mb-1">
                    Tipo de salida más usado
                  </p>
                  <p className="text-sm font-bold truncate">
                    {topTipo?.[0] ?? "—"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {topTipo?.[1] ?? 0} registro(s)
                  </p>
                </div>
              </div>
            </div>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}

// ─── Main Reportes page ───────────────────────────────────────────────────────

export default function Reportes() {
  const { data: sales = [] } = useSales();
  const { data: products = [] } = useProducts();
  const { data: customers = [] } = useCustomers();
  const [showSalesReport, setShowSalesReport] = useState(false);
  const [showProductsReport, setShowProductsReport] = useState(false);
  const [showSalidasReport, setShowSalidasReport] = useState(false);

  const totalRevenue = sales.reduce((acc, s) => acc + Number(s.totalAmount), 0);
  const avgSale = sales.length > 0 ? totalRevenue / sales.length : 0;

  const formatCurrency = (n: number) => `$${(n / 100).toFixed(2)}`;

  const stats = [
    {
      id: "ventas",
      label: "Total Ventas",
      value: sales.length.toString(),
      icon: <FileText size={20} className="text-teal" />,
      desc: "ventas registradas",
      clickable: true,
      onClick: () => setShowSalesReport(true),
    },
    {
      id: "ingresos",
      label: "Ingresos Totales",
      value: formatCurrency(totalRevenue),
      icon: <TrendingUp size={20} className="text-teal" />,
      desc: "acumulado",
      clickable: true,
      onClick: () => setShowSalesReport(true),
    },
    {
      id: "promedio",
      label: "Venta Promedio",
      value: formatCurrency(avgSale),
      icon: <BarChart2 size={20} className="text-teal" />,
      desc: "por venta",
      clickable: false,
      onClick: undefined,
    },
    {
      id: "clientes",
      label: "Clientes",
      value: customers.length.toString(),
      icon: <FileText size={20} className="text-teal" />,
      desc: "registrados",
      clickable: false,
      onClick: undefined,
    },
    {
      id: "productos",
      label: "Productos",
      value: products.length.toString(),
      icon: <BarChart2 size={20} className="text-teal" />,
      desc: "en inventario",
      clickable: true,
      onClick: () => setShowProductsReport(true),
    },
    {
      id: "salidas",
      label: "Salidas de Mercancía",
      value: getSalidas().length.toString(),
      icon: <ArrowDownToLine size={20} className="text-orange-500" />,
      desc: "movimientos",
      clickable: true,
      onClick: () => setShowSalidasReport(true),
    },
  ];

  return (
    <div className="px-4 pb-6 pt-4">
      <p className="text-sm text-muted-foreground mb-5">
        Resumen general del negocio
      </p>
      <div className="grid grid-cols-2 gap-3">
        {stats.map((s) =>
          s.clickable ? (
            <button
              key={s.id}
              type="button"
              data-ocid={`reportes.${s.id}_card`}
              onClick={s.onClick}
              className={`bg-card border rounded-xl p-4 flex flex-col gap-2 text-left transition-colors active:scale-95 ${s.id === "salidas" ? "border-orange-400/40 hover:bg-orange-500/5" : "border-teal/40 hover:bg-teal/5"}`}
            >
              <div className="flex items-center gap-2">
                {s.icon}
                <span className="text-xs text-muted-foreground">{s.label}</span>
              </div>
              <p className="text-xl font-bold text-foreground leading-none">
                {s.value}
              </p>
              <p
                className={`text-xs ${s.id === "salidas" ? "text-orange-500" : "text-teal"}`}
              >
                Ver reporte →
              </p>
            </button>
          ) : (
            <div
              key={s.id}
              className="bg-card border border-border rounded-xl p-4 flex flex-col gap-2"
            >
              <div className="flex items-center gap-2">
                {s.icon}
                <span className="text-xs text-muted-foreground">{s.label}</span>
              </div>
              <p className="text-xl font-bold text-foreground leading-none">
                {s.value}
              </p>
              <p className="text-xs text-muted-foreground">{s.desc}</p>
            </div>
          ),
        )}
      </div>

      <SalesReportModal
        open={showSalesReport}
        onClose={() => setShowSalesReport(false)}
        sales={sales}
        customers={customers}
      />

      <ProductsReportModal
        open={showProductsReport}
        onClose={() => setShowProductsReport(false)}
        sales={sales}
        products={products}
      />
      <SalidasReportModal
        open={showSalidasReport}
        onClose={() => setShowSalidasReport(false)}
      />
    </div>
  );
}
