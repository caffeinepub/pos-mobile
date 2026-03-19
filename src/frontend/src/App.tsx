import { Toaster } from "@/components/ui/sonner";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  BarChart2,
  List,
  Menu,
  Package,
  PlusCircle,
  Settings,
  ShoppingCart,
  UserCheck,
  Users,
  X,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { useSeed } from "./hooks/useQueries";
import Clientes from "./pages/Clientes";
import Configuracion from "./pages/Configuracion";
import Inventario from "./pages/Inventario";
import NuevaVenta from "./pages/NuevaVenta";
import Promovedores from "./pages/Promovedores";
import Reportes from "./pages/Reportes";
import Ventas from "./pages/Ventas";

const queryClient = new QueryClient();

type Screen =
  | "nueva-venta"
  | "ventas"
  | "inventario"
  | "clientes"
  | "promovedores"
  | "reportes"
  | "configuracion";

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
    id: "inventario",
    label: "Inventario",
    icon: <Package size={18} />,
    section: 2,
  },
  { id: "clientes", label: "Clientes", icon: <Users size={18} />, section: 2 },
  {
    id: "promovedores",
    label: "Promovedores",
    icon: <UserCheck size={18} />,
    section: 2,
  },
  {
    id: "reportes",
    label: "Reportes",
    icon: <BarChart2 size={18} />,
    section: 3,
  },
  {
    id: "configuracion",
    label: "Configuración",
    icon: <Settings size={18} />,
    section: 3,
  },
];

const SCREEN_TITLES: Record<Screen, string> = {
  "nueva-venta": "Nueva Venta",
  ventas: "Ventas",
  inventario: "Inventario",
  clientes: "Clientes",
  promovedores: "Promovedores",
  reportes: "Reportes",
  configuracion: "Configuración",
};

function SeedButton() {
  const seed = useSeed();
  return (
    <button
      type="button"
      onClick={() => seed.mutate()}
      disabled={seed.isPending}
      className="mt-auto mx-4 mb-4 py-2 px-3 rounded-lg text-xs text-white/50 hover:text-white/80 hover:bg-white/5 transition-colors text-left"
    >
      {seed.isPending ? "Cargando datos..." : "Cargar datos demo"}
    </button>
  );
}

function AppInner() {
  const [activeScreen, setActiveScreen] = useState<Screen>("nueva-venta");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const navigate = (screen: Screen) => {
    setActiveScreen(screen);
    setSidebarOpen(false);
  };

  const sections = [1, 2, 3];

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
        <div className="flex items-center gap-1">
          <ShoppingCart size={18} className="text-teal" />
        </div>
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
              className="fixed top-0 left-0 h-full w-72 bg-navy z-50 flex flex-col shadow-navy"
              aria-label="Menú lateral"
            >
              {/* Sidebar header */}
              <div className="flex items-center justify-between px-4 h-14 border-b border-white/10">
                <span className="text-white font-bold text-lg tracking-tight">
                  POS Mobile
                </span>
                <button
                  type="button"
                  data-ocid="nav.close_button"
                  onClick={() => setSidebarOpen(false)}
                  className="p-1.5 rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition-colors"
                  aria-label="Cerrar menú"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Nav items */}
              <nav className="flex-1 overflow-y-auto py-3">
                {sections.map((section, sIdx) => (
                  <div key={section}>
                    {sIdx > 0 && <hr className="border-white/10 my-2 mx-4" />}
                    {SCREENS.filter((s) => s.section === section).map(
                      (item) => (
                        <button
                          type="button"
                          key={item.id}
                          data-ocid={`nav.${item.id}.link`}
                          onClick={() => navigate(item.id)}
                          className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium transition-colors ${
                            activeScreen === item.id
                              ? "bg-white/10 text-teal"
                              : "text-white/70 hover:bg-white/5 hover:text-white"
                          }`}
                        >
                          <span
                            className={
                              activeScreen === item.id
                                ? "text-teal"
                                : "text-white/50"
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

              <SeedButton />

              {/* Footer */}
              <div className="px-4 pb-6 pt-2 border-t border-white/10">
                <p className="text-white/30 text-xs text-center">
                  © {new Date().getFullYear()}.{" "}
                  <a
                    href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
                    target="_blank"
                    rel="noreferrer"
                    className="hover:text-white/60 transition-colors"
                  >
                    caffeine.ai
                  </a>
                </p>
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
              activeScreen === "nueva-venta"
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
                <NuevaVenta />
              </div>
            )}
            {activeScreen === "ventas" && <Ventas />}
            {activeScreen === "inventario" && <Inventario />}
            {activeScreen === "clientes" && <Clientes />}
            {activeScreen === "promovedores" && <Promovedores />}
            {activeScreen === "reportes" && <Reportes />}
            {activeScreen === "configuracion" && <Configuracion />}
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
      <AppInner />
    </QueryClientProvider>
  );
}
