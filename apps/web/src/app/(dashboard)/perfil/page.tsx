import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@tdt/db";
import { notFound } from "next/navigation";
import { PerfilForm } from "@/components/ui/PerfilForm";

export default async function PerfilPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) notFound();

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, name: true, email: true, role: true, plan: true, planExpiresAt: true },
  });
  if (!user) notFound();

  return (
    <div className="max-w-lg">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Mi perfil</h1>
      <PerfilForm
        id={user.id}
        name={user.name}
        email={user.email}
        role={user.role}
        plan={user.plan}
        planExpiresAt={user.planExpiresAt?.toISOString() ?? null}
      />
    </div>
  );
}
