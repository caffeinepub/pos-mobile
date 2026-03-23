# POS Mobile

## Current State
Version 42. The app has sections: Nueva Venta, Ventas, Inventario PV (Section 1); Almacenes, Inventario, Entrada de Mercancía, Salida de Mercancía, Producción (Section 2); Clientes, Proveedores, Facturas (Section 3); Reportes, Cerrar Día, Configuración, Contactar, Ayuda, Acerca de (Section 4). All modules implemented with localStorage for extended data.

## Requested Changes (Diff)

### Add
- New menu item "Empleados" in Section 3 after "Facturas" with a UserCog icon
- New screen `Empleados.tsx` with full CRUD for employees plus HR sub-features
- Employee data model stored in localStorage (key `pos_empleados`):
  - id (auto), código (auto, sequential EMP-XXXX), nombre (required), CI/carné identidad, cargo/puesto (required), categoría laboral (options: Dirigente, Técnico, Administrativo, Servicio, Obrero), escala salarial, salario base mensual (required), fecha de ingreso, teléfono, correo, dirección, observaciones
- Days worked module (localStorage `pos_dias_trabajados`):
  - Track per employee per month/year: días trabajados, días no laborados, ausencias, vacaciones, licencias médicas
  - Auto-calculate días efectivos for salary
- Salary/payment calculation module (localStorage `pos_nomina`):
  - Generate payroll per employee per period (month/year)
  - Fields: salario base, días laborables del mes, días trabajados efectivos, salario devengado = (salario base / días laborables) * días trabajados, descuentos (seguridad social 5% default, impuesto sobre ingresos), bonificaciones (campos libres), salario a cobrar neto
  - Payment history: mark payments as pagado/pendiente, date paid, payment method
- Payment/Nomina records stored in `pos_pagos_nomina`
- Detailed employee view screen (full-screen) showing summary: datos personales, días trabajados del mes actual, última nómina, historial de pagos
- Export payroll to PDF: list of employees with their calculated salaries for a given month
- Search/filter employees by name, cargo, categoría
- View toggle (list/grid) matching Clientes pattern
- Ayuda section updated with Empleados module documentation

### Modify
- `App.tsx`: add `empleados` to Screen type, SCREENS array (Section 3 after facturas), SCREEN_TITLES, and render `<Empleados />` in main content area
- `Ayuda.tsx`: add collapsible section for Empleados module

### Remove
- Nothing removed

## Implementation Plan
1. Create `src/frontend/src/pages/Empleados.tsx` with:
   - Employee list with search, view toggle (list/grid), FAB to add
   - Full-screen add employee form (ArrowLeft back navigation, all fields, Save button)
   - Full-screen edit employee form (pre-filled, Actualizar button)
   - Delete with confirmation
   - Tabs or sub-screens: Datos | Días Trabajados | Nómina | Pagos
   - Days worked entry: per month/year, editable table with days worked/absent/vacation/sick
   - Salary calculator: auto-calculates devengado, descuentos, neto; save as nómina record
   - Payment records: mark as paid, date, method
   - Export payroll PDF for a given month
   - Three-dot menu: Buscar, Exportar CSV, Exportar PDF (list of employees)
2. Update `App.tsx` to add empleados screen
3. Update `Ayuda.tsx` to add Empleados help section
