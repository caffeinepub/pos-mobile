import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  ArrowDownToLine,
  ArrowLeft,
  BarChart2,
  Calendar,
  FileDown,
  FileText,
  MoreVertical,
  Package,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import { useMemo, useState } from "react";
import type { Customer, Product, Sale } from "../backend.d";
import { useCustomers, useProducts, useSales } from "../hooks/useQueries";
import { buildHtmlHeader } from "../utils/businessData";
import { getEntradas } from "../utils/entradas";
import { getSalidas, getTiposSalida } from "../utils/salidas";

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

// ─── Sub-screen header ────────────────────────────────────────────────────────
function SubScreenHeader({
  title,
  onBack,
  onExport,
  onExportCSV,
}: {
  title: string;
  onBack: () => void;
  onExport: () => void;
  onExportCSV?: () => void;
}) {
  return (
    <div className="flex items-center justify-between px-4 py-3 border-b border-border shrink-0">
      <button
        type="button"
        onClick={onBack}
        className="flex items-center gap-2 text-sm font-medium text-foreground"
        data-ocid="reportes.back_button"
      >
        <ArrowLeft size={18} />
        {title}
      </button>
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
          <DropdownMenuItem onClick={onExport}>
            <FileDown size={14} className="mr-2" /> Exportar PDF
          </DropdownMenuItem>
          {onExportCSV && (
            <DropdownMenuItem onClick={onExportCSV}>
              <FileText size={14} className="mr-2" /> Exportar CSV
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

// ─── Date selector ────────────────────────────────────────────────────────────
function DateSelector({
  dateMode,
  setDateMode,
  dateFrom,
  setDateFrom,
  dateTo,
  setDateTo,
  singleDate,
  setSingleDate,
}: {
  dateMode: "range" | "single";
  setDateMode: (m: "range" | "single") => void;
  dateFrom: string;
  setDateFrom: (v: string) => void;
  dateTo: string;
  setDateTo: (v: string) => void;
  singleDate: string;
  setSingleDate: (v: string) => void;
}) {
  return (
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
  );
}

// ─── Sales Report Sub-screen ──────────────────────────────────────────────────
function SalesReportScreen({
  onClose,
  sales,
  customers,
}: {
  onClose: () => void;
  sales: Sale[];
  customers: Customer[];
}) {
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
      .map(([label, value]) => ({ label: label.slice(5), value }));
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
<style>body{font-family:sans-serif;padding:20px;color:#1a1a1a}h2{color:#0B2040;margin-bottom:4px}.header{margin-bottom:16px;padding:12px;background:#f5f5f5;border-radius:6px}.total-box{text-align:center;background:#0B2040;color:white;border-radius:10px;padding:20px;margin:16px 0}.total-box .amount{font-size:2.5rem;font-weight:bold}.stats{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin:16px 0}.stat{background:#f5f5f5;border-radius:8px;padding:12px}.stat .label{font-size:11px;color:#666;margin-bottom:4px}.stat .value{font-size:1.2rem;font-weight:bold}table{width:100%;border-collapse:collapse;margin-top:12px}th,td{border:1px solid #ddd;padding:8px;text-align:left;font-size:13px}th{background:#0B2040;color:white}</style></head>
<body><div class="header">${htmlHeader}</div><h2>Reporte de Ventas</h2><p style="font-size:12px;color:#666">Período: ${periodLabel}</p><div class="total-box"><div style="font-size:13px;opacity:0.8;margin-bottom:6px">Importe Total</div><div class="amount">$${formatPrice(totalRevenue)}</div></div><div class="stats"><div class="stat"><div class="label">Total de ventas</div><div class="value">${numSales}</div></div><div class="stat"><div class="label">Venta más alta</div><div class="value">$${formatPrice(highest)}</div></div><div class="stat"><div class="label">Venta más baja</div><div class="value">$${formatPrice(lowest)}</div></div><div class="stat"><div class="label">Venta promedio</div><div class="value">$${formatPrice(average)}</div></div></div><h3>Monto total por cliente</h3><table><thead><tr><th>Cliente</th><th>Total</th></tr></thead><tbody>${customerRows || '<tr><td colspan="2">Sin datos</td></tr>'}</tbody></table></body></html>`;
    const win = window.open("", "_blank");
    if (win) {
      win.document.write(html);
      win.document.close();
      win.print();
    }
  };

  return (
    <div className="h-full flex flex-col" data-ocid="sales_report.panel">
      <SubScreenHeader
        title="Reporte de Ventas"
        onBack={onClose}
        onExport={exportPDF}
      />
      <div className="flex-1 overflow-y-auto px-4 pb-6 pt-4 space-y-4">
        <div className="bg-navy rounded-2xl py-5 text-center">
          <p className="text-white/70 text-xs mb-1">Importe Total</p>
          <p className="text-white text-3xl font-bold">
            ${formatPrice(totalRevenue)}
          </p>
        </div>
        <DateSelector
          dateMode={dateMode}
          setDateMode={setDateMode}
          dateFrom={dateFrom}
          setDateFrom={setDateFrom}
          dateTo={dateTo}
          setDateTo={setDateTo}
          singleDate={singleDate}
          setSingleDate={setSingleDate}
        />
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
              <p className="text-lg font-bold text-foreground">{numSales}</p>
            </div>
            <div className="bg-card border border-border rounded-xl p-3">
              <p className="text-xs text-muted-foreground mb-1">Promedio</p>
              <p className="text-lg font-bold text-teal">
                ${formatPrice(average)}
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
    </div>
  );
}

// ─── Products Report Sub-screen ───────────────────────────────────────────────
function ProductsReportScreen({
  onClose,
  sales,
  products,
}: {
  onClose: () => void;
  sales: Sale[];
  products: Product[];
}) {
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

  const productStats = useMemo(() => {
    const qtyMap = new Map<string, number>();
    const revMap = new Map<string, number>();
    for (const s of filteredSales) {
      for (const item of s.items) {
        const prod = products.find((p) => p.id === item.productId);
        const name = prod?.name ?? `Producto ${item.productId}`;
        qtyMap.set(name, (qtyMap.get(name) ?? 0) + Number(item.quantity));
        revMap.set(
          name,
          (revMap.get(name) ?? 0) +
            Number(item.quantity) * Number(item.unitPrice),
        );
      }
    }
    return { qtyMap, revMap };
  }, [filteredSales, products]);

  const totalQty = Array.from(productStats.qtyMap.values()).reduce(
    (a, b) => a + b,
    0,
  );

  const sortedByQty = Array.from(productStats.qtyMap.entries()).sort(
    (a, b) => b[1] - a[1],
  );
  const sortedByRev = Array.from(productStats.revMap.entries()).sort(
    (a, b) => b[1] - a[1],
  );

  const mostSold = sortedByQty[0]
    ? { name: sortedByQty[0][0], qty: sortedByQty[0][1] }
    : null;
  const leastSold = sortedByQty[sortedByQty.length - 1]
    ? {
        name: sortedByQty[sortedByQty.length - 1][0],
        qty: sortedByQty[sortedByQty.length - 1][1],
      }
    : null;
  const mostRevenue = sortedByRev[0]
    ? { name: sortedByRev[0][0], revenue: sortedByRev[0][1] }
    : null;
  const leastRevenue = sortedByRev[sortedByRev.length - 1]
    ? {
        name: sortedByRev[sortedByRev.length - 1][0],
        revenue: sortedByRev[sortedByRev.length - 1][1],
      }
    : null;

  const chartData = sortedByQty
    .slice(0, 10)
    .map(([label, value]) => ({ label, value }));

  const exportPDF = () => {
    const htmlHeader = buildHtmlHeader();
    const periodLabel =
      dateMode === "single" && singleDate
        ? singleDate
        : [dateFrom, dateTo].filter(Boolean).join(" — ") ||
          "Todos los períodos";
    const rows = sortedByQty
      .map(
        ([name, qty]) =>
          `<tr><td>${name}</td><td>${qty}</td><td>$${formatPrice(productStats.revMap.get(name) ?? 0)}</td></tr>`,
      )
      .join("");
    const html = `<html><head><title>Reporte Productos</title><style>body{font-family:sans-serif;padding:20px}h2{color:#0B2040}.header{margin-bottom:16px;padding:12px;background:#f5f5f5;border-radius:6px}.total-box{text-align:center;background:#0B2040;color:white;border-radius:10px;padding:20px;margin:16px 0}.total-box .amount{font-size:2.5rem;font-weight:bold}table{width:100%;border-collapse:collapse;margin-top:12px}th,td{border:1px solid #ddd;padding:8px;text-align:left;font-size:13px}th{background:#0B2040;color:white}</style></head><body><div class="header">${htmlHeader}</div><h2>Reporte de Productos</h2><p style="font-size:12px;color:#666">Período: ${periodLabel}</p><div class="total-box"><div style="font-size:13px;opacity:0.8;margin-bottom:6px">Total Productos Vendidos</div><div class="amount">${totalQty}</div></div><table><thead><tr><th>Producto</th><th>Cantidad</th><th>Ingresos</th></tr></thead><tbody>${rows || '<tr><td colspan="3">Sin datos</td></tr>'}</tbody></table></body></html>`;
    const win = window.open("", "_blank");
    if (win) {
      win.document.write(html);
      win.document.close();
      win.print();
    }
  };

  // products is used for display context only

  return (
    <div className="h-full flex flex-col" data-ocid="products_report.panel">
      <SubScreenHeader
        title="Reporte de Productos"
        onBack={onClose}
        onExport={exportPDF}
      />
      <div className="flex-1 overflow-y-auto px-4 pb-6 pt-4 space-y-4">
        <div className="bg-navy rounded-2xl py-5 text-center">
          <p className="text-white/70 text-xs mb-1">Total Productos Vendidos</p>
          <p className="text-white text-3xl font-bold">{totalQty}</p>
        </div>
        <DateSelector
          dateMode={dateMode}
          setDateMode={setDateMode}
          dateFrom={dateFrom}
          setDateFrom={setDateFrom}
          dateTo={dateTo}
          setDateTo={setDateTo}
          singleDate={singleDate}
          setSingleDate={setSingleDate}
        />
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
                <TrendingUp size={10} className="text-green-500" /> Más vendido
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
    </div>
  );
}

// ─── Salidas Report Sub-screen ────────────────────────────────────────────────
function SalidasReportScreen({ onClose }: { onClose: () => void }) {
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
    const html = `<html><head><title>Reporte Salidas</title><style>body{font-family:sans-serif;padding:20px}h2{color:#0B2040}.header{margin-bottom:16px;padding:12px;background:#f5f5f5;border-radius:6px}.total-box{text-align:center;background:#ea580c;color:white;border-radius:10px;padding:20px;margin:16px 0}.total-box .amount{font-size:2.5rem;font-weight:bold}table{width:100%;border-collapse:collapse;margin-top:12px}th,td{border:1px solid #ddd;padding:8px;text-align:left;font-size:13px}th{background:#ea580c;color:white}</style></head><body><div class="header">${htmlHeader}</div><h2>Reporte de Salidas de Mercancía</h2><p style="font-size:12px;color:#666">Período: ${periodLabel}</p><div class="total-box"><div style="font-size:13px;opacity:0.8;margin-bottom:6px">Total Unidades Salidas</div><div class="amount">${totalUnits}</div></div><table><thead><tr><th>Producto</th><th>Cantidad</th></tr></thead><tbody>${rows || '<tr><td colspan="2">Sin datos</td></tr>'}</tbody></table></body></html>`;
    const win = window.open("", "_blank");
    if (win) {
      win.document.write(html);
      win.document.close();
      win.print();
    }
  };

  return (
    <div className="h-full flex flex-col" data-ocid="salidas_report.panel">
      <SubScreenHeader
        title="Reporte de Salidas"
        onBack={onClose}
        onExport={exportPDF}
      />
      <div className="flex-1 overflow-y-auto px-4 pb-6 pt-4 space-y-4">
        <div className="bg-orange-500 rounded-2xl py-5 text-center">
          <p className="text-white/80 text-xs mb-1">Total Unidades Salidas</p>
          <p className="text-white text-3xl font-bold">{totalUnits}</p>
        </div>
        <DateSelector
          dateMode={dateMode}
          setDateMode={setDateMode}
          dateFrom={dateFrom}
          setDateFrom={setDateFrom}
          dateTo={dateTo}
          setDateTo={setDateTo}
          singleDate={singleDate}
          setSingleDate={setSingleDate}
        />
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
                <TrendingUp size={10} className="text-orange-500" /> Más salidas
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
    </div>
  );
}

// ─── IPV Report Sub-screen ────────────────────────────────────────────────────
function IPVReportScreen({
  onClose,
  products,
  sales,
}: { onClose: () => void; products: Product[]; sales: Sale[] }) {
  const allSalidas = getSalidas();
  const allEntradas = getEntradas();
  const tiposSalida = getTiposSalida();

  // Build rows per product
  const rows = products.map((product) => {
    const pid = String(product.id);
    const precioVenta = Number(product.price) / 100;

    // Stock inicial: current stock is "final", we'll compute initial as final - entradas + ventas + salidas
    const entradas = allEntradas
      .flatMap((e) => e.items)
      .filter((i) => i.productId === pid)
      .reduce((acc, i) => acc + i.quantity, 0);

    const ventas = sales
      .flatMap((s) => s.items ?? [])
      .filter(
        (i: { productId?: bigint | string }) => String(i.productId) === pid,
      )
      .reduce(
        (acc: number, i: { quantity?: number | bigint }) =>
          acc + Number(i.quantity ?? 0),
        0,
      );

    // Salidas by type
    const salidaPorTipo: Record<string, number> = {};
    for (const tipo of tiposSalida) {
      salidaPorTipo[tipo.name] = allSalidas
        .filter((s) => s.tipoSalidaNombre === tipo.name)
        .flatMap((s) => s.items)
        .filter((i) => i.productId === pid)
        .reduce((acc, i) => acc + i.quantity, 0);
    }

    const totalSalidas = Object.values(salidaPorTipo).reduce(
      (a, b) => a + b,
      0,
    );
    const stockFinal = Number(product.stock ?? 0);
    const stockInicial = stockFinal - entradas + ventas + totalSalidas;
    const disponible = stockInicial + entradas;

    return {
      codigo: product.barcode ?? "",
      descripcion: product.name,
      precioVenta,
      stockInicial,
      entradas,
      disponible,
      ventas,
      salidaPorTipo,
      totalSalidas,
      stockFinal,
    };
  });

  const fmt = (n: number) => n.toFixed(2);
  const imp = (precio: number, qty: number) => fmt(precio * qty);

  const handleExportCSV = () => {
    const tiposCols = tiposSalida.flatMap((t) => [t.name, `Imp.${t.name}`]);
    const header = [
      "Código",
      "Descripción",
      "P.Venta",
      "Stk.Ini",
      "Imp.Ini",
      "Entradas",
      "Imp.Ent",
      "Disponible",
      "Imp.Disp",
      "Ventas",
      "Imp.Ven",
      ...tiposCols,
      "Stk.Final",
      "Imp.Final",
    ].join(",");
    const dataRows = rows.map((r) => {
      const tiposVals = tiposSalida.flatMap((t) => {
        const qty = r.salidaPorTipo[t.name] ?? 0;
        return [qty, imp(r.precioVenta, qty)];
      });
      return [
        r.codigo,
        `"${r.descripcion}"`,
        fmt(r.precioVenta),
        r.stockInicial,
        imp(r.precioVenta, r.stockInicial),
        r.entradas,
        imp(r.precioVenta, r.entradas),
        r.disponible,
        imp(r.precioVenta, r.disponible),
        r.ventas,
        imp(r.precioVenta, r.ventas),
        ...tiposVals,
        r.stockFinal,
        imp(r.precioVenta, r.stockFinal),
      ].join(",");
    });
    const csv = [header, ...dataRows].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "IPV.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportPDF = () => {
    const htmlHeader = buildHtmlHeader();
    const tiposHeaders = tiposSalida
      .map((t) => `<th>${t.name}</th><th>Importe</th>`)
      .join("");
    const tiposRows = (row: (typeof rows)[0]) =>
      tiposSalida
        .map((t) => {
          const qty = row.salidaPorTipo[t.name] ?? 0;
          return `<td>${qty}</td><td>${imp(row.precioVenta, qty)}</td>`;
        })
        .join("");

    const rowsHtml = rows
      .map(
        (r) => `
      <tr>
        <td>${r.codigo}</td>
        <td>${r.descripcion}</td>
        <td>${fmt(r.precioVenta)}</td>
        <td>${r.stockInicial}</td><td>${imp(r.precioVenta, r.stockInicial)}</td>
        <td>${r.entradas}</td><td>${imp(r.precioVenta, r.entradas)}</td>
        <td>${r.disponible}</td><td>${imp(r.precioVenta, r.disponible)}</td>
        <td>${r.ventas}</td><td>${imp(r.precioVenta, r.ventas)}</td>
        ${tiposRows(r)}
        <td>${r.stockFinal}</td><td>${imp(r.precioVenta, r.stockFinal)}</td>
      </tr>`,
      )
      .join("");

    const html = `<html><head><title>IPV</title><style>body{font-family:sans-serif;font-size:10px;padding:16px}table{width:100%;border-collapse:collapse}th,td{border:1px solid #ddd;padding:4px;text-align:right}th{background:#0B2040;color:white}td:nth-child(1),td:nth-child(2){text-align:left}.header{margin-bottom:12px;padding:8px;background:#f5f5f5}</style></head><body><div class="header">${htmlHeader}</div><h2>IPV - Inventario Permanente Valorado</h2><table><thead><tr><th>Código</th><th>Descripción</th><th>P.Venta</th><th>Stk.Ini</th><th>Importe</th><th>Entradas</th><th>Importe</th><th>Disponible</th><th>Importe</th><th>Ventas</th><th>Importe</th>${tiposHeaders}<th>Stk.Final</th><th>Importe</th></tr></thead><tbody>${rowsHtml}</tbody></table></body></html>`;
    const win = window.open("", "_blank");
    if (win) {
      win.document.write(html);
      win.document.close();
      win.print();
    }
  };

  return (
    <div className="h-full flex flex-col" data-ocid="ipv_report.panel">
      <SubScreenHeader
        title="IPV"
        onBack={onClose}
        onExport={handleExportPDF}
        onExportCSV={handleExportCSV}
      />

      <div className="flex-1 overflow-auto px-3 pb-6 pt-2">
        <p className="text-xs text-muted-foreground mb-3">
          Inventario Permanente Valorado — todos los movimientos de productos
        </p>
        <div className="overflow-x-auto">
          <table className="w-full text-xs border-collapse min-w-[900px]">
            <thead>
              <tr className="bg-primary text-primary-foreground">
                <th className="border border-border/40 p-1.5 text-left">
                  Código
                </th>
                <th className="border border-border/40 p-1.5 text-left">
                  Descripción
                </th>
                <th className="border border-border/40 p-1.5 text-right">
                  P.Venta
                </th>
                <th className="border border-border/40 p-1.5 text-right">
                  Stk.Ini
                </th>
                <th className="border border-border/40 p-1.5 text-right">
                  Importe
                </th>
                <th className="border border-border/40 p-1.5 text-right">
                  Entradas
                </th>
                <th className="border border-border/40 p-1.5 text-right">
                  Importe
                </th>
                <th className="border border-border/40 p-1.5 text-right">
                  Disponible
                </th>
                <th className="border border-border/40 p-1.5 text-right">
                  Importe
                </th>
                <th className="border border-border/40 p-1.5 text-right">
                  Ventas
                </th>
                <th className="border border-border/40 p-1.5 text-right">
                  Importe
                </th>
                {tiposSalida.map((t) => (
                  <>
                    <th
                      key={`${t.id}-qty`}
                      className="border border-border/40 p-1.5 text-right"
                    >
                      {t.name}
                    </th>
                    <th
                      key={`${t.id}-imp`}
                      className="border border-border/40 p-1.5 text-right"
                    >
                      Importe
                    </th>
                  </>
                ))}
                <th className="border border-border/40 p-1.5 text-right font-bold">
                  Stk.Final
                </th>
                <th className="border border-border/40 p-1.5 text-right font-bold">
                  Importe
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r, idx) => (
                <tr
                  key={r.codigo || idx}
                  className={idx % 2 === 0 ? "bg-background" : "bg-muted/30"}
                >
                  <td className="border border-border/30 p-1.5">{r.codigo}</td>
                  <td className="border border-border/30 p-1.5">
                    {r.descripcion}
                  </td>
                  <td className="border border-border/30 p-1.5 text-right">
                    {r.precioVenta.toFixed(2)}
                  </td>
                  <td className="border border-border/30 p-1.5 text-right">
                    {r.stockInicial}
                  </td>
                  <td className="border border-border/30 p-1.5 text-right">
                    {imp(r.precioVenta, r.stockInicial)}
                  </td>
                  <td className="border border-border/30 p-1.5 text-right">
                    {r.entradas}
                  </td>
                  <td className="border border-border/30 p-1.5 text-right">
                    {imp(r.precioVenta, r.entradas)}
                  </td>
                  <td className="border border-border/30 p-1.5 text-right">
                    {r.disponible}
                  </td>
                  <td className="border border-border/30 p-1.5 text-right">
                    {imp(r.precioVenta, r.disponible)}
                  </td>
                  <td className="border border-border/30 p-1.5 text-right">
                    {r.ventas}
                  </td>
                  <td className="border border-border/30 p-1.5 text-right">
                    {imp(r.precioVenta, r.ventas)}
                  </td>
                  {tiposSalida.map((t) => {
                    const qty = r.salidaPorTipo[t.name] ?? 0;
                    return (
                      <>
                        <td
                          key={`${t.id}-qty`}
                          className="border border-border/30 p-1.5 text-right"
                        >
                          {qty}
                        </td>
                        <td
                          key={`${t.id}-imp`}
                          className="border border-border/30 p-1.5 text-right"
                        >
                          {imp(r.precioVenta, qty)}
                        </td>
                      </>
                    );
                  })}
                  <td className="border border-border/30 p-1.5 text-right font-bold">
                    {r.stockFinal}
                  </td>
                  <td className="border border-border/30 p-1.5 text-right font-bold">
                    {imp(r.precioVenta, r.stockFinal)}
                  </td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr>
                  <td
                    colSpan={11 + tiposSalida.length * 2 + 2}
                    className="text-center text-muted-foreground p-4"
                  >
                    Sin productos registrados
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ─── Main Reportes page ───────────────────────────────────────────────────────

export default function Reportes() {
  const { data: sales = [] } = useSales();
  const { data: products = [] } = useProducts();
  const { data: customers = [] } = useCustomers();
  const [activeView, setActiveView] = useState<
    null | "ventas" | "productos" | "salidas" | "ipv"
  >(null);

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
      onClick: () => setActiveView("ventas"),
    },
    {
      id: "ingresos",
      label: "Ingresos Totales",
      value: formatCurrency(totalRevenue),
      icon: <TrendingUp size={20} className="text-teal" />,
      desc: "acumulado",
      clickable: true,
      onClick: () => setActiveView("ventas"),
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
      onClick: () => setActiveView("productos"),
    },
    {
      id: "salidas",
      label: "Salidas de Mercancía",
      value: getSalidas().length.toString(),
      icon: <ArrowDownToLine size={20} className="text-orange-500" />,
      desc: "movimientos",
      clickable: true,
      onClick: () => setActiveView("salidas"),
    },
    {
      id: "ipv",
      label: "IPV",
      value: products.length.toString(),
      icon: <Package size={20} className="text-purple-500" />,
      desc: "productos",
      clickable: true,
      onClick: () => setActiveView("ipv"),
    },
  ];

  // Render active sub-screen
  if (activeView === "ventas") {
    return (
      <SalesReportScreen
        onClose={() => setActiveView(null)}
        sales={sales}
        customers={customers}
      />
    );
  }
  if (activeView === "productos") {
    return (
      <ProductsReportScreen
        onClose={() => setActiveView(null)}
        sales={sales}
        products={products}
      />
    );
  }
  if (activeView === "salidas") {
    return <SalidasReportScreen onClose={() => setActiveView(null)} />;
  }
  if (activeView === "ipv") {
    return (
      <IPVReportScreen
        onClose={() => setActiveView(null)}
        sales={sales}
        products={products}
      />
    );
  }

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
              className={`bg-card border rounded-xl p-4 flex flex-col gap-2 text-left transition-colors active:scale-95 ${
                s.id === "salidas"
                  ? "border-orange-400/40 hover:bg-orange-500/5"
                  : s.id === "ipv"
                    ? "border-purple-400/40 hover:bg-purple-500/5"
                    : "border-teal/40 hover:bg-teal/5"
              }`}
            >
              <div className="flex items-center gap-2">
                {s.icon}
                <span className="text-xs text-muted-foreground">{s.label}</span>
              </div>
              <p className="text-xl font-bold text-foreground leading-none">
                {s.value}
              </p>
              <p
                className={`text-xs ${s.id === "salidas" ? "text-orange-500" : s.id === "ipv" ? "text-purple-500" : "text-teal"}`}
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
    </div>
  );
}
