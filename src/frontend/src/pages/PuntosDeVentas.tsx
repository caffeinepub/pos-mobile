import { List, Package, ShoppingCart } from "lucide-react";
import { useState } from "react";
import InventarioPV from "./InventarioPV";
import NuevaVenta from "./NuevaVenta";
import Ventas from "./Ventas";

type TabId = "nueva-venta" | "ventas" | "inventario-pv";

const TABS: { id: TabId; label: string; icon: React.ReactNode }[] = [
  { id: "nueva-venta", label: "Nueva Venta", icon: <ShoppingCart size={14} /> },
  { id: "ventas", label: "Ventas", icon: <List size={14} /> },
  { id: "inventario-pv", label: "Inventario PV", icon: <Package size={14} /> },
];

interface Props {
  onNavigateToClientes: () => void;
}

export default function PuntosDeVentas({ onNavigateToClientes }: Props) {
  const [activeTab, setActiveTab] = useState<TabId>("nueva-venta");

  return (
    <div className="flex flex-col flex-1 overflow-hidden h-full relative">
      {/* Tab bar */}
      <div className="border-b border-border bg-background shrink-0">
        <div
          className="flex overflow-x-auto scrollbar-hide"
          data-ocid="puntos-de-ventas.tab"
        >
          {TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 px-3 py-2.5 text-xs font-medium whitespace-nowrap transition-colors border-b-2 shrink-0 ${
                activeTab === tab.id
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
              data-ocid={`puntos-de-ventas.${tab.id}.tab`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab content */}
      {activeTab === "nueva-venta" && (
        <div className="flex-1 overflow-hidden flex flex-col">
          <NuevaVenta onNavigateToClientes={onNavigateToClientes} />
        </div>
      )}
      {activeTab === "ventas" && <Ventas />}
      {activeTab === "inventario-pv" && <InventarioPV />}
    </div>
  );
}
