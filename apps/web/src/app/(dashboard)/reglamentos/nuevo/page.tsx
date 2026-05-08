import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@tdt/db";
import { redirect } from "next/navigation";
import { isOrganizer, isSuperAdmin } from "@/lib/tournament-auth";
import { ReglamentoForm } from "@/components/ui/ReglamentoForm";

export default async function NuevoReglamentoPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user || !isOrganizer(session.user.role)) redirect("/torneos");

  const isAdminUser = isSuperAdmin(session.user.role);

  const articulos = await prisma.articulo.findMany({
    where: {
      OR: [
        { adminId: session.user.id },
        { admin: { role: "ADMIN" } },
      ],
    },
    include: { admin: { select: { id: true, role: true } } },
    orderBy: [{ admin: { role: "asc" } }, { orden: "asc" }],
  });

  return (
    <div className="w-full">
      <h1 className="text-2xl font-bold text-gray-900 mb-8">Nuevo reglamento</h1>
      <ReglamentoForm articulos={articulos} isAdminUser={isAdminUser} />
    </div>
  );
}
