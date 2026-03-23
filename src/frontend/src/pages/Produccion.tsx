import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { Textarea } from "@/components/ui/textarea";
import {
  AlertTriangle,
  ArrowLeft,
  ChevronDown,
  ChevronUp,
  ClipboardList,
  Factory,
  FlaskConical,
  Package,
  Pencil,
  Plus,
  Send,
  Trash2,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import {
  type FichaElaboracion,
  type FichaInsumo,
  type Insumo,
  type InsumoMovimiento,
  type OrdenProduccion,
  type ProductoTerminado,
  addFicha,
  addInsumo,
  addMovimiento,
  addOrden,
  addTerminado,
  deleteFicha,
  deleteInsumo,
  fmt,
  getCurrencySymbol,
  getFichas,
  getInsumos,
  getMovimientos,
  getOrdenes,
  getTerminados,
  getTiposMerma,
  saveInsumos,
  saveOrdenes,
  saveTerminados,
  updateFicha,
  updateInsumo,
  updateOrden,
  updateTerminado,
} from "../utils/produccion";

// ───────────────────────────── helpers ──────────────────────────────────────

function useForceUpdate() {
  const [, set] = useState(0);
  return () => set((n) => n + 1);
}

const TABS = [
  { id: "insumos", label: "Insumos", icon: <FlaskConical size={15} /> },
  { id: "produccion", label: "Producción", icon: <Factory size={15} /> },
  {
    id: "terminados",
    label: "Productos terminados",
    icon: <Package size={15} />,
  },
  {
    id: "fichas",
    label: "Fichas de Elaboración",
    icon: <ClipboardList size={15} />,
  },
] as const;

type TabId = (typeof TABS)[number]["id"];

// ───────────────────────── Insumos Tab ──────────────────────────────────────

function InsumoForm({
  initial,
  onSave,
  onCancel,
}: {
  initial?: Insumo;
  onSave: (data: Omit<Insumo, "id">) => void;
  onCancel: () => void;
}) {
  const [nombre, setNombre] = useState(initial?.nombre ?? "");
  const [codigo, setCodigo] = useState(initial?.codigo ?? "");
  const [cantidad, setCantidad] = useState(String(initial?.cantidad ?? 0));
  const [unidad, setUnidad] = useState(initial?.unidad ?? "kg");
  const [costoUnitario, setCostoUnitario] = useState(
    String(initial?.costoUnitario ?? 0),
  );

  const handleSave = () => {
    if (!nombre.trim()) {
      toast.error("El nombre es obligatorio");
      return;
    }
    const cant = Number.parseFloat(cantidad) || 0;
    const costo = Number.parseFloat(costoUnitario) || 0;
    onSave({
      nombre: nombre.trim(),
      codigo: codigo.trim(),
      cantidad: cant,
      unidad: unidad.trim() || "kg",
      costoUnitario: costo,
      costoTotal: cant * costo,
      fechaIngreso: new Date().toISOString(),
    });
  };

  return (
    <div className="space-y-3 p-4">
      <div>
        <Label className="text-xs mb-1 block">Nombre *</Label>
        <Input
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          placeholder="Harina, azúcar..."
          data-ocid="insumo.input"
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label className="text-xs mb-1 block">Código</Label>
          <Input
            value={codigo}
            onChange={(e) => setCodigo(e.target.value)}
            placeholder="INS-001"
          />
        </div>
        <div>
          <Label className="text-xs mb-1 block">Unidad</Label>
          <Input
            value={unidad}
            onChange={(e) => setUnidad(e.target.value)}
            placeholder="kg, L, und"
          />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label className="text-xs mb-1 block">Cantidad inicial</Label>
          <Input
            type="number"
            min="0"
            value={cantidad}
            onChange={(e) => setCantidad(e.target.value)}
          />
        </div>
        <div>
          <Label className="text-xs mb-1 block">Costo unitario</Label>
          <Input
            type="number"
            min="0"
            step="0.01"
            value={costoUnitario}
            onChange={(e) => setCostoUnitario(e.target.value)}
          />
        </div>
      </div>
      <div className="flex gap-2 pt-2">
        <Button
          className="flex-1"
          onClick={handleSave}
          data-ocid="insumo.save_button"
        >
          Guardar
        </Button>
        <Button
          variant="outline"
          className="flex-1"
          onClick={onCancel}
          data-ocid="insumo.cancel_button"
        >
          Cancelar
        </Button>
      </div>
    </div>
  );
}

function InsumoRow({
  insumo,
  onEdit,
  onDelete,
  currency,
}: {
  insumo: Insumo;
  onEdit: () => void;
  onDelete: () => void;
  currency: string;
}) {
  const [expanded, setExpanded] = useState(false);
  const [showRebajar, setShowRebajar] = useState(false);
  const [rebCantidad, setRebCantidad] = useState("");
  const [rebTipo, setRebTipo] = useState(getTiposMerma()[0] ?? "Desperdicio");
  const [rebObs, setRebObs] = useState("");
  const tiposMerma = getTiposMerma();
  const movimientos = getMovimientos().filter((m) => m.insumoId === insumo.id);

  const handleRebajar = () => {
    const cant = Number.parseFloat(rebCantidad) || 0;
    if (cant <= 0) {
      toast.error("Ingrese una cantidad válida");
      return;
    }
    if (cant > insumo.cantidad) {
      toast.error("Cantidad supera el stock disponible");
      return;
    }
    const newCantidad = insumo.cantidad - cant;
    updateInsumo(insumo.id, {
      cantidad: newCantidad,
      costoTotal: newCantidad * insumo.costoUnitario,
    });
    addMovimiento({
      insumoId: insumo.id,
      tipo: "merma",
      cantidad: cant,
      motivo: `${rebTipo}${rebObs ? ` - ${rebObs}` : ""}`,
      fecha: new Date().toISOString(),
    });
    toast.success("Stock rebajado");
    setShowRebajar(false);
    setRebCantidad("");
    setRebObs("");
  };

  return (
    <div className="border-b border-border last:border-b-0">
      <div className="flex items-center gap-2 px-4 py-3">
        <button
          type="button"
          className="flex-1 flex items-center gap-2 text-left"
          onClick={() => setExpanded((v) => !v)}
          data-ocid="insumo.row"
        >
          <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center shrink-0">
            <FlaskConical size={14} className="text-amber-600" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{insumo.nombre}</p>
            <p className="text-xs text-muted-foreground">
              {fmt(insumo.cantidad)} {insumo.unidad} · {currency}
              {fmt(insumo.costoUnitario)}/u
            </p>
          </div>
          <div className="text-right shrink-0">
            <p className="text-xs font-semibold text-foreground">
              {currency}
              {fmt(insumo.costoTotal)}
            </p>
          </div>
          {expanded ? (
            <ChevronUp size={14} className="text-muted-foreground" />
          ) : (
            <ChevronDown size={14} className="text-muted-foreground" />
          )}
        </button>
        <button
          type="button"
          onClick={onEdit}
          className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground"
          aria-label="Editar"
          data-ocid="insumo.edit_button"
        >
          <Pencil size={14} />
        </button>
        <button
          type="button"
          onClick={onDelete}
          className="p-1.5 rounded-lg hover:bg-destructive/10 text-destructive"
          aria-label="Eliminar"
          data-ocid="insumo.delete_button"
        >
          <Trash2 size={14} />
        </button>
      </div>
      {expanded && (
        <div className="px-4 pb-3 bg-muted/10 space-y-2">
          <button
            type="button"
            onClick={() => setShowRebajar(true)}
            className="text-xs font-medium text-orange-600 hover:underline flex items-center gap-1"
            data-ocid="insumo.secondary_button"
          >
            <ChevronDown size={12} /> Registrar merma / rebajar
          </button>
          {movimientos.length > 0 && (
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground font-medium">
                Historial de movimientos
              </p>
              {movimientos
                .slice(-5)
                .reverse()
                .map((m) => (
                  <div key={m.id} className="text-xs flex justify-between">
                    <span
                      className={
                        m.tipo === "entrada"
                          ? "text-emerald-600"
                          : "text-orange-600"
                      }
                    >
                      {m.tipo === "entrada" ? "+" : "-"}
                      {fmt(m.cantidad)} – {m.motivo}
                    </span>
                    <span className="text-muted-foreground">
                      {new Date(m.fecha).toLocaleDateString("es-ES")}
                    </span>
                  </div>
                ))}
            </div>
          )}
        </div>
      )}
      <Dialog open={showRebajar} onOpenChange={setShowRebajar}>
        <DialogContent className="max-w-xs" data-ocid="insumo.dialog">
          <DialogHeader>
            <DialogTitle>Rebajar / Merma</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label className="text-xs mb-1 block">Cantidad a rebajar</Label>
              <Input
                type="number"
                min="0"
                max={insumo.cantidad}
                value={rebCantidad}
                onChange={(e) => setRebCantidad(e.target.value)}
                data-ocid="insumo.search_input"
              />
            </div>
            <div>
              <Label className="text-xs mb-1 block">Tipo de merma</Label>
              <Select value={rebTipo} onValueChange={setRebTipo}>
                <SelectTrigger data-ocid="insumo.select">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {tiposMerma.map((t) => (
                    <SelectItem key={t} value={t}>
                      {t}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs mb-1 block">
                Observación (opcional)
              </Label>
              <Input
                value={rebObs}
                onChange={(e) => setRebObs(e.target.value)}
                placeholder="Detalle..."
              />
            </div>
          </div>
          <DialogFooter className="gap-2 flex-row">
            <Button
              variant="outline"
              onClick={() => setShowRebajar(false)}
              className="flex-1"
              data-ocid="insumo.cancel_button"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleRebajar}
              className="flex-1"
              data-ocid="insumo.confirm_button"
            >
              Rebajar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function InsumosTab({ currency }: { currency: string }) {
  const refresh = useForceUpdate();
  const [showForm, setShowForm] = useState(false);
  const [editInsumo, setEditInsumo] = useState<Insumo | null>(null);
  const [search, setSearch] = useState("");

  const insumos = getInsumos().filter(
    (i) =>
      i.nombre.toLowerCase().includes(search.toLowerCase()) ||
      i.codigo.toLowerCase().includes(search.toLowerCase()),
  );
  const totalValor = insumos.reduce((s, i) => s + i.costoTotal, 0);

  const handleSave = (data: Omit<Insumo, "id">) => {
    if (editInsumo) {
      updateInsumo(editInsumo.id, data);
      toast.success("Insumo actualizado");
    } else {
      addInsumo(data);
      if (data.cantidad > 0) {
        const all = getInsumos();
        const created = all[all.length - 1];
        addMovimiento({
          insumoId: created.id,
          tipo: "entrada",
          cantidad: data.cantidad,
          motivo: "Stock inicial",
          fecha: new Date().toISOString(),
        });
      }
      toast.success("Insumo agregado");
    }
    setShowForm(false);
    setEditInsumo(null);
    refresh();
  };

  const handleDelete = (id: string, nombre: string) => {
    if (!window.confirm(`¿Eliminar insumo "${nombre}"?`)) return;
    deleteInsumo(id);
    toast.success("Insumo eliminado");
    refresh();
  };

  if (showForm || editInsumo) {
    return (
      <div className="flex flex-col flex-1 overflow-hidden">
        <div className="flex items-center gap-3 px-4 py-3 border-b border-border shrink-0">
          <button
            type="button"
            onClick={() => {
              setShowForm(false);
              setEditInsumo(null);
            }}
            className="p-1.5 rounded-lg text-muted-foreground hover:bg-muted"
            data-ocid="insumo.back.button"
          >
            <ArrowLeft size={20} />
          </button>
          <h3 className="font-semibold text-base">
            {editInsumo ? "Editar Insumo" : "Nuevo Insumo"}
          </h3>
        </div>
        <ScrollArea className="flex-1">
          <InsumoForm
            initial={editInsumo ?? undefined}
            onSave={handleSave}
            onCancel={() => {
              setShowForm(false);
              setEditInsumo(null);
            }}
          />
        </ScrollArea>
      </div>
    );
  }

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      {/* Summary header */}
      <div className="px-4 py-3 bg-amber-50 border-b border-border">
        <p className="text-xs text-amber-700 font-medium">
          Valor total en insumos
        </p>
        <p className="text-2xl font-bold text-amber-800">
          {currency}
          {fmt(totalValor)}
        </p>
      </div>

      {/* Search */}
      <div className="px-4 py-2 border-b border-border">
        <Input
          placeholder="Buscar insumo..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="h-8 text-sm"
          data-ocid="insumos.search_input"
        />
      </div>

      <ScrollArea className="flex-1">
        {insumos.length === 0 ? (
          <div
            className="flex flex-col items-center justify-center py-16 text-muted-foreground"
            data-ocid="insumos.empty_state"
          >
            <FlaskConical size={40} className="mb-3 opacity-30" />
            <p className="text-sm">Sin insumos registrados</p>
            <p className="text-xs">Toca + para agregar el primero</p>
          </div>
        ) : (
          <div>
            {insumos.map((insumo, idx) => (
              <div key={insumo.id} data-ocid={`insumos.item.${idx + 1}`}>
                <InsumoRow
                  insumo={insumo}
                  currency={currency}
                  onEdit={() => {
                    setEditInsumo(insumo);
                  }}
                  onDelete={() => handleDelete(insumo.id, insumo.nombre)}
                />
              </div>
            ))}
          </div>
        )}
      </ScrollArea>

      {/* FAB */}
      <button
        type="button"
        onClick={() => setShowForm(true)}
        className="absolute bottom-6 right-6 w-12 h-12 rounded-full bg-primary text-primary-foreground shadow-lg flex items-center justify-center hover:opacity-90 active:scale-95 transition-all z-10"
        aria-label="Nuevo insumo"
        data-ocid="insumos.open_modal_button"
      >
        <Plus size={22} />
      </button>
    </div>
  );
}

// ───────────────────────── Fichas Tab ───────────────────────────────────────

function FichaForm({
  initial,
  onSave,
  onCancel,
  currency,
}: {
  initial?: FichaElaboracion;
  onSave: (f: Omit<FichaElaboracion, "id">) => void;
  onCancel: () => void;
  currency: string;
}) {
  const insumos = getInsumos();
  const [nombre, setNombre] = useState(initial?.nombre ?? "");
  const [descripcion, setDescripcion] = useState(initial?.descripcion ?? "");
  const [rendimiento, setRendimiento] = useState(
    String(initial?.rendimiento ?? 1),
  );
  const [unidadProducto, setUnidadProducto] = useState(
    initial?.unidadProducto ?? "und",
  );
  const [notas, setNotas] = useState(initial?.notas ?? "");
  const [fichaInsumos, setFichaInsumos] = useState<FichaInsumo[]>(
    initial?.insumos ?? [],
  );

  const addRow = () => {
    setFichaInsumos((prev) => [
      ...prev,
      {
        insumoId: "",
        nombreInsumo: "",
        cantidad: 0,
        unidad: "kg",
        costoUnitario: 0,
        costoLinea: 0,
      },
    ]);
  };

  const removeRow = (idx: number) => {
    setFichaInsumos((prev) => prev.filter((_, i) => i !== idx));
  };

  const updateRow = (
    idx: number,
    field: keyof FichaInsumo,
    value: string | number,
  ) => {
    setFichaInsumos((prev) => {
      const updated = [...prev];
      const row = { ...updated[idx], [field]: value };
      if (field === "insumoId" && value) {
        const ins = insumos.find((i) => i.id === value);
        if (ins) {
          row.nombreInsumo = ins.nombre;
          row.unidad = ins.unidad;
          row.costoUnitario = ins.costoUnitario;
        }
      }
      if (field === "cantidad" || field === "costoUnitario") {
        row.costoLinea =
          (Number.parseFloat(String(row.cantidad)) || 0) *
          (Number.parseFloat(String(row.costoUnitario)) || 0);
      }
      updated[idx] = row;
      return updated;
    });
  };

  const costoTotal = fichaInsumos.reduce((s, r) => s + (r.costoLinea || 0), 0);
  const rend = Number.parseFloat(rendimiento) || 1;
  const costoPorUnidad = costoTotal / rend;

  const handleSave = () => {
    if (!nombre.trim()) {
      toast.error("El nombre es obligatorio");
      return;
    }
    if (rend <= 0) {
      toast.error("El rendimiento debe ser mayor a 0");
      return;
    }
    onSave({
      nombre: nombre.trim(),
      descripcion: descripcion.trim(),
      rendimiento: rend,
      unidadProducto: unidadProducto.trim() || "und",
      insumos: fichaInsumos,
      costoTotal,
      costoPorUnidad,
      notas: notas.trim(),
      fechaCreacion: initial?.fechaCreacion ?? new Date().toISOString(),
    });
  };

  return (
    <ScrollArea className="flex-1 min-h-0">
      <div className="px-4 pb-6 pt-4 space-y-4">
        <div>
          <Label className="text-xs mb-1 block">
            Nombre del producto terminado *
          </Label>
          <Input
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            placeholder="Pan, mermelada..."
            data-ocid="ficha.input"
          />
        </div>
        <div>
          <Label className="text-xs mb-1 block">Descripción</Label>
          <Textarea
            value={descripcion}
            onChange={(e) => setDescripcion(e.target.value)}
            rows={2}
            className="text-sm"
            data-ocid="ficha.textarea"
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label className="text-xs mb-1 block">Rendimiento por lote *</Label>
            <Input
              type="number"
              min="1"
              value={rendimiento}
              onChange={(e) => setRendimiento(e.target.value)}
            />
          </div>
          <div>
            <Label className="text-xs mb-1 block">Unidad producto</Label>
            <Input
              value={unidadProducto}
              onChange={(e) => setUnidadProducto(e.target.value)}
              placeholder="und, kg..."
            />
          </div>
        </div>

        {/* Insumos */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <Label className="text-xs font-semibold">Insumos por lote</Label>
            <button
              type="button"
              onClick={addRow}
              className="text-xs text-primary flex items-center gap-1 hover:underline"
              data-ocid="ficha.open_modal_button"
            >
              <Plus size={12} /> Agregar fila
            </button>
          </div>
          {fichaInsumos.length === 0 && (
            <p className="text-xs text-muted-foreground">
              Sin insumos. Agrega filas para calcular el costo.
            </p>
          )}
          <div className="space-y-2">
            {fichaInsumos.map((row, idx) => (
              <div
                key={`row-${idx}-${row.insumoId || row.nombreInsumo}`}
                className="border border-border rounded-lg p-2 space-y-2"
                data-ocid={`ficha.item.${idx + 1}`}
              >
                <div className="flex items-center gap-2">
                  <div className="flex-1">
                    <Label className="text-xs mb-0.5 block">Insumo</Label>
                    <Select
                      value={row.insumoId}
                      onValueChange={(v) => updateRow(idx, "insumoId", v)}
                    >
                      <SelectTrigger className="h-7 text-xs">
                        <SelectValue placeholder="Seleccionar o escribir" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__manual__">
                          -- Ingresar manualmente --
                        </SelectItem>
                        {insumos.map((i) => (
                          <SelectItem key={i.id} value={i.id}>
                            {i.nombre}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeRow(idx)}
                    className="p-1 text-destructive hover:bg-destructive/10 rounded mt-4"
                    data-ocid={`ficha.delete_button.${idx + 1}`}
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
                {(!row.insumoId || row.insumoId === "__manual__") && (
                  <Input
                    className="h-7 text-xs"
                    placeholder="Nombre del insumo"
                    value={row.nombreInsumo}
                    onChange={(e) =>
                      updateRow(idx, "nombreInsumo", e.target.value)
                    }
                  />
                )}
                <div className="grid grid-cols-3 gap-1">
                  <div>
                    <Label className="text-xs mb-0.5 block">Cantidad</Label>
                    <Input
                      type="number"
                      min="0"
                      className="h-7 text-xs"
                      value={row.cantidad}
                      onChange={(e) =>
                        updateRow(
                          idx,
                          "cantidad",
                          Number.parseFloat(e.target.value) || 0,
                        )
                      }
                    />
                  </div>
                  <div>
                    <Label className="text-xs mb-0.5 block">Unidad</Label>
                    <Input
                      className="h-7 text-xs"
                      value={row.unidad}
                      onChange={(e) => updateRow(idx, "unidad", e.target.value)}
                    />
                  </div>
                  <div>
                    <Label className="text-xs mb-0.5 block">Costo/u</Label>
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      className="h-7 text-xs"
                      value={row.costoUnitario}
                      onChange={(e) =>
                        updateRow(
                          idx,
                          "costoUnitario",
                          Number.parseFloat(e.target.value) || 0,
                        )
                      }
                    />
                  </div>
                </div>
                <div className="text-xs text-right text-muted-foreground">
                  Costo de línea:{" "}
                  <span className="font-semibold text-foreground">
                    {currency}
                    {fmt(row.costoLinea)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Totals */}
        <div className="bg-muted/40 rounded-lg p-3 space-y-1">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Costo total del lote</span>
            <span className="font-semibold">
              {currency}
              {fmt(costoTotal)}
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Costo por unidad</span>
            <span className="font-semibold text-primary">
              {currency}
              {fmt(costoPorUnidad)}
            </span>
          </div>
        </div>

        <div>
          <Label className="text-xs mb-1 block">Notas</Label>
          <Textarea
            value={notas}
            onChange={(e) => setNotas(e.target.value)}
            rows={2}
            className="text-sm"
          />
        </div>

        <div className="flex gap-2">
          <Button
            className="flex-1"
            onClick={handleSave}
            data-ocid="ficha.save_button"
          >
            Guardar ficha
          </Button>
          <Button
            variant="outline"
            className="flex-1"
            onClick={onCancel}
            data-ocid="ficha.cancel_button"
          >
            Cancelar
          </Button>
        </div>
      </div>
    </ScrollArea>
  );
}

function FichasTab({ currency }: { currency: string }) {
  const refresh = useForceUpdate();
  const [showForm, setShowForm] = useState(false);
  const [editFicha, setEditFicha] = useState<FichaElaboracion | null>(null);

  const fichas = getFichas();

  const handleSave = (data: Omit<FichaElaboracion, "id">) => {
    if (editFicha) {
      updateFicha(editFicha.id, data);
      toast.success("Ficha actualizada");
    } else {
      addFicha(data);
      toast.success("Ficha creada");
    }
    setShowForm(false);
    setEditFicha(null);
    refresh();
  };

  const handleDelete = (id: string, nombre: string) => {
    if (!window.confirm(`¿Eliminar ficha "${nombre}"?`)) return;
    deleteFicha(id);
    toast.success("Ficha eliminada");
    refresh();
  };

  if (showForm || editFicha) {
    return (
      <div className="flex flex-col flex-1 overflow-hidden">
        <div className="flex items-center gap-3 px-4 py-3 border-b border-border shrink-0">
          <button
            type="button"
            onClick={() => {
              setShowForm(false);
              setEditFicha(null);
            }}
            className="p-1.5 rounded-lg text-muted-foreground hover:bg-muted"
            data-ocid="ficha.back.button"
          >
            <ArrowLeft size={20} />
          </button>
          <h3 className="font-semibold text-base">
            {editFicha ? "Editar Ficha" : "Nueva Ficha de Elaboración"}
          </h3>
        </div>
        <FichaForm
          initial={editFicha ?? undefined}
          onSave={handleSave}
          onCancel={() => {
            setShowForm(false);
            setEditFicha(null);
          }}
          currency={currency}
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      <ScrollArea className="flex-1">
        {fichas.length === 0 ? (
          <div
            className="flex flex-col items-center justify-center py-16 text-muted-foreground"
            data-ocid="fichas.empty_state"
          >
            <ClipboardList size={40} className="mb-3 opacity-30" />
            <p className="text-sm">Sin fichas de elaboración</p>
            <p className="text-xs">Toca + para crear la primera</p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {fichas.map((ficha, idx) => (
              <div
                key={ficha.id}
                className="flex items-center gap-3 px-4 py-3"
                data-ocid={`fichas.item.${idx + 1}`}
              >
                <div className="w-9 h-9 rounded-lg bg-purple-100 flex items-center justify-center shrink-0">
                  <ClipboardList size={16} className="text-purple-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{ficha.nombre}</p>
                  <p className="text-xs text-muted-foreground">
                    {ficha.rendimiento} {ficha.unidadProducto}/lote ·{" "}
                    {ficha.insumos.length} insumos
                  </p>
                  <p className="text-xs font-semibold text-primary">
                    Costo/u: {currency}
                    {fmt(ficha.costoPorUnidad)}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setEditFicha(ficha)}
                  className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground"
                  data-ocid={`fichas.edit_button.${idx + 1}`}
                >
                  <Pencil size={14} />
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(ficha.id, ficha.nombre)}
                  className="p-1.5 rounded-lg hover:bg-destructive/10 text-destructive"
                  data-ocid={`fichas.delete_button.${idx + 1}`}
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>
        )}
      </ScrollArea>
      <button
        type="button"
        onClick={() => setShowForm(true)}
        className="absolute bottom-6 right-6 w-12 h-12 rounded-full bg-primary text-primary-foreground shadow-lg flex items-center justify-center hover:opacity-90 active:scale-95 transition-all z-10"
        aria-label="Nueva ficha"
        data-ocid="fichas.open_modal_button"
      >
        <Plus size={22} />
      </button>
    </div>
  );
}

// ───────────────────────── Ordenes Tab ──────────────────────────────────────

function EstadoBadge({ estado }: { estado: OrdenProduccion["estado"] }) {
  const map: Record<
    OrdenProduccion["estado"],
    { label: string; className: string }
  > = {
    pendiente: {
      label: "Pendiente",
      className: "bg-yellow-100 text-yellow-700",
    },
    en_proceso: { label: "En proceso", className: "bg-blue-100 text-blue-700" },
    completado: {
      label: "Completado",
      className: "bg-emerald-100 text-emerald-700",
    },
    cancelado: { label: "Cancelado", className: "bg-red-100 text-red-700" },
  };
  const { label, className } = map[estado];
  return (
    <span
      className={`text-xs px-2 py-0.5 rounded-full font-medium ${className}`}
    >
      {label}
    </span>
  );
}

function NuevaOrdenDialog({
  onCreated,
  currency,
}: { onCreated: () => void; currency: string }) {
  const [open, setOpen] = useState(false);
  const fichas = getFichas();
  const insumos = getInsumos();
  const [fichaId, setFichaId] = useState("");
  const [lotes, setLotes] = useState("1");
  const [notas, setNotas] = useState("");

  const ficha = fichas.find((f) => f.id === fichaId);
  const cantLotes = Number.parseInt(lotes) || 1;

  const insumosReq = ficha
    ? ficha.insumos.map((fi) => {
        const ins = insumos.find((i) => i.id === fi.insumoId);
        return {
          insumoId: fi.insumoId,
          nombreInsumo: fi.nombreInsumo || ins?.nombre || "",
          cantidadRequerida: fi.cantidad * cantLotes,
          cantidadDisponible: ins?.cantidad ?? 0,
          unidad: fi.unidad,
          costoUnitario: fi.costoUnitario,
        };
      })
    : [];

  const hayFaltantes = insumosReq.some(
    (r) => r.insumoId && r.cantidadRequerida > r.cantidadDisponible,
  );
  const costoEstimado = ficha ? ficha.costoTotal * cantLotes : 0;
  const cantProducida = ficha ? ficha.rendimiento * cantLotes : 0;

  const handleCrear = () => {
    if (!ficha) {
      toast.error("Selecciona una ficha");
      return;
    }
    addOrden({
      fichaId: ficha.id,
      nombreFicha: ficha.nombre,
      cantidadLotes: cantLotes,
      cantidadProducida: cantProducida,
      insumosRequeridos: insumosReq,
      mermas: [],
      estado: "pendiente",
      costoTotal: costoEstimado,
      costoPorUnidad: ficha.costoPorUnidad,
      fechaCreacion: new Date().toISOString(),
      notas: notas.trim(),
    });
    toast.success("Orden de producción creada");
    setOpen(false);
    setFichaId("");
    setLotes("1");
    setNotas("");
    onCreated();
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="absolute bottom-6 right-6 w-12 h-12 rounded-full bg-primary text-primary-foreground shadow-lg flex items-center justify-center hover:opacity-90 active:scale-95 transition-all z-10"
        aria-label="Nueva orden"
        data-ocid="ordenes.open_modal_button"
      >
        <Plus size={22} />
      </button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-sm" data-ocid="ordenes.dialog">
          <DialogHeader>
            <DialogTitle>Nueva Orden de Producción</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label className="text-xs mb-1 block">Ficha de elaboración</Label>
              <Select value={fichaId} onValueChange={setFichaId}>
                <SelectTrigger data-ocid="ordenes.select">
                  <SelectValue placeholder="Seleccionar ficha" />
                </SelectTrigger>
                <SelectContent>
                  {fichas.map((f) => (
                    <SelectItem key={f.id} value={f.id}>
                      {f.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs mb-1 block">Número de lotes</Label>
              <Input
                type="number"
                min="1"
                value={lotes}
                onChange={(e) => setLotes(e.target.value)}
                data-ocid="ordenes.input"
              />
            </div>
            {ficha && (
              <div className="bg-muted/30 rounded-lg p-3 space-y-2">
                <p className="text-xs font-medium">Resumen</p>
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">
                    Cantidad a producir
                  </span>
                  <span className="font-medium">
                    {cantProducida} {ficha.unidadProducto}
                  </span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Costo estimado</span>
                  <span className="font-medium">
                    {currency}
                    {fmt(costoEstimado)}
                  </span>
                </div>
                {hayFaltantes && (
                  <div className="flex items-center gap-1 text-xs text-orange-600">
                    <AlertTriangle size={12} /> Insumos insuficientes para esta
                    orden
                  </div>
                )}
                <div className="space-y-1 mt-1">
                  {insumosReq.map((r) => (
                    <div
                      key={r.insumoId || r.nombreInsumo}
                      className="flex justify-between text-xs"
                    >
                      <span className="truncate max-w-[120px]">
                        {r.nombreInsumo}
                      </span>
                      <span
                        className={
                          r.insumoId &&
                          r.cantidadRequerida > r.cantidadDisponible
                            ? "text-orange-600 font-medium"
                            : "text-muted-foreground"
                        }
                      >
                        Req: {fmt(r.cantidadRequerida)} / Disp:{" "}
                        {fmt(r.cantidadDisponible)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            <div>
              <Label className="text-xs mb-1 block">Notas</Label>
              <Textarea
                value={notas}
                onChange={(e) => setNotas(e.target.value)}
                rows={2}
                className="text-sm"
              />
            </div>
          </div>
          <DialogFooter className="gap-2 flex-row">
            <Button
              variant="outline"
              onClick={() => setOpen(false)}
              className="flex-1"
              data-ocid="ordenes.cancel_button"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleCrear}
              className="flex-1"
              data-ocid="ordenes.confirm_button"
            >
              Crear Orden
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

function MermasDialog({
  orden,
  onClose,
  onSaved,
}: { orden: OrdenProduccion; onClose: () => void; onSaved: () => void }) {
  const insumos = getInsumos();
  const tiposMerma = getTiposMerma();
  const [mermas, setMermas] = useState(orden.mermas);
  const [insumoId, setInsumoId] = useState("");
  const [cantidad, setCantidad] = useState("");
  const [tipoMerma, setTipoMerma] = useState(tiposMerma[0] ?? "");
  const [obs, setObs] = useState("");

  const addMerma = () => {
    const cant = Number.parseFloat(cantidad) || 0;
    if (!insumoId || cant <= 0) {
      toast.error("Selecciona insumo y cantidad");
      return;
    }
    const ins = insumos.find((i) => i.id === insumoId);
    setMermas((prev) => [
      ...prev,
      {
        insumoId,
        nombreInsumo: ins?.nombre ?? "",
        cantidad: cant,
        tipoMerma,
        observacion: obs,
      },
    ]);
    setInsumoId("");
    setCantidad("");
    setObs("");
  };

  const handleSave = () => {
    updateOrden(orden.id, { mermas });
    // Apply mermas to insumos
    for (const m of mermas) {
      const ins = insumos.find((i) => i.id === m.insumoId);
      if (ins) {
        const newCant = Math.max(0, ins.cantidad - m.cantidad);
        updateInsumo(m.insumoId, {
          cantidad: newCant,
          costoTotal: newCant * ins.costoUnitario,
        });
        addMovimiento({
          insumoId: m.insumoId,
          tipo: "merma",
          cantidad: m.cantidad,
          motivo: `${m.tipoMerma} (Orden ${orden.id.slice(0, 6)}) ${m.observacion}`,
          fecha: new Date().toISOString(),
          ordenId: orden.id,
        });
      }
    }
    toast.success("Mermas registradas");
    onSaved();
    onClose();
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-sm" data-ocid="mermas.dialog">
        <DialogHeader>
          <DialogTitle>Registrar Mermas</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-2">
            <div className="col-span-2">
              <Label className="text-xs mb-1 block">Insumo</Label>
              <Select value={insumoId} onValueChange={setInsumoId}>
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue placeholder="Seleccionar" />
                </SelectTrigger>
                <SelectContent>
                  {insumos.map((i) => (
                    <SelectItem key={i.id} value={i.id}>
                      {i.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs mb-1 block">Cantidad</Label>
              <Input
                type="number"
                min="0"
                className="h-8 text-xs"
                value={cantidad}
                onChange={(e) => setCantidad(e.target.value)}
              />
            </div>
            <div>
              <Label className="text-xs mb-1 block">Tipo</Label>
              <Select value={tipoMerma} onValueChange={setTipoMerma}>
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {tiposMerma.map((t) => (
                    <SelectItem key={t} value={t}>
                      {t}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="col-span-2">
              <Label className="text-xs mb-1 block">Observación</Label>
              <Input
                className="h-8 text-xs"
                value={obs}
                onChange={(e) => setObs(e.target.value)}
              />
            </div>
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={addMerma}
            className="w-full"
            data-ocid="mermas.secondary_button"
          >
            <Plus size={12} className="mr-1" />
            Agregar merma
          </Button>
          {mermas.length > 0 && (
            <div className="border border-border rounded-lg divide-y divide-border max-h-32 overflow-y-auto">
              {mermas.map((m, i) => (
                <div
                  key={`merma-${i}-${m.insumoId}-${m.tipoMerma}`}
                  className="px-3 py-1.5 text-xs flex justify-between"
                >
                  <span>{m.nombreInsumo}</span>
                  <span className="text-muted-foreground">
                    {fmt(m.cantidad)} · {m.tipoMerma}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
        <DialogFooter className="gap-2 flex-row">
          <Button
            variant="outline"
            onClick={onClose}
            className="flex-1"
            data-ocid="mermas.cancel_button"
          >
            Cerrar
          </Button>
          <Button
            onClick={handleSave}
            className="flex-1"
            data-ocid="mermas.confirm_button"
          >
            Guardar mermas
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function OrdenesTab({
  currency,
  onTerminadosChange,
}: { currency: string; onTerminadosChange: () => void }) {
  const refresh = useForceUpdate();
  const [mermasOrden, setMermasOrden] = useState<OrdenProduccion | null>(null);

  const ordenes = getOrdenes().slice().reverse();

  const handleIniciar = (orden: OrdenProduccion) => {
    // Deduct insumos
    for (const req of orden.insumosRequeridos) {
      if (!req.insumoId) return;
      const ins = getInsumos().find((i) => i.id === req.insumoId);
      if (ins) {
        const newCant = Math.max(0, ins.cantidad - req.cantidadRequerida);
        updateInsumo(req.insumoId, {
          cantidad: newCant,
          costoTotal: newCant * ins.costoUnitario,
        });
        addMovimiento({
          insumoId: req.insumoId,
          tipo: "salida",
          cantidad: req.cantidadRequerida,
          motivo: `Orden de producción ${orden.id.slice(0, 6)}`,
          fecha: new Date().toISOString(),
          ordenId: orden.id,
        });
      }
    }
    updateOrden(orden.id, { estado: "en_proceso" });
    toast.success("Orden iniciada – insumos descontados");
    refresh();
  };

  const handleCompletar = (orden: OrdenProduccion) => {
    updateOrden(orden.id, {
      estado: "completado",
      fechaCompletado: new Date().toISOString(),
    });
    addTerminado({
      ordenId: orden.id,
      fichaId: orden.fichaId,
      nombre: orden.nombreFicha,
      cantidad: orden.cantidadProducida,
      cantidadDisponible: orden.cantidadProducida,
      costoUnitario: orden.costoPorUnidad,
      costoTotal: orden.costoTotal,
      fechaProduccion: new Date().toISOString(),
      transferencias: [],
    });
    toast.success("Orden completada – producto terminado creado");
    refresh();
    onTerminadosChange();
  };

  const handleCancelar = (orden: OrdenProduccion) => {
    if (
      !window.confirm(
        "¿Cancelar esta orden? Los insumos consumidos NO se restauran automáticamente.",
      )
    )
      return;
    updateOrden(orden.id, { estado: "cancelado" });
    toast.success("Orden cancelada");
    refresh();
  };

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      <ScrollArea className="flex-1">
        {ordenes.length === 0 ? (
          <div
            className="flex flex-col items-center justify-center py-16 text-muted-foreground"
            data-ocid="ordenes.empty_state"
          >
            <Factory size={40} className="mb-3 opacity-30" />
            <p className="text-sm">Sin órdenes de producción</p>
            <p className="text-xs">Toca + para crear la primera</p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {ordenes.map((orden, idx) => (
              <div
                key={orden.id}
                className="px-4 py-3 space-y-2"
                data-ocid={`ordenes.item.${idx + 1}`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      {orden.nombreFicha}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {orden.cantidadLotes} lote(s) · {orden.cantidadProducida}{" "}
                      unid. · {currency}
                      {fmt(orden.costoTotal)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(orden.fechaCreacion).toLocaleDateString(
                        "es-ES",
                      )}
                    </p>
                  </div>
                  <EstadoBadge estado={orden.estado} />
                </div>
                <div className="flex gap-1.5 flex-wrap">
                  {orden.estado === "pendiente" && (
                    <button
                      type="button"
                      onClick={() => handleIniciar(orden)}
                      className="text-xs px-2.5 py-1 rounded-lg bg-blue-100 text-blue-700 font-medium hover:bg-blue-200"
                      data-ocid={`ordenes.primary_button.${idx + 1}`}
                    >
                      Iniciar
                    </button>
                  )}
                  {orden.estado === "en_proceso" && (
                    <>
                      <button
                        type="button"
                        onClick={() => handleCompletar(orden)}
                        className="text-xs px-2.5 py-1 rounded-lg bg-emerald-100 text-emerald-700 font-medium hover:bg-emerald-200"
                        data-ocid={`ordenes.confirm_button.${idx + 1}`}
                      >
                        Completar
                      </button>
                      <button
                        type="button"
                        onClick={() => setMermasOrden(orden)}
                        className="text-xs px-2.5 py-1 rounded-lg bg-amber-100 text-amber-700 font-medium hover:bg-amber-200"
                        data-ocid={`ordenes.secondary_button.${idx + 1}`}
                      >
                        Ver mermas
                      </button>
                    </>
                  )}
                  {(orden.estado === "pendiente" ||
                    orden.estado === "en_proceso") && (
                    <button
                      type="button"
                      onClick={() => handleCancelar(orden)}
                      className="text-xs px-2.5 py-1 rounded-lg bg-red-100 text-red-700 font-medium hover:bg-red-200"
                      data-ocid={`ordenes.delete_button.${idx + 1}`}
                    >
                      Cancelar
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </ScrollArea>
      <NuevaOrdenDialog onCreated={() => refresh()} currency={currency} />
      {mermasOrden && (
        <MermasDialog
          orden={mermasOrden}
          onClose={() => setMermasOrden(null)}
          onSaved={() => refresh()}
        />
      )}
    </div>
  );
}

// ─────────────────────── Terminados Tab ─────────────────────────────────────

function TerminadosTab({
  currency,
  _refresh,
}: { currency: string; _refresh: number }) {
  const forceUpdate = useForceUpdate();
  const [transferDialog, setTransferDialog] =
    useState<ProductoTerminado | null>(null);
  const [transCantidad, setTransCantidad] = useState("");
  const [transDestino, setTransDestino] = useState("Inventario");

  const terminados = getTerminados().slice().reverse();
  const totalUnidades = terminados.reduce(
    (s, t) => s + t.cantidadDisponible,
    0,
  );
  const totalCosto = terminados.reduce((s, t) => s + t.costoTotal, 0);

  const handleTransferir = (pt: ProductoTerminado) => {
    const cant = Number.parseFloat(transCantidad) || 0;
    if (cant <= 0 || cant > pt.cantidadDisponible) {
      toast.error("Cantidad inválida o supera el disponible");
      return;
    }
    // Add to inventory (backend/actor not available for this; we update using localStorage product metadata)
    // We store a lightweight record in localStorage under 'produccion_transferencias_inv'
    const transferKey = "produccion_inv_transfers";
    let transfers: {
      nombre: string;
      cantidad: number;
      costoUnitario: number;
      fecha: string;
    }[] = [];
    try {
      transfers = JSON.parse(localStorage.getItem(transferKey) ?? "[]");
    } catch {
      /* noop */
    }
    transfers.push({
      nombre: pt.nombre,
      cantidad: cant,
      costoUnitario: pt.costoUnitario,
      fecha: new Date().toISOString(),
    });
    localStorage.setItem(transferKey, JSON.stringify(transfers));

    const newDisp = pt.cantidadDisponible - cant;
    const newTransferencias = [
      ...pt.transferencias,
      {
        id: crypto.randomUUID(),
        cantidad: cant,
        fecha: new Date().toISOString(),
        destino: transDestino,
      },
    ];
    updateTerminado(pt.id, {
      cantidadDisponible: newDisp,
      transferencias: newTransferencias,
    });
    toast.success(
      `${cant} unid. de "${pt.nombre}" transferidas a ${transDestino}`,
    );
    setTransferDialog(null);
    setTransCantidad("");
    forceUpdate();
  };

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      <div className="px-4 py-3 bg-emerald-50 border-b border-border">
        <div className="flex justify-between items-center">
          <div>
            <p className="text-xs text-emerald-700 font-medium">
              Unidades disponibles
            </p>
            <p className="text-2xl font-bold text-emerald-800">
              {totalUnidades}
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs text-emerald-700 font-medium">Valor total</p>
            <p className="text-lg font-bold text-emerald-800">
              {currency}
              {fmt(totalCosto)}
            </p>
          </div>
        </div>
      </div>
      <ScrollArea className="flex-1">
        {terminados.length === 0 ? (
          <div
            className="flex flex-col items-center justify-center py-16 text-muted-foreground"
            data-ocid="terminados.empty_state"
          >
            <Package size={40} className="mb-3 opacity-30" />
            <p className="text-sm">Sin productos terminados</p>
            <p className="text-xs">
              Completa órdenes de producción para ver productos aquí
            </p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {terminados.map((pt, idx) => (
              <div
                key={pt.id}
                className="px-4 py-3"
                data-ocid={`terminados.item.${idx + 1}`}
              >
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-lg bg-emerald-100 flex items-center justify-center shrink-0">
                    <Package size={16} className="text-emerald-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{pt.nombre}</p>
                    <p className="text-xs text-muted-foreground">
                      Producidos: {pt.cantidad} · Disponible:{" "}
                      {pt.cantidadDisponible}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Costo/u: {currency}
                      {fmt(pt.costoUnitario)} · Total: {currency}
                      {fmt(pt.costoTotal)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(pt.fechaProduccion).toLocaleDateString("es-ES")}
                    </p>
                  </div>
                </div>
                {pt.cantidadDisponible > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      setTransferDialog(pt);
                      setTransCantidad("");
                    }}
                    className="mt-2 w-full flex items-center justify-center gap-1.5 text-xs font-medium text-primary border border-primary/30 rounded-lg py-1.5 hover:bg-primary/5"
                    data-ocid={`terminados.primary_button.${idx + 1}`}
                  >
                    <Send size={12} /> Transferir a Inventario
                  </button>
                )}
                {pt.transferencias.length > 0 && (
                  <div className="mt-2 space-y-0.5">
                    <p className="text-xs text-muted-foreground font-medium">
                      Transferencias
                    </p>
                    {pt.transferencias.map((t) => (
                      <div
                        key={t.id}
                        className="text-xs flex justify-between text-muted-foreground"
                      >
                        <span>
                          {t.cantidad} u → {t.destino}
                        </span>
                        <span>
                          {new Date(t.fecha).toLocaleDateString("es-ES")}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </ScrollArea>

      {transferDialog && (
        <Dialog open onOpenChange={() => setTransferDialog(null)}>
          <DialogContent className="max-w-xs" data-ocid="terminados.dialog">
            <DialogHeader>
              <DialogTitle>Transferir a Inventario</DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <p className="text-sm font-medium">{transferDialog.nombre}</p>
              <p className="text-xs text-muted-foreground">
                Disponible: {transferDialog.cantidadDisponible} unid.
              </p>
              <div>
                <Label className="text-xs mb-1 block">
                  Cantidad a transferir
                </Label>
                <Input
                  type="number"
                  min="1"
                  max={transferDialog.cantidadDisponible}
                  value={transCantidad}
                  onChange={(e) => setTransCantidad(e.target.value)}
                  data-ocid="terminados.input"
                />
              </div>
              <div>
                <Label className="text-xs mb-1 block">Destino</Label>
                <Input
                  value={transDestino}
                  onChange={(e) => setTransDestino(e.target.value)}
                />
              </div>
            </div>
            <DialogFooter className="gap-2 flex-row">
              <Button
                variant="outline"
                onClick={() => setTransferDialog(null)}
                className="flex-1"
                data-ocid="terminados.cancel_button"
              >
                Cancelar
              </Button>
              <Button
                onClick={() => handleTransferir(transferDialog)}
                className="flex-1"
                data-ocid="terminados.confirm_button"
              >
                Transferir
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

// ──────────────────────── Main Component ────────────────────────────────────

export default function Produccion() {
  const [activeTab, setActiveTab] = useState<TabId>("insumos");
  const [terminadosKey, setTerminadosKey] = useState(0);
  const currency = getCurrencySymbol();

  return (
    <div className="flex flex-col flex-1 overflow-hidden h-full relative">
      {/* Tab bar */}
      <div className="border-b border-border bg-background shrink-0">
        <div
          className="flex overflow-x-auto scrollbar-hide"
          data-ocid="produccion.tab"
        >
          {TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 px-3 py-2.5 text-xs font-medium whitespace-nowrap transition-colors border-b-2 shrink-0 ${
                activeTab === tab.id
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
              data-ocid={`produccion.${tab.id}.tab`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab content */}
      {activeTab === "insumos" && <InsumosTab currency={currency} />}
      {activeTab === "produccion" && (
        <OrdenesTab
          currency={currency}
          onTerminadosChange={() => setTerminadosKey((k) => k + 1)}
        />
      )}
      {activeTab === "terminados" && (
        <TerminadosTab currency={currency} _refresh={terminadosKey} />
      )}
      {activeTab === "fichas" && <FichasTab currency={currency} />}
    </div>
  );
}
