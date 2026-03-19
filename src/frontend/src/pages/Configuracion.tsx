import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Check,
  CreditCard,
  Pencil,
  Plus,
  Settings,
  Trash2,
  X,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import {
  useCreatePaymentType,
  useDeletePaymentType,
  usePaymentTypes,
  useUpdatePaymentType,
} from "../hooks/useQueries";

export default function Configuracion() {
  const { data: paymentTypes = [], isLoading } = usePaymentTypes();
  const createPT = useCreatePaymentType();
  const deletePT = useDeletePaymentType();
  const updatePT = useUpdatePaymentType();

  const [expandedId, setExpandedId] = useState<bigint | null>(null);
  const [editingId, setEditingId] = useState<bigint | null>(null);
  const [editName, setEditName] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);
  const [newName, setNewName] = useState("");

  const toggleExpand = (id: bigint) => {
    setExpandedId((prev) => (prev === id ? null : id));
    setEditingId(null);
  };

  const startEdit = (id: bigint, name: string) => {
    setEditingId(id);
    setEditName(name);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditName("");
  };

  const handleSaveEdit = async (id: bigint) => {
    const name = editName.trim();
    if (!name) return;
    await updatePT.mutateAsync({ id, name });
    setEditingId(null);
    setEditName("");
    toast.success("Tipo de pago actualizado");
  };

  const handleAdd = async () => {
    const name = newName.trim();
    if (!name) return;
    await createPT.mutateAsync(name);
    setNewName("");
    setShowAddForm(false);
    toast.success(`Tipo de pago "${name}" agregado`);
  };

  return (
    <div className="px-4 pb-6 pt-4 space-y-6">
      {/* App info */}
      <div className="bg-card border border-border rounded-xl p-4 flex items-center gap-3">
        <div className="w-12 h-12 rounded-xl bg-navy flex items-center justify-center">
          <Settings size={20} className="text-teal" />
        </div>
        <div>
          <p className="font-bold">POS Mobile</p>
          <p className="text-xs text-muted-foreground">Punto de Venta v1.0</p>
        </div>
      </div>

      {/* Payment types management */}
      <div className="bg-card border border-border rounded-xl overflow-hidden shadow-xs">
        {/* Header with + button */}
        <div className="flex items-center gap-2 px-4 py-3 border-b border-border">
          <CreditCard size={16} className="text-teal" />
          <span className="font-semibold text-sm flex-1">Tipos de pago</span>
          <button
            type="button"
            onClick={() => setShowAddForm((v) => !v)}
            className="w-7 h-7 rounded-full bg-teal flex items-center justify-center text-white hover:bg-teal/80 transition-colors"
            aria-label="Agregar tipo de pago"
          >
            <Plus size={15} />
          </button>
        </div>

        {/* Add form (inline, shown when + clicked) */}
        {showAddForm && (
          <div className="px-4 py-3 border-b border-border flex gap-2 bg-muted/30">
            <Input
              placeholder="Nombre del tipo de pago..."
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleAdd();
              }}
              className="flex-1 h-8 text-sm"
              autoFocus
            />
            <button
              type="button"
              onClick={handleAdd}
              disabled={!newName.trim() || createPT.isPending}
              className="px-3 h-8 rounded-lg bg-teal text-white text-sm hover:bg-teal/80 disabled:opacity-50 transition-colors"
            >
              Agregar
            </button>
            <button
              type="button"
              onClick={() => {
                setShowAddForm(false);
                setNewName("");
              }}
              className="px-2 h-8 rounded-lg border border-border text-muted-foreground hover:bg-muted transition-colors"
            >
              <X size={14} />
            </button>
          </div>
        )}

        {isLoading ? (
          <div className="p-4 space-y-2">
            {[1, 2].map((i) => (
              <div key={i} className="h-10 bg-muted rounded-lg animate-pulse" />
            ))}
          </div>
        ) : paymentTypes.length === 0 ? (
          <div className="py-8 text-center">
            <p className="text-muted-foreground text-sm">Sin tipos de pago</p>
          </div>
        ) : (
          <ScrollArea className="max-h-80">
            <div className="divide-y divide-border">
              {paymentTypes.map((pt, idx) => (
                <div key={String(pt.id)} data-ocid={`config.item.${idx + 1}`}>
                  {/* Row - click to expand */}
                  <button
                    type="button"
                    onClick={() => toggleExpand(pt.id)}
                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-muted/40 transition-colors text-left"
                  >
                    <CreditCard size={15} className="text-teal shrink-0" />
                    <span className="text-sm flex-1">{pt.name}</span>
                  </button>

                  {/* Expanded actions */}
                  {expandedId === pt.id && (
                    <div className="px-4 pb-3 bg-muted/20">
                      {editingId === pt.id ? (
                        <div className="flex gap-2 items-center">
                          <Input
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") handleSaveEdit(pt.id);
                            }}
                            className="flex-1 h-8 text-sm"
                            autoFocus
                          />
                          <button
                            type="button"
                            onClick={() => handleSaveEdit(pt.id)}
                            disabled={!editName.trim() || updatePT.isPending}
                            className="p-1.5 rounded-lg bg-teal text-white hover:bg-teal/80 disabled:opacity-50 transition-colors"
                            aria-label="Guardar"
                          >
                            <Check size={14} />
                          </button>
                          <button
                            type="button"
                            onClick={cancelEdit}
                            className="p-1.5 rounded-lg border border-border text-muted-foreground hover:bg-muted transition-colors"
                            aria-label="Cancelar"
                          >
                            <X size={14} />
                          </button>
                        </div>
                      ) : (
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => startEdit(pt.id, pt.name)}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border text-sm hover:bg-muted transition-colors"
                            aria-label="Editar"
                          >
                            <Pencil size={13} />
                            <span>Editar</span>
                          </button>
                          <button
                            type="button"
                            onClick={async () => {
                              await deletePT.mutateAsync(pt.id);
                              setExpandedId(null);
                              toast.success(`"${pt.name}" eliminado`);
                            }}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-destructive/40 text-destructive text-sm hover:bg-destructive/10 transition-colors"
                            aria-label="Eliminar"
                          >
                            <Trash2 size={13} />
                            <span>Eliminar</span>
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </div>

      {/* Footer */}
      <p className="text-center text-xs text-muted-foreground/60">
        © {new Date().getFullYear()}.{" "}
        <a
          href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
          target="_blank"
          rel="noreferrer"
          className="hover:text-muted-foreground transition-colors"
        >
          caffeine.ai
        </a>
      </p>
    </div>
  );
}
