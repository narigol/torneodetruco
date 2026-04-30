import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { prisma } from "@tdt/db";
import { authOptions } from "@/lib/auth";

type Params = { params: Promise<{ id: string }> };

const schema = z.object({
  status: z.enum(["ACCEPTED", "REJECTED"]),
});

export async function PATCH(req: Request, { params }: Params) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const invitation = await prisma.invitation.findUnique({
    where: { id },
    include: { tournament: { select: { name: true } } },
  });

  if (!invitation) return NextResponse.json({ error: "No encontrado" }, { status: 404 });
  if (invitation.userId !== session.user.id) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }
  if (invitation.status !== "PENDING") {
    return NextResponse.json({ error: "Esta invitación ya fue respondida" }, { status: 400 });
  }

  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });

  const updated = await prisma.invitation.update({
    where: { id },
    data: { status: parsed.data.status },
  });

  if (parsed.data.status === "ACCEPTED") {
    await prisma.tournamentRegistration.upsert({
      where: { tournamentId_userId: { tournamentId: invitation.tournamentId, userId: session.user.id } },
      create: { tournamentId: invitation.tournamentId, userId: session.user.id },
      update: {},
    });
  }

  // Mark the associated notification as read
  await prisma.notification.updateMany({
    where: { invitationId: id, userId: session.user.id },
    data: { read: true },
  });

  return NextResponse.json(updated);
}
