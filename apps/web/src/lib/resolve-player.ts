export type RawPlayer = {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  locality: string | null;
  provincia: string | null;
  dni?: string | null;
  userId: string | null;
  user?: {
    email: string | null;
    phone: string | null;
    locality: string | null;
    province: string | null;
    dni?: string | null;
  } | null;
};

export function resolveContact(player: RawPlayer) {
  const u = player.user;
  return {
    id: player.id,
    name: player.name,
    userId: player.userId,
    email: u?.email ?? player.email,
    phone: u?.phone ?? player.phone,
    locality: u?.locality ?? player.locality,
    provincia: u?.province ?? player.provincia,
    dni: u?.dni ?? player.dni ?? null,
  };
}
