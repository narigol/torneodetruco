import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@tdt/db";

type Params = { params: Promise<{ userId: string }> };

export async function GET(_req: Request, { params }: Params) {
  const { userId } = await params;
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ following: false });

  const follow = await prisma.follow.findUnique({
    where: { followerId_followingId: { followerId: session.user.id, followingId: userId } },
  });

  return NextResponse.json({ following: !!follow });
}

export async function POST(_req: Request, { params }: Params) {
  const { userId } = await params;
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  if (session.user.id === userId) {
    return NextResponse.json({ error: "No podés seguirte a vos mismo" }, { status: 400 });
  }

  const target = await prisma.user.findUnique({ where: { id: userId }, select: { id: true } });
  if (!target) return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });

  await prisma.follow.upsert({
    where: { followerId_followingId: { followerId: session.user.id, followingId: userId } },
    create: { followerId: session.user.id, followingId: userId },
    update: {},
  });

  return NextResponse.json({ following: true });
}

export async function DELETE(_req: Request, { params }: Params) {
  const { userId } = await params;
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  await prisma.follow.deleteMany({
    where: { followerId: session.user.id, followingId: userId },
  });

  return NextResponse.json({ following: false });
}
