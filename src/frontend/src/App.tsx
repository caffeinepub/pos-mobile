import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Toaster } from "@/components/ui/sonner";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  BarChart2,
  CalendarX2,
  Factory,
  FileText,
  HelpCircle,
  Info,
  Menu,
  Package,
  Phone,
  Settings,
  Store,
  UserCheck,
  UserCog,
  Users,
  X,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { toast } from "sonner";
import { ThemeProvider } from "./context/ThemeContext";
import { useSeed } from "./hooks/useQueries";
import AcercaDe from "./pages/AcercaDe";
import Ayuda from "./pages/Ayuda";
import Clientes from "./pages/Clientes";
import Configuracion from "./pages/Configuracion";
import Contactar from "./pages/Contactar";
import Empleados from "./pages/Empleados";
import Facturas from "./pages/Facturas";
import Inventario from "./pages/Inventario";
import Produccion from "./pages/Produccion";
import Promovedores from "./pages/Promovedores";
import PuntosDeVentas from "./pages/PuntosDeVentas";
import Reportes from "./pages/Reportes";

import { advanceWorkDate } from "./utils/diaLaboral";

const queryClient = new QueryClient();

type Screen =
  | "puntos-de-ventas"
  | "inventario"
  | "produccion"
  | "clientes"
  | "promovedores"
  | "facturas"
  | "empleados"
  | "reportes"
  | "cerrar-dia"
  | "configuracion"
  | "contactar"
  | "ayuda"
  | "acerca-de";

const SCREENS: {
  id: Screen;
  label: string;
  icon: React.ReactNode;
  section: number;
  special?: boolean;
}[] = [
  // Section 1
  {
    id: "puntos-de-ventas",
    label: "Puntos de Ventas",
    icon: <Store size={18} />,
    section: 1,
  },
  // Section 2
  {
    id: "inventario",
    label: "Inventario",
    icon: <Package size={18} />,
    section: 2,
  },
  {
    id: "produccion",
    label: "Producción",
    icon: <Factory size={18} />,
    section: 2,
  },
  // Section 3
  { id: "clientes", label: "Clientes", icon: <Users size={18} />, section: 3 },
  {
    id: "promovedores",
    label: "Proveedores",
    icon: <UserCheck size={18} />,
    section: 3,
  },
  {
    id: "facturas",
    label: "Facturas",
    icon: <FileText size={18} />,
    section: 3,
  },
  {
    id: "empleados",
    label: "Empleados",
    icon: <UserCog size={18} />,
    section: 3,
  },
  // Section 4
  {
    id: "reportes",
    label: "Reportes",
    icon: <BarChart2 size={18} />,
    section: 4,
  },
  {
    id: "cerrar-dia",
    label: "Cerrar Día",
    icon: <CalendarX2 size={18} />,
    section: 4,
    special: true,
  },
  {
    id: "configuracion",
    label: "Configuración",
    icon: <Settings size={18} />,
    section: 4,
  },
  {
    id: "contactar",
    label: "Contactar",
    icon: <Phone size={18} />,
    section: 4,
  },
  {
    id: "ayuda",
    label: "Ayuda",
    icon: <HelpCircle size={18} />,
    section: 4,
  },
  { id: "acerca-de", label: "Acerca de", icon: <Info size={18} />, section: 4 },
];

const SCREEN_TITLES: Record<Screen, string> = {
  "puntos-de-ventas": "Puntos de Ventas",
  inventario: "Inventario",
  produccion: "Producción",
  clientes: "Clientes",
  promovedores: "Proveedores",
  facturas: "Facturas",
  empleados: "Empleados",
  reportes: "Reportes",
  "cerrar-dia": "Cerrar Día",
  configuracion: "Configuración",
  contactar: "Contactar",
  ayuda: "Ayuda",
  "acerca-de": "Acerca de",
};

function SeedButton() {
  const seed = useSeed();
  return (
    <button
      type="button"
      onClick={() => seed.mutate()}
      disabled={seed.isPending}
      className="mt-auto mx-4 mb-4 py-2 px-3 rounded-lg text-xs text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors text-left"
    >
      {seed.isPending ? "Cargando datos..." : "Cargar datos demo"}
    </button>
  );
}

function AppInner() {
  const [activeScreen, setActiveScreen] = useState<Screen>("puntos-de-ventas");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [inventarioOpenAdd, setInventarioOpenAdd] = useState(false);
  const [inventarioActiveTab, setInventarioActiveTab] = useState<
    "catalogo" | "movimientos" | "almacenes"
  >("catalogo");
  const [showCerrarDiaDialog, setShowCerrarDiaDialog] = useState(false);

  const navigate = (screen: Screen) => {
    setActiveScreen(screen);
    setSidebarOpen(false);
  };
  const sections = [1, 2, 3, 4];

  const handleInventarioAddComplete = () => {
    setInventarioOpenAdd(false);
  };

  const handleCerrarDia = () => {
    const nextDate = advanceWorkDate();
    setShowCerrarDiaDialog(false);
    setSidebarOpen(false);
    toast.success(`Día cerrado. Fecha de trabajo: ${nextDate}`);
  };

  const handleNavClick = (item: (typeof SCREENS)[0]) => {
    if (item.special && item.id === "cerrar-dia") {
      setSidebarOpen(false);
      setShowCerrarDiaDialog(true);
    } else {
      navigate(item.id);
    }
  };

  return (
    <div className="flex flex-col h-screen w-full bg-background overflow-hidden">
      {/* Top App Bar */}
      <header className="bg-navy flex items-center h-14 px-4 shrink-0 shadow-navy z-30">
        <button
          type="button"
          data-ocid="nav.open_modal_button"
          onClick={() => setSidebarOpen(true)}
          className="p-2 rounded-lg text-white hover:bg-white/10 transition-colors mr-3"
          aria-label="Abrir menú"
        >
          <Menu size={22} />
        </button>
        <h1 className="text-white font-semibold text-lg tracking-tight flex-1">
          CUBANEXUS
        </h1>
      </header>

      {/* Cerrar Día confirmation dialog */}
      <AlertDialog
        open={showCerrarDiaDialog}
        onOpenChange={setShowCerrarDiaDialog}
      >
        <AlertDialogContent data-ocid="cerrar-dia.dialog">
          <AlertDialogHeader>
            <AlertDialogTitle>¿Cerrar el día de trabajo?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción marcará como terminadas todas las ventas, entradas y
              salidas de mercancía del día actual. La fecha de trabajo avanzará
              al día siguiente. Los datos no se eliminarán y podrás consultarlos
              en los Reportes filtrando por fecha.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-ocid="cerrar-dia.cancel_button">
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              data-ocid="cerrar-dia.confirm_button"
              onClick={handleCerrarDia}
              className="bg-amber-500 hover:bg-amber-600 text-white"
            >
              Cerrar Día
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Sidebar overlay */}
      <AnimatePresence>
        {sidebarOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 bg-black/50 z-40"
              onClick={() => setSidebarOpen(false)}
            />
            <motion.aside
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", stiffness: 320, damping: 32 }}
              className="fixed top-0 left-0 h-full w-72 z-50 flex flex-col shadow-navy overflow-hidden"
              aria-label="Menú lateral"
            >
              {/* Sidebar Header with Logo */}
              <div className="relative flex flex-col items-center justify-center py-6 px-4 bg-navy border-b border-white/10 min-h-36">
                <button
                  type="button"
                  data-ocid="nav.close_button"
                  onClick={() => setSidebarOpen(false)}
                  className="absolute top-3 right-3 p-1.5 rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition-colors"
                  aria-label="Cerrar menú"
                >
                  <X size={18} />
                </button>
                <img
                  src="/assets/generated/cubanexus-logo-transparent.dim_400x400.png"
                  alt="CUBANEXUS logo"
                  className="w-28 h-28 object-contain mb-2"
                  style={{ mixBlendMode: "screen" }}
                />
                <span className="text-white font-bold text-base tracking-widest uppercase">
                  CUBANEXUS
                </span>
              </div>

              {/* Nav items */}
              <nav className="flex-1 overflow-y-auto bg-white py-2">
                {sections.map((section, sIdx) => (
                  <div key={section}>
                    {sIdx > 0 && <hr className="border-gray-200 my-1 mx-4" />}
                    {SCREENS.filter((s) => s.section === section).map(
                      (item) => (
                        <button
                          type="button"
                          key={item.id}
                          data-ocid={`nav.${item.id}.link`}
                          onClick={() => handleNavClick(item)}
                          className={`w-full flex items-center gap-3 px-5 py-2.5 text-sm font-medium transition-colors ${
                            !item.special && activeScreen === item.id
                              ? "bg-gray-100 text-navy font-semibold border-l-4 border-navy"
                              : "text-gray-700 hover:bg-gray-50 hover:text-navy border-l-4 border-transparent"
                          }`}
                        >
                          <span
                            className={
                              !item.special && activeScreen === item.id
                                ? "text-navy"
                                : "text-gray-500"
                            }
                          >
                            {item.icon}
                          </span>
                          {item.label}
                        </button>
                      ),
                    )}
                  </div>
                ))}
              </nav>

              {/* Footer */}
              <div className="bg-white">
                <SeedButton />
                <div className="px-4 pb-6 pt-2 border-t border-gray-200">
                  <p className="text-gray-400 text-xs text-center">
                    ©{" "}
                    <a
                      href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
                      target="_blank"
                      rel="noreferrer"
                      className="hover:text-gray-600 transition-colors"
                    >
                      caffeine.ai
                    </a>
                  </p>
                </div>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Main content */}
      <main className="flex-1 overflow-hidden relative">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeScreen}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.18 }}
            className={`absolute inset-0 flex flex-col ${
              activeScreen === "puntos-de-ventas" ||
              activeScreen === "inventario"
                ? "overflow-hidden"
                : "overflow-y-auto"
            }`}
          >
            {/* Screen title bar */}
            <div className="sticky top-0 z-10 bg-background border-b border-border px-4 py-3 shrink-0">
              <h2 className="font-semibold text-foreground text-base">
                {SCREEN_TITLES[activeScreen]}
              </h2>
            </div>

            {activeScreen === "puntos-de-ventas" && (
              <div className="flex-1 overflow-hidden flex flex-col">
                <PuntosDeVentas
                  onNavigateToClientes={() => navigate("clientes")}
                />
              </div>
            )}
            {activeScreen === "inventario" && (
              <div className="flex-1 overflow-hidden flex flex-col">
                <Inventario
                  openAdd={inventarioOpenAdd}
                  onAddComplete={handleInventarioAddComplete}
                  activeTab={inventarioActiveTab}
                  onTabChange={(tab) =>
                    setInventarioActiveTab(
                      tab as "catalogo" | "movimientos" | "almacenes",
                    )
                  }
                />
              </div>
            )}
            {activeScreen === "produccion" && <Produccion />}
            {activeScreen === "facturas" && <Facturas />}
            {activeScreen === "empleados" && <Empleados />}
            {activeScreen === "clientes" && <Clientes />}
            {activeScreen === "promovedores" && <Promovedores />}
            {activeScreen === "reportes" && <Reportes />}
            {activeScreen === "configuracion" && <Configuracion />}
            {activeScreen === "contactar" && <Contactar />}
            {activeScreen === "ayuda" && <Ayuda />}
            {activeScreen === "acerca-de" && <AcercaDe />}
          </motion.div>
        </AnimatePresence>
      </main>

      <Toaster position="top-center" richColors />
    </div>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AppInner />
      </ThemeProvider>
    </QueryClientProvider>
  );
}
