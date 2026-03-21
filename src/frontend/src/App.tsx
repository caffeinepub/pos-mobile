import { Toaster } from "@/components/ui/sonner";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  ArrowDownToLine,
  ArrowUpToLine,
  BarChart2,
  Info,
  List,
  Menu,
  Package,
  Phone,
  PlusCircle,
  Settings,
  UserCheck,
  Users,
  X,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { ThemeProvider } from "./context/ThemeContext";
import { useSeed } from "./hooks/useQueries";
import AcercaDe from "./pages/AcercaDe";
import Clientes from "./pages/Clientes";
import Configuracion from "./pages/Configuracion";
import Contactar from "./pages/Contactar";
import EntradaMercancia from "./pages/EntradaMercancia";
import Inventario from "./pages/Inventario";
import NuevaVenta from "./pages/NuevaVenta";
import Promovedores from "./pages/Promovedores";
import Reportes from "./pages/Reportes";
import SalidaMercancia from "./pages/SalidaMercancia";
import Ventas from "./pages/Ventas";

const queryClient = new QueryClient();

type Screen =
  | "nueva-venta"
  | "ventas"
  | "entrada-mercancia"
  | "salida-mercancia"
  | "inventario"
  | "clientes"
  | "promovedores"
  | "reportes"
  | "configuracion"
  | "acerca-de"
  | "contactar";

const SCREENS: {
  id: Screen;
  label: string;
  icon: React.ReactNode;
  section: number;
}[] = [
  {
    id: "nueva-venta",
    label: "Nueva Venta",
    icon: <PlusCircle size={18} />,
    section: 1,
  },
  { id: "ventas", label: "Ventas", icon: <List size={18} />, section: 1 },
  {
    id: "entrada-mercancia",
    label: "Entrada de Mercancía",
    icon: <ArrowUpToLine size={18} />,
    section: 2,
  },
  {
    id: "salida-mercancia",
    label: "Salida de Mercancía",
    icon: <ArrowDownToLine size={18} />,
    section: 2,
  },
  {
    id: "inventario",
    label: "Inventario",
    icon: <Package size={18} />,
    section: 2,
  },
  { id: "clientes", label: "Clientes", icon: <Users size={18} />, section: 3 },
  {
    id: "promovedores",
    label: "Proveedores",
    icon: <UserCheck size={18} />,
    section: 3,
  },
  {
    id: "reportes",
    label: "Reportes",
    icon: <BarChart2 size={18} />,
    section: 4,
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
  { id: "acerca-de", label: "Acerca de", icon: <Info size={18} />, section: 4 },
];

const SCREEN_TITLES: Record<Screen, string> = {
  "nueva-venta": "Nueva Venta",
  ventas: "Ventas",
  "entrada-mercancia": "Entrada de Mercancía",
  "salida-mercancia": "Salida de Mercancía",
  inventario: "Inventario",
  clientes: "Clientes",
  promovedores: "Proveedores",
  reportes: "Reportes",
  configuracion: "Configuración",
  "acerca-de": "Acerca de",
  contactar: "Contactar",
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
  const [activeScreen, setActiveScreen] = useState<Screen>("nueva-venta");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [returnToEntrada, setReturnToEntrada] = useState(false);
  const [inventarioOpenAdd, setInventarioOpenAdd] = useState(false);

  const navigate = (screen: Screen) => {
    setActiveScreen(screen);
    setSidebarOpen(false);
  };
  const sections = [1, 2, 3, 4];

  const handleAddNewProductFromEntrada = () => {
    setReturnToEntrada(true);
    setInventarioOpenAdd(true);
    setActiveScreen("inventario");
    setSidebarOpen(false);
  };

  const handleInventarioAddComplete = () => {
    setInventarioOpenAdd(false);
    if (returnToEntrada) {
      setReturnToEntrada(false);
      setActiveScreen("entrada-mercancia");
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
          POS Mobile
        </h1>
      </header>

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
              {/* Sidebar Header with Logo — keeps navy background */}
              <div className="relative flex flex-col items-center justify-center py-5 px-4 bg-navy border-b border-white/10 min-h-28">
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
                  src="/assets/generated/pos-register-transparent.dim_200x200.png"
                  alt="POS Mobile logo"
                  className="w-14 h-14 object-contain mb-2"
                />
                <span className="text-white font-bold text-base tracking-tight">
                  POS Mobile
                </span>
              </div>

              {/* Nav items — white background */}
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
                          onClick={() => navigate(item.id)}
                          className={`w-full flex items-center gap-3 px-5 py-2.5 text-sm font-medium transition-colors ${
                            activeScreen === item.id
                              ? "bg-gray-100 text-navy font-semibold border-l-4 border-navy"
                              : "text-gray-700 hover:bg-gray-50 hover:text-navy border-l-4 border-transparent"
                          }`}
                        >
                          <span
                            className={
                              activeScreen === item.id
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

              {/* Footer — white background */}
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
              activeScreen === "nueva-venta" ||
              activeScreen === "entrada-mercancia" ||
              activeScreen === "salida-mercancia"
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

            {activeScreen === "nueva-venta" && (
              <div className="flex-1 overflow-hidden flex flex-col">
                <NuevaVenta onNavigateToClientes={() => navigate("clientes")} />
              </div>
            )}
            {activeScreen === "ventas" && <Ventas />}
            {activeScreen === "entrada-mercancia" && (
              <div className="flex-1 overflow-hidden flex flex-col">
                <EntradaMercancia
                  onAddNewProduct={handleAddNewProductFromEntrada}
                />
              </div>
            )}
            {activeScreen === "salida-mercancia" && (
              <div className="flex-1 overflow-hidden flex flex-col">
                <SalidaMercancia />
              </div>
            )}
            {activeScreen === "inventario" && (
              <Inventario
                openAdd={inventarioOpenAdd}
                onAddComplete={handleInventarioAddComplete}
              />
            )}
            {activeScreen === "clientes" && <Clientes />}
            {activeScreen === "promovedores" && <Promovedores />}
            {activeScreen === "reportes" && <Reportes />}
            {activeScreen === "configuracion" && <Configuracion />}
            {activeScreen === "contactar" && <Contactar />}
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
