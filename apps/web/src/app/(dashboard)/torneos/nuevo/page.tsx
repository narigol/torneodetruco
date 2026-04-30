import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@tdt/db";
import { redirect } from "next/navigation";
import { isOrganizer } from "@/lib/tournament-auth";
import { NuevoTorneoForm } from "@/components/ui/NuevoTorneoForm";

export default async function NuevoTorneoPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user || !isOrganizer(session.user.role)) redirect("/torneos");

  const reglamentos = await prisma.reglamento.findMany({
    where: {
      OR: [
        { adminId: session.user.id },
        { admin: { role: "ADMIN" } },
      ],
    },
    select: { id: true, nombre: true },
    orderBy: { nombre: "asc" },
  });

  return (
    <div className="max-w-4xl">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Nuevo torneo</h1>
      <NuevoTorneoForm reglamentos={reglamentos} />
    </div>
  );
}
