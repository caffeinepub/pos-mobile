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
  ArrowLeft,
  BarChart2,
  Calendar,
  FileDown,
  FileSpreadsheet,
  FileText,
  MoreVertical,
  Package,
  Store,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import { useMemo, useState } from "react";
import type { Customer, PaymentType, Product, Sale } from "../backend.d";
import {
  useCustomers,
  usePaymentTypes,
  useProducts,
  useSales,
} from "../hooks/useQueries";
import { buildFileHeader, buildHtmlHeader } from "../utils/businessData";
import { getCurrencySymbol } from "../utils/currency";
import { getEntradas } from "../utils/entradas";
import { getPuntosVenta, getSaleMeta } from "../utils/puntosVenta";
import { getPVInventory } from "../utils/pvInventory";
import { getSalidas, getTiposSalida } from "../utils/salidas";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatPrice(amount: bigint | number): string {
  return (Number(amount) / 100).toFixed(2);
}

function isoDate(time: bigint): string {
  return new Date(Number(time) / 1_000_000).toISOString().slice(0, 10);
}

function msToIso(ms: number): string {
  return new Date(ms).toISOString().slice(0, 10);
}

function getCustomerName(id: bigint, customers: Customer[]): string {
  return customers.find((c) => c.id === id)?.name ?? "Público General";
}

function getPaymentName(id: bigint, paymentTypes: PaymentType[]): string {
  return paymentTypes.find((p) => p.id === id)?.name ?? "Desconocido";
}

function getProductName(id: bigint, products: Product[]): string {
  return products.find((p) => p.id === id)?.name ?? String(id);
}

// Export helpers
function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function exportCSV(csvContent: string, filename: string) {
  const bom = "\uFEFF";
  const blob = new Blob([bom + csvContent], {
    type: "text/csv;charset=utf-8;",
  });
  downloadBlob(blob, filename);
}

function exportXLSX(csvContent: string, filename: string) {
  const bom = "\uFEFF";
  const blob = new Blob([bom + csvContent], {
    type: "application/vnd.ms-excel;charset=utf-8;",
  });
  downloadBlob(blob, filename);
}

// ─── SubScreenHeader ──────────────────────────────────────────────────────────

function SubScreenHeader({
  title,
  onBack,
  onExportCSV,
  onExportPDF,
  onExportXLSX,
}: {
  title: string;
  onBack: () => void;
  onExportCSV: () => void;
  onExportPDF: () => void;
  onExportXLSX: () => void;
}) {
  return (
    <div className="flex items-center justify-between px-4 py-3 border-b border-border shrink-0">
      <button
        type="button"
        onClick={onBack}
        className="flex items-center gap-2 text-sm font-medium text-foreground"
        data-ocid="reportes-pv.back_button"
      >
        <ArrowLeft size={18} />
        {title}
      </button>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            className="p-1.5 rounded-lg hover:bg-muted transition-colors"
            data-ocid="reportes-pv.export_button"
          >
            <MoreVertical size={18} className="text-muted-foreground" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuItem onClick={onExportPDF}>
            <FileDown size={14} className="mr-2" /> Exportar PDF
          </DropdownMenuItem>
          <DropdownMenuItem onClick={onExportCSV}>
            <FileText size={14} className="mr-2" /> Exportar CSV
          </DropdownMenuItem>
          <DropdownMenuItem onClick={onExportXLSX}>
            <FileSpreadsheet size={14} className="mr-2" /> Exportar XLSX
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

// ─── DateSelector ─────────────────────────────────────────────────────────────

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

// ─── PV Selector ──────────────────────────────────────────────────────────────

function PVSelector({
  selectedPvId,
  setSelectedPvId,
}: {
  selectedPvId: string;
  setSelectedPvId: (id: string) => void;
}) {
  const pvs = getPuntosVenta();
  return (
    <div>
      <Label className="text-xs text-muted-foreground mb-1 block">
        Punto de Venta
      </Label>
      <select
        value={selectedPvId}
        onChange={(e) => setSelectedPvId(e.target.value)}
        className="w-full h-8 text-xs rounded-md border border-input bg-background px-2 focus:outline-none focus:ring-2 focus:ring-ring"
        data-ocid="reportes-pv.pv_select"
      >
        <option value="">Todos los PVs</option>
        {pvs.map((pv) => (
          <option key={pv.id} value={pv.id}>
            {pv.name}
          </option>
        ))}
      </select>
    </div>
  );
}

// ─── Filter Bar ───────────────────────────────────────────────────────────────

function FilterBar({
  selectedPvId,
  setSelectedPvId,
  dateMode,
  setDateMode,
  dateFrom,
  setDateFrom,
  dateTo,
  setDateTo,
  singleDate,
  setSingleDate,
}: {
  selectedPvId: string;
  setSelectedPvId: (id: string) => void;
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
    <div className="bg-muted/30 border border-border rounded-xl p-3 space-y-3">
      <PVSelector
        selectedPvId={selectedPvId}
        setSelectedPvId={setSelectedPvId}
      />
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
    </div>
  );
}

// ─── Helper: filter sales by PV + date ────────────────────────────────────────

function filterSales(
  sales: Sale[],
  selectedPvId: string,
  dateMode: "range" | "single",
  dateFrom: string,
  dateTo: string,
  singleDate: string,
): Sale[] {
  let result = [...sales];

  // Filter by PV
  if (selectedPvId) {
    result = result.filter((s) => {
      const meta = getSaleMeta(String(s.id));
      return meta?.puntoVentaId === selectedPvId;
    });
  }

  // Filter by date
  if (dateMode === "single" && singleDate) {
    result = result.filter((s) => isoDate(s.date) === singleDate);
  } else {
    if (dateFrom) {
      const from = new Date(dateFrom).getTime() * 1_000_000;
      result = result.filter((s) => Number(s.date) >= from);
    }
    if (dateTo) {
      const to = new Date(dateTo).getTime() * 1_000_000 + 86400 * 1_000_000_000;
      result = result.filter((s) => Number(s.date) <= to);
    }
  }

  return result;
}

// ─── Sub-screen 1: Total de Ventas PV ─────────────────────────────────────────

function TotalVentasPVScreen({ onClose }: { onClose: () => void }) {
  const currSymbol = getCurrencySymbol();
  const { data: sales = [] } = useSales();
  const { data: customers = [] } = useCustomers();
  const { data: paymentTypes = [] } = usePaymentTypes();

  const [selectedPvId, setSelectedPvId] = useState("");
  const [dateMode, setDateMode] = useState<"range" | "single">("range");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [singleDate, setSingleDate] = useState("");

  const filtered = useMemo(
    () =>
      filterSales(sales, selectedPvId, dateMode, dateFrom, dateTo, singleDate),
    [sales, selectedPvId, dateMode, dateFrom, dateTo, singleDate],
  );

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

  // Payment type breakdown
  const paymentBreakdown = useMemo(() => {
    const map = new Map<string, { count: number; total: number }>();
    for (const s of filtered) {
      const name = getPaymentName(s.paymentTypeId, paymentTypes);
      const cur = map.get(name) ?? { count: 0, total: 0 };
      map.set(name, {
        count: cur.count + 1,
        total: cur.total + Number(s.totalAmount),
      });
    }
    return Array.from(map.entries()).sort((a, b) => b[1].total - a[1].total);
  }, [filtered, paymentTypes]);

  const periodLabel =
    dateMode === "single" && singleDate
      ? singleDate
      : [dateFrom, dateTo].filter(Boolean).join(" — ") || "Todos los períodos";

  const pvName = selectedPvId
    ? (getPuntosVenta().find((p) => p.id === selectedPvId)?.name ??
      selectedPvId)
    : "Todos los PVs";

  // Export CSV
  const handleExportCSV = () => {
    const header = "No.Ctrl,Fecha,Punto de Venta,Cliente,Total,Tipo de Pago";
    const rows = filtered.map((s) => {
      const meta = getSaleMeta(String(s.id));
      const ctrl = meta?.ctrlNum ? String(meta.ctrlNum).padStart(4, "0") : "—";
      const fecha = isoDate(s.date);
      const pvN = meta?.puntoVentaName ?? "—";
      const cliente = getCustomerName(s.customerId, customers);
      const total = formatPrice(s.totalAmount);
      const pago = getPaymentName(s.paymentTypeId, paymentTypes);
      return `${ctrl},${fecha},"${pvN}","${cliente}",${total},"${pago}"`;
    });
    exportCSV([header, ...rows].join("\n"), `TotalVentasPV_${pvName}.csv`);
  };

  // Export XLSX
  const handleExportXLSX = () => {
    const header =
      "No.Ctrl\tFecha\tPunto de Venta\tCliente\tTotal\tTipo de Pago";
    const rows = filtered.map((s) => {
      const meta = getSaleMeta(String(s.id));
      const ctrl = meta?.ctrlNum ? String(meta.ctrlNum).padStart(4, "0") : "—";
      const fecha = isoDate(s.date);
      const pvN = meta?.puntoVentaName ?? "—";
      const cliente = getCustomerName(s.customerId, customers);
      const total = formatPrice(s.totalAmount);
      const pago = getPaymentName(s.paymentTypeId, paymentTypes);
      return `${ctrl}\t${fecha}\t${pvN}\t${cliente}\t${total}\t${pago}`;
    });
    exportXLSX([header, ...rows].join("\n"), `TotalVentasPV_${pvName}.xlsx`);
  };

  // Export PDF
  const handleExportPDF = () => {
    const htmlHeader = buildHtmlHeader();
    const salesRows = filtered
      .map((s) => {
        const meta = getSaleMeta(String(s.id));
        const ctrl = meta?.ctrlNum
          ? String(meta.ctrlNum).padStart(4, "0")
          : "—";
        const fecha = isoDate(s.date);
        const pvN = meta?.puntoVentaName ?? "—";
        const cliente = getCustomerName(s.customerId, customers);
        const total = formatPrice(s.totalAmount);
        const pago = getPaymentName(s.paymentTypeId, paymentTypes);
        return `<tr><td>${ctrl}</td><td>${fecha}</td><td>${pvN}</td><td>${cliente}</td><td>${currSymbol}${total}</td><td>${pago}</td></tr>`;
      })
      .join("");

    const paymentRows = paymentBreakdown
      .map(
        ([name, { count, total }]) =>
          `<tr><td>${name}</td><td>${count}</td><td>${currSymbol}${formatPrice(total)}</td></tr>`,
      )
      .join("");

    const html = `<html><head><title>Total Ventas PV</title>
<style>body{font-family:sans-serif;padding:20px;color:#1a1a1a}h2{color:#0B2040;margin-bottom:4px}.header{margin-bottom:16px;padding:12px;background:#f5f5f5;border-radius:6px}.total-box{text-align:center;background:#0B2040;color:white;border-radius:10px;padding:20px;margin:16px 0}.total-box .amount{font-size:2.5rem;font-weight:bold}.stats{display:grid;grid-template-columns:1fr 1fr 1fr;gap:10px;margin:16px 0}.stat{background:#f5f5f5;border-radius:8px;padding:12px}.stat .label{font-size:11px;color:#666;margin-bottom:4px}.stat .value{font-size:1.2rem;font-weight:bold}table{width:100%;border-collapse:collapse;margin-top:12px}th,td{border:1px solid #ddd;padding:8px;text-align:left;font-size:13px}th{background:#0B2040;color:white}h3{color:#0B2040;margin-top:20px}</style></head>
<body><div class="header">${htmlHeader}</div>
<h2>Total de Ventas — ${pvName}</h2>
<p style="font-size:12px;color:#666">Período: ${periodLabel}</p>
<div class="total-box"><div style="font-size:13px;opacity:0.8;margin-bottom:6px">Importe Total</div><div class="amount">${currSymbol}${formatPrice(totalRevenue)}</div></div>
<div class="stats">
  <div class="stat"><div class="label">Venta más alta</div><div class="value">${currSymbol}${formatPrice(highest)}</div></div>
  <div class="stat"><div class="label">Promedio</div><div class="value">${currSymbol}${formatPrice(average)}</div></div>
  <div class="stat"><div class="label">Venta más baja</div><div class="value">${currSymbol}${formatPrice(lowest)}</div></div>
</div>
<h3>Desglose por Tipo de Pago</h3>
<table><thead><tr><th>Tipo de Pago</th><th>No. Ventas</th><th>Total</th></tr></thead><tbody>${paymentRows || "<tr><td colspan='3'>Sin datos</td></tr>"}</tbody></table>
<h3>Detalle de Ventas</h3>
<table><thead><tr><th>No.Ctrl</th><th>Fecha</th><th>Punto de Venta</th><th>Cliente</th><th>Total</th><th>Tipo de Pago</th></tr></thead><tbody>${salesRows || "<tr><td colspan='6'>Sin ventas</td></tr>"}</tbody></table>
</body></html>`;
    const win = window.open("", "_blank");
    if (win) {
      win.document.write(html);
      win.document.close();
      win.print();
    }
  };

  return (
    <div
      className="h-full flex flex-col"
      data-ocid="reportes-pv.total-ventas.panel"
    >
      <SubScreenHeader
        title="Total de Ventas PV"
        onBack={onClose}
        onExportCSV={handleExportCSV}
        onExportPDF={handleExportPDF}
        onExportXLSX={handleExportXLSX}
      />
      <div
        className="flex-1 overflow-y-auto px-4 pb-6 pt-4 space-y-4"
        style={{ overflowY: "auto" }}
      >
        <FilterBar
          selectedPvId={selectedPvId}
          setSelectedPvId={setSelectedPvId}
          dateMode={dateMode}
          setDateMode={setDateMode}
          dateFrom={dateFrom}
          setDateFrom={setDateFrom}
          dateTo={dateTo}
          setDateTo={setDateTo}
          singleDate={singleDate}
          setSingleDate={setSingleDate}
        />

        {/* Summary */}
        <div className="bg-navy rounded-2xl py-5 text-center">
          <p className="text-white/70 text-xs mb-1">Importe Total</p>
          <p className="text-white text-3xl font-bold">
            {currSymbol}
            {formatPrice(totalRevenue)}
          </p>
          <p className="text-white/60 text-xs mt-1">{pvName}</p>
        </div>

        {/* Stats cards */}
        <div className="grid grid-cols-3 gap-2">
          <div className="bg-card border border-border rounded-xl p-3">
            <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
              <TrendingUp size={10} className="text-green-500" /> Mayor
            </p>
            <p className="text-base font-bold text-green-500">
              {currSymbol}
              {formatPrice(highest)}
            </p>
          </div>
          <div className="bg-card border border-border rounded-xl p-3">
            <p className="text-xs text-muted-foreground mb-1">Promedio</p>
            <p className="text-base font-bold text-teal">
              {currSymbol}
              {formatPrice(average)}
            </p>
          </div>
          <div className="bg-card border border-border rounded-xl p-3">
            <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
              <TrendingDown size={10} className="text-red-500" /> Menor
            </p>
            <p className="text-base font-bold text-red-500">
              {currSymbol}
              {formatPrice(lowest)}
            </p>
          </div>
        </div>

        {/* Payment type breakdown */}
        <div className="space-y-2">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
            Desglose por Tipo de Pago
          </p>
          {paymentBreakdown.length > 0 ? (
            <div className="space-y-2">
              {paymentBreakdown.map(([name, { count, total }]) => {
                const pct = totalRevenue > 0 ? (total / totalRevenue) * 100 : 0;
                return (
                  <div
                    key={name}
                    className="bg-card border border-border rounded-xl p-3"
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-sm font-medium">{name}</span>
                      <span className="text-xs text-muted-foreground">
                        {count} ventas
                      </span>
                    </div>
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex-1 mr-2">
                        <div className="w-full bg-muted rounded-full h-1.5">
                          <div
                            className="bg-teal h-1.5 rounded-full"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                      <span className="text-sm font-bold text-teal">
                        {currSymbol}
                        {formatPrice(total)}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {pct.toFixed(1)}% del total
                    </p>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-xs text-muted-foreground text-center py-4">
              Sin ventas en el período
            </p>
          )}
        </div>

        {/* Sales table */}
        <div className="space-y-2">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
            Detalle de Ventas ({numSales})
          </p>
          <div className="overflow-x-auto">
            <table className="w-full text-xs border-collapse min-w-[520px]">
              <thead>
                <tr className="bg-primary text-primary-foreground">
                  <th className="border border-border/40 p-1.5 text-left">
                    No.Ctrl
                  </th>
                  <th className="border border-border/40 p-1.5 text-left">
                    Fecha
                  </th>
                  <th className="border border-border/40 p-1.5 text-left">
                    PV
                  </th>
                  <th className="border border-border/40 p-1.5 text-left">
                    Cliente
                  </th>
                  <th className="border border-border/40 p-1.5 text-right">
                    Total
                  </th>
                  <th className="border border-border/40 p-1.5 text-left">
                    Pago
                  </th>
                </tr>
              </thead>
              <tbody>
                {filtered
                  .slice()
                  .sort((a, b) => Number(b.date) - Number(a.date))
                  .map((s, idx) => {
                    const meta = getSaleMeta(String(s.id));
                    const ctrl = meta?.ctrlNum
                      ? String(meta.ctrlNum).padStart(4, "0")
                      : "—";
                    return (
                      <tr
                        key={String(s.id)}
                        className={
                          idx % 2 === 0 ? "bg-background" : "bg-muted/30"
                        }
                        data-ocid={`reportes-pv.ventas.item.${idx + 1}`}
                      >
                        <td className="border border-border/30 p-1.5 font-mono">
                          {ctrl}
                        </td>
                        <td className="border border-border/30 p-1.5">
                          {isoDate(s.date)}
                        </td>
                        <td className="border border-border/30 p-1.5">
                          {meta?.puntoVentaName ?? "—"}
                        </td>
                        <td className="border border-border/30 p-1.5">
                          {getCustomerName(s.customerId, customers)}
                        </td>
                        <td className="border border-border/30 p-1.5 text-right font-semibold">
                          {currSymbol}
                          {formatPrice(s.totalAmount)}
                        </td>
                        <td className="border border-border/30 p-1.5">
                          {getPaymentName(s.paymentTypeId, paymentTypes)}
                        </td>
                      </tr>
                    );
                  })}
                {filtered.length === 0 && (
                  <tr>
                    <td
                      colSpan={6}
                      className="text-center text-muted-foreground p-4"
                      data-ocid="reportes-pv.ventas.empty_state"
                    >
                      Sin ventas en el período seleccionado
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Sub-screen 2: Ventas por Productos PV ────────────────────────────────────

function VentasPorProductosPVScreen({ onClose }: { onClose: () => void }) {
  const currSymbol = getCurrencySymbol();
  const { data: sales = [] } = useSales();
  const { data: customers = [] } = useCustomers();
  const { data: paymentTypes = [] } = usePaymentTypes();
  const { data: products = [] } = useProducts();

  const [selectedPvId, setSelectedPvId] = useState("");
  const [dateMode, setDateMode] = useState<"range" | "single">("range");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [singleDate, setSingleDate] = useState("");
  const [expandedProduct, setExpandedProduct] = useState<string | null>(null);

  const pvInventory = useMemo(() => getPVInventory(), []);

  const filtered = useMemo(
    () =>
      filterSales(sales, selectedPvId, dateMode, dateFrom, dateTo, singleDate),
    [sales, selectedPvId, dateMode, dateFrom, dateTo, singleDate],
  );

  // Aggregate by product
  const productStats = useMemo(() => {
    const map = new Map<
      string,
      {
        productId: string;
        name: string;
        code: string;
        qty: number;
        revenue: number;
        paymentBreakdown: Map<string, { count: number; total: number }>;
        customerSet: Set<string>;
      }
    >();

    for (const s of filtered) {
      for (const item of s.items) {
        const pid = String(item.productId);
        const productName = getProductName(item.productId, products);
        const pvItem = pvInventory.find((pv) => {
          const prod = products.find((p) => String(p.id) === pid);
          return prod && pv.productCode === prod.barcode;
        });
        const code =
          pvItem?.productCode ??
          products.find((p) => String(p.id) === pid)?.barcode ??
          pid;

        // For uncatalogued products (productId=0), use itemNames from sale meta
        const meta = getSaleMeta(String(s.id));
        const displayName =
          productName === pid || productName === "0"
            ? (meta?.itemNames?.[code] ?? productName)
            : productName;

        const existing = map.get(pid) ?? {
          productId: pid,
          name: displayName,
          code,
          qty: 0,
          revenue: 0,
          paymentBreakdown: new Map(),
          customerSet: new Set(),
        };

        existing.qty += Number(item.quantity);
        existing.revenue += Number(item.unitPrice) * Number(item.quantity);

        const payName = getPaymentName(s.paymentTypeId, paymentTypes);
        const pb = existing.paymentBreakdown.get(payName) ?? {
          count: 0,
          total: 0,
        };
        existing.paymentBreakdown.set(payName, {
          count: pb.count + 1,
          total: pb.total + Number(item.unitPrice) * Number(item.quantity),
        });

        const custName = getCustomerName(s.customerId, customers);
        existing.customerSet.add(custName);

        map.set(pid, existing);
      }
    }

    return Array.from(map.values()).sort((a, b) => b.qty - a.qty);
  }, [filtered, products, pvInventory, paymentTypes, customers]);

  const mostSold = productStats[0];
  const leastSold = productStats[productStats.length - 1];
  const totalQty = productStats.reduce((acc, p) => acc + p.qty, 0);

  const pvName = selectedPvId
    ? (getPuntosVenta().find((p) => p.id === selectedPvId)?.name ??
      selectedPvId)
    : "Todos los PVs";

  const periodLabel =
    dateMode === "single" && singleDate
      ? singleDate
      : [dateFrom, dateTo].filter(Boolean).join(" — ") || "Todos los períodos";

  const handleExportCSV = () => {
    const header =
      "Código,Producto,Cantidad Vendida,Importe Total,Clientes Únicos";
    const rows = productStats.map((p) => {
      return `${p.code},"${p.name}",${p.qty},${formatPrice(p.revenue)},${p.customerSet.size}`;
    });
    exportCSV([header, ...rows].join("\n"), `VentasProductosPV_${pvName}.csv`);
  };

  const handleExportXLSX = () => {
    const header =
      "Código\tProducto\tCantidad Vendida\tImporte Total\tClientes Únicos";
    const rows = productStats.map((p) => {
      return `${p.code}\t${p.name}\t${p.qty}\t${formatPrice(p.revenue)}\t${p.customerSet.size}`;
    });
    exportXLSX(
      [header, ...rows].join("\n"),
      `VentasProductosPV_${pvName}.xlsx`,
    );
  };

  const handleExportPDF = () => {
    const htmlHeader = buildHtmlHeader();
    const productRows = productStats
      .map(
        (p) =>
          `<tr><td>${p.code}</td><td>${p.name}</td><td>${p.qty}</td><td>${currSymbol}${formatPrice(p.revenue)}</td><td>${p.customerSet.size}</td></tr>`,
      )
      .join("");

    const html = `<html><head><title>Ventas por Productos PV</title>
<style>body{font-family:sans-serif;padding:20px;color:#1a1a1a}h2{color:#0B2040}.header{margin-bottom:16px;padding:12px;background:#f5f5f5;border-radius:6px}.total-box{text-align:center;background:#0B2040;color:white;border-radius:10px;padding:20px;margin:16px 0}.total-box .amount{font-size:2.5rem;font-weight:bold}.stats{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin:16px 0}.stat{background:#f5f5f5;border-radius:8px;padding:12px}.stat .label{font-size:11px;color:#666;margin-bottom:4px}.stat .value{font-size:1.1rem;font-weight:bold}table{width:100%;border-collapse:collapse;margin-top:12px}th,td{border:1px solid #ddd;padding:8px;text-align:left;font-size:13px}th{background:#0B2040;color:white}h3{color:#0B2040;margin-top:20px}</style></head>
<body><div class="header">${htmlHeader}</div>
<h2>Ventas por Productos — ${pvName}</h2>
<p style="font-size:12px;color:#666">Período: ${periodLabel}</p>
<div class="total-box"><div style="font-size:13px;opacity:0.8;margin-bottom:6px">Total Unidades Vendidas</div><div class="amount">${totalQty}</div></div>
<div class="stats">
  <div class="stat"><div class="label">Más vendido</div><div class="value">${mostSold?.name ?? "—"} (${mostSold?.qty ?? 0} uds.)</div></div>
  <div class="stat"><div class="label">Menos vendido</div><div class="value">${leastSold?.name ?? "—"} (${leastSold?.qty ?? 0} uds.)</div></div>
</div>
<h3>Detalle por Producto</h3>
<table><thead><tr><th>Código</th><th>Producto</th><th>Cantidad</th><th>Importe</th><th>Clientes</th></tr></thead><tbody>${productRows || "<tr><td colspan='5'>Sin datos</td></tr>"}</tbody></table>
</body></html>`;
    const win = window.open("", "_blank");
    if (win) {
      win.document.write(html);
      win.document.close();
      win.print();
    }
  };

  return (
    <div
      className="h-full flex flex-col"
      data-ocid="reportes-pv.ventas-productos.panel"
    >
      <SubScreenHeader
        title="Ventas por Productos PV"
        onBack={onClose}
        onExportCSV={handleExportCSV}
        onExportPDF={handleExportPDF}
        onExportXLSX={handleExportXLSX}
      />
      <div
        className="flex-1 overflow-y-auto px-4 pb-6 pt-4 space-y-4"
        style={{ overflowY: "auto" }}
      >
        <FilterBar
          selectedPvId={selectedPvId}
          setSelectedPvId={setSelectedPvId}
          dateMode={dateMode}
          setDateMode={setDateMode}
          dateFrom={dateFrom}
          setDateFrom={setDateFrom}
          dateTo={dateTo}
          setDateTo={setDateTo}
          singleDate={singleDate}
          setSingleDate={setSingleDate}
        />

        {/* Summary */}
        <div className="bg-navy rounded-2xl py-5 text-center">
          <p className="text-white/70 text-xs mb-1">Total Unidades Vendidas</p>
          <p className="text-white text-3xl font-bold">{totalQty}</p>
          <p className="text-white/60 text-xs mt-1">{pvName}</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-2">
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
              <TrendingDown size={10} className="text-red-500" /> Menos vendido
            </p>
            <p className="text-sm font-bold text-red-500 truncate">
              {leastSold?.name ?? "—"}
            </p>
            <p className="text-xs text-muted-foreground">
              {leastSold?.qty ?? 0} uds.
            </p>
          </div>
        </div>

        {/* Product table with collapsible details */}
        <div className="space-y-2">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
            Detalle por Producto ({productStats.length})
          </p>
          {productStats.length === 0 ? (
            <div
              className="text-center text-muted-foreground text-xs py-6"
              data-ocid="reportes-pv.ventas-productos.empty_state"
            >
              Sin productos vendidos en el período seleccionado
            </div>
          ) : (
            <div className="space-y-2">
              {productStats.map((p, idx) => (
                <div
                  key={p.productId}
                  className="bg-card border border-border rounded-xl overflow-hidden"
                  data-ocid={`reportes-pv.productos.item.${idx + 1}`}
                >
                  <button
                    type="button"
                    className="w-full px-3 py-2.5 flex items-center justify-between text-left"
                    onClick={() =>
                      setExpandedProduct(
                        expandedProduct === p.productId ? null : p.productId,
                      )
                    }
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground font-mono">
                          {p.code}
                        </span>
                        <span className="text-sm font-medium truncate">
                          {p.name}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 mt-0.5">
                        <span className="text-xs text-muted-foreground">
                          {p.qty} uds.
                        </span>
                        <span className="text-xs font-semibold text-teal">
                          {currSymbol}
                          {formatPrice(p.revenue)}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {p.customerSet.size} cliente(s)
                        </span>
                      </div>
                    </div>
                    <span className="text-muted-foreground text-xs ml-2">
                      {expandedProduct === p.productId ? "▲" : "▼"}
                    </span>
                  </button>

                  {expandedProduct === p.productId && (
                    <div className="border-t border-border px-3 py-2 space-y-2 bg-muted/20">
                      {/* Payment breakdown */}
                      <div>
                        <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide mb-1">
                          Por tipo de pago
                        </p>
                        <div className="space-y-1">
                          {Array.from(p.paymentBreakdown.entries()).map(
                            ([payName, { count, total }]) => (
                              <div
                                key={payName}
                                className="flex items-center justify-between text-xs"
                              >
                                <span className="text-muted-foreground">
                                  {payName} ({count})
                                </span>
                                <span className="font-medium">
                                  {currSymbol}
                                  {formatPrice(total)}
                                </span>
                              </div>
                            ),
                          )}
                        </div>
                      </div>

                      {/* Customers */}
                      <div>
                        <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide mb-1">
                          Clientes
                        </p>
                        <div className="flex flex-wrap gap-1">
                          {Array.from(p.customerSet).map((name) => (
                            <span
                              key={name}
                              className="text-[10px] bg-muted px-1.5 py-0.5 rounded-full text-muted-foreground"
                            >
                              {name}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Sub-screen 3: IPV PV ─────────────────────────────────────────────────────

function IPVPVScreen({ onClose }: { onClose: () => void }) {
  const { data: sales = [] } = useSales();
  const { data: products = [] } = useProducts();

  const [selectedPvId, setSelectedPvId] = useState("");
  const [dateMode, setDateMode] = useState<"range" | "single">("range");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [singleDate, setSingleDate] = useState("");

  const allEntradas = useMemo(() => getEntradas(), []);
  const allSalidas = useMemo(() => getSalidas(), []);
  const tiposSalida = useMemo(() => getTiposSalida(), []);
  const pvInventory = useMemo(() => getPVInventory(), []);

  // Filter PV inventory by selected PV
  const filteredPVItems = useMemo(() => {
    if (selectedPvId) {
      return pvInventory.filter((item) => item.pvId === selectedPvId);
    }
    return pvInventory;
  }, [pvInventory, selectedPvId]);

  // Filter entradas relevant to selected PV
  const filteredEntradas = useMemo(() => {
    let result = allEntradas.filter((e) => e.destinoTipo === "puntoVenta");
    if (selectedPvId) {
      result = result.filter((e) => e.destinoId === selectedPvId);
    }
    // Apply date filter
    if (dateMode === "single" && singleDate) {
      result = result.filter((e) => msToIso(e.date) === singleDate);
    } else {
      if (dateFrom)
        result = result.filter((e) => e.date >= new Date(dateFrom).getTime());
      if (dateTo)
        result = result.filter(
          (e) => e.date <= new Date(dateTo).getTime() + 86400000,
        );
    }
    return result;
  }, [allEntradas, selectedPvId, dateMode, dateFrom, dateTo, singleDate]);

  // Filter salidas relevant to selected PV
  const filteredSalidas = useMemo(() => {
    let result = allSalidas.filter(
      (s) => s.destinoTipo === "puntoVenta" || s.destinoTipo === undefined,
    );
    if (selectedPvId) {
      result = result.filter(
        (s) => s.destinoId === selectedPvId || !s.destinoId,
      );
    }
    if (dateMode === "single" && singleDate) {
      result = result.filter((s) => msToIso(s.date) === singleDate);
    } else {
      if (dateFrom)
        result = result.filter((s) => s.date >= new Date(dateFrom).getTime());
      if (dateTo)
        result = result.filter(
          (s) => s.date <= new Date(dateTo).getTime() + 86400000,
        );
    }
    return result;
  }, [allSalidas, selectedPvId, dateMode, dateFrom, dateTo, singleDate]);

  // Filter sales by PV + date
  const filteredSales = useMemo(
    () =>
      filterSales(sales, selectedPvId, dateMode, dateFrom, dateTo, singleDate),
    [sales, selectedPvId, dateMode, dateFrom, dateTo, singleDate],
  );

  const fmt = (n: number) => n.toFixed(2);
  const imp = (precio: number, qty: number) => fmt(precio * qty);

  // Build IPV rows
  const rows = useMemo(() => {
    return filteredPVItems.map((pvItem) => {
      const precio = pvItem.price / 100;
      const code = pvItem.productCode;

      // Entradas: sum of items matching this product code going to this PV
      const entradas = filteredEntradas
        .filter((e) => !selectedPvId || e.destinoId === pvItem.pvId)
        .flatMap((e) => e.items)
        .filter(
          (i) =>
            i.productName === pvItem.productName ||
            String(i.productId) === code,
        )
        .reduce((acc, i) => acc + i.quantity, 0);

      // Ventas: sum from sales items matching this product
      const matchProduct = products.find(
        (p) => p.barcode === code || p.name === pvItem.productName,
      );
      const ventas = filteredSales
        .flatMap((s) => s.items)
        .filter(
          (item) =>
            matchProduct && String(item.productId) === String(matchProduct.id),
        )
        .reduce((acc, item) => acc + Number(item.quantity), 0);

      // Salidas by type
      const salidaPorTipo: Record<string, number> = {};
      for (const tipo of tiposSalida) {
        salidaPorTipo[tipo.name] = filteredSalidas
          .filter((s) => s.tipoSalidaNombre === tipo.name)
          .flatMap((s) => s.items)
          .filter(
            (i) =>
              i.productName === pvItem.productName ||
              String(i.productId) === code,
          )
          .reduce((acc, i) => acc + i.quantity, 0);
      }
      const totalSalidas = Object.values(salidaPorTipo).reduce(
        (a, b) => a + b,
        0,
      );

      const stockFinal = pvItem.stock;
      const stockInicial = stockFinal - entradas + ventas + totalSalidas;
      const disponible = stockInicial + entradas;

      return {
        codigo: code,
        descripcion: pvItem.productName,
        pv: pvItem.pvName,
        precioVenta: precio,
        stockInicial,
        entradas,
        disponible,
        ventas,
        salidaPorTipo,
        totalSalidas,
        stockFinal,
      };
    });
  }, [
    filteredPVItems,
    filteredEntradas,
    filteredSalidas,
    filteredSales,
    products,
    tiposSalida,
    selectedPvId,
  ]);

  // Movements log
  const movementsLog = useMemo(() => {
    const entries: {
      fecha: string;
      tipo: string;
      producto: string;
      cantidad: number;
      destino: string;
    }[] = [];

    for (const e of filteredEntradas) {
      for (const item of e.items) {
        entries.push({
          fecha: msToIso(e.date),
          tipo: "Entrada",
          producto: item.productName,
          cantidad: item.quantity,
          destino: e.destinoNombre ?? "—",
        });
      }
    }

    for (const s of filteredSalidas) {
      for (const item of s.items) {
        entries.push({
          fecha: msToIso(s.date),
          tipo: `Salida (${s.tipoSalidaNombre})`,
          producto: item.productName,
          cantidad: item.quantity,
          destino: s.destinoNombre ?? s.motivo ?? "—",
        });
      }
    }

    for (const s of filteredSales) {
      const meta = getSaleMeta(String(s.id));
      for (const item of s.items) {
        const prod = products.find(
          (p) => String(p.id) === String(item.productId),
        );
        entries.push({
          fecha: isoDate(s.date),
          tipo: "Venta",
          producto: prod?.name ?? String(item.productId),
          cantidad: Number(item.quantity),
          destino: meta?.puntoVentaName ?? "—",
        });
      }
    }

    return entries.sort((a, b) => b.fecha.localeCompare(a.fecha));
  }, [filteredEntradas, filteredSalidas, filteredSales, products]);

  const pvName = selectedPvId
    ? (getPuntosVenta().find((p) => p.id === selectedPvId)?.name ??
      selectedPvId)
    : "Todos los PVs";

  const handleExportCSV = () => {
    const fileHeader = buildFileHeader();
    const tiposCols = tiposSalida.flatMap((t) => [t.name, `Imp.${t.name}`]);
    const header = [
      "Código",
      "Descripción",
      "PV",
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
        `"${r.pv}"`,
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
    exportCSV(
      `# ${fileHeader}\n\n${[header, ...dataRows].join("\n")}`,
      `IPV_PV_${pvName}.csv`,
    );
  };

  const handleExportXLSX = () => {
    const tiposCols = tiposSalida.flatMap((t) => [t.name, `Imp.${t.name}`]);
    const header = [
      "Código",
      "Descripción",
      "PV",
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
    ].join("\t");
    const dataRows = rows.map((r) => {
      const tiposVals = tiposSalida.flatMap((t) => {
        const qty = r.salidaPorTipo[t.name] ?? 0;
        return [qty, imp(r.precioVenta, qty)];
      });
      return [
        r.codigo,
        r.descripcion,
        r.pv,
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
      ].join("\t");
    });
    exportXLSX([header, ...dataRows].join("\n"), `IPV_PV_${pvName}.xlsx`);
  };

  const handleExportPDF = () => {
    const htmlHeader = buildHtmlHeader();
    const tiposHeaders = tiposSalida
      .map((t) => `<th>${t.name}</th><th>Importe</th>`)
      .join("");
    const tiposRowsFn = (row: (typeof rows)[0]) =>
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
        <td>${r.pv}</td>
        <td>${fmt(r.precioVenta)}</td>
        <td>${r.stockInicial}</td><td>${imp(r.precioVenta, r.stockInicial)}</td>
        <td>${r.entradas}</td><td>${imp(r.precioVenta, r.entradas)}</td>
        <td>${r.disponible}</td><td>${imp(r.precioVenta, r.disponible)}</td>
        <td>${r.ventas}</td><td>${imp(r.precioVenta, r.ventas)}</td>
        ${tiposRowsFn(r)}
        <td>${r.stockFinal}</td><td>${imp(r.precioVenta, r.stockFinal)}</td>
      </tr>`,
      )
      .join("");

    const logRows = movementsLog
      .slice(0, 200)
      .map(
        (m) =>
          `<tr><td>${m.fecha}</td><td>${m.tipo}</td><td>${m.producto}</td><td>${m.cantidad}</td><td>${m.destino}</td></tr>`,
      )
      .join("");

    const html = `<html><head><title>IPV PV</title><style>body{font-family:sans-serif;font-size:10px;padding:16px}table{width:100%;border-collapse:collapse;margin-bottom:20px}th,td{border:1px solid #ddd;padding:4px;text-align:right}th{background:#0B2040;color:white}td:nth-child(1),td:nth-child(2),td:nth-child(3){text-align:left}.header{margin-bottom:12px;padding:8px;background:#f5f5f5}h2,h3{color:#0B2040}</style></head>
<body><div class="header">${htmlHeader}</div>
<h2>IPV PV — ${pvName}</h2>
<table><thead><tr><th>Código</th><th>Descripción</th><th>PV</th><th>P.Venta</th><th>Stk.Ini</th><th>Importe</th><th>Entradas</th><th>Importe</th><th>Disponible</th><th>Importe</th><th>Ventas</th><th>Importe</th>${tiposHeaders}<th>Stk.Final</th><th>Importe</th></tr></thead><tbody>${rowsHtml || "<tr><td colspan='14'>Sin datos</td></tr>"}</tbody></table>
<h3>Registro de Movimientos</h3>
<table><thead><tr><th style='text-align:left'>Fecha</th><th style='text-align:left'>Tipo</th><th style='text-align:left'>Producto</th><th>Cantidad</th><th style='text-align:left'>Destino/Origen</th></tr></thead><tbody>${logRows || "<tr><td colspan='5'>Sin movimientos</td></tr>"}</tbody></table>
</body></html>`;
    const win = window.open("", "_blank");
    if (win) {
      win.document.write(html);
      win.document.close();
      win.print();
    }
  };

  return (
    <div className="h-full flex flex-col" data-ocid="reportes-pv.ipv.panel">
      <SubScreenHeader
        title="IPV PV"
        onBack={onClose}
        onExportCSV={handleExportCSV}
        onExportPDF={handleExportPDF}
        onExportXLSX={handleExportXLSX}
      />
      <div
        className="flex-1 overflow-y-auto px-3 pb-6 pt-2 space-y-4"
        style={{ overflowY: "auto" }}
      >
        <FilterBar
          selectedPvId={selectedPvId}
          setSelectedPvId={setSelectedPvId}
          dateMode={dateMode}
          setDateMode={setDateMode}
          dateFrom={dateFrom}
          setDateFrom={setDateFrom}
          dateTo={dateTo}
          setDateTo={setDateTo}
          singleDate={singleDate}
          setSingleDate={setSingleDate}
        />

        <p className="text-xs text-muted-foreground">
          Inventario Permanente Valorado — Punto de Venta: {pvName}
        </p>

        {/* IPV Table */}
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
                <th className="border border-border/40 p-1.5 text-left">PV</th>
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
                  key={r.codigo + r.pv}
                  className={idx % 2 === 0 ? "bg-background" : "bg-muted/30"}
                  data-ocid={`reportes-pv.ipv.item.${idx + 1}`}
                >
                  <td className="border border-border/30 p-1.5">{r.codigo}</td>
                  <td className="border border-border/30 p-1.5">
                    {r.descripcion}
                  </td>
                  <td className="border border-border/30 p-1.5">{r.pv}</td>
                  <td className="border border-border/30 p-1.5 text-right">
                    {fmt(r.precioVenta)}
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
                    colSpan={12 + tiposSalida.length * 2}
                    className="text-center text-muted-foreground p-4"
                    data-ocid="reportes-pv.ipv.empty_state"
                  >
                    Sin productos en Inventario PV para los filtros
                    seleccionados
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Movements Log */}
        <div className="space-y-2">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
            Registro de Movimientos ({movementsLog.length})
          </p>
          <div className="overflow-x-auto">
            <table className="w-full text-xs border-collapse min-w-[500px]">
              <thead>
                <tr className="bg-muted">
                  <th className="border border-border/40 p-1.5 text-left">
                    Fecha
                  </th>
                  <th className="border border-border/40 p-1.5 text-left">
                    Tipo
                  </th>
                  <th className="border border-border/40 p-1.5 text-left">
                    Producto
                  </th>
                  <th className="border border-border/40 p-1.5 text-right">
                    Cantidad
                  </th>
                  <th className="border border-border/40 p-1.5 text-left">
                    Destino/Origen
                  </th>
                </tr>
              </thead>
              <tbody>
                {movementsLog.map((m, idx) => (
                  <tr
                    key={`${m.fecha}-${m.tipo}-${idx}`}
                    className={idx % 2 === 0 ? "bg-background" : "bg-muted/30"}
                    data-ocid={`reportes-pv.movimientos.item.${idx + 1}`}
                  >
                    <td className="border border-border/30 p-1.5">{m.fecha}</td>
                    <td className="border border-border/30 p-1.5">
                      <span
                        className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${
                          m.tipo === "Entrada"
                            ? "bg-green-100 text-green-700"
                            : m.tipo === "Venta"
                              ? "bg-blue-100 text-blue-700"
                              : "bg-orange-100 text-orange-700"
                        }`}
                      >
                        {m.tipo}
                      </span>
                    </td>
                    <td className="border border-border/30 p-1.5">
                      {m.producto}
                    </td>
                    <td className="border border-border/30 p-1.5 text-right font-semibold">
                      {m.cantidad}
                    </td>
                    <td className="border border-border/30 p-1.5">
                      {m.destino}
                    </td>
                  </tr>
                ))}
                {movementsLog.length === 0 && (
                  <tr>
                    <td
                      colSpan={5}
                      className="text-center text-muted-foreground p-4"
                    >
                      Sin movimientos en el período
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Main ReportesPV screen ───────────────────────────────────────────────────

type ReportView = null | "total-ventas" | "ventas-productos" | "ipv";

export default function ReportesPV() {
  const [activeView, setActiveView] = useState<ReportView>(null);

  if (activeView === "total-ventas") {
    return <TotalVentasPVScreen onClose={() => setActiveView(null)} />;
  }
  if (activeView === "ventas-productos") {
    return <VentasPorProductosPVScreen onClose={() => setActiveView(null)} />;
  }
  if (activeView === "ipv") {
    return <IPVPVScreen onClose={() => setActiveView(null)} />;
  }

  const cards = [
    {
      id: "total-ventas" as const,
      label: "Total de Ventas",
      desc: "Mayor, promedio y mínima. Gráficos y desglose por tipo de pago.",
      icon: <TrendingUp size={22} className="text-teal" />,
      color: "border-teal/40 hover:bg-teal/5",
      textColor: "text-teal",
    },
    {
      id: "ventas-productos" as const,
      label: "Ventas por Productos",
      desc: "Más y menos vendidos, desglose por pago y clientes con gráfico.",
      icon: <Package size={22} className="text-blue-500" />,
      color: "border-blue-400/40 hover:bg-blue-500/5",
      textColor: "text-blue-500",
    },
    {
      id: "ipv" as const,
      label: "IPV",
      desc: "Inventario Permanente Valorado del punto de venta. Todos los movimientos.",
      icon: <BarChart2 size={22} className="text-purple-500" />,
      color: "border-purple-400/40 hover:bg-purple-500/5",
      textColor: "text-purple-500",
    },
  ];

  return (
    <div
      className="h-full overflow-y-auto px-4 pb-6 pt-4"
      style={{ overflowY: "auto" }}
      data-ocid="reportes-pv.section"
    >
      <div className="flex items-center gap-2 mb-1">
        <Store size={16} className="text-teal" />
        <p className="text-sm font-semibold text-foreground">Reportes PV</p>
      </div>
      <p className="text-xs text-muted-foreground mb-5">
        Reportes del Punto de Venta con filtros por fecha y PV
      </p>
      <div className="space-y-3">
        {cards.map((card) => (
          <button
            key={card.id}
            type="button"
            onClick={() => setActiveView(card.id)}
            className={`w-full bg-card border rounded-xl p-4 flex items-start gap-3 text-left transition-colors active:scale-[0.98] ${card.color}`}
            data-ocid={`reportes-pv.${card.id}.button`}
          >
            <div className="mt-0.5 shrink-0">{card.icon}</div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-foreground mb-0.5">
                {card.label}
              </p>
              <p className="text-xs text-muted-foreground leading-relaxed">
                {card.desc}
              </p>
              <p className={`text-xs mt-1.5 font-medium ${card.textColor}`}>
                Ver reporte →
              </p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
