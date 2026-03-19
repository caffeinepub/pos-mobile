import { BarChart2, FileText, TrendingUp } from "lucide-react";
import { useCustomers, useProducts, useSales } from "../hooks/useQueries";

export default function Reportes() {
  const { data: sales = [] } = useSales();
  const { data: products = [] } = useProducts();
  const { data: customers = [] } = useCustomers();

  const totalRevenue = sales.reduce((acc, s) => acc + Number(s.totalAmount), 0);
  const avgSale = sales.length > 0 ? totalRevenue / sales.length : 0;

  const formatCurrency = (n: number) =>
    new Intl.NumberFormat("es-MX", {
      style: "currency",
      currency: "MXN",
    }).format(n / 100);

  const stats = [
    {
      label: "Total Ventas",
      value: sales.length.toString(),
      icon: <FileText size={20} className="text-teal" />,
      desc: "ventas registradas",
    },
    {
      label: "Ingresos Totales",
      value: formatCurrency(totalRevenue),
      icon: <TrendingUp size={20} className="text-teal" />,
      desc: "acumulado",
    },
    {
      label: "Venta Promedio",
      value: formatCurrency(avgSale),
      icon: <BarChart2 size={20} className="text-teal" />,
      desc: "por venta",
    },
    {
      label: "Clientes",
      value: customers.length.toString(),
      icon: <FileText size={20} className="text-teal" />,
      desc: "registrados",
    },
    {
      label: "Productos",
      value: products.length.toString(),
      icon: <BarChart2 size={20} className="text-teal" />,
      desc: "en inventario",
    },
  ];

  return (
    <div className="px-4 pb-6 pt-4">
      <p className="text-sm text-muted-foreground mb-5">
        Resumen general del negocio
      </p>
      <div className="grid grid-cols-2 gap-3">
        {stats.map((s) => (
          <div
            key={s.label}
            className="bg-card border border-border rounded-xl p-4 flex flex-col gap-2"
          >
            <div className="flex items-center gap-2">
              {s.icon}
              <span className="text-xs text-muted-foreground">{s.label}</span>
            </div>
            <p className="text-xl font-bold text-foreground leading-none">
              {s.value}
            </p>
            <p className="text-xs text-muted-foreground">{s.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
