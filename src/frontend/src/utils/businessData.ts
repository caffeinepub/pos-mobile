export const BUSINESS_STORAGE_KEY = "pos_business_data";

export interface BusinessData {
  nombre: string;
  telefono: string;
  correo: string;
  direccion: string;
  nit: string;
  cuentasBancarias: string[];
}

export function getBusinessData(): BusinessData {
  try {
    const raw = localStorage.getItem(BUSINESS_STORAGE_KEY);
    if (!raw)
      return {
        nombre: "",
        telefono: "",
        correo: "",
        direccion: "",
        nit: "",
        cuentasBancarias: [],
      };
    const parsed = JSON.parse(raw) as BusinessData;
    if (!Array.isArray(parsed.cuentasBancarias)) parsed.cuentasBancarias = [];
    if (!parsed.nit) parsed.nit = "";
    return parsed;
  } catch {
    return {
      nombre: "",
      telefono: "",
      correo: "",
      direccion: "",
      nit: "",
      cuentasBancarias: [],
    };
  }
}

export function saveBusinessData(data: BusinessData) {
  localStorage.setItem(BUSINESS_STORAGE_KEY, JSON.stringify(data));
}

export function buildFileHeader(): string {
  const b = getBusinessData();
  const lines: string[] = [];
  if (b.nombre) lines.push(`Negocio: ${b.nombre}`);
  if (b.nit) lines.push(`NIT: ${b.nit}`);
  if (b.telefono) lines.push(`Teléfono: ${b.telefono}`);
  if (b.correo) lines.push(`Correo: ${b.correo}`);
  if (b.direccion) lines.push(`Dirección: ${b.direccion}`);
  if (b.cuentasBancarias && b.cuentasBancarias.length > 0) {
    b.cuentasBancarias.forEach((c, i) =>
      lines.push(`Cuenta Bancaria ${i + 1}: ${c}`),
    );
  }
  lines.push(`Fecha de exportación: ${new Date().toLocaleString("es-ES")}`);
  return lines.join("\n");
}

export function buildHtmlHeader(): string {
  const b = getBusinessData();
  const parts: string[] = [];
  if (b.nombre) parts.push(`<strong>${b.nombre}</strong>`);
  if (b.nit) parts.push(`NIT: ${b.nit}`);
  if (b.telefono) parts.push(`Tel: ${b.telefono}`);
  if (b.correo) parts.push(`Correo: ${b.correo}`);
  if (b.direccion) parts.push(`Dir: ${b.direccion}`);
  if (b.cuentasBancarias && b.cuentasBancarias.length > 0) {
    b.cuentasBancarias.forEach((c, i) => parts.push(`Cuenta ${i + 1}: ${c}`));
  }
  parts.push(`Exportado: ${new Date().toLocaleString("es-ES")}`);
  return parts
    .map((p) => `<p style="margin:2px 0;font-size:13px">${p}</p>`)
    .join("");
}
