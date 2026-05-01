import { notFound, redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@tdt/db";
import { isSuperAdmin } from "@/lib/tournament-auth";
import { EditarUsuarioForm } from "@/components/ui/EditarUsuarioForm";
import Link from "next/link";

type Props = { params: Promise<{ id: string }> };

export default async function EditarUsuarioPage({ params }: Props) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  if (!isSuperAdmin(session?.user?.role ?? "")) redirect("/usuarios");

  const usuario = await prisma.user.findUnique({
    where: { id },
    select: { id: true, name: true, email: true, dni: true, phone: true, locality: true, province: true, role: true },
  });
  if (!usuario) notFound();

  return (
    <div className="max-w-lg">
      <div className="mb-6">
        <Link href={`/usuarios/${id}`} className="text-sm text-gray-400 hover:text-gray-600 transition-colors">
          ← {usuario.name}
        </Link>
      </div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Editar usuario</h1>
      <EditarUsuarioForm usuario={usuario} />
    </div>
  );
}
