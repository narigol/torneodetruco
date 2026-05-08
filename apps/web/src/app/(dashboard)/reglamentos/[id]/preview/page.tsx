import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@tdt/db";
import { redirect, notFound } from "next/navigation";
import { isOrganizer, isSuperAdmin } from "@/lib/tournament-auth";
import { ReglamentoPreviewClient } from "@/components/ui/ReglamentoPreviewClient";

export default async function PreviewReglamentoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");

  const canOrganize = isOrganizer(session.user.role);
  const isAdminUser = isSuperAdmin(session.user.role);

  const reglamento = await prisma.reglamento.findUnique({
    where: { id },
    include: {
      admin: { select: { name: true } },
      articulos: {
        where: { visible: true },
        include: {
          articulo: {
            select: { titulo: true, contenido: true, seccion: true, orden: true },
          },
        },
        orderBy: { articulo: { orden: "asc" } },
      },
    },
  });

  if (!reglamento) notFound();
  if (!reglamento.isPublic && !isAdminUser && reglamento.adminId !== session.user.id) {
    redirect("/reglamentos");
  }

  return (
    <ReglamentoPreviewClient
      reglamento={{
        id: reglamento.id,
        nombre: reglamento.nombre,
        descripcion: reglamento.descripcion,
        adminName: reglamento.admin.name,
        createdAt: reglamento.createdAt.toISOString(),
        articulos: reglamento.articulos.map((ra) => ({
          articuloId: ra.articuloId,
          titulo: ra.articulo.titulo,
          seccion: ra.articulo.seccion,
          contenido: ra.contenidoOverride ?? ra.articulo.contenido,
        })),
      }}
    />
  );
}
