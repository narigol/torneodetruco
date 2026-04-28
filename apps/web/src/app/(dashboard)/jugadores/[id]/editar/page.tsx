import { notFound, redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@tdt/db";
import { JugadorForm } from "@/components/ui/JugadorForm";

type Params = { params: { id: string } };

export default async function EditarJugadorPage({ params }: Params) {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== "ADMIN") redirect("/jugadores");

  const jugador = await prisma.player.findUnique({ where: { id: params.id } });
  if (!jugador) notFound();

  return (
    <div className="max-w-md">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Editar jugador</h1>
      <JugadorForm initial={{ id: jugador.id, name: jugador.name }} />
    </div>
  );
}
