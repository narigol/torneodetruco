import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@tdt/db";
import { redirect } from "next/navigation";
import Link from "next/link";
import { isOrganizer, isSuperAdmin } from "@/lib/tournament-auth";
import { ReglamentosClient } from "@/components/ui/ReglamentosClient";

export default async function ReglamentosPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user || !isOrganizer(session.user.role)) redirect("/torneos");

  const isAdmin = isSuperAdmin(session.user.role);

  const reglamentos = await prisma.reglamento.findMany({
    where: {
      OR: [
        { adminId: session.user.id },
        { admin: { role: "ADMIN" } },
      ],
    },
    include: {
      admin: { select: { id: true, name: true } },
      torneos: { select: { id: true, name: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Reglamentos</h1>
          <p className="text-gray-500 text-sm mt-1">
            {reglamentos.length} reglamento{reglamentos.length !== 1 ? "s" : ""}
          </p>
        </div>
        <Link
          href="/reglamentos/nuevo"
          className="bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-red-700 transition-colors"
        >
          + Nuevo reglamento
        </Link>
      </div>

      <ReglamentosClient
        reglamentos={reglamentos}
        currentUserId={session.user.id}
        isAdmin={isAdmin}
      />
    </div>
  );
}
