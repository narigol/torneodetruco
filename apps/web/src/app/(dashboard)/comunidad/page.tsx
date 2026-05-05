import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@tdt/db";
import Link from "next/link";
import { FollowButton } from "@/components/ui/FollowButton";

type Props = { searchParams: Promise<{ tab?: string }> };

export default async function ComunidadPage({ searchParams }: Props) {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");

  const { tab } = await searchParams;
  const activeTab = tab === "seguidores" ? "seguidores" : "siguiendo";

  const data = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      following: {
        orderBy: { createdAt: "desc" },
        select: {
          following: { select: { id: true, name: true, locality: true, province: true, role: true } },
        },
      },
      followers: {
        orderBy: { createdAt: "desc" },
        select: {
          follower: { select: { id: true, name: true, locality: true, province: true, role: true } },
        },
      },
    },
  });

  const following = data?.following.map((f: { following: { id: string; name: string; locality: string | null; province: string | null; role: string } }) => f.following) ?? [];
  const followers = data?.followers.map((f: { follower: { id: string; name: string; locality: string | null; province: string | null; role: string } }) => f.follower) ?? [];

  const tabs = [
    { key: "siguiendo", label: `Seguís a`, count: following.length },
    { key: "seguidores", label: `Te siguen`, count: followers.length },
  ];

  return (
    <div className="max-w-2xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Comunidad</h1>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-white border border-gray-100 rounded-xl p-1 w-fit">
        {tabs.map((t) => {
          const isActive = t.key === activeTab;
          return (
            <Link
              key={t.key}
              href={`/comunidad?tab=${t.key}`}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-all flex items-center gap-2 ${
                isActive
                  ? "bg-red-600 text-white shadow-sm"
                  : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
              }`}
            >
              {t.label}
              <span className={`text-xs px-1.5 py-0.5 rounded-full font-semibold ${
                isActive ? "bg-red-500 text-white" : "bg-gray-100 text-gray-500"
              }`}>
                {t.count}
              </span>
            </Link>
          );
        })}
      </div>

      {/* Contenido */}
      {activeTab === "siguiendo" && (
        following.length === 0 ? (
          <p className="text-sm text-gray-400 bg-white border border-gray-100 rounded-xl px-5 py-6">
            No seguís a nadie todavía. Podés seguir jugadores desde su perfil.
          </p>
        ) : (
          <div className="bg-white border border-gray-100 rounded-xl divide-y divide-gray-50">
            {following.map((u) => (
              <UserRow key={u.id} user={u} currentUserId={session.user.id} />
            ))}
          </div>
        )
      )}

      {activeTab === "seguidores" && (
        followers.length === 0 ? (
          <p className="text-sm text-gray-400 bg-white border border-gray-100 rounded-xl px-5 py-6">
            Todavía nadie te sigue.
          </p>
        ) : (
          <div className="bg-white border border-gray-100 rounded-xl divide-y divide-gray-50">
            {followers.map((u) => (
              <UserRow key={u.id} user={u} currentUserId={session.user.id} />
            ))}
          </div>
        )
      )}
    </div>
  );
}

function roleLabel(role: string) {
  if (role === "ADMIN") return "Super Admin";
  if (role === "ORGANIZER") return "Organizador";
  return "Jugador";
}

function UserRow({
  user,
  currentUserId,
}: {
  user: { id: string; name: string; locality: string | null; province: string | null; role: string };
  currentUserId: string;
}) {
  const initials = user.name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();
  return (
    <div className="flex items-center gap-3 px-5 py-3">
      <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center shrink-0">
        <span className="text-red-700 text-xs font-bold">{initials}</span>
      </div>
      <div className="flex-1 min-w-0">
        <Link href={`/usuarios/${user.id}`} className="text-sm font-medium text-gray-900 hover:text-red-600 transition-colors">
          {user.name}
        </Link>
        <p className="text-xs text-gray-400">
          {roleLabel(user.role)}
          {(user.locality || user.province) && ` · ${[user.locality, user.province].filter(Boolean).join(", ")}`}
        </p>
      </div>
      {user.id !== currentUserId && (
        <FollowButton organizerId={user.id} organizerName={user.name} />
      )}
    </div>
  );
}
