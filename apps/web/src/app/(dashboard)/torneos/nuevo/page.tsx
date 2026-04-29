import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { NuevoTorneoForm } from "@/components/ui/NuevoTorneoForm";

export default async function NuevoTorneoPage() {
  await getServerSession(authOptions); // protegido en layout

  return (
    <div className="max-w-4xl">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Nuevo torneo</h1>
      <NuevoTorneoForm />
    </div>
  );
}
