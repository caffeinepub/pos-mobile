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
  Loader2,
  Mail,
  MoreVertical,
  Pencil,
  Phone,
  Plus,
  Search,
  Trash2,
  Users,
} from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";
import type { Customer } from "../backend.d";
import {
  useCreateCustomer,
  useCustomers,
  useDeleteCustomer,
  useUpdateCustomer,
} from "../hooks/useQueries";
import { buildFileHeader, buildHtmlHeader } from "../utils/businessData";

// ── Customer extras stored in localStorage ──────────────────────────────────
interface CustomerExtras {
  codigo: string;
  reeup: string;
  nit: string;
  direccion: string;
  cuentaBancaria: string;
  icrr: string;
  provincia: string;
  pais: string;
}

const EXTRAS_KEY = "pos_customer_extras";

function loadAllCustomerExtras(): Record<string, CustomerExtras> {
  try {
    return JSON.parse(localStorage.getItem(EXTRAS_KEY) ?? "{}");
  } catch {
    return {};
  }
}

function getCustomerExtras(id: string): CustomerExtras {
  const all = loadAllCustomerExtras();
  return (
    all[id] ?? {
      codigo: "",
      reeup: "",
      nit: "",
      direccion: "",
      cuentaBancaria: "",
      icrr: "",
      provincia: "",
      pais: "",
    }
  );
}

function saveCustomerExtras(id: string, data: CustomerExtras) {
  const all = loadAllCustomerExtras();
  all[id] = data;
  localStorage.setItem(EXTRAS_KEY, JSON.stringify(all));
}

function removeCustomerExtras(id: string) {
  const all = loadAllCustomerExtras();
  delete all[id];
  localStorage.setItem(EXTRAS_KEY, JSON.stringify(all));
}

// ── Shared form fields ────────────────────────────────────────────────────────
interface ClientFormState {
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

function emptyForm(): ClientFormState {
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

function ClientFormFields({
  form,
  onChange,
  prefix,
}: {
  form: ClientFormState;
  onChange: (f: ClientFormState) => void;
  prefix: string;
}) {
  const set = (key: keyof ClientFormState, value: string) => {
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
          placeholder="Nombre del cliente..."
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
          placeholder="cliente@email.com"
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

// ── Add Modal ────────────────────────────────────────────────────────────────
function AddClientModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const [form, setForm] = useState<ClientFormState>(emptyForm);
  const createCustomer = useCreateCustomer();

  const handleSave = async () => {
    if (!form.name.trim()) {
      toast.error("El nombre del cliente es obligatorio");
      return;
    }
    if (!form.nit.trim()) {
      toast.error("El NIT del cliente es obligatorio");
      return;
    }
    try {
      const result = await createCustomer.mutateAsync({
        name: form.name.trim(),
        phone: form.phone.trim(),
        email: form.email.trim(),
      });
      // Save extras keyed by the new customer id
      if (result && typeof result === "object" && "id" in result) {
        const id = String((result as { id: unknown }).id);
        saveCustomerExtras(id, {
          codigo: form.codigo,
          reeup: form.reeup,
          nit: form.nit.trim(),
          direccion: form.direccion.trim(),
          cuentaBancaria: form.cuentaBancaria.trim(),
          icrr: form.icrr.trim(),
          provincia: form.provincia.trim(),
          pais: form.pais.trim(),
        });
      }
      toast.success("Cliente agregado");
      setForm(emptyForm());
      onClose();
    } catch (err) {
      toast.error(
        `Error al guardar: ${err instanceof Error ? err.message : "Error desconocido"}`,
      );
    }
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-background flex flex-col"
      data-ocid="add_client.dialog"
    >
      <div className="flex items-center gap-3 px-4 py-3 border-b shrink-0 bg-background">
        <button
          onClick={onClose}
          className="p-1 rounded hover:bg-muted transition-colors"
          type="button"
          aria-label="Volver"
          data-ocid="add_client.close_button"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <h2 className="text-lg font-semibold flex-1 text-center pr-6">
          Agregar cliente
        </h2>
      </div>
      <ScrollArea className="flex-1 overflow-auto">
        <div className="px-5 pb-6 space-y-5 pt-4">
          <ClientFormFields
            form={form}
            onChange={setForm}
            prefix="add_client"
          />
        </div>
      </ScrollArea>
      <div className="px-4 py-3 border-t shrink-0 bg-background">
        <Button
          className="w-full"
          onClick={handleSave}
          disabled={createCustomer.isPending}
          data-ocid="add_client.submit_button"
        >
          {createCustomer.isPending ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : null}
          {createCustomer.isPending ? "Guardando..." : "Guardar cliente"}
        </Button>
      </div>
    </div>
  );
}

// ── Edit Modal ───────────────────────────────────────────────────────────────
function EditClientModal({
  customer,
  onClose,
}: {
  customer: Customer | null;
  onClose: () => void;
}) {
  const extras = customer ? getCustomerExtras(String(customer.id)) : null;
  const [form, setForm] = useState<ClientFormState>(() =>
    customer
      ? {
          codigo: extras?.codigo ?? "",
          name: customer.name,
          reeup: extras?.reeup ?? "",
          email: customer.email,
          phone: customer.phone,
          nit: extras?.nit ?? "",
          direccion: extras?.direccion ?? "",
          cuentaBancaria: extras?.cuentaBancaria ?? "",
          icrr: extras?.icrr ?? "",
          provincia: extras?.provincia ?? "",
          pais: extras?.pais ?? "",
        }
      : emptyForm(),
  );
  const updateCustomer = useUpdateCustomer();

  const handleUpdate = async () => {
    if (!customer) return;
    if (!form.name.trim()) {
      toast.error("El nombre del cliente es obligatorio");
      return;
    }
    if (!form.nit.trim()) {
      toast.error("El NIT del cliente es obligatorio");
      return;
    }
    try {
      await updateCustomer.mutateAsync({
        id: customer.id,
        name: form.name.trim(),
        phone: form.phone.trim(),
        email: form.email.trim(),
      });
      saveCustomerExtras(String(customer.id), {
        codigo: form.codigo,
        reeup: form.reeup,
        nit: form.nit.trim(),
        direccion: form.direccion.trim(),
        cuentaBancaria: form.cuentaBancaria.trim(),
        icrr: form.icrr.trim(),
        provincia: form.provincia.trim(),
        pais: form.pais.trim(),
      });
      toast.success("Cliente actualizado");
      onClose();
    } catch (err) {
      toast.error(
        `Error al actualizar: ${err instanceof Error ? err.message : "Error desconocido"}`,
      );
    }
  };

  return (
    <Dialog
      open={customer !== null}
      onOpenChange={(v) => {
        if (!v) onClose();
      }}
    >
      <DialogContent
        className="max-w-sm mx-auto max-h-[90vh] overflow-hidden flex flex-col"
        data-ocid="edit_client.dialog"
      >
        <DialogHeader>
          <DialogTitle>Editar cliente</DialogTitle>
        </DialogHeader>
        <div className="flex-1 overflow-hidden">
          <ClientFormFields
            form={form}
            onChange={setForm}
            prefix="edit_client"
          />
        </div>
        <Button
          className="w-full mt-4 shrink-0"
          onClick={handleUpdate}
          disabled={updateCustomer.isPending}
          data-ocid="edit_client.submit_button"
        >
          {updateCustomer.isPending ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : null}
          {updateCustomer.isPending ? "Actualizando..." : "Actualizar"}
        </Button>
      </DialogContent>
    </Dialog>
  );
}

// ── Main Component ───────────────────────────────────────────────────────────
export default function Clientes() {
  const { data: customers = [], isLoading } = useCustomers();
  const deleteCustomer = useDeleteCustomer();
  const createCustomer = useCreateCustomer();
  const [showModal, setShowModal] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [showSearch, setShowSearch] = useState(false);
  const csvImportRef = useRef<HTMLInputElement>(null);
  const [viewMode, setViewMode] = useState<"list" | "grid">("list");

  const filteredCustomers = searchTerm
    ? customers.filter(
        (c) =>
          c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          c.phone.toLowerCase().includes(searchTerm.toLowerCase()) ||
          c.email.toLowerCase().includes(searchTerm.toLowerCase()),
      )
    : customers;

  const handleDelete = async (customer: Customer) => {
    if (!confirm(`¿Eliminar a "${customer.name}"?`)) return;
    try {
      await deleteCustomer.mutateAsync(customer.id);
      removeCustomerExtras(String(customer.id));
      toast.success(`"${customer.name}" eliminado`);
    } catch (err) {
      toast.error(
        `Error al eliminar: ${err instanceof Error ? err.message : "Error desconocido"}`,
      );
    }
  };

  const exportCSV = () => {
    const header = buildFileHeader();
    const cols = "Nombre,Teléfono,Email,NIT,Código,Provincia,País";
    const rows = filteredCustomers.map((c) => {
      const ex = getCustomerExtras(String(c.id));
      return `${c.name},${c.phone},${c.email},${ex.nit},${ex.codigo},${ex.provincia},${ex.pais}`;
    });
    const csv = `${header
      .split("\n")
      .map((l) => `# ${l}`)
      .join("\n")}\n${[cols, ...rows].join("\n")}`;
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `clientes_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportPDF = () => {
    const htmlHeader = buildHtmlHeader();
    const rows = filteredCustomers
      .map((c) => {
        const ex = getCustomerExtras(String(c.id));
        return `<tr><td>${c.name}</td><td>${ex.nit}</td><td>${ex.codigo}</td><td>${c.phone}</td><td>${c.email}</td><td>${ex.provincia}</td><td>${ex.pais}</td></tr>`;
      })
      .join("");
    const html = `<html><head><title>Clientes</title><style>body{font-family:sans-serif;padding:20px}table{width:100%;border-collapse:collapse}th,td{border:1px solid #ddd;padding:8px;text-align:left}th{background:#0B2040;color:white}.header{margin-bottom:16px;padding:12px;background:#f5f5f5;border-radius:6px}</style></head><body><div class="header">${htmlHeader}</div><h2>Lista de Clientes</h2><table><thead><tr><th>Nombre</th><th>NIT</th><th>Código</th><th>Teléfono</th><th>Email</th><th>Provincia</th><th>País</th></tr></thead><tbody>${rows}</tbody></table></body></html>`;
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
    reader.onload = async (ev) => {
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
        const [nombre, telefono, email, nit, codigo, provincia, pais] = parts;
        if (!nombre) continue;
        try {
          const newId = await createCustomer.mutateAsync({
            name: nombre,
            phone: telefono ?? "",
            email: email ?? "",
          });
          const extras: CustomerExtras = {
            codigo: codigo ?? nit?.slice(-5) ?? "",
            reeup: "",
            nit: nit ?? "",
            direccion: "",
            cuentaBancaria: "",
            icrr: "",
            provincia: provincia ?? "",
            pais: pais ?? "",
          };
          saveCustomerExtras(String(newId), extras);
          imported++;
        } catch {
          /* skip duplicate */
        }
      }
      toast.success(`${imported} clientes importados`);
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  return (
    <div className="relative px-4 pb-6 pt-4">
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-muted-foreground">
          {filteredCustomers.length} clientes registrados
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
              data-ocid="clientes.dropdown_menu"
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
            placeholder="Buscar cliente..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>
      )}
      <ScrollArea className="h-[calc(100vh-180px)]">
        {isLoading ? (
          <div className="space-y-3" data-ocid="clientes.loading_state">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-20 bg-muted rounded-xl animate-pulse" />
            ))}
          </div>
        ) : customers.length === 0 ? (
          <div className="py-16 text-center" data-ocid="clientes.empty_state">
            <Users
              size={40}
              className="mx-auto text-muted-foreground/30 mb-3"
            />
            <p className="text-muted-foreground">Sin clientes</p>
          </div>
        ) : (
          <>
            {viewMode === "list" ? (
              <div className="space-y-2">
                {filteredCustomers.map((c, idx) => {
                  const ex = getCustomerExtras(String(c.id));
                  return (
                    <div
                      key={String(c.id)}
                      data-ocid={`clientes.item.${idx + 1}`}
                      className="bg-card border border-border rounded-xl px-4 py-3 flex items-center gap-3 shadow-xs"
                    >
                      <div className="w-11 h-11 rounded-full bg-teal/15 flex items-center justify-center shrink-0">
                        <span className="text-teal font-bold text-base">
                          {c.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm">{c.name}</p>
                        {ex.nit && (
                          <p className="text-xs text-muted-foreground">
                            NIT: {ex.nit}
                            {ex.codigo ? ` · Cód: ${ex.codigo}` : ""}
                          </p>
                        )}
                        <div className="flex items-center gap-3 mt-0.5">
                          {c.phone && (
                            <div className="flex items-center gap-1">
                              <Phone
                                size={11}
                                className="text-muted-foreground"
                              />
                              <span className="text-xs text-muted-foreground">
                                {c.phone}
                              </span>
                            </div>
                          )}
                          {c.email && (
                            <div className="flex items-center gap-1">
                              <Mail
                                size={11}
                                className="text-muted-foreground"
                              />
                              <span className="text-xs text-muted-foreground truncate max-w-[120px]">
                                {c.email}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          type="button"
                          onClick={() => setEditingCustomer(c)}
                          data-ocid={`clientes.edit_button.${idx + 1}`}
                          className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                        >
                          <Pencil size={15} />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(c)}
                          data-ocid={`clientes.delete_button.${idx + 1}`}
                          className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                {filteredCustomers.map((c, idx) => {
                  const ex = getCustomerExtras(String(c.id));
                  return (
                    <div
                      key={String(c.id)}
                      data-ocid={`clientes.item.${idx + 1}`}
                      className="bg-card border border-border rounded-xl p-3 flex flex-col items-center gap-2 shadow-xs text-center"
                    >
                      <div className="w-10 h-10 rounded-full bg-teal/15 flex items-center justify-center">
                        <span className="text-teal font-bold text-base">
                          {c.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <p className="font-semibold text-xs truncate w-full">
                        {c.name}
                      </p>
                      {ex.nit && (
                        <p className="text-xs text-muted-foreground truncate w-full">
                          NIT: {ex.nit}
                        </p>
                      )}
                      {ex.codigo && (
                        <p className="text-xs text-muted-foreground truncate w-full">
                          Cód: {ex.codigo}
                        </p>
                      )}
                      <div className="flex items-center justify-end gap-1 w-full">
                        <button
                          type="button"
                          onClick={() => setEditingCustomer(c)}
                          className="p-1 rounded hover:bg-muted"
                        >
                          <Pencil size={13} />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(c)}
                          className="p-1 rounded hover:bg-destructive/10 text-destructive"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}
      </ScrollArea>

      {/* FAB */}
      <button
        type="button"
        onClick={() => setShowModal(true)}
        data-ocid="clientes.open_modal_button"
        className="fixed bottom-6 right-6 w-14 h-14 rounded-full bg-primary text-primary-foreground shadow-lg flex items-center justify-center hover:opacity-90 active:scale-95 transition-all z-40"
      >
        <Plus size={24} />
      </button>

      <AddClientModal open={showModal} onClose={() => setShowModal(false)} />
      <EditClientModal
        customer={editingCustomer}
        onClose={() => setEditingCustomer(null)}
      />
    </div>
  );
}
