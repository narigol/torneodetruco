import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { NuevoTorneoForm } from "@/components/ui/NuevoTorneoForm";

export default async function NuevoTorneoPage() {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== "ADMIN") redirect("/torneos");

  return (
    <div className="max-w-xl">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Nuevo torneo</h1>
      <NuevoTorneoForm />
    </div>
  );
}
