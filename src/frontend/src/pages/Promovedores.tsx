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
  FileDown,
  FileUp,
  LayoutGrid,
  LayoutList,
  Mail,
  MoreVertical,
  Pencil,
  Phone,
  Plus,
  Search,
  Trash2,
  UserCheck,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { buildFileHeader, buildHtmlHeader } from "../utils/businessData";

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
      toast.error("El nombre del proveedor es obligatorio");
      return;
    }
    const newPromoter: Promoter = {
      id: Date.now().toString(),
      name: name.trim(),
      phone: phone.trim(),
      email: email.trim(),
    };
    onSaved(newPromoter);
    toast.success("Proveedor agregado");
    setName("");
    setPhone("");
    setEmail("");
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-sm mx-auto">
        <DialogHeader>
          <DialogTitle>Agregar proveedor</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="prom-name">
              Nombre <span className="text-destructive">*</span>
            </Label>
            <Input
              id="prom-name"
              placeholder="Nombre del proveedor..."
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
              placeholder="Ej. proveedor@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <Button className="w-full" onClick={handleSave}>
            Guardar proveedor
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
      toast.error("El nombre del proveedor es obligatorio");
      return;
    }
    onSaved({
      ...promoter,
      name: name.trim(),
      phone: phone.trim(),
      email: email.trim(),
    });
    toast.success("Proveedor actualizado");
    onClose();
  };

  return (
    <Dialog open={promoter !== null} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-sm mx-auto">
        <DialogHeader>
          <DialogTitle>Editar proveedor</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="edit-prom-name">
              Nombre <span className="text-destructive">*</span>
            </Label>
            <Input
              id="edit-prom-name"
              placeholder="Nombre del proveedor..."
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
              placeholder="Ej. proveedor@email.com"
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
  const [searchTerm, setSearchTerm] = useState("");
  const [showSearch, setShowSearch] = useState(false);
  const csvImportRef = useRef<HTMLInputElement>(null);
  const [viewMode, setViewMode] = useState<"list" | "grid">("list");

  const filteredPromoters = searchTerm
    ? promoters.filter(
        (p) =>
          p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          p.phone.toLowerCase().includes(searchTerm.toLowerCase()) ||
          p.email.toLowerCase().includes(searchTerm.toLowerCase()),
      )
    : promoters;

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

  const exportCSV = () => {
    const header = buildFileHeader();
    const cols = "Nombre,Teléfono,Email";
    const rows = filteredPromoters.map(
      (p) => `${p.name},${p.phone},${p.email}`,
    );
    const csv = `${header
      .split("\n")
      .map((l) => `# ${l}`)
      .join("\n")}\n${[cols, ...rows].join("\n")}`;
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `proveedores_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportPDF = () => {
    const htmlHeader = buildHtmlHeader();
    const rows = filteredPromoters
      .map(
        (p) =>
          `<tr><td>${p.name}</td><td>${p.phone}</td><td>${p.email}</td></tr>`,
      )
      .join("");
    const html = `<html><head><title>Proveedores</title><style>body{font-family:sans-serif;padding:20px}table{width:100%;border-collapse:collapse}th,td{border:1px solid #ddd;padding:8px;text-align:left}th{background:#0B2040;color:white}.header{margin-bottom:16px;padding:12px;background:#f5f5f5;border-radius:6px}</style></head><body><div class="header">${htmlHeader}</div><h2>Lista de Proveedores</h2><table><thead><tr><th>Nombre</th><th>Teléfono</th><th>Email</th></tr></thead><tbody>${rows}</tbody></table></body></html>`;
    const win = window.open("", "_blank");
    if (win) {
      win.document.write(html);
      win.document.close();
      win.print();
    }
  };

  const importCSV = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    toast.info("Importación CSV recibida (funcionalidad próximamente)");
    e.target.value = "";
  };

  return (
    <div className="relative px-4 pb-6 pt-4">
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-muted-foreground">
          {filteredPromoters.length} proveedores registrados
        </p>
        <div className="flex items-center gap-1 ml-auto mr-1">
          <button
            type="button"
            onClick={() => setViewMode("list")}
            className={`p-1.5 rounded-lg transition-colors ${viewMode === "list" ? "bg-muted text-foreground" : "text-muted-foreground hover:bg-muted"}`}
          >
            <LayoutList size={16} />
          </button>
          <button
            type="button"
            onClick={() => setViewMode("grid")}
            className={`p-1.5 rounded-lg transition-colors ${viewMode === "grid" ? "bg-muted text-foreground" : "text-muted-foreground hover:bg-muted"}`}
          >
            <LayoutGrid size={16} />
          </button>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className="p-2 rounded-lg hover:bg-muted transition-colors"
              data-ocid="proveedores.dropdown_menu"
            >
              <MoreVertical size={18} className="text-muted-foreground" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem onClick={() => setShowSearch(!showSearch)}>
              <Search size={14} className="mr-2" /> Buscar
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => csvImportRef.current?.click()}>
              <FileUp size={14} className="mr-2" /> Importar CSV
            </DropdownMenuItem>
            <DropdownMenuItem onClick={exportCSV}>
              <FileDown size={14} className="mr-2" /> Exportar CSV
            </DropdownMenuItem>
            <DropdownMenuItem onClick={exportPDF}>
              <FileDown size={14} className="mr-2" /> Exportar PDF
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        <input
          ref={csvImportRef}
          type="file"
          accept=".csv"
          className="hidden"
          onChange={importCSV}
        />
      </div>
      {showSearch && (
        <div className="mb-3">
          <input
            type="text"
            placeholder="Buscar proveedor..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>
      )}
      <ScrollArea className="h-[calc(100vh-180px)]">
        {promoters.length === 0 ? (
          <div className="py-16 text-center">
            <UserCheck
              size={40}
              className="mx-auto text-muted-foreground/30 mb-3"
            />
            <p className="text-muted-foreground">Sin proveedores</p>
          </div>
        ) : (
          <>
            {viewMode === "list" ? (
              <div className="space-y-2">
                {filteredPromoters.map((p, idx) => (
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
                            <Phone
                              size={11}
                              className="text-muted-foreground"
                            />
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
            ) : (
              <div className="grid grid-cols-2 gap-3">
                {filteredPromoters.map((p, idx) => (
                  <div
                    key={p.id}
                    data-ocid={`promovedores.item.${idx + 1}`}
                    className="bg-card border border-border rounded-xl p-3 flex flex-col items-center gap-2 shadow-xs text-center"
                  >
                    <div className="w-10 h-10 rounded-full bg-teal/15 flex items-center justify-center">
                      <span className="text-teal font-bold text-base">
                        {p.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <p className="font-semibold text-xs truncate w-full">
                      {p.name}
                    </p>
                    {p.phone && (
                      <p className="text-xs text-muted-foreground truncate w-full">
                        {p.phone}
                      </p>
                    )}
                    <div className="flex items-center justify-end gap-1 w-full">
                      <button
                        type="button"
                        onClick={() => setEditing(p)}
                        className="p-1 rounded hover:bg-muted"
                      >
                        <Pencil size={13} />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(p)}
                        className="p-1 rounded hover:bg-destructive/10 text-destructive"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
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
