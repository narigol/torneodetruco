import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { JugadorForm } from "@/components/ui/JugadorForm";

export default async function NuevoJugadorPage() {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== "ADMIN") redirect("/jugadores");

  return (
    <div className="max-w-md">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Nuevo jugador</h1>
      <JugadorForm />
    </div>
  );
}
