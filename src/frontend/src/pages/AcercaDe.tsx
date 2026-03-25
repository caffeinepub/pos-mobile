import { FileText, Lock, ScrollText } from "lucide-react";
import { useState } from "react";

function InfoModal({
  title,
  content,
  onClose,
}: {
  title: string;
  content: string;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-6">
      <div className="bg-card rounded-2xl shadow-xl w-full max-w-sm flex flex-col max-h-[70vh]">
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <h3 className="font-semibold text-base">{title}</h3>
          <button
            type="button"
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground transition-colors text-sm px-2 py-1"
          >
            Cerrar
          </button>
        </div>
        <div className="overflow-y-auto p-4">
          <p className="text-sm text-muted-foreground whitespace-pre-line">
            {content}
          </p>
        </div>
      </div>
    </div>
  );
}

export default function AcercaDe() {
  const [modal, setModal] = useState<
    null | "privacidad" | "terminos" | "licencia"
  >(null);

  const modals = {
    privacidad: {
      title: "Política de Privacidad",
      content:
        "Esta aplicación recopila y almacena datos localmente en tu dispositivo para el funcionamiento del punto de venta.\n\nNo se transmite información personal a servidores externos sin tu consentimiento.\n\nPuedes eliminar todos los datos en cualquier momento desde la configuración.",
    },
    terminos: {
      title: "Términos y Condiciones",
      content:
        "Al usar esta aplicación aceptas los términos de uso.\n\nEsta aplicación se proporciona tal como está, sin garantías de ningún tipo.\n\nEl usuario es responsable del uso correcto de la información y las operaciones realizadas.",
    },
    licencia: {
      title: "Licencias",
      content:
        "CUBANEXUS - Suite Empresarial Cubana\nVersión 1.0\n\nLicencia de uso personal y comercial.\n\nProhibida la redistribución o modificación sin autorización expresa del autor.\n\n© 2024-2026 CUBANEXUS. Todos los derechos reservados.",
    },
  };

  return (
    <div className="flex flex-col flex-1 items-center justify-center px-8 py-10 text-center gap-6">
      {/* Logo */}
      <div className="w-56 flex items-center justify-center">
        <img
          src="/assets/uploads/logo_de_la_aplicacio-019d2650-352c-73bc-9431-a61991f6a3b4-1.png"
          alt="CUBANEXUS logo"
          className="w-full object-contain"
        />
      </div>

      {/* App name and version */}
      <div className="-mt-2">
        <p className="text-sm text-muted-foreground">
          Suite Empresarial Cubana · Versión 1.0
        </p>
        <p className="text-xs text-muted-foreground mt-1">
          Base primaria para tu contabilidad
        </p>
      </div>

      {/* Copyright */}
      <p className="text-sm text-muted-foreground">
        © 2024-2026 CUBANEXUS. Todos los derechos reservados.
      </p>

      {/* Action buttons */}
      <div className="flex flex-col gap-3 w-full max-w-xs">
        <button
          type="button"
          onClick={() => setModal("privacidad")}
          className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-2xl bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
          data-ocid="acerca.privacidad.button"
        >
          <Lock size={18} />
          <span className="text-sm font-medium">Política de Privacidad</span>
        </button>
        <button
          type="button"
          onClick={() => setModal("terminos")}
          className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-2xl bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
          data-ocid="acerca.terminos.button"
        >
          <ScrollText size={18} />
          <span className="text-sm font-medium">Términos y condiciones</span>
        </button>
        <button
          type="button"
          onClick={() => setModal("licencia")}
          className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-2xl bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
          data-ocid="acerca.licencia.button"
        >
          <FileText size={18} />
          <span className="text-sm font-medium">Licencias</span>
        </button>
      </div>

      {modal && (
        <InfoModal
          title={modals[modal].title}
          content={modals[modal].content}
          onClose={() => setModal(null)}
        />
      )}
    </div>
  );
}
