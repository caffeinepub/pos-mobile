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
  ArrowLeft,
  FileDown,
  FileText,
  MoreVertical,
  Plus,
  Search,
  Trash2,
  User,
  UserPlus,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import type { Customer, Product } from "../backend.d";
import { useCustomers, useProducts } from "../hooks/useQueries";
import { getBusinessData } from "../utils/businessData";

// ── Storage helpers ──────────────────────────────────────────────────────────
const EXTRAS_KEY = "pos_customer_extras";
interface CustomerExtras {
  nit: string;
  codigo: string;
  direccion: string;
  provincia: string;
  pais: string;
  [key: string]: string;
}
function getCustomerExtras(id: string): CustomerExtras {
  try {
    const all = JSON.parse(localStorage.getItem(EXTRAS_KEY) ?? "{}");
    return (
      all[id] ?? {
        nit: "",
        codigo: "",
        direccion: "",
        provincia: "",
        pais: "",
      }
    );
  } catch {
    return { nit: "", codigo: "", direccion: "", provincia: "", pais: "" };
  }
}

function getProductMeta(id: bigint): { unit: string } {
  try {
    const raw = localStorage.getItem(`product-meta-${String(id)}`);
    if (raw) return JSON.parse(raw);
  } catch {}
  return { unit: "Unidad" };
}

const FACTURAS_KEY = "pos_facturas";
const COUNTER_KEY = "pos_factura_counter";

export interface FacturaCliente {
  nombre: string;
  nit: string;
  direccion: string;
  telefono: string;
}

export interface FacturaItem {
  productoId: string;
  nombre: string;
  cantidad: number;
  precioUnitario: number;
  subtotal: number;
}

export interface Factura {
  id: string;
  numero: string;
  fecha: string;
  cliente: FacturaCliente;
  items: FacturaItem[];
  subtotal: number;
  impuesto: number;
  total: number;
  createdAt: string;
}

function loadFacturas(): Factura[] {
  try {
    return JSON.parse(localStorage.getItem(FACTURAS_KEY) ?? "[]");
  } catch {
    return [];
  }
}

function saveFacturas(list: Factura[]) {
  localStorage.setItem(FACTURAS_KEY, JSON.stringify(list));
}

function nextNumero(): string {
  const counter = Number(localStorage.getItem(COUNTER_KEY) ?? "0") + 1;
  localStorage.setItem(COUNTER_KEY, String(counter));
  return `FAC-${String(counter).padStart(4, "0")}`;
}

function formatDate(d: string) {
  const [y, m, day] = d.split("-");
  return `${day}/${m}/${y}`;
}

function formatPrice(n: number) {
  return n.toFixed(2);
}

// ── Detail View ──────────────────────────────────────────────────────────────
function FacturaDetail({
  factura,
  onBack,
}: {
  factura: Factura;
  onBack: () => void;
}) {
  const exportPDF = () => {
    const biz = getBusinessData();
    const supplierHtml = `<b>${biz.nombre || "Proveedor"}</b>${biz.nit ? `<br>NIT: ${biz.nit}` : ""}${biz.direccion ? `<br>${biz.direccion}` : ""}${biz.telefono ? `<br>Tel: ${biz.telefono}` : ""}${biz.cuentasBancarias && biz.cuentasBancarias.length > 0 ? biz.cuentasBancarias.map((c, i) => `<br>Cta ${i + 1}: ${c}`).join("") : ""}`;
    const clientHtml = `<b>${factura.cliente.nombre}</b><br>NIT: ${factura.cliente.nit}${factura.cliente.direccion ? `<br>${factura.cliente.direccion}` : ""}${factura.cliente.telefono ? `<br>Tel: ${factura.cliente.telefono}` : ""}`;
    const rows = factura.items
      .map(
        (it) =>
          `<tr><td>${it.nombre}</td><td style="text-align:center">${it.cantidad}</td><td style="text-align:right">$${formatPrice(it.precioUnitario)}</td><td style="text-align:right">$${formatPrice(it.subtotal)}</td></tr>`,
      )
      .join("");
    const html = `<html><head><title>Factura ${factura.numero}</title><style>
body{font-family:sans-serif;padding:24px;max-width:700px;margin:0 auto}
.header{border-bottom:2px solid #0B2040;padding-bottom:12px;margin-bottom:16px}
.title{font-size:24px;font-weight:bold;color:#0B2040}
.num{font-size:14px;color:#666}
.parties{display:flex;gap:16px;margin-bottom:16px}
.party-box{flex:1;background:#f8f9fa;border-radius:8px;padding:12px;font-size:13px}
.party-label{font-size:11px;text-transform:uppercase;color:#888;margin-bottom:6px;font-weight:bold}
table{width:100%;border-collapse:collapse;margin-bottom:16px}
th{background:#0B2040;color:white;padding:8px;text-align:left}
td{border:1px solid #ddd;padding:8px}
.totals{text-align:right}
.total-row{font-weight:bold;font-size:18px;color:#0B2040}
.sig-section{margin-top:32px;display:flex;gap:40px;border-top:1px solid #ddd;padding-top:20px}
.sig-box{flex:1}
.sig-label{font-size:11px;text-transform:uppercase;color:#888;font-weight:bold;margin-bottom:12px}
.sig-field{margin-bottom:16px}
.sig-field-label{font-size:11px;color:#888;margin-bottom:2px}
.sig-line{border-bottom:1px solid #333;height:24px;margin-bottom:2px}
.sig-name{font-size:13px;font-weight:bold}
.footer{margin-top:24px;border-top:1px solid #ddd;padding-top:12px;font-size:12px;color:#888;text-align:center}
</style></head><body>
<div class="header"><div class="title">FACTURA</div><div class="num"><b>Número:</b> ${factura.numero} &nbsp;&nbsp; <b>Fecha:</b> ${formatDate(factura.fecha)}</div></div>
<div class="parties">
  <div class="party-box"><div class="party-label">Proveedor</div>${supplierHtml}</div>
  <div class="party-box"><div class="party-label">Cliente</div>${clientHtml}</div>
</div>
<table><thead><tr><th>Descripción</th><th style="text-align:center">Cant.</th><th style="text-align:right">P. Unit.</th><th style="text-align:right">Subtotal</th></tr></thead><tbody>${rows}</tbody></table>
<div class="totals"><p>Subtotal: $${formatPrice(factura.subtotal)}</p>${factura.impuesto > 0 ? `<p>Impuesto (${factura.impuesto}%): $${formatPrice((factura.subtotal * factura.impuesto) / 100)}</p>` : ""}<p class="total-row">TOTAL: $${formatPrice(factura.total)}</p></div>
<div class="sig-section">
  <div class="sig-box">
    <div class="sig-label">Proveedor</div>
    <div class="sig-field"><div class="sig-field-label">Nombre:</div><div class="sig-name">${biz.nombre || ""}</div></div>
    <div class="sig-field"><div class="sig-field-label">Firma:</div><div class="sig-line"></div></div>
    <div class="sig-field"><div class="sig-field-label">Fecha:</div><div class="sig-line"></div></div>
  </div>
  <div class="sig-box">
    <div class="sig-label">Cliente</div>
    <div class="sig-field"><div class="sig-field-label">Nombre:</div><div class="sig-name">${factura.cliente.nombre}</div></div>
    <div class="sig-field"><div class="sig-field-label">Firma:</div><div class="sig-line"></div></div>
    <div class="sig-field"><div class="sig-field-label">Fecha:</div><div class="sig-line"></div></div>
  </div>
</div>
<div class="footer">Documento generado por POS Mobile</div>
</body></html>`;
    const win = window.open("", "_blank");
    if (win) {
      win.document.write(html);
      win.document.close();
      win.print();
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-3 px-4 py-3 border-b shrink-0 bg-background">
        <button
          type="button"
          onClick={onBack}
          className="p-1.5 rounded-lg text-muted-foreground hover:bg-muted transition-colors"
          data-ocid="factura_detail.close_button"
        >
          <ArrowLeft size={20} />
        </button>
        <h3 className="font-semibold text-base flex-1">{factura.numero}</h3>
        <button
          type="button"
          onClick={exportPDF}
          className="p-1.5 rounded-lg text-muted-foreground hover:bg-muted transition-colors"
          data-ocid="factura_detail.export_pdf_button"
          title="Exportar PDF"
        >
          <FileDown size={18} />
        </button>
      </div>
      <ScrollArea className="flex-1">
        <div className="px-5 py-4 space-y-4">
          {/* Supplier + Client side by side */}
          {(() => {
            const biz = getBusinessData();
            return (
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-card border border-border rounded-xl p-3 space-y-1">
                  <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">
                    Proveedor
                  </p>
                  {biz.nombre ? (
                    <p className="font-semibold text-sm">{biz.nombre}</p>
                  ) : (
                    <p className="text-sm text-muted-foreground italic">
                      Sin configurar
                    </p>
                  )}
                  {biz.nit && (
                    <p className="text-xs text-muted-foreground">
                      NIT: {biz.nit}
                    </p>
                  )}
                  {biz.direccion && (
                    <p className="text-xs text-muted-foreground">
                      {biz.direccion}
                    </p>
                  )}
                  {biz.telefono && (
                    <p className="text-xs text-muted-foreground">
                      Tel: {biz.telefono}
                    </p>
                  )}
                  {biz.cuentasBancarias && biz.cuentasBancarias.length > 0 && (
                    <div className="pt-1">
                      {biz.cuentasBancarias.map((c, i) => (
                        <p
                          key={`biz-cuenta-${i}-${c}`}
                          className="text-xs text-muted-foreground"
                        >
                          Cta {i + 1}: {c}
                        </p>
                      ))}
                    </div>
                  )}
                </div>
                <div className="bg-card border border-border rounded-xl p-3 space-y-1">
                  <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">
                    Cliente
                  </p>
                  <p className="font-semibold text-sm">
                    {factura.cliente.nombre}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    NIT: {factura.cliente.nit}
                  </p>
                  {factura.cliente.direccion && (
                    <p className="text-xs text-muted-foreground">
                      {factura.cliente.direccion}
                    </p>
                  )}
                  {factura.cliente.telefono && (
                    <p className="text-xs text-muted-foreground">
                      Tel: {factura.cliente.telefono}
                    </p>
                  )}
                </div>
              </div>
            );
          })()}
          {/* Info */}
          <div className="bg-card border border-border rounded-xl p-4 flex justify-between">
            <div>
              <p className="text-xs text-muted-foreground">Número</p>
              <p className="font-semibold text-sm">{factura.numero}</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-muted-foreground">Fecha</p>
              <p className="font-semibold text-sm">
                {formatDate(factura.fecha)}
              </p>
            </div>
          </div>
          {/* Items */}
          <div className="bg-card border border-border rounded-xl overflow-hidden">
            <div className="px-4 py-3 border-b">
              <p className="font-semibold text-sm">Productos</p>
            </div>
            {factura.items.map((it) => (
              <div
                key={it.productoId + it.nombre}
                className="px-4 py-3 flex items-center justify-between border-b last:border-0"
              >
                <div className="flex-1">
                  <p className="text-sm font-medium">{it.nombre}</p>
                  <p className="text-xs text-muted-foreground">
                    {it.cantidad} x ${formatPrice(it.precioUnitario)}
                  </p>
                </div>
                <p className="font-semibold text-sm">
                  ${formatPrice(it.subtotal)}
                </p>
              </div>
            ))}
          </div>
          {/* Totals */}
          <div className="bg-card border border-border rounded-xl p-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Subtotal</span>
              <span>${formatPrice(factura.subtotal)}</span>
            </div>
            {factura.impuesto > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">
                  Impuesto ({factura.impuesto}%)
                </span>
                <span>
                  ${formatPrice((factura.subtotal * factura.impuesto) / 100)}
                </span>
              </div>
            )}
            <div className="flex justify-between font-bold text-base pt-2 border-t border-border">
              <span>TOTAL</span>
              <span className="text-primary">
                ${formatPrice(factura.total)}
              </span>
            </div>
          </div>
          {/* Signature footer */}
          <div className="grid grid-cols-2 gap-6 pt-4 border-t border-border mt-2">
            {[
              { label: "Proveedor", name: getBusinessData().nombre },
              { label: "Cliente", name: factura.cliente.nombre },
            ].map((party) => (
              <div key={party.label} className="space-y-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  {party.label}
                </p>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">Nombre:</p>
                  <p className="text-sm font-medium">{party.name}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">Firma:</p>
                  <div className="border-b border-foreground/30 h-8" />
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">Fecha:</p>
                  <div className="border-b border-foreground/30 h-5" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </ScrollArea>
    </div>
  );
}

// ── Create Invoice (3-step wizard) ───────────────────────────────────────────
function CreateFactura({
  onBack,
  onSaved,
}: {
  onBack: () => void;
  onSaved: (f: Factura) => void;
}) {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  // Step 1
  const [clientMode, setClientMode] = useState<"search" | "manual">("search");
  const [clientSearch, setClientSearch] = useState("");
  const [selectedClient, setSelectedClient] = useState<FacturaCliente | null>(
    null,
  );
  const [manualClient, setManualClient] = useState<FacturaCliente>({
    nombre: "",
    nit: "",
    direccion: "",
    telefono: "",
  });

  // Step 2
  const [productSearch, setProductSearch] = useState("");
  const [items, setItems] = useState<FacturaItem[]>([]);

  // Step 3
  const [impuesto, setImpuesto] = useState(0);
  const today = new Date().toISOString().slice(0, 10);
  const [fecha, setFecha] = useState(today);

  const { data: customers = [] } = useCustomers();
  const { data: products = [] } = useProducts();

  const filteredCustomers = clientSearch
    ? customers.filter(
        (c) =>
          c.name.toLowerCase().includes(clientSearch.toLowerCase()) ||
          getCustomerExtras(String(c.id))
            .nit.toLowerCase()
            .includes(clientSearch.toLowerCase()),
      )
    : customers;

  const filteredProducts = productSearch
    ? products.filter(
        (p) =>
          p.name.toLowerCase().includes(productSearch.toLowerCase()) ||
          p.barcode.toLowerCase().includes(productSearch.toLowerCase()),
      )
    : products;

  const activeClient = clientMode === "search" ? selectedClient : manualClient;

  const addItem = (p: Product) => {
    const existing = items.find((it) => it.productoId === String(p.id));
    if (existing) {
      setItems(
        items.map((it) =>
          it.productoId === String(p.id)
            ? {
                ...it,
                cantidad: it.cantidad + 1,
                subtotal: (it.cantidad + 1) * it.precioUnitario,
              }
            : it,
        ),
      );
    } else {
      const price = Number(p.price) / 100;
      setItems([
        ...items,
        {
          productoId: String(p.id),
          nombre: p.name,
          cantidad: 1,
          precioUnitario: price,
          subtotal: price,
        },
      ]);
    }
    setProductSearch("");
  };

  const updateQty = (productoId: string, qty: number) => {
    if (qty <= 0) {
      setItems(items.filter((it) => it.productoId !== productoId));
    } else {
      setItems(
        items.map((it) =>
          it.productoId === productoId
            ? { ...it, cantidad: qty, subtotal: qty * it.precioUnitario }
            : it,
        ),
      );
    }
  };

  const subtotalAmount = items.reduce((a, it) => a + it.subtotal, 0);
  const totalAmount = subtotalAmount + subtotalAmount * (impuesto / 100);

  const handleEmit = () => {
    if (!activeClient?.nombre?.trim()) {
      toast.error("El nombre del cliente es obligatorio");
      return;
    }
    if (!activeClient?.nit?.trim()) {
      toast.error("El NIT del cliente es obligatorio para emitir una factura");
      return;
    }
    if (items.length === 0) {
      toast.error("Agrega al menos un producto a la factura");
      return;
    }
    const numero = nextNumero();
    const factura: Factura = {
      id: numero,
      numero,
      fecha,
      cliente: activeClient,
      items,
      subtotal: subtotalAmount,
      impuesto,
      total: totalAmount,
      createdAt: new Date().toISOString(),
    };
    const updated = [factura, ...loadFacturas()];
    saveFacturas(updated);
    onSaved(factura);
    toast.success(`Factura ${numero} emitida correctamente`);
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-3 px-4 py-3 border-b shrink-0 bg-background">
        <button
          type="button"
          onClick={onBack}
          className="p-1.5 rounded-lg text-muted-foreground hover:bg-muted transition-colors"
          data-ocid="create_factura.close_button"
        >
          <ArrowLeft size={20} />
        </button>
        <h3 className="font-semibold text-base flex-1">Nueva Factura</h3>
        <span className="text-xs text-muted-foreground">Paso {step} de 3</span>
      </div>
      {/* Step indicators */}
      <div className="flex gap-1 px-4 py-2 border-b bg-muted/20">
        {[1, 2, 3].map((s) => (
          <div
            key={s}
            className={`flex-1 h-1.5 rounded-full transition-colors ${
              s <= step ? "bg-primary" : "bg-muted"
            }`}
          />
        ))}
      </div>
      <ScrollArea className="flex-1">
        <div className="px-4 py-4 space-y-4">
          {/* STEP 1: Select client */}
          {step === 1 && (
            <div className="space-y-4">
              <p className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                Seleccionar cliente
              </p>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setClientMode("search")}
                  className={`flex-1 py-2.5 rounded-xl border text-sm font-medium flex items-center justify-center gap-2 transition-colors ${
                    clientMode === "search"
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-card border-border text-muted-foreground"
                  }`}
                  data-ocid="create_factura.search_client_toggle"
                >
                  <Search size={15} /> Buscar cliente
                </button>
                <button
                  type="button"
                  onClick={() => setClientMode("manual")}
                  className={`flex-1 py-2.5 rounded-xl border text-sm font-medium flex items-center justify-center gap-2 transition-colors ${
                    clientMode === "manual"
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-card border-border text-muted-foreground"
                  }`}
                  data-ocid="create_factura.manual_client_toggle"
                >
                  <UserPlus size={15} /> Agregar manual
                </button>
              </div>

              {clientMode === "search" ? (
                <div className="space-y-3">
                  <div className="relative">
                    <Search
                      size={15}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                    />
                    <Input
                      placeholder="Buscar por nombre o NIT..."
                      value={clientSearch}
                      onChange={(e) => setClientSearch(e.target.value)}
                      className="pl-9"
                      data-ocid="create_factura.client_search_input"
                    />
                  </div>
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {filteredCustomers.length === 0 && (
                      <p className="text-sm text-muted-foreground text-center py-4">
                        Sin resultados
                      </p>
                    )}
                    {filteredCustomers.map((c) => {
                      const ex = getCustomerExtras(String(c.id));
                      return (
                        <button
                          key={String(c.id)}
                          type="button"
                          onClick={() => {
                            setSelectedClient({
                              nombre: c.name,
                              nit: ex.nit,
                              direccion: ex.direccion,
                              telefono: c.phone,
                            });
                            setClientSearch("");
                          }}
                          className={`w-full text-left px-3 py-2.5 rounded-xl border transition-colors ${
                            selectedClient?.nombre === c.name &&
                            selectedClient?.nit === ex.nit
                              ? "bg-primary/10 border-primary"
                              : "bg-card border-border hover:bg-muted"
                          }`}
                        >
                          <p className="font-medium text-sm">{c.name}</p>
                          <p className="text-xs text-muted-foreground">
                            NIT:{" "}
                            {ex.nit || (
                              <span className="text-destructive">Sin NIT</span>
                            )}
                          </p>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="space-y-1.5">
                    <Label>
                      Nombre <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      placeholder="Nombre completo..."
                      value={manualClient.nombre}
                      onChange={(e) =>
                        setManualClient((p) => ({
                          ...p,
                          nombre: e.target.value,
                        }))
                      }
                      data-ocid="create_factura.manual_nombre_input"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>
                      NIT <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      placeholder="Número de Identificación Tributaria..."
                      value={manualClient.nit}
                      onChange={(e) =>
                        setManualClient((p) => ({ ...p, nit: e.target.value }))
                      }
                      data-ocid="create_factura.manual_nit_input"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Dirección</Label>
                    <Input
                      placeholder="Dirección..."
                      value={manualClient.direccion}
                      onChange={(e) =>
                        setManualClient((p) => ({
                          ...p,
                          direccion: e.target.value,
                        }))
                      }
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Teléfono</Label>
                    <Input
                      placeholder="Teléfono..."
                      value={manualClient.telefono}
                      onChange={(e) =>
                        setManualClient((p) => ({
                          ...p,
                          telefono: e.target.value,
                        }))
                      }
                    />
                  </div>
                </div>
              )}

              {activeClient?.nombre && (
                <div className="bg-primary/10 border border-primary/30 rounded-xl p-3">
                  <p className="text-xs text-muted-foreground mb-1">
                    Cliente seleccionado
                  </p>
                  <p className="font-semibold text-sm">{activeClient.nombre}</p>
                  {activeClient.nit ? (
                    <p className="text-xs text-muted-foreground">
                      NIT: {activeClient.nit}
                    </p>
                  ) : (
                    <p className="text-xs text-destructive">
                      ⚠️ NIT requerido para emitir factura
                    </p>
                  )}
                </div>
              )}
            </div>
          )}

          {/* STEP 2: Add products */}
          {step === 2 && (
            <div className="space-y-4">
              <p className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                Agregar productos
              </p>
              <div className="relative">
                <Search
                  size={15}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                />
                <Input
                  placeholder="Buscar por nombre o código..."
                  value={productSearch}
                  onChange={(e) => setProductSearch(e.target.value)}
                  className="pl-9"
                  data-ocid="create_factura.product_search_input"
                />
              </div>
              {productSearch && (
                <div className="space-y-1 max-h-52 overflow-y-auto border border-border rounded-xl bg-card">
                  {filteredProducts.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      Sin resultados
                    </p>
                  ) : (
                    filteredProducts.slice(0, 10).map((p) => {
                      const meta = getProductMeta(p.id);
                      return (
                        <button
                          key={String(p.id)}
                          type="button"
                          onClick={() => addItem(p)}
                          className="w-full text-left px-3 py-2.5 hover:bg-muted transition-colors flex items-center justify-between border-b last:border-0"
                        >
                          <div>
                            <p className="font-medium text-sm">{p.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {meta.unit} · Stock: {String(p.stock)}
                            </p>
                          </div>
                          <span className="text-sm text-primary font-semibold">
                            ${formatPrice(Number(p.price) / 100)}
                          </span>
                        </button>
                      );
                    })
                  )}
                </div>
              )}
              {items.length > 0 ? (
                <div className="space-y-2">
                  <p className="text-sm font-medium">Productos agregados</p>
                  {items.map((it, idx) => (
                    <div
                      key={it.productoId}
                      className="bg-card border border-border rounded-xl px-3 py-2.5 flex items-center gap-3"
                      data-ocid={`create_factura.item.${idx + 1}`}
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">
                          {it.nombre}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          ${formatPrice(it.precioUnitario)} c/u
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() =>
                            updateQty(it.productoId, it.cantidad - 1)
                          }
                          className="w-7 h-7 rounded-lg bg-muted flex items-center justify-center text-sm font-bold hover:bg-muted/80"
                        >
                          -
                        </button>
                        <span className="w-8 text-center text-sm font-semibold">
                          {it.cantidad}
                        </span>
                        <button
                          type="button"
                          onClick={() =>
                            updateQty(it.productoId, it.cantidad + 1)
                          }
                          className="w-7 h-7 rounded-lg bg-muted flex items-center justify-center text-sm font-bold hover:bg-muted/80"
                        >
                          +
                        </button>
                        <button
                          type="button"
                          onClick={() => updateQty(it.productoId, 0)}
                          className="w-7 h-7 rounded-lg flex items-center justify-center text-destructive hover:bg-destructive/10"
                          data-ocid={`create_factura.delete_button.${idx + 1}`}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                      <span className="text-sm font-bold w-16 text-right">
                        ${formatPrice(it.subtotal)}
                      </span>
                    </div>
                  ))}
                  <div className="text-right font-semibold text-sm pt-2">
                    Subtotal: ${formatPrice(subtotalAmount)}
                  </div>
                </div>
              ) : (
                <div
                  className="py-8 text-center"
                  data-ocid="create_factura.items_empty_state"
                >
                  <p className="text-muted-foreground text-sm">
                    Busca y agrega productos
                  </p>
                </div>
              )}
            </div>
          )}

          {/* STEP 3: Summary */}
          {step === 3 && activeClient && (
            <div className="space-y-4">
              <p className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                Resumen de factura
              </p>
              <div className="bg-card border border-border rounded-xl p-4 space-y-1">
                <p className="text-xs text-muted-foreground">Cliente</p>
                <p className="font-semibold">{activeClient.nombre}</p>
                <p className="text-sm text-muted-foreground">
                  NIT: {activeClient.nit}
                </p>
              </div>
              <div className="space-y-1.5">
                <Label>Fecha de factura</Label>
                <Input
                  type="date"
                  value={fecha}
                  max={today}
                  onChange={(e) => setFecha(e.target.value)}
                  data-ocid="create_factura.fecha_input"
                />
              </div>
              <div className="bg-card border border-border rounded-xl overflow-hidden">
                {items.map((it) => (
                  <div
                    key={it.productoId}
                    className="px-4 py-2.5 flex items-center justify-between border-b last:border-0"
                  >
                    <div>
                      <p className="text-sm font-medium">{it.nombre}</p>
                      <p className="text-xs text-muted-foreground">
                        {it.cantidad} x ${formatPrice(it.precioUnitario)}
                      </p>
                    </div>
                    <p className="font-semibold text-sm">
                      ${formatPrice(it.subtotal)}
                    </p>
                  </div>
                ))}
              </div>
              <div className="bg-card border border-border rounded-xl p-4 space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span>${formatPrice(subtotalAmount)}</span>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-2">
                    <Label className="text-sm whitespace-nowrap">
                      Impuesto %
                    </Label>
                    <Input
                      type="number"
                      min={0}
                      max={100}
                      value={impuesto}
                      onChange={(e) =>
                        setImpuesto(
                          Math.min(100, Math.max(0, Number(e.target.value))),
                        )
                      }
                      className="w-20"
                      data-ocid="create_factura.impuesto_input"
                    />
                  </div>
                  <span className="text-sm">
                    ${formatPrice((subtotalAmount * impuesto) / 100)}
                  </span>
                </div>
                <div className="flex justify-between font-bold text-base pt-2 border-t border-border">
                  <span>TOTAL</span>
                  <span className="text-primary">
                    ${formatPrice(totalAmount)}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </ScrollArea>
      {/* Navigation buttons */}
      <div className="px-4 py-3 border-t shrink-0 bg-background flex gap-3">
        {step > 1 && (
          <Button
            variant="outline"
            className="flex-1"
            onClick={() => setStep((s) => (s - 1) as 1 | 2 | 3)}
            data-ocid="create_factura.prev_button"
          >
            Anterior
          </Button>
        )}
        {step < 3 && (
          <Button
            className="flex-1"
            onClick={() => {
              if (step === 1) {
                if (!activeClient?.nombre?.trim()) {
                  toast.error("Selecciona o ingresa un cliente");
                  return;
                }
                if (!activeClient?.nit?.trim()) {
                  toast.error("El NIT es obligatorio para emitir facturas");
                  return;
                }
              }
              if (step === 2 && items.length === 0) {
                toast.error("Agrega al menos un producto");
                return;
              }
              setStep((s) => (s + 1) as 1 | 2 | 3);
            }}
            data-ocid="create_factura.next_button"
          >
            Siguiente
          </Button>
        )}
        {step === 3 && (
          <Button
            className="flex-1"
            onClick={handleEmit}
            data-ocid="create_factura.submit_button"
          >
            Emitir Factura
          </Button>
        )}
      </div>
    </div>
  );
}

// ── Main Component ───────────────────────────────────────────────────────────
export default function Facturas() {
  const [facturas, setFacturas] = useState<Factura[]>(loadFacturas);
  const [view, setView] = useState<"list" | "create" | "detail">("list");
  const [detailFactura, setDetailFactura] = useState<Factura | null>(null);

  const handleDelete = (f: Factura) => {
    if (!confirm(`¿Eliminar la factura ${f.numero}?`)) return;
    const updated = facturas.filter((x) => x.id !== f.id);
    setFacturas(updated);
    saveFacturas(updated);
    toast.success(`Factura ${f.numero} eliminada`);
  };

  if (view === "create") {
    return (
      <CreateFactura
        onBack={() => setView("list")}
        onSaved={(f) => {
          setFacturas((prev) => [f, ...prev]);
          setView("list");
        }}
      />
    );
  }

  if (view === "detail" && detailFactura) {
    return (
      <FacturaDetail
        factura={detailFactura}
        onBack={() => {
          setDetailFactura(null);
          setView("list");
        }}
      />
    );
  }

  return (
    <div className="relative px-4 pb-6 pt-4">
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-muted-foreground">
          {facturas.length} factura{facturas.length !== 1 ? "s" : ""}
        </p>
      </div>
      <ScrollArea className="h-[calc(100vh-180px)]">
        {facturas.length === 0 ? (
          <div className="py-16 text-center" data-ocid="facturas.empty_state">
            <FileText
              size={40}
              className="mx-auto text-muted-foreground/30 mb-3"
            />
            <p className="text-muted-foreground">Sin facturas emitidas</p>
            <p className="text-xs text-muted-foreground mt-1">
              Toca el botón + para crear una
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {facturas.map((f, idx) => (
              <button
                key={f.id}
                type="button"
                onClick={() => {
                  setDetailFactura(f);
                  setView("detail");
                }}
                data-ocid={`facturas.item.${idx + 1}`}
                className="w-full text-left bg-card border border-border rounded-xl px-4 py-3 flex items-center gap-3 shadow-xs hover:bg-muted/30 transition-colors"
              >
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                  <FileText size={18} className="text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm">{f.numero}</p>
                  <p className="text-xs text-muted-foreground truncate">
                    {f.cliente.nombre}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    NIT: {f.cliente.nit} · {formatDate(f.fecha)}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <p className="font-bold text-sm text-primary">
                    ${formatPrice(f.total)}
                  </p>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button
                        type="button"
                        onClick={(e) => e.stopPropagation()}
                        className="inline-flex w-7 h-7 items-center justify-center rounded-lg hover:bg-muted transition-colors mt-1"
                        data-ocid={`facturas.dropdown_menu.${idx + 1}`}
                      >
                        <MoreVertical
                          size={14}
                          className="text-muted-foreground"
                        />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-44">
                      <DropdownMenuItem
                        onClick={(e) => {
                          e.stopPropagation();
                          setDetailFactura(f);
                          setView("detail");
                        }}
                      >
                        <FileDown size={14} className="mr-2" /> Ver / Exportar
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="text-destructive"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(f);
                        }}
                        data-ocid={`facturas.delete_button.${idx + 1}`}
                      >
                        <Trash2 size={14} className="mr-2" /> Eliminar
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </button>
            ))}
          </div>
        )}
      </ScrollArea>
      {/* FAB */}
      <button
        type="button"
        onClick={() => setView("create")}
        data-ocid="facturas.open_modal_button"
        className="fixed bottom-6 right-6 w-14 h-14 rounded-full bg-primary text-primary-foreground shadow-lg flex items-center justify-center hover:opacity-90 active:scale-95 transition-all z-40"
      >
        <Plus size={24} />
      </button>
    </div>
  );
}
