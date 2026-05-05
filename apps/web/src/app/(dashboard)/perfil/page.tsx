import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@tdt/db";
import { notFound } from "next/navigation";
import { PerfilForm } from "@/components/ui/PerfilForm";
import { PerfilSettings } from "@/components/ui/PerfilSettings";

export default async function PerfilPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) notFound();

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      plan: true,
      planExpiresAt: true,
      dni: true,
      phone: true,
      locality: true,
      province: true,
      acceptsLocalityInvites: true,
      acceptsProvinceInvites: true,
      acceptsCountryInvites: true,
      acceptsEmailNotifications: true,
      acceptsContactByEmail: true,
      acceptsContactByPhone: true,
      acceptsAppNotifications: true,
      acceptsWhatsAppContact: true,
      player: {
        select: {
          provincia: true,
          locality: true,
        },
      },
    },
  });
  if (!user) notFound();

  return (
    <div className="max-w-3xl">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Mi perfil</h1>

      <div className="grid gap-6 lg:grid-cols-[1fr_0.95fr]">
        <PerfilForm
          id={user.id}
          name={user.name}
          email={user.email}
          role={user.role}
          plan={user.plan}
          planExpiresAt={user.planExpiresAt?.toISOString() ?? null}
          dni={user.dni ?? null}
          phone={user.phone ?? null}
          locality={user.locality ?? user.player?.locality ?? null}
          province={user.province ?? user.player?.provincia ?? null}
        />

        <PerfilSettings
          role={user.role}
          acceptsLocalityInvites={user.acceptsLocalityInvites}
          acceptsProvinceInvites={user.acceptsProvinceInvites}
          acceptsCountryInvites={user.acceptsCountryInvites}
          acceptsEmailNotifications={user.acceptsEmailNotifications}
          acceptsContactByEmail={user.acceptsContactByEmail}
          acceptsContactByPhone={user.acceptsContactByPhone}
          acceptsAppNotifications={user.acceptsAppNotifications}
          acceptsWhatsAppContact={user.acceptsWhatsAppContact}
        />
      </div>
    </div>
  );
}
