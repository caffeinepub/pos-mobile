import { createContext, useContext, useEffect, useState } from "react";

export interface AppTheme {
  id: string;
  name: string;
  primary: string; // hex for preview swatch
  navy: string; // hex for preview swatch
  accent: string; // hex for preview swatch
  // CSS variable values as oklch raw L C H strings
  vars: {
    primary: string;
    primaryForeground: string;
    navy: string;
    teal: string;
    ring: string;
  };
}

export const THEMES: AppTheme[] = [
  {
    id: "oceano",
    name: "Oceano",
    primary: "#00b4d8",
    navy: "#1e3a5f",
    accent: "#0096c7",
    vars: {
      primary: "0.65 0.15 210",
      primaryForeground: "1 0 0",
      navy: "0.23 0.08 240",
      teal: "0.65 0.15 210",
      ring: "0.65 0.15 210",
    },
  },
  {
    id: "atardecer",
    name: "Atardecer",
    primary: "#f97316",
    navy: "#3d2000",
    accent: "#fb923c",
    vars: {
      primary: "0.7 0.2 45",
      primaryForeground: "1 0 0",
      navy: "0.23 0.08 45",
      teal: "0.7 0.2 45",
      ring: "0.7 0.2 45",
    },
  },
  {
    id: "bosque",
    name: "Bosque",
    primary: "#22c55e",
    navy: "#1a3a1a",
    accent: "#16a34a",
    vars: {
      primary: "0.72 0.19 145",
      primaryForeground: "1 0 0",
      navy: "0.23 0.08 145",
      teal: "0.72 0.19 145",
      ring: "0.72 0.19 145",
    },
  },
  {
    id: "violeta",
    name: "Violeta",
    primary: "#a855f7",
    navy: "#2a1a3a",
    accent: "#9333ea",
    vars: {
      primary: "0.65 0.25 295",
      primaryForeground: "1 0 0",
      navy: "0.23 0.08 295",
      teal: "0.65 0.25 295",
      ring: "0.65 0.25 295",
    },
  },
  {
    id: "rojo",
    name: "Rojo Pasión",
    primary: "#ef4444",
    navy: "#3a1010",
    accent: "#dc2626",
    vars: {
      primary: "0.65 0.22 25",
      primaryForeground: "1 0 0",
      navy: "0.23 0.08 25",
      teal: "0.65 0.22 25",
      ring: "0.65 0.22 25",
    },
  },
  {
    id: "cielo",
    name: "Cielo",
    primary: "#3b82f6",
    navy: "#1a2540",
    accent: "#2563eb",
    vars: {
      primary: "0.6 0.2 255",
      primaryForeground: "1 0 0",
      navy: "0.23 0.08 255",
      teal: "0.6 0.2 255",
      ring: "0.6 0.2 255",
    },
  },
];

interface ThemeContextValue {
  theme: AppTheme;
  setTheme: (id: string) => void;
}

const ThemeContext = createContext<ThemeContextValue>({
  theme: THEMES[0],
  setTheme: () => {},
});

function applyTheme(theme: AppTheme) {
  const root = document.documentElement;
  root.style.setProperty("--primary", theme.vars.primary);
  root.style.setProperty("--primary-foreground", theme.vars.primaryForeground);
  root.style.setProperty("--navy", theme.vars.navy);
  root.style.setProperty("--teal", theme.vars.teal);
  root.style.setProperty("--ring", theme.vars.ring);
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [themeId, setThemeId] = useState<string>(() => {
    return localStorage.getItem("app-theme") || "oceano";
  });

  const theme = THEMES.find((t) => t.id === themeId) ?? THEMES[0];

  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  const setTheme = (id: string) => {
    setThemeId(id);
    localStorage.setItem("app-theme", id);
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useAppTheme() {
  return useContext(ThemeContext);
}
