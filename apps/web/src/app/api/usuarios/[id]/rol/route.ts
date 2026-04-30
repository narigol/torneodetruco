import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@tdt/db";
import { z } from "zod";
import { isSuperAdmin } from "@/lib/tournament-auth";

type Params = { params: Promise<{ id: string }> };

const schema = z.object({
  role: z.enum(["ORGANIZER", "PLAYER"]),
});

export async function PATCH(req: Request, { params }: Params) {
  const { id } = await params;
  const session = await getServerSession(authOptions);

  if (!isSuperAdmin(session?.user?.role ?? "")) {
    return NextResponse.json({ error: "Solo el administrador puede cambiar roles" }, { status: 403 });
  }

  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Rol inválido" }, { status: 400 });
  }

  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });
  if (user.role === "ADMIN") return NextResponse.json({ error: "No se puede modificar el rol del super administrador" }, { status: 400 });

  const updated = await prisma.user.update({
    where: { id },
    data: { role: parsed.data.role },
    select: { id: true, role: true },
  });

  return NextResponse.json(updated);
}
