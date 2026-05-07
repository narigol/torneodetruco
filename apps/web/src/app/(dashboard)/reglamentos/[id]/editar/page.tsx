import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@tdt/db";
import { redirect, notFound } from "next/navigation";
import { isOrganizer, isSuperAdmin } from "@/lib/tournament-auth";
import { ReglamentoForm } from "@/components/ui/ReglamentoForm";

export default async function EditarReglamentoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  if (!session?.user || !isOrganizer(session.user.role)) redirect("/torneos");

  const isAdminUser = isSuperAdmin(session.user.role);

  const [reglamento, articulos] = await Promise.all([
    prisma.reglamento.findUnique({
      where: { id },
      include: {
        articulos: {
          select: {
            articuloId: true,
            visible: true,
            contenidoOverride: true,
          },
        },
      },
    }),
    prisma.articulo.findMany({
      where: {
        OR: [
          { adminId: session.user.id },
          { admin: { role: "ADMIN" } },
        ],
      },
      include: { admin: { select: { id: true, role: true } } },
      orderBy: [{ admin: { role: "asc" } }, { orden: "asc" }],
    }),
  ]);

  if (!reglamento) notFound();

  if (!isAdminUser && reglamento.adminId !== session.user.id) {
    redirect("/reglamentos");
  }

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold text-gray-900 mb-8">Editar reglamento</h1>
      <ReglamentoForm reglamento={reglamento} articulos={articulos} isAdminUser={isAdminUser} />
    </div>
  );
}
