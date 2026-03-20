import { FileText, Lock, Mail, ScrollText } from "lucide-react";
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

function WhatsAppIcon({ size = 24 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="WhatsApp"
    >
      <title>WhatsApp</title>
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  );
}

function TelegramIcon({ size = 24 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="Telegram"
    >
      <title>Telegram</title>
      <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
    </svg>
  );
}

export default function AcercaDe() {
  const [modal, setModal] = useState<
    null | "privacidad" | "terminos" | "licencia"
  >(null);

  const modals = {
    privacidad: {
      title: "Pol\u00edtica de Privacidad",
      content:
        "Esta aplicaci\u00f3n recopila y almacena datos localmente en tu dispositivo para el funcionamiento del punto de venta.\n\nNo se transmite informaci\u00f3n personal a servidores externos sin tu consentimiento.\n\nPuedes eliminar todos los datos en cualquier momento desde la configuraci\u00f3n.",
    },
    terminos: {
      title: "T\u00e9rminos y Condiciones",
      content:
        "Al usar esta aplicaci\u00f3n aceptas los t\u00e9rminos de uso.\n\nEsta aplicaci\u00f3n se proporciona tal como est\u00e1, sin garant\u00edas de ning\u00fan tipo.\n\nEl usuario es responsable del uso correcto de la informaci\u00f3n y las operaciones realizadas.",
    },
    licencia: {
      title: "C\u00f3digo de Licencia",
      content:
        "POS Mobile - Versi\u00f3n 1.0\n\nLicencia de uso personal y comercial.\n\nProhibida la redistribuci\u00f3n o modificaci\u00f3n sin autorizaci\u00f3n expresa del autor.\n\n\u00a9 2024-2026 POS Mobile. Todos los derechos reservados.",
    },
  };

  const phone = "+5356212657";
  const email = "yomelpalmero@nauta.cu";

  return (
    <div className="flex flex-col flex-1 items-center justify-center px-8 py-10 text-center gap-6">
      {/* App name */}
      <div>
        <h2 className="text-3xl font-bold text-foreground">POS Mobile</h2>
        <p className="text-sm text-muted-foreground mt-1">Versi\u00f3n: 1.0</p>
      </div>

      {/* POS Register image */}
      <div className="w-44 h-44 flex items-center justify-center">
        <img
          src="/assets/generated/pos-register-transparent.dim_200x200.png"
          alt="POS Punto de Venta"
          className="w-full h-full object-contain"
        />
      </div>

      {/* Copyright */}
      <div className="space-y-0.5">
        <p className="text-sm text-muted-foreground">
          \u00a9 2024\u2013{new Date().getFullYear()}
        </p>
        <p className="text-sm font-medium text-foreground">
          Punto de Venta 1.0
        </p>
      </div>

      {/* Action buttons \u2014 icon only */}
      <div className="flex flex-col gap-4 w-full max-w-xs">
        <button
          type="button"
          onClick={() => setModal("privacidad")}
          className="w-full flex items-center justify-center py-4 rounded-2xl bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
          aria-label="Pol\u00edtica de Privacidad"
          data-ocid="acerca.privacidad.button"
        >
          <Lock size={22} />
        </button>
        <button
          type="button"
          onClick={() => setModal("terminos")}
          className="w-full flex items-center justify-center py-4 rounded-2xl bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
          aria-label="T\u00e9rminos y Condiciones"
          data-ocid="acerca.terminos.button"
        >
          <ScrollText size={22} />
        </button>
        <button
          type="button"
          onClick={() => setModal("licencia")}
          className="w-full flex items-center justify-center py-4 rounded-2xl bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
          aria-label="C\u00f3digo de Licencia"
          data-ocid="acerca.licencia.button"
        >
          <FileText size={22} />
        </button>
      </div>

      {/* Developer info */}
      <div className="mt-4 flex flex-col items-center gap-3">
        <p className="text-sm text-muted-foreground">
          Nombre del desarrollador:{" "}
          <span className="font-semibold text-foreground">
            Yosmel Palmero Noa
          </span>
        </p>
        <div className="flex gap-5">
          <a
            href={`https://wa.me/${phone.replace("+", "")}`}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Contactar por WhatsApp"
            className="text-green-500 hover:text-green-600 transition-colors"
          >
            <WhatsAppIcon size={28} />
          </a>
          <a
            href={`https://t.me/${phone.replace("+", "")}`}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Contactar por Telegram"
            className="text-sky-500 hover:text-sky-600 transition-colors"
          >
            <TelegramIcon size={28} />
          </a>
          <a
            href={`mailto:${email}`}
            aria-label="Contactar por correo"
            className="text-primary hover:text-primary/80 transition-colors"
          >
            <Mail size={28} />
          </a>
        </div>
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
