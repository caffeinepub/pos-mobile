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
  ArrowLeft,
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
  codigo: string;
  name: string;
  reeup: string;
  email: string;
  phone: string;
  nit: string;
  direccion: string;
  cuentaBancaria: string;
  icrr: string;
  provincia: string;
  pais: string;
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

// ── Shared form ───────────────────────────────────────────────────────────────
interface PromoterFormState {
  codigo: string;
  name: string;
  reeup: string;
  email: string;
  phone: string;
  nit: string;
  direccion: string;
  cuentaBancaria: string;
  icrr: string;
  provincia: string;
  pais: string;
}

function emptyForm(): PromoterFormState {
  return {
    codigo: "",
    name: "",
    reeup: "",
    email: "",
    phone: "",
    nit: "",
    direccion: "",
    cuentaBancaria: "",
    icrr: "",
    provincia: "",
    pais: "",
  };
}

function PromoterFormFields({
  form,
  onChange,
  prefix,
}: {
  form: PromoterFormState;
  onChange: (f: PromoterFormState) => void;
  prefix: string;
}) {
  const set = (key: keyof PromoterFormState, value: string) => {
    const updated = { ...form, [key]: value };
    if (key === "nit") {
      updated.codigo = value.slice(-5);
    }
    onChange(updated);
  };

  return (
    <div className="space-y-3">
      <div className="space-y-1.5">
        <Label htmlFor={`${prefix}-codigo`}>Código (auto)</Label>
        <Input
          id={`${prefix}-codigo`}
          value={form.codigo}
          readOnly
          className="bg-muted text-muted-foreground cursor-not-allowed"
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor={`${prefix}-name`}>
          Nombre <span className="text-destructive">*</span>
        </Label>
        <Input
          id={`${prefix}-name`}
          placeholder="Nombre del proveedor..."
          value={form.name}
          onChange={(e) => set("name", e.target.value)}
          data-ocid={`${prefix}.input`}
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor={`${prefix}-reeup`}>Código REEUP</Label>
        <Input
          id={`${prefix}-reeup`}
          placeholder="Código REEUP..."
          value={form.reeup}
          onChange={(e) => set("reeup", e.target.value)}
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor={`${prefix}-email`}>Correo</Label>
        <Input
          id={`${prefix}-email`}
          type="email"
          placeholder="proveedor@email.com"
          value={form.email}
          onChange={(e) => set("email", e.target.value)}
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor={`${prefix}-phone`}>Teléfono</Label>
        <Input
          id={`${prefix}-phone`}
          placeholder="Ej. +53 5 000 0000"
          value={form.phone}
          onChange={(e) => set("phone", e.target.value)}
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor={`${prefix}-nit`}>
          NIT <span className="text-destructive">*</span>
        </Label>
        <Input
          id={`${prefix}-nit`}
          placeholder="Número de Identificación Tributaria..."
          value={form.nit}
          onChange={(e) => set("nit", e.target.value)}
          data-ocid={`${prefix}.nit_input`}
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor={`${prefix}-direccion`}>Dirección</Label>
        <Input
          id={`${prefix}-direccion`}
          placeholder="Dirección..."
          value={form.direccion}
          onChange={(e) => set("direccion", e.target.value)}
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor={`${prefix}-cuenta`}>Cuenta Bancaria</Label>
        <Input
          id={`${prefix}-cuenta`}
          placeholder="Número de cuenta bancaria..."
          value={form.cuentaBancaria}
          onChange={(e) => set("cuentaBancaria", e.target.value)}
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor={`${prefix}-icrr`}>ICRR</Label>
        <Input
          id={`${prefix}-icrr`}
          placeholder="ICRR..."
          value={form.icrr}
          onChange={(e) => set("icrr", e.target.value)}
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor={`${prefix}-provincia`}>Provincia</Label>
        <Input
          id={`${prefix}-provincia`}
          placeholder="Provincia..."
          value={form.provincia}
          onChange={(e) => set("provincia", e.target.value)}
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor={`${prefix}-pais`}>País</Label>
        <Input
          id={`${prefix}-pais`}
          placeholder="País..."
          value={form.pais}
          onChange={(e) => set("pais", e.target.value)}
        />
      </div>
    </div>
  );
}

// ── Add Modal ─────────────────────────────────────────────────────────────────
function AddPromoterModal({
  open,
  onClose,
  onSaved,
}: {
  open: boolean;
  onClose: () => void;
  onSaved: (p: Promoter) => void;
}) {
  const [form, setForm] = useState<PromoterFormState>(emptyForm);

  const handleSave = () => {
    if (!form.name.trim()) {
      toast.error("El nombre del proveedor es obligatorio");
      return;
    }
    if (!form.nit.trim()) {
      toast.error("El NIT del proveedor es obligatorio");
      return;
    }
    const newPromoter: Promoter = {
      id: Date.now().toString(),
      codigo: form.codigo,
      name: form.name.trim(),
      reeup: form.reeup.trim(),
      email: form.email.trim(),
      phone: form.phone.trim(),
      nit: form.nit.trim(),
      direccion: form.direccion.trim(),
      cuentaBancaria: form.cuentaBancaria.trim(),
      icrr: form.icrr.trim(),
      provincia: form.provincia.trim(),
      pais: form.pais.trim(),
    };
    onSaved(newPromoter);
    toast.success("Proveedor agregado");
    setForm(emptyForm());
    onClose();
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-background flex flex-col"
      data-ocid="add_prov.dialog"
    >
      <div className="flex items-center gap-3 px-4 py-3 border-b shrink-0 bg-background">
        <button
          onClick={onClose}
          className="p-1 rounded hover:bg-muted transition-colors"
          type="button"
          aria-label="Volver"
          data-ocid="add_prov.close_button"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <h2 className="text-lg font-semibold flex-1 text-center pr-6">
          Agregar proveedor
        </h2>
      </div>
      <ScrollArea className="flex-1 overflow-auto">
        <div className="px-5 pb-6 space-y-5 pt-4">
          <PromoterFormFields
            form={form}
            onChange={setForm}
            prefix="add_prov"
          />
        </div>
      </ScrollArea>
      <div className="px-4 py-3 border-t shrink-0 bg-background">
        <Button
          className="w-full"
          onClick={handleSave}
          data-ocid="add_prov.submit_button"
        >
          Guardar proveedor
        </Button>
      </div>
    </div>
  );
}

// ── Edit Modal ────────────────────────────────────────────────────────────────
function EditPromoterModal({
  promoter,
  onClose,
  onSaved,
}: {
  promoter: Promoter | null;
  onClose: () => void;
  onSaved: (p: Promoter) => void;
}) {
  const [form, setForm] = useState<PromoterFormState>(emptyForm);

  useEffect(() => {
    if (promoter) {
      setForm({
        codigo: promoter.codigo ?? "",
        name: promoter.name,
        reeup: promoter.reeup ?? "",
        email: promoter.email,
        phone: promoter.phone,
        nit: promoter.nit ?? "",
        direccion: promoter.direccion ?? "",
        cuentaBancaria: promoter.cuentaBancaria ?? "",
        icrr: promoter.icrr ?? "",
        provincia: promoter.provincia ?? "",
        pais: promoter.pais ?? "",
      });
    }
  }, [promoter]);

  const handleUpdate = () => {
    if (!promoter) return;
    if (!form.name.trim()) {
      toast.error("El nombre del proveedor es obligatorio");
      return;
    }
    if (!form.nit.trim()) {
      toast.error("El NIT del proveedor es obligatorio");
      return;
    }
    onSaved({
      ...promoter,
      codigo: form.codigo,
      name: form.name.trim(),
      reeup: form.reeup.trim(),
      email: form.email.trim(),
      phone: form.phone.trim(),
      nit: form.nit.trim(),
      direccion: form.direccion.trim(),
      cuentaBancaria: form.cuentaBancaria.trim(),
      icrr: form.icrr.trim(),
      provincia: form.provincia.trim(),
      pais: form.pais.trim(),
    });
    toast.success("Proveedor actualizado");
    onClose();
  };

  return (
    <Dialog open={promoter !== null} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-sm mx-auto max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Editar proveedor</DialogTitle>
        </DialogHeader>
        <div className="flex-1 overflow-hidden">
          <PromoterFormFields
            form={form}
            onChange={setForm}
            prefix="edit_prov"
          />
        </div>
        <Button className="w-full mt-4 shrink-0" onClick={handleUpdate}>
          Actualizar
        </Button>
      </DialogContent>
    </Dialog>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────
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
          p.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (p.nit ?? "").toLowerCase().includes(searchTerm.toLowerCase()),
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
    const cols = "Nombre,NIT,Código,Teléfono,Email,Provincia,País";
    const rows = filteredPromoters.map(
      (p) =>
        `${p.name},${p.nit ?? ""},${p.codigo ?? ""},${p.phone},${p.email},${p.provincia ?? ""},${p.pais ?? ""}`,
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
          `<tr><td>${p.name}</td><td>${p.nit ?? ""}</td><td>${p.codigo ?? ""}</td><td>${p.phone}</td><td>${p.email}</td><td>${p.provincia ?? ""}</td><td>${p.pais ?? ""}</td></tr>`,
      )
      .join("");
    const html = `<html><head><title>Proveedores</title><style>body{font-family:sans-serif;padding:20px}table{width:100%;border-collapse:collapse}th,td{border:1px solid #ddd;padding:8px;text-align:left}th{background:#0B2040;color:white}.header{margin-bottom:16px;padding:12px;background:#f5f5f5;border-radius:6px}</style></head><body><div class="header">${htmlHeader}</div><h2>Lista de Proveedores</h2><table><thead><tr><th>Nombre</th><th>NIT</th><th>Código</th><th>Teléfono</th><th>Email</th><th>Provincia</th><th>País</th></tr></thead><tbody>${rows}</tbody></table></body></html>`;
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
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      const lines = text
        .split("\n")
        .filter((l) => l.trim() && !l.startsWith("#"));
      if (lines.length < 2) {
        toast.error("Archivo CSV vacío o sin datos");
        return;
      }
      const dataLines = lines.slice(1);
      let imported = 0;
      for (const line of dataLines) {
        const parts = line.split(",").map((p) => p.trim());
        const [nombre, nit, codigo, telefono, email, provincia, pais] = parts;
        if (!nombre) continue;
        const newPromoter: Promoter = {
          id: crypto.randomUUID(),
          codigo: codigo ?? nit?.slice(-5) ?? "",
          name: nombre,
          reeup: "",
          email: email ?? "",
          phone: telefono ?? "",
          nit: nit ?? "",
          direccion: "",
          cuentaBancaria: "",
          icrr: "",
          provincia: provincia ?? "",
          pais: pais ?? "",
        };
        setPromoters((prev) => {
          const updated = [...prev, newPromoter];
          savePromoters(updated);
          return updated;
        });
        imported++;
      }
      toast.success(`${imported} proveedores importados`);
    };
    reader.readAsText(file);
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
            className={`p-1.5 rounded-lg transition-colors ${
              viewMode === "list"
                ? "bg-muted text-foreground"
                : "text-muted-foreground hover:bg-muted"
            }`}
          >
            <LayoutList size={16} />
          </button>
          <button
            type="button"
            onClick={() => setViewMode("grid")}
            className={`p-1.5 rounded-lg transition-colors ${
              viewMode === "grid"
                ? "bg-muted text-foreground"
                : "text-muted-foreground hover:bg-muted"
            }`}
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
          <div
            className="py-16 text-center"
            data-ocid="promovedores.empty_state"
          >
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
                      {p.nit && (
                        <p className="text-xs text-muted-foreground">
                          NIT: {p.nit}
                          {p.codigo ? ` · Cód: ${p.codigo}` : ""}
                        </p>
                      )}
                      <div className="flex items-center gap-3 mt-0.5">
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
                    {p.nit && (
                      <p className="text-xs text-muted-foreground truncate w-full">
                        NIT: {p.nit}
                      </p>
                    )}
                    {p.codigo && (
                      <p className="text-xs text-muted-foreground truncate w-full">
                        Cód: {p.codigo}
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
        data-ocid="proveedores.open_modal_button"
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
