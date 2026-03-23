import { ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";

const HELP_SECTIONS = [
  {
    id: "nueva-venta",
    title: "Nueva Venta",
    content:
      'Permite registrar una venta. Agrega productos al carrito usando el escáner de código de barras o el botón de agregar manualmente. Selecciona el tipo de pago (obligatorio). El cliente es opcional. Si el pago es en Efectivo, ingresa el monto pagado y el sistema calcula el cambio automáticamente. Pulsa "Realizar venta" para confirmar.',
  },
  {
    id: "ventas",
    title: "Ventas",
    content:
      "Muestra el historial de ventas realizadas. Cada venta indica cliente, tipo de pago, fecha y total. Toca una venta para ver el detalle con los productos. Usa el menú de tres puntos (⋮) para buscar, filtrar por fecha, monto o cliente, y exportar en PDF o CSV. Al eliminar una venta, los productos regresan al inventario automáticamente y se genera un reporte de productos restituidos.",
  },
  {
    id: "entrada-mercancia",
    title: "Entrada de Mercancía",
    content:
      'Registra el ingreso de productos al inventario sin afectar las ventas. Selecciona uno o varios productos con las casillas de verificación, ajusta las cantidades y elige el tipo de entrada (IR, Transferencia u otros configurados). Si un producto no existe en el inventario, usa el botón "Nuevo producto" para agregarlo y luego continúa el proceso. Al confirmar, el stock de los productos seleccionados aumenta.',
  },
  {
    id: "salida-mercancia",
    title: "Salida de Mercancía",
    content:
      "Registra la salida de productos del inventario por razones distintas a una venta (mermas, consumo interno, donaciones, etc.). Selecciona los productos con casillas de verificación, ingresa las cantidades y elige el tipo de salida. Solo se pueden seleccionar productos que tengan stock disponible. Al confirmar, el stock se reduce y queda registrado en el reporte de Salidas.",
  },
  {
    id: "inventario",
    title: "Inventario",
    content:
      'Lista todos los productos disponibles. Cada producto muestra imagen (o marcador si no tiene), nombre, código y precio. Usa el botón "+" flotante para agregar un nuevo producto (nombre y precio de venta son obligatorios). Toca el ícono de lápiz para editar y el de papelera para eliminar. Cambia entre vista de lista y cuadrícula con los íconos en la esquina superior derecha. El menú (⋮) permite buscar, importar CSV, exportar CSV y exportar PDF.',
  },
  {
    id: "clientes",
    title: "Clientes",
    content:
      "Gestiona la lista de clientes. Cada cliente tiene: código (automático, últimos 5 dígitos del NIT), nombre, código REEUP, correo, teléfono, NIT, dirección, cuenta bancaria, ICRR, provincia y país. Solo nombre y NIT son obligatorios. Edita con el ícono de lápiz y elimina con el de papelera. El menú (⋮) permite buscar, importar y exportar CSV/PDF.",
  },
  {
    id: "proveedores",
    title: "Proveedores",
    content:
      "Funciona igual que Clientes, pero para proveedores. Usa los mismos campos y las mismas opciones de búsqueda, importación y exportación.",
  },
  {
    id: "reportes",
    title: "Reportes",
    content:
      "Muestra un resumen general de ventas, ingresos, clientes y productos. Toca las tarjetas para ver reportes detallados:\n\n• Total Ventas / Ingresos: gráfico de barras por día, filtro de fecha, estadísticas (total, por cliente, más alta, más baja, promedio). Exportable en PDF.\n• Productos: gráfico por producto, filtro de fecha, estadísticas (más vendido, menos vendido, más ingresos, menos ingresos). Exportable en PDF.\n• Salidas de Mercancía: movimientos de salida no relacionados con ventas. Exportable en PDF.\n• Entradas de Mercancía: movimientos de entrada al inventario. Exportable en PDF.\n• Productos Restituidos: generado automáticamente al eliminar una venta; muestra los productos devueltos al inventario.\n• IPV: tabla detallada con todos los movimientos de cada producto: stock inicial, entradas, disponible, ventas, salidas por tipo, stock final. Exportable en PDF y CSV.",
  },
  {
    id: "configuracion",
    title: "Configuración",
    content:
      "Permite personalizar la aplicación en seis apartados:\n\n• Datos del negocio: nombre, teléfono, correo, dirección e imagen del negocio.\n• Moneda: selección entre más de 90 monedas del mundo con buscador.\n• Apariencia: seis temas de color disponibles (Océano, Atardecer, Bosque, Violeta, Rojo Pasión, Cielo).\n• Tipo de Pago: agrega, edita y elimina los tipos de pago disponibles en las ventas.\n• Salida de Mercancía: configura los tipos de salida (Merma, Consumo interno, Donación, etc.).\n• Entrada de Mercancía: configura los tipos de entrada (IR, Transferencia, etc.).\n• Producción: configura los tipos de merma usados en el módulo de Producción (Evaporación, Desperdicio, etc.).",
  },
  {
    id: "contactar",
    title: "Contactar",
    content:
      "Muestra los datos de contacto del soporte: WhatsApp/Telegram (+5356212657), correo electrónico (yosmelpalmero@nauta.cu) y Telegram (@YossNoa).",
  },
  {
    id: "produccion",
    title: "Producción",
    content:
      "El módulo de Producción permite gestionar el proceso de fabricación desde los insumos hasta los productos terminados.\n\n• Insumos: registra las materias primas disponibles (nombre, código, cantidad, unidad, costo unitario). Puedes rebajar stock por merma indicando el tipo (Evaporación, Desperdicio, etc.) y la cantidad. El historial de movimientos se muestra al expandir cada insumo.\n\n• Fichas de Elaboración: define recetas con los insumos necesarios por lote, el rendimiento (unidades producidas) y las cantidades de cada insumo. El sistema calcula automáticamente el costo total del lote y el costo por unidad.\n\n• Producción (Ordenes): crea órdenes de producción seleccionando una ficha y el número de lotes. El sistema verifica si hay insumos suficientes. Al iniciar la orden, los insumos se descuentan. Al completarla, se crea un registro en Productos Terminados. También puedes registrar mermas durante el proceso.\n\n• Productos Terminados: muestra los productos listos con su cantidad disponible y costo por unidad. Usa Transferir a Inventario para mover unidades al inventario de ventas.\n\n• Configuración: en Configuración > Producción puedes administrar los tipos de merma disponibles.",
  },
  {
    id: "acerca-de",
    title: "Acerca de",
    content:
      "Muestra el nombre de la aplicación (POS Mobile), la versión (1.0) y los documentos legales: Política de Privacidad, Términos y Condiciones, y Licencias.",
  },
];

function HelpItem({ title, content }: { title: string; content: string }) {
  const [open, setOpen] = useState(false);
  const lines = content.split("\n").filter((l) => l.trim() !== "");

  return (
    <div className="border-b border-border last:border-b-0">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-4 py-3.5 text-left hover:bg-gray-50 transition-colors"
        aria-expanded={open}
      >
        <span className="font-medium text-sm text-foreground">{title}</span>
        {open ? (
          <ChevronUp size={16} className="text-gray-400 shrink-0" />
        ) : (
          <ChevronDown size={16} className="text-gray-400 shrink-0" />
        )}
      </button>
      {open && (
        <div className="px-4 pb-4">
          {lines.map((line) => (
            <p
              key={line.slice(0, 40)}
              className="text-sm text-gray-600 leading-relaxed mb-1.5 last:mb-0"
            >
              {line}
            </p>
          ))}
        </div>
      )}
    </div>
  );
}

export default function Ayuda() {
  return (
    <div className="flex flex-col h-full overflow-y-auto bg-background">
      <div className="px-4 py-3 bg-blue-50 border-b border-border">
        <p className="text-xs text-blue-700 leading-relaxed">
          Toca cualquier sección para ver su descripción y aprender cómo usarla.
        </p>
      </div>
      <div className="flex-1">
        {HELP_SECTIONS.map((section) => (
          <HelpItem
            key={section.id}
            title={section.title}
            content={section.content}
          />
        ))}
      </div>
      <div className="px-4 py-5 text-center">
        <p className="text-xs text-gray-400">
          © {new Date().getFullYear()}. Construido con ♥ usando{" "}
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
  );
}
