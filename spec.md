# POS Mobile v46

## Current State
The app (v45) has:
- Puntos de Ventas section with tabs: Nueva Venta | Ventas | Inventario PV
- Inventario section with tabs: Catálogo de Productos | Movimientos | Almacenes
- Movimientos has sub-tabs: Entrada de Mercancía | Salida de Mercancía
- InventarioPV uses the main backend products filtered by ubicacionTipo=puntoVenta
- NuevaVenta uses all backend products (filtered to puntoVenta type) for product selection
- Ventas shows punto de venta via getSaleMeta badge (exists)
- EntradaMercancia saves entrada records but doesn't update PV-specific inventory

## Requested Changes (Diff)

### Add
- New first sub-tab "Historial" in Movimientos (before "Entrada de Mercancía"), showing all entradas and salidas combined in a list similar to Ventas, with date, type badge (Entrada/Salida), number of items, total value, destination
- New localStorage utility `pvInventory.ts`: PVInventoryItem { id, productCode, productName, unit, pvId, pvName, stock, price }. Functions: getPVInventory, savePVInventory, getPVInventoryByPV, upsertPVItem (same code+pvId = add stock; different pvId = new entry), reducePVStock, deletePVItem, updatePVItem
- When EntradaMercancia destination = puntoVenta, also call upsertPVItem for each item

### Modify
- **InventarioPV**: Completely refactored to use PVInventory (localStorage) instead of backend products. Shows all PV inventory items with PV badge. Same product code in different PVs = separate rows. The "+" floating button opens an AddPVItemScreen (full screen with back arrow) where: product code (text), product name (text), unit (select), price (number), stock quantity (number), and a Punto de Venta selector that ONLY shows created puntos de venta (not warehouses). On save: if same code+pvId exists, sum stock; else create new entry. Export/import CSV still available.
- **NuevaVenta ProductPickerModal**: Filter backend products to only those whose barcode appears in getPVInventoryByPV(selectedPuntoVentaId). Show stock from PVInventory (not main stock). When sale completes, also call reducePVStock for each sold item.
- **Inventario > Movimientos**: Add "Historial" as first sub-tab (leftmost). Keep Entrada and Salida tabs. Historial tab renders a combined chronological list of all entradas + salidas from utils/entradas.ts and utils/salidas.ts, newest first, similar to Ventas layout.

### Remove
- Nothing removed

## Implementation Plan
1. Create `src/frontend/src/utils/pvInventory.ts` with full CRUD and upsert logic
2. Update `src/frontend/src/pages/InventarioPV.tsx`: use PVInventory, new AddPVItemScreen with PV-only selector, show PV badge per item
3. Update `src/frontend/src/pages/NuevaVenta.tsx`: ProductPickerModal filters by PVInventory for selected PV, reducePVStock on sale complete
4. Update `src/frontend/src/pages/EntradaMercancia.tsx`: on save when destino=puntoVenta, call upsertPVItem for each item
5. Update `src/frontend/src/pages/Inventario.tsx`: add "Historial" first sub-tab in Movimientos showing combined entradas+salidas list
6. Verify Ventas.tsx shows PV name prominently (already implemented)
7. Update Ayuda with new workflow description
