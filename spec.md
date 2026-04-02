# RADIXGESTION

## Current State
- Puntos de Ventas screen has 3 tabs: Nueva Venta | Ventas | Inventario PV
- Reportes module (Section 4) has: Total Ventas, Ventas por Productos, Productos Restituidos, Movimientos de Stock, IPV
- Sales data lives in backend (via useSales hook) + localStorage sale metadata (puntoVentaName, puntoVentaId, ctrlNum, saleDate)
- PV Inventory stored in localStorage via pvInventory utils (getPVInventory)
- Entradas/Salidas stored in localStorage via entradas/salidas utils
- Payment types from backend (usePaymentTypes)
- Customers from backend (useCustomers)

## Requested Changes (Diff)

### Add
- New tab "Reportes PV" in PuntosDeVentas.tsx, positioned after "Inventario PV"
- New file: `src/frontend/src/pages/ReportesPV.tsx`
  - Full-screen layout with vertical scroll, matching Reportes.tsx style
  - 3 sub-report cards on the main screen: Total de Ventas | Ventas por Productos | IPV
  - Each opens its own sub-screen (back button, export menu)
  
  **Total de Ventas sub-screen:**
  - Filter by PV selector (dropdown with all PVs + "Todos")
  - Filter by date range (from/to) or specific date
  - Stats cards: mayor venta, promedio de ventas, venta más baja
  - Table of sales with columns: No.Ctrl, Fecha, PV, Cliente, Total, Tipo de Pago
  - Sales breakdown by tipo de pago (grouped totals)
  - Bar chart of sales by date (div-based, like Reportes.tsx)
  - Export CSV, PDF, XLSX

  **Ventas por Productos sub-screen:**
  - Filter by PV selector + date range
  - Table: Producto, Cantidad vendida, Total importe, Tipo de Pago, Clientes
  - Stats: producto más vendido, producto menos vendido
  - Bar chart of top products by quantity sold
  - Breakdown by forma de pago
  - Export CSV, PDF, XLSX

  **IPV sub-screen:**
  - Same as IPV in Reportes: current stock per PV + all movements (entradas/salidas linked to PV)
  - Filter by PV selector
  - Table of movements: Fecha, Tipo, Producto, Cantidad, Destino/Origen
  - Export CSV, PDF, XLSX

### Modify
- `src/frontend/src/pages/PuntosDeVentas.tsx`: Add 4th tab "Reportes PV" with BarChart2 icon

### Remove
- Nothing removed

## Implementation Plan
1. Create `src/frontend/src/pages/ReportesPV.tsx` with all 3 sub-reports using data from useSales, getSaleMeta, getPVInventory, getEntradas, getSalidas hooks/utils
2. Update `PuntosDeVentas.tsx` to import and render ReportesPV as a 4th tab
3. Validate build
