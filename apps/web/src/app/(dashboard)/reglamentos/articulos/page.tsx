import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@tdt/db";
import { redirect } from "next/navigation";
import { isOrganizer } from "@/lib/tournament-auth";
import { ArticulosClient } from "@/components/ui/ArticulosClient";
import Link from "next/link";
import { compareArticlesBySectionAndOrder } from "@/lib/reglamento-sections";

export default async function ArticulosPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user || !isOrganizer(session.user.role)) redirect("/torneos");

  const articulos = await prisma.articulo.findMany({
    where: { adminId: session.user.id },
    orderBy: { orden: "asc" },
  });

  articulos.sort(compareArticlesBySectionAndOrder);

  return (
    <div className="max-w-2xl">
      <div className="flex items-center gap-2 mb-1">
        <Link href="/reglamentos" className="text-sm text-gray-400 hover:text-gray-700 transition-colors">
          Reglamentos
        </Link>
        <span className="text-gray-300">/</span>
        <span className="text-sm text-gray-600">Artículos</span>
      </div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Biblioteca de artículos</h1>
          <p className="text-gray-500 text-sm mt-1">
            Artículos disponibles para tus reglamentos
          </p>
        </div>
      </div>

      <ArticulosClient articulos={articulos} />
    </div>
  );
}
