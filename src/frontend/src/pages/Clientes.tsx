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

function AddClientModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const createCustomer = useCreateCustomer();

  const handleSave = async () => {
    if (!name.trim()) {
      toast.error("El nombre del cliente es obligatorio");
      return;
    }
    try {
      await createCustomer.mutateAsync({
        name: name.trim(),
        phone: phone.trim(),
        email: email.trim(),
      });
      toast.success("Cliente agregado");
      setName("");
      setPhone("");
      setEmail("");
      onClose();
    } catch (err) {
      toast.error(
        `Error al guardar: ${err instanceof Error ? err.message : "Error desconocido"}`,
      );
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-sm mx-auto" data-ocid="add_client.dialog">
        <DialogHeader>
          <DialogTitle>Agregar cliente</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="client-name">
              Nombre <span className="text-destructive">*</span>
            </Label>
            <Input
              id="client-name"
              placeholder="Nombre del cliente..."
              value={name}
              onChange={(e) => setName(e.target.value)}
              data-ocid="add_client.input"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="client-phone">Teléfono (opcional)</Label>
            <Input
              id="client-phone"
              placeholder="Ej. +1 555 0000"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              data-ocid="add_client.phone_input"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="client-email">Email (opcional)</Label>
            <Input
              id="client-email"
              placeholder="Ej. cliente@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              data-ocid="add_client.email_input"
            />
          </div>
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
      </DialogContent>
    </Dialog>
  );
}

function EditClientModal({
  customer,
  onClose,
}: {
  customer: Customer | null;
  onClose: () => void;
}) {
  const [name, setName] = useState(customer?.name ?? "");
  const [phone, setPhone] = useState(customer?.phone ?? "");
  const [email, setEmail] = useState(customer?.email ?? "");
  const updateCustomer = useUpdateCustomer();

  const open = customer !== null;

  const handleUpdate = async () => {
    if (!customer) return;
    if (!name.trim()) {
      toast.error("El nombre del cliente es obligatorio");
      return;
    }
    try {
      await updateCustomer.mutateAsync({
        id: customer.id,
        name: name.trim(),
        phone: phone.trim(),
        email: email.trim(),
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
      open={open}
      onOpenChange={(v) => {
        if (!v) onClose();
      }}
    >
      <DialogContent
        className="max-w-sm mx-auto"
        data-ocid="edit_client.dialog"
      >
        <DialogHeader>
          <DialogTitle>Editar cliente</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="edit-client-name">
              Nombre <span className="text-destructive">*</span>
            </Label>
            <Input
              id="edit-client-name"
              placeholder="Nombre del cliente..."
              value={name}
              onChange={(e) => setName(e.target.value)}
              data-ocid="edit_client.name_input"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="edit-client-phone">Teléfono (opcional)</Label>
            <Input
              id="edit-client-phone"
              placeholder="Ej. +1 555 0000"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              data-ocid="edit_client.phone_input"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="edit-client-email">Email (opcional)</Label>
            <Input
              id="edit-client-email"
              placeholder="Ej. cliente@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              data-ocid="edit_client.email_input"
            />
          </div>
          <Button
            className="w-full"
            onClick={handleUpdate}
            disabled={updateCustomer.isPending}
            data-ocid="edit_client.submit_button"
          >
            {updateCustomer.isPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : null}
            {updateCustomer.isPending ? "Actualizando..." : "Actualizar"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default function Clientes() {
  const { data: customers = [], isLoading } = useCustomers();
  const deleteCustomer = useDeleteCustomer();
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
      toast.success(`"${customer.name}" eliminado`);
    } catch (err) {
      toast.error(
        `Error al eliminar: ${err instanceof Error ? err.message : "Error desconocido"}`,
      );
    }
  };

  const exportCSV = () => {
    const header = buildFileHeader();
    const cols = "Nombre,Teléfono,Email";
    const rows = filteredCustomers.map(
      (c) => `${c.name},${c.phone},${c.email}`,
    );
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
      .map(
        (c) =>
          `<tr><td>${c.name}</td><td>${c.phone}</td><td>${c.email}</td></tr>`,
      )
      .join("");
    const html = `<html><head><title>Clientes</title><style>body{font-family:sans-serif;padding:20px}table{width:100%;border-collapse:collapse}th,td{border:1px solid #ddd;padding:8px;text-align:left}th{background:#0B2040;color:white}.header{margin-bottom:16px;padding:12px;background:#f5f5f5;border-radius:6px}</style></head><body><div class="header">${htmlHeader}</div><h2>Lista de Clientes</h2><table><thead><tr><th>Nombre</th><th>Teléfono</th><th>Email</th></tr></thead><tbody>${rows}</tbody></table></body></html>`;
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
          {filteredCustomers.length} clientes registrados
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
                {filteredCustomers.map((c, idx) => (
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
                      <div className="flex items-center gap-3 mt-1">
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
                            <Mail size={11} className="text-muted-foreground" />
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
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                {filteredCustomers.map((c, idx) => (
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
                    {c.phone && (
                      <p className="text-xs text-muted-foreground truncate w-full">
                        {c.phone}
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
                ))}
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
