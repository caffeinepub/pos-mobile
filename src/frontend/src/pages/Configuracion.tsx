import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  ArrowDownToLine,
  ArrowLeft,
  Building2,
  Camera,
  Check,
  ChevronDown,
  ChevronRight,
  Coins,
  CreditCard,
  ImageIcon,
  Loader2,
  Palette,
  Pencil,
  Plus,
  Trash2,
  X,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { useCamera } from "../camera/useCamera";
import { THEMES, useAppTheme } from "../context/ThemeContext";
import {
  useCreatePaymentType,
  useDeletePaymentType,
  usePaymentTypes,
  useUpdatePaymentType,
} from "../hooks/useQueries";
import { getBusinessData, saveBusinessData } from "../utils/businessData";
import {
  type SalidaMercanciaTipo,
  getTiposSalida,
  saveTiposSalida,
} from "../utils/salidas";

// ---- World Currencies ----
const CURRENCIES: { code: string; name: string; symbol: string }[] = [
  { code: "USD", name: "Dólar estadounidense", symbol: "$" },
  { code: "EUR", name: "Euro", symbol: "€" },
  { code: "GBP", name: "Libra esterlina", symbol: "£" },
  { code: "JPY", name: "Yen japonés", symbol: "¥" },
  { code: "CAD", name: "Dólar canadiense", symbol: "CA$" },
  { code: "AUD", name: "Dólar australiano", symbol: "A$" },
  { code: "CHF", name: "Franco suizo", symbol: "Fr" },
  { code: "CNY", name: "Yuan chino", symbol: "¥" },
  { code: "MXN", name: "Peso mexicano", symbol: "$" },
  { code: "BRL", name: "Real brasileño", symbol: "R$" },
  { code: "ARS", name: "Peso argentino", symbol: "$" },
  { code: "COP", name: "Peso colombiano", symbol: "$" },
  { code: "PEN", name: "Sol peruano", symbol: "S/" },
  { code: "CLP", name: "Peso chileno", symbol: "$" },
  { code: "VES", name: "Bolívar venezolano", symbol: "Bs." },
  { code: "CRC", name: "Colón costarricense", symbol: "₡" },
  { code: "GTQ", name: "Quetzal guatemalteco", symbol: "Q" },
  { code: "HNL", name: "Lempira hondureño", symbol: "L" },
  { code: "NIO", name: "Córdoba nicaragüense", symbol: "C$" },
  { code: "PAB", name: "Balboa panameño", symbol: "B/." },
  { code: "DOP", name: "Peso dominicano", symbol: "RD$" },
  { code: "BOB", name: "Boliviano", symbol: "Bs" },
  { code: "PYG", name: "Guaraní paraguayo", symbol: "₲" },
  { code: "UYU", name: "Peso uruguayo", symbol: "$U" },
  { code: "CUP", name: "Peso cubano", symbol: "$" },
  { code: "INR", name: "Rupia india", symbol: "₹" },
  { code: "KRW", name: "Won surcoreano", symbol: "₩" },
  { code: "SGD", name: "Dólar de Singapur", symbol: "S$" },
  { code: "HKD", name: "Dólar de Hong Kong", symbol: "HK$" },
  { code: "TWD", name: "Nuevo dólar taiwanés", symbol: "NT$" },
  { code: "THB", name: "Baht tailandés", symbol: "฿" },
  { code: "MYR", name: "Ringgit malayo", symbol: "RM" },
  { code: "IDR", name: "Rupia indonesia", symbol: "Rp" },
  { code: "PHP", name: "Peso filipino", symbol: "₱" },
  { code: "VND", name: "Dong vietnamita", symbol: "₫" },
  { code: "PKR", name: "Rupia pakistaní", symbol: "₨" },
  { code: "BDT", name: "Taka bangladesí", symbol: "৳" },
  { code: "LKR", name: "Rupia de Sri Lanka", symbol: "Rs" },
  { code: "NPR", name: "Rupia nepalesa", symbol: "रू" },
  { code: "RUB", name: "Rublo ruso", symbol: "₽" },
  { code: "TRY", name: "Lira turca", symbol: "₺" },
  { code: "PLN", name: "Esloti polaco", symbol: "zł" },
  { code: "SEK", name: "Corona sueca", symbol: "kr" },
  { code: "NOK", name: "Corona noruega", symbol: "kr" },
  { code: "DKK", name: "Corona danesa", symbol: "kr" },
  { code: "HUF", name: "Forinto húngaro", symbol: "Ft" },
  { code: "CZK", name: "Corona checa", symbol: "Kč" },
  { code: "RON", name: "Leu rumano", symbol: "lei" },
  { code: "BGN", name: "Lev búlgaro", symbol: "лв" },
  { code: "HRK", name: "Kuna croata", symbol: "kn" },
  { code: "ZAR", name: "Rand sudafricano", symbol: "R" },
  { code: "NGN", name: "Naira nigeriana", symbol: "₦" },
  { code: "KES", name: "Chelín keniano", symbol: "KSh" },
  { code: "EGP", name: "Libra egipcia", symbol: "£" },
  { code: "MAD", name: "Dírham marroquí", symbol: "د.م." },
  { code: "GHS", name: "Cedi ghanés", symbol: "₵" },
  { code: "ETB", name: "Birr etíope", symbol: "Br" },
  { code: "TZS", name: "Chelín tanzano", symbol: "TSh" },
  { code: "UGX", name: "Chelín ugandés", symbol: "USh" },
  { code: "XAF", name: "Franco CFA (África Central)", symbol: "FCFA" },
  { code: "XOF", name: "Franco CFA (África Occidental)", symbol: "CFA" },
  { code: "SAR", name: "Riyal saudí", symbol: "﷼" },
  { code: "AED", name: "Dírham de EAU", symbol: "د.إ" },
  { code: "QAR", name: "Riyal catarí", symbol: "﷼" },
  { code: "KWD", name: "Dinar kuwaití", symbol: "د.ك" },
  { code: "BHD", name: "Dinar barení", symbol: ".د.ب" },
  { code: "OMR", name: "Rial omaní", symbol: "﷼" },
  { code: "JOD", name: "Dinar jordano", symbol: "د.ا" },
  { code: "ILS", name: "Nuevo séquel israelí", symbol: "₪" },
  { code: "IQD", name: "Dinar iraquí", symbol: "ع.د" },
  { code: "IRR", name: "Rial iraní", symbol: "﷼" },
  { code: "AFN", name: "Afgani afgano", symbol: "؋" },
  { code: "AZN", name: "Manat azerbaiyano", symbol: "₼" },
  { code: "KZT", name: "Tenge kazajo", symbol: "₸" },
  { code: "UZS", name: "Som uzbeko", symbol: "сўм" },
  { code: "GEL", name: "Lari georgiano", symbol: "₾" },
  { code: "AMD", name: "Dram armenio", symbol: "֏" },
  { code: "UAH", name: "Grivna ucraniana", symbol: "₴" },
  { code: "BYN", name: "Rublo bielorruso", symbol: "Br" },
  { code: "MDL", name: "Leu moldavo", symbol: "L" },
  { code: "ALL", name: "Lek albanés", symbol: "L" },
  { code: "BAM", name: "Marco de Bosnia y Herzegovina", symbol: "KM" },
  { code: "MKD", name: "Denar macedonio", symbol: "ден" },
  { code: "RSD", name: "Dinar serbio", symbol: "din" },
  { code: "ISK", name: "Corona islandesa", symbol: "kr" },
  { code: "NZD", name: "Dólar neozelandés", symbol: "NZ$" },
  { code: "FJD", name: "Dólar fiyiano", symbol: "FJ$" },
];

// ---- Camera Overlay ----
function CameraOverlay({
  onCapture,
  onClose,
}: { onCapture: (file: File) => void; onClose: () => void }) {
  const {
    isActive,
    isSupported,
    error,
    isLoading,
    startCamera,
    stopCamera,
    capturePhoto,
    videoRef,
    canvasRef,
  } = useCamera({ facingMode: "environment" });

  // biome-ignore lint/correctness/useExhaustiveDependencies: mount-once
  useEffect(() => {
    startCamera();
    return () => {
      stopCamera();
    };
  }, []);

  const handleCapture = async () => {
    const file = await capturePhoto();
    if (file) onCapture(file);
  };

  return (
    <div className="fixed inset-0 z-[200] bg-black flex flex-col">
      <div className="flex items-center justify-between p-4">
        <span className="text-white font-semibold">Tomar foto</span>
        <Button
          variant="ghost"
          size="sm"
          className="text-white hover:text-white hover:bg-white/20"
          onClick={onClose}
        >
          Cerrar
        </Button>
      </div>
      <div className="flex-1 relative flex items-center justify-center">
        {isSupported === false ? (
          <p className="text-white">Cámara no soportada</p>
        ) : (
          <>
            <video
              ref={videoRef}
              className="w-full max-h-full object-cover"
              playsInline
              muted
              style={{ minHeight: 240 }}
            />
            <canvas ref={canvasRef} style={{ display: "none" }} />
          </>
        )}
        {error && (
          <p className="absolute bottom-16 text-red-400 text-sm px-4 text-center">
            {error.message}
          </p>
        )}
        {isLoading && !isActive && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/60">
            <Loader2 className="text-white animate-spin" size={36} />
          </div>
        )}
      </div>
      <div className="p-6">
        <Button
          className="w-full h-14 rounded-full text-base font-semibold"
          onClick={handleCapture}
          disabled={!isActive || isLoading}
        >
          <Camera size={20} className="mr-2" /> Capturar foto
        </Button>
      </div>
    </div>
  );
}

// ---- Business Data Sub-screen ----
function DatosNegocioScreen({ onBack }: { onBack: () => void }) {
  const saved = getBusinessData();
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [showCamera, setShowCamera] = useState(false);
  const [nombre, setNombre] = useState(saved.nombre);
  const [telefono, setTelefono] = useState(saved.telefono);
  const [correo, setCorreo] = useState(saved.correo);
  const [direccion, setDireccion] = useState(saved.direccion);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) setImagePreview(URL.createObjectURL(file));
    e.target.value = "";
  };

  const handleGuardar = () => {
    saveBusinessData({ nombre, telefono, correo, direccion });
    toast.success("Datos del negocio guardados");
    onBack();
  };

  return (
    <>
      <ScrollArea className="flex-1">
        <div className="px-4 pb-6 pt-4 space-y-5">
          <div className="flex flex-col items-center gap-3">
            <div className="w-32 h-32 rounded-2xl border-2 border-dashed border-border bg-muted flex items-center justify-center overflow-hidden">
              {imagePreview ? (
                <img
                  src={imagePreview}
                  alt="Logo del negocio"
                  className="w-full h-full object-cover"
                />
              ) : (
                <ImageIcon size={36} className="text-muted-foreground/40" />
              )}
            </div>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="flex flex-col items-center gap-1 h-auto py-2 px-3 text-xs"
                onClick={() => fileInputRef.current?.click()}
                data-ocid="config.negocio.upload_button"
              >
                <ImageIcon size={16} /> Galería
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="flex flex-col items-center gap-1 h-auto py-2 px-3 text-xs"
                onClick={() => setShowCamera(true)}
                data-ocid="config.negocio.camera.button"
              >
                <Camera size={16} /> Cámara
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="flex flex-col items-center gap-1 h-auto py-2 px-3 text-xs text-destructive hover:text-destructive"
                onClick={() => setImagePreview(null)}
                disabled={!imagePreview}
                data-ocid="config.negocio.delete_button"
              >
                <Trash2 size={16} /> Eliminar
              </Button>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileChange}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="nombrePunto">Nombre del Punto</Label>
            <Input
              id="nombrePunto"
              placeholder="Ej. Tienda El Sol"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              data-ocid="config.negocio.input"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="telefono">Teléfono</Label>
            <Input
              id="telefono"
              type="tel"
              placeholder="Ej. +1 555 000 0000"
              value={telefono}
              onChange={(e) => setTelefono(e.target.value)}
              data-ocid="config.negocio.telefono.input"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="correo">Correo</Label>
            <Input
              id="correo"
              type="email"
              placeholder="Ej. negocio@email.com"
              value={correo}
              onChange={(e) => setCorreo(e.target.value)}
              data-ocid="config.negocio.correo.input"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="direccion">Dirección</Label>
            <Input
              id="direccion"
              placeholder="Ej. Calle 1 #23-45"
              value={direccion}
              onChange={(e) => setDireccion(e.target.value)}
              data-ocid="config.negocio.direccion.input"
            />
          </div>
          <Button
            className="w-full h-12 text-base font-semibold mt-2"
            onClick={handleGuardar}
            data-ocid="config.negocio.submit_button"
          >
            Guardar
          </Button>
        </div>
      </ScrollArea>
      {showCamera && (
        <CameraOverlay
          onCapture={(file) => {
            setImagePreview(URL.createObjectURL(file));
            setShowCamera(false);
          }}
          onClose={() => setShowCamera(false)}
        />
      )}
    </>
  );
}

// ---- Currency Sub-screen ----
function MonedaScreen({
  selectedCode,
  onSelect,
  onBack,
}: {
  selectedCode: string;
  onSelect: (code: string) => void;
  onBack: () => void;
}) {
  const [search, setSearch] = useState("");
  const filtered = CURRENCIES.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.code.toLowerCase().includes(search.toLowerCase()),
  );
  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      <div className="px-4 pt-3 pb-2 shrink-0">
        <Input
          placeholder="Buscar moneda..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          data-ocid="config.moneda.search_input"
        />
      </div>
      <ScrollArea className="flex-1">
        <div className="divide-y divide-border">
          {filtered.map((c) => (
            <button
              key={c.code}
              type="button"
              onClick={() => {
                onSelect(c.code);
                onBack();
              }}
              className="w-full flex items-center gap-3 px-4 py-3 hover:bg-muted/40 transition-colors text-left"
              data-ocid="config.moneda.item"
            >
              <span className="w-10 font-bold text-teal text-base shrink-0">
                {c.symbol}
              </span>
              <span className="font-semibold text-sm w-14 shrink-0">
                {c.code}
              </span>
              <span className="text-sm text-muted-foreground flex-1">
                {c.name}
              </span>
              {selectedCode === c.code && (
                <Check size={16} className="text-teal shrink-0" />
              )}
            </button>
          ))}
          {filtered.length === 0 && (
            <p className="text-center text-muted-foreground text-sm py-10">
              Sin resultados
            </p>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}

// ---- Appearance Sub-screen ----
function AparienciaScreen({ onBack: _onBack }: { onBack: () => void }) {
  const { theme: currentTheme, setTheme } = useAppTheme();
  return (
    <ScrollArea className="flex-1">
      <div className="px-4 pb-6 pt-4 space-y-4">
        <div>
          <p className="font-semibold">Tema de color</p>
          <p className="text-sm text-muted-foreground">
            Elige un tema para personalizar la aplicación
          </p>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {THEMES.map((t) => {
            const isActive = t.id === currentTheme.id;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => setTheme(t.id)}
                className={`relative rounded-2xl border-2 p-3 text-left transition-all ${
                  isActive
                    ? "border-primary bg-primary/5"
                    : "border-border bg-card hover:border-primary/40"
                }`}
                data-ocid="config.apariencia.toggle"
              >
                <div className="flex gap-1.5 mb-3">
                  <div
                    className="w-8 h-8 rounded-full border border-white/20"
                    style={{ background: t.primary }}
                  />
                  <div
                    className="w-8 h-8 rounded-full border border-white/20"
                    style={{ background: t.navy }}
                  />
                  <div
                    className="w-8 h-8 rounded-full border border-white/20"
                    style={{ background: t.accent }}
                  />
                </div>
                <p className="font-semibold text-sm">{t.name}</p>
                {isActive && (
                  <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                    <Check size={11} className="text-primary-foreground" />
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </ScrollArea>
  );
}

// ---- Salida Mercancia Sub-screen ----
function SalidaMercanciaConfigScreen({
  onBack: _onBack,
}: { onBack: () => void }) {
  const [tipos, setTipos] = useState<SalidaMercanciaTipo[]>(getTiposSalida);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);
  const [newName, setNewName] = useState("");
  const [listExpanded, setListExpanded] = useState(true);

  const persist = (updated: SalidaMercanciaTipo[]) => {
    setTipos(updated);
    saveTiposSalida(updated);
  };

  const handleAdd = () => {
    const name = newName.trim();
    if (!name) return;
    const updated = [...tipos, { id: crypto.randomUUID(), name }];
    persist(updated);
    setNewName("");
    setShowAddForm(false);
    toast.success(`Tipo "${name}" agregado`);
  };

  const handleSaveEdit = (id: string) => {
    const name = editName.trim();
    if (!name) return;
    persist(tipos.map((t) => (t.id === id ? { ...t, name } : t)));
    setEditingId(null);
    setEditName("");
    toast.success("Tipo actualizado");
  };

  const handleDelete = (id: string, name: string) => {
    persist(tipos.filter((t) => t.id !== id));
    setExpandedId(null);
    toast.success(`"${name}" eliminado`);
  };

  return (
    <ScrollArea className="flex-1">
      <div className="px-4 pb-6 pt-4">
        <div className="bg-card border border-border rounded-xl overflow-hidden shadow-xs">
          <div className="flex items-center gap-2 px-4 py-3 border-b border-border">
            <ArrowDownToLine size={16} className="text-orange-500" />
            <span className="font-semibold text-sm flex-1">
              Tipos de salida
            </span>
            <button
              type="button"
              onClick={() => setShowAddForm((v) => !v)}
              className="w-7 h-7 rounded-full bg-orange-500 flex items-center justify-center text-white hover:bg-orange-400 transition-colors"
              aria-label="Agregar tipo de salida"
            >
              <Plus size={15} />
            </button>
            <button
              type="button"
              onClick={() => setListExpanded((v) => !v)}
              className="w-7 h-7 rounded-full border border-border flex items-center justify-center text-muted-foreground hover:bg-muted transition-colors"
              aria-label="Mostrar/ocultar lista"
            >
              <ChevronDown
                size={15}
                className={`transition-transform duration-200 ${listExpanded ? "rotate-180" : "rotate-0"}`}
              />
            </button>
          </div>
          {showAddForm && (
            <div className="px-4 py-3 border-b border-border flex gap-2 bg-muted/30">
              <Input
                placeholder="Nombre del tipo de salida..."
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleAdd();
                }}
                className="flex-1 h-8 text-sm"
                autoFocus
                data-ocid="config.salida.input"
              />
              <button
                type="button"
                onClick={handleAdd}
                disabled={!newName.trim()}
                className="px-3 h-8 rounded-lg bg-orange-500 text-white text-sm hover:bg-orange-400 disabled:opacity-50 transition-colors"
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
          {listExpanded &&
            (tipos.length === 0 ? (
              <div className="py-8 text-center">
                <p className="text-muted-foreground text-sm">
                  Sin tipos de salida
                </p>
              </div>
            ) : (
              <div className="divide-y divide-border">
                {tipos.map((t, idx) => (
                  <div key={t.id} data-ocid={`config.salida.item.${idx + 1}`}>
                    <button
                      type="button"
                      onClick={() =>
                        setExpandedId((prev) => (prev === t.id ? null : t.id))
                      }
                      className="w-full flex items-center gap-3 px-4 py-3 hover:bg-muted/40 transition-colors text-left"
                    >
                      <ArrowDownToLine
                        size={15}
                        className="text-orange-500 shrink-0"
                      />
                      <span className="text-sm flex-1">{t.name}</span>
                    </button>
                    {expandedId === t.id && (
                      <div className="px-4 pb-3 bg-muted/20">
                        {editingId === t.id ? (
                          <div className="flex gap-2 items-center">
                            <Input
                              value={editName}
                              onChange={(e) => setEditName(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === "Enter") handleSaveEdit(t.id);
                              }}
                              className="flex-1 h-8 text-sm"
                              autoFocus
                            />
                            <button
                              type="button"
                              onClick={() => handleSaveEdit(t.id)}
                              disabled={!editName.trim()}
                              className="p-1.5 rounded-lg bg-orange-500 text-white hover:bg-orange-400 disabled:opacity-50 transition-colors"
                              aria-label="Guardar"
                            >
                              <Check size={14} />
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setEditingId(null);
                                setEditName("");
                              }}
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
                              onClick={() => {
                                setEditingId(t.id);
                                setEditName(t.name);
                              }}
                              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border text-sm hover:bg-muted transition-colors"
                            >
                              <Pencil size={13} />
                              <span>Editar</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDelete(t.id, t.name)}
                              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-destructive/40 text-destructive text-sm hover:bg-destructive/10 transition-colors"
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
            ))}
        </div>
      </div>
    </ScrollArea>
  );
}

// ---- Main Configuracion Page ----
export default function Configuracion() {
  const { data: paymentTypes = [], isLoading } = usePaymentTypes();
  const createPT = useCreatePaymentType();
  const deletePT = useDeletePaymentType();
  const updatePT = useUpdatePaymentType();

  const { theme: currentTheme } = useAppTheme();

  const [expandedId, setExpandedId] = useState<bigint | null>(null);
  const [editingId, setEditingId] = useState<bigint | null>(null);
  const [editName, setEditName] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);
  const [newName, setNewName] = useState("");
  const [listExpanded, setListExpanded] = useState(true);
  const [selectedCurrency, setSelectedCurrency] = useState("USD");

  type SubScreen = null | "negocio" | "moneda" | "apariencia" | "salida";
  const [activeSubScreen, setActiveSubScreen] = useState<SubScreen>(null);

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

  const SUB_TITLES: Record<NonNullable<SubScreen>, string> = {
    negocio: "Datos del negocio",
    moneda: "Seleccionar moneda",
    apariencia: "Apariencia",
    salida: "Salida de Mercancía",
  };

  if (activeSubScreen !== null) {
    return (
      <div className="flex flex-col flex-1 overflow-hidden h-full">
        <div className="flex items-center gap-3 px-4 py-3 border-b border-border shrink-0">
          <button
            type="button"
            onClick={() => setActiveSubScreen(null)}
            className="p-1.5 rounded-lg text-muted-foreground hover:bg-muted transition-colors"
            aria-label="Volver"
            data-ocid="config.back.button"
          >
            <ArrowLeft size={20} />
          </button>
          <h3 className="font-semibold text-base">
            {SUB_TITLES[activeSubScreen]}
          </h3>
        </div>
        {activeSubScreen === "negocio" && (
          <DatosNegocioScreen onBack={() => setActiveSubScreen(null)} />
        )}
        {activeSubScreen === "moneda" && (
          <MonedaScreen
            selectedCode={selectedCurrency}
            onSelect={setSelectedCurrency}
            onBack={() => setActiveSubScreen(null)}
          />
        )}
        {activeSubScreen === "apariencia" && (
          <AparienciaScreen onBack={() => setActiveSubScreen(null)} />
        )}
        {activeSubScreen === "salida" && (
          <SalidaMercanciaConfigScreen
            onBack={() => setActiveSubScreen(null)}
          />
        )}
      </div>
    );
  }

  const renderPaymentList = () => {
    if (isLoading)
      return (
        <div className="p-4 space-y-2">
          {[1, 2].map((i) => (
            <div key={i} className="h-10 bg-muted rounded-lg animate-pulse" />
          ))}
        </div>
      );
    if (paymentTypes.length === 0)
      return (
        <div className="py-8 text-center">
          <p className="text-muted-foreground text-sm">Sin tipos de pago</p>
        </div>
      );
    return (
      <ScrollArea className="max-h-80">
        <div className="divide-y divide-border">
          {paymentTypes.map((pt, idx) => (
            <div key={String(pt.id)} data-ocid={`config.item.${idx + 1}`}>
              <button
                type="button"
                onClick={() => toggleExpand(pt.id)}
                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-muted/40 transition-colors text-left"
              >
                <CreditCard size={15} className="text-teal shrink-0" />
                <span className="text-sm flex-1">{pt.name}</span>
              </button>
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
    );
  };

  return (
    <ScrollArea className="flex-1">
      <div className="px-4 pb-6 pt-4 space-y-3">
        {/* Datos del negocio */}
        <button
          type="button"
          onClick={() => setActiveSubScreen("negocio")}
          className="w-full bg-card border border-border rounded-xl flex items-center gap-3 px-4 py-4 hover:bg-muted/30 transition-colors text-left"
          data-ocid="config.negocio.button"
        >
          <div className="w-9 h-9 rounded-xl bg-teal/10 flex items-center justify-center shrink-0">
            <Building2 size={18} className="text-teal" />
          </div>
          <span className="font-medium text-sm flex-1">Datos del negocio</span>
          <ChevronRight size={16} className="text-muted-foreground" />
        </button>

        {/* Moneda */}
        <button
          type="button"
          onClick={() => setActiveSubScreen("moneda")}
          className="w-full bg-card border border-border rounded-xl flex items-center gap-3 px-4 py-4 hover:bg-muted/30 transition-colors text-left"
          data-ocid="config.moneda.button"
        >
          <div className="w-9 h-9 rounded-xl bg-teal/10 flex items-center justify-center shrink-0">
            <Coins size={18} className="text-teal" />
          </div>
          <span className="font-medium text-sm flex-1">Moneda</span>
          <span className="text-sm text-muted-foreground mr-2">
            {selectedCurrency}
          </span>
          <ChevronRight size={16} className="text-muted-foreground" />
        </button>

        {/* Apariencia */}
        <button
          type="button"
          onClick={() => setActiveSubScreen("apariencia")}
          className="w-full bg-card border border-border rounded-xl flex items-center gap-3 px-4 py-4 hover:bg-muted/30 transition-colors text-left"
          data-ocid="config.apariencia.button"
        >
          <div className="w-9 h-9 rounded-xl bg-teal/10 flex items-center justify-center shrink-0">
            <Palette size={18} className="text-teal" />
          </div>
          <span className="font-medium text-sm flex-1">Apariencia</span>
          <span className="text-sm text-muted-foreground mr-2">
            {currentTheme.name}
          </span>
          <ChevronRight size={16} className="text-muted-foreground" />
        </button>

        {/* Tipos de pago */}
        <div className="bg-card border border-border rounded-xl overflow-hidden shadow-xs">
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
            <button
              type="button"
              onClick={() => setListExpanded((v) => !v)}
              className="w-7 h-7 rounded-full border border-border flex items-center justify-center text-muted-foreground hover:bg-muted transition-colors"
              aria-label="Mostrar/ocultar lista"
            >
              <ChevronDown
                size={15}
                className={`transition-transform duration-200 ${listExpanded ? "rotate-180" : "rotate-0"}`}
              />
            </button>
          </div>
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
                data-ocid="config.payment.input"
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
          {listExpanded && renderPaymentList()}
        </div>

        {/* Salida de Mercancía */}
        <button
          type="button"
          onClick={() => setActiveSubScreen("salida")}
          className="w-full bg-card border border-border rounded-xl flex items-center gap-3 px-4 py-4 hover:bg-muted/30 transition-colors text-left"
          data-ocid="config.salida.button"
        >
          <div className="w-9 h-9 rounded-xl bg-orange-500/10 flex items-center justify-center shrink-0">
            <ArrowDownToLine size={18} className="text-orange-500" />
          </div>
          <span className="font-medium text-sm flex-1">
            Salida de Mercancía
          </span>
          <ChevronRight size={16} className="text-muted-foreground" />
        </button>

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
    </ScrollArea>
  );
}
