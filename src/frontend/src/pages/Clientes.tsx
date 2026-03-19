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
import {
  Loader2,
  Mail,
  Pencil,
  Phone,
  Plus,
  Trash2,
  Users,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import type { Customer } from "../backend.d";
import {
  useCreateCustomer,
  useCustomers,
  useDeleteCustomer,
  useUpdateCustomer,
} from "../hooks/useQueries";

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

  return (
    <div className="relative px-4 pb-6 pt-4">
      <p className="text-sm text-muted-foreground mb-4">
        {customers.length} clientes registrados
      </p>
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
          <div className="space-y-2">
            {customers.map((c, idx) => (
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
                        <Phone size={11} className="text-muted-foreground" />
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
                {/* Edit / Delete icons */}
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
