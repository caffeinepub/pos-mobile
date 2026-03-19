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
import { Mail, Pencil, Phone, Plus, Trash2, UserCheck } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

interface Promoter {
  id: string;
  name: string;
  phone: string;
  email: string;
}

const STORAGE_KEY = "pos_promovedores";

function loadPromoters(): Promoter[] {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "[]");
  } catch {
    return [];
  }
}

function savePromoters(list: Promoter[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
}

function AddPromoterModal({
  open,
  onClose,
  onSaved,
}: {
  open: boolean;
  onClose: () => void;
  onSaved: (p: Promoter) => void;
}) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");

  const handleSave = () => {
    if (!name.trim()) {
      toast.error("El nombre del promovedor es obligatorio");
      return;
    }
    const newPromoter: Promoter = {
      id: Date.now().toString(),
      name: name.trim(),
      phone: phone.trim(),
      email: email.trim(),
    };
    onSaved(newPromoter);
    toast.success("Promovedor agregado");
    setName("");
    setPhone("");
    setEmail("");
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-sm mx-auto">
        <DialogHeader>
          <DialogTitle>Agregar promovedor</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="prom-name">
              Nombre <span className="text-destructive">*</span>
            </Label>
            <Input
              id="prom-name"
              placeholder="Nombre del promovedor..."
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="prom-phone">Teléfono (opcional)</Label>
            <Input
              id="prom-phone"
              placeholder="Ej. +1 555 0000"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="prom-email">Email (opcional)</Label>
            <Input
              id="prom-email"
              placeholder="Ej. promotor@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <Button className="w-full" onClick={handleSave}>
            Guardar promovedor
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function EditPromoterModal({
  promoter,
  onClose,
  onSaved,
}: {
  promoter: Promoter | null;
  onClose: () => void;
  onSaved: (p: Promoter) => void;
}) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");

  useEffect(() => {
    if (promoter) {
      setName(promoter.name);
      setPhone(promoter.phone);
      setEmail(promoter.email);
    }
  }, [promoter]);

  const handleUpdate = () => {
    if (!promoter) return;
    if (!name.trim()) {
      toast.error("El nombre del promovedor es obligatorio");
      return;
    }
    onSaved({
      ...promoter,
      name: name.trim(),
      phone: phone.trim(),
      email: email.trim(),
    });
    toast.success("Promovedor actualizado");
    onClose();
  };

  return (
    <Dialog open={promoter !== null} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-sm mx-auto">
        <DialogHeader>
          <DialogTitle>Editar promovedor</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="edit-prom-name">
              Nombre <span className="text-destructive">*</span>
            </Label>
            <Input
              id="edit-prom-name"
              placeholder="Nombre del promovedor..."
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="edit-prom-phone">Teléfono (opcional)</Label>
            <Input
              id="edit-prom-phone"
              placeholder="Ej. +1 555 0000"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="edit-prom-email">Email (opcional)</Label>
            <Input
              id="edit-prom-email"
              placeholder="Ej. promotor@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <Button className="w-full" onClick={handleUpdate}>
            Actualizar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default function Promovedores() {
  const [promoters, setPromoters] = useState<Promoter[]>(loadPromoters);
  const [showAdd, setShowAdd] = useState(false);
  const [editing, setEditing] = useState<Promoter | null>(null);

  const handleAdd = (p: Promoter) => {
    const updated = [...promoters, p];
    setPromoters(updated);
    savePromoters(updated);
  };

  const handleUpdate = (p: Promoter) => {
    const updated = promoters.map((x) => (x.id === p.id ? p : x));
    setPromoters(updated);
    savePromoters(updated);
  };

  const handleDelete = (p: Promoter) => {
    if (!confirm(`¿Eliminar a "${p.name}"?`)) return;
    const updated = promoters.filter((x) => x.id !== p.id);
    setPromoters(updated);
    savePromoters(updated);
    toast.success(`"${p.name}" eliminado`);
  };

  return (
    <div className="relative px-4 pb-6 pt-4">
      <p className="text-sm text-muted-foreground mb-4">
        {promoters.length} promovedores registrados
      </p>
      <ScrollArea className="h-[calc(100vh-180px)]">
        {promoters.length === 0 ? (
          <div className="py-16 text-center">
            <UserCheck
              size={40}
              className="mx-auto text-muted-foreground/30 mb-3"
            />
            <p className="text-muted-foreground">Sin promovedores</p>
          </div>
        ) : (
          <div className="space-y-2">
            {promoters.map((p, idx) => (
              <div
                key={p.id}
                data-ocid={`promovedores.item.${idx + 1}`}
                className="bg-card border border-border rounded-xl px-4 py-3 flex items-center gap-3 shadow-xs"
              >
                <div className="w-11 h-11 rounded-full bg-teal/15 flex items-center justify-center shrink-0">
                  <span className="text-teal font-bold text-base">
                    {p.name.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm">{p.name}</p>
                  <div className="flex items-center gap-3 mt-1">
                    {p.phone && (
                      <div className="flex items-center gap-1">
                        <Phone size={11} className="text-muted-foreground" />
                        <span className="text-xs text-muted-foreground">
                          {p.phone}
                        </span>
                      </div>
                    )}
                    {p.email && (
                      <div className="flex items-center gap-1">
                        <Mail size={11} className="text-muted-foreground" />
                        <span className="text-xs text-muted-foreground truncate max-w-[120px]">
                          {p.email}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    type="button"
                    onClick={() => setEditing(p)}
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                  >
                    <Pencil size={15} />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(p)}
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </ScrollArea>

      <button
        type="button"
        onClick={() => setShowAdd(true)}
        className="fixed bottom-6 right-6 w-14 h-14 rounded-full bg-primary text-primary-foreground shadow-lg flex items-center justify-center hover:opacity-90 active:scale-95 transition-all z-40"
      >
        <Plus size={24} />
      </button>

      <AddPromoterModal
        open={showAdd}
        onClose={() => setShowAdd(false)}
        onSaved={handleAdd}
      />
      <EditPromoterModal
        promoter={editing}
        onClose={() => setEditing(null)}
        onSaved={handleUpdate}
      />
    </div>
  );
}
