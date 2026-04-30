import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { isOrganizer } from "@/lib/tournament-auth";
import { ReglamentoForm } from "@/components/ui/ReglamentoForm";

export default async function NuevoReglamentoPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user || !isOrganizer(session.user.role)) redirect("/torneos");

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold text-gray-900 mb-8">Nuevo reglamento</h1>
      <ReglamentoForm />
    </div>
  );
}
