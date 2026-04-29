import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@tdt/db";
import { notFound } from "next/navigation";
import { MembresiaClient } from "@/components/ui/MembresiaClient";

export default async function MembresiaPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) notFound();

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { plan: true, planExpiresAt: true, role: true },
  });
  if (!user) notFound();

  const precio = Math.round(parseInt(process.env.MEMBRESIA_PRECIO_ARS ?? "500000", 10) / 100);

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Membresía</h1>
      <p className="text-gray-500 text-sm mb-8">Accedé a los beneficios del plan Organizador.</p>
      <MembresiaClient
        plan={user.plan}
        planExpiresAt={user.planExpiresAt?.toISOString() ?? null}
        precio={precio}
      />
    </div>
  );
}
