import { Badge } from "@/components/ui/badge";
import { Info, Warehouse } from "lucide-react";
import { useState } from "react";
import { type Almacen, getAlmacenes } from "../utils/almacenes";

export default function Almacenes() {
  const [almacenes] = useState<Almacen[]>(getAlmacenes);

  return (
    <div className="px-4 pt-4 pb-6 space-y-4">
      {/* Info box */}
      <div className="flex items-start gap-2 bg-blue-50 border border-blue-200 rounded-lg px-3 py-2.5">
        <Info size={15} className="text-blue-500 shrink-0 mt-0.5" />
        <p className="text-xs text-blue-700">
          Los almacenes se crean y gestionan desde{" "}
          <strong>Configuración &rsaquo; Almacenes</strong>.
        </p>
      </div>

      {almacenes.length === 0 ? (
        <div
          data-ocid="almacenes.empty_state"
          className="flex flex-col items-center justify-center py-16 gap-3"
        >
          <Warehouse size={40} className="text-muted-foreground/40" />
          <p className="text-sm text-muted-foreground text-center px-6">
            No hay almacenes configurados. Ve a Configuración para agregar
            almacenes.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {almacenes.map((a, idx) => (
            <div
              key={a.id}
              data-ocid={`almacenes.item.${idx + 1}`}
              className="bg-card border border-border rounded-xl px-4 py-3.5 space-y-2"
            >
              <div className="flex items-center gap-2">
                <Badge
                  variant="secondary"
                  className="text-xs font-mono px-2 py-0.5"
                >
                  #{a.numero}
                </Badge>
                <span className="font-semibold text-sm text-foreground flex-1">
                  {a.descripcion}
                </span>
              </div>
              {a.responsable && (
                <p className="text-xs text-muted-foreground">
                  Responsable:{" "}
                  <span className="text-foreground">{a.responsable}</span>
                </p>
              )}
              <div className="flex flex-wrap gap-1.5">
                {a.categorias.map((cat) => (
                  <span
                    key={cat}
                    className="inline-block text-xs bg-primary/10 text-primary rounded-full px-2 py-0.5"
                  >
                    {cat}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
