const CURRENCY_KEY = "pos_currency_code";

export const CURRENCIES: { code: string; name: string; symbol: string }[] = [
  { code: "USD", name: "Dólar estadounidense", symbol: "$" },
  { code: "EUR", name: "Euro", symbol: "€" },
  { code: "GBP", name: "Libra esterlina", symbol: "£" },
  { code: "JPY", name: "Yen japonés", symbol: "¥" },
  { code: "CAD", name: "Dólar canadiense", symbol: "CA$" },
  { code: "AUD", name: "Dólar australiano", symbol: "A$" },
  { code: "CHF", name: "Franco suizo", symbol: "Fr" },
  { code: "CNY", name: "Yuan chino", symbol: "¥" },
  { code: "MXN", name: "Peso mexicano", symbol: "$" },
  { code: "BRL", name: "Real brasileño", symbol: "R$" },
  { code: "ARS", name: "Peso argentino", symbol: "$" },
  { code: "COP", name: "Peso colombiano", symbol: "$" },
  { code: "PEN", name: "Sol peruano", symbol: "S/" },
  { code: "CLP", name: "Peso chileno", symbol: "$" },
  { code: "VES", name: "Bolívar venezolano", symbol: "Bs." },
  { code: "CRC", name: "Colón costarricense", symbol: "₡" },
  { code: "GTQ", name: "Quetzal guatemalteco", symbol: "Q" },
  { code: "HNL", name: "Lempira hondureño", symbol: "L" },
  { code: "NIO", name: "Córdoba nicaragüense", symbol: "C$" },
  { code: "PAB", name: "Balboa panameño", symbol: "B/." },
  { code: "DOP", name: "Peso dominicano", symbol: "RD$" },
  { code: "BOB", name: "Boliviano", symbol: "Bs" },
  { code: "PYG", name: "Guaraní paraguayo", symbol: "₲" },
  { code: "UYU", name: "Peso uruguayo", symbol: "$U" },
  { code: "CUP", name: "Peso cubano", symbol: "$" },
  { code: "INR", name: "Rupia india", symbol: "₹" },
  { code: "KRW", name: "Won surcoreano", symbol: "₩" },
  { code: "SGD", name: "Dólar de Singapur", symbol: "S$" },
  { code: "HKD", name: "Dólar de Hong Kong", symbol: "HK$" },
  { code: "TWD", name: "Nuevo dólar taiwanés", symbol: "NT$" },
  { code: "THB", name: "Baht tailandés", symbol: "฿" },
  { code: "MYR", name: "Ringgit malayo", symbol: "RM" },
  { code: "IDR", name: "Rupia indonesia", symbol: "Rp" },
  { code: "PHP", name: "Peso filipino", symbol: "₱" },
  { code: "VND", name: "Dong vietnamita", symbol: "₫" },
  { code: "PKR", name: "Rupia pakistaní", symbol: "₨" },
  { code: "BDT", name: "Taka bangladesí", symbol: "৳" },
  { code: "LKR", name: "Rupia de Sri Lanka", symbol: "Rs" },
  { code: "NPR", name: "Rupia nepalesa", symbol: "रू" },
  { code: "RUB", name: "Rublo ruso", symbol: "₽" },
  { code: "TRY", name: "Lira turca", symbol: "₺" },
  { code: "PLN", name: "Esloti polaco", symbol: "zł" },
  { code: "SEK", name: "Corona sueca", symbol: "kr" },
  { code: "NOK", name: "Corona noruega", symbol: "kr" },
  { code: "DKK", name: "Corona danesa", symbol: "kr" },
  { code: "HUF", name: "Forinto húngaro", symbol: "Ft" },
  { code: "CZK", name: "Corona checa", symbol: "Kč" },
  { code: "RON", name: "Leu rumano", symbol: "lei" },
  { code: "BGN", name: "Lev búlgaro", symbol: "лв" },
  { code: "ZAR", name: "Rand sudafricano", symbol: "R" },
  { code: "NGN", name: "Naira nigeriana", symbol: "₦" },
  { code: "KES", name: "Chelín keniano", symbol: "KSh" },
  { code: "EGP", name: "Libra egipcia", symbol: "£" },
  { code: "MAD", name: "Dírham marroquí", symbol: "د.م." },
  { code: "GHS", name: "Cedi ghanés", symbol: "₵" },
  { code: "ETB", name: "Birr etíope", symbol: "Br" },
  { code: "TZS", name: "Chelín tanzano", symbol: "TSh" },
  { code: "UGX", name: "Chelín ugandés", symbol: "USh" },
  { code: "XAF", name: "Franco CFA (África Central)", symbol: "FCFA" },
  { code: "XOF", name: "Franco CFA (África Occidental)", symbol: "CFA" },
  { code: "SAR", name: "Riyal saudí", symbol: "﷼" },
  { code: "AED", name: "Dírham de EAU", symbol: "د.إ" },
  { code: "QAR", name: "Riyal catarí", symbol: "﷼" },
  { code: "KWD", name: "Dinar kuwaití", symbol: "د.ك" },
  { code: "BHD", name: "Dinar barení", symbol: ".د.ب" },
  { code: "OMR", name: "Rial omaní", symbol: "﷼" },
  { code: "JOD", name: "Dinar jordano", symbol: "د.ا" },
  { code: "ILS", name: "Nuevo séquel israelí", symbol: "₪" },
];

/** Get the currently selected currency code (persisted in localStorage) */
export function getCurrencyCode(): string {
  return localStorage.getItem(CURRENCY_KEY) ?? "USD";
}

/** Persist the selected currency code */
export function saveCurrencyCode(code: string): void {
  localStorage.setItem(CURRENCY_KEY, code);
  // Dispatch a storage event so other components can react
  window.dispatchEvent(
    new StorageEvent("storage", { key: CURRENCY_KEY, newValue: code }),
  );
}

/** Get the symbol for the current currency */
export function getCurrencySymbol(): string {
  const code = getCurrencyCode();
  return CURRENCIES.find((c) => c.code === code)?.symbol ?? "$";
}

/** Get the full currency info for the current currency */
export function getCurrentCurrency(): {
  code: string;
  name: string;
  symbol: string;
} {
  const code = getCurrencyCode();
  return (
    CURRENCIES.find((c) => c.code === code) ?? {
      code: "USD",
      name: "Dólar estadounidense",
      symbol: "$",
    }
  );
}
