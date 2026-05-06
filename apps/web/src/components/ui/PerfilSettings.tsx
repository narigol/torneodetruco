"use client";

import { useState } from "react";

type Props = {
  role: string;
  acceptsLocalityInvites: boolean;
  acceptsProvinciaInvites: boolean;
  acceptsCountryInvites: boolean;
  acceptsEmailNotifications: boolean;
  acceptsContactByEmail: boolean;
  acceptsContactByPhone: boolean;
  acceptsAppNotifications: boolean;
  acceptsWhatsAppContact: boolean;
};

type Field = keyof Omit<Props, "role">;

function Toggle({
  label,
  description,
  value,
  onChange,
}: {
  label: string;
  description: string;
  value: boolean;
  onChange: () => void;
}) {
  return (
    <button
      onClick={onChange}
      className="w-full flex items-center justify-between gap-4 text-left"
    >
      <div>
        <p className="text-sm font-medium text-gray-800">{label}</p>
        <p className="text-xs text-gray-400 mt-0.5">{description}</p>
      </div>
      <div className={`relative shrink-0 w-11 h-6 rounded-full transition-colors ${value ? "bg-red-600" : "bg-gray-200"}`}>
        <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${value ? "translate-x-5" : "translate-x-0"}`} />
      </div>
    </button>
  );
}

export function PerfilSettings({
  role,
  acceptsLocalityInvites: ili,
  acceptsProvinciaInvites: ipi,
  acceptsCountryInvites: ici,
  acceptsEmailNotifications: ien,
  acceptsContactByEmail: ice,
  acceptsContactByPhone: icp,
  acceptsAppNotifications: ian,
  acceptsWhatsAppContact: iwc,
}: Props) {
  const isOrganizer = role === "ORGANIZER" || role === "ADMIN";
  const [values, setValues] = useState({
    acceptsLocalityInvites: ili,
    acceptsProvinciaInvites: ipi,
    acceptsCountryInvites: ici,
    acceptsEmailNotifications: ien,
    acceptsContactByEmail: ice,
    acceptsContactByPhone: icp,
    acceptsAppNotifications: ian,
    acceptsWhatsAppContact: iwc,
  });
  const [saving, setSaving] = useState<Field | null>(null);
  const [saved, setSaved] = useState<Field | null>(null);

  async function toggle(field: Field) {
    const next = !values[field];
    setSaving(field);
    setSaved(null);
    const res = await fetch("/api/perfil", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ [field]: next }),
    });
    setSaving(null);
    if (res.ok) {
      setValues((v) => ({ ...v, [field]: next }));
      setSaved(field);
      setTimeout(() => setSaved(null), 2500);
    }
  }

  type Section = { title: string; mobile: boolean; fixed?: boolean; items: { field: Field; label: string; description: string }[] };
  const sections: Section[] = [
    {
      title: "Notificaciones de torneos por zona",
      mobile: false,
      items: [
        {
          field: "acceptsLocalityInvites" as Field,
          label: "Torneos en mi localidad",
          description: "Recibís notificaciones cuando se abra la inscripción de un torneo en tu localidad.",
        },
        {
          field: "acceptsProvinciaInvites" as Field,
          label: "Torneos en mi provincia",
          description: "Recibís notificaciones cuando se abra la inscripción de un torneo en tu provincia.",
        },
        {
          field: "acceptsCountryInvites" as Field,
          label: "Torneos en cualquier provincia",
          description: "Recibís notificaciones de torneos de todo el país, sin importar la ubicación.",
        },
      ],
    },
    {
      title: "Notificaciones",
      mobile: false,
      items: [
        {
          field: "acceptsEmailNotifications" as Field,
          label: "Notificaciones por email",
          description: "Recibí avisos por correo sobre torneos, resultados e invitaciones.",
        },
      ],
    },
    {
      title: "Organizadores que seguís",
      mobile: false,
      fixed: true,
      items: [],
    },
    ...(isOrganizer ? [{
      title: "Contacto",
      mobile: false,
      items: [
        {
          field: "acceptsWhatsAppContact" as Field,
          label: "Permitir contacto por WhatsApp",
          description: "Los jugadores podrán ver un botón para contactarte por WhatsApp desde la página del torneo. Requiere tener teléfono cargado en tu perfil.",
        },
      ],
    }] : []),
    {
      title: "App móvil",
      mobile: true,
      items: [
        {
          field: "acceptsAppNotifications" as Field,
          label: "Notificaciones en la app",
          description: "Recibirás alertas en tu celular cuando la app móvil esté disponible.",
        },
        {
          field: "acceptsContactByEmail" as Field,
          label: "Contactar por email",
          description: "Permitís que otros usuarios te contacten a través de tu dirección de email.",
        },
        {
          field: "acceptsContactByPhone" as Field,
          label: "Contactar por teléfono / WhatsApp",
          description: "Permitís que otros usuarios te contacten a través de tu número de teléfono.",
        },
      ],
    },
  ];

  return (
    <div className="bg-white border border-gray-100 rounded-xl p-6 space-y-6">
      <div>
        <h2 className="text-sm font-semibold text-gray-700">Privacidad y notificaciones</h2>
        <p className="text-xs text-gray-400 mt-0.5">Controlá cómo y cuándo te contactan.</p>
      </div>

      {sections.map((section, si) => (
        <div key={section.title}>
          {si > 0 && <div className="h-px bg-gray-100 mb-5" />}
          <div className="flex items-center gap-2 mb-3">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">{section.title}</p>
            {section.mobile && (
              <span className="text-xs bg-gray-100 text-gray-400 px-1.5 py-0.5 rounded font-medium">Próximamente</span>
            )}
          </div>
          {section.fixed ? (
            <p className="text-xs text-gray-500 bg-gray-50 border border-gray-100 rounded-lg px-3 py-2.5">
              Siempre recibís notificaciones de los torneos de los organizadores que seguís. Esta opción no se puede desactivar.
            </p>
          ) : (
            <div className={`space-y-4 ${section.mobile ? "opacity-60 pointer-events-none" : ""}`}>
              {section.items.map(({ field, label, description }) => (
                <div key={field}>
                  <Toggle
                    label={label}
                    description={description}
                    value={values[field]}
                    onChange={() => toggle(field)}
                  />
                  {saving === field && (
                    <p className="text-xs text-gray-400 mt-2">Guardando...</p>
                  )}
                  {saved === field && (
                    <p className="text-xs text-green-600 mt-2">Preferencia guardada.</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
