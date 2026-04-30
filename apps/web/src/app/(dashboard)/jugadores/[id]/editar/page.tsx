import { notFound, redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@tdt/db";
import { JugadorForm } from "@/components/ui/JugadorForm";

type Params = { params: Promise<{ id: string }> };

export default async function EditarJugadorPage({ params }: Params) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== "ADMIN") redirect("/jugadores");

  const jugador = await prisma.player.findUnique({ where: { id } });
  if (!jugador) notFound();

  return (
    <div className="max-w-lg">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Editar jugador</h1>
      <JugadorForm
        initial={{
          id: jugador.id,
          name: jugador.name,
          email: jugador.email,
          dni: jugador.dni,
          phone: jugador.phone,
          locality: jugador.locality,
          provincia: jugador.provincia,
        }}
      />
    </div>
  );
}
