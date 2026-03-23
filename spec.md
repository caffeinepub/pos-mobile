# POS Mobile

## Current State
- Configuración tiene 7 secciones: Datos del negocio, Moneda, Apariencia, Tipo de Pago, Salida de Mercancía, Entrada de Mercancía, Producción.
- TipoPago usa backend (createPaymentType/updatePaymentType/deletePaymentType). Las demás configuraciones de tipos (entrada/salida) usan localStorage.
- NuevaVenta muestra el carrito con botones de acción fijos abajo (scan, agregar, cliente, tipo de pago). No tiene selector de punto de venta ni selector de fecha.
- Ventas lista las ventas con cliente, tipo de pago, fecha, total. No muestra punto de venta.

## Requested Changes (Diff)

### Add
- **Configuración > Puntos de Venta**: Nueva sección (8va) con la misma estructura visual y funcional que Tipo de Pago (expand/collapse, add/edit/delete). Almacenar en localStorage bajo la clave `pos_puntos_venta`.
- **NuevaVenta > Selector de Punto de Venta**: Lista desplegable (Select) encima del carrito o en la barra superior del carrito para seleccionar el punto de venta activo. El punto de venta seleccionado persiste en localStorage (`pos_selected_punto_venta`) y se mantiene entre sesiones hasta que el usuario lo cambie.
- **NuevaVenta > Selector de Fecha**: Al lado del selector de punto de venta, mostrar la fecha actual con un icono de calendario. Al tocar el icono se abre un date picker. Por defecto la fecha actual, permite seleccionar fechas anteriores pero NO fechas futuras. La fecha seleccionada se guarda temporalmente para la venta.
- **Ventas > Punto de Venta**: Cada venta en la lista debe mostrar el punto de venta en el que se realizó. Se guarda en localStorage bajo `sale-meta-{id}` junto con otros metadatos.

### Modify
- **Configuración**: Agregar nuevo card "Puntos de Venta" con icono de tienda (Store) en la lista de opciones, antes de Producción o al final.
- **NuevaVenta**: Al realizar la venta, guardar en localStorage `sale-meta-{saleId}` el punto de venta y la fecha seleccionada.
- **Ventas**: Al mostrar cada venta leer `sale-meta-{saleId}` para obtener el punto de venta y mostrarlo.

### Remove
- Nada.

## Implementation Plan
1. Crear hook/helper `usePuntosVenta` en localStorage para CRUD de puntos de venta (guardar en `pos_puntos_venta`).
2. En Configuracion.tsx: agregar card "Puntos de Venta" → nueva sub-pantalla `PuntosVentaConfigScreen` con la misma estructura que `TipoPagoConfigScreen` (expand/collapse, add/edit/delete).
3. En NuevaVenta.tsx:
   a. Agregar fila superior con Select de punto de venta (persistido en `pos_selected_punto_venta`) y DatePicker con icono de calendario (fecha actual por defecto, no permite fechas futuras).
   b. Al realizar venta exitosa, guardar `sale-meta-{saleId}` con `{ puntoVenta, fecha }`.
4. En Ventas.tsx: leer `sale-meta-{saleId}` y mostrar punto de venta en cada item de la lista.
5. Actualizar la sección de Ayuda con la nueva funcionalidad de Puntos de Venta.
