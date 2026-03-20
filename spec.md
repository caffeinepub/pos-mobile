# POS Mobile

## Current State
App v19 con Nueva Venta, Ventas (con restauración de stock al eliminar), Inventario, Clientes, Proveedores, Reportes (ventas + productos), Configuración (4 contenedores) y Acerca de.

## Requested Changes (Diff)

### Add
- Al eliminar una venta: mostrar un diálogo de confirmación con resumen de productos restituidos al inventario
- Nueva sección en menú izquierdo: "Salida de Mercancía" debajo de "Ventas" (sección 1)
- Página SalidaMercancia.tsx: proceso igual a NuevaVenta pero registra en localStorage como `salidas_mercancia[]`, NO afecta ventas ni su reporte. Usa tipos de salida en lugar de tipos de pago (configurable).
- En Configuración: nuevo contenedor "Salida de Mercancía" con la misma estructura que Tipo de Pago para gestionar tipos de salida
- En Reportes: nueva tarjeta "Salidas" que abre ventana de reporte con total de unidades salidas, selector de fecha, gráfico de barras por producto, estadísticas (producto con más/menos salidas, tipo de salida más usado)

### Modify
- Ventas.tsx: al hacer clic en el botón eliminar, antes de borrar mostrar un diálogo con la lista de productos que serán devueltos al inventario y sus cantidades
- App.tsx: agregar pantalla `salida-mercancia` en SCREENS (sección 1, después de ventas) y en SCREEN_TITLES
- Reportes.tsx: agregar tarjeta "Salidas de Mercancía" y modal de reporte de salidas
- Configuracion.tsx: agregar contenedor "Salida de Mercancía" igual al de Tipos de Pago, usando estado local `salidaTypes` guardado en localStorage

### Remove
- Nada

## Implementation Plan
1. Crear tipos e helpers para salidas en utils (localStorage key `pos_salidas`, `pos_salida_types`)
2. Modificar Ventas.tsx: al click de borrar mostrar AlertDialog con resumen de productos antes de confirmar
3. Crear SalidaMercancia.tsx: copia de NuevaVenta pero que guarda en localStorage, sin llamada a backend de ventas
4. Modificar Configuracion.tsx: agregar SubScreen `salida` con contenedor de tipos de salida
5. Modificar Reportes.tsx: agregar tarjeta + modal reporte de salidas
6. Modificar App.tsx: agregar ruta y menú para salida-mercancia
