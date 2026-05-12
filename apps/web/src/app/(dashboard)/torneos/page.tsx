import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@tdt/db";
import { TorneosFilter } from "@/components/ui/TorneosFilter";

export default async function TorneosPage() {
  const session = await getServerSession(authOptions);
  const isSuperAdmin = session?.user?.role === "ADMIN";
  const userId = session?.user?.id;

  const torneos = await prisma.tournament.findMany({
    orderBy: { createdAt: "desc" },
    where: isSuperAdmin
      ? undefined
      : { OR: [{ status: { not: "DRAFT" } }, ...(userId ? [{ adminId: userId }] : [])] },
    include: {
      admin: { select: { id: true, name: true } },
      _count: { select: { teams: true, matches: true } },
    },
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Torneos</h1>
          <p className="text-gray-400 text-sm mt-0.5">
            {torneos.length} torneo{torneos.length !== 1 ? "s" : ""}
          </p>
        </div>
      </div>

      <TorneosFilter torneos={torneos} />
    </div>
  );
}
