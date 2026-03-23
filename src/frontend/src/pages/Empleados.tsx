import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import {
  ArrowLeft,
  Banknote,
  Calendar,
  CheckCircle,
  Clock,
  Download,
  FileText,
  LayoutGrid,
  LayoutList,
  MoreVertical,
  Pencil,
  Plus,
  Search,
  Trash2,
  Users,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

// ── Types ─────────────────────────────────────────────────────────────────────

interface Empleado {
  id: string;
  codigo: string;
  nombre: string;
  ci: string;
  cargo: string;
  categoria: string;
  escalaSalarial: string;
  salarioBase: number;
  fechaIngreso: string;
  telefono: string;
  correo: string;
  direccion: string;
  observaciones: string;
  activo: boolean;
}

interface DiasEmpleado {
  id: string;
  empleadoId: string;
  mes: number;
  anio: number;
  diasLaborables: number;
  diasTrabajados: number;
  diasNoLaborados: number;
  vacaciones: number;
  licenciasMedicas: number;
  licenciasOtras: number;
}

interface Nomina {
  id: string;
  empleadoId: string;
  mes: number;
  anio: number;
  salarioBase: number;
  diasLaborables: number;
  diasTrabajados: number;
  salarioDevengado: number;
  descuentoSegSocial: number;
  descuentoImpuesto: number;
  bonificaciones: number;
  otrosDescuentos: number;
  salarioNeto: number;
  estado: "pendiente" | "pagado";
  fechaPago?: string;
  metodoPago?: string;
  notas: string;
}

// ── localStorage helpers ───────────────────────────────────────────────────────

const EMP_KEY = "pos_empleados";
const DIAS_KEY = "pos_dias_trabajados";
const NOMINA_KEY = "pos_nomina";

function loadEmpleados(): Empleado[] {
  try {
    return JSON.parse(localStorage.getItem(EMP_KEY) ?? "[]");
  } catch {
    return [];
  }
}
function saveEmpleados(list: Empleado[]) {
  localStorage.setItem(EMP_KEY, JSON.stringify(list));
}

function loadDias(): DiasEmpleado[] {
  try {
    return JSON.parse(localStorage.getItem(DIAS_KEY) ?? "[]");
  } catch {
    return [];
  }
}
function saveDias(list: DiasEmpleado[]) {
  localStorage.setItem(DIAS_KEY, JSON.stringify(list));
}

function loadNominas(): Nomina[] {
  try {
    return JSON.parse(localStorage.getItem(NOMINA_KEY) ?? "[]");
  } catch {
    return [];
  }
}
function saveNominas(list: Nomina[]) {
  localStorage.setItem(NOMINA_KEY, JSON.stringify(list));
}

function getCurrency(): string {
  try {
    const c = JSON.parse(localStorage.getItem("pos_currency") ?? "null");
    return c?.symbol ?? "$";
  } catch {
    return "$";
  }
}

function getBusinessSettings() {
  try {
    return JSON.parse(localStorage.getItem("pos_business_settings") ?? "{}");
  } catch {
    return {};
  }
}

function genId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}

function nextCodigo(list: Empleado[]): string {
  const nums = list.map((e) => {
    const m = e.codigo.match(/(\d+)$/);
    return m ? Number.parseInt(m[1]) : 0;
  });
  const max = nums.length > 0 ? Math.max(...nums) : 0;
  return `EMP-${String(max + 1).padStart(4, "0")}`;
}

function calcImpuesto(devengado: number): number {
  if (devengado <= 2500) return 0;
  if (devengado <= 3000) return (devengado - 2500) * 0.05;
  return 500 * 0.05 + (devengado - 3000) * 0.1;
}

function calcNomina(
  salarioBase: number,
  diasLaborables: number,
  diasTrabajados: number,
  bonificaciones: number,
  otrosDescuentos: number,
): { devengado: number; segSocial: number; impuesto: number; neto: number } {
  const dl = diasLaborables > 0 ? diasLaborables : 23;
  const devengado = (salarioBase / dl) * diasTrabajados;
  const segSocial = devengado * 0.05;
  const impuesto = calcImpuesto(devengado);
  const neto =
    devengado - segSocial - impuesto + bonificaciones - otrosDescuentos;
  return { devengado, segSocial, impuesto, neto };
}

const MESES = [
  "Enero",
  "Febrero",
  "Marzo",
  "Abril",
  "Mayo",
  "Junio",
  "Julio",
  "Agosto",
  "Septiembre",
  "Octubre",
  "Noviembre",
  "Diciembre",
];

const CATEGORIAS = [
  "Dirigente",
  "Técnico",
  "Administrativo",
  "Servicio",
  "Obrero",
];

const CATEGORIA_COLORS: Record<string, string> = {
  Dirigente: "bg-purple-500",
  Técnico: "bg-blue-500",
  Administrativo: "bg-teal-500",
  Servicio: "bg-green-500",
  Obrero: "bg-orange-500",
};

const CATEGORIA_BADGE: Record<string, string> = {
  Dirigente: "bg-purple-100 text-purple-700",
  Técnico: "bg-blue-100 text-blue-700",
  Administrativo: "bg-teal-100 text-teal-700",
  Servicio: "bg-green-100 text-green-700",
  Obrero: "bg-orange-100 text-orange-700",
};

function initials(name: string): string {
  return name
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
}

function fmt(n: number, sym: string): string {
  return `${sym}${n.toFixed(2)}`;
}

// ── Empleado Form ─────────────────────────────────────────────────────────────

interface EmpleadoFormState {
  nombre: string;
  ci: string;
  cargo: string;
  categoria: string;
  escalaSalarial: string;
  salarioBase: string;
  fechaIngreso: string;
  telefono: string;
  correo: string;
  direccion: string;
  observaciones: string;
  activo: boolean;
}

function emptyEmpForm(): EmpleadoFormState {
  return {
    nombre: "",
    ci: "",
    cargo: "",
    categoria: "Técnico",
    escalaSalarial: "",
    salarioBase: "",
    fechaIngreso: new Date().toISOString().split("T")[0],
    telefono: "",
    correo: "",
    direccion: "",
    observaciones: "",
    activo: true,
  };
}

function empleadoToForm(e: Empleado): EmpleadoFormState {
  return {
    nombre: e.nombre,
    ci: e.ci,
    cargo: e.cargo,
    categoria: e.categoria,
    escalaSalarial: e.escalaSalarial,
    salarioBase: String(e.salarioBase),
    fechaIngreso: e.fechaIngreso,
    telefono: e.telefono,
    correo: e.correo,
    direccion: e.direccion,
    observaciones: e.observaciones,
    activo: e.activo,
  };
}

function EmpleadoFormFields({
  form,
  onChange,
}: {
  form: EmpleadoFormState;
  onChange: (f: EmpleadoFormState) => void;
}) {
  const set = (key: keyof EmpleadoFormState, val: string | boolean) =>
    onChange({ ...form, [key]: val });

  return (
    <div className="space-y-4 px-4 pb-6">
      <div>
        <Label className="text-xs text-gray-500">Nombre completo *</Label>
        <Input
          data-ocid="empleado.input"
          value={form.nombre}
          onChange={(e) => set("nombre", e.target.value)}
          placeholder="Nombre del empleado"
          className="mt-1"
        />
      </div>
      <div>
        <Label className="text-xs text-gray-500">Carné / Cédula (CI)</Label>
        <Input
          value={form.ci}
          onChange={(e) => set("ci", e.target.value)}
          placeholder="Número de identidad"
          className="mt-1"
        />
      </div>
      <div>
        <Label className="text-xs text-gray-500">Cargo / Puesto *</Label>
        <Input
          value={form.cargo}
          onChange={(e) => set("cargo", e.target.value)}
          placeholder="Ej. Contador, Vendedor"
          className="mt-1"
        />
      </div>
      <div>
        <Label className="text-xs text-gray-500">Categoría</Label>
        <Select
          value={form.categoria}
          onValueChange={(v) => set("categoria", v)}
        >
          <SelectTrigger className="mt-1">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {CATEGORIAS.map((c) => (
              <SelectItem key={c} value={c}>
                {c}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label className="text-xs text-gray-500">Escala Salarial</Label>
        <Input
          value={form.escalaSalarial}
          onChange={(e) => set("escalaSalarial", e.target.value)}
          placeholder="Ej. Grupo 6, Nivel III"
          className="mt-1"
        />
      </div>
      <div>
        <Label className="text-xs text-gray-500">Salario base mensual *</Label>
        <Input
          type="number"
          min="0"
          step="0.01"
          value={form.salarioBase}
          onChange={(e) => set("salarioBase", e.target.value)}
          placeholder="0.00"
          className="mt-1"
        />
      </div>
      <div>
        <Label className="text-xs text-gray-500">Fecha de ingreso</Label>
        <Input
          type="date"
          value={form.fechaIngreso}
          onChange={(e) => set("fechaIngreso", e.target.value)}
          className="mt-1"
        />
      </div>
      <div>
        <Label className="text-xs text-gray-500">Teléfono</Label>
        <Input
          value={form.telefono}
          onChange={(e) => set("telefono", e.target.value)}
          placeholder="Número de contacto"
          className="mt-1"
        />
      </div>
      <div>
        <Label className="text-xs text-gray-500">Correo electrónico</Label>
        <Input
          type="email"
          value={form.correo}
          onChange={(e) => set("correo", e.target.value)}
          placeholder="correo@ejemplo.com"
          className="mt-1"
        />
      </div>
      <div>
        <Label className="text-xs text-gray-500">Dirección</Label>
        <Input
          value={form.direccion}
          onChange={(e) => set("direccion", e.target.value)}
          placeholder="Dirección del empleado"
          className="mt-1"
        />
      </div>
      <div>
        <Label className="text-xs text-gray-500">Observaciones</Label>
        <Textarea
          value={form.observaciones}
          onChange={(e) => set("observaciones", e.target.value)}
          placeholder="Notas adicionales..."
          className="mt-1"
          rows={3}
        />
      </div>
    </div>
  );
}

// ── Add Screen ────────────────────────────────────────────────────────────────

function AddEmpleadoScreen({ onBack }: { onBack: () => void }) {
  const [form, setForm] = useState<EmpleadoFormState>(emptyEmpForm());

  const handleSave = () => {
    if (!form.nombre.trim()) {
      toast.error("El nombre es obligatorio");
      return;
    }
    if (!form.cargo.trim()) {
      toast.error("El cargo es obligatorio");
      return;
    }
    if (
      !form.salarioBase ||
      Number.isNaN(Number(form.salarioBase)) ||
      Number(form.salarioBase) <= 0
    ) {
      toast.error("Ingresa un salario base válido");
      return;
    }
    const list = loadEmpleados();
    const emp: Empleado = {
      id: genId(),
      codigo: nextCodigo(list),
      nombre: form.nombre.trim(),
      ci: form.ci.trim(),
      cargo: form.cargo.trim(),
      categoria: form.categoria,
      escalaSalarial: form.escalaSalarial.trim(),
      salarioBase: Number.parseFloat(form.salarioBase),
      fechaIngreso: form.fechaIngreso,
      telefono: form.telefono.trim(),
      correo: form.correo.trim(),
      direccion: form.direccion.trim(),
      observaciones: form.observaciones.trim(),
      activo: true,
    };
    saveEmpleados([...list, emp]);
    toast.success("Empleado registrado");
    onBack();
  };

  return (
    <div className="flex flex-col h-full bg-background">
      <div className="flex items-center gap-3 px-4 py-3 border-b border-border bg-background">
        <button
          type="button"
          onClick={onBack}
          className="p-1 rounded hover:bg-gray-100"
        >
          <ArrowLeft size={20} className="text-navy" />
        </button>
        <h2 className="font-semibold text-base">Agregar Empleado</h2>
      </div>
      <ScrollArea className="flex-1">
        <div className="pt-4">
          <div className="px-4 pb-2">
            <Label className="text-xs text-gray-500">Código (automático)</Label>
            <Input
              readOnly
              value={nextCodigo(loadEmpleados())}
              className="mt-1 bg-gray-50 text-gray-500"
            />
          </div>
          <EmpleadoFormFields form={form} onChange={setForm} />
        </div>
      </ScrollArea>
      <div className="px-4 py-3 border-t border-border bg-background">
        <Button
          data-ocid="empleado.submit_button"
          className="w-full bg-navy hover:bg-navy/90 text-white"
          onClick={handleSave}
        >
          Guardar empleado
        </Button>
      </div>
    </div>
  );
}

// ── Edit Screen ───────────────────────────────────────────────────────────────

function EditEmpleadoScreen({
  empleado,
  onBack,
}: {
  empleado: Empleado;
  onBack: () => void;
}) {
  const [form, setForm] = useState<EmpleadoFormState>(empleadoToForm(empleado));

  const handleSave = () => {
    if (!form.nombre.trim()) {
      toast.error("El nombre es obligatorio");
      return;
    }
    if (!form.cargo.trim()) {
      toast.error("El cargo es obligatorio");
      return;
    }
    if (
      !form.salarioBase ||
      Number.isNaN(Number(form.salarioBase)) ||
      Number(form.salarioBase) <= 0
    ) {
      toast.error("Ingresa un salario base válido");
      return;
    }
    const list = loadEmpleados();
    const updated = list.map((e) =>
      e.id === empleado.id
        ? {
            ...e,
            nombre: form.nombre.trim(),
            ci: form.ci.trim(),
            cargo: form.cargo.trim(),
            categoria: form.categoria,
            escalaSalarial: form.escalaSalarial.trim(),
            salarioBase: Number.parseFloat(form.salarioBase),
            fechaIngreso: form.fechaIngreso,
            telefono: form.telefono.trim(),
            correo: form.correo.trim(),
            direccion: form.direccion.trim(),
            observaciones: form.observaciones.trim(),
            activo: form.activo,
          }
        : e,
    );
    saveEmpleados(updated);
    toast.success("Empleado actualizado");
    onBack();
  };

  return (
    <div className="flex flex-col h-full bg-background">
      <div className="flex items-center gap-3 px-4 py-3 border-b border-border bg-background">
        <button
          type="button"
          onClick={onBack}
          className="p-1 rounded hover:bg-gray-100"
        >
          <ArrowLeft size={20} className="text-navy" />
        </button>
        <h2 className="font-semibold text-base">Editar Empleado</h2>
      </div>
      <ScrollArea className="flex-1">
        <div className="pt-4">
          <div className="px-4 pb-2">
            <Label className="text-xs text-gray-500">Código</Label>
            <Input
              readOnly
              value={empleado.codigo}
              className="mt-1 bg-gray-50 text-gray-500"
            />
          </div>
          <EmpleadoFormFields form={form} onChange={setForm} />
        </div>
      </ScrollArea>
      <div className="px-4 py-3 border-t border-border bg-background">
        <Button
          data-ocid="empleado.save_button"
          className="w-full bg-navy hover:bg-navy/90 text-white"
          onClick={handleSave}
        >
          Actualizar
        </Button>
      </div>
    </div>
  );
}

// ── Detail Screen ─────────────────────────────────────────────────────────────

function DatosMes({
  empleado,
}: {
  empleado: Empleado;
}) {
  const now = new Date();
  const [mes, setMes] = useState(now.getMonth() + 1);
  const [anio, setAnio] = useState(now.getFullYear());

  const allDias = loadDias();
  const existing = allDias.find(
    (d) => d.empleadoId === empleado.id && d.mes === mes && d.anio === anio,
  );

  const [diasLaborables, setDiasLaborables] = useState(
    String(existing?.diasLaborables ?? 23),
  );
  const [diasTrabajados, setDiasTrabajados] = useState(
    String(existing?.diasTrabajados ?? 0),
  );
  const [diasNoLaborados, setDiasNoLaborados] = useState(
    String(existing?.diasNoLaborados ?? 0),
  );
  const [vacaciones, setVacaciones] = useState(
    String(existing?.vacaciones ?? 0),
  );
  const [licMedicas, setLicMedicas] = useState(
    String(existing?.licenciasMedicas ?? 0),
  );
  const [licOtras, setLicOtras] = useState(
    String(existing?.licenciasOtras ?? 0),
  );

  const loadMonth = (m: number, a: number) => {
    const found = allDias.find(
      (d) => d.empleadoId === empleado.id && d.mes === m && d.anio === a,
    );
    setDiasLaborables(String(found?.diasLaborables ?? 23));
    setDiasTrabajados(String(found?.diasTrabajados ?? 0));
    setDiasNoLaborados(String(found?.diasNoLaborados ?? 0));
    setVacaciones(String(found?.vacaciones ?? 0));
    setLicMedicas(String(found?.licenciasMedicas ?? 0));
    setLicOtras(String(found?.licenciasOtras ?? 0));
  };

  const handleSave = () => {
    const list = loadDias().filter(
      (d) =>
        !(d.empleadoId === empleado.id && d.mes === mes && d.anio === anio),
    );
    const record: DiasEmpleado = {
      id: genId(),
      empleadoId: empleado.id,
      mes,
      anio,
      diasLaborables: Number.parseInt(diasLaborables) || 23,
      diasTrabajados: Number.parseInt(diasTrabajados) || 0,
      diasNoLaborados: Number.parseInt(diasNoLaborados) || 0,
      vacaciones: Number.parseInt(vacaciones) || 0,
      licenciasMedicas: Number.parseInt(licMedicas) || 0,
      licenciasOtras: Number.parseInt(licOtras) || 0,
    };
    saveDias([...list, record]);
    toast.success("Registro de días guardado");
  };

  const history = loadDias()
    .filter((d) => d.empleadoId === empleado.id)
    .sort((a, b) => b.anio - a.anio || b.mes - a.mes);

  return (
    <div className="px-4 py-4 space-y-4">
      {/* Month/Year selector */}
      <div className="flex gap-2">
        <Select
          value={String(mes)}
          onValueChange={(v) => {
            const m = Number.parseInt(v);
            setMes(m);
            loadMonth(m, anio);
          }}
        >
          <SelectTrigger className="flex-1">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {MESES.map((m, i) => (
              <SelectItem key={m} value={String(i + 1)}>
                {m}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Input
          type="number"
          value={anio}
          onChange={(e) => {
            const a = Number.parseInt(e.target.value);
            setAnio(a);
            loadMonth(mes, a);
          }}
          className="w-24"
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        {[
          {
            label: "Días laborables",
            val: diasLaborables,
            set: setDiasLaborables,
          },
          {
            label: "Días trabajados",
            val: diasTrabajados,
            set: setDiasTrabajados,
          },
          {
            label: "Días no laborados",
            val: diasNoLaborados,
            set: setDiasNoLaborados,
          },
          { label: "Vacaciones", val: vacaciones, set: setVacaciones },
          { label: "Licencias médicas", val: licMedicas, set: setLicMedicas },
          { label: "Licencias otras", val: licOtras, set: setLicOtras },
        ].map(({ label, val, set }) => (
          <div key={label}>
            <Label className="text-xs text-gray-500">{label}</Label>
            <Input
              type="number"
              min="0"
              value={val}
              onChange={(e) => set(e.target.value)}
              className="mt-1"
            />
          </div>
        ))}
      </div>

      <Button
        data-ocid="empleado.save_button"
        className="w-full bg-navy hover:bg-navy/90 text-white"
        onClick={handleSave}
      >
        Guardar registro
      </Button>

      {history.length > 0 && (
        <div className="mt-4">
          <p className="text-xs font-semibold text-gray-500 mb-2">Historial</p>
          <div className="space-y-2">
            {history.map((d) => (
              <div key={d.id} className="bg-gray-50 rounded-lg p-3 text-sm">
                <div className="flex justify-between font-medium">
                  <span>
                    {MESES[d.mes - 1]} {d.anio}
                  </span>
                  <span className="text-navy">
                    {d.diasTrabajados}/{d.diasLaborables} días
                  </span>
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  Vac: {d.vacaciones} · Lic. Méd: {d.licenciasMedicas} · Otras:{" "}
                  {d.licenciasOtras}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function NominaTab({
  empleado,
  sym,
}: {
  empleado: Empleado;
  sym: string;
}) {
  const now = new Date();
  const [mes, setMes] = useState(now.getMonth() + 1);
  const [anio, setAnio] = useState(now.getFullYear());
  const [bonificaciones, setBonificaciones] = useState("0");
  const [otrosDescuentos, setOtrosDescuentos] = useState("0");
  const [notas, setNotas] = useState("");

  const diasRecord = loadDias().find(
    (d) => d.empleadoId === empleado.id && d.mes === mes && d.anio === anio,
  );
  const diasLaborables = diasRecord?.diasLaborables ?? 23;
  const diasTrabajados = diasRecord?.diasTrabajados ?? diasLaborables;

  const bonif = Number.parseFloat(bonificaciones) || 0;
  const otros = Number.parseFloat(otrosDescuentos) || 0;
  const { devengado, segSocial, impuesto, neto } = calcNomina(
    empleado.salarioBase,
    diasLaborables,
    diasTrabajados,
    bonif,
    otros,
  );

  const handleGenerar = () => {
    const existing = loadNominas().find(
      (n) => n.empleadoId === empleado.id && n.mes === mes && n.anio === anio,
    );
    if (existing) {
      toast.error("Ya existe una nómina para este mes");
      return;
    }
    const n: Nomina = {
      id: genId(),
      empleadoId: empleado.id,
      mes,
      anio,
      salarioBase: empleado.salarioBase,
      diasLaborables,
      diasTrabajados,
      salarioDevengado: devengado,
      descuentoSegSocial: segSocial,
      descuentoImpuesto: impuesto,
      bonificaciones: bonif,
      otrosDescuentos: otros,
      salarioNeto: neto,
      estado: "pendiente",
      notas,
    };
    saveNominas([...loadNominas(), n]);
    toast.success("Nómina generada");
  };

  const nominas = loadNominas()
    .filter((n) => n.empleadoId === empleado.id)
    .sort((a, b) => b.anio - a.anio || b.mes - a.mes);

  return (
    <div className="px-4 py-4 space-y-4">
      <div className="flex gap-2">
        <Select
          value={String(mes)}
          onValueChange={(v) => setMes(Number.parseInt(v))}
        >
          <SelectTrigger className="flex-1">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {MESES.map((m, i) => (
              <SelectItem key={m} value={String(i + 1)}>
                {m}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Input
          type="number"
          value={anio}
          onChange={(e) => setAnio(Number.parseInt(e.target.value))}
          className="w-24"
        />
      </div>

      <div className="bg-gray-50 rounded-xl p-4 space-y-2 text-sm">
        <Row label="Salario base" val={fmt(empleado.salarioBase, sym)} />
        <Row label="Días laborables" val={String(diasLaborables)} />
        <Row label="Días trabajados" val={String(diasTrabajados)} />
        <Row label="Salario devengado" val={fmt(devengado, sym)} highlight />
        <Row
          label="Desc. Seg. Social (5%)"
          val={`-${fmt(segSocial, sym)}`}
          red
        />
        <Row label={"Desc. Impuesto"} val={`-${fmt(impuesto, sym)}`} red />
        <div>
          <Label className="text-xs text-gray-500">Bonificaciones</Label>
          <Input
            type="number"
            min="0"
            step="0.01"
            value={bonificaciones}
            onChange={(e) => setBonificaciones(e.target.value)}
            className="mt-1 h-8 text-sm"
          />
        </div>
        <div>
          <Label className="text-xs text-gray-500">Otros descuentos</Label>
          <Input
            type="number"
            min="0"
            step="0.01"
            value={otrosDescuentos}
            onChange={(e) => setOtrosDescuentos(e.target.value)}
            className="mt-1 h-8 text-sm"
          />
        </div>
        <div className="border-t border-gray-200 pt-2 mt-2">
          <div className="flex justify-between items-center">
            <span className="font-bold text-base">Salario Neto</span>
            <span className="font-bold text-xl text-navy">
              {fmt(neto, sym)}
            </span>
          </div>
        </div>
      </div>

      <div>
        <Label className="text-xs text-gray-500">Notas</Label>
        <Input
          value={notas}
          onChange={(e) => setNotas(e.target.value)}
          placeholder="Observaciones de la nómina..."
          className="mt-1"
        />
      </div>

      <Button
        data-ocid="empleado.primary_button"
        className="w-full bg-navy hover:bg-navy/90 text-white"
        onClick={handleGenerar}
      >
        Generar Nómina
      </Button>

      {nominas.length > 0 && (
        <div className="mt-2">
          <p className="text-xs font-semibold text-gray-500 mb-2">
            Historial de Nóminas
          </p>
          <div className="space-y-2">
            {nominas.map((n) => (
              <div key={n.id} className="bg-gray-50 rounded-lg p-3">
                <div className="flex justify-between">
                  <span className="text-sm font-medium">
                    {MESES[n.mes - 1]} {n.anio}
                  </span>
                  <Badge
                    className={`text-xs ${n.estado === "pagado" ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"}`}
                    variant="outline"
                  >
                    {n.estado}
                  </Badge>
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  Devengado: {fmt(n.salarioDevengado, sym)} · Neto:{" "}
                  {fmt(n.salarioNeto, sym)}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function PagosTab({
  empleado,
  sym,
}: {
  empleado: Empleado;
  sym: string;
}) {
  const [pagoDialog, setPagoDialog] = useState<string | null>(null);
  const [fechaPago, setFechaPago] = useState(
    new Date().toISOString().split("T")[0],
  );
  const [metodoPago, setMetodoPago] = useState("Efectivo");

  const nominas = loadNominas()
    .filter((n) => n.empleadoId === empleado.id)
    .sort((a, b) => b.anio - a.anio || b.mes - a.mes);

  const totalPagado = nominas
    .filter((n) => n.estado === "pagado")
    .reduce((s, n) => s + n.salarioNeto, 0);
  const totalPendiente = nominas
    .filter((n) => n.estado === "pendiente")
    .reduce((s, n) => s + n.salarioNeto, 0);

  const handleMarcarPagado = () => {
    if (!pagoDialog) return;
    const list = loadNominas().map((n) =>
      n.id === pagoDialog
        ? { ...n, estado: "pagado" as const, fechaPago, metodoPago }
        : n,
    );
    saveNominas(list);
    setPagoDialog(null);
    toast.success("Pago registrado");
  };

  return (
    <div className="px-4 py-4 space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-green-50 rounded-xl p-3 text-center">
          <p className="text-xs text-green-600">Total Pagado</p>
          <p className="font-bold text-green-700 text-lg">
            {fmt(totalPagado, sym)}
          </p>
        </div>
        <div className="bg-amber-50 rounded-xl p-3 text-center">
          <p className="text-xs text-amber-600">Pendiente</p>
          <p className="font-bold text-amber-700 text-lg">
            {fmt(totalPendiente, sym)}
          </p>
        </div>
      </div>

      {nominas.length === 0 && (
        <div
          data-ocid="empleado.empty_state"
          className="text-center py-8 text-gray-400"
        >
          <Banknote size={32} className="mx-auto mb-2 opacity-40" />
          <p className="text-sm">Sin nóminas registradas</p>
        </div>
      )}

      <div className="space-y-2">
        {nominas.map((n) => (
          <div key={n.id} className="border border-border rounded-lg p-3">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium">
                  {MESES[n.mes - 1]} {n.anio}
                </p>
                <p className="text-xs text-gray-500">
                  {n.diasTrabajados} días · Neto: {fmt(n.salarioNeto, sym)}
                </p>
                {n.fechaPago && (
                  <p className="text-xs text-gray-400">
                    Pagado: {n.fechaPago} · {n.metodoPago}
                  </p>
                )}
              </div>
              <div className="flex flex-col items-end gap-2">
                <Badge
                  variant="outline"
                  className={`text-xs ${
                    n.estado === "pagado"
                      ? "bg-green-100 text-green-700"
                      : "bg-amber-100 text-amber-700"
                  }`}
                >
                  {n.estado === "pagado" ? (
                    <>
                      <CheckCircle size={10} className="mr-1" />
                      Pagado
                    </>
                  ) : (
                    <>
                      <Clock size={10} className="mr-1" />
                      Pendiente
                    </>
                  )}
                </Badge>
                {n.estado === "pendiente" && (
                  <Button
                    data-ocid="empleado.primary_button"
                    size="sm"
                    variant="outline"
                    className="text-xs h-7"
                    onClick={() => setPagoDialog(n.id)}
                  >
                    Marcar pagado
                  </Button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      <Dialog open={!!pagoDialog} onOpenChange={() => setPagoDialog(null)}>
        <DialogContent data-ocid="empleado.dialog">
          <DialogHeader>
            <DialogTitle>Registrar Pago</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label className="text-xs text-gray-500">Fecha de pago</Label>
              <Input
                type="date"
                value={fechaPago}
                onChange={(e) => setFechaPago(e.target.value)}
                className="mt-1"
              />
            </div>
            <div>
              <Label className="text-xs text-gray-500">Método de pago</Label>
              <Select value={metodoPago} onValueChange={setMetodoPago}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {["Efectivo", "Transferencia", "Cheque", "Otro"].map((m) => (
                    <SelectItem key={m} value={m}>
                      {m}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button
              data-ocid="empleado.cancel_button"
              variant="outline"
              onClick={() => setPagoDialog(null)}
            >
              Cancelar
            </Button>
            <Button
              data-ocid="empleado.confirm_button"
              className="bg-navy text-white hover:bg-navy/90"
              onClick={handleMarcarPagado}
            >
              Confirmar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Row({
  label,
  val,
  highlight,
  red,
}: {
  label: string;
  val: string;
  highlight?: boolean;
  red?: boolean;
}) {
  return (
    <div className="flex justify-between text-sm">
      <span className="text-gray-600">{label}</span>
      <span
        className={`font-medium ${
          highlight ? "text-navy" : red ? "text-red-600" : "text-foreground"
        }`}
      >
        {val}
      </span>
    </div>
  );
}

function EmpleadoDetailScreen({
  empleado,
  onBack,
}: {
  empleado: Empleado;
  onBack: () => void;
}) {
  const sym = getCurrency();
  return (
    <div className="flex flex-col h-full bg-background">
      <div className="flex items-center gap-3 px-4 py-3 border-b border-border bg-background shrink-0">
        <button
          type="button"
          onClick={onBack}
          className="p-1 rounded hover:bg-gray-100"
        >
          <ArrowLeft size={20} className="text-navy" />
        </button>
        <div className="flex-1 min-w-0">
          <h2 className="font-semibold text-base truncate">
            {empleado.nombre}
          </h2>
          <p className="text-xs text-gray-500">
            {empleado.codigo} · {empleado.cargo}
          </p>
        </div>
        <Badge
          variant="outline"
          className={`text-xs ${CATEGORIA_BADGE[empleado.categoria] ?? "bg-gray-100 text-gray-700"}`}
        >
          {empleado.categoria}
        </Badge>
      </div>

      <Tabs
        defaultValue="datos"
        className="flex-1 flex flex-col overflow-hidden"
      >
        <TabsList className="mx-4 mt-3 shrink-0">
          <TabsTrigger value="datos" className="flex-1 text-xs">
            Datos
          </TabsTrigger>
          <TabsTrigger value="dias" className="flex-1 text-xs">
            Días
          </TabsTrigger>
          <TabsTrigger value="nomina" className="flex-1 text-xs">
            Nómina
          </TabsTrigger>
          <TabsTrigger value="pagos" className="flex-1 text-xs">
            Pagos
          </TabsTrigger>
        </TabsList>

        <div className="flex-1 overflow-y-auto">
          <TabsContent value="datos" className="m-0">
            <div className="px-4 py-4 space-y-3">
              {[
                ["Código", empleado.codigo],
                ["Nombre", empleado.nombre],
                ["CI", empleado.ci || "—"],
                ["Cargo", empleado.cargo],
                ["Categoría", empleado.categoria],
                ["Escala Salarial", empleado.escalaSalarial || "—"],
                ["Salario Base", fmt(empleado.salarioBase, sym)],
                ["Fecha de Ingreso", empleado.fechaIngreso || "—"],
                ["Teléfono", empleado.telefono || "—"],
                ["Correo", empleado.correo || "—"],
                ["Dirección", empleado.direccion || "—"],
              ].map(([label, val]) => (
                <div
                  key={label}
                  className="flex justify-between text-sm border-b border-gray-100 pb-2"
                >
                  <span className="text-gray-500 w-32 shrink-0">{label}</span>
                  <span className="text-right font-medium break-all">
                    {val}
                  </span>
                </div>
              ))}
              {empleado.observaciones && (
                <div className="text-sm">
                  <span className="text-gray-500">Observaciones</span>
                  <p className="mt-1 text-foreground">
                    {empleado.observaciones}
                  </p>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="dias" className="m-0">
            <DatosMes empleado={empleado} />
          </TabsContent>

          <TabsContent value="nomina" className="m-0">
            <NominaTab empleado={empleado} sym={sym} />
          </TabsContent>

          <TabsContent value="pagos" className="m-0">
            <PagosTab empleado={empleado} sym={sym} />
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}

// ── Nueva Nómina Modal ────────────────────────────────────────────────────────

function NuevaNominaModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const now = new Date();
  const [mes, setMes] = useState(now.getMonth() + 1);
  const [anio, setAnio] = useState(now.getFullYear());
  const sym = getCurrency();

  const empleados = loadEmpleados().filter((e) => e.activo);

  const rows = empleados.map((e) => {
    const dias = loadDias().find(
      (d) => d.empleadoId === e.id && d.mes === mes && d.anio === anio,
    );
    const dl = dias?.diasLaborables ?? 23;
    const dt = dias?.diasTrabajados ?? dl;
    const { devengado, neto } = calcNomina(e.salarioBase, dl, dt, 0, 0);
    const yaExiste = loadNominas().some(
      (n) => n.empleadoId === e.id && n.mes === mes && n.anio === anio,
    );
    return { emp: e, dl, dt, devengado, neto, yaExiste };
  });

  const handleGenerarTodos = () => {
    let count = 0;
    const list = loadNominas();
    const toAdd: Nomina[] = [];
    for (const r of rows) {
      if (r.yaExiste) continue;
      const { devengado, segSocial, impuesto, neto } = calcNomina(
        r.emp.salarioBase,
        r.dl,
        r.dt,
        0,
        0,
      );
      toAdd.push({
        id: genId(),
        empleadoId: r.emp.id,
        mes,
        anio,
        salarioBase: r.emp.salarioBase,
        diasLaborables: r.dl,
        diasTrabajados: r.dt,
        salarioDevengado: devengado,
        descuentoSegSocial: segSocial,
        descuentoImpuesto: impuesto,
        bonificaciones: 0,
        otrosDescuentos: 0,
        salarioNeto: neto,
        estado: "pendiente",
        notas: "",
      });
      count++;
    }
    saveNominas([...list, ...toAdd]);
    toast.success(`${count} nóminas generadas`);
    onClose();
  };

  const handleExportPDF = () => {
    const biz = getBusinessSettings();
    const totalNeto = rows.reduce((s, r) => s + r.neto, 0);
    const html = `<!DOCTYPE html><html><head><meta charset="utf-8"/><title>Nomina ${MESES[mes - 1]} ${anio}</title><style>body{font-family:sans-serif;margin:20px;font-size:12px}h1{font-size:16px}table{width:100%;border-collapse:collapse}th,td{border:1px solid #ccc;padding:6px 8px;text-align:left}th{background:#f0f4f8}tfoot td{font-weight:bold;background:#e8f0fe}.sig{margin-top:40px;display:flex;gap:60px}.sig-line{flex:1;border-top:1px solid #333;padding-top:6px;font-size:11px}</style></head><body>
<h1>${biz.nombre || "POS Mobile"}</h1>
<p>NIT: ${biz.nit || "—"} | Tel: ${biz.telefono || "—"} | ${biz.direccion || ""}</p>
<h2 style="margin-top:16px">Nómina de Salarios — ${MESES[mes - 1]} ${anio}</h2>
<table><thead><tr><th>Código</th><th>Nombre</th><th>Cargo</th><th>Categoría</th><th>Días</th><th>Sal. Base</th><th>Devengado</th><th>Descuentos</th><th>Neto</th></tr></thead>
<tbody>${rows
      .map(
        (r) =>
          `<tr><td>${r.emp.codigo}</td><td>${r.emp.nombre}</td><td>${r.emp.cargo}</td><td>${r.emp.categoria}</td><td>${r.dt}/${r.dl}</td><td>${fmt(r.emp.salarioBase, sym)}</td><td>${fmt(r.devengado, sym)}</td><td>${fmt(r.devengado * 0.05 + calcImpuesto(r.devengado), sym)}</td><td>${fmt(r.neto, sym)}</td></tr>`,
      )
      .join("")}</tbody>
<tfoot><tr><td colspan="8">Total</td><td>${fmt(totalNeto, sym)}</td></tr></tfoot>
</table>
<div class="sig">
<div class="sig-line">Director / Administrador<br/>Nombre: ____________________<br/>Firma: _____________________<br/>Fecha: _____________________</div>
<div class="sig-line">Recursos Humanos<br/>Nombre: ____________________<br/>Firma: _____________________<br/>Fecha: _____________________</div>
</div></body></html>`;
    const w = window.open("", "_blank");
    if (w) {
      w.document.write(html);
      w.document.close();
      w.print();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg" data-ocid="empleado.modal">
        <DialogHeader>
          <DialogTitle>Nueva Nómina Mensual</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div className="flex gap-2">
            <Select
              value={String(mes)}
              onValueChange={(v) => setMes(Number.parseInt(v))}
            >
              <SelectTrigger className="flex-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {MESES.map((m, i) => (
                  <SelectItem key={m} value={String(i + 1)}>
                    {m}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Input
              type="number"
              value={anio}
              onChange={(e) => setAnio(Number.parseInt(e.target.value))}
              className="w-24"
            />
          </div>
          <ScrollArea className="max-h-64">
            <div className="space-y-1">
              {rows.map((r) => (
                <div
                  key={r.emp.id}
                  className="flex justify-between items-center text-sm p-2 rounded-lg bg-gray-50"
                >
                  <div>
                    <p className="font-medium">{r.emp.nombre}</p>
                    <p className="text-xs text-gray-500">{r.emp.cargo}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-navy">{fmt(r.neto, sym)}</p>
                    {r.yaExiste && (
                      <Badge variant="outline" className="text-xs bg-gray-100">
                        Ya existe
                      </Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </div>
        <DialogFooter className="gap-2">
          <Button
            data-ocid="empleado.secondary_button"
            variant="outline"
            size="sm"
            onClick={handleExportPDF}
          >
            <Download size={14} className="mr-1" /> PDF
          </Button>
          <Button
            data-ocid="empleado.confirm_button"
            className="bg-navy text-white hover:bg-navy/90"
            onClick={handleGenerarTodos}
          >
            Generar para todos
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── Summary Cards ─────────────────────────────────────────────────────────────

function SummaryCards({ sym }: { sym: string }) {
  const empleados = loadEmpleados();
  const activos = empleados.filter((e) => e.activo).length;
  const nominas = loadNominas();
  const pendiente = nominas
    .filter((n) => n.estado === "pendiente")
    .reduce((s, n) => s + n.salarioNeto, 0);
  const now = new Date();
  const mes = now.getMonth() + 1;
  const anio = now.getFullYear();
  const nominaMes = nominas
    .filter((n) => n.mes === mes && n.anio === anio)
    .reduce((s, n) => s + n.salarioNeto, 0);

  return (
    <div className="grid grid-cols-3 gap-2 px-4 pt-3 pb-1">
      <div className="bg-blue-50 rounded-xl p-3 text-center">
        <p className="text-2xl font-bold text-navy">{activos}</p>
        <p className="text-xs text-blue-600 mt-0.5">Empleados activos</p>
      </div>
      <div className="bg-amber-50 rounded-xl p-3 text-center">
        <p className="text-base font-bold text-amber-700 truncate">
          {fmt(pendiente, sym)}
        </p>
        <p className="text-xs text-amber-600 mt-0.5">Pagos pendientes</p>
      </div>
      <div className="bg-green-50 rounded-xl p-3 text-center">
        <p className="text-base font-bold text-green-700 truncate">
          {fmt(nominaMes, sym)}
        </p>
        <p className="text-xs text-green-600 mt-0.5">Nómina del mes</p>
      </div>
    </div>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────────

type SubScreen =
  | { type: "list" }
  | { type: "add" }
  | { type: "edit"; empleado: Empleado }
  | { type: "detail"; empleado: Empleado };

export default function Empleados() {
  const [subScreen, setSubScreen] = useState<SubScreen>({ type: "list" });
  const [refresh, setRefresh] = useState(0);
  const [viewMode, setViewMode] = useState<"list" | "grid">("list");
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [nominaOpen, setNominaOpen] = useState(false);

  const sym = getCurrency();

  const goBack = () => {
    setSubScreen({ type: "list" });
    setRefresh((r) => r + 1);
  };

  if (subScreen.type === "add") {
    return <AddEmpleadoScreen onBack={goBack} />;
  }
  if (subScreen.type === "edit") {
    return <EditEmpleadoScreen empleado={subScreen.empleado} onBack={goBack} />;
  }
  if (subScreen.type === "detail") {
    return (
      <EmpleadoDetailScreen empleado={subScreen.empleado} onBack={goBack} />
    );
  }

  const empleados = loadEmpleados();
  const filtered = empleados.filter((e) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      e.nombre.toLowerCase().includes(q) ||
      e.cargo.toLowerCase().includes(q) ||
      e.codigo.toLowerCase().includes(q) ||
      e.categoria.toLowerCase().includes(q)
    );
  });

  const handleExportCSV = () => {
    const header =
      "Código,Nombre,CI,Cargo,Categoría,Salario Base,Fecha de Ingreso";
    const rows = empleados
      .map(
        (e) =>
          `${e.codigo},"${e.nombre}",${e.ci},"${e.cargo}",${e.categoria},${e.salarioBase},${e.fechaIngreso}`,
      )
      .join("\n");
    const blob = new Blob([`${header}\n${rows}`], {
      type: "text/csv;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "empleados.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportPDF = () => {
    const biz = getBusinessSettings();
    const html = `<!DOCTYPE html><html><head><meta charset="utf-8"/><title>Empleados</title><style>body{font-family:sans-serif;margin:20px;font-size:12px}table{width:100%;border-collapse:collapse}th,td{border:1px solid #ccc;padding:6px 8px}th{background:#f0f4f8}</style></head><body>
<h2>${biz.nombre || "POS Mobile"} — Listado de Empleados</h2>
<table><thead><tr><th>Código</th><th>Nombre</th><th>CI</th><th>Cargo</th><th>Categoría</th><th>Salario Base</th><th>Ingreso</th></tr></thead><tbody>
${empleados.map((e) => `<tr><td>${e.codigo}</td><td>${e.nombre}</td><td>${e.ci}</td><td>${e.cargo}</td><td>${e.categoria}</td><td>${fmt(e.salarioBase, sym)}</td><td>${e.fechaIngreso}</td></tr>`).join("")}
</tbody></table></body></html>`;
    const w = window.open("", "_blank");
    if (w) {
      w.document.write(html);
      w.document.close();
      w.print();
    }
  };

  const handleDelete = (id: string) => {
    if (!confirm("¿Eliminar este empleado?")) return;
    saveEmpleados(loadEmpleados().filter((e) => e.id !== id));
    saveDias(loadDias().filter((d) => d.empleadoId !== id));
    saveNominas(loadNominas().filter((n) => n.empleadoId !== id));
    setRefresh((r) => r + 1);
    toast.success("Empleado eliminado");
  };

  return (
    <div className="flex flex-col h-full bg-background" key={refresh}>
      <SummaryCards sym={sym} />

      {/* Toolbar */}
      <div className="flex items-center gap-2 px-4 py-2 border-b border-border">
        {searchOpen && (
          <Input
            data-ocid="empleado.search_input"
            autoFocus
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar empleados..."
            className="flex-1 h-8 text-sm"
          />
        )}
        {!searchOpen && <div className="flex-1" />}
        <button
          type="button"
          data-ocid="empleado.toggle"
          onClick={() => setViewMode(viewMode === "list" ? "grid" : "list")}
          className="p-1.5 rounded hover:bg-gray-100 text-gray-500"
        >
          {viewMode === "list" ? (
            <LayoutGrid size={18} />
          ) : (
            <LayoutList size={18} />
          )}
        </button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              data-ocid="empleado.dropdown_menu"
              className="p-1.5 rounded hover:bg-gray-100 text-gray-500"
            >
              <MoreVertical size={18} />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem
              onClick={() => setSearchOpen(!searchOpen)}
              data-ocid="empleado.search_input"
            >
              <Search size={14} className="mr-2" /> Buscar
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => setNominaOpen(true)}
              data-ocid="empleado.primary_button"
            >
              <FileText size={14} className="mr-2" /> Nueva Nómina
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleExportCSV}>
              <Download size={14} className="mr-2" /> Exportar CSV
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleExportPDF}>
              <FileText size={14} className="mr-2" /> Exportar PDF
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* List / Grid */}
      <div className="flex-1 overflow-y-auto">
        {filtered.length === 0 && (
          <div
            data-ocid="empleado.empty_state"
            className="flex flex-col items-center justify-center py-16 text-gray-400"
          >
            <Users size={40} className="mb-3 opacity-30" />
            <p className="text-sm font-medium">Sin empleados registrados</p>
            <p className="text-xs mt-1">Pulsa + para agregar el primero</p>
          </div>
        )}

        {viewMode === "list" ? (
          <div className="divide-y divide-border">
            {filtered.map((e, idx) => (
              <button
                type="button"
                key={e.id}
                data-ocid={`empleado.item.${idx + 1}`}
                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 text-left"
                onClick={() => setSubScreen({ type: "detail", empleado: e })}
              >
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm shrink-0 ${
                    CATEGORIA_COLORS[e.categoria] ?? "bg-gray-400"
                  }`}
                >
                  {initials(e.nombre)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">{e.nombre}</p>
                  <p className="text-xs text-gray-500 truncate">{e.cargo}</p>
                  <Badge
                    variant="outline"
                    className={`text-xs mt-0.5 ${
                      CATEGORIA_BADGE[e.categoria] ??
                      "bg-gray-100 text-gray-700"
                    }`}
                  >
                    {e.categoria}
                  </Badge>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-sm font-semibold text-navy">
                    {fmt(e.salarioBase, sym)}
                  </p>
                  <div className="flex gap-1 mt-1 justify-end">
                    <button
                      type="button"
                      data-ocid={`empleado.edit_button.${idx + 1}`}
                      onClick={(ev) => {
                        ev.stopPropagation();
                        setSubScreen({ type: "edit", empleado: e });
                      }}
                      className="p-1 rounded hover:bg-blue-50 text-blue-500"
                    >
                      <Pencil size={14} />
                    </button>
                    <button
                      type="button"
                      data-ocid={`empleado.delete_button.${idx + 1}`}
                      onClick={(ev) => {
                        ev.stopPropagation();
                        handleDelete(e.id);
                      }}
                      className="p-1 rounded hover:bg-red-50 text-red-400"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </button>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 p-4">
            {filtered.map((e, idx) => (
              <button
                type="button"
                key={e.id}
                data-ocid={`empleado.item.${idx + 1}`}
                className="border border-border rounded-xl p-3 text-left hover:bg-gray-50 relative"
                onClick={() => setSubScreen({ type: "detail", empleado: e })}
              >
                <div
                  className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-bold mb-2 ${
                    CATEGORIA_COLORS[e.categoria] ?? "bg-gray-400"
                  }`}
                >
                  {initials(e.nombre)}
                </div>
                <p className="font-semibold text-sm truncate">{e.nombre}</p>
                <p className="text-xs text-gray-500 truncate">{e.cargo}</p>
                <p className="text-xs font-medium text-navy mt-1">
                  {fmt(e.salarioBase, sym)}
                </p>
                <Badge
                  variant="outline"
                  className={`text-xs mt-1 ${
                    CATEGORIA_BADGE[e.categoria] ?? "bg-gray-100 text-gray-700"
                  }`}
                >
                  {e.categoria}
                </Badge>
                <div className="absolute top-2 right-2 flex gap-1">
                  <button
                    type="button"
                    data-ocid={`empleado.edit_button.${idx + 1}`}
                    onClick={(ev) => {
                      ev.stopPropagation();
                      setSubScreen({ type: "edit", empleado: e });
                    }}
                    className="p-1 rounded hover:bg-blue-50 text-blue-500"
                  >
                    <Pencil size={13} />
                  </button>
                  <button
                    type="button"
                    data-ocid={`empleado.delete_button.${idx + 1}`}
                    onClick={(ev) => {
                      ev.stopPropagation();
                      handleDelete(e.id);
                    }}
                    className="p-1 rounded hover:bg-red-50 text-red-400"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* FAB */}
      <button
        type="button"
        data-ocid="empleado.open_modal_button"
        onClick={() => setSubScreen({ type: "add" })}
        className="absolute bottom-6 right-6 w-14 h-14 rounded-full bg-navy text-white shadow-lg flex items-center justify-center hover:bg-navy/90 transition-colors"
        aria-label="Agregar empleado"
      >
        <Plus size={26} />
      </button>

      <NuevaNominaModal
        open={nominaOpen}
        onClose={() => setNominaOpen(false)}
      />
    </div>
  );
}
