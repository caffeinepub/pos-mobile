// Hook para gestionar entidades importadas desde Excel

export interface Entidad {
  CODIGO: string;
  DESC: string;
  DIREC: string;
  SIGLAS: string;
  DPA: string;
  NAE: string;
  DESCRIPCION_NAE: string;
  CNAE: string;
  DESCRIPCION_CNAE: string;
  FORG: string;
  DESFO: string;
  SUBORD: string;
}

const ENABLED_KEY = "pos_entidades_enabled";
const ENTITIES_KEY = "pos_entidades";

export function useEntidades() {
  const enabled = localStorage.getItem(ENABLED_KEY) === "true";
  const entities: Entidad[] = (() => {
    try {
      return JSON.parse(localStorage.getItem(ENTITIES_KEY) ?? "[]");
    } catch {
      return [];
    }
  })();

  const setEnabled = (val: boolean) => {
    localStorage.setItem(ENABLED_KEY, String(val));
  };

  const setEntities = (list: Entidad[]) => {
    localStorage.setItem(ENTITIES_KEY, JSON.stringify(list));
  };

  const clearEntities = () => {
    localStorage.removeItem(ENTITIES_KEY);
  };

  return { enabled, setEnabled, entities, setEntities, clearEntities };
}
