import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@tdt/db";
import { redirect, notFound } from "next/navigation";
import { isOrganizer, isSuperAdmin } from "@/lib/tournament-auth";
import { ReglamentoForm } from "@/components/ui/ReglamentoForm";

export default async function EditarReglamentoPage({ params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user || !isOrganizer(session.user.role)) redirect("/torneos");

  const reglamento = await prisma.reglamento.findUnique({ where: { id: params.id } });
  if (!reglamento) notFound();

  if (!isSuperAdmin(session.user.role) && reglamento.adminId !== session.user.id) {
    redirect("/reglamentos");
  }

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold text-gray-900 mb-8">Editar reglamento</h1>
      <ReglamentoForm reglamento={reglamento} />
    </div>
  );
}
